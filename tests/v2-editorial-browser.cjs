const {chromium,firefox,webkit}=require('playwright');
const axe=require('axe-core');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const origin=require('./v2-preview-origin.cjs')(process.env.SIMPLEKIT_PREVIEW_URL||'http://127.0.0.1:8004');
assert(['127.0.0.1','localhost'].includes(new URL(origin).hostname),'Local isolated build only');
const baseline=require('../docs/v2/phase-13/baseline.json');
const output=process.env.SIMPLEKIT_EVIDENCE_DIR||'/tmp/simplekit-phase13-browser';fs.mkdirSync(output,{recursive:true});
const engines=(process.env.SIMPLEKIT_BROWSER_ENGINES||'chromium').split(',');
const representatives=['/learn/','/tools/','/learn/retirement-planning-basics/','/learn/budget-to-cash-flow-plan/','/learn/mortgage-affordability-canada/','/about/','/methodology/','/privacy/','/support/'];
const report={baselineSource:baseline.source,axeVersion:axe.version,engines:[],manual:['AT, physical devices, native zoom, human design approval remain pending.','External existing analytics scripts are stubbed in isolated browser checks; head script bytes are preserved.']};
const slug=route=>route.replace(/^\//,'').replace(/\/$/,'').replaceAll('/','-');
async function bounded(label,operation,milliseconds=30000){let timer;try{return await Promise.race([operation,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out')),milliseconds);})]);}finally{clearTimeout(timer);}}
async function fonts(page){const deadline=Date.now()+30000;while(Date.now()<deadline){if(await page.evaluate(()=>document.fonts.status==='loaded'))return;await new Promise(r=>setTimeout(r,50));}throw Error('Fonts timed out');}
async function contract(page,prior=false){return page.evaluate(prior=>{
 const norm=s=>s.replace(/\s+/g,' ').trim();
 const content=document.querySelector(prior?'.content':'.v2e-content');
 const intro=document.querySelector(prior?'.page-intro':'.v2s-intro');
 const copy=content.cloneNode(true);if(prior)copy.querySelector('.page-intro').remove();
 const introductory=intro.cloneNode(true);if(prior)introductory.querySelector('.breadcrumb').remove();
 const related=document.querySelector(prior?'footer.footer':'.v2e-related');
 const links=n=>[...n.querySelectorAll('a[href]')].map(a=>({text:norm(a.textContent),href:a.href}));
 return {intro:norm(introductory.textContent),content:norm(copy.textContent),related:norm(related.textContent),introLinks:links(introductory),contentLinks:links(copy),relatedLinks:links(related),title:document.title,metadata:[...document.head.querySelectorAll('meta,link[rel=canonical]')].map(n=>n.outerHTML),schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)),tables:[...content.querySelectorAll('table')].map(t=>({caption:norm(t.caption?.textContent||''),rows:[...t.rows].map(r=>[...r.cells].map(c=>({text:norm(c.textContent),scope:c.getAttribute('scope')})))})),analytics:[...document.head.querySelectorAll('script:not([type="application/ld+json"])')].map(n=>n.outerHTML),anchors:[...content.querySelectorAll('[id]')].map(n=>n.id),contentId:content.id};
 },prior);}
async function layout(page,label){const g=await page.evaluate(()=>{
 const clipped=[],rectangles=[],overlaps=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const n=walker.currentNode,p=n.parentElement;if(!n.textContent.trim()||!p.getClientRects().length||p.closest('script,style,svg,.v2s-table-scroll,.v2s-skip,.v2-visually-hidden'))continue;const r=document.createRange();r.selectNodeContents(n);for(const rect of r.getClientRects()){if(rect.left<-.5||rect.right>innerWidth+.5)clipped.push(n.textContent.trim().slice(0,100));if(rect.width>2&&rect.height>2)rectangles.push({left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,text:n.textContent.trim().slice(0,55)});}}
 for(let i=0;i<rectangles.length;i++)for(let j=i+1;j<rectangles.length;j++){const a=rectangles[i],b=rectangles[j];if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>3&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>3)overlaps.push([a.text,b.text]);}
 const selectors='.v2s-menu,.v2s-nav a,.v2s-breadcrumb a,.v2e-related a,.v2s-footer a,.v2s-section-nav a,.button,.button-secondary,.text-link,.v2-directory-nav a,.v2-directory-tool';
 const targets=[...document.querySelectorAll(selectors)].filter(n=>n.getClientRects().length).map(n=>({name:n.textContent.trim(),width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height}));
 return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,clipped,overlaps,targets};
 });assert(g.documentWidth<=g.width,label+' overflow');assert.deepEqual(g.clipped,[],label+' clipped text');assert.deepEqual(g.overlaps,[],label+' overlapping text');for(const t of g.targets)assert(t.width>=43.5&&t.height>=43.5,label+' touch target '+t.name);return g;}
