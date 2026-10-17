// Phase 11: compare every publicly served candidate file on immutable + shared origins.
// Read-only; production/custom domains are rejected before making requests.
const {request}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const allowed=require('./v2-preview-origin.cjs');
const origin=allowed(process.env.SIMPLEKIT_PREVIEW_URL);
const alias=allowed(process.env.SIMPLEKIT_PREVIEW_ALIAS);
assert.notEqual(origin,alias,'Use the immutable deployment and separate shared alias');
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
// Current previews use the exact downloaded, independently verified release
// package. Keep the historical Phase 10 default for its existing callers.
const release=process.env.SIMPLEKIT_RELEASE_DIR;
const inventory=release?JSON.parse(fs.readFileSync(path.join(release,'release-inventory.json'))):require('../docs/v2/phase-10/release-inventory.json');
const candidate=release?{
 commit:fs.readFileSync(path.join(release,'release-source.txt'),'utf8').trim(),
 candidateTarGzSHA256:hash(fs.readFileSync(path.join(release,'release-candidate.tar.gz')))
}:require('../docs/v2/phase-10/candidate-artifact.json');
assert.match(process.env.SIMPLEKIT_CANDIDATE_SHA||'',/^[a-f0-9]{40}$/);
assert.equal(process.env.SIMPLEKIT_CANDIDATE_SHA,candidate.commit,'Verify the expected candidate source identity');
if(release){
 assert.match(process.env.SIMPLEKIT_CANDIDATE_ARCHIVE_SHA256||'',/^[a-f0-9]{64}$/);
 assert.equal(candidate.candidateTarGzSHA256,process.env.SIMPLEKIT_CANDIDATE_ARCHIVE_SHA256,'Archive must match the independently approved digest');
 assert.equal(candidate.candidateTarGzSHA256,fs.readFileSync(path.join(release,'release-candidate.sha256'),'utf8').trim().split(/\s+/)[0]);
}
assert.equal(hash(JSON.stringify(inventory.files)),inventory.inventorySHA256);
const exceptions=['CNAME','robots.txt',...(release&&inventory.files._redirects?['_redirects']:[])];
const files=Object.entries(inventory.files).filter(([file])=>!exceptions.includes(file));
if(!release)assert.equal(files.length,333);
assert(files.length>0);
for(const[file]of files)assert(!file.startsWith('/')&&!file.split('/').includes('..')&&!/[?#\\]/.test(file),'Artifact paths must stay on the preview origin');
(async()=>{
 const routing=process.env.SIMPLEKIT_PREVIEW_ROUTING==='1';
 let unpacked;
 if(routing){
  assert(release,'Preview routing verification requires the approved release package');
  const {previewHtml,previewScript,previewScriptPath}=await import('../scripts/preview-artifact.mjs');
  unpacked=fs.mkdtempSync(path.join(os.tmpdir(),'simplekit-preview-review-'));
  execFileSync('tar',['-xzf',path.join(release,'release-candidate.tar.gz'),'-C',unpacked]);
  for(const entry of files){
   if(!entry[0].endsWith('.html'))continue;
   const original=fs.readFileSync(path.join(unpacked,entry[0]));
   assert.equal(hash(original),entry[1].sha256,'Original HTML must match the approved production artifact');
   const content=Buffer.from(previewHtml(original.toString('utf8')));
   entry[1]={...entry[1],productionSHA256:entry[1].sha256,sha256:hash(content),bytes:content.length};
  }
  files.push([previewScriptPath,{bytes:Buffer.byteLength(previewScript),sha256:hash(previewScript)}]);
 }
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
  const context=await request.newContext(process.env.SIMPLEKIT_TEST_PROXY?{proxy:{server:process.env.SIMPLEKIT_TEST_PROXY}}:{});
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
 fs.writeFileSync(path.join(output,'preview-review.json'),JSON.stringify({candidateSource:candidate.commit,candidateTarGzSHA256:candidate.candidateTarGzSHA256,inventorySHA256:inventory.inventorySHA256,exceptions,previewRouting:routing,results,aliasMatchesImmutableDeployment:true,externalRequests:'None; all static requests and redirects confined to preview origins'},null,2)+'\n');
 if(unpacked)fs.rmSync(unpacked,{recursive:true,force:true});
 console.log(`Preview review: all ${files.length} public candidate files byte-match on immutable deployment and shared alias; noindex/nofollow, disallow robots and absent production CNAME verified.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
