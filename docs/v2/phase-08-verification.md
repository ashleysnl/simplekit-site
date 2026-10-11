# Phase 8 — accessibility, responsive polish and performance

Status: `[~]`. Phase 8 implementation and available automated verification are complete in the existing temporary PR #13 targeting `develop-v2`. Manual assistive-technology/device/zoom/contrast reviews and field data remain pending. No merge, production or DNS changes are authorized.

## Baseline

Runtime source `9abcee3f2a6b0eb157ae5feaacfcb6598616ea1c` (Phase 7) passes axe-core 4.10.3 WCAG 2 A/AA, 2.1 A/AA, 2.2 AA and best-practice checks in homepage, open menu, search results/empty, onboarding step/empty and directory states. Axe incomplete items require human review; a clean automated audit is not WCAG certification.

Three Lighthouse 12.8.2 cold-storage local runs at 390×844, device scale 1, mobile form factor and default simulated mobile throttling (150ms RTT, 1,638.4 Kbps throughput, 4× CPU slowdown) give performance 91/91/91, accessibility 100/100/100, LCP 2705.6/2708.1/2702.9ms, CLS 0.112511 on each run. Median LCP 2705.6ms and CLS 0.112511 fail the roadmap thresholds. Analytics origins are blocked for repeatability; site analytics are unchanged. Loopback lacks Cloudflare's transport compression/cache and these are lab results, not real-user INP or field p75 data.

Trace identifies delayed navigation enhancement shifting the whole main region, eight blocking CSS requests, and a late bold body-font request. Phase 7's deterministic delayed font/image/index test did not delay the navigation script, so its CLS 0 did not establish cold-load CLS. Phase 8 uses cold Lighthouse and retains that earlier test without claiming it covered this case.

## Implementation and local verification

The portable build now publishes one ordered homepage CSS bundle without altering shared/calculator CSS and inserts the existing navigation script at the header boundary before first layout. Ordinary navigation stays visible when JavaScript is disabled. Module dependencies are preloaded. The first refinement improved Lighthouse performance to 95/96 and CLS to 0, but median LCP 2553.8ms still missed the 2500ms requirement; subsequent refinements and hosted measurements resolve that performance blocker.

The directory gains a skip link, a current-page navigation announcement, readable focus outlines and 44px link targets. New styles are scoped to V2 homepage/directory; reduced-motion handling covers retained lower sections as well. Native radio inputs retain the full labelled row as their touch target. The onboarding flow is now a named section, fixing axe's uncertain ARIA-name finding for a generic div.

The search field now uses the existing control-border token rather than the decorative card border. Its boundary against the white field improves from 1.30:1 to 3.44:1, exceeding the 3:1 non-text contrast target without changing dimensions, text or image composition. The browser suite measures the rendered border/background pair. A Chromium touch-emulation path directly taps onboarding choices/actions; this is not a real-phone or virtual-keyboard test.

WOFF2 containers reduce the three used homepage fonts from 162,480 to 125,520 bytes (22.7%). All four files retain the WOFF fallback and SIL OFL; cmap/advance metrics are verified unchanged. [Font identities and sizes](phase-08/fonts.json). Conversion uses optional fontTools only during asset maintenance; the Node/Linux build does not need Python or a new package dependency.

The preview server now negotiates ordinary Brotli/gzip text transport, matching the CDN's transport rather than inflating local lab payloads. Three final local runs give performance 99/99/99, accessibility 100/100/100, LCP 1959.0/1959.0/1957.0ms and CLS 0. This includes the transport change and must not be presented as the effect of client changes alone. The uncompressed first refinement was 95–96 with CLS 0 and LCP around 2554ms. Final hosted before/after runs below use the same CDN and lab settings for a fair transport comparison. [Final local lab settings/results](phase-08/local/lighthouse-summary.json).

32 repository tests and portable build/source, SEO, output and preservation checks pass: all 23 pins verified, all 22 calculators and 53 sitemap URLs preserved, 67 HTML routes, 333 artifact files, 94 calculator JavaScript files identical to pinned upstream. New test-only browser tools live in a temporary prefix and are excluded from deployment.

## Inherited tool-page findings

[Separate axe report for all 22 calculators](phase-08/tool-accessibility-findings.json) records 47 rule/page findings. Serious/critical findings occur on Retirement Planner (target size), Emergency Fund (contrast), Budget Planner (hidden focus), Debt Payoff (nested interactive controls), Investment Fee (prohibited ARIA), Mortgage (required ARIA children), and Contractor Rate (labels). Other findings concern inherited landmarks/regions. None of these pages consumes the V2 stylesheet/modules, and calculator/Core pins and copied HTML/CSS/JS are unchanged. Fix them through reviewed upstream calculator/Core changes, with pin updates and calculator regression checks; this task does not edit copied tools. These findings are not a claim that those tools passed WCAG.

