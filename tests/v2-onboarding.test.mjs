import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {onboardingGoals, questionsFor, recommendTools} from '../assets/v2/onboarding-engine.js';
import {createDiscoveryIndex, loadDiscoveryMetadata} from '../scripts/v2-discovery.mjs';
const manifest = JSON.parse(fs.readFileSync(new URL('../data/tools.json', import.meta.url)));
const discovery = createDiscoveryIndex(manifest, loadDiscoveryMetadata(process.cwd()));
test('every guided-discovery answer/skip combination returns canonical tools or an explicit fallback', () => {
  let paths = 0;
  for (const goal of [null, ...onboardingGoals.map(g => g.id)]) {
    for (const need of [null, ...questionsFor(goal).map(n => n.id)]) {
      for (const detail of [null, 'focused', 'related']) {
        const result = recommendTools({goal,need,detail}, discovery); paths++;
        if (!goal && !need) assert.equal(result.length, 0);
        else assert(result.length >= 1 && result.length <= 3);
        assert.equal(new Set(result.map(r => r.tool.id)).size, result.length);
        for (const {tool,reason} of result) {
          assert.equal(tool.url, manifest.tools.find(t => t.slug === tool.id).canonicalUrl);
          assert(reason.length > 0);
        }
      }
    }
  }
  assert.equal(paths, 93);
});
test('documented goals and immediate needs preserve relevance when earlier answers change', () => {
  const first = answers => recommendTools(answers,discovery)[0]?.tool.id;
  for (const goal of onboardingGoals) for (const need of goal.needs)
    assert.equal(first({goal:goal.id,need:need.id}),need.toolIds[0]);
  assert.equal(first({goal:'retirement',need:'pay-debt'}),'retirement-planner');
  assert.equal(first({need:'pay-debt'}),'debt-payoff-calculator');
  assert.equal(first({goal:'home'}),'house-affordability-calculator');
  assert.equal(first({goal:'budget'}),'budget-planner');
  assert.equal(first({goal:'investing'}),'compound-interest-calculator');
  assert.deepEqual(recommendTools({goal:'unknown',need:'unknown'},discovery),[]);
  assert.throws(()=>recommendTools({goal:'retirement'},{tools:[]}),/Unknown onboarding tool/);
});
