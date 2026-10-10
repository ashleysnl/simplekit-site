// Optional Phase 4 acceptance: real generated pages, isolated Playwright, loopback only.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = new URL(process.env.SIMPLEKIT_PREVIEW_URL || 'http://127.0.0.1:8001').origin;
require('./v2-preview-origin.cjs')(origin);
const output = process.env.SIMPLEKIT_EVIDENCE_DIR || '/tmp/simplekit-v2-trust';
fs.mkdirSync(output,{recursive:true});
const titles = ['No signup','Local calculations','Built for Canadians'];
const errors = [], layouts = [];
async function makeContext(browser,options={}) {
  const c = await browser.newContext({viewport:{width:390,height:1000},locale:'en-CA',...options});
  c.setDefaultTimeout(5000); c.setDefaultNavigationTimeout(10000);
  await c.route('**/*',r=>new URL(r.request().url()).origin===origin ? r.continue() : r.fulfill({body:'',contentType:'text/javascript'}));
  c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  return c;
}
async function readable(p,state) {
  assert.deepEqual(await p.locator('.v2-trust-title').allTextContents(),titles);
  const result = await p.locator('.v2-home-trust').evaluate(section=>{
    const rect=n=>n.getBoundingClientRect().toJSON();
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,section:rect(section),
      items:[...section.querySelectorAll('li')].map(n=>({rect:rect(n),title:rect(n.querySelector('.v2-trust-title')),detail:rect(n.querySelector('.v2-trust-detail')),icon:rect(n.querySelector('.v2-icon-disc')),overflow:n.scrollWidth>n.clientWidth+1})),
      links:[...document.querySelectorAll('.v2-trust-note a')].map(n=>({href:n.href,rect:rect(n)}))};
  });
  assert(result.scrollWidth<=result.width,`${state}: horizontal overflow`);
  for(const item of result.items) {
    assert(!item.overflow,`${state}: item clipped`);
    assert(item.icon.right<=item.title.left,`${state}: icon overlaps text`);
    assert(item.title.bottom<=item.detail.top+.5,`${state}: title overlaps detail`);
    assert(item.title.right<=result.width+1 && item.detail.right<=result.width+1,`${state}: clipped text`);
    assert(item.title.height>0 && item.detail.height>0,`${state}: hidden meaning`);
  }
  assert.deepEqual(result.links.map(l=>l.href),[origin+'/privacy/',origin+'/methodology/']);
  assert(result.links.every(l=>l.rect.height>=44),`${state}: small link target`);
  layouts.push({state,...result});
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined,args:['--no-sandbox']});
  try {
    for(const width of [320,375,390,768,1440,1920]) {
      const c=await makeContext(browser,{viewport:{width,height:1200}}),p=await c.newPage();
      await p.goto(origin,{waitUntil:'networkidle'}); await p.evaluate(()=>document.fonts.ready);
      await readable(p,`width-${width}`);
      await p.locator('.v2-home-trust').screenshot({path:path.join(output,`trust-${width}.jpg`),type:'jpeg',quality:85});
      if([390,1440].includes(width)) await p.screenshot({path:path.join(output,`homepage-${width}.jpg`),type:'jpeg',quality:85,fullPage:false});
      await c.close();
      console.log(`Readable trust strip at ${width}px`);
    }
    const c=await makeContext(browser,{viewport:{width:1440,height:1200}}),p=await c.newPage();
    await p.goto(origin,{waitUntil:'networkidle'});
    await p.evaluate(()=>document.documentElement.style.zoom='2');
    await readable(p,'CSS zoom 200% at 1440');
    await p.locator('.v2-home-trust').screenshot({path:path.join(output,'trust-css-zoom-200.jpg'),type:'jpeg',quality:85});
    await p.evaluate(()=>document.documentElement.style.zoom='');
    await p.setViewportSize({width:320,height:1200});
    await p.evaluate(()=>document.documentElement.style.fontSize='200%');
    await readable(p,'text size 200% at 320');
    console.log('CSS magnification and 200% text passed');
    await p.setViewportSize({width:320,height:3000});
    await p.locator('.v2-home-trust').screenshot({path:path.join(output,'trust-text-200-320.jpg'),type:'jpeg',quality:85,timeout:5000});
    console.log('200% text screenshot saved');
    await p.evaluate(()=>document.documentElement.style.fontSize='');
    await p.locator('.v2-trust-note a').first().focus();
    await p.keyboard.press('Tab'); assert(await p.getByRole('link',{name:'Methodology & sources',exact:true}).first().evaluate(n=>n===document.activeElement));
    console.log('Privacy/methodology keyboard sequence passed');
    await p.keyboard.press('Enter'); await p.waitForURL(origin+'/methodology/');
    assert(await p.getByRole('heading',{name:'How SimpleKit turns assumptions into planning estimates.'}).isVisible());
    console.log('Methodology navigation passed');
    await p.goto(origin,{waitUntil:'networkidle'});
    await p.getByRole('link',{name:'Privacy details',exact:true}).click(); await p.waitForURL(origin+'/privacy/');
    assert(await p.getByRole('heading',{name:'Analytics',exact:true}).isVisible());
    console.log('Privacy navigation passed');
    await p.goto(origin,{waitUntil:'networkidle'});
    const requests=[];c.on('request',r=>requests.push({url:r.url(),postData:r.postData()}));
    const before=await p.evaluate(()=>JSON.stringify(window.dataLayer));
    for(const query of ['phase4_private_search_843719','Can I retire at 55?','mortgage 843719','budget']) await p.locator('#tool-search').fill(query);
    await p.keyboard.press('Escape'); await p.waitForTimeout(700);
    assert.deepEqual(requests,[],'Search issued a request');
    assert.equal(await p.evaluate(()=>JSON.stringify(window.dataLayer)),before,'Search changed analytics');
    assert.deepEqual(await p.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage),query:location.search})),{local:[],session:[],query:''});
    await c.close();
    console.log('Private search checks passed');
    const fallback=await makeContext(browser,{javaScriptEnabled:false,forcedColors:'active'}),fp=await fallback.newPage();
    await fp.goto(origin,{waitUntil:'networkidle'});
    // Avoid an injected stylesheet's load callback: callbacks are disabled in this context.
    await fp.evaluate(()=>document.querySelectorAll('.v2-home-trust svg').forEach(svg=>svg.style.display='none'));
    await readable(fp,'no JavaScript; hidden icons; forced colors');
    assert.equal(await fp.locator('[data-v2-questions] a').count(),4);
    await fp.locator('.v2-home-trust').screenshot({path:path.join(output,'trust-nojs-forced-colors.jpg'),type:'jpeg',quality:85});
    await fallback.close();
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(output,'trust-browser.json'),JSON.stringify({browser:browser.version(),layouts,pageErrors:errors,search:{queries:4,requests:[],analyticsChanged:false,storageChanged:false},onboarding:'Not implemented until Phase 7; no onboarding choices exist to submit.',zoom:'CSS 200%, text 200% at 320, viewport reflow. Actual browser-toolbar zoom remains a manual Phase 8 check.'},null,2)+'\n');
    console.log(`${layouts.length} layout/fallback checks; privacy/methodology keyboard links and 4 private searches passed.`);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