## Required manual review — still pending

| Combination/check | State | Review procedure |
| --- | --- | --- |
| VoiceOver + Safari on macOS/iOS | Incomplete; unavailable in Linux | Navigate landmarks/headings; open/close menu; search and listen to result counts; skip/back/restart onboarding; confirm step announcements, labelled radios, named results and close focus return. |
| NVDA + Firefox on Windows | Incomplete; unavailable in Linux | Repeat those paths in browse/focus modes; confirm labels, radio arrow keys, announcements and all ordinary tool links. Record OS/browser/AT versions and any defect. |
| Real iPhone Safari and Android Chrome | Incomplete; devices unavailable | Check portrait/landscape, tapping/virtual keyboard, menu dismissal, search clear and flow actions, scroll/focus visibility and text enlargement. |
| Native browser 200%/400% toolbar zoom | Incomplete; not simulated as a manual test | Check 1280px at 400% against 320 CSS px and enlarged text without clipping or two-dimensional scrolling. Automation checks equivalent CSS-width reflow and 200% root text separately. |
| Human contrast/reading review | Incomplete | Review axe color-contrast incomplete targets, image overlays and focus indicators. The existing conservative hero contrast bounds are separately checked by the header suite. |
| Field p75 LCP/INP/CLS | Incomplete; no field dataset | Monitor existing approved field sources once available; target ≤2.5s/≤200ms/≤0.1. Do not add collection of financial inputs or onboarding answers. |

Manual VoiceOver/Safari, a second documented real screen-reader/browser combination, native toolbar zoom and real iPhone/Android tests cannot be performed by Playwright on Linux. These acceptance items remain pending. WebKit automation must not be labelled Safari/VoiceOver coverage. No field data is available and no additional analytics is introduced.

## Hosted refinement log

The first Phase 8 staging commit accidentally omitted the two landing templates; CI/build checks failed before deployment. A normal follow-up commit preserved shared history and included them. Runtime `3c0e72d5a14710de697b040891664f09ac1cc692` passes CI/build/SEO and hosted 24-route checks; its preview upload succeeds, but run `38064386344` exposes a timing race in a pre-existing rapid-resize focus test. `setViewportSize` does not await the application's matchMedia handler. The test now waits for the expected navigation disclosure state before making the same strict focus assertions; no assertion or threshold is weakened. Run `38064705068` exercises that correction, followed by the final contrast/touch refinement.

The secure Phase 7 baseline on the same CDN/settings has median performance 94, accessibility 100, LCP 2626.3ms and CLS 0.112511 across three runs; raw settings/results are retained in the hosted artifact. This confirms the cold-navigation issue is intermittent rather than disproving it when a single faster load yields CLS 0. Final Phase 8 hosted measurements remain pending at this checkpoint.

Runs `38064705068` and `38065077127` complete all seven regression suites, then reach Firefox's 32,767px screenshot encoder limit during 200% text testing. Screenshot capture now records viewport/component shots for documents over 16,000px, while retaining full-document glyph/target checks and reporting capture mode. No geometry assertion is relaxed.

Checkpoint run `38065658115` passes all three engines, 78 reflow/fallback layouts, 24 axe states, all seven regression suites and three Lighthouse runs (median performance 98, accessibility 100, LCP 2289.6ms, CLS 0). Screenshot review still finds About/Support directory navigation labels overlapping at 200% text: the viewport-only text check did not detect that overlap. The scoped directory grid now uses a rem-based minimum that reduces its column count when text grows, retaining three columns on ordinary phones. Glyphs are now checked against their interactive control bounds in every layout, as well as the viewport. All 26 local Chromium layouts and eight axe states pass after that correction; final hosted verification repeats the stricter checks.

Run `38066917456` passes all seven regressions and the stricter Chromium checks, then identifies a Firefox-only enlarged-text footer defect: “Understanding Net Worth” extends outside its link control. Scoped footer wrapping and minimum-width safeguards now preserve that label at 200% text. The full strict three-engine suite is rerun against runtime `997a24480f9bc1c4dfc4abee0371b8bf9f0621b0`; no glyph-bound assertion is removed or relaxed.

## Before/after comparison

The approved premium composition remains intact: no hero redesign, smaller text or reduced touch targets is used to improve the score. At ordinary mobile widths, the visible changes are a stronger search boundary and consistent focus treatment. Cold loading no longer shifts the page when the navigation enhancement arrives. The directory navigation and retained homepage footer wrap safely with enlarged text. The same coastal image, curated tool links, optional onboarding and all 22 calculators remain available.

