// Independent last-passed Phase 13 output; pilot formulas and legacy pages remain exact.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const before=require('../docs/v2/phase-14/baseline-inventory.json').files;
const contract=require('../data/v2-pilot-sources.json');
const pins=require('../data/calculator-sources.json');
const baseline=require('../docs/v2/baseline/contracts.json');
const originalCss=require('../docs/v2/phase-14/baseline-css.json');
assert.equal(crypto.createHash('sha256').update(originalCss.content).digest('hex'),before[originalCss.file].sha256,'Independent CSS baseline integrity');
for(const s of baseline.sourcePins.sources){const c=pins.sources.find(p=>p.id===s.id);assert.deepEqual(c,{...s,revision:contract.transitions[s.id]?.after||s.revision});if(contract.transitions[s.id])assert.equal(s.revision,contract.transitions[s.id].before);}
let exact=0;
for(const[file,c]of Object.entries(before)){const raw=fs.readFileSync(path.join(dist,file));if(file===originalCss.file){assert.equal(raw.toString(),originalCss.content.replace('@import url("../../styles.css");','/* Base stylesheet is loaded explicitly in index.html. */'));continue;}if(contract.changedExistingRuntimeFiles.includes(file)){assert(raw.toString().includes('data-v2-pilot='));continue;}assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),c.sha256,file);exact++;}
const files=fs.readdirSync(dist,{recursive:true}).filter(f=>fs.statSync(path.join(dist,f)).isFile());
const added=files.filter(f=>!before[f]);assert.equal(added.length,16);assert(added.every(f=>f.startsWith('assets/core/v2/')||f==='retirement-planner/icons/apple-touch-icon.png'));
for(const f of added){const icon=f==='retirement-planner/icons/apple-touch-icon.png';const s=icon?path.join(root,'.cache/calculator-sources/retirement-planner',contract.transitions['retirement-planner'].after,'icons/apple-touch-icon.png'):path.join(root,'.cache/calculator-sources/simplekit-core',contract.transitions['simplekit-core'].after,'v2',f.slice('assets/core/v2/'.length));assert.equal(crypto.createHash('sha256').update(fs.readFileSync(s)).digest('hex'),crypto.createHash('sha256').update(fs.readFileSync(path.join(dist,f))).digest('hex'),f+' upstream asset');}
console.log(`${exact} Phase 13 runtime files exact; two pilot HTML and seven guides migrate; retirement CSS only removes its nested import. 15 opt-in Core assets and the referenced Apple icon added. Calculator JavaScript, other 20 calculators, upstream 404, legacy Core and SEO output remain exact.`);
