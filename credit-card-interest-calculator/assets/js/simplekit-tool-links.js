window.SimpleKitToolLinks = Object.freeze({
  retirementPlanner: "https://simplekit.app/retirement-planner/",
  fireCalculator: "https://fire.simplekit.app/",
  cppCalculator: "https://simplekit.app/cpp-calculator/",
  rrsptfsaCalculator: "https://rrsptfsa.simplekit.app/",
  compoundInterestCalculator: "https://simplekit.app/compound-interest-calculator/",
  emergencyFundCalculator: "https://simplekit.app/emergency-fund-calculator/",
  netWorthCalculator: "https://simplekit.app/net-worth-calculator/",
  budgetPlanner: "https://simplekit.app/budget-planner/",
  rentVsBuyCalculator: "https://simplekit.app/rent-vs-buy-calculator/",
  debtPayoffCalculator: "https://simplekit.app/debt-payoff-calculator/",
  mortgagePaydownVsInvestCalculator: "https://simplekit.app/mortgage-paydown-vs-invest-calculator/",
  mortgageCalculator: "https://simplekit.app/mortgage-calculator/",
  investmentFeeCalculator: "https://fees.simplekit.app/",
  travelPlanner: "https://travel.simplekit.app/"
});

window.getSimpleKitToolUrl = function getSimpleKitToolUrl(toolKey) {
  return window.SimpleKitToolLinks[toolKey] || "https://simplekit.app/tools/";
};
