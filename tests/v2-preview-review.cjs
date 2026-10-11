// Phase 11: compare every publicly served candidate file on immutable + shared origins.
// Read-only; production/custom domains are rejected before making requests.
const {request}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const allowed=require('./v2-preview-origin.cjs');
const origin=allowed(process.env.SIMPLEKIT_PREVIEW_URL);
const alias=allowed(process.env.SIMPLEKIT_PREVIEW_ALIAS);
assert.notEqual(origin,alias,'Use the immutable deployment and separate shared alias');
const inventory=require('../docs/v2/phase-10/release-inventory.json');
const candidate=require('../docs/v2/phase-10/candidate-artifact.json');
assert.equal(process.env.SIMPLEKIT_CANDIDATE_SHA,candidate.commit,'Verify the preserved Phase 10 source identity');
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
assert.equal(hash(JSON.stringify(inventory.files)),inventory.inventorySHA256);
const files=Object.entries(inventory.files).filter(([file])=>!['CNAME','robots.txt'].includes(file));
assert.equal(files.length,333);
(async()=>{
 const results=[];
 async function get(context,url){
  const expectedOrigin=new URL(url).origin;
  for(let redirects=0;redirects<6;redirects++){
   const response=await context.get(url,{maxRedirects:0});
   if(![301,302,303,307,308].includes(response.status()))return response;
   assert(response.headers().location,'Redirect requires a destination');
   const next=new URL(response.headers().location,url);
   assert.equal(next.origin,expectedOrigin,'Redirect must stay on preview before following it');
   url=next.href;
  }
  throw new Error('Too many preview redirects');
 }
 for(const base of [origin,alias]){
  const context=await request.newContext();
  try{
   const verified=[];
   // Bound concurrency; include modules, fonts, imagery and all tool pages.
   for(let start=0;start<files.length;start+=6){
    await Promise.all(files.slice(start,start+6).map(async([file,expected])=>{
     const response=await get(context,base+'/'+file);
     assert.equal(response.status(),200,file+' on '+base);
     assert.equal(new URL(response.url()).origin,base,'Redirect must stay on preview');
     const robots=response.headers()['x-robots-tag']||'';assert(/noindex/.test(robots)&&/nofollow/.test(robots),file+' preview indexing protection');
     const bytes=await response.body();assert.equal(bytes.length,expected.bytes,file+' bytes');assert.equal(hash(bytes),expected.sha256,file+' differs from preserved candidate');
     verified.push({file,sha256:expected.sha256,bytes:bytes.length});
    }));
   }
   const robots=await get(context,base+'/robots.txt');assert.equal(robots.status(),200);assert.match(await robots.text(),/^User-agent: \*\s+Disallow: \/\s*$/);
   const cname=await get(context,base+'/CNAME');assert.notEqual((await cname.text()).trim(),'simplekit.app','Production hostname file must not be served');
   results.push({origin:base,verifiedFiles:verified.sort((a,b)=>a.file.localeCompare(b.file)),robotsDisallowAll:true,productionCNAMEAbsent:true});
  }finally{await context.dispose();}
 }
 const output=process.env.SIMPLEKIT_EVIDENCE_DIR||'/tmp/simplekit-phase11';fs.mkdirSync(output,{recursive:true});
 fs.writeFileSync(path.join(output,'preview-review.json'),JSON.stringify({candidateSource:candidate.commit,candidateTarGzSHA256:candidate.candidateTarGzSHA256,inventorySHA256:inventory.inventorySHA256,results,aliasMatchesImmutableDeployment:true,externalRequests:'None; all static requests and redirects confined to preview origins'},null,2)+'\n');
 console.log('Phase 11: all 333 public candidate files byte-match on immutable deployment and shared alias; noindex/nofollow, disallow robots and absent production CNAME verified.');
})().catch(error=>{console.error(error);process.exitCode=1;});
