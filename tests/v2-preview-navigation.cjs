// Exercise actual clicks; direct URL fixture loads cannot detect leaving a demo.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const origin=require('./v2-preview-origin.cjs')(process.env.SIMPLEKIT_PREVIEW_URL);
assert(origin.endsWith('.simplekit-preview.pages.dev'),'This check requires an isolated hosted demo');
const out=process.env.SIMPLEKIT_EVIDENCE_DIR||'/tmp/simplekit-preview-navigation';fs.mkdirSync(out,{recursive:true});
const tools=require('../data/tools.json').tools;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const report={origin,journeys:[],pageErrors:[],failed:[],escapedNavigation:[]};
 try{
  const context=await browser.newContext({viewport:{width:390,height:900}});
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin)return route.continue();
   if(request.isNavigationRequest()){report.escapedNavigation.push(request.url());return route.abort();}
   return route.fulfill({status:200,body:''});
  });
  const p=await context.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));p.on('response',r=>{if(new URL(r.url()).origin===origin&&r.status()>=400)report.failed.push(r.url());});
  async function clicked(selector,pathname){await p.locator(selector).first().click();await p.waitForURL(url=>url.origin===origin&&url.pathname===pathname);await p.waitForLoadState('networkidle');report.journeys.push({selector,path:pathname,origin:new URL(p.url()).origin});}
  const home=()=>clicked('.v2s-header .v2s-brand','/');
  await p.goto(origin,{waitUntil:'networkidle'});
  await clicked('[data-featured-tool="retirement-planner"]','/retirement-planner/');await home();
  await p.locator('#tool-search').fill('CPP');await clicked('[data-tool-id="cpp-calculator"]','/cpp-calculator/');
  assert.equal(await p.locator('[data-v2-calculator="cpp-calculator"]').count(),1);assert.equal(await p.locator('.v2s-header[data-v2-theme="1.1"]').count(),1);
  for(const width of [390,1440]){await p.setViewportSize({width,height:900});await p.evaluate(()=>document.fonts.ready);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:path.join(out,`cpp-${width}.jpg`),fullPage:true});}
  await home();await clicked('.v2-question','/retirement-planner/');await home();
  await clicked('.v2-goal','/tools/');
  for(const tool of tools){const link=p.locator(`a[href="${tool.canonicalPath}"]`).first();assert(await link.count(),tool.id+' has a local directory destination');assert.equal(new URL(await link.getAttribute('href'),p.url()).origin,origin);}
  report.directoryTools=tools.length;
  await clicked('a[href="/budget-planner/"]','/budget-planner/');await home();
  await p.locator('[data-onboarding-start]').click();await p.locator('input[name="onboarding-goal"][value="retirement"]').check();await p.locator('[data-onboarding-next]').click();await p.locator('[data-onboarding-skip]').click();await p.locator('[data-onboarding-skip]').click();
  const recommendation=p.locator('[data-onboarding-tool]').first(),href=await recommendation.getAttribute('href'),destination=new URL(href,p.url()).pathname;
  await clicked('[data-onboarding-tool]',destination);await home();
  const nojs=await browser.newContext({javaScriptEnabled:false});const n=await nojs.newPage();await n.goto(origin);await n.locator('[data-featured-tool="retirement-planner"]').click();assert.equal(new URL(n.url()).origin,origin);assert.equal(new URL(n.url()).pathname,'/retirement-planner/');report.noJavaScriptNavigation=true;await nojs.close();
  assert.deepEqual(report.escapedNavigation,[]);assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.failed,[]);await context.close();
  console.log('Preview click journeys pass: featured, search → V2 CPP, questions, goals, all 22 directory destinations, guided results and no-JS links stay on the demo.');
 }finally{fs.writeFileSync(path.join(out,'navigation-review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
