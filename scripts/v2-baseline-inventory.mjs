// Phase 0 artifact/route contract. --record captures; default compares protected contracts.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {repoRoot,outputRoot} from './paths.mjs';
import {loadSeoManifest,getCanonicalToolRegistry} from './seo-utils.mjs';
const record=process.argv.includes('--record');
const evidence=path.join(repoRoot,'docs/v2/baseline');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p);
function files(dir,relative='') {
 return fs.readdirSync(path.join(dir,relative),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>e.isDirectory()?files(dir,path.join(relative,e.name)):[path.join(relative,e.name)]);
}
const manifest=loadSeoManifest(repoRoot);
const registry=getCanonicalToolRegistry(manifest);
assert.equal(registry.length,22);assert.equal(new Set(registry.map(t=>t.id)).size,22);
const artifact=Object.fromEntries(files(outputRoot).map(p=>[p,{sha256:hash(read(path.join(outputRoot,p))),bytes:read(path.join(outputRoot,p)).length}]));
const sitemap=[...read(path.join(outputRoot,'sitemap.xml')).toString().matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]).sort();
const rootSitemap=[...read(path.join(repoRoot,'sitemap.xml')).toString().matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]).sort();
const declared=[...manifest.site.pages.map(p=>p.loc),...manifest.tools.filter(t=>t.includeInSitemap).map(t=>t.canonicalUrl)].sort();
assert.equal(sitemap.length,53);assert.deepEqual(sitemap,declared);assert.deepEqual(sitemap,rootSitemap);
const html=Object.keys(artifact).filter(p=>p.endsWith('.html'));
const routes=html.map(p=>({file:p,path:'/'+p.replace(/index\.html$/,''),canonical:read(path.join(outputRoot,p)).toString().match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1] ?? null,compatibility:p.startsWith('tools/')&&p!=='tools/index.html'}));
const links=html.flatMap(p=>[...read(path.join(outputRoot,p)).toString().matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/g)].map(m=>({file:p,href:m[1]})));
const cssConsumers=html.filter(p=>/href="[^"]*assets\/site\.css"/.test(read(path.join(outputRoot,p)).toString()));
const sourcePins=JSON.parse(read(path.join(repoRoot,'data/calculator-sources.json')));
// Protect all calculator files and Core, including formulas, defaults and persisted-data code.
const protectedAssets=Object.fromEntries(Object.entries(artifact).filter(([p])=>registry.some(t=>p.startsWith(t.slug+'/'))||p.startsWith('assets/core/')));
const upstreamJS=[];
for(const tool of registry) {
 const source=sourcePins.sources.find(s=>s.id===tool.id);
 const sourceRoot=path.join(repoRoot,'.cache/calculator-sources',source.id,source.revision);
 for(const p of Object.keys(artifact).filter(p=>p.startsWith(tool.slug+'/')&&p.endsWith('.js'))) {
  const upstream=path.join(sourceRoot,p.slice(tool.slug.length+1));
  assert.equal(artifact[p].sha256,hash(read(upstream)),`Calculator logic differs: ${p}`);
  upstreamJS.push({file:p,revision:source.revision,sha256:artifact[p].sha256});
 }
}
assert(!Object.keys(artifact).some(p=>p.startsWith('docs/')||p.startsWith('.cache/')));
const contracts={tools:manifest.tools,sitemap,routes,sourcePins,protectedAssets,referenceSHA256:hash(read(path.join(repoRoot,'docs/design-reference/simplekit-v2-target.png')))};
assert.equal(contracts.referenceSHA256,'3a3dda8eacc4d1795643e6be4672a51d5310133529366f158e45cae2df97ad23');
if(record) {
 const save=(name,value)=>fs.writeFileSync(path.join(evidence,name),JSON.stringify(value,null,2)+'\n');
 save('contracts.json',contracts);save('artifact-inventory.json',artifact);save('links.json',links);save('css-consumers.json',cssConsumers);save('upstream-js.json',upstreamJS);
 save('source-identity.json',{planCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repoRoot,encoding:'utf8'}).trim(),mainCommit:execFileSync('git',['rev-parse','origin/main'],{cwd:repoRoot,encoding:'utf8'}).trim(),node:process.version,protectedInputHashes:Object.fromEntries(['data/tools.json','data/site-pages.json','data/calculator-sources.json','index.html','tools/index.html','CNAME','.github/workflows/validate.yml','.github/workflows/cloudflare-preview.yml','assets/site.css'].map(p=>[p,hash(read(path.join(repoRoot,p)))]))});
} else {
 const previous=JSON.parse(read(path.join(evidence,'contracts.json')));
 assert.deepEqual(contracts,previous,'Protected calculator/route/source/reference contract changed');
}
console.log(`${record?'Recorded':'Verified'}: 22 unique tools, 53 sitemap URLs, ${html.length} HTML routes, ${Object.keys(artifact).length} artifact files; ${upstreamJS.length} calculator JS files match pinned upstream. Docs/reference excluded.`);
