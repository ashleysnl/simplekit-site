// Local review references + generated assets; no production requests or published specimens.
const {chromium,firefox,webkit}=require('playwright');
const axe=require('axe-core');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const origin=require('./v2-preview-origin.cjs')(process.env.SIMPLEKIT_PREVIEW_URL||'http://127.0.0.1:8004');
assert(['localhost','127.0.0.1'].includes(new URL(origin).hostname),'Reference tests use a local build only');
const output=process.env.SIMPLEKIT_EVIDENCE_DIR||'/tmp/simplekit-phase12-system';
const engines=(process.env.SIMPLEKIT_BROWSER_ENGINES||'chromium').split(',');
fs.mkdirSync(output,{recursive:true});
const report={axeVersion:axe.version,engines:[],limitations:['Review references, not migrated financial tools.','Browser engines/emulations are not real devices, manual AT, native zoom or human visual approval.','Inline prose links use the WCAG inline-text target exception; menu/actions/inputs/disclosures use 44px targets.']};
async function geometry(page,name){
 const result=await page.evaluate(()=>{
  const visible=n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden';
  const targets=[...document.querySelectorAll('button,input,select,summary,.v2s-nav a,.v2s-related a,.v2s-footer a,.v2s-breadcrumb a,.v2s-section-nav a')].filter(visible).map(n=>n.matches('input[type=checkbox],input[type=radio]')?n.closest('label'):n).map(n=>({name:n.textContent.trim()||n.id,height:n.getBoundingClientRect().height,width:n.getBoundingClientRect().width}));
  const clipped=[];const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walk.nextNode()){
   const n=walk.currentNode,p=n.parentElement;
   if(!n.textContent.trim()||!visible(p)||p.closest('script,style,svg,.v2s-table-scroll,.v2s-skip'))continue;
   const r=document.createRange();r.selectNodeContents(n);
   for(const rect of r.getClientRects())if(rect.left<-.5||rect.right>innerWidth+.5)clipped.push(n.textContent.trim().slice(0,100));
  }
  return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,targets,clipped};
 });
 assert(result.documentWidth<=result.width,name+': page overflow');assert.deepEqual(result.clipped,[],name+': clipped text');
 for(const t of result.targets)assert(t.height>=43.5&&t.width>=43.5,`${name}: undersized ${t.name}: ${t.width}x${t.height}`);
 return result;
}
(async()=>{
 for(const engine of engines){
  assert(['chromium','firefox','webkit'].includes(engine));
  const browser=await {chromium,firefox,webkit}[engine].launch({...(engine==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:engine==='chromium'?['--no-sandbox']:[]});
  const result={engine,version:browser.version(),layouts:[],axe:[],legacyIsolation:[],errors:[],failed:[],external:[]};
  async function context(options={}){
   const c=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'reduce',...options});c.setDefaultTimeout(10000);
   await c.route('**/*',r=>{
    const url=new URL(r.request().url());
    if(url.origin!==origin){result.external.push(url.hostname);return r.fulfill({status:200,body:'',contentType:'text/plain'});}
    const name=url.pathname.match(/^\/__v2-reference\/(editorial|calculator|components)$/)?.[1];
    if(name)return r.fulfill({body:fs.readFileSync(path.join(root,'docs/v2/phase-12/references',name+'.html')),contentType:'text/html'});
    if(url.pathname==='/__v2-design-reference.js')return r.fulfill({body:fs.readFileSync(path.join(root,'docs/v2/phase-12/references/reference.js')),contentType:'text/javascript'});
    if(options.blockFonts&&/\.woff2?$/.test(url.pathname))return r.fulfill({body:'',status:404});
    return r.continue();
   });return c;
  }
  async function reference(c,name){
   const p=await c.newPage();p.on('pageerror',e=>result.errors.push(e.message));p.on('response',r=>{if(new URL(r.url()).origin===origin&&r.status()>=400&&!/\.woff2?$/.test(r.url()))result.failed.push(r.url());});
   p.on('requestfailed',r=>{if(new URL(r.url()).origin===origin&&!/\.woff2?$/.test(r.url()))result.failed.push(r.url());});
   await p.goto(origin+'/__v2-reference/'+name,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);return p;
  }
  async function scan(p,name){await p.addScriptTag({content:axe.source});const a=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}}));result.axe.push({name,violations:a.violations,incomplete:a.incomplete.map(i=>({id:i.id,impact:i.impact,nodes:i.nodes.length}))});assert.deepEqual(a.violations,[],name+': axe violations');}
  try{
   for(const name of ['editorial','calculator','components']){
    for(const width of [320,375,390,768,1440,1920]){
     const c=await context({viewport:{width,height:1000}});const p=await reference(c,name);
     result.layouts.push({name,state:'initial',...await geometry(p,name+' '+width)});
     if([375,390,768,1440].includes(width))await p.screenshot({path:path.join(output,`${engine}-${name}-${width}.jpg`),type:'jpeg',quality:78,fullPage:true});
     if(width===390||width===1440)await scan(p,name+' '+width);
     await c.close();
    }
    for(const [state,options]of [['no-js',{javaScriptEnabled:false}],['forced-colors',{forcedColors:'active'}],['dark',{colorScheme:'dark'}],['font-fallback',{blockFonts:true}],['text-200',{}]]){
     const c=await context(options);const p=await reference(c,name);
     if(state==='text-200')await p.addStyleTag({content:'html {font-size:200% !important}'});
     if(state==='no-js'){assert(await p.locator('.v2s-nav').isVisible());assert.equal(await p.locator('.v2s-nav a').count(),5);}
     result.layouts.push({name,state,...await geometry(p,name+' '+state)});
     await p.screenshot({path:path.join(output,`${engine}-${name}-${state}.jpg`),type:'jpeg',quality:75,fullPage:true});
     if(state==='text-200')await scan(p,name+' '+state);
     await c.close();
    }
   }
   const c=await context();const p=await reference(c,'components');
   // Axe typography probes can load an otherwise-unused font face. Warm all local
   // faces before measuring action requests so the audit isolates input behavior.
   await p.evaluate(async()=>Promise.all(['SimpleKit Display','SimpleKit Sans'].flatMap(family=>[400,700].map(weight=>document.fonts.load(`${weight} 16px "${family}"`)))));
   const actionRequests=[];p.on('request',r=>actionRequests.push({url:r.url(),method:r.method()}));
   await p.keyboard.press('Tab');assert(await p.locator('.v2s-skip').evaluate(n=>n===document.activeElement));await p.keyboard.press('Enter');assert(await p.locator('#main').evaluate(n=>n===document.activeElement));
   await p.locator('[data-v2s-menu]').focus();await p.keyboard.press('Enter');assert(await p.locator('.v2s-nav').isVisible());await p.keyboard.press('Tab');assert(await p.locator('.v2s-nav a').first().evaluate(n=>n===document.activeElement));
   await p.screenshot({path:path.join(output,`${engine}-menu-open.jpg`),type:'jpeg',quality:78,fullPage:true});await scan(p,'open menu');
   await p.keyboard.press('Escape');assert(!(await p.locator('.v2s-nav').isVisible()));assert(await p.locator('[data-v2s-menu]').evaluate(n=>n===document.activeElement));
   await p.setViewportSize({width:1440,height:1000});await p.locator('.v2s-nav').waitFor({state:'visible'});await p.locator('.v2s-nav a').first().focus();await p.setViewportSize({width:390,height:1000});await p.locator('[data-v2s-menu]').waitFor({state:'visible'});assert(await p.locator('[data-v2s-menu]').evaluate(n=>n===document.activeElement));
   await p.locator('#amount').fill('invalid');await p.getByRole('button',{name:'Review inputs',exact:true}).click();assert.equal(await p.locator('#amount').getAttribute('aria-invalid'),'true');assert(await p.locator('#amount-error').isVisible());assert(await p.locator('#amount').evaluate(n=>n===document.activeElement));await scan(p,'invalid amount');
   await p.screenshot({path:path.join(output,`${engine}-validation-error.jpg`),type:'jpeg',quality:78,fullPage:true});
   await p.locator('#amount').fill('125000.50');await p.getByRole('button',{name:'Review inputs',exact:true}).click();assert.equal(await p.locator('#amount').getAttribute('aria-invalid'),'false');assert(!(await p.locator('#amount-error').isVisible()));
   await p.locator('#slider').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#slider').getAttribute('aria-valuetext'),'21 years');
   await p.locator('#automatic').focus();await p.keyboard.press('Space');assert(await p.locator('#automatic').isChecked());
   const summary=p.getByText('Additional assumptions',{exact:true});await summary.focus();await p.keyboard.press('Enter');assert(await summary.evaluate(n=>n.parentElement.open));
   await p.getByRole('button',{name:'Reset example',exact:true}).click();assert.equal(await p.locator('#amount').inputValue(),'100000');assert.equal(await p.locator('#slider-value').textContent(),'20 years');
   const download=p.waitForEvent('download');await p.getByRole('button',{name:'Download example CSV',exact:true}).click();const d=await download;assert.equal(d.suggestedFilename(),'simplekit-design-example.csv');const file=await d.path();assert.equal(fs.readFileSync(file,'utf8'),'year,ending_balance_CAD\n0,100000\n5,80000\n10,55000\n');
   assert.deepEqual(actionRequests,[],'Reference interactions must add no requests');
   assert.deepEqual(await p.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)})),{local:[],session:[]},'Reference inputs must not persist');
   assert.deepEqual(result.external,[],'References must load no external resources');
   await p.emulateMedia({media:'print'});assert(!(await p.locator('.v2s-header').isVisible()));await p.screenshot({path:path.join(output,`${engine}-print.jpg`),type:'jpeg',quality:75,fullPage:true});await c.close();
   // Load new CSS and navigation on old pages: geometry, typography and controls remain exact.
   for(const route of ['/','/learn/mortgage-affordability-canada/','/mortgage-calculator/','/retirement-planner/']){
    const c=await context();const p=await c.newPage();await p.goto(origin+route,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
    const sample=()=>p.evaluate(()=>[...document.querySelectorAll('h1,nav,footer,input,button,main')].map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {tag:n.tagName,id:n.id,font:s.fontFamily,color:s.color,background:s.backgroundColor,rect:[r.x,r.y,r.width,r.height],hidden:n.hidden};}));
    const before=await sample();await p.addStyleTag({url:origin+'/assets/v2/system.css'});await p.addScriptTag({url:origin+'/assets/v2/shell.js'});assert.deepEqual(await sample(),before,route+': legacy isolation');result.legacyIsolation.push(route);await c.close();
   }
   assert.deepEqual(result.errors,[]);assert.deepEqual(result.failed,[]);report.engines.push(result);console.log(`${engine}: ${result.layouts.length} layouts, ${result.axe.length} clean axe states, keyboard/validation/reset/export/print and four legacy isolation checks pass.`);
  } finally {await browser.close();fs.writeFileSync(path.join(output,'browser.json'),JSON.stringify(report,null,2)+'\n');}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
