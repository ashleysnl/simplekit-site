# iPhone 16 Pro homepage fidelity refinement

Status: `[~]` — implementation prepared; after screenshots and updated demo are blocked by aborted browser/network tool calls. This is not visual acceptance or a production release.

Target: **402 × 874 CSS pixels, DPR 3**, using the existing [approved vision](../../design-reference/simplekit-v2-target.png). The last verified functional demo remains https://c5817f32.simplekit-preview.pages.dev, source `818b22501fa3225032946a389207442a5ffbafc7`; it does not include these new styling changes.

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
- [ ] Capture the new 402px screenshot and compare it with the vision; record measured density improvements.
- [ ] Check 375/390/402/768/1440px layouts, 200% text, search, suggested questions, menu and guided-start keyboard behavior. Check axe contrast with the clearer image, console/network errors and 44px targets.
- [ ] Refine any remaining discrepancies using actual after screenshots.
- [ ] Upload the exact verified candidate through the existing manual isolated preview workflow; record immutable URL and deployed verification.
- [ ] Owner visual acceptance. Production approval remains separate.

Browser execution requires the execution tool's network/socket permission. Repeated commands with that permission were aborted before they ran; no successful after capture or demo upload is claimed. Retained homepage and performance evidence from earlier candidates cannot certify this new CSS. The prior Take Home Pay WebKit 200% comparison-table finding also remains tracked separately; its source-owned containment edit is preserved uncommitted in that source checkout and is not integrated by this homepage task.
