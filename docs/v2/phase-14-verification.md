# Phase 14 — Source-owned calculator pilots

Status: `[~]`. Implementation and automated verification are complete; owner acceptance remains open. Owner screenshot review is required before Phase 15; no remaining-calculator rollout is authorized by this phase.

## Sources and boundaries

PR #14 was explicitly approved and merged into develop-v2 at `2755936ee964687c5fb75c881b4eba5c53821d54` before this task's minimum temporary branch, `codex/v2-phase-14`, was created. PR #15 was subsequently merged into develop-v2 by the owner at `d281e32fbca837e2111249fcc97271db3946eb54`. Remote icon-validation changes were preserved through a normal merge. [Follow-up PR #16](https://github.com/ashleysnl/simplekit-site/pull/16) contains the final chart refinement and evidence, targeting develop-v2. It was merged into develop-v2 at `1dcd55e71e2a21a05beea4b9073d42f6ead2c014` after the owner authorized merging all open V2 PRs. No merge into main or production deployment is authorized.

Retirement Planner is the complex guided/stateful pilot; Mortgage Calculator is the contrasting form, amortization and CSV pilot. Their upstream repositories matched the original pins. Core was inspected before implementation. Source-owned changes were reviewed and integrated into their repositories’ `develop-v2` branches:

