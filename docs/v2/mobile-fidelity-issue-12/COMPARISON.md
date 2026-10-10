# Issue #12 — mobile fidelity comparison

Approved target: `docs/design-reference/simplekit-v2-target.png` (851 × 1848; immutable original). Baseline source: develop-v2 `6e3acc72506b40ec11c1bd0015c6eee2ca473213`; implementation bytes match the verified Phase 5 preview artifact, deployed from `882b745cf879c70f852a8cd665f0ec0e3eca2b0a`. Correct immutable preview: https://e9070fe2.simplekit-preview.pages.dev (the issue's shorter hostname was a typo).

## Baseline completed before implementation

`before/` contains 375/390/768/1440px full-page and viewport screenshots and measured DOM geometry. Chromium cannot securely navigate the hosted preview: `ERR_CERT_AUTHORITY_INVALID`; earlier secure HTTP probes returned 403 from this execution environment. No TLS checks were disabled. Screenshots therefore render the matching portable build on loopback, with external analytics stubbed, and are **not claimed as live hosted screenshots**. Hosted visual verification remains a separate check.

| Discrepancy | Baseline at 375 / 390px | Reference-directed correction |
| --- | --- | --- |
| Header and hero whitespace | Header 100px; hero content starts at 132px; 80px below discovery | Compact header, earlier copy, less trailing hero padding; keep menu ≥44px |
| Coastal image barely visible | White overlay opacity .98–.88 across full image | Preserve a light text area, expose coastal trees/water on right, fade at discovery |
| Discovery card disproportionate | 352px panel; visible help, duplicate count and directory CTA; 64px search | Integrated search/panel, minimum 44px question rows, screen-reader help/status, directory CTA when searching or JS unavailable |
| Trust section pushes goals far below hero | 511px, including 266px stacked indicators and 181px disclosure | Three compact indicators at normal mobile sizes; retain readable privacy/analytics qualification and links |
| Goal layout changes between nearby phones | Goals start at 1447 / 1448px; one column at 375, two at 390 | Bring goals higher; consistent two-column cards where full words fit, single-column enlarged text/320px fallback |

The reference is a composition guide, not a reason to scale text/touch targets down to its raster's half-size. Keep readable type and 44px controls. Existing desktop hierarchy and later roadmap sections remain intact. Issue #12 explicitly calls for one focused fidelity pass before later phases; popular-calculator rows and guided onboarding remain in their original phases.

## Iteration log

Iteration 1: reviewed both phone screenshots plus tablet/desktop. Goals moved to 848 / 812px and the panel shrank to 222px. Five remaining discrepancies: (1) goal CTA still adds a separate row, (2) goal padding overrides loaded earlier than Phase 5 CSS, (3) trust descriptions wrap excessively, (4) disclosure links fragment inline text into large gaps, (5) goal cards retain excessive description height. Iteration 2 addresses these with the CTA on the eyebrow row, correctly ordered scoped rules, shorter truthful trust descriptions, a separate accessible disclosure-link row, and tighter card rhythm. Full-page differences below the implemented goal section are tracked roadmap scope, not invented replacements.

Iteration 3: fixed fractional rounding at the 375px breakpoint and a 2px trust-label overflow. Browser testing found 200% text overflow in the retained lower homepage grid; scoped minimum widths/wrapping and narrow trust icons correct it. Search testing also found a photo-crop change when results expand at wide widths; explicit photo height now keeps the crop independent of result count.

Iteration 4 (final local review): moved the full, visible privacy/analytics/planning disclosure immediately below the goal cards. The truthful trust indicators lead directly into goals. No disclosure content or links are hidden. Reviewed 375/390/768/1440 captures in `after/` against the unchanged reference.

| Measured element | Before 375 / 390px | After 375 / 390px |
| --- | --- | --- |
| Header height | 100 / 100px | 85 / 85px |
| Question panel | 352 / 352px | 222 / 222px |
| Trust starts | 936 / 937px | 585 / 587px |
| Goals section starts | 1447 / 1448px | 680 / 683px |
| First goal cards start | 1579 / 1580px | 796 / 799px |
| Goal columns | 1 / 2 | 2 / 2 |

Remaining reference differences: accessible 44px question rows and readable typography take more space than the raster's half-size proportions; the existing coastal asset differs from the exact reference coast; long goal names wrap without splitting words; the full privacy disclosure remains visible below goals; popular-calculator rows and guided onboarding remain the next roadmap phases. No numerical pixel-match or owner-approval claim is made.

## Validation

28 repository checks pass, including rejection of production/lookalike hosts by the hosted-test guard. All 23 source pins, portable build, SEO/output and preservation guard pass: 22 calculators, 53 unchanged sitemap URLs, 67 HTML routes, 323 output files and 94 byte-identical calculator JavaScript files. No lint script is configured. Production pages, analytics configuration, source pins, canonicals and sitemap are unchanged.

Local browser checks pass: 27 header/menu widths; 44 exact name/slug searches plus intent/edge cases; four question destinations; nine trust/fallback checks and privacy/methodology keyboard navigation; six goal layouts and native fragment/direct/reload/history routes; all 22 unique directory destinations; foundational specimens; 22 exact calculator fixtures; all-calculator/Core smoke including mortgage recalculation. Zero page errors/failed local requests. Search DOM 9.30ms and next frame 13.70ms (100ms budget). Keyboard/AX/touch, no-JS, blocked assets, forced colors, delayed loading and 200% text/geometry tested. Real-device, manual screen-reader and native browser-toolbar zoom are not claimed.

## Repeatable screenshot review

After `npm run build` and starting `PORT=8003 npm run preview`, use the existing isolated Playwright installation (no new runtime dependencies):

```sh
NODE_PATH=/tmp/simplekit-v2-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium SIMPLEKIT_PREVIEW_URL=http://127.0.0.1:8003 SIMPLEKIT_EVIDENCE_DIR=/tmp/simplekit-fidelity-review node tests/v2-fidelity-screenshots.cjs
```

Review four viewport/full-page captures and geometry against the approved target, list the largest remaining discrepancies, refine and repeat. Hosted checks require explicit `SIMPLEKIT_HOSTED_PREVIEW=1` and HTTPS under the dedicated `simplekit-preview.pages.dev` project. Production/lookalike hosts are rejected. The manual preview workflow captures previous/candidate deployments from GitHub's runner, checks 24 hosted routes/noindex/canonicals/robots/CNAME isolation, and runs header/search/trust/goals/all-22-fixture browser suites. Browser dependencies remain temporary and test-only. Live results will be recorded after that run completes.
