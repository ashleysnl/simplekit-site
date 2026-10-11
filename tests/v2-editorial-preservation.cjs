// Phase 13 replaces exactly 23 authored pages; calculators and all other bytes stay pinned.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const prior=require('../docs/v2/phase-12/build-inventory.json').files;
const baseline=require('../docs/v2/phase-13/baseline.json');
const changed=new Set(baseline.pages.map(p=>p.file));
assert.equal(changed.size,23);
let preserved=0;
for(const [file,contract] of Object.entries(prior)){
 const raw=fs.readFileSync(path.join(dist,file));
 if(file==='data/tool-link-audit.json'){continue;}
 if(file==='assets/v2/system.css'){assert.equal(raw.toString(),baseline.systemCss.replace('.v2s-layout--editorial article {','.v2s-layout--editorial > article {').replace('.v2s-layout--editorial aside {','.v2s-layout--editorial > aside {'),'Only the two direct-child grid selectors may change');continue;}
 if(changed.has(file)){assert(raw.toString().includes('class="sk-v2 v2-editorial" data-v2-system="1"'),file+' opted in');continue;}
 assert.equal(raw.length,contract.bytes,file+' size');assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),contract.sha256,file+' hash');preserved++;
}
const audit=JSON.parse(fs.readFileSync(path.join(dist,'data/tool-link-audit.json')));
for(const row of baseline.toolAudit.files)assert.deepEqual(audit.files.find(r=>r.file===row.file),row,'Existing tool-token audit row '+row.file);
const newTemplates=new Set(baseline.pages.filter(p=>!p.priorSource.startsWith('templates/')).map(p=>p.file));
for(const row of audit.files)assert(baseline.toolAudit.files.some(r=>r.file===row.file)||newTemplates.has(row.file),'Only newly authored templates may extend the tool audit');
for(const p of baseline.pages){assert.equal(p.sha256,prior[p.file].sha256,p.file+' Phase 12 baseline');assert.equal(crypto.createHash('sha256').update(p.html).digest('hex'),p.sha256,p.file+' baseline integrity');}
const files=fs.readdirSync(dist,{recursive:true}).filter(f=>fs.statSync(path.join(dist,f)).isFile());
assert.deepEqual(files.filter(f=>!prior[f]).sort(),['assets/v2/editorial.css']);
console.log(`${preserved} previous runtime files exact; exactly 23 opted-in content pages and one editorial stylesheet; shared grid selectors target direct children. The tool-token provenance audit adds only newly authored templates. All calculator/upstream/redirect/homepage bytes, URLs and sitemap remain preserved.`);
