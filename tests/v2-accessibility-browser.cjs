// Test-only Playwright + axe; never published or installed as site dependencies.
const {chromium, firefox, webkit} = require('playwright');
const axe = require('axe-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = require('./v2-preview-origin.cjs')(process.env.SIMPLEKIT_PREVIEW_URL || 'http://127.0.0.1:8003');
const output = process.env.SIMPLEKIT_EVIDENCE_DIR || '/tmp/simplekit-phase8-accessibility';
fs.mkdirSync(output, {recursive:true});
const requested = (process.env.SIMPLEKIT_BROWSER_ENGINES || 'chromium').split(',');
const report = {axeVersion:axe.version,engines:[],toolPages:[],limitations:[
  'Chromium/Firefox/WebKit automation is not real Chrome/Safari/Firefox device or screen-reader coverage.',
  '320 CSS px models 1280px at 400% zoom; native browser toolbar zoom is not exercised.',
  'Analytics requests are stubbed; no change is made to website analytics.',
  'VoiceOver/Safari, a second real screen-reader/browser combination and real iPhone/Android require manual review.'
]};
async function context(browser, options = {}, blocked = false) {
  const c = await browser.newContext({viewport:{width:390,height:844}, reducedMotion:'reduce',...options});
  c.setDefaultTimeout(10000);
  await c.route('**/*', r => {
    const u = new URL(r.request().url());
    if(u.origin !== origin) { assert.equal(u.hostname,'www.googletagmanager.com');return r.fulfill({body:'',contentType:'text/javascript'}); }
    if(blocked && /\.(woff2?|avif|webp|jpg|svg)$/.test(u.pathname)) return r.abort();
    return r.continue();
  });
  return c;
}
async function geometry(p, name) {
  const result = await p.evaluate(() => {
    const visible = n => n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden';
    const labelledRadio = n => n.matches('input[type=radio]') ? n.closest('label') : n;
    const controls = [...document.querySelectorAll('a,button,input,select,textarea')].filter(visible).map(labelledRadio);
    const targets = controls.map(n=>{
      const walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),glyphs=[];
      while(walker.nextNode())if(walker.currentNode.textContent.trim()){
        const range=document.createRange();range.selectNodeContents(walker.currentNode);glyphs.push(...[...range.getClientRects()].map(r=>r.toJSON()));
      }
      return {name:n.getAttribute('aria-label')||n.textContent.trim()||n.id,rect:n.getBoundingClientRect().toJSON(),glyphs};
    });
    const overflow = [];
    // Inspect actual glyphs as well as containers: clipping with overflow:hidden
    // must not make an otherwise unreadable page look like successful reflow.
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) {
      const n=walker.currentNode, parent=n.parentElement;
      if(!n.textContent.trim() || !visible(parent) || parent.closest('script,style,.sr-only,.v2-visually-hidden'))continue;
      const r=document.createRange();r.selectNodeContents(n);
      for(const rect of r.getClientRects()) if(rect.left < -1 || rect.right > innerWidth+1)
        overflow.push({text:n.textContent.trim().slice(0,100),rect:rect.toJSON()});
    }
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,targets,overflow};
  });
  assert(result.scrollWidth<=result.width,`${name}: document overflow`);
  assert.deepEqual(result.overflow,[],`${name}: clipped text glyphs`);
  for(const t of result.targets) {
    assert(t.rect.width>=43.9&&t.rect.height>=43.9,`${name}: small target ${t.name} ${t.rect.width}x${t.rect.height}`);
    for(const g of t.glyphs)assert(g.left>=t.rect.left-.75&&g.right<=t.rect.right+.75&&g.top>=t.rect.top-.75&&g.bottom<=t.rect.bottom+.75,`${name}: clipped/overlapping control label ${t.name}: ${JSON.stringify({control:t.rect,glyph:g})}`);
  }
  return {name,width:result.width,scrollWidth:result.scrollWidth,controls:result.targets.length};
}
async function audit(p, name, blocking = true) {
  await p.evaluate(axe.source);
  const r=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}));
  const result={name,violations:r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}))};
  if(blocking)assert.deepEqual(result.violations,[],`${name}: automated findings`);
  if(blocking)assert(!result.incomplete.some(v=>v.id==='aria-prohibited-attr'),'Resolve uncertain ARIA naming/role issues rather than accepting them as contrast review');
  return result;
}
async function keyboard(p, directory=false) {
  await p.keyboard.press('Tab');
  const skip=p.getByRole('link',{name:directory?'Skip to tools':'Skip to main content',exact:true});
  assert(await skip.evaluate(n=>n===document.activeElement),'Skip link must be first tab stop');
  assert.equal(await skip.evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
  await skip.press('Enter');
  const target=p.locator(directory?'.content#main-content':'main#main-content');
  assert(await target.evaluate(n=>n===document.activeElement),'Skip destination must receive focus');
  if(directory)return;
  const menu=p.locator('[data-v2-menu-toggle]');await menu.focus();await p.keyboard.press('Enter');
  await p.keyboard.press('Tab');assert(await p.getByRole('link',{name:'Home',exact:true}).evaluate(n=>n===document.activeElement));
  await p.keyboard.press('Escape');assert(await menu.evaluate(n=>n===document.activeElement));
  const input=p.locator('#tool-search');await input.focus();await p.keyboard.type('mortgage');await p.keyboard.press('Tab');
  assert.equal(await p.locator(':focus').getAttribute('aria-label'),'Clear search');await p.keyboard.press('Tab');
  assert(await p.locator(':focus').evaluate(n=>n.matches('.v2-search-result')));
  assert.equal(await p.locator(':focus').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
  await input.fill('');await p.locator('[data-onboarding-start]').focus();await p.keyboard.press('Enter');
  assert(await p.locator('#onboarding-flow-title').evaluate(n=>n===document.activeElement));
  await p.keyboard.press('Tab');assert.equal(await p.locator(':focus').getAttribute('type'),'radio');
  await p.keyboard.press('ArrowDown');assert(await p.locator(':focus').isChecked());
  await p.keyboard.press('Escape');assert(await p.locator('[data-onboarding-start]').evaluate(n=>n===document.activeElement));
}
async function controlContrast(p) {
  const colors=await p.locator('.v2-search-bar').evaluate(n=>{const s=getComputedStyle(n);return {border:s.borderTopColor,background:s.backgroundColor};});
  const luminance=value=>value.match(/[\d.]+/g).slice(0,3).map(v=>Number(v)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const a=luminance(colors.border),b=luminance(colors.background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  assert(ratio>=3,'Search field boundary must retain 3:1 non-text contrast');return {...colors,ratio};
}
async function capture(p, file) {
  const height=await p.evaluate(()=>document.documentElement.scrollHeight);
  // Firefox cannot encode a >32767px screenshot. Keep full-document glyph/
  // target checks; capture a usable viewport and the flow for oversized pages.
  const fullPage=height<=16000;
  await p.screenshot({path:path.join(output,file),type:'jpeg',quality:80,fullPage});
  if(!fullPage && await p.locator('[data-onboarding-flow]:not([hidden])').count())
    await p.locator('[data-onboarding-flow]').screenshot({path:path.join(output,file.replace('.jpg','-flow.jpg')),type:'jpeg',quality:80});
  return {file,documentHeight:height,fullPage};
}
(async()=>{
 try{
 for(const engine of requested){
  assert(['chromium','firefox','webkit'].includes(engine),'Unsupported engine');
  const browser=await ({chromium,firefox,webkit}[engine]).launch({...(engine==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   const e={engine,version:browser.version(),layouts:[],audits:[],captures:[],errors:[],failedResponses:[]};report.engines.push(e);
   console.log(`Phase 8: auditing ${engine} ${e.version}`);
   const c=await context(browser),p=await c.newPage();
   p.on('pageerror',err=>e.errors.push(err.message));p.on('response',r=>{if(r.status()>=400)e.failedResponses.push(r.url());});
   for(const width of [320,375,390,768,1024,1440,1920]) for(const route of ['/','/tools/']) {
    await p.setViewportSize({width,height:844});await p.goto(origin+route,{waitUntil:'networkidle'});
    e.layouts.push(await geometry(p,`${route}-${width}`));
   }
   for(const route of ['/','/tools/']) {
    await p.setViewportSize({width:844,height:390});await p.goto(origin+route,{waitUntil:'networkidle'});
    e.layouts.push(await geometry(p,`${route}-landscape`));
   }
   await p.setViewportSize({width:390,height:844});await p.goto(origin+'/',{waitUntil:'networkidle'});await keyboard(p);
   e.searchBoundaryContrast=await controlContrast(p);
   e.keyboard=true;e.audits.push(await audit(p,'home'));
   await p.locator('[data-v2-menu-toggle]').click();e.audits.push(await audit(p,'menu'));await p.keyboard.press('Escape');
   await p.locator('#tool-search').fill('mortgage');e.audits.push(await audit(p,'search-results'));
   await p.locator('#tool-search').fill('zzzzzzzz');e.audits.push(await audit(p,'search-empty'));await p.locator('#tool-search').fill('');
   await p.locator('[data-onboarding-start]').click();e.audits.push(await audit(p,'onboarding-step'));
   await p.locator('input[value=retirement]').check();await p.locator('[data-onboarding-next]').click();await p.locator('[data-onboarding-next]').click();await p.locator('[data-onboarding-next]').click();
   e.audits.push(await audit(p,'onboarding-results'));
   await p.locator('[data-onboarding-restart]').click();for(let i=0;i<3;i++)await p.locator('[data-onboarding-skip]').click();e.audits.push(await audit(p,'onboarding-empty'));
   await p.locator('[data-onboarding-close]').click();
   for(const route of ['/','/tools/']){
    await p.goto(origin+route,{waitUntil:'networkidle'});if(route==='/tools/')await keyboard(p,true);
    if(route==='/tools/')e.audits.push(await audit(p,'directory'));
    await p.setViewportSize({width:320,height:844});
    await p.addStyleTag({content:'html{font-size:200% !important}'});
    if(route==='/')await p.locator('[data-onboarding-start]').click();
    e.layouts.push(await geometry(p,`${route}-200-percent-text-320`));
    e.captures.push(await capture(p,`${engine}-${route==='/'?'home':'directory'}-text-200.jpg`));
    await p.goto(origin+route,{waitUntil:'networkidle'});
    await p.addStyleTag({content:'*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important}p{margin-bottom:2em !important}'});
    if(route==='/')await p.locator('[data-onboarding-start]').click();
    e.layouts.push(await geometry(p,`${route}-text-spacing-320`));
    await p.goto(origin+route,{waitUntil:'networkidle'});
    await p.evaluate(()=>{for(const n of document.querySelectorAll('.v2-goal-name,.v2-directory-name'))n.textContent+=' — A longer translated planning label for comparison and averylongunbrokenword';});
    e.layouts.push(await geometry(p,`${route}-long-labels-320`));
   }
   await p.goto(origin+'/',{waitUntil:'networkidle'});
   assert(await p.evaluate(()=>[...document.querySelectorAll('*')].every(n=>getComputedStyle(n).transitionDuration.split(',').every(v=>parseFloat(v)===0)&&getComputedStyle(n).animationName==='none')),'Reduced motion must cover retained lower sections too');e.reducedMotion=true;
   e.captures.push(await capture(p,`${engine}-home-320.jpg`));
   await c.close();
   const fallback=await context(browser,{forcedColors:engine==='chromium'?'active':'none'},true);const fp=await fallback.newPage();
   for(const route of ['/','/tools/']){await fp.goto(origin+route,{waitUntil:'networkidle'});e.layouts.push(await geometry(fp,`${route}-blocked-font-image-icons`));}
   await fallback.close();
   const nojs=await context(browser,{javaScriptEnabled:false});const np=await nojs.newPage();
   for(const route of ['/','/tools/']){await np.goto(origin+route,{waitUntil:'networkidle'});e.layouts.push(await geometry(np,`${route}-no-js`));}
   assert.equal(await np.locator('.v2-directory-tool').count(),22);e.noJS=true;await nojs.close();
   if(engine==='chromium'){
    const touch=await context(browser,{hasTouch:true,isMobile:true,viewport:{width:390,height:844}}),tp=await touch.newPage();
    await tp.goto(origin+'/',{waitUntil:'networkidle'});
    await tp.locator('[data-onboarding-start]').tap();await tp.locator('.v2-onboarding-choice').first().tap();
    assert(await tp.locator('.v2-onboarding-choice input').first().isChecked());
    await tp.locator('[data-onboarding-next]').tap();await tp.locator('[data-onboarding-skip]').tap();await tp.locator('[data-onboarding-skip]').tap();
    assert.equal(await tp.locator('[data-onboarding-tool]').count(),1);
    await tp.locator('[data-onboarding-close]').tap();assert(await tp.locator('[data-onboarding-flow]').isHidden());
    e.touchOnboarding=true;await touch.close();
   }
   // Tool findings are recorded separately; copied tool logic/pins are not edited.
   if(engine==='chromium'){
    const tc=await context(browser),tp=await tc.newPage();const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/tools.json')));
    for(const tool of manifest.tools){await tp.goto(origin+tool.canonicalPath,{waitUntil:'networkidle'});report.toolPages.push(await audit(tp,tool.slug,false));}
    await tc.close();
   }
   assert.deepEqual(e.errors,[]);assert.deepEqual(e.failedResponses,[]);
  }finally{await browser.close();}
 }
 console.log(`Phase 8: ${report.engines.length} browser engines, ${report.engines.reduce((n,e)=>n+e.layouts.length,0)} reflow/fallback layouts, all UI axe states and keyboard paths pass; ${report.toolPages.length} unchanged tool pages audited separately.`);
 }finally{fs.writeFileSync(path.join(output,'accessibility-browser.json'),JSON.stringify(report,null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1;});
