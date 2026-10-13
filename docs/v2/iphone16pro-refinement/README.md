# iPhone 16 Pro homepage fidelity refinement

Status: `[~]` — implementation uploaded and deployed functionality verified; owner visual acceptance and complete responsive/accessibility review remain pending. Production is unchanged.

Target: **402 × 874 CSS pixels, DPR 3**, using the existing [approved vision](../../design-reference/simplekit-v2-target.png). The current review demo is https://b1364470.simplekit-preview.pages.dev, source `77664662f9b1be9eb5ff68b32d880097e952e0a5`. Shared alias: https://codex-preview.simplekit-preview.pages.dev.

## Baseline measured before editing

[Original iPhone viewport](before/iphone16pro-viewport.png) · [Geometry](before/geometry.json)

| Component | Top | Height |
| --- | ---: | ---: |
| Header | 0px | 85px |
| Hero copy | 101px | 192px |
| Search and questions | 313px | 278px |
| Trust strip | 615px | 96px |
| Goal heading | 734px | 78px |
| Four goal cards | 827px | 189px |
| Featured calculators | 1,031px | 452px |
| Guided-start panel | 1,483px | 194px |

The four goal cards extend below the first 874px screen. The prior mobile gradient stays 90% opaque through 80% of the image width, hiding most of the coast.

## Prepared refinement

- Tighten header, hero spacing and mobile headline proportions; preserve the reference's two-line headline intention and search input's 16px text.
- Reduce the mobile image wash to 56% opacity at 60% width and 8% at the right edge. Reframe the existing high-resolution coast, with a shorter fade toward the discovery panel. No image asset is replaced or generated.
- Compact question-panel padding while retaining the four 44px controls, clear search and live result semantics.
- Tighten trust text, goal cards, featured rows and the guided-start panel. Align the directory link beside the goal title and keep the guided-start button beside its copy on normal mobile text sizes.
- Keep desktop rules and calculator source pins unchanged. Rem-based breakpoints retain stacked layouts under enlarged text.

## Verification

- [x] Capture and measure the original page at the target viewport before substantive changes.
- [x] Portable build with all 23 pinned sources and 22 calculators.
- [x] Existing repository unit tests, SEO and output validation; unchanged 53 sitemap URLs and canonical host.
- [x] Capture the new 402px screenshot and compare it with the vision; record measured density improvements below.
- [ ] Check 375/390/402/768/1440px layouts, 200% text, search, suggested questions, menu and guided-start keyboard behavior. Check axe contrast with the clearer image, console/network errors and 44px targets.
- [ ] Refine any remaining discrepancies using actual after screenshots.
- [x] Upload the prepared candidate through the existing manual isolated preview workflow; verify deployed bytes and calculator functionality. Full visual acceptance remains separate.
- [ ] Owner visual acceptance. Production approval remains separate.

Browser execution requires the execution tool's network/socket permission. Repeated commands with that permission were aborted before they ran; no successful after capture or demo upload is claimed. Retained homepage and performance evidence from earlier candidates cannot certify this new CSS. The prior Take Home Pay WebKit 200% comparison-table finding also remains tracked separately; its source-owned containment edit is preserved uncommitted in that source checkout and is not integrated by this homepage task.

## Successful review upload

[Preview workflow 38417515799](https://github.com/ashleysnl/simplekit-site/actions/runs/38417515799) succeeds for source `77664662f9b1be9eb5ff68b32d880097e952e0a5`. All 22 exact financial fixtures pass on the public demo, with zero page errors or failed same-origin requests. JSON import/export and storage reload, mortgage payment/CSV reconciliation and retirement loading-path parity pass. The immutable URL and shared alias match all 379 ordinary artifact files; preview noindex headers and disallowed robots remain intact.

[New iPhone screenshot](after/iphone16pro-viewport.png) · [Measured geometry](after/geometry.json)

| Component | Before | After |
| --- | ---: | ---: |
| Header height | 85px | 68px |
| Four goal cards start | 827px | 688px |
| Four goal cards end | 1,015px | 838px |
| Featured calculators start | 1,031px | 850px |
| Guided-start panel end | 1,678px | 1,339px |

All four goal cards now fit inside the 874px target screen. The composition through the guided-start panel is approximately 20% shorter, with the coast visible along the right of the hero. The owner should review this exact immutable demo before further refinement or production discussion. Earlier aborted calls describe the preparation history and no longer block this review upload.
