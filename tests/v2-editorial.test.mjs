import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderEditorialPage} from '../scripts/v2-editorial.mjs';
const baseline=JSON.parse(readFileSync(new URL('../docs/v2/phase-13/baseline.json',import.meta.url)));
test('All editorial families retain head/analytics while producing shared landmarks and section anchors',()=>{
 for(const page of baseline.pages){
  const output=renderEditorialPage(`<!-- simplekit-v2-page:${page.family} -->\n`+page.html);
  assert.equal((output.match(/<main\b/g)||[]).length,1,page.file);
  assert.equal((output.match(/<footer\b/g)||[]).length,1,page.file);
  assert.equal((output.match(/data-v2s-menu/g)||[]).length,1,page.file);
  assert.equal(output.match(/<title>[\s\S]*?<\/title>/)[0],page.html.match(/<title>[\s\S]*?<\/title>/)[0]);
  for(const metadata of page.html.matchAll(/<meta\b[^>]*>|<link\b[^>]*rel="canonical"[^>]*>|<script\b[^>]*>[\s\S]*?<\/script>/gi))assert(output.includes(metadata[0]),page.file+' metadata/analytics');
  for(const anchor of page.html.matchAll(/\bid="([^"]+)"/g))assert(output.includes(`id="${anchor[1]}"`),page.file+' original anchor');
 }
});
test('Legacy pages are untouched and malformed opted-in templates fail instead of losing content',()=>{
 const original=baseline.pages[0].html;
 assert.equal(renderEditorialPage(original),original);
 assert.throws(()=>renderEditorialPage('<!-- simplekit-v2-page:calculator -->'+original),/Unsupported/);
 assert.throws(()=>renderEditorialPage('<!-- simplekit-v2-page:article --><main>missing content</main>'),/Canonical/);
 assert.throws(()=>renderEditorialPage('<!-- simplekit-v2-page:article -->'+original.replace('class="content"','class="unexpected"')),/Missing template element/);
});
