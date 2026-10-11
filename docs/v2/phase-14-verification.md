# Phase 14 — Source-owned calculator pilots

Status: `[~]`. Pilot implementation and local verification are in progress. Owner screenshot review is required before Phase 15; no remaining-calculator rollout is authorized by this phase.

## Sources and boundaries

PR #14 was explicitly approved and merged into develop-v2 at `2755936ee964687c5fb75c881b4eba5c53821d54` before this task's minimum temporary branch, `codex/v2-phase-14`, was created. No merge into main or production deployment is authorized.

Retirement Planner is the complex guided/stateful pilot; Mortgage Calculator is the contrasting form, amortization and CSV pilot. Their upstream repositories matched the original pins. Core was inspected before implementation. Source-owned changes are proposed in draft PRs:

- [Core #1](https://github.com/ashleysnl/SimpleKit-Core/pull/1): new explicitly opted-in foundations, fonts, shell, pilot styles and presentation-only accessibility helper. Legacy core.css/core.js remain exact.
- [Retirement Planner #2](https://github.com/ashleysnl/RetirementPlanner/pull/2): shared header/footer, V2 opt-in and seven guide templates; unchanged base stylesheet loaded explicitly rather than through a nested import.
- [Mortgage Calculator #2](https://github.com/ashleysnl/SimpleKITMortgageCalculator/pull/2): shared shell and opt-in pilot presentation. No calculator JavaScript changes.

[Pin transitions](../../data/v2-pilot-sources.json) record each original and proposed commit. Only these three pins move in the review build. All source commits are available on minimum temporary upstream review branches; upstream PRs remain unmerged. The build retrieves exact commits through its ordinary clean-source verification, copies new Core assets, and localizes only five known stylesheet/script names and the icon sprite. No downloaded cache is edited and no calculator logic is transformed by the site build.

## Design and accessibility refinements

Shared V2 navigation, serif headings, local fonts, restrained tinted heroes, white bordered panels, 44px input/button targets, focus outlines, result/table typography and print/forced-colour rules replace the gradient-heavy visual treatment. Both pilots retain their existing information architecture, IDs, defaults, formulas, persistence, charts, tables, exports and related content.

Initial populated-state axe audits exposed nested tooltip/disclosure controls, a plain button group labelled as tabs, and unfocusable scrolling tables. A narrowly opted-in Core helper moves the existing tooltip button outside the summary, gives schedule buttons group/pressed semantics, and makes real result tables labelled keyboard-focusable regions. It does not read/write financial inputs, storage, analytics or network data. Primary hero button contrast is corrected. The redundant floating support CTA is hidden only on opted-in pilots because it blocked a real mobile planner tab; normal Support navigation and content remain.

The retirement stylesheet import produced an incorrect root stylesheet fetch during axe parsing. Loading the same base stylesheet explicitly preserves CSS ordering and resolves that failed request. The only modification to the original CSS is the strictly checked import replacement.

## Preservation and validation

[Independent Phase 13 output inventory](phase-14/baseline-inventory.json) and [original nine documents](phase-14/baseline-html.json) supply the comparison. The new preservation guard requires 328 previous runtime files to remain exact, permits only two pilot HTML pages, seven guide HTML pages and the single import replacement, and verifies all 15 new Core assets against pinned upstream bytes. All 94 original calculator JavaScript hashes remain exact. The other 20 calculators, homepage/editorial pages, canonical URLs, sitemap, robots, redirects, upstream 404, analytics configuration and legacy Core are unchanged.

Pilot browser checks cover 320, 375, 390, 768, 1440 and 1920 widths, initial/populated states, invalid mortgage input, malformed retirement import with unchanged financial state, keyboard menu/Escape, no-JS navigation, forced colours, text enlargement and font fallback. Seven guides receive mobile/desktop content, metadata, original-anchor and axe checks. Before screenshots are retained at 390 and 1440. Browser screenshots and JSON are linked in the final gallery after hosted verification.

All 22 Phase 0 numerical fixtures and Budget/Retirement JSON/storage round trips plus Mortgage 26-year/300-payment CSV reconciliation passed locally before final refinements; final-source checks and hosted three-engine results will be recorded before acceptance. Existing unit, source, build, SEO/output, editorial and system checks remain required. Historical legacy-isolation cases now use unchanged FIRE/CPP/Budget routes because both pilots and their guides are opted in; strict original geometry and unopted assertions remain.

## Review and rollback

Do not mark owner acceptance or Phase 15 complete based on these automated checks. Manual assistive-technology, real-device/native zoom and owner visual review remain open. The upstream 404 remains an intentional error page, with no claim of V2 redesign. No production, DNS or upstream-default-branch deployment occurs.

Rollback uses the three `before` pins in the transition manifest and a normal revert of the site integration commit; do not rewrite shared history. Rebuild and rerun preservation and numerical fixtures. Upstream review branches/PRs retain the proposed work regardless of whether the site pins are accepted.
