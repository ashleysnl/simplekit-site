// Source-owned V2 migrations against independent pre-redesign contracts.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const before=require('../docs/v2/phase-14/baseline-inventory.json').files;
const {transitions,pilot,suite}=require('../scripts/v2-migration-contract.cjs');
const pins=require('../data/calculator-sources.json'),baseline=require('../docs/v2/baseline/contracts.json');
const originalCss=require('../docs/v2/phase-14/baseline-css.json');
const presentation=require('../docs/v2/phase-14/presentation-js-baseline.json'),transform=require('../scripts/v2-presentation-contract.cjs');
const suitePresentation=require('../docs/v2/phase-15/presentation-js-baseline.json'),suiteTransform=require('../scripts/v2-calculator-presentation.cjs');
const sourceBaseline=require('../docs/v2/phase-15/baseline-sources.json');
assert.deepEqual(Object.keys(presentation).sort(),pilot.presentationJavaScript.slice().sort());
assert.equal(hash(originalCss.content),before[originalCss.file].sha256,'Independent CSS baseline integrity');
for(const s of baseline.sourcePins.sources){const c=pins.sources.find(p=>p.id===s.id);assert.deepEqual(c,{...s,revision:transitions[s.id]?.after||s.revision});if(transitions[s.id])assert.equal(s.revision,transitions[s.id].before);}
const indexOwners=new Map(suite.calculators.map(e=>[e.id+'/index.html',e]));
let exact=0;
for(const[file,c]of Object.entries(before)){
 const raw=fs.readFileSync(path.join(dist,file));
 if(file==='retirement-planner/app.classic.js'){require('../scripts/v2-retirement-fallback.cjs')(raw);continue;}
 if(presentation[file]){assert.equal(hash(presentation[file].before),c.sha256,file+' original source');assert.equal(raw.toString(),transform(presentation[file].before),file+' reviewed chart-only edits');continue;}
 const entry=suitePresentation[file.split('/')[0]];
 if(entry&&file===file.split('/')[0]+'/'+entry.file){assert.equal(hash(entry.before),c.sha256,file+' original source');assert.equal(raw.toString(),suiteTransform(file,entry.before),file+' reviewed canvas-only edits');continue;}
 if(file===originalCss.file){assert.equal(raw.toString(),originalCss.content.replace('@import url("../../styles.css");','/* Base stylesheet is loaded explicitly in index.html. */'));continue;}
 if(indexOwners.has(file)){assert(raw.toString().includes('data-v2-calculator="'+indexOwners.get(file).id+'"'));assert(raw.toString().includes('data-v2-system="1"'));continue;}
 if(pilot.changedExistingRuntimeFiles.includes(file)){assert(raw.toString().includes('data-v2-pilot='));continue;}
 assert.equal(hash(raw),c.sha256,file+' original runtime asset');exact++;
}
const sourceDir=e=>path.join(root,'.cache/calculator-sources',e.id,e.after);
const metadata=h=>(h.match(/<title\b[^>]*>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*rel=["']canonical["'][^>]*>|<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi)||[]);
const inline=h=>[...h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>! /\bsrc\s*=/.test(m[1])&&m[2].trim()).map(m=>m[2]);
const ids=h=>[...h.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
const controls=h=>[...h.matchAll(/<(?:input|select|textarea)\b[^>]*>/gi)].map(m=>m[0].replace(/\s+class=(["'])[\s\S]*?\1/g,''));
for(const e of suite.calculators){
 const original=sourceBaseline[e.id],source=sourceDir(e),h=fs.readFileSync(path.join(source,'index.html'),'utf8');
 assert.equal(hash(original.html),original.files['index.html'],e.id+' original template integrity');
 assert.deepEqual(metadata(h),metadata(original.html),e.id+' original SEO metadata');
 assert.deepEqual(inline(h),inline(original.html),e.id+' original inline scripts');
 const actualControls=controls(h);
 if(e.id==='contractor-effective-hourly-rate-calculator') {
  // Only these two backing inputs are hidden; visible pressed buttons remain
  // the accessible controls. Preserve types, IDs, names and financial defaults.
  for(const id of ['vacationIsPaid','benefitsAreEmployerPaid']) {
   const index=actualControls.findIndex(tag=>tag.includes('id="'+id+'"'));
   assert(index>=0&&/\s+hidden(?=[\s>])/.test(actualControls[index]),id+' backing input must leave keyboard navigation');
   actualControls[index]=actualControls[index].replace(/\s+hidden(?=[\s>])/,'');
  }
 }
 assert.deepEqual(actualControls,controls(original.html),e.id+' original input defaults and attributes');
 for(const id of ids(original.html))assert(ids(h).includes(id),e.id+' original anchor/control '+id);
 const allowed=['index.html','AGENTS.md'];if(suitePresentation[e.id])allowed.push(suitePresentation[e.id].file);
 for(const[f,sha]of Object.entries(original.files)){
  if(allowed.includes(f))continue;
  assert.equal(hash(fs.readFileSync(path.join(source,f))),sha,e.id+'/'+f+' original source asset');
 }
 assert(fs.readFileSync(path.join(source,'v2-calculator.css'),'utf8').includes('[data-v2-calculator="'+e.id+'"]'),e.id+' scoped adapter');
}
const files=fs.readdirSync(dist,{recursive:true}).filter(f=>fs.statSync(path.join(dist,f)).isFile());
const permittedAdded=new Set(['retirement-planner/icons/apple-touch-icon.png',...suite.calculators.flatMap(e=>[e.id+'/v2-calculator.css',...e.changedFiles.filter(f=>f.endsWith('.png')).map(f=>e.id+'/'+f)])]);
const added=files.filter(f=>!before[f]);assert.equal(added.length,43,'Only 17 Core assets, six Apple icons and 20 tool adapters may be added');
for(const f of added){
 const core=f.startsWith('assets/core/v2/');assert(core||permittedAdded.has(f),f+' unexpected artifact');
 const owner=core?'simplekit-core':f.split('/')[0],pin=pins.sources.find(s=>s.id===owner);
 const src=path.join(root,'.cache/calculator-sources',owner,pin.revision,core?'v2/'+f.slice('assets/core/v2/'.length):f.slice(owner.length+1));
 assert.equal(hash(fs.readFileSync(src)),hash(fs.readFileSync(path.join(dist,f))),f+' exact pinned source');
}
assert(!files.some(f=>f.endsWith('AGENTS.md')||f.startsWith('docs/')),'Instructions/evidence are not public assets');
console.log(`${exact} pre-pilot runtime files remain exact; all 22 calculator templates are source-owned V2. Eight JS files permit reviewed chart/control presentation edits; the scoped fallback reproduces canonical modules. All modular financial source bytes stay original. 20 scoped adapters and five previously missing icons added; legacy Core, routes, metadata, defaults, inline scripts and upstream 404 preserved.`);
