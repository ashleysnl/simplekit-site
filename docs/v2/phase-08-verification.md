# Phase 8 — accessibility, responsive polish and performance

Status: `[~]`. Owner authorized Phase 8 in the existing temporary PR #13 targeting `develop-v2`. No merge, production or DNS changes are authorized.

## Baseline

Runtime source `9abcee3f2a6b0eb157ae5feaacfcb6598616ea1c` (Phase 7) passes axe-core 4.10.3 WCAG 2 A/AA, 2.1 A/AA, 2.2 AA and best-practice checks in homepage, open menu, search results/empty, onboarding step/empty and directory states. Axe incomplete items require human review; a clean automated audit is not WCAG certification.

Three Lighthouse 12.8.2 cold-storage local runs at 390×844, device scale 1, mobile form factor and default simulated mobile throttling (150ms RTT, 1,638.4 Kbps throughput, 4× CPU slowdown) give performance 91/91/91, accessibility 100/100/100, LCP 2705.6/2708.1/2702.9ms, CLS 0.112511 on each run. Median LCP 2705.6ms and CLS 0.112511 fail the roadmap thresholds. Analytics origins are blocked for repeatability; site analytics are unchanged. Loopback lacks Cloudflare's transport compression/cache and these are lab results, not real-user INP or field p75 data.

Trace identifies delayed navigation enhancement shifting the whole main region, eight blocking CSS requests, and a late bold body-font request. Phase 7's deterministic delayed font/image/index test did not delay the navigation script, so its CLS 0 did not establish cold-load CLS. Phase 8 uses cold Lighthouse and retains that earlier test without claiming it covered this case.

## Implementation and local verification

The portable build now publishes one ordered homepage CSS bundle without altering shared/calculator CSS and inserts the existing navigation script at the header boundary before first layout. Ordinary navigation stays visible when JavaScript is disabled. Module dependencies are preloaded. The first refinement improves Lighthouse performance to 95/96 and CLS to 0, but median LCP 2553.8ms still misses the 2500ms requirement; further refinement and hosted verification remain required.

The directory gains a skip link, a current-page navigation announcement, readable focus outlines and 44px link targets. New styles are scoped to V2 homepage/directory; reduced-motion handling covers retained lower sections as well. Native radio inputs retain the full labelled row as their touch target. The onboarding flow is now a named section, fixing axe's uncertain ARIA-name finding for a generic div.

WOFF2 containers reduce the three used homepage fonts from 162,480 to 125,520 bytes (22.7%). All four files retain the WOFF fallback and SIL OFL; cmap/advance metrics are verified unchanged. [Font identities and sizes](phase-08/fonts.json). Conversion uses optional fontTools only during asset maintenance; the Node/Linux build does not need Python or a new package dependency.

The preview server now negotiates ordinary Brotli/gzip text transport, matching the CDN's transport rather than inflating local lab payloads. Three final local runs give performance 99/99/99, accessibility 100/100/100, LCP 1959.0/1959.0/1957.0ms and CLS 0. This includes the transport change and must not be presented as the effect of client changes alone. The uncompressed first refinement was 95–96 with CLS 0 and LCP around 2554ms. Hosted before/after runs will use the same CDN and lab settings for a fair transport comparison. [Final local lab settings/results](phase-08/local/lighthouse-summary.json).

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