| Check | Before | Phase 8 change |
| --- | --- | --- |
| Cold navigation layout | Deferred enhancement can shift the whole main region | Enhancement runs at the header markup boundary; no-JS links remain visible |
| Critical styles/fonts | Eight stylesheet requests; WOFF only | Ordered CSS bundle; metric-preserving WOFF2 with WOFF fallback |
| Search boundary | Decorative border, 1.30:1 against white | Control border, measured above 3:1 in all engines |
| Directory keyboard/touch access | No focused skip destination; uneven small links | Skip link, visible focus and 44px targets |
| Enlarged text | Directory nav and Firefox footer labels can overlap/escape controls | Responsive nav column minimum and safe footer wrapping; glyph-bound assertions |

Hosted screenshots at 375/390/768/1440px are retained in [before](phase-08/hosted/before/) and [after](phase-08/hosted/after/). Cross-engine enlarged-text screenshots and full report are in [accessibility evidence](phase-08/hosted/phase-08/accessibility/). These automated captures do not substitute for the pending human/device reviews above.

## Final hosted verification — 2026-10-10

Runtime `997a24480f9bc1c4dfc4abee0371b8bf9f0621b0` passes [repository CI](https://github.com/ashleysnl/simplekit-site/actions/runs/38067761497) and [full hosted validation](https://github.com/ashleysnl/simplekit-site/actions/runs/38067758043). [Verified demo](https://4bb45d9d.simplekit-preview.pages.dev). All seven prior regression suites pass, including 93 onboarding answer/skip paths, all 22 exact calculator fixtures and 24 HTTP routes. Homepage/directory canonicals and sitemap URLs remain unchanged. Screenshot review confirms the ordinary 390px composition is preserved and enlarged Firefox directory navigation no longer overlaps.

Chromium 141.0.7390.37, Firefox 142.0.1 and WebKit 26.0 each pass 26 responsive/fallback layouts, eight axe states, keyboard/focus, reduced-motion and no-JS checks: 78 layouts and 24 states total, zero changed-UI axe violations, console errors or failed HTTP responses. Strict control-glyph bounds pass in every layout, including the Firefox footer at 200% text. Search border contrast is 3.44555:1 in all three engines; Chromium touch-emulated onboarding also passes. This is automation, not Safari/VoiceOver or real-phone testing.

Three cold Lighthouse 12.8.2 runs use the settings documented above, with the same hosted CDN for baseline and candidate:

| Metric | Phase 7 baseline runs | Phase 8 final runs | Baseline → final median |
| --- | --- | --- | --- |
| Performance | 95 / 96 / 93 | 99 / 99 / 99 | 95 → 99 |
| Accessibility | 100 / 100 / 100 | 100 / 100 / 100 | 100 → 100 |
| LCP (ms) | 2603.3 / 2606.9 / 2594.8 | 1976.8 / 2130.1 / 2127.2 | 2603.3 → 2127.2 |
| CLS | 0 / 0 / 0.112511 | 0 / 0 / 0 | 0 → 0 |

The baseline's intermittent navigation shift appears in one of these three runs and in two runs of the earlier checkpoint. Do not claim every baseline run shifted or that final lab results establish field p75/INP. All final lab thresholds pass. [Baseline settings/results](phase-08/hosted/baseline-lighthouse/lighthouse-summary.json), [final settings/results](phase-08/hosted/phase-08/lighthouse/lighthouse-summary.json). Full six JSON/HTML Lighthouse reports remain in the workflow's browser artifact; compact reports/screenshots are committed here.

[Deployment identity](phase-08/deployment.json) confirms environment `preview`, production branch `__production_disabled__`, only the dedicated pages.dev domain and no canonical production deployment. [Site artifact identity and comparison](phase-08/preview-artifact.json) records SHA-256 `f8126abb2ce25253f20f83361d5308182e0eb8c022c0e11f270750406ee0162b`: 333 files; all 331 ordinary files byte-identical to the local build. Only CNAME removal, disallow-all robots and noindex/nofollow headers differ intentionally. [Browser artifact identity](phase-08/browser-artifact.json) records SHA-256 `2f3f475dedb3608a9c951f134f6b8edefb805dff678da0425947e7a29d9dcecf`.

Main remains `ca7826db75cb4353488786aab80857b3a71c1be1`; `develop-v2` remains `6e3acc72506b40ec11c1bd0015c6eee2ca473213`. Production root pages, source pins, calculator logic, production deployment and DNS are unchanged. The final tracking/evidence commit changes documentation only; the preview intentionally identifies the verified runtime commit above. PR #13 remains open and unmerged pending explicit approval.
