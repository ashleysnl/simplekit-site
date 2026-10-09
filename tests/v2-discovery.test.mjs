import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repoRoot } from '../scripts/paths.mjs';
import { loadSeoManifest } from '../scripts/seo-utils.mjs';
import { createDiscoveryIndex, discoveryModule, loadDiscoveryMetadata, renderDiscoveryQuestions } from '../scripts/v2-discovery.mjs';
import { createSearchIndex, findTools, normalizeQuery } from '../assets/v2/discovery-engine.js';

const manifest = loadSeoManifest(repoRoot), metadata = loadDiscoveryMetadata(repoRoot);
const discovery = createDiscoveryIndex(manifest, metadata), index = createSearchIndex(discovery);
const first = query => findTools(index, query)[0]?.id;

test('discovery covers every canonical tool and derives names and destinations from the manifest', () => {
  assert.equal(discovery.tools.length, 22);
  for (const canonical of manifest.tools) {
    const entry = discovery.tools.find(t => t.id === canonical.slug);
    assert.equal(entry.name, canonical.name); assert.equal(entry.url, canonical.canonicalUrl);
    assert(entry.description && entry.goals.length && entry.synonyms.length);
  }
});

test('discovery rejects missing, duplicate, unknown and stale metadata IDs', () => {
  for (const mutate of [d => d.tools.pop(), d => d.tools.push(d.tools[0]), d => d.tools[0].id = 'unknown-tool', d => d.tools[0].id = '__proto__']) {
    const data = structuredClone(metadata); mutate(data);
    assert.throws(() => createDiscoveryIndex(manifest, data), /IDs must exactly match/);
  }
});

test('discovery rejects a second route authority, stale URLs and invalid metadata', () => {
  for (const mutate of [d => d.tools[0].url = 'https://wrong.example/', d => d.tools[0].description = '', d => d.tools[0].goals = ['unknown'], d => d.tools[0].synonyms = [null]]) {
    const data = structuredClone(metadata); mutate(data);
    assert.throws(() => createDiscoveryIndex(manifest, data));
  }
  for (const url of ['https://wrong.example/retirement-planner/', 'https://simplekit.app/stale/', 'javascript:alert(1)', 'https://simplekit.app/retirement-planner/?query=private']) {
    const source = structuredClone(manifest); source.tools[0].canonicalUrl = url;
    assert.throws(() => createDiscoveryIndex(source, metadata));
  }
});

test('suggested questions map to their four intended primary and optional related tools', () => {
  assert.deepEqual(discovery.questions.map(q => [q.text, q.toolId, q.relatedToolId]), [
    ['Can I retire at 55?', 'retirement-planner', 'fire-calculator'],
    ['Should I rent or buy a home?', 'rent-vs-buy-calculator', 'mortgage-calculator'],
    ['How much house can I afford?', 'house-affordability-calculator', 'debt-to-income-ratio-calculator'],
    ['How do I pay off debt faster?', 'debt-payoff-calculator', 'credit-card-interest-calculator']
  ]);
  for (const key of ['toolId', 'relatedToolId']) {
    const data = structuredClone(metadata); data.questions[0][key] = 'stale-tool';
    assert.throws(() => createDiscoveryIndex(manifest, data), /Unknown question tool/);
  }
  const data = structuredClone(metadata); data.questions[1].id = data.questions[0].id;
  assert.throws(() => createDiscoveryIndex(manifest, data), /Duplicate question/);
});

test('each of the 22 exact names and slugs ranks its intended tool first, ahead of synonym collisions', () => {
  for (const tool of discovery.tools) {
    assert.equal(first(tool.name), tool.id, tool.name);
    assert.equal(first(tool.slug), tool.id, tool.slug);
  }
  const data = structuredClone(discovery);
  data.tools[0].synonyms.push('Budget Planner', 'budget-planner');
  assert.equal(findTools(createSearchIndex(data), 'Budget Planner')[0].id, 'budget-planner');
});

test('money questions and common Canadian synonyms find the intended tool first', () => {
  for (const [query, id] of [
    ['retire at 55', 'retirement-planner'], ['rent or buy', 'rent-vs-buy-calculator'],
    ['afford a house', 'house-affordability-calculator'], ['pay debt', 'debt-payoff-calculator'],
    ['RRSP TFSA', 'rrsp-vs-tfsa-calculator'], ['paycheque', 'take-home-pay-calculator'],
    ['MER', 'investment-fee-calculator'], ['DTI', 'debt-to-income-ratio-calculator'],
    ['rainy-day fund', 'emergency-fund-calculator'], ['freelance rate', 'contractor-effective-hourly-rate-calculator'],
    ['compound growth', 'compound-interest-calculator'], ['CPP at 70', 'cpp-calculator']
  ]) assert.equal(first(query), id, query);
  for (const question of discovery.questions) assert.equal(first(question.text), question.toolId);
});

test('normalization handles mixed case, whitespace, accents and punctuation; empty/unknown/HTML-like queries are harmless', () => {
  assert.equal(normalizeQuery('  RRSP / TFSA! '), 'rrsp tfsa');
  assert.equal(first('  RéTiRE... AT   55?!  '), 'retirement-planner');
  assert.equal(first('RENT—OR—BUY'), 'rent-vs-buy-calculator');
  for (const query of ['', ' \n\t ', '?!...', 'zzzzzzunknown', '<img src=x onerror="alert(1)">', 'mortgage zzzzzz'])
    assert.deepEqual(findTools(index, query), [], query);
  assert(normalizeQuery('x'.repeat(100000)).length <= 256);
});

test('static questions escape metadata and generated browser data preserves canonical destinations', async () => {
  const data = structuredClone(discovery); data.questions[0].text = '<img src=x onerror="alert(1)"> & money';
  const html = renderDiscoveryQuestions(data);
  assert(!html.includes('<img')); assert(html.includes('&lt;img')); assert(html.includes('&amp; money'));
  for (const question of discovery.questions) assert(html.includes(`href="${question.url}"`));
  const module = await import('data:text/javascript,' + encodeURIComponent(discoveryModule(discovery)));
  assert.deepEqual(module.discovery, discovery);
});
