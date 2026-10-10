// Deterministic discovery only: no financial advice, storage, analytics or network.
const need = (id, label, toolIds, reason) => ({id, label, toolIds, reason});
export const onboardingGoals = [
  {id:'retirement', label:'Retirement', needs:[
    need('retirement-plan','Build a retirement plan',['retirement-planner','cpp-calculator','fire-calculator'],'Explore retirement income, savings and pension assumptions.'),
    need('early-retirement','Explore early retirement',['fire-calculator','retirement-planner'],'Explore financial independence and retirement planning assumptions.'),
    need('cpp-income','Compare CPP start ages',['cpp-calculator','retirement-planner'],'Compare Canada Pension Plan estimates and start ages.')
  ]},
  {id:'home', label:'Home & mortgage', needs:[
    need('afford-home','Estimate what I can afford',['house-affordability-calculator','mortgage-calculator','debt-to-income-ratio-calculator'],'Explore home affordability using income, debt and down payment assumptions.'),
    need('rent-buy','Compare renting and buying',['rent-vs-buy-calculator','mortgage-calculator'],'Compare housing costs under renting and buying assumptions.'),
    need('mortgage-payment','Estimate mortgage payments',['mortgage-calculator','mortgage-paydown-vs-invest-calculator'],'Explore mortgage payments and the effect of extra payments.')
  ]},
  {id:'budget', label:'Budget & debt', needs:[
    need('monthly-budget','Organize a monthly budget',['budget-planner','emergency-fund-calculator','net-worth-calculator'],'Organize income, spending and a cash buffer.'),
    need('pay-debt','Compare debt repayment plans',['debt-payoff-calculator','credit-card-interest-calculator'],'Explore repayment methods, extra payments and interest.'),
    need('cash-buffer','Plan emergency savings',['emergency-fund-calculator','savings-goal-calculator'],'Explore a cash buffer and contributions toward savings goals.')
  ]},
  {id:'investing', label:'Investing', needs:[
    need('savings-growth','Explore savings growth',['compound-interest-calculator','investment-fee-calculator','savings-goal-calculator'],'Explore contributions, compound growth and investment fees.'),
    need('rrsp-tfsa','Compare RRSP and TFSA',['rrsp-vs-tfsa-calculator','compound-interest-calculator'],'Compare registered-account contribution and tax assumptions.'),
    need('investment-fees','Compare investment fees',['investment-fee-calculator','compound-interest-calculator'],'Explore how fees may affect long-term portfolio growth.')
  ]},
  {id:'tax', label:'Tax preparation', needs:[
    need('tax-documents','Organize tax documents',['canadian-tax-checklist','take-home-pay-calculator'],'Organize Canadian tax filing preparation and documents.')
  ]},
  {id:'income', label:'Pay & work', needs:[
    need('take-home-pay','Estimate take-home pay',['take-home-pay-calculator','budget-planner'],'Explore pay after Canadian tax and payroll deductions.'),
    need('contractor-rate','Explore a contractor rate',['contractor-effective-hourly-rate-calculator','take-home-pay-calculator'],'Explore working time, costs and effective hourly rates.')
  ]},
  {id:'travel', label:'Travel planning', needs:[
    need('trip-plan','Organize a trip and budget',['travel-planner','savings-goal-calculator'],'Organize trip details, itinerary and travel spending.')
  ]}
];
export function questionsFor(goalId) {
  return onboardingGoals.find(goal => goal.id === goalId)?.needs
    || onboardingGoals.map(goal => goal.needs[0]);
}
export function recommendTools(answers = {}, discovery) {
  const goal = onboardingGoals.find(goal => goal.id === answers.goal);
  // Ignore stale/mismatched needs when an earlier answer changes. With no goal,
  // a valid immediate question can still supply one; all-skipped returns fallback.
  const selected = goal
    ? goal.needs.find(item => item.id === answers.need) || goal.needs[0]
    : onboardingGoals.flatMap(item => item.needs).find(item => item.id === answers.need);
  if (!selected) return [];
  const count = answers.detail === 'related' ? 3 : 1;
  return selected.toolIds.slice(0, count).map(id => {
    const tool = discovery.tools.find(tool => tool.id === id);
    if (!tool) throw new Error(`Unknown onboarding tool: ${id}`);
    return {tool, reason: id === selected.toolIds[0] ? selected.reason : tool.description};
  });
}
