# Phase 6 — featured calculator rows

Status: `[x]`. Implementation and local/hosted automated acceptance are complete. The owner instructed Phase 6 while the mobile-fidelity review was being finalized. Work remains on temporary `feature/simplekit-v2-mobile-fidelity`, in [PR #13](https://github.com/ashleysnl/simplekit-site/pull/13) targeting `develop-v2`. This does not authorize merging or production deployment.

The homepage now presents Retirement Planner, Mortgage Calculator, Compound Interest Calculator, Budget Planner and FIRE Calculator in the reference order, immediately below the goal cards. Each row is one semantic anchor with a decorative icon, serif title, factual description, divider and chevron. The visible directory action retains access to all 22 tools. Existing goal/search behavior, the visible privacy qualification, lower homepage content and production root files remain intact.

The heading is **Featured calculators**. No usage evidence establishes popularity; this follows the plan's explicit alternative without implying rankings, endorsements or financial outcomes. Existing icons and local fonts are reused, and all destinations use validated manifest tool tokens. Only an opt-in CSS asset is added; no runtime dependency, framework or calculator logic changes.

## Verified results

- [x] 28 repository tests, portable build and all 23 source pins pass.
- [x] SEO/output and preservation guard pass: 22 calculators, 53 unchanged sitemap URLs, 67 HTML routes, 324 output files, 94 unchanged calculator JavaScript files.
- [x] Header/hero checks pass at 27 widths, including delayed fonts/images/discovery-module loading; measured CLS is 0. The discovery fallback now occupies the search bar's reserved space instead of shifting the panel during enhancement.
- [x] Search/questions, keyboard/AX/touch and no-JS/failed-module/privacy checks pass: 44 name/slug searches, 22 canonical routes, four suggested questions; maximum DOM update 9.80ms, next frame 14.90ms.
- [x] Five-row browser suite: canonical activation, keyboard focus, 44px targets, readable 320–1920px layouts, 200% text, blocked fonts/icons, forced colors and no-JS directory recovery.
- [x] Screenshot comparison at 375/390/768/1440px against the unchanged reference; review and second refinement complete.
- [x] Dedicated Cloudflare preview deployment and secure hosted regression verification.
- [ ] Owner design approval and any explicit merge approval.

Native browser-toolbar zoom, manual screen readers and real-device testing remain the existing Phase 8 follow-up. Phase 7 onboarding is not part of this implementation.

## Screenshot refinement

Initial screenshots at 375/390/768/1440px showed the intended row hierarchy, but descriptions wrapped unnecessarily and the mobile icon circles were larger than the reference proportions. A second pass uses shorter factual descriptions, 32px decorative circles/20px glyphs and 12px vertical row padding. Desktop retains 56px circles and larger type. Row anchors remain at least 44px; names and descriptions wrap between full words under text enlargement. The heading intentionally uses “Featured” rather than an unsupported “Popular” claim.

[375px rows](phase-06/featured-375.jpg) · [390px rows](phase-06/featured-390.jpg) · [Tablet](phase-06/featured-768.jpg) · [Desktop](phase-06/featured-1440.jpg) · [Browser checks](phase-06/featured-browser.json)

## Hosted candidate

[Preview](https://48daf1d5.simplekit-preview.pages.dev) · [successful run 38013211800](https://github.com/ashleysnl/simplekit-site/actions/runs/38013211800) · [deployment identity](phase-06/deployment.json) · [artifact comparison](phase-06/preview-artifact.json). Source `5532bfa2ea1d1d79df04fb7a5dd85ac2f8d577ec`; CI run `38013200655` passes. Downloaded 324-file preview artifact matches 322 ordinary local build files byte for byte; only robots/noindex headers and removed CNAME differ intentionally. Artifact SHA-256 `df426242452b3e5eb624dacf429530c39da85013d49fcace4860c8f4fe5be906`; browser evidence SHA-256 `f680aedf0379e5198de5f263460140fc7f7bcdd61b11c5cde5dcb3de83b8fc4b`.

The secure runner captured baseline/candidate at all four widths and verified 24 routes, noindex, robots and unchanged canonical URLs. All six hosted browser suites pass: 27 header widths and loading CLS 0; discovery/search/questions; trust/privacy; goal/directory navigation; all ten featured-row layouts/fallbacks; all 22 exact calculator fixtures. Persistent JSON/logs are in [hosted regression evidence](phase-06/hosted-regression/); [live 375px rows](phase-06/hosted/featured-375.jpg) and [live 390px rows](phase-06/hosted/featured-390.jpg). External analytics are stubbed; no production calculator navigation is performed by tests. Cloudflare confirms preview-only deployment, production branch disabled, no custom domain and no canonical production deployment. No main merge, production upload or DNS edit occurred.

The owner instructed Phase 7 after this implementation. It continues in the same unmerged review branch, preserving this verified Phase 6 checkpoint.
