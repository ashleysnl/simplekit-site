# SimpleKit v2 Phase 1 — foundations and asset evidence

Branch: `feature/simplekit-v2-phase-1`, based on Phase 0 evidence commit `0e3d0cc747f5a4d07e4747d0460bb67e6d954c1d` ([PR #7](https://github.com/ashleysnl/simplekit-site/pull/7)). Owner explicitly directed Phase 1 on 2026-10-09, clearing the roadmap review pause. This records execution authorization, not a GitHub approval or production release permission.

Phase 1 technical acceptance checks pass. The generated coastal image remains a **visual-review candidate**, so the image approval task and overall phase stay `[~]`. No Phase 2 layout/menu implementation, production merge or deployment occurred.

## Implemented contract

| Foundation | Location / decision |
| --- | --- |
| Opt-in styling | `assets/v2/foundations.css`; every rule scoped to `.sk-v2` except four uniquely named `@font-face` definitions. Neither `assets/site.css` nor its 37 existing consumers changed. No current template loads the new stylesheet. |
| Colors | Canvas `#fcfcfb`, white surface, navy `#101b46`, slate `#52627c`, blue `#0759d9` / hover `#0349b6`; teal `#006f62`, amber `#8d4b08`, purple `#6530bc`, each with pale icon-disc tint. Decorative borders are light; search/control boundaries use `#7e8ba1`. |
| Typography | Local SimpleKit Display and SimpleKit Sans families, regular 400/bold 700. Display: Georgia/Times serif fallbacks; interface: Segoe UI/Arial sans-serif fallbacks. Fluid hero 2.5–4.75 rem, section 1.75–2.75 rem, small title 1.25–1.625 rem; body 1 rem, supporting .9375 rem, eyebrow .8125 rem. These are authored choices, not measured mockup values. |
| Geometry | .25/.5/.75/1/1.5/2/3/4.5 rem spacing, fluid 1–3 rem gutters; .75/1.25/1.75 rem and pill radii; two shadow levels; 72 rem maximum content, 40 rem copy measure; 44 px minimum controls, 24 px icons, 56 px discs, 3 px focus ring/offset. |
| Breakpoints | Cards 390 px, tablet 768 px, desktop 1024 px, implemented as literal media queries; custom breakpoint tokens document those decisions (CSS variables cannot substitute media-query widths). Cards use one column below 390 px. |
| Component foundations | Container/section/stack, headings/eyebrows/supporting copy, white panels, primary/quiet buttons, search field, suggested-question/calculator rows, goal cards, trust grid, guided panel, dialog shape, media sizing and visually hidden text. These style primitives introduce no search/onboarding/navigation logic. |
| Motion and focus | Visible focus, readable placeholder, reduced-motion override and forced-color control borders. Menu/focus management, modal behavior and final accessibility audit remain their later phases. |

The upcoming header, hero, search/questions, trust, goals, featured rows and guidance/dialog all have reusable color/type/space/surface/control tokens. No global token/reset was applied to calculators.

## Local fonts and license

[Font provenance and hashes](phase-01/fonts.json) records Liberation Fonts **2.1.5**, https://github.com/liberationfonts/liberation-fonts, obtained from this environment's Debian `fonts-liberation` distribution. Subsets retain Latin/extended Latin and common punctuation/currency glyphs, are converted to WOFF, and are renamed **SimpleKit Display / SimpleKit Sans** to respect the reserved upstream family names. The copyright and full SIL Open Font License 1.1 notice are distributed in `assets/v2/fonts/OFL.txt` and retained in font metadata. Original glyph authorship is credited there; renaming does not claim original typeface authorship.

Four files total **222,160 bytes**. They ship locally with `font-display: swap`; no external font URL or runtime dependency is introduced. WOFF is intentionally used because the available fontTools installation lacks the WOFF2 Brotli encoder; this does not affect visibility or browser support. `scripts/v2-subset-fonts.py` is an optional maintenance recipe, not a build prerequisite. Existing committed fonts need no package installation.

The font pairing preserves the reference's serif display / sans-serif interface distinction; it is not a claim to identify the mockup's exact font. Only 400/700 are defined, and `font-synthesis: none` avoids fabricated styles. Preload decisions belong to Phase 2, where the actual above-the-fold usage is known; do not preload all four files by default.

## Coastal imagery

The original mockup remains unchanged. A separate text-free 1536×1024 coastal image was generated with `image_gen` on 2026-10-09, then inspected visually. It represents a fictional misty inlet, not a verified location. The generation prompt requested pale left/upper space, layered mountains, calm water and evergreen shore concentrated on the right. No typography, UI, logo or mockup pixels are baked into the image.

Master: `docs/v2/phase-01/coastal-source.png` (excluded from deployment). Production derivatives: `assets/v2/images/coastal-{mobile|desktop}-{width}.{avif|webp|jpg}`. [Provenance, dimensions, hashes and byte counts](phase-01/hero.json). No third-party photograph/license claim is made. This is a proposed visual asset; owner acceptance remains pending in the feature PR.

| Crop | Dimensions | Encoding / budget |
| --- | --- | --- |
| Mobile | 400×500, 800×1000; 4:5 | AVIF, WebP, JPEG. Largest mobile file **109,334 bytes**, below 250,000. |
| Desktop | 768×432, 1536×864; 16:9 | AVIF, WebP, JPEG; highest-resolution JPEG about 162 KB. |

Focal point: **70% horizontally / 55% vertically**. Desktop master crop `[0,80,1536,944]`, mobile `[500,0,1319,1024]`. Source dimensions were reviewed before encoding. `scripts/v2-optimize-hero.py` provides the crop/encoding recipe using Pillow with AVIF/WebP support. This is optional asset maintenance; static builds consume the committed files.

The isolated review specimen demonstrates a `<picture>` with mobile art direction, AVIF → WebP → JPEG fallback, explicit source/image dimensions and CSS aspect ratio. All twelve files were reopened to verify their actual formats and dimensions. A first ImageMagick attempt lacked an AVIF encoder; the files were regenerated and verified with Pillow rather than committing mislabeled images.

The specimen fade is illustrative. Phase 2 must verify final live text contrast across the actual hero crop/overlay at all widths; a token contrast result does not prove contrast over every landscape pixel. No hero image is loaded by the existing homepage yet.

## SVG icon contract

18 original outlined icons plus a sprite in `assets/v2/icons/`: search, menu, chevron-right, arrow-right/left, close, lock, laptop, maple-leaf, bank, home, wallet, growth, piggy-bank, calculator, flame, bulb and check. They cover suggested questions, all trust items, four goals, five reference calculator rows and onboarding controls. [Inventory/usage](phase-01/icons.json).

Each icon uses a 24×24 viewBox, 1.75-unit stroke and rounded caps/joins. Prefer `<svg class="v2-icon" aria-hidden="true" focusable="false"><use href="/assets/v2/icons/sprite.svg#search"></use></svg>` so `currentColor` works with category accents. Keep adjacent text as the accessible meaning; icon-only buttons require an accessible name. For a standalone meaningful SVG use `role="img"` with a unique title/`aria-labelledby`. Individual files are also available; an `<img>` does not inherit the surrounding `currentColor`.

Icons were inspected in [normal density](phase-01/icons-390-1x.png) and [2× density](phase-01/icons-390-2x.png) screenshots. Paths remain crisp and share the same stroke treatment. No icon depends on a font or third-party package.

## Acceptance evidence

- **Contrast:** [16 WCAG contrast pairs](phase-01/contrast.json) pass. Navy/slate/link/button text meets 4.5:1; required control boundaries and focus indicators meet 3:1. The lowest tested required-control ratio is 3.45:1. Light panel dividers are decorative and do not carry control meaning.
- **Browser:** [Browser evidence](phase-01/browser.json) and [log](phase-01/browser.log) cover 320, 375, 390, 768, 1440 and 1920 CSS px, plus 390 px at 2× density. All four fonts load; hero decodes and rendered aspect ratios match; 18 sprite icons render; focus outline is visible; no horizontal specimen overflow. Zero external requests, page errors or failed responses. Blocking all font requests preserves visible heading/body text: [fallback screenshot](phase-01/font-fallback-390.jpg). Chrome on Linux only; no claim of real device, Safari or screen-reader testing.
- **Specimen:** [390 px](phase-01/foundations-390-1x.jpg), [768 px](phase-01/foundations-768-1x.jpg), [1440 px](phase-01/foundations-1440-1x.jpg). `docs/v2/phase-01/foundations-preview.html` is served by a loopback Playwright interception and never copied into public output. It is a component/crop review sheet, not the Phase 2 homepage.
- **Supported validation:** Node 24.19.0, source verification 23/23, 15 Node tests, build, SEO and output checks pass. Output retains 22 calculator paths, 53 sitemap URLs, 67 HTML pages; it now contains **315 files** and 137 referenced local assets. All **278 baseline deployment files remain byte-for-byte unchanged**; 37 new files are the scoped foundations/assets. [Exact artifact delta](phase-01/artifact-delta.json). [Build](phase-01/build.log), [tests](phase-01/tests.log), [SEO](phase-01/seo.log), [output](phase-01/output.log).
- **Preservation:** All 231 protected calculator/Core files and all 94 JS comparisons still match Phase 0, source pins/routes/sitemap/reference are unchanged, docs/master/mockup excluded from output. [Guard](phase-01/preservation.log). All **22 recorded calculator fixtures pass again**, with zero page errors/failed local requests: [fixture log](phase-01/calculator-fixtures.log).
- **Tooling:** `scripts/preview.mjs` only adds MIME types for AVIF/WebP/JPEG/WOFF. This enables correct local asset headers; it does not alter production hosting or workflows.

## Reproduce and handoff

Use the normal source-fetch/test/build/SEO/output commands, then `node scripts/v2-baseline-inventory.mjs`. To reproduce the review sheet, run `PORT=8001 npm run preview`, use the isolated Playwright setup documented in Phase 0, then:

```sh
NODE_PATH="$browser_test_dir/node_modules" CHROMIUM_PATH=/usr/bin/chromium node tests/v2-foundations-browser.cjs
SIMPLEKIT_PREVIEW_URL=http://127.0.0.1:8001 NODE_PATH="$browser_test_dir/node_modules" CHROMIUM_PATH=/usr/bin/chromium node tests/v2-baseline-browser.cjs
```

The review script defaults screenshots/results to `/tmp/simplekit-v2-foundations`; set `SIMPLEKIT_EVIDENCE_DIR` explicitly to replace saved review evidence. Baseline fixtures are compared, not refreshed.

Current homepage and every calculator remain visually/functionally unchanged; production configuration, source pins, CNAME and hosting workflows are untouched. No preview workflow or production deployment was dispatched. Phase 0's live HTTP 403 limitation and pre-existing mortgage overflow remain documented; this phase does not assert they are fixed.

Next bounded item: owner visual review of the proposed coastal asset and font/icon foundation decisions in this Phase 1 PR. Header/hero integration belongs to Phase 2 after Phase 1 review or further owner instruction. Phases 2–12 remain `[ ]`.
