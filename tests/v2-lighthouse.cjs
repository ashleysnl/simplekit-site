// Optional lab gate. Install pinned test tools outside the website package.
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const origin=require('./v2-preview-origin.cjs')(process.env.SIMPLEKIT_PREVIEW_URL||'http://127.0.0.1:8003');
const output=process.env.SIMPLEKIT_EVIDENCE_DIR||'/tmp/simplekit-phase8-lighthouse';
fs.mkdirSync(output,{recursive:true});
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
(async()=>{
 const {default:lighthouse}=await import(pathToFileURL(require.resolve('lighthouse')).href);
 const chromeLauncher=await import(pathToFileURL(require.resolve('chrome-launcher')).href);
 const chrome=await chromeLauncher.launch({chromePath:process.env.CHROMIUM_PATH||chromium.executablePath(),chromeFlags:['--headless','--no-sandbox','--disable-dev-shm-usage']});
 const report={origin,analytics:'Blocked for the controlled lab; website analytics unchanged.',limitations:['Simulated mobile laboratory run, not real-user INP or field p75 data.','Loopback lacks the hosted CDN transport compression/cache.','Accessibility score is automated, not manual screen-reader acceptance.'],runs:[]};
 try{
  for(let i=1;i<=3;i++){
   const r=await lighthouse(origin+'/',{port:chrome.port,onlyCategories:['performance','accessibility'],output:['json','html'],logLevel:'error',blockedUrlPatterns:['*googletagmanager.com*','*google-analytics.com*'],formFactor:'mobile',screenEmulation:{mobile:true,width:390,height:844,deviceScaleFactor:1,disabled:false},throttlingMethod:'simulate'});
   fs.writeFileSync(path.join(output,`run-${i}.json`),r.report[0]);fs.writeFileSync(path.join(output,`run-${i}.html`),r.report[1]);
   const l=r.lhr;assert(!l.runtimeError,JSON.stringify(l.runtimeError));
   const run={run:i,lighthouseVersion:l.lighthouseVersion,userAgent:l.userAgent,settings:l.configSettings,performance:l.categories.performance.score*100,accessibility:l.categories.accessibility.score*100,lcp_ms:l.audits['largest-contentful-paint'].numericValue,cls:l.audits['cumulative-layout-shift'].numericValue,fcp_ms:l.audits['first-contentful-paint'].numericValue,tbt_ms:l.audits['total-blocking-time'].numericValue,speed_index_ms:l.audits['speed-index'].numericValue,render_blocking:l.audits['render-blocking-resources']?.details,layout_shifts:l.audits['layout-shifts']?.details};
   report.runs.push(run);console.log(JSON.stringify({run:i,performance:run.performance,accessibility:run.accessibility,lcp_ms:run.lcp_ms,cls:run.cls}));
  }
  report.medians=Object.fromEntries(['performance','accessibility','lcp_ms','cls'].map(k=>[k,median(report.runs.map(r=>r[k]))]));
  assert(report.medians.performance>=90,'Median performance below 90');assert(report.medians.accessibility>=95,'Median accessibility below 95');assert(report.medians.lcp_ms<=2500,'Median LCP above 2500ms');assert(report.medians.cls<=.1,'Median CLS above 0.1');
  report.passed=true;console.log('Phase 8 Lighthouse medians: '+JSON.stringify(report.medians));
 }finally{fs.writeFileSync(path.join(output,'lighthouse-summary.json'),JSON.stringify(report,null,2)+'\n');await chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
