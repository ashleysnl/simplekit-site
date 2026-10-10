import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shellHeader,breadcrumbs,relatedContent} from '../scripts/v2-system-components.mjs';
test('shared shell retains normal routes and active-page semantics without scripting',()=>{
  const html=shellHeader('Learn');
  for(const url of ['/','/tools/','/learn/','/about/','/support/'])assert(html.includes(`href="${url}"`));
  assert(html.includes('href="/learn/" aria-current="page"'));
  assert(!/<nav[^>]*hidden/.test(html));
  assert.throws(()=>shellHeader('Learn','x" onclick="bad'));
});
test('related links and breadcrumbs escape content and refuse unsafe destinations',()=>{
  const html=relatedContent([{label:'<script> & "test"',href:'/tools/?q=%22'}]);
  assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));
  for(const href of ['javascript:alert(1)','//example.com','/\\evil','/a onclick=evil'])assert.throws(()=>relatedContent([{label:'x',href}]));
  assert(breadcrumbs([{label:'Home',href:'/'},{label:'Current'}]).includes('aria-current="page"'));
});
