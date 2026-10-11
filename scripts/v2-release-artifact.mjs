// Canonical inventory used to compare builds and identify a release candidate.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {outputRoot,repoRoot} from './paths.mjs';
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
function walk(relative='') {
 return fs.readdirSync(path.join(outputRoot,relative),{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0).flatMap(entry=>{
  assert(!entry.isSymbolicLink(),'No symlinks in release artifact');
  const file=path.posix.join(relative,entry.name);
  return entry.isDirectory()?walk(file):[file];
 });
}
const files=walk();
assert(!files.some(file=>/(^|\/)(docs|tests|scripts|node_modules|\.cache|\.git|design-reference)(\/|$)/.test(file)||(file.endsWith('.md')&&file!=='simplekit-active-tools.md')),'Developer files must not ship');
const inventory=Object.fromEntries(files.map(file=>{const data=fs.readFileSync(path.join(outputRoot,file));return [file,{bytes:data.length,sha256:hash(data)}];}));
const previous=JSON.parse(fs.readFileSync(path.join(repoRoot,'docs/v2/baseline/artifact-inventory.json')));
const diff={added:files.filter(file=>!previous[file]),changed:files.filter(file=>previous[file]&&previous[file].sha256!==inventory[file].sha256),removed:Object.keys(previous).filter(file=>!inventory[file])};
const result={files:inventory,inventorySHA256:hash(JSON.stringify(inventory)),phase0Diff:diff};
const [mode,destination]=process.argv.slice(2);
assert(destination&&['--record','--compare'].includes(mode),'Usage: node scripts/v2-release-artifact.mjs --record|--compare /outside-repository/inventory.json');
if(mode==='--record')fs.writeFileSync(destination,JSON.stringify(result,null,2)+'\n');
else assert.deepEqual(result,JSON.parse(fs.readFileSync(destination)),'Repeated build must be byte-identical');
console.log(`${files.length} published files; ${result.inventorySHA256}; Phase 0 diff: ${diff.added.length} added, ${diff.changed.length} changed, ${diff.removed.length} removed. ${mode==='--compare'?'Repeated build matches.':'Inventory preserved.'}`);