(async()=>{
 for(const engine of engines){
  assert(['chromium','firefox','webkit'].includes(engine));
  const browser=await {chromium,firefox,webkit}[engine].launch({...(engine==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:engine==='chromium'?['--no-sandbox']:[]});
  const result={engine,version:browser.version(),pages:[],layouts:[],axe:[],errors:[],failed:[],interactions:[]};
  report.engines.push(result);
  async function context(options={},old){const c=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'reduce',...options});c.setDefaultTimeout(10000);await c.route('**/*',r=>{
   const url=new URL(r.request().url());if(url.origin!==origin)return r.fulfill({status:200,body:'',contentType:'text/plain'});
   if(old&&url.pathname===old.route)return r.fulfill({body:old.html,contentType:'text/html'});
   if(options.blockFonts&&/\.woff2?$/.test(url.pathname))return r.fulfill({status:404,body:''});return r.continue();
  });return c;}
  async function open(c,route){const p=await c.newPage();p.on('pageerror',e=>result.errors.push({route,message:e.message}));p.on('response',r=>{if(new URL(r.url()).origin===origin&&r.status()>=400&&!/\.woff2?$/.test(r.url()))result.failed.push(r.url());});p.on('requestfailed',r=>{if(new URL(r.url()).origin===origin&&!/\.woff2?$/.test(r.url()))result.failed.push(r.url());});await p.goto(origin+route,{waitUntil:'networkidle'});await fonts(p);return p;}
  async function scan(p,name){console.log(engine+' axe '+name);await p.addScriptTag({content:axe.source});const a=await bounded(name+' axe',p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}})));result.axe.push({name,violations:a.violations,incomplete:a.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))});assert.deepEqual(a.violations,[],name+' axe');}
  try{
   for(const spec of baseline.pages){
    console.log(engine+' page '+spec.route);
    const old=await context({},spec),previous=await open(old,spec.route),expected=await contract(previous,true);
    if(engine==='chromium'&&representatives.includes(spec.route)){
     for(const width of [375,390,768,1440]){await previous.setViewportSize({width,height:1000});await previous.screenshot({path:path.join(output,'before-'+slug(spec.route)+'-'+width+'.jpg'),type:'jpeg',quality:76,fullPage:true});}
    }
    await old.close();
    const c=await context(),p=await open(c,spec.route),actual=await contract(p);
    const {anchors:oldAnchors,...oldContract}=expected,{anchors:newAnchors,...newContract}=actual;
    assert.deepEqual(newContract,oldContract,spec.route+' content/metadata/links/analytics');for(const id of oldAnchors)assert(newAnchors.includes(id),spec.route+' old anchor '+id);
    const ids=await p.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(new Set(ids).size,ids.length,spec.route+' duplicate IDs');
    const fragments=await p.locator('a[href^="#"]').evaluateAll(nodes=>nodes.map(n=>({href:n.getAttribute('href'),exists:!!document.getElementById(decodeURIComponent(n.hash.slice(1)))})));assert(fragments.every(f=>f.exists),spec.route+' broken local fragments '+JSON.stringify(fragments));
    await scan(p,spec.route+' mobile');
    const widths=representatives.includes(spec.route)?[320,375,390,768,1440,1920]:[320,390,1440];
    for(const width of widths){await p.setViewportSize({width,height:1000});result.layouts.push({route:spec.route,state:'initial',...await layout(p,spec.route+' '+width)});if([390,1440].includes(width)||representatives.includes(spec.route)&&[375,768].includes(width))await p.screenshot({path:path.join(output,engine+'-'+slug(spec.route)+'-'+width+'.jpg'),type:'jpeg',quality:76,fullPage:true});}
    result.pages.push({route:spec.route,contentMetadataAnalytics:true,originalAnchors:oldAnchors.length});await c.close();
   }
   for(const route of representatives){
    for(const [state,options] of [['no-js',{javaScriptEnabled:false}],['forced-colors',{forcedColors:'active'}],['dark',{colorScheme:'dark'}],['font-fallback',{blockFonts:true}],['text-200',{}]]){
     console.log(engine+' '+route+' '+state);const c=await context(options),p=await open(c,route);if(state==='text-200')await p.addStyleTag({content:'html {font-size:200% !important}'});
     if(state==='no-js'){assert(await p.locator('.v2s-nav').isVisible());assert.equal(await p.locator('.v2s-nav a').count(),5);}
     result.layouts.push({route,state,...await layout(p,route+' '+state)});if(state==='text-200')await scan(p,route+' '+state);
     if(['no-js','text-200','forced-colors'].includes(state))await p.screenshot({path:path.join(output,engine+'-'+slug(route)+'-'+state+'.jpg'),type:'jpeg',quality:73,fullPage:true});await c.close();
    }
   }
   const c=await context(),p=await open(c,'/learn/budget-to-cash-flow-plan/');
   await p.keyboard.press('Tab');assert(await p.locator('.v2s-skip').evaluate(n=>n===document.activeElement));await p.keyboard.press('Enter');assert(await p.locator('#main').evaluate(n=>n===document.activeElement));
   await p.locator('[data-v2s-menu]').focus();await p.keyboard.press('Enter');assert(await p.locator('.v2s-nav').isVisible());await p.keyboard.press('Tab');assert(await p.locator('.v2s-nav a').first().evaluate(n=>n===document.activeElement));await scan(p,'open mobile menu');await p.keyboard.press('Escape');assert(!(await p.locator('.v2s-nav').isVisible()));assert(await p.locator('[data-v2s-menu]').evaluate(n=>n===document.activeElement));
   await p.getByRole('link',{name:'A worked payday example',exact:true}).click();assert.equal(new URL(p.url()).hash,'#example');assert(await p.locator('#example').isVisible());
   const scroll=p.locator('.v2s-table-scroll');await scroll.focus();await p.keyboard.press('ArrowRight');await p.waitForFunction(()=>document.querySelector('.v2s-table-scroll').scrollLeft>0);assert.equal(await p.locator('table tbody tr').count(),6);
   const text=await p.locator('.v2e-content').textContent();await p.emulateMedia({media:'print'});assert(!(await p.locator('.v2s-header').isVisible()));assert.equal(await p.locator('.v2e-content').textContent(),text);await p.screenshot({path:path.join(output,engine+'-cash-flow-print.jpg'),type:'jpeg',quality:75,fullPage:true});
   await p.emulateMedia({media:'screen'});await p.goto(origin+'/tools/');const toolLinks=await p.locator('.v2-directory a[href]').evaluateAll(ns=>ns.map(n=>n.href));const registry=require('../data/tool-registry.json');for(const t of registry)assert(toolLinks.includes(origin+new URL(t.pathUrl).pathname)||toolLinks.includes(t.pathUrl),'Directory missing '+t.id);
   result.interactions=['skip/focus','mobile menu/keyboard/Escape','original section anchors','keyboard table scroll','print retains article','all 22 directory links'];await c.close();
   assert.deepEqual(result.errors,[]);assert.deepEqual(result.failed,[]);console.log(engine+': '+result.pages.length+' preserved pages; '+result.layouts.length+' layouts; '+result.axe.length+' clean axe states; interactions pass.');
  }finally{await browser.close();fs.writeFileSync(path.join(output,'editorial-browser.json'),JSON.stringify(report,null,2)+'\n');}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
