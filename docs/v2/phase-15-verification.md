# Phase 15 — Remaining calculator implementation

Status: `[~]`. Implementation of all remaining 20 calculators is complete on the source-owned develop-v2 branches and integrated through immutable pins. All 22 calculator pages now opt into the V2 system. Four coherent batch builds pass. Full numerical, state/export, SEO, accessibility, browser and visual verification is deferred to Phase 16 under the owner’s implementation-first cadence; no untested item is marked verified complete.

## Implementation

Shared source-owned Core components add V2 typography, canvas/surface colours, restrained heroes, bordered cards, input/button targets, selected states, focus outlines, result/table/chart treatment, forced colours and print behavior. New shared components load only on the newly migrated tools. Existing legacy Core files and Phase 14 pilot components remain unchanged.

Each tool has its own scoped `v2-calculator.css`, using its actual source layout classes. Layout adapters retain guided inputs, scenario modes, disclosure controls, editable budget/debt rows, loan schedules, comparison views, saved plans and the Travel tabbed workspace. Existing main content remains in place; stable calculator IDs/defaults, inline scripts, SEO metadata and financial logic are preserved. Shared header/footer and a working main-content skip destination replace empty legacy shell mounting points.

Debt’s canvas backing width now follows its narrow rendered width when opted in; Debt and Loan axis labels use the shared 12px font. Only these exact presentation edits occur in their calculator JS. Original code and reviewed replacements are retained independently in [presentation baselines](phase-15/presentation-js-baseline.json). The earlier four Retirement presentation changes remain unchanged. Across the original 94 runtime calculator JS files, 88 are byte-identical and six permit only recorded chart presentation changes; no financial formulas, persisted-state schemas, export data or analytics code were edited.

Five missing Apple icons (CPP, FIRE, Fee, RRSP/TFSA and Mortgage Paydown vs Invest) are exported from their existing source SVGs into the already-declared 180px PNG paths. No metadata URL changes or new dependencies/frameworks are introduced.

## Batches and build evidence

| Batch | Tools | Result |
| --- | --- | --- |
| Investing/retirement | CPP, FIRE, RRSP/TFSA, Compound Interest, Investment Fee | [Build passed](phase-15/investing-build.log) |
| Housing/debt | Affordability, Rent/Buy, Paydown/Invest, Debt Payoff, Credit Card, Loan, DTI | [Build passed](phase-15/housing-debt-build.log) |
| Income/planning | Take Home Pay, Budget, Net Worth, Savings Goal, Emergency Fund, Contractor Rate | [Build passed](phase-15/income-planning-build.log) |
| Tax/travel | Canadian Tax Checklist, Travel Planner | [Build passed](phase-15/tax-travel-build.log) |

Final portable artifact: 381 files, 67 HTML routes and the original 22 calculator paths. The declared 53 sitemap URLs and canonical host remain unchanged. [Build inventory](phase-15/build-inventory.json) records exact bytes; this is an implementation artifact, not an approved release candidate.

## Twenty-two-tool migration matrix

`[~]` means implemented, with final verification pending. Existing Phase 14 passing evidence remains historical evidence for the two pilots; it does not claim full-site Phase 16 acceptance.

