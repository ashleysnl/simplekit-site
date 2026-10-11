// Optional Phase 0 preservation check. Uses isolated Playwright; no runtime dependency.
// Record only against the reviewed baseline; ordinary runs compare committed fixtures.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const evidence = path.join(root, 'docs/v2/baseline');
const record = process.argv.includes('--record');
const privacyAudit = process.env.SIMPLEKIT_PRIVACY_AUDIT === '1';
const base = process.env.SIMPLEKIT_PREVIEW_URL || 'http://127.0.0.1:8000';
require('./v2-preview-origin.cjs')(base);
const origin = new URL(base).origin;
const fixtures = [
  ['retirement-planner', [['click', '#landingDemoBtn']], ['#resultLiveSummary', '#readinessSummaryModule']],
  ['fire-calculator', [['fill', '#annualSpending', '80000']], ['#resultsGrid']],
  ['cpp-calculator', [['fill', '#monthlyAt65', '1200'], ['click', '#compareBtn']], ['#resultsPanel']],
  ['rrsp-vs-tfsa-calculator', [['fill', '#contributionInput', '12000'], ['click', '#calculateBtn']], ['#detailedResults']],
  ['compound-interest-calculator', [['fill', '#startingAmount', '20000']], ['#headlineResult']],
  ['savings-goal-calculator', [['fill', '#goalAmount', '20000']], ['#summaryCardsPrimary']],
  ['emergency-fund-calculator', [['fill', '#monthlyExpenses', '2500'], ['fill', '#currentSavings', '5000'], ['fill', '#monthlyContribution', '300']], ['#resultCards']],
  ['net-worth-calculator', [['fill', '#cash', '15000']], ['#netWorthValue', '#summaryGrid']],
  ['budget-planner', [['click', '#loadSampleBtn'], ['fill', '[data-group="income"][data-index="0"] .row-amount', '7000']], ['#primarySummaryCards']],
  ['take-home-pay-calculator', [['fill', '#salaryAmount', '6000']], ['#monthlyNetValue', '#resultCards']],
  ['debt-payoff-calculator', [['fill', '#extraPayment', '300'], ['click', '#calculateBtn']], ['#resultCards']],
  ['credit-card-interest-calculator', [['fill', '#monthlyPayment', '300']], ['#resultCards']],
  ['loan-calculator', [['fill', '#loanAmount', '30000']], ['#summaryCards']],
  ['house-affordability-calculator', [['fill', '#annualIncome', '150000']], ['#resultsRange']],
  ['rent-vs-buy-calculator', [['fill', '#homePrice', '650000']], ['#resultHeadline', '#heroMonthly']],
  ['mortgage-paydown-vs-invest-calculator', [['fill', '#extraMonthly', '1000']], ['#results']],
  ['investment-fee-calculator', [['fill', '#feeB', '1']], ['#summaryGrid']],
  ['mortgage-calculator', [['fill', '#loanAmount', '960000']], ['#headlineSummary']],
  ['canadian-tax-checklist', [['click', '[data-action="toggle-category"]', 0], ['check', '.item-checkbox:visible', 0]], ['#summaryTasks', '#summaryCompleted', '#summaryProgress']],
  ['travel-planner', [['click', '#heroLoadDemoBtn']], ['#dashboardTripTitle', '#dashboardTripMeta', '#dashboardItinerary']],
  ['debt-to-income-ratio-calculator', [['fill', '#grossMonthlyIncome', '8000']], ['#resultCards']],
  ['contractor-effective-hourly-rate-calculator', [['fill', '#hourlyRate', '120']], ['#summaryEffectiveRate', '#summaryAnnualEarnings']]
];
const normalize = s => s.replace(/\s+/g, ' ').trim();
async function outputs(page, selectors) {
  const values = {};
  for (const selector of selectors) values[selector] = normalize(await page.locator(selector).innerText());
  return values;
}
async function inputs(page) {
  return page.locator('input,select,textarea').evaluateAll(nodes => nodes
    .filter(n => n.type !== 'file' && n.type !== 'hidden' && !/[0-9a-f]{8}-[0-9a-f]{4}-/.test(n.id) && (n.id || n.closest('[data-group]')))
    .map(n => ({selector: n.id ? `#${n.id}` : `[data-group="${n.closest('[data-group]').dataset.group}"][data-index="${n.closest('[data-group]').dataset.index}"] .${n.className}`,
      value:n.value, ...(['checkbox','radio'].includes(n.type) ? {checked:n.checked} : {})})));
}
(async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/tools.json')));
  assert.equal(fixtures.length, 22);
  assert.deepEqual(fixtures.map(f=>f[0]).sort(), manifest.tools.map(t=>t.slug).sort());
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined, args:['--no-sandbox']});
  const expected = record ? null : JSON.parse(fs.readFileSync(path.join(evidence, 'tool-fixtures.json')));
  const results = [];
  const privacy = [];
  const errors = [], failed = [], blockedExternal = new Set();
  try {
    for (const [id, actions, selectors] of fixtures) {
      const context = await browser.newContext({viewport:{width:1440,height:1000},locale:'en-CA',timezoneId:'UTC'});
      await context.addInitScript(() => {
        const NativeDate = Date;
        window.Date = class extends NativeDate {
          constructor(...args) { super(...(args.length ? args : ['2026-10-09T12:00:00.000Z'])); }
          static now() { return new NativeDate('2026-10-09T12:00:00.000Z').getTime(); }
        };
      });
      await context.route('**/*', route => {
        if(new URL(route.request().url()).origin === origin) return route.continue();
        blockedExternal.add(new URL(route.request().url()).hostname);
        return route.fulfill({status:200,body:'',contentType:'text/plain'});
      });
      const page = await context.newPage();
      const interactionRequests = [];
      let observingInputs = false;
      context.on('request', request => {
        if(observingInputs) interactionRequests.push({url:request.url(),method:request.method(),postData:request.postData()});
      });
      page.on('pageerror', e=>errors.push({id,message:e.message}));
      page.on('response', r=>{if(new URL(r.url()).origin===origin && r.status()>=400) failed.push({id,url:r.url(),status:r.status()});});
      page.on('requestfailed', r=>{if(new URL(r.url()).origin===origin) failed.push({id,url:r.url(),error:r.failure()});});
      const tool = manifest.tools.find(t=>t.slug===id);
      const response = await page.goto(origin+tool.canonicalPath,{waitUntil:'networkidle'});
      assert.equal(response.status(),200,id);
      assert(await page.locator('[data-simplekit-header] nav').count(),`${id}: Core missing`);
      const initialInputs = await inputs(page);
      const before = await outputs(page,selectors);
      const analyticsBefore = await page.evaluate(() => (window.dataLayer || []).length);
      observingInputs = true;
      const steps = [];
      for (const [operation,selector,value] of actions) {
        let control = page.locator(selector);
        if(typeof value==='number') control=control.nth(value);
        if(operation==='fill') {await control.fill(value);await control.press('Tab');}
        else if(operation==='check') await control.check();
        else await control.click();
        // Wait for the calculators' existing debounce and then save each step's result.
        await page.waitForTimeout(700);
        steps.push({operation,selector,value:value ?? null,outputs:await outputs(page,selectors)});
      }
      const after = await outputs(page,selectors);
      assert.notDeepEqual(after,before,`${id}: interaction did not change the result`);
      assert(Object.values(after).every(Boolean),`${id}: empty result`);
      const result = {id,path:tool.canonicalPath,initialInputs,before,steps,finalInputs:await inputs(page),after};
      if(expected) assert.deepEqual(result,expected.tools.find(t=>t.id===id),`${id}: baseline regression`);
      if(privacyAudit) {
        const audit = await page.evaluate(start => ({
          analyticsEvents:(window.dataLayer || []).slice(start).map(item=>Array.from(item)),
          localStorageKeys:Object.keys(localStorage).sort(),sessionStorageKeys:Object.keys(sessionStorage).sort()
        }), analyticsBefore);
        for(const request of interactionRequests) {
          const url = new URL(request.url);
          // Existing calculators refresh their favicon when updating metadata.
          // Allow only that known, body-free static request; retain it in evidence.
          assert.equal(url.origin,origin,`${id}: interaction requested another origin`);
          assert(url.pathname===tool.canonicalPath+'icons/favicon.svg',`${id}: unexpected interaction request`);
          assert.equal(url.search,'',`${id}: request query contains input data`);
          assert.equal(request.method,'GET');assert.equal(request.postData,null);
        }
        for(const event of audit.analyticsEvents) {
          assert.equal(event[0],'event',`${id}: unexpected analytics command`);
          // Audited existing events contain categorical field identifiers, never input values.
          for(const [key,value] of Object.entries(event[2] || {})) {
            assert(['field','field_name','source','placement'].includes(key),`${id}: unexpected analytics parameter ${key}`);
            assert.equal(typeof value,'string',`${id}: noncategorical analytics value`);
            assert(!actions.some(([op,,v])=>op==='fill' && value===v),`${id}: financial input in analytics`);
          }
        }
        privacy.push({id,path:tool.canonicalPath,noSignup:true,interactionRequests,...audit});
      }
      results.push(result);
      console.log(`${id}: interaction passed`);
      await context.close();
    }
    assert.deepEqual(errors,[],'Browser errors');assert.deepEqual(failed,[],'Failed local requests');
    const report = {frozenTime:'2026-10-09T12:00:00.000Z',locale:'en-CA',timezone:'UTC',viewport:{width:1440,height:1000},comparison:'Exact displayed text (calculator rounding); exact input values. No numerical tolerance beyond the tool display.',tools:results};
    if(record) fs.writeFileSync(path.join(evidence,'tool-fixtures.json'),JSON.stringify(report,null,2)+'\n');
    fs.writeFileSync(path.join(process.env.SIMPLEKIT_EVIDENCE_DIR || '/tmp','v2-browser-result.json'),JSON.stringify({mode:record?'record':'compare',tools:results.length,pageErrors:errors,failedLocalRequests:failed,stubbedExternalHosts:[...blockedExternal].sort(),browser:browser.version()},null,2)+'\n');
    if(privacyAudit) fs.writeFileSync(path.join(process.env.SIMPLEKIT_EVIDENCE_DIR || '/tmp','calculator-privacy.json'),JSON.stringify({browser:browser.version(),method:'Existing 22 exact regression fixtures in fresh contexts. Capture all context requests after initial load and queued analytics commands after each interaction. External libraries are stubbed; this checks site-authored payloads, not Google remote configuration.',tools:privacy},null,2)+'\n');
    console.log(`${results.length}/22 fixtures passed; zero page errors and failed local requests.`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
