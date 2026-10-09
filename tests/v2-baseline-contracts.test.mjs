// Preservation contracts captured before the v2 redesign; run by npm test.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {repoRoot} from '../scripts/paths.mjs';
import {loadSeoManifest} from '../scripts/seo-utils.mjs';
const baseline=JSON.parse(fs.readFileSync(path.join(repoRoot,'docs/v2/baseline/contracts.json')));
const identity=JSON.parse(fs.readFileSync(path.join(repoRoot,'docs/v2/baseline/source-identity.json')));
test('v2 preserves the 22 canonical tools and declared sitemap inventory',()=>{
 const current=loadSeoManifest(repoRoot);
 assert.deepEqual(current.tools,baseline.tools);
 assert.deepEqual([...current.site.pages.map(p=>p.loc),...current.tools.filter(t=>t.includeInSitemap).map(t=>t.canonicalUrl)].sort(),baseline.sitemap);
});
test('v2 leaves calculator and Core source revisions unchanged',()=>{
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(repoRoot,'data/calculator-sources.json'))),baseline.sourcePins);
});
test('v2 preserves checked-in production landing pages and hostname',()=>{
 for(const file of ['index.html','tools/index.html','CNAME']) {
  const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot,file))).digest('hex');
  assert.equal(hash,identity.protectedInputHashes[file],file);
 }
});
test('v2 keeps the original design reference unchanged',()=>{
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot,'docs/design-reference/simplekit-v2-target.png'))).digest('hex'),baseline.referenceSHA256);
});
