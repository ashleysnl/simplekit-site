// Reviewed source transitions; original baseline contracts remain independent.
const assert=require('node:assert/strict');
const pilot=require('../data/v2-pilot-sources.json');
const suite=require('../data/v2-calculator-migrations.json');
const transitions=structuredClone(pilot.transitions);
assert.equal(suite.coreBefore,transitions['simplekit-core'].after);
transitions['simplekit-core'].after=suite.coreAfter;
assert.equal(suite.calculators.length,20);
assert.equal(new Set(suite.calculators.map(e=>e.id)).size,20);
for(const e of suite.calculators) {
  assert(!transitions[e.id],'Duplicate pilot/suite transition');
  assert(/^[0-9a-f]{40}$/.test(e.revision)&&/^[0-9a-f]{40}$/.test(e.after),'Incomplete source transition: '+e.id);
  transitions[e.id]={before:e.revision,after:e.after};
}
module.exports={transitions,pilot,suite};
