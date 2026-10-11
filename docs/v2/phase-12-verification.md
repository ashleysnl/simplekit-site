# Phase 12 — Unified V2 design system and shared site shell

Status: `[x]`. System v1, shared components and responsive review references are implemented and verified in all three hosted browser engines. No editorial/calculator migration or owner design acceptance is claimed.

## Implemented contract and reference pages

[System v1](phase-12/DESIGN_SYSTEM.md) extends the existing Phase 1 type/space/colour/surface/icon/state tokens through explicitly scoped `assets/v2/system.css`. `.sk-v2[data-v2-system="1"]` is the opt-in boundary. Existing foundation values, homepage bundle and legacy pages remain unchanged. `assets/v2/shell.js` enhances only opted-in disclosure navigation and adds no financial-input, storage, analytics or network behavior.

[Page-family specifications](phase-12/PAGE_FAMILIES.md) link the approved homepage reference and define responsive homepage/directory/editorial/calculator conventions. [Core/upstream adoption plan](phase-12/CORE_MIGRATION.md) preserves all 23 pins and assigns source-reviewed changes to later phases. Site-owned build helpers render header/normal menu links, skip link, breadcrumbs, footer and canonical related content; they are exemplars for reviewed Core integration, not an unreviewed replacement Core API.

Three reproducible review-only HTML documents cover editorial reading, interactive calculator presentation and the complete component/state workbench. They include labelled currency/percent/number/select/radio/checkbox/switch/slider controls, help/validation, KPI/chart/data table, disclosure, feedback, disabled/empty/loading and sample export states. Fixed illustrative data does not replace any financial calculation. Reference HTML/controller live under docs and are excluded from the build, sitemap and public routes.

The first screenshot review refined mobile article navigation order and checkbox/radio presentation: navigation now precedes reading in DOM/mobile order and sits alongside on desktop; compact glyphs retain 44px associated-label targets. Forced-colour charts have an explicit contrasting backing and equivalent descriptive/table data. Versioned adoption rules and purpose-specific functional deviations are documented.

## Validation contracts

- `tests/v2-system-browser.cjs`: 33 layouts per engine at 320/375/390/768/1440/1920 plus no-JS, dark/forced-colour, blocked-font and 200% text modes. Strict page overflow, actual text-glyph bounds and 44px activation checks; 11 axe states per engine; keyboard skip/menu/Escape/resize focus, native disclosure/switch/slider, invalid/corrected/reset input states, real sample CSV download and print behavior. Reference interactions must add no requests or persisted data.
- Four legacy pages (home, long article, Mortgage and Retirement) load the new assets without opting in; exact geometry/type/colour/control comparisons must remain unchanged.
- `tests/v2-system-artifact.cjs`: all 335 previous runtime file sizes/hashes remain exact; only `assets/v2/system.css` and `assets/v2/shell.js` may be added. No reference HTML/controller is published.
- Existing source/preservation guard, repository tests, portable build, SEO/output, all 22 exact numerical fixtures and state/import/export/CSV checks remain mandatory. The new isolated read-only CI job executes these and Chromium/Firefox/WebKit references; no deployment environment/secrets.

Local Firefox startup encountered Linux sandbox/cache limitations (`uid_map` read-only and no writable font/dconf caches). No assertion is removed or browser result invented. Hosted Ubuntu validation supplies the standard browser dependencies and runs the full three-engine suite. Manual VoiceOver/NVDA, devices, native zoom, human contrast and owner acceptance remain explicit future checks; automation is not WCAG certification or design approval.

## Local verification evidence

[38 repository tests](phase-12/local/tests.log), [23 pinned source checks](phase-12/local/sources.log), [portable build](phase-12/local/build.log), [SEO](phase-12/local/seo.log), [output](phase-12/local/output.log) and [calculator/Core preservation](phase-12/local/preservation.log) pass. All 22 exact [calculator fixtures](phase-12/local/calculator-results.json) and [JSON/storage/CSV checks](phase-12/local/state-export.log) pass.

