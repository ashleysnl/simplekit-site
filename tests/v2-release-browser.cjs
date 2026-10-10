// Phase 10: exercise real saved-plan controls and download/import round trips.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const origin=require('./v2-preview-origin.cjs')(process.env.SIMPLEKIT_PREVIEW_URL||'http://127.0.0.1:8000');
const evidence=process.env.SIMPLEKIT_EVIDENCE_DIR||'/tmp/simplekit-phase10';
const fixtures=require('../docs/v2/baseline/tool-fixtures.json');
const normalize=s=>s.replace(/\s+/g,' ').trim();
(async()=>{
 fs.mkdirSync(evidence,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const errors=[],failed=[],external=new Set(),results=[];
 async function open(slug){
  const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'en-CA',timezoneId:'UTC',acceptDownloads:true});
  await context.addInitScript(()=>{const NativeDate=Date;window.Date=class extends NativeDate{constructor(...a){super(...(a.length?a:['2026-10-09T12:00:00Z']));}static now(){return new NativeDate('2026-10-09T12:00:00Z').getTime();}};});
  await context.route('**/*',r=>{const url=new URL(r.request().url());if(url.origin===origin||url.protocol==='blob:')return r.continue();external.add(url.hostname);return r.fulfill({status:200,body:'',contentType:'text/plain'});});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({slug,message:e.message}));
  page.on('response',r=>{if(new URL(r.url()).origin===origin&&r.status()>=400)failed.push({slug,url:r.url(),status:r.status()});});
  page.on('requestfailed',r=>{if(new URL(r.url()).origin===origin)failed.push({slug,url:r.url(),error:r.failure()});});
  assert.equal((await page.goto(origin+'/'+slug+'/',{waitUntil:'networkidle'})).status(),200);
  return {context,page};
 }
 async function download(page,selector){const [file]=await Promise.all([page.waitForEvent('download'),page.locator(selector).click()]);assert.equal(await file.failure(),null);return {name:file.suggestedFilename(),data:fs.readFileSync(await file.path(),'utf8')};}
 async function summary(page,slug){const after=fixtures.tools.find(t=>t.id===slug).after;for(const [sel,text]of Object.entries(after))assert.equal(normalize(await page.locator(sel).innerText()),text,slug+' Phase 0 output');}
 try{
  {
   const slug='budget-planner',{context,page}=await open(slug);
   await page.locator('#loadSampleBtn').click();
   const input=()=>page.locator('[data-group="income"][data-index="0"] .row-amount');
   await input().fill('7000');await input().press('Tab');await page.waitForTimeout(700);await summary(page,slug);
   const saved=await download(page,'#saveJsonBtn'),json=JSON.parse(saved.data);assert.equal(json.tool,'simplekit-budget-planner');assert.equal(json.version,1);
   await page.reload({waitUntil:'networkidle'});assert.equal(await input().inputValue(),'7000');await summary(page,slug);
   await input().fill('9000');await input().press('Tab');await page.waitForTimeout(700);
   await page.locator('#loadJsonInput').setInputFiles({name:saved.name,mimeType:'application/json',buffer:Buffer.from(saved.data)});
   await page.waitForFunction(()=>document.querySelector('[data-group="income"][data-index="0"] .row-amount').value==='7000');await summary(page,slug);
   assert.deepEqual(JSON.parse((await download(page,'#saveJsonBtn')).data).state,json.state,'Budget JSON round trip');
   await page.locator('details.action-details summary').click();const csv=await download(page,'#exportCsvBtn');assert.equal(csv.name,'budget-planner.csv');assert(csv.data.startsWith('Category,Type,Monthly amount,% of income,% of expenses'));assert(csv.data.split('\n').length>2);
   await page.reload({waitUntil:'networkidle'});await summary(page,slug);
   results.push({slug,jsonRoundTrip:true,reloadBeforeAndAfterImport:true,csvRows:csv.data.trim().split('\n').length-1,baseline:'Exact Phase 0 displayed results'});await context.close();
  }
  {
   const slug='retirement-planner',{context,page}=await open(slug);
   await page.locator('#landingDemoBtn').click();await page.waitForTimeout(700);await summary(page,slug);
   await page.locator('.tab-btn[data-nav-target="tools"]:visible').click();
   const saved=await download(page,'#exportJsonBtnSecondary'),json=JSON.parse(saved.data);assert(json.profile&&json.savings&&json.income);
   await page.reload({waitUntil:'networkidle'});await page.locator('.tab-btn[data-nav-target="results"]:visible').click();await summary(page,slug);
   // Import into a fresh context, proving the download alone restores the plan.
   await context.close();const fresh=await open(slug);
   await fresh.page.locator('#importJsonFile').setInputFiles({name:saved.name,mimeType:'application/json',buffer:Buffer.from(saved.data)});
   await fresh.page.waitForFunction(()=>!document.querySelector('[data-nav-panel="results"]').hidden);await summary(fresh.page,slug);
   await fresh.page.locator('.tab-btn[data-nav-target="tools"]:visible').click();
   const restored=JSON.parse((await download(fresh.page,'#exportJsonBtnSecondary')).data);
   for(const field of ['version','profile','assumptions','savings','income','accounts','strategy','notes'])assert.deepEqual(restored[field],json[field],'Retirement portable '+field);
   await fresh.page.reload({waitUntil:'networkidle'});await fresh.page.locator('.tab-btn[data-nav-target="results"]:visible').click();await summary(fresh.page,slug);
   results.push({slug,jsonRoundTrip:true,freshContextImport:true,reloadBeforeAndAfterImport:true,comparison:'All financial fields exact; UI navigation state intentionally excluded'});await fresh.context.close();
  }
  {
   const slug='mortgage-calculator',{context,page}=await open(slug);
   const payment=async()=>Number((await page.locator('#headlineSummary').innerText()).match(/YOUR PAYMENT\s*\$([\d,]+)/)[1].replaceAll(',',''));
   const before=await payment();await page.locator('#loanAmount').fill('960000');await page.locator('#loanAmount').press('Tab');await page.waitForTimeout(700);await summary(page,slug);assert(Math.abs(await payment()-before*2)<=1,'Double principal/payment within displayed dollar rounding');
   const yearly=await download(page,'#exportYearlyCsvBtn'),payments=await download(page,'#exportPaymentCsvBtn');
   const rows=text=>text.trim().split(/\r?\n/).map(row=>Array.from(row.matchAll(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g),match=>match[1].replace(/^"|"$/g,'').replaceAll('""','"')));
   fs.writeFileSync(path.join(evidence,'mortgage-yearly.csv'),yearly.data);fs.writeFileSync(path.join(evidence,'mortgage-payments.csv'),payments.data);const y=rows(yearly.data),p=rows(payments.data);assert.equal(y[0][0],'Year');assert.equal(p[0][0],'Period');assert(y.length>2&&p.length>y.length);
   const sum=(r,col)=>r.slice(1).reduce((s,row)=>s+Number(row[col]),0);
   assert(Math.abs(sum(y,3)-960000)<=(y.length-1)*0.005+0.01,'Yearly principal reconciles within independently rounded cents');assert(Math.abs(sum(p,3)-960000)<=p.length*0.005+0.01,'Per-payment cent rounding');assert(Math.abs(sum(y,4)-sum(p,4))<=p.length*0.005+0.01,'Interest schedules reconcile');assert.equal(Number(y.at(-1).at(-1)),0);assert.equal(Number(p.at(-1).at(-1)),0);
   results.push({slug,principalPayment:true,yearlyRows:y.length-1,paymentRows:p.length-1,csvReconciliation:true,importAndPersistence:'Not supported by this pinned tool'});await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  fs.writeFileSync(path.join(evidence,'release-regression.json'),JSON.stringify({browser:browser.version(),origin,results,pageErrors:errors,failedSameOrigin:failed,stubbedExternalHosts:[...external].sort(),externalScope:'Analytics/support stubs do not verify external services'},null,2)+'\n');
  console.log('Phase 10: Budget/Retirement JSON export/import and storage reload; mortgage principal/payment and both CSV reconciliations passed. Zero browser errors or failed same-origin requests.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