- [Core #1](https://github.com/ashleysnl/SimpleKit-Core/pull/1): new explicitly opted-in foundations, fonts, shell, pilot styles and presentation-only accessibility helper. Legacy core.css/core.js remain exact.
- [Retirement Planner #2](https://github.com/ashleysnl/RetirementPlanner/pull/2): shared header/footer, V2 opt-in and seven guide templates; unchanged base stylesheet loaded explicitly rather than through a nested import.
- [Mortgage Calculator #2](https://github.com/ashleysnl/SimpleKITMortgageCalculator/pull/2): shared shell and opt-in pilot presentation. No calculator JavaScript changes.

[Pin transitions](../../data/v2-pilot-sources.json) record each original and proposed commit. Only these three pins move in the review build. All three upstream PRs are now merged into their own `develop-v2` branches. Each verified source pin is an ancestor of that branch, and each merged source tree is byte-identical to its pinned review tree. Upstream `main` branches remain unchanged. [Integration record](pr-integration-2026-10-11.md). The build retrieves exact commits through its ordinary clean-source verification, copies new Core assets, and localizes only five known stylesheet/script names and the icon sprite. No downloaded cache is edited and no calculator logic is transformed by the site build.

## Design and accessibility refinements

Shared V2 navigation, serif headings, local fonts, restrained tinted heroes, white bordered panels, 44px input/button targets, focus outlines, result/table typography and print/forced-colour rules replace the gradient-heavy visual treatment. Both pilots retain their existing information architecture, IDs, defaults, formulas, persistence, charts, tables, exports and related content.

Initial populated-state axe audits exposed nested tooltip/disclosure controls, a plain button group labelled as tabs, and unfocusable scrolling tables. A narrowly opted-in Core helper moves the existing tooltip button outside the summary, gives schedule buttons group/pressed semantics, and makes real result tables labelled keyboard-focusable regions. It does not read/write financial inputs, storage, analytics or network data. Primary hero button contrast is corrected. The redundant floating support CTA is hidden only on opted-in pilots because it blocked a real mobile planner tab; normal Support navigation and content remain.

The retirement stylesheet import produced an incorrect root stylesheet fetch during axe parsing. Loading the same base stylesheet explicitly preserves CSS ordering and resolves that failed request. The only modification to the original CSS is the strictly checked import replacement.

Mobile chart inspection also found oversized minimum backing widths (800/900/640 pixels) squeezed charts and labels into a fraction of narrow canvases. Source-owned, opt-in changes size the backing store to the rendered width multiplied by device pixel ratio and use the shared 12px label font. Legacy non-opted-in behavior remains unchanged. Both module and classic presentation paths receive the identical guarded correction. Browser checks now measure each visible chart’s backing width and font across six viewports.

## Preservation and validation

[Independent Phase 13 output inventory](phase-14/baseline-inventory.json) and [original nine documents](phase-14/baseline-html.json) supply the comparison. The new preservation guard requires 324 previous runtime files to remain exact, permits only two pilot HTML pages, seven guide HTML pages the single import replacement and four strictly constrained chart presentation files, and verifies all 15 new Core assets and the previously missing referenced Apple icon against pinned upstream bytes. All 94 calculator JavaScript files match pinned upstream. Of the original files, 90 remain byte-for-byte exact. Four retirement presentation files change only opt-in canvas backing widths and label fonts; strict transformations are checked against independent Phase 0 hashes, including the classic fallback bundle. Financial calculations stay exact. The other 20 calculators, homepage/editorial pages, canonical URLs, sitemap, robots, redirects, upstream 404, analytics configuration and legacy Core are unchanged.

Pilot browser checks cover 320, 375, 390, 768, 1440 and 1920 widths, initial/populated states, invalid mortgage input, malformed retirement import with unchanged financial state, keyboard menu/Escape, no-JS navigation, forced colours, text enlargement and font fallback. Seven guides receive mobile/desktop content, metadata, original-anchor and axe checks. Before screenshots are retained at 390 and 1440. The [comparison gallery](phase-14/README.md) retains 102 final screenshots from the deployed preview, covering all nine migrated routes in Chromium, Firefox and WebKit, plus original before images and chart detail comparisons.

All 22 Phase 0 numerical fixtures, Budget/Retirement JSON/storage round trips and Mortgage 26-year/300-payment CSV reconciliation pass for the final candidate in both hosted source validation and on the public preview. Forty named unit tests, clean-source/build, SEO/output, editorial and system checks pass. All 354 hosted runtime files match the local final build byte-for-byte. Historical legacy-isolation cases now use unchanged FIRE/CPP/Budget routes because both pilots and their guides are opted in; strict original geometry and unopted assertions remain.

## Verified candidate and isolated demo

[Demo](https://1e526422.simplekit-preview.pages.dev) · [Retirement Planner](https://1e526422.simplekit-preview.pages.dev/retirement-planner/) · [Mortgage Calculator](https://1e526422.simplekit-preview.pages.dev/mortgage-calculator/)

Candidate: `356cfa5297ef48782b74ccbfacdb4d68b36baaa1`. [Source CI 38177198543](https://github.com/ashleysnl/simplekit-site/actions/runs/38177198543) and [preview deployment 38177218826](https://github.com/ashleysnl/simplekit-site/actions/runs/38177218826) both pass. The preview project guard confirms `simplekit-preview`, disabled production branch and only pages.dev domains. The preview excludes CNAME and uses noindex/nofollow headers and disallow robots; source production canonicals and sitemap remain unchanged.

| Verification | Result |
| --- | --- |
| Unit tests, portable build, SEO/output, preservation | Pass; 40 named tests, 22 tools, 53 sitemap URLs, 67 HTML routes, 354 runtime files |
| Pilot browsers, both source CI and deployed preview | Each run: 159 layouts, 33 clean axe audits, 27 content/metadata/anchor contracts; zero page errors or failed same-origin responses |
| Chart dimensions and shared fonts | Six widths in each of three engines; supplementary 390px/DPR2 module and classic checks pass |
| Financial and state/export regressions | 22/22 exact module fixtures; Budget/Retirement JSON/import/storage and Mortgage CSV reconciliation pass |
| Existing editorial pages | 69 preserved-content comparisons, 423 layouts, 99 clean axe states; three engines |
| Existing design system and homepage UX | Three-engine system, goals, SEO, accessibility, keyboard/reflow/fallback checks pass |
| Public preview SEO | 66 routes, 106 assets, 53 sitemap URLs and 23 documented redirect destinations verified |
| Controlled preview Lighthouse | Median performance 99, accessibility 100; LCP 2194ms, CLS 0; laboratory measurements, not real-user data |

[Provenance](phase-14/provenance.json), [runtime inventory](phase-14/build-inventory.json), [source logs](phase-14/source-job.log), [deployed-preview logs](phase-14/preview-regression/job.log), [public pilot results](phase-14/hosted/pilot-browser.json) and retained source/preview regression JSON document the evidence. Artifact ZIP SHA256 digests were checked before extracting evidence. Reference documents and evidence are excluded from the published build. Local access to pages.dev is restricted by the execution proxy; the deployed checks above ran successfully from the hosted Linux runner.

## Preserved fallback discrepancy

The forced-classic check intentionally blocks the module entry, then compares the original retained classic bundle against the refined one. Both classic versions return identical financial results and load successfully without page errors. The demo plan's classic summary reports money lasting to age 75, while the unchanged module fixtures report age 77. This discrepancy already exists in the original bundle; no financial changes were made to reconcile it during this visual phase. Treat module/classic parity as outstanding upstream work before release. [Comparison results and reproducible check](phase-14/chart-detail/results.json) preserve exact summaries; the gallery includes baseline/refined classic chart screenshots at DPR2.

## Review and rollback

### CI failure repair and early icon validation

[Run 38161416047](https://github.com/ashleysnl/simplekit-site/actions/runs/38161416047) failed after Chromium pilot checks passed: Firefox requested the existing Retirement Planner Apple-touch icon URL, but the pinned source did not contain that PNG. Upstream commit `acb5a512bb72a520fb9ba5b34656c4ee9eac9c46` supplies the icon from the existing app SVG; the site pin and preservation guards now include that one new source-owned asset. [Run 38170643100](https://github.com/ashleysnl/simplekit-site/actions/runs/38170643100) passes both required jobs with the repaired pin, including the Chromium, Firefox and WebKit checks.

Output validation now checks Apple-touch, precomposed Apple-touch, shortcut and mask icons before the browser job. Regression coverage rejects missing and empty icons, recognizes case-insensitive relation tokens, and verifies that legacy exceptions cannot apply after V2 adoption. Local source verification, build, all 40 named unit tests, SEO/output validation and both preservation guards pass.

Five unchanged pinned legacy pages still reference absent `icons/apple-touch-icon.png`: CPP, FIRE, Investment Fee, Mortgage Paydown vs Invest and RRSP vs TFSA. These exact page/asset pairs emit explicit output-validation warnings while the pages remain unopted. Missing icons on other pages, other asset paths, or pages with `data-v2-system`/`data-v2-pilot` fail validation. Repair those assets in their owning repositories before adopting V2; this change does not alter those calculators or waive the pilot browser checks.

Do not mark owner acceptance or Phase 15 complete based on these automated checks. Manual assistive-technology, real-device/native zoom and owner visual review remain open. The upstream 404 remains an intentional error page, with no claim of V2 redesign. No production, DNS or upstream-default-branch deployment occurs.

Rollback uses the three `before` pins in the transition manifest and a normal revert of the site integration commit; do not rewrite shared history. Rebuild and rerun preservation and numerical fixtures. Upstream review branches/PRs retain the proposed work regardless of whether the site pins are accepted.
