// Phase 11 records existing visual drift, not migration or WCAG acceptance.
const {chromium}=require('playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const origin=require('./v2-preview-origin.cjs')(process.env.SIMPLEKIT_PREVIEW_URL||'http://127.0.0.1:8004');
const inventory=require('../docs/v2/phase-11/site-inventory.json');
const fixtures=require('../docs/v2/baseline/tool-fixtures.json');
const output=process.env.SIMPLEKIT_EVIDENCE_DIR||'/tmp/simplekit-site-inventory';
const representatives=['/','/tools/','/learn/','/learn/retirement-planning-basics/','/learn/mortgage-affordability-canada/','/about/','/support/','/privacy/','/methodology/','/retirement-planner/canadian-retirement-income-calculator.html','/retirement-planner/404.html','/retirement-planner/','/mortgage-calculator/','/budget-planner/','/travel-planner/','/canadian-tax-checklist/','/investment-fee-calculator/','/emergency-fund-calculator/','/debt-payoff-calculator/','/contractor-effective-hourly-rate-calculator/'];
const id=route=>route==='/'?'home':route.replace(/^\/|\/$/g,'').replaceAll('/','--').replace(/\.html$/,'');
(async()=>{
 fs.mkdirSync(output,{recursive:true});fs.mkdirSync(path.join(output,'screenshots'),{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const errors=[],failed=[],external=new Set(),layouts=[],captures=[];
 async function contextFor(route,width,options={}){
  const context=await browser.newContext({viewport:{width,height:1000},locale:'en-CA',timezoneId:'UTC',...options});
  await context.addInitScript(()=>{const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-10-09T12:00:00Z']));}static now(){return new NativeDate('2026-10-09T12:00:00Z').getTime();}};});
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===origin)return r.continue();external.add(u.hostname);return r.fulfill({status:200,body:'',contentType:'text/plain'});});
  const page=await context.newPage();page.on('pageerror',e=>errors.push({route,width,message:e.message}));page.on('response',r=>{if(new URL(r.url()).origin===origin&&r.status()>=400)failed.push({route,width,url:r.url(),status:r.status()});});
  page.on('requestfailed',r=>{if(new URL(r.url()).origin===origin)failed.push({route,width,url:r.url(),failure:r.failure()});});
  const response=await page.goto(origin+route,{waitUntil:'networkidle'});assert.equal(response.status(),200,route);await page.evaluate(()=>document.fonts.ready);return {context,page};
 }
 async function metrics(page,route,width,state='initial'){
  const data=await page.evaluate(()=>{
   const visible=node=>node.getClientRects().length>0;
   const style=node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect();return {font:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,color:s.color,background:s.backgroundColor,borderRadius:s.borderRadius,width:r.width,height:r.height};};
   const heading=document.querySelector('h1'),main=document.querySelector('main')||document.body;
   return {overflow:document.documentElement.scrollWidth>innerWidth,documentWidth:document.documentElement.scrollWidth,body:style(document.body),heading:heading?style(heading):null,main:style(main),navCount:document.querySelectorAll('nav').length,footerCount:document.querySelectorAll('footer').length,breadcrumbs:document.querySelectorAll('.breadcrumb,[aria-label*="breadcrumb" i]').length,controls:[...document.querySelectorAll('input,select,textarea,button')].filter(visible).length,tables:[...document.querySelectorAll('table')].filter(visible).map(t=>({width:t.getBoundingClientRect().width,scrollWidth:t.scrollWidth,rows:t.rows.length})),charts:[...document.querySelectorAll('canvas,svg[role="img"],[id*="Chart"],[id*="chart"]')].filter(visible).length,headings:[...document.querySelectorAll('h1,h2,h3')].filter(visible).map(n=>n.textContent.trim()),media:{dark:matchMedia('(prefers-color-scheme: dark)').matches,forcedColors:matchMedia('(forced-colors: active)').matches}};
  });layouts.push({route,width,state,...data});
 }
 async function capture(page,route,width,state='initial',fullPage=true){const file=`screenshots/${id(route)}-${width}-${state}.jpg`;await page.screenshot({path:path.join(output,file),type:'jpeg',quality:76,fullPage});captures.push({route,width,state,file,fullPage});}
 try{
  // Every substantive page receives a phone audit. Redirect-only wrappers are HTTP/content contracts.
  for(const item of inventory.pages.filter(p=>p.family!=='compatibility')){
   const {context,page}=await contextFor(item.route,390);await metrics(page,item.route,390);await capture(page,item.route,390,'overview',false);await context.close();
  }
  for(const route of representatives){
   for(const width of [375,390,768,1440]){
    const {context,page}=await contextFor(route,width);await metrics(page,route,width);await capture(page,route,width);
    if(route==='/'&&width===390){await page.locator('.v2-menu-toggle').click();await metrics(page,route,width,'open-menu');await capture(page,route,width,'open-menu');await page.locator('.v2-menu-toggle').click();}
    if([390,1440].includes(width)&&['/retirement-planner/','/mortgage-calculator/','/budget-planner/','/travel-planner/','/canadian-tax-checklist/','/investment-fee-calculator/'].includes(route)){
     const fixture=fixtures.tools.find(t=>t.path===route);for(const [op,selector,value]of fixture.steps.map(s=>[s.operation,s.selector,s.value])){let control=page.locator(selector);if(typeof value==='number')control=control.nth(value);if(op==='fill'){await control.fill(value);await control.press('Tab');}else if(op==='check')await control.check();else await control.click();await page.waitForTimeout(700);}
     await metrics(page,route,width,'populated');await capture(page,route,width,'populated');
    }
    await context.close();
   }
  }
  for(const route of ['/','/tools/','/learn/mortgage-affordability-canada/','/mortgage-calculator/'])for(const [state,options]of [['dark',{colorScheme:'dark'}],['forced-colors',{forcedColors:'active'}]]){
   const {context,page}=await contextFor(route,390,options);await metrics(page,route,390,state);await capture(page,route,390,state);await context.close();
  }
  const report={origin,browser:browser.version(),purpose:'Inventory baseline. Existing overflow, visual drift and accessibility findings are recorded for migration, not hidden or waived.',counts:{routesAudited:inventory.pages.length,substantiveMobilePages:inventory.pages.filter(p=>p.family!=='compatibility').length,redirectOnlyContracts:inventory.pages.filter(p=>p.family==='compatibility').length,representatives:representatives.length,captures:captures.length,layouts:layouts.length},layouts,captures,errors,failedSameOrigin:failed,stubbedExternalHosts:[...external].sort(),limitations:['Automated Chromium screenshots; not real-device or manual AT acceptance.','Dark/forced-color emulation records actual support; unchanged legacy pages may not provide a bespoke dark theme.','Compatibility wrappers preserve their existing canonical/noindex/handoff contracts; corresponding calculators are photographed.']};
  fs.writeFileSync(path.join(output,'visual-inventory.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({counts:report.counts,errors:errors.length,failed:failed.length,overflowLayouts:layouts.filter(l=>l.overflow).map(l=>({route:l.route,width:l.width,state:l.state}))}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
