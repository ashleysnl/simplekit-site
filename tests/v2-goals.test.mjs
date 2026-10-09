import test from 'node:test';
import assert from 'node:assert/strict';
import { repoRoot } from '../scripts/paths.mjs';
import { loadSeoManifest } from '../scripts/seo-utils.mjs';
import { createDiscoveryIndex, loadDiscoveryMetadata } from '../scripts/v2-discovery.mjs';
import { createGoalGroups, renderGoalCards, renderGoalDirectory, renderGoalNavigation } from '../scripts/v2-goals.mjs';

const manifest = loadSeoManifest(repoRoot);
const discovery = createDiscoveryIndex(manifest, loadDiscoveryMetadata(repoRoot));
const groups = createGoalGroups(discovery);

test('goal destinations contain their intended tools and keep tax, pay/work and travel visible', () => {
  const expected = {
    retirement: ['retirement-planner', 'fire-calculator', 'cpp-calculator'],
    home: ['house-affordability-calculator', 'rent-vs-buy-calculator', 'mortgage-paydown-vs-invest-calculator', 'mortgage-calculator', 'debt-to-income-ratio-calculator'],
    budget: ['savings-goal-calculator', 'emergency-fund-calculator', 'net-worth-calculator', 'budget-planner', 'debt-payoff-calculator', 'credit-card-interest-calculator', 'loan-calculator'],
    investing: ['rrsp-vs-tfsa-calculator', 'compound-interest-calculator', 'investment-fee-calculator'],
    tax: ['canadian-tax-checklist'], income: ['take-home-pay-calculator', 'contractor-effective-hourly-rate-calculator'], travel: ['travel-planner']
  };
  assert.deepEqual(Object.fromEntries(groups.map(group => [group.id, group.tools.map(tool => tool.id)])), expected);
  const ids = groups.flatMap(group => group.tools.map(tool => tool.id));
  assert.equal(new Set(ids).size, 22);
  assert.deepEqual([...ids].sort(), manifest.tools.map(tool => tool.slug).sort());
});

test('duplicate tools, missing primary categories and empty goal destinations fail the build contract', () => {
  for (const mutate of [data => data.tools.push(data.tools[0]), data => data.tools[0].goals = [], data => data.tools[0].goals = ['unknown'], data => data.tools = data.tools.filter(tool => tool.goals[0] !== 'home')]) {
    const data = structuredClone(discovery); mutate(data);
    assert.throws(() => createGoalGroups(data));
  }
});

test('directory rendering escapes manifest copy and emits canonical tool tokens once each', () => {
  const data = structuredClone(discovery);
  data.tools[0].name = '<img onerror="alert(1)">';
  data.tools[0].description = 'A & B';
  const html = renderGoalDirectory(createGoalGroups(data));
  assert(!html.includes('<img')); assert(html.includes('&lt;img')); assert(html.includes('A &amp; B'));
  const ids = [...html.matchAll(/\{\{toolUrl:([a-z0-9-]+)\}\}/g)].map(match => match[1]);
  assert.equal(ids.length, 22); assert.equal(new Set(ids).size, 22);
  assert.deepEqual(ids.sort(), manifest.tools.map(tool => tool.slug).sort());
  for (const group of groups) assert(html.includes(`id="${group.id}" tabindex="-1"`));
});

test('the four reference cards and all seven directory anchors use the same category IDs', () => {
  const html = renderGoalCards(groups), navigation = renderGoalNavigation(groups);
  assert.deepEqual([...html.matchAll(/href="tools\/#([a-z]+)"/g)].map(match => match[1]), ['retirement', 'home', 'budget', 'investing']);
  assert.deepEqual([...navigation.matchAll(/href="#([a-z]+)"/g)].map(match => match[1]), groups.map(group => group.id));
  for (const [name, icon, accent] of [['Retirement','bank','blue'], ['Home &amp; mortgage','home','teal'], ['Budget &amp; debt','wallet','amber'], ['Investing','growth','purple']]) {
    assert(html.includes(name)); assert(html.includes(`sprite.svg#${icon}`)); assert(html.includes(`data-accent="${accent}"`));
  }
});
