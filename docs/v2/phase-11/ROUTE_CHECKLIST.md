# Site-wide route migration checklist

Inventory complete does not mean redesigned. `[ ]` = migration incomplete; `[~]` = existing V2 work awaiting unified shell/full-site acceptance; `[x]` requires route-specific verification.

| State | Route | Family | Authoritative source | Target |
| --- | --- | --- | --- | --- |
| [ ] | /about/ | about | ashleysnl/simplekit-site: templates/about/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /budget-planner/ | calculator | ashleysnl/SimpleKitMonthlyBudget: index.html @ 35a6c68bca49d56b5e46d1ca7530dede48eccb36 | Phase 15 tool-specific migration |
| [ ] | /canadian-tax-checklist/ | calculator | ashleysnl/SimpleKitTaxCheckListCAN: index.html @ ebe6150565b6e6dff5fcf0f96837f9710cbc422a | Phase 15 tool-specific migration |
| [ ] | /compound-interest-calculator/ | calculator | ashleysnl/SimpleKitInvestment: index.html @ cd7ec0dfeb1199a1e09f80a4c04ff3f2f29d4955 | Phase 15 tool-specific migration |
| [ ] | /contractor-effective-hourly-rate-calculator/ | calculator | ashleysnl/SimpleKitContractorRate: index.html @ f8feb8c5d6193dc1a300a7632a26203223e95ecd | Phase 15 tool-specific migration |
| [ ] | /cpp-calculator/ | calculator | ashleysnl/SimpleKitCPP: index.html @ e2f14e9401f9e16bf25fa6801dbf5df494676edf | Phase 15 tool-specific migration |
| [ ] | /credit-card-interest-calculator/ | calculator | ashleysnl/SimpleKitCreditCard: index.html @ 2b75e7a44d3af3eb87cfb68c2cdbac9312114ef3 | Phase 15 tool-specific migration |
| [ ] | /debt-payoff-calculator/ | calculator | ashleysnl/SimpleKitDebt: index.html @ c36650f1ef95b446ec2035e1ee28d37d11d69e28 | Phase 15 tool-specific migration |
| [ ] | /debt-to-income-ratio-calculator/ | calculator | ashleysnl/SimpleKitDTI: index.html @ d3c05a120862cc5c46e27fd527d2369fd6679121 | Phase 15 tool-specific migration |
| [ ] | /emergency-fund-calculator/ | calculator | ashleysnl/SImpleKitEmergency: index.html @ 144367cf3e024810b70b373677844e7f36c2c829 | Phase 15 tool-specific migration |
| [ ] | /fire-calculator/ | calculator | ashleysnl/SimpleKitFIRE: index.html @ e44404c1405382840c12a2edf7aae3d1aa816e1b | Phase 15 tool-specific migration |
| [ ] | /house-affordability-calculator/ | calculator | ashleysnl/SimpleKitHouseAffordability: index.html @ 1a34b31ba85ca3cf0e31175bc93446bb01a61154 | Phase 15 tool-specific migration |
| [~] | / | homepage | ashleysnl/simplekit-site: templates/index.html | Retain V2; verify full-site coherence in Phase 16 |
| [ ] | /investment-fee-calculator/ | calculator | ashleysnl/SimpleKitFees: index.html @ 470270f4adfcdc6987ac1d20c3657453e65e6c1c | Phase 15 tool-specific migration |
| [ ] | /learn/budget-to-cash-flow-plan/ | article | ashleysnl/simplekit-site: templates/learn/budget-to-cash-flow-plan/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/compound-interest-and-investment-fees/ | article | ashleysnl/simplekit-site: learn/compound-interest-and-investment-fees/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/cpp-basics/ | article | ashleysnl/simplekit-site: templates/learn/cpp-basics/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/credit-card-interest-and-payoff/ | article | ashleysnl/simplekit-site: learn/credit-card-interest-and-payoff/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/debt-snowball-vs-avalanche/ | article | ashleysnl/simplekit-site: learn/debt-snowball-vs-avalanche/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/emergency-fund-and-savings-goals/ | article | ashleysnl/simplekit-site: learn/emergency-fund-and-savings-goals/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/fire-explained/ | article | ashleysnl/simplekit-site: templates/learn/fire-explained/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/ | learn-hub | ashleysnl/simplekit-site: templates/learn/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/loan-payments-and-amortization/ | article | ashleysnl/simplekit-site: learn/loan-payments-and-amortization/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/monthly-budgeting-and-cash-flow/ | article | ashleysnl/simplekit-site: learn/monthly-budgeting-and-cash-flow/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/mortgage-affordability-canada/ | article | ashleysnl/simplekit-site: learn/mortgage-affordability-canada/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/mortgage-costs-beyond-the-payment/ | article | ashleysnl/simplekit-site: learn/mortgage-costs-beyond-the-payment/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/mortgage-prepayment-vs-investing/ | article | ashleysnl/simplekit-site: learn/mortgage-prepayment-vs-investing/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/net-worth-basics/ | article | ashleysnl/simplekit-site: templates/learn/net-worth-basics/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/rent-vs-buy-canada/ | article | ashleysnl/simplekit-site: learn/rent-vs-buy-canada/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/retirement-planning-basics/ | article | ashleysnl/simplekit-site: templates/learn/retirement-planning-basics/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/rrsp-vs-tfsa-basics/ | article | ashleysnl/simplekit-site: templates/learn/rrsp-vs-tfsa-basics/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /learn/travel-budget-planning-basics/ | article | ashleysnl/simplekit-site: templates/learn/travel-budget-planning-basics/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /loan-calculator/ | calculator | ashleysnl/SimpleKITLoan: index.html @ bda03742ce0f2d8677a34e56e4a665d66a9113ae | Phase 15 tool-specific migration |
| [ ] | /methodology/ | methodology | ashleysnl/simplekit-site: methodology/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /mortgage-calculator/ | calculator | ashleysnl/SimpleKITMortgageCalculator: index.html @ 92cf246721bf6b152334b7bc4185c62098abb8b4 | Phase 14 pilot |
| [ ] | /mortgage-paydown-vs-invest-calculator/ | calculator | ashleysnl/SimpleKitMortOrInvest: index.html @ 7e7198d600e545bf4b61c23fee50db9421b5b4c2 | Phase 15 tool-specific migration |
| [ ] | /net-worth-calculator/ | calculator | ashleysnl/SimpleKitNetWorth: index.html @ 55ede2d5e2130aa10530cccbc4fc8dac52f24975 | Phase 15 tool-specific migration |
| [ ] | /privacy/ | legal | ashleysnl/simplekit-site: privacy/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /rent-vs-buy-calculator/ | calculator | ashleysnl/SimplekitRentVsBuy: index.html @ 6d361109616df603b15b5a7b4f501d0407fa542f | Phase 15 tool-specific migration |
| [ ] | /retirement-planner/404.html | error | ashleysnl/RetirementPlanner: 404.html @ 77babb4a4d8da834c3118c80e50b989ba7429130 | Phase 14: retain upstream fallback behavior and indexing |
| [ ] | /retirement-planner/canadian-retirement-income-calculator.html | retirement-guide | ashleysnl/RetirementPlanner: canadian-retirement-income-calculator.html @ 77babb4a4d8da834c3118c80e50b989ba7429130 | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /retirement-planner/cpp-timing-calculator-canada.html | retirement-guide | ashleysnl/RetirementPlanner: cpp-timing-calculator-canada.html @ 77babb4a4d8da834c3118c80e50b989ba7429130 | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /retirement-planner/ | calculator | ashleysnl/RetirementPlanner: index.html @ 77babb4a4d8da834c3118c80e50b989ba7429130 | Phase 14 pilot |
| [ ] | /retirement-planner/oas-clawback-calculator.html | retirement-guide | ashleysnl/RetirementPlanner: oas-clawback-calculator.html @ 77babb4a4d8da834c3118c80e50b989ba7429130 | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /retirement-planner/retirement-tax-calculator-canada.html | retirement-guide | ashleysnl/RetirementPlanner: retirement-tax-calculator-canada.html @ 77babb4a4d8da834c3118c80e50b989ba7429130 | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /retirement-planner/rrif-minimum-withdrawal-calculator.html | retirement-guide | ashleysnl/RetirementPlanner: rrif-minimum-withdrawal-calculator.html @ 77babb4a4d8da834c3118c80e50b989ba7429130 | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /retirement-planner/rrif-withdrawal-calculator.html | retirement-guide | ashleysnl/RetirementPlanner: rrif-withdrawal-calculator.html @ 77babb4a4d8da834c3118c80e50b989ba7429130 | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /retirement-planner/rrsp-withdrawal-strategy-canada.html | retirement-guide | ashleysnl/RetirementPlanner: rrsp-withdrawal-strategy-canada.html @ 77babb4a4d8da834c3118c80e50b989ba7429130 | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /rrsp-vs-tfsa-calculator/ | calculator | ashleysnl/SimpleKitRRSPTFSA: index.html @ ef07a5e34a6d838d34dbf39a3e860c39d8b0eccd | Phase 15 tool-specific migration |
| [ ] | /savings-goal-calculator/ | calculator | ashleysnl/SimpleKitSavingsGoal: index.html @ 0f4a7e4a276535694e121168b2f0e85d50e41630 | Phase 15 tool-specific migration |
| [ ] | /support/ | support | ashleysnl/simplekit-site: templates/support/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /take-home-pay-calculator/ | calculator | ashleysnl/SimpleKitTakeHomePay: index.html @ 78d539f338078443563a7927e68c156aa261beac | Phase 15 tool-specific migration |
| [ ] | /tools/budget-planner/ | compatibility | ashleysnl/simplekit-site: templates/tools/budget-planner/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [ ] | /tools/cpp-calculator/ | compatibility | ashleysnl/simplekit-site: templates/tools/cpp-calculator/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [ ] | /tools/debt-payoff-calculator/ | compatibility | ashleysnl/simplekit-site: templates/tools/debt-payoff-calculator/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [ ] | /tools/emergency-fund-calculator/ | compatibility | ashleysnl/simplekit-site: templates/tools/emergency-fund-calculator/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [ ] | /tools/fire-calculator/ | compatibility | ashleysnl/simplekit-site: templates/tools/fire-calculator/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [~] | /tools/ | directory | ashleysnl/simplekit-site: templates/tools/index.html | Phase 13 editorial/support migration; upstream retirement guides coordinated with Phase 14 |
| [ ] | /tools/investment-growth-calculator/ | compatibility | ashleysnl/simplekit-site: templates/tools/investment-growth-calculator/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [ ] | /tools/loan-calculator/ | compatibility | ashleysnl/simplekit-site: templates/tools/loan-calculator/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [ ] | /tools/net-worth-calculator/ | compatibility | ashleysnl/simplekit-site: templates/tools/net-worth-calculator/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [ ] | /tools/rent-vs-buy-calculator/ | compatibility | ashleysnl/simplekit-site: templates/tools/rent-vs-buy-calculator/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [ ] | /tools/retirement-planner/ | compatibility | ashleysnl/simplekit-site: templates/tools/retirement-planner/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [ ] | /tools/rrsp-tfsa-calculator/ | compatibility | ashleysnl/simplekit-site: templates/tools/rrsp-tfsa-calculator/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [ ] | /tools/savings-goal-calculator/ | compatibility | ashleysnl/simplekit-site: templates/tools/savings-goal-calculator/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [ ] | /tools/travel-planner/ | compatibility | ashleysnl/simplekit-site: templates/tools/travel-planner/index.html | Phase 13: retain noindex/follow and canonical handoff |
| [ ] | /travel-planner/ | calculator | ashleysnl/TravelPlanner: index.html @ dc5b680e1bf49b75a0f8a746cf49c58b0914707a | Phase 15 tool-specific migration |

Public document: `/simplekit-active-tools.md` is generated from `templates/simplekit-active-tools.md` and the canonical tool registry; preserve its 22 links.
