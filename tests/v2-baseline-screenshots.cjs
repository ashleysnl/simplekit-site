// Baseline screenshots and responsive observations, local output only.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const base=process.env.SIMPLEKIT_PREVIEW_URL || 'http://127.0.0.1:8000';
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const origin=new URL(base).origin;
const output=process.env.SIMPLEKIT_SCREENSHOT_DIR || '/tmp/simplekit-v2-screenshots';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined,args:['--no-sandbox']});
 const observations=[];
 try {
  const views=[{name:'home',route:'/'},{name:'directory',route:'/tools/'},
   {name:'retirement-demo',route:'/retirement-planner/',action:'#landingDemoBtn'},
   {name:'budget-sample',route:'/budget-planner/',action:'#loadSampleBtn'},
   {name:'mortgage',route:'/mortgage-calculator/'}];
  for(const view of views) for(const width of [375,390,768,1440]) {
   const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,locale:'en-CA',timezoneId:'UTC'});
   await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({body:'',contentType:'text/plain'}));
   const page=await context.newPage();
   await page.goto(origin+view.route,{waitUntil:'networkidle'});
   if(view.action){await page.locator(view.action).click();await page.waitForTimeout(900);}
   await page.screenshot({path:path.join(output,`${view.name}-${width}.jpg`),type:'jpeg',quality:80,fullPage:['home','directory'].includes(view.name)});
   if(view.name==='home') await page.locator('nav.site-nav').screenshot({path:path.join(output,`header-${width}.jpg`),type:'jpeg',quality:80});
   observations.push({view:view.name,width,...await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,h1:document.querySelector('h1')?.innerText}))});
   await context.close();
  }
  for(const [width,height,zoom] of [[320,900,1],[1920,1080,1],[844,390,1],[1440,900,2]]) {
   const c=await browser.newContext({viewport:{width,height}});await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({body:''}));
   const p=await c.newPage();await p.goto(origin+'/',{waitUntil:'networkidle'});
   if(zoom!==1) await p.evaluate(z=>document.body.style.zoom=z,zoom);
   observations.push({view:'home',width,height,cssZoom:zoom,...await p.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth}))});
   await p.screenshot({path:path.join(output,`home-${width}x${height}-csszoom${zoom}.jpg`),type:'jpeg',quality:80,fullPage:true});await c.close();
  }
  fs.writeFileSync(path.join(output,'observations.json'),JSON.stringify({browser:browser.version(),externalServices:'Stubbed; screenshots exercise local files only',zoomScope:'CSS zoom approximation; native browser zoom and real devices not tested',observations},null,2)+'\n');
  console.log(`Saved 28 screenshots and responsive observations to ${output}`);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