| Tool | Canonical path ID | State | Tool-specific implementation |
| --- | --- | --- | --- |
| Retirement Planner | `retirement-planner` | `[~]` | Pilot implemented and previously verified in Phase 14; final candidate QA/manual review pending |
| Mortgage Calculator | `mortgage-calculator` | `[~]` | Pilot implemented and previously verified in Phase 14; final candidate QA/manual review pending |
| CPP Calculator | `cpp-calculator` | `[~]` | Age selection and CPP start-age scenarios stay together; decision comparisons remain below the inputs. Batch build passed; runtime/visual verification pending. |
| Canadian Take Home Pay Calculator | `take-home-pay-calculator` | `[~]` | Salary/province/year inputs retain monthly/annual net pay, payroll caps and province comparison tables. Batch build passed; runtime/visual verification pending. |
| Debt Payoff Calculator | `debt-payoff-calculator` | `[~]` | Editable debt rows, strategy selection, payoff schedule and chart keep their existing controls and ordering. Batch build passed; runtime/visual verification pending. |
| House Affordability Calculator | `house-affordability-calculator` | `[~]` | Income, down payment and housing costs retain their grouped inputs and visible affordability summary. Batch build passed; runtime/visual verification pending. |
| Credit Card Interest Calculator | `credit-card-interest-calculator` | `[~]` | Balance/payment inputs retain their debt-free summary, target-payment guidance and comparison modes. Batch build passed; runtime/visual verification pending. |
| Loan Calculator | `loan-calculator` | `[~]` | Loan settings and repayment overview remain adjacent on desktop; lump-sum inputs, charts and schedule follow. Batch build passed; runtime/visual verification pending. |
| Rent vs Buy Calculator | `rent-vs-buy-calculator` | `[~]` | Rent/buy assumptions and comparison results preserve the original comparison workflow and chart tabs. Batch build passed; runtime/visual verification pending. |
| Budget Planner | `budget-planner` | `[~]` | Editable income/expense rows, starter packs and budget goals retain JSON/storage controls and the cash-flow summary. Batch build passed; runtime/visual verification pending. |
| Compound Interest Calculator | `compound-interest-calculator` | `[~]` | Contribution/return inputs lead into growth results, interpretations and charts; advanced assumptions remain optional. Batch build passed; runtime/visual verification pending. |
| Net Worth Calculator | `net-worth-calculator` | `[~]` | Assets and liabilities retain grouped editing and a visible net-worth summary, projections and milestones. Batch build passed; runtime/visual verification pending. |
| Savings Goal Calculator | `savings-goal-calculator` | `[~]` | Scenario modes, saved scenarios and import/export stay in the control column; goal results and comparisons remain adjacent. Batch build passed; runtime/visual verification pending. |
| Emergency Fund Calculator | `emergency-fund-calculator` | `[~]` | Expense assumptions and coverage choices retain their recommended fund summary and optional advanced details. Batch build passed; runtime/visual verification pending. |
| Mortgage Paydown vs Invest | `mortgage-paydown-vs-invest-calculator` | `[~]` | Mortgage and investment assumptions remain paired with outcome comparisons and sensitivity tables. Batch build passed; runtime/visual verification pending. |
| Investment Fee Calculator | `investment-fee-calculator` | `[~]` | Fee inputs precede the fee-drag takeaway and comparisons; milestone bars retain their original data and order. Batch build passed; runtime/visual verification pending. |
| RRSP / TFSA Calculator | `rrsp-vs-tfsa-calculator` | `[~]` | Basic and advanced optimizer steps retain their disclosure controls; the winner and detailed comparison stay below. Batch build passed; runtime/visual verification pending. |
| FIRE Calculator | `fire-calculator` | `[~]` | Savings inputs and FIRE readiness retain a side-by-side desktop workspace and a stacked mobile path. Batch build passed; runtime/visual verification pending. |
| Canadian Tax Checklist | `canadian-tax-checklist` | `[~]` | Checklist categories, progress, filters and saved/imported plans retain a settings sidebar and action controls. Batch build passed; runtime/visual verification pending. |
| Travel Planner | `travel-planner` | `[~]` | Dashboard/itinerary/costs/settings/report tabs, trip wizard, editable activities and save/import remain intact. Batch build passed; runtime/visual verification pending. |
| Debt-to-Income Ratio Calculator | `debt-to-income-ratio-calculator` | `[~]` | The five-step guided form, step controls and results remain intact; full-width results follow the guided workspace. Batch build passed; runtime/visual verification pending. |
| Contractor Effective Hourly Rate Calculator | `contractor-effective-hourly-rate-calculator` | `[~]` | Contract, leave and benefits steps retain the sticky effective-rate summary and employee comparison. Batch build passed; runtime/visual verification pending. |

## Source traceability and rollback

[Migration manifest](../../data/v2-calculator-migrations.json) records the original/updated SHA, repository, protected production head, batch, exact changed paths and adapter decisions for each source. [Publication records](phase-15/source-publications.json) retain immutable commit/blob identities; [original sources](phase-15/baseline-sources.json) retain independent before templates and file hashes. All 20 authored calculator checkouts and Core are clean and synchronized on their own develop-v2 branches. Production/default source heads remain unchanged; no force push or shared-history rewrite occurred.

Rollback through a normal revert of the site integration/source-pin commit or restore selected `revision` values from the manifest and its `coreBefore` SHA, then rebuild. Keep source-owned development commits preserved. Do not reset shared branches or modify production to roll back this development work.

Existing final-QA contracts were extended for the explicit source transitions, stable metadata/defaults/inline scripts, original financial source bytes, scoped adapters and permitted new assets. Browser baseline checks now recognize the shared shell for every adopted tool; legacy isolation remains on the unchanged homepage and pinned Retirement 404. These suites were prepared but deliberately not executed during this phase.

## Deferred Phase 16 work

For every matrix row: compare original financial/precision/rounding fixtures, exercise populated and error states, inspect mobile/tablet/desktop screenshots, verify keyboard/screen-reader semantics, touch targets, overflow/reflow/zoom, related-tool links, chart legends/labels and console/network behavior. Run persistence/import/export cases where supported, including Budget, Retirement, Savings, Net Worth, Tax Checklist and Travel; reconcile loan/mortgage CSV schedules where supported. Inspect no-JS/font/forced-colour fallbacks, SEO/canonicals/sitemap/redirects, analytics behavior and coherent page-family styling.

Existing Retirement classic/module demo-summary parity (age 75 versus 77) remains outstanding upstream work before release. No remaining tool’s runtime correctness or visual acceptance is claimed from a build alone. Main, production and DNS are untouched. The public demo remains the Phase 14 candidate; this phase does not deploy the new implementation. Owner review and production authorization remain separate final gates.