[Chromium results](phase-12/local/browser.json): 33 layouts, 11 axe states with zero violations, keyboard/validation/reset/slider/switch/sample export/print, no new reference-action requests or persisted inputs, and four exact legacy isolation comparisons pass. Expected blocked-font responses are isolated fallback tests; inherited external analytics/support requests are stubbed only in legacy/tool checks. Ten declared [text/border/focus/chart contrast pairs](phase-12/local/contrast.json) meet their 4.5:1 text or 3:1 functional thresholds; human contrast review remains separate.

Two builds match all 337 file sizes/hashes: [inventory](phase-12/build-inventory.json), SHA-256 `639d1c6a0ef62b5a9ee082a2531c1287ff1277e408875e35d2a7de925111b84c`. [Runtime isolation proof](phase-12/local/artifact-isolation.log) confirms all 335 previous files exact and only the two opt-in assets added. Reference HTML regeneration is also byte-identical.

The action audit warms four local font faces before observing requests: axe's typography probe can otherwise load an unused local display font. This is test setup only and keeps the strict zero-action-request assertion. The first hosted run was superseded after that setup correction. Run 38091093894 passed Chromium but timed out in Firefox; diagnostic run 38093807294 identified a no-JS `document.fonts.ready` Promise wait. Font status is now polled synchronously from Node with a deadline, preserving no-JS and geometry assertions. Failed/cancelled runs are not counted as passing. A local WebKit launch also lacks the required system libraries; hosted Ubuntu supplies them.

## Hosted verification and visual evidence

[Hosted run 38094002072](https://github.com/ashleysnl/simplekit-site/actions/runs/38094002072) passes both `validate` and `design-system` at source `2834be9370921bec4b52d188890c6df1df125015`. Chromium 141.0.7390.37, Firefox 142.0.1 and WebKit 26.0 each pass 33 layouts, 11 axe states with zero violations, all reference interactions and four unchanged legacy-page comparisons: **99 layouts, 33 clean axe states, 12 isolation checks**. [Full browser evidence](phase-12/hosted/browser.json) retains axe incomplete/manual-review findings rather than treating them as automatic passes.

The [90-image gallery](phase-12/GALLERY.md) covers 375/390/768/1440, no-JS, forced colours, dark preference, font fallback, 200% text, open menu, invalid input and print. Review of mobile editorial/calculator layouts, desktop reading/form hierarchy and enlarged-text states confirms consistent spacing and usable local table scrolling; native controls retain engine-specific styling. This is an implementation review, not owner acceptance or proof of final migrated-site fidelity.

All [22 hosted calculator fixtures](phase-12/hosted/v2-browser-result.json), [state/import/export/CSV checks](phase-12/hosted/release-regression.json), and source/build/SEO/output checks pass. [Hosted build reproducibility](phase-12/hosted/build-reproducibility.json) confirms all 337 build files match the repeated local inventory exactly. Downloaded evidence ZIP SHA-256: `665769bf1e929dbed18e9e0550ad1bda1404344555e9e23a65cc345abd005598`; build ZIP SHA-256: `f05e04de99e8ab8f47a83c40112113c8b9c92cf92ac2998f7a8225e46bb59410`. Evidence is retained in the repository, beyond temporary Actions retention.

## Protected workflow and remaining scope

Develop-v2 was fetched and fast-forwarded to the owner-expanded roadmap commit `dd72499d7db3170d6bb7a0eadaaa8f469e3d1eff`. Previous completed work remains in open PR #13; the next phase continues on its existing temporary branch, `feature/simplekit-v2-mobile-fidelity`, without creating another branch or inferring merge approval. Main and production stay at `ca7826db75cb4353488786aab80857b3a71c1be1`. No deployment, DNS, upstream pin or financial-source mutation occurs.

The [interim homepage demo](https://68d6205d.simplekit-preview.pages.dev) still shows the Phase 10 runtime; these review-only references are not deployed. Phase 13 migrates site-owned editorial/support pages after this foundation is verified; Phases 14–15 migrate calculator interiors through reviewed upstream changes. Inherited overflow/accessibility/retired-fragment findings remain recorded until addressed. Phases 16–18 and final production approval are incomplete.
