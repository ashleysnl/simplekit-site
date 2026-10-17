import test from 'node:test';
import assert from 'node:assert/strict';
import {previewHtml,previewScriptTag} from '../scripts/preview-artifact.mjs';

test('preview navigation preserves canonical metadata and financial scripts while localizing native links',()=>{
 const head='<link rel="canonical" href="https://simplekit.app/cpp-calculator/"><meta property="og:url" content="https://simplekit.app/cpp-calculator/">';
 const script='<script>const original = `<a href="https://simplekit.app/cpp-calculator/">`; const rate=0.04;</script>';
 const html=`<html><head>${head}</head><body>${script}<a title="x > y" href="https://simplekit.app/cpp-calculator/?year=2026#results">CPP</a><a href="//simplekit.app/tools/">Tools</a><a href="https://example.com/?next=https://simplekit.app/">Source</a><a href="#section">Jump</a></body></html>`;
 const actual=previewHtml(html);
 assert(actual.includes(head));assert(actual.includes(script));
 assert(actual.includes('href="/cpp-calculator/?year=2026#results"'));assert(actual.includes('href="/tools/"'));
 assert(actual.includes('href="https://example.com/?next=https://simplekit.app/"'));assert(actual.includes('href="#section"'));
 assert(actual.includes(previewScriptTag));assert.equal(previewHtml(actual),actual);
});
