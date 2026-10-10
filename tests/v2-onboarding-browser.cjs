// Phase 7: actual guided paths, private ephemeral state and native keyboard UI.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = require('./v2-preview-origin.cjs')(process.env.SIMPLEKIT_PREVIEW_URL || 'http://127.0.0.1:8003');
const output = process.env.SIMPLEKIT_EVIDENCE_DIR || '/tmp/simplekit-v2-onboarding';
const errors = [], failures = [], layouts = [];
const manifest = require('../data/tools.json');
const metadata = require('../data/v2-discovery.json');
const discovery = {tools: manifest.tools.map(t => ({id:t.slug,name:t.name,url:t.canonicalUrl,
  description:metadata.tools.find(m=>m.id===t.slug).description}))};
const start = '[data-onboarding-start]', next = '[data-onboarding-next]', skip = '[data-onboarding-skip]', back = '[data-onboarding-back]';
async function geometry(page, state) {
  const result = await page.locator('[data-v2-onboarding]').evaluate(root => {
    const rect = node => node.getBoundingClientRect().toJSON();
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,section:rect(root),
      controls:[...root.querySelectorAll('button,a,label')].filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').map(n=>{
        const walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),glyphs=[];
        while(walker.nextNode())if(walker.currentNode.textContent.trim()){
          const range=document.createRange();range.selectNodeContents(walker.currentNode);glyphs.push(...[...range.getClientRects()].map(r=>r.toJSON()));
        }
        return {name:n.textContent.trim(),rect:rect(n),glyphs};
      }),
      text:[...root.querySelectorAll('h2,h3,p,.v2-onboarding-choice span')].filter(n=>n.getClientRects().length).map(n=>({text:n.textContent,rect:rect(n)}))};
  });
  assert(result.scrollWidth<=result.width,`${state}: page overflow`);
  for(const c of result.controls) {
    assert(c.rect.width>=44&&c.rect.height>=44,`${state}: small control ${c.name}`);
    for(const g of c.glyphs)assert(g.left>=c.rect.left-.5&&g.right<=c.rect.right+.5&&g.top>=c.rect.top-.5&&g.bottom<=c.rect.bottom+.5,`${state}: clipped control text ${c.name}`);
  }
  for(const t of result.text) assert(t.rect.left>=0&&t.rect.right<=result.width+.5,`${state}: clipped text`);
  layouts.push({state,...result});
}
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const {onboardingGoals,questionsFor,recommendTools} = await import('../assets/v2/onboarding-engine.js');
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
  async function context(options={},mode='normal') {
    const c=await browser.newContext({viewport:{width:390,height:1000},...options});
    await c.route('**/*',route=>{
      const u=new URL(route.request().url());
      if(u.origin!==origin)return route.fulfill({body:'',contentType:'text/javascript'});
      if(mode==='failed-module'&&u.pathname.endsWith('/v2/onboarding.js'))return route.abort();
      if(mode==='blocked-assets'&&/\.(woff|svg)$/.test(u.pathname))return route.abort();
      return route.continue();
    });
    c.on('page',p=>{
      p.on('pageerror',e=>errors.push(e.message));
      p.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
      if(mode==='normal')p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    });
    return c;
  }
  try {
    const c=await context(),p=await c.newPage();await p.goto(origin,{waitUntil:'networkidle'});
    const privateState=()=>p.evaluate(()=>({local:{...localStorage},session:{...sessionStorage},analytics:JSON.stringify(window.dataLayer||[]),url:location.href}));
    const before=await privateState(),requests=[];
    c.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));
    let paths=0;
    for(const goal of [null,...onboardingGoals.map(g=>g.id)]) for(const need of [null,...questionsFor(goal).map(n=>n.id)]) for(const detail of [null,'focused','related']) {
      await p.locator(start).click();
      for(const [key,value] of [['goal',goal],['need',need],['detail',detail]]) {
        if(value){await p.locator(`input[name="onboarding-${key}"][value="${value}"]`).check();await p.locator(next).click();}
        else await p.locator(skip).click();
      }
      const expected=recommendTools({goal,need,detail},discovery).map(r=>r.tool.id);
      const actual=await p.locator('[data-onboarding-tool]').evaluateAll(nodes=>nodes.map(n=>n.dataset.onboardingTool));
      assert.deepEqual(actual,expected,JSON.stringify({goal,need,detail}));
      for(const node of await p.locator('[data-onboarding-tool]').all()) {
        const id=await node.getAttribute('data-onboarding-tool');
        assert.equal(await node.getAttribute('href'),manifest.tools.find(t=>t.slug===id).canonicalUrl);
      }
      assert.equal(await p.locator('[data-onboarding-next]:visible').count(),0);
      await p.locator('[data-onboarding-close]').click();
      assert(await p.locator(start).evaluate(n=>n===document.activeElement));paths++;
    }
    assert.equal(paths,93);assert.deepEqual(await privateState(),before);assert.deepEqual(requests,[],'Choices sent a request');
    // Change earlier choices, then verify back/restart/close clear stale state.
    await p.locator(start).click();await p.locator('[value="home"]').check();await p.locator(next).click();
    await p.locator('[value="rent-buy"]').check();await p.locator(next).click();await p.locator(back).click();
    assert(await p.locator('[value="rent-buy"]').isChecked());await p.locator(back).click();
    await p.locator('[value="budget"]').check();await p.locator(next).click();assert.equal(await p.locator('input:checked').count(),0);
    await p.locator('[value="pay-debt"]').check();await p.locator(next).click();await p.locator('[value="related"]').check();await p.locator(next).click();
    assert.deepEqual(await p.locator('[data-onboarding-tool]').evaluateAll(nodes=>nodes.map(n=>n.dataset.onboardingTool)),['debt-payoff-calculator','credit-card-interest-calculator']);
    await p.locator(back).click();assert(await p.locator('[value="related"]').isChecked());
    await p.locator('[data-onboarding-restart]').click();assert.equal(await p.locator('input:checked').count(),0);
    assert.match(await p.locator('[data-onboarding-status]').textContent(),/Step 1 of 3/);
    // Native radio keyboard behavior and heading/legend names in Chromium AX.
    await p.keyboard.press('Tab');assert.equal(await p.locator(':focus').getAttribute('name'),'onboarding-goal');
    await p.keyboard.press('ArrowDown');assert(await p.locator('[value="home"]').isChecked());
    await p.locator(next).focus();await p.keyboard.press('Enter');
    assert.equal(await p.locator(':focus').getAttribute('id'),'onboarding-flow-title');
    const ax=await c.newCDPSession(p),tree=await ax.send('Accessibility.getFullAXTree');await ax.detach();
    assert(tree.nodes.some(n=>!n.ignored&&n.role?.value==='heading'&&n.name?.value==='What would you like to explore first?'));
    assert(tree.nodes.some(n=>!n.ignored&&n.role?.value==='radio'&&n.name?.value==='Compare renting and buying'));
    await p.keyboard.press('Escape');assert(await p.locator(start).evaluate(n=>n===document.activeElement));
    assert.equal(await p.locator('[data-onboarding-content] input').count(),0);assert.equal(await p.locator('[data-onboarding-flow]').isVisible(),false);
    assert.deepEqual(await privateState(),before);assert.deepEqual(requests,[]);
    await c.close();
    for(const width of [320,375,390,768,1440,1920]) {
      const c=await context({viewport:{width,height:1000}}),p=await c.newPage();await p.goto(origin,{waitUntil:'networkidle'});
      await geometry(p,`closed-${width}`);await p.locator('[data-v2-onboarding]').screenshot({path:path.join(output,`panel-${width}.jpg`),type:'jpeg',quality:88});
      await p.locator(start).click();await geometry(p,`open-${width}`);
      if(width===390)await p.locator('[data-v2-onboarding]').screenshot({path:path.join(output,'flow-390.jpg'),type:'jpeg',quality:88});
      await p.locator(skip).click();await p.locator(skip).click();await p.locator(skip).click();await geometry(p,`results-${width}`);
      await c.close();
    }
    for(const mode of ['no-js','failed-module','blocked-assets','forced-colors','text-200']) {
      const c=await context({javaScriptEnabled:mode!=='no-js',...(mode==='forced-colors'?{forcedColors:'active'}:{})},mode),p=await c.newPage();
      await p.goto(origin,{waitUntil:'networkidle'});
      if(['no-js','failed-module'].includes(mode)) {
        assert.equal(await p.locator(start).isVisible(),false);assert(await p.locator('[data-onboarding-fallback]').isVisible());
        await p.locator('[data-onboarding-fallback]').click();await p.waitForURL(origin+'/tools/');assert.equal(await p.locator('.v2-directory-tool').count(),22);
      } else {
        if(mode==='text-200'){await p.setViewportSize({width:320,height:1000});await p.evaluate(()=>document.documentElement.style.fontSize='200%');}
        await p.locator(start).click();await geometry(p,mode);await p.locator(skip).click();await p.locator(skip).click();await p.locator(skip).click();await geometry(p,mode+'-results');
      }
      await c.close();
    }
    const nav=await context(),n=await nav.newPage();await n.goto(origin,{waitUntil:'networkidle'});
    await n.locator(start).click();await n.locator('[value="retirement"]').check();await n.locator(next).click();await n.locator(skip).click();await n.locator(skip).click();
    await nav.route('https://simplekit.app/**',r=>r.fulfill({body:'<title>Verified destination</title>',contentType:'text/html'}));
    await n.locator('[data-onboarding-tool="retirement-planner"]').focus();await n.keyboard.press('Enter');await n.waitForURL('https://simplekit.app/retirement-planner/');await nav.close();
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
    fs.writeFileSync(path.join(output,'onboarding-browser.json'),JSON.stringify({browser:browser.version(),paths,layouts,
      backRestartClose:true,keyboardAX:true,noAnswerRequests:true,noStorageOrAnalyticsChanges:true,noJSAndFailedModuleFallback:true,canonicalActivation:true,
      pageErrors:errors,failedResponses:failures,limitations:'Inline nonmodal flow; Chromium AX/keyboard, CSS text enlargement and emulated viewports. Manual screen readers, real devices and native toolbar zoom remain Phase 8.'},null,2)+'\n');
    console.log('Phase 7: all 93 browser answer/skip paths, state reset, keyboard/AX, privacy and 24 layout/fallback states passed.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
