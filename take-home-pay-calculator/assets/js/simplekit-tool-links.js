window.SimpleKitToolLinks = Object.freeze({
  takeHomePayCalculator: "https://simplekit.app/take-home-pay-calculator/",
  "take-home-pay-calculator": "https://simplekit.app/take-home-pay-calculator/",
  "take-home-pay-canada": "https://simplekit.app/take-home-pay-calculator/",
  retirementPlanner: "https://simplekit.app/retirement-planner/",
  fireCalculator: "https://fire.simplekit.app/",
  cppCalculator: "https://simplekit.app/cpp-calculator/",
  rrsptfsaCalculator: "https://rrsptfsa.simplekit.app/",
  compoundInterestCalculator: "https://simplekit.app/compound-interest-calculator/",
  emergencyFundCalculator: "https://emergency.simplekit.app/",
  netWorthCalculator: "https://networth.simplekit.app/",
  budgetPlanner: "https://simplekit.app/budget-planner/",
  rentVsBuyCalculator: "https://simplekit.app/rent-vs-buy-calculator/",
  debtPayoffCalculator: "https://simplekit.app/debt-payoff-calculator/",
  mortgagePaydownVsInvestCalculator: "https://mortgage.simplekit.app/",
  mortgageCalculator: "https://simplekit.app/mortgage-calculator/",
  investmentFeeCalculator: "https://fees.simplekit.app/",
  travelPlanner: "https://travel.simplekit.app/"
});

window.getSimpleKitToolUrl = function getSimpleKitToolUrl(toolKey) {
  return window.SimpleKitToolLinks[toolKey] || "https://simplekit.app/tools/";
};
