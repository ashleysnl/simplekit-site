# Full-site V2 migration contract and visual acceptance rubric

This is Phase 11's inventory and proposed acceptance contract. Component/page-family designs are Phase 12, migrations are Phases 13–15 and final full-site acceptance is Phase 16. No route is marked redesigned by this audit.

## Source ownership and migration order

1. **Phase 12 — shared foundations.** Site-owned `assets/v2/` tokens, local fonts and authored templates establish the brand. Shared Core comes from `ashleysnl/SimpleKit-Core` at `cb1da347956f66cec40c72f48fae38b6daf201ed`; it owns the injected tool header/footer and global helpers. Author any Core change upstream, review in isolation and deliberately update the site pin after regression. Scope tokens/components so old tool selectors remain stable until each migration.
2. **Phase 13 — editorial/support.** Author homepage/directory/hub/short guide/About/Support changes in their existing `templates/` files. Long-form Learn pages, Methodology and Privacy use site-owned source HTML where no template override exists. The seven retirement landing guides are owned by RetirementPlanner, so coordinate source-reviewed editorial changes there instead of editing copies. Preserve `/tools/*/` canonical/noindex handoffs and the generated public tool list.
3. **Phase 14 — contrasting pilots.** RetirementPlanner (wizard/dashboard/scenarios/storage/JSON/complex charts, plus its 404 and guide shell) and SimpleKITMortgageCalculator (currency/rates/amortization/prepayment caps/CSV/charts) pilot the new primitives. Preserve data and purpose-specific information architecture. Owner pilot review precedes broad rollout.
4. **Phase 15 — remaining 20 tools.** Migrate by interaction pattern, keeping one reviewed source/pin update per tool or clearly bounded batch: retirement/investing; housing comparisons; debt/loans; income/tax; budget/savings; checklist/travel; business rate. Test every tool before and after shared Core changes; a shared shell alone does not migrate its contents.
5. **Phase 16 — final coherence.** Repeat site-wide routes, screenshots, calculations/state/export, SEO, privacy, accessibility and performance. The Phase 10 homepage artifact is an interim checkpoint. Phase 17 owner acceptance and Phase 18 explicit production authorization follow independently.

[Machine-readable source pins, exact CSS/JS ownership and page mappings](site-inventory.json) · [67-route checklist](ROUTE_CHECKLIST.md). These are the source-of-truth inventory, not a competing route manifest. Source pins remain in `data/calculator-sources.json` and route authority remains in existing manifests.

## Acceptance rubric for each route

| Area | Observable acceptance | Evidence required |
| --- | --- | --- |
| Brand hierarchy | Coherent navy/blue/teal palette, serif display/sans body distinction, matching header/footer/icon/surface language derived from the approved mockup. | Page-family reference and screenshots at 375/390/768/1440; documented functional deviations. |
| Responsive hierarchy | No unintended horizontal page scroll at 320–1920px or enlarged text; forms/results remain readable; long tables scroll in a labelled local container. | Geometry checks, 200% enlargement and real-device/toolbar checks recorded separately. |
| Typography/reading | Use Phase 12 approved font scale and spacing; readable body text/line length, heading rhythm and citations; no forced tiny text to fit the mockup. | Computed style snapshots; article short/long examples; human reading/contrast review. |
| Inputs/actions | Persistent visible labels, units, help/errors, 44px accessible touch targets; clear primary/secondary/export actions; keyboard-visible focus and consistent disabled/empty/loading states. | Keyboard/axe/manual AT, valid/invalid/populated states, input semantics and target dimensions. |
| Results/charts/tables | Premium KPI hierarchy, meaningful labels/legends/axes, accessible chart alternatives, preserved table semantics and mobile scroll; no data hidden for appearance. | Calculator-specific populated and edge states; chart/table comparisons and exact calculation fixtures. |
| Navigation/content | Consistent menu/breadcrumb/footer/related-content conventions; meaningful ordinary links and intact article anchors; no-JS discovery remains usable. | URL/anchor graph, no-JS/keyboard/history checks and homepage → tool → article journeys. |
| Visual states | Readable focus, hover, active, validation, reduced motion and forced colours; dark support is explicit, not assumed from media emulation. | State captures and contrast review; document fallback behavior where no dedicated dark palette exists. |
| SEO/content preservation | Exact canonicals, sitemap membership, descriptions/schema/maintainer identities/indexability and existing article/advice content retained unless separately approved. | Captured hashes/text/schema/link baseline plus meaningful negative SEO tests. |
| Data and calculation preservation | Same defaults, rounding, computation, storage keys/formats, downloads, imported state, URL behavior and privacy boundaries. | All 22 Phase 0 fixtures; meaningful per-tool cases; Budget/Retirement JSON/reload and mortgage CSV references. |
| Ownership/rollback | No authoritative edits in `dist/` or source cache; reviewed upstream commit/pin provenance; prior pin and rollback path retained. | Old/new pin table, changed source files, reproducible build and source-preservation audit. |

## Principal regression risks

- **Core is shared by independently styled tools.** Global type/spacing/reset changes may override charts, result cards, dialogs or native form controls. Introduce scoped primitives and migrate one pilot at a time; rerun all 22 fixtures whenever Core changes.
- **Retirement is unusually stateful.** Preserve multiple navigation modes, demo/scenarios, date-sensitive output, JSON portability, local/session fallbacks and user notes. Preserve the seven guide routes and error fallback alongside the primary app.
- **Mortgage's schedules carry financial meaning.** Preserve compounding/frequency/prepayment-cap semantics, chart data and yearly/payment CSV reconciliation; compare independent cent rounding rather than widening tolerances arbitrarily.
- **Budget/checklists/travel differ from scalar forms.** Dynamic row IDs, stored lists, filters/toggles and itinerary/checklist structures must not be flattened into a generic card/form or reset on style migration.
- **Legacy editorial wrappers differ from the homepage.** Existing breadcrumb/cross-link/CTA/footer relationships must survive replacing the old shell. Hash content and verify anchors before/after; do not rewrite financial advice or add unsubstantiated author/review claims.
- **Compat/error routes have different indexability.** Keep all 13 wrappers' canonical/noindex/follow destinations and Retirement's error route behavior. A style change must not turn redirects into extra indexed content.
- **Inherited defects remain visible.** Seven calculators have serious/critical axe findings; 42 retirement guide links reference five stale app fragments. Record and remediate through reviewed source changes; do not conceal them with broad CSS or claim the inventory passes WCAG.
- **Publishing differs from portable build output.** Production GitHub Pages serves main at repository root. The isolated demo serves `dist/`; a later production change needs the Phase 18 reviewed publishing/rollback plan, not an assumed merge-triggered V2 deployment.
