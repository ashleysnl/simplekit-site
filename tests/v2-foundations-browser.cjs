// Phase 1 review specimen is intercepted locally and never copied into dist/.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const origin=process.env.SIMPLEKIT_PREVIEW_URL || 'http://127.0.0.1:8001';
assert(['localhost','127.0.0.1'].includes(new URL(origin).hostname));
const output=process.env.SIMPLEKIT_EVIDENCE_DIR || '/tmp/simplekit-v2-foundations';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const results=[],errors=[],failed=[],external=[];
 try {
  for(const width of [320,375,390,768,1440,1920]) for(const scale of width===390?[1,2]:[1]) {
   const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:scale});
   await context.route('**/*',r=>{
    if(r.request().url()===origin+'/__v2-foundations')return r.fulfill({body:fs.readFileSync(path.join(root,'docs/v2/phase-01/foundations-preview.html'),'utf8'),contentType:'text/html'});
    if(new URL(r.request().url()).origin===origin)return r.continue();
    external.push(r.request().url());return r.abort();
   });
   const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
   await p.goto(origin+'/__v2-foundations',{waitUntil:'networkidle'});
   for(const family of ['SimpleKit Display','SimpleKit Sans']) for(const weight of [400,700]) await p.evaluate(async({family,weight})=>{const loaded=await document.fonts.load(`${weight} 16px "${family}"`);if(loaded.length===0)throw Error('Font not loaded');},{family,weight});
   assert.equal(await p.locator('#icons use').count(),18);
   await p.locator('.v2-hero-media').evaluate(async img=>{await img.decode();if(!img.naturalWidth)throw Error('Hero failed');});
   const details=await p.evaluate(()=>{const img=document.querySelector('.v2-hero-media');return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,fontFaces:[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status})),hero:{source:img.currentSrc,width:img.naturalWidth,height:img.naturalHeight,renderedWidth:img.getBoundingClientRect().width,renderedHeight:img.getBoundingClientRect().height}};});
   const ratio=width<768?4/5:16/9;assert(Math.abs(details.hero.renderedHeight-details.hero.renderedWidth/ratio)<1,'Declared hero aspect ratio not respected');
   assert(details.scrollWidth<=details.viewport,'Specimen overflow');
   await p.locator('#sample-search').focus();assert.equal(await p.locator('#sample-search').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
   await p.screenshot({path:path.join(output,`foundations-${width}-${scale}x.jpg`),type:'jpeg',quality:80,fullPage:true});
   await p.locator('#icons').screenshot({path:path.join(output,`icons-${width}-${scale}x.png`)});
   results.push({width,scale,...details});await context.close();
  }
  // Verify real text remains visible with all local fonts blocked.
  const c=await browser.newContext({viewport:{width:390,height:1000}});await c.route('**/*',r=>r.request().url()===origin+'/__v2-foundations'?r.fulfill({body:fs.readFileSync(path.join(root,'docs/v2/phase-01/foundations-preview.html'),'utf8'),contentType:'text/html'}):/\.woff2?$/.test(r.request().url())?r.abort():r.continue());
  const p=await c.newPage();await p.goto(origin+'/__v2-foundations',{waitUntil:'networkidle'});assert(await p.locator('h1').first().isVisible());await p.screenshot({path:path.join(output,'font-fallback-390.jpg'),type:'jpeg',quality:80,fullPage:true});await c.close();
  const formats={'coastal-mobile-400.avif':'image/avif','coastal-mobile-400.webp':'image/webp','coastal-mobile-400.jpg':'image/jpeg'};
  for(const [file,mime] of Object.entries(formats)){const response=await fetch(origin+'/assets/v2/images/'+file);assert.equal(response.headers.get('content-type'),mime);}
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(external,[]);
  fs.writeFileSync(path.join(output,'browser.json'),JSON.stringify({browser:browser.version(),results,pageErrors:errors,failedResponses:failed,externalRequests:external,fontFallbackVisible:true,scope:'Synthetic Phase 1 specimen, local generated assets; no homepage implementation or real-device claim'},null,2)+'\n');
  console.log('Phase 1: 7 viewport/density specimens pass, four local fonts load, hero decodes, 18 SVG icons, focus indicator visible, font fallback visible; zero external requests/errors/failed responses.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
