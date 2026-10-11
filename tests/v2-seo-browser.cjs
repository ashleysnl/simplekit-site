// Phase 9 validates only loopback or the dedicated noindex preview, never production.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const origin=require('./v2-preview-origin.cjs')(process.env.SIMPLEKIT_PREVIEW_URL||'http://127.0.0.1:8004');
const output=process.env.SIMPLEKIT_EVIDENCE_DIR||'/tmp/simplekit-phase9-browser';
const hosted=process.env.SIMPLEKIT_HOSTED_PREVIEW==='1';
(async()=>{
 const {auditSeoIntegrity,validatePageMetadata,validateSharePng}=await import('../scripts/v2-seo-integrity.mjs');
 const {loadSeoManifest}=await import('../scripts/seo-utils.mjs');
 const repo=path.join(__dirname,'..'),manifest=loadSeoManifest(repo),inventory=auditSeoIntegrity(path.join(repo,'dist'),manifest);
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const report={origin,hosted,routes:[],resources:[],noJS:{},redirectDestinations:[],inheritedFragments:[],errors:[],failedResponses:[]};
 fs.mkdirSync(output,{recursive:true});
 try {
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({body:''}));
  context.on('page',p=>{p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(new URL(r.url()).origin===origin&&r.status()>=400)report.failedResponses.push(r.url());});});
  const get=async pathname=>{const response=await context.request.get(origin+pathname);assert.equal(response.status(),200,pathname);assert.match(response.headers()['x-robots-tag']||'',/noindex/);return response;};
  for(const page of inventory.pages){
   const pathname=new URL(page.canonical).pathname,response=await get(pathname);
   const metadata=validatePageMetadata(await response.text(),page.canonical,{fullSocial:!page.inheritedCalculatorSource});
   report.routes.push({pathname,status:response.status(),canonical:metadata.canonical,noindex:true});
  }
  for(const compat of inventory.compatibility){
   const pathname='/'+compat.file.replace(/index\.html$/,''), response=await get(pathname), html=await response.text();
   assert(html.includes(compat.canonical),pathname);assert.match(html,/<meta\b(?=[^>]*name="robots")(?=[^>]*content="noindex,follow")/);
   report.routes.push({pathname,status:response.status(),canonical:compat.canonical,noindex:true,compatibility:true});
  }
  const sitemap=await get('/sitemap.xml'), locations=[...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  assert.deepEqual(locations.sort(),inventory.pages.map(p=>p.canonical).sort());assert(locations.every(u=>!new URL(u).search&&!new URL(u).hash));
  const robots=await get('/robots.txt'), policy=await robots.text();
  if(hosted){assert.match(policy,/Disallow: \/\s*$/);assert(!fs.existsSync(path.join(repo,'dist/CNAME')));}
  else {assert.match(policy,/Allow: \/\s/);assert(policy.includes('Sitemap: https://simplekit.app/sitemap.xml'));}
  report.sitemapUrls=locations.length;report.robotsPolicy=hosted?'preview disallow all':'production allow/sitemap preserved; local server sends noindex';
  for(const pathname of inventory.resources){
   const response=await get(pathname),body=await response.body();assert(body.length>0,pathname);
   if(['/og-image.png','/social-preview.png'].includes(pathname))assert.deepEqual(validateSharePng(body),inventory.shareImage);
   report.resources.push({pathname,status:response.status(),bytes:body.length});
  }
  // Both retained metadata URL variants must expose exactly the reviewed V2 asset.
  for(const pathname of ['/og-image.png?v=3','/social-preview.png']){
   const response=await get(pathname);assert((await response.body()).equals(fs.readFileSync(path.join(repo,'assets/v2/social-share.png'))));
  }
  const p=await context.newPage();await p.goto(origin+'/',{waitUntil:'networkidle'});
  assert.equal(await p.locator('h1').count(),1);assert(await p.locator('h1').isVisible());
  const questions=await p.locator('[data-v2-questions] a').evaluateAll(nodes=>nodes.map(a=>({text:a.textContent.trim(),href:a.href})));
  assert.equal(questions.length,4);assert(questions.every(q=>manifest.tools.some(t=>t.canonicalUrl===q.href)));
  const featured=await p.locator('.v2-featured-tool').evaluateAll(nodes=>nodes.map(a=>a.href));
  assert.equal(featured.length,5);assert(featured.every(h=>manifest.tools.some(t=>t.canonicalUrl===h)));
  const goals=await p.locator('.v2-home-goals .v2-goal').evaluateAll(nodes=>nodes.map(a=>a.href));
  assert.equal(goals.length,4);assert(goals.every(h=>new URL(h).pathname==='/tools/'&&new URL(h).hash));
  assert(await p.locator('[data-onboarding-fallback]').isVisible());
  report.noJS.home={questions,featured,goals,fullDirectoryFallback:true};
  await p.goto(origin+'/tools/',{waitUntil:'networkidle'});
  const tools=await p.locator('.v2-directory-tool').evaluateAll(nodes=>nodes.map(a=>({href:a.href,text:a.textContent.trim()})));
  assert.deepEqual(tools.map(t=>t.href).sort(),manifest.tools.map(t=>t.canonicalUrl).sort());assert(tools.every(t=>t.text));
  report.noJS.directory=tools;
  const redirects=JSON.parse(fs.readFileSync(path.join(repo,'docs/seo/redirect-verification-2026-10-02.json'))).rows;
  for(const target of new Set(redirects.map(r=>r.target))){assert(locations.includes(target),target);report.redirectDestinations.push({target,status:(await get(new URL(target).pathname)).status()});}
  // Existing source-pinned guide fragments are reported separately; no new V2
  // fragment may be missing from its authored destination.
  const inherited=inventory.fragmentReview.filter(f=>f.file.startsWith('retirement-planner/'));
  assert.equal(inherited.length,inventory.fragmentReview.length,'New missing cross-page fragment');
  if(inherited.length){
   const live=await browser.newContext();await live.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({body:''}));
   const q=await live.newPage();await q.goto(origin+'/retirement-planner/',{waitUntil:'networkidle'});
   const ids=[...new Set(inherited.map(f=>new URL(f.href,manifest.site.canonicalHost+'/'+f.file).hash.slice(1)))];
   report.inheritedFragments=await q.evaluate(ids=>ids.map(id=>({id,presentAfterJavaScript:!!document.getElementById(id)})),ids);report.inheritedFragmentLinks=inherited.length;
   await live.close();
  }
  await p.goto(origin+'/og-image.png?v=3');await p.screenshot({path:path.join(output,'share-image-browser.png'),fullPage:true});
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedResponses,[]);
  report.passed=true;
  console.log(`Phase 9: ${report.routes.length} routes, ${report.resources.length} assets, ${report.sitemapUrls} sitemap URLs, no-JS discovery and ${report.redirectDestinations.length} documented redirect destinations pass.`);
 }finally{fs.writeFileSync(path.join(output,'seo-browser.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
