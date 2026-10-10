// Opt-in foundations may add assets; every existing runtime byte must remain unchanged.
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const dist=path.join(root,'dist');
const prior=require('../docs/v2/phase-10/release-inventory.json').files;
for(const [file,contract] of Object.entries(prior)){
 const raw=fs.readFileSync(path.join(dist,file));assert.equal(raw.length,contract.bytes,file+' size');assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),contract.sha256,file+' hash');
}
const files=fs.readdirSync(dist,{recursive:true}).filter(f=>fs.statSync(path.join(dist,f)).isFile());
assert.deepEqual(files.filter(f=>!prior[f]).sort(),['assets/v2/shell.js','assets/v2/system.css']);
console.log('All 335 prior runtime files unchanged; only two opt-in system assets added. No reference HTML/controller published.');
