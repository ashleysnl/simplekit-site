# SimpleKit v2 Phase 2 — responsive header and coastal hero

Branch: `feature/simplekit-v2-phase-2`, based on Phase 1 handoff `e79168da277c52ecb226464cb91c69ef411624d3` ([PR #8](https://github.com/ashleysnl/simplekit-site/pull/8)). The owner directed Phase 2 on 2026-10-09, accepting the Phase 1 foundations and coastal asset for implementation. The workspace was clean before creating this branch. No existing work was discarded.

Implementation and available automated checks are complete. Phase 2 remains `[~]` for feature PR review and manual browser/AT coverage. The two acceptance criteria requiring those manual checks remain `[~]`; their automation passes, and the unavailable combinations are retained for Phase 8. This evidence does not represent a GitHub approval or production release permission. No merge, deployment, hosting change, source-pin change, or workflow dispatch was performed. Phases 3–12 remain `[ ]`.

## Scope and reference adaptation

- `templates/index.html` now uses a semantic banner, primary navigation, skip link, one main landmark, and a separate footer. The live wordmark splits navy **Simple** and blue **Kit.**, followed by “Free planning tools for Canadians.” Home, Tools, Learn, About and Support retain their destinations.
- Scoped `assets/v2/home.css` styles the header/hero only. `assets/site.css`, pinned Core, checked-in root `index.html`, the directory template and calculator pages remain unchanged. Existing lower homepage sections and every footer destination remain available.
- The hero uses the reference's exact eyebrow, headline and body copy as live text. The Phase 1 decorative coastal image uses responsive AVIF/WebP/JPEG sources, an empty alternative, explicit dimensions, `fetchpriority="high"`, an absolute image layer and a bottom fade into the canvas. Fonts are local; only display 700 and sans 400 are preloaded. The sans 700 face loads when used.
- `.v2-discovery-slot` reserves the search region for Phase 3. Working “Explore all 22 tools” and retirement links occupy it for this phase. No search input, suggested-question behavior or onboarding flow is introduced.
- The saved reference is 851 × 1848, with a hamburger. Desktop adaptation shows five navigation links from `56.25rem` (900 px at the default font setting), caps content at 72 rem and uses fluid gutters. Tablet copy spans 70% of the content area; desktop copy spans 52%. Mobile allows natural wrapping and stacked links. CSS and JavaScript use the same rem-based navigation breakpoint.
- The generated coastal scene and licensed font pairing are the approved Phase 1 implementation choices, rather than claims to reproduce the original photograph or identify its exact fonts. The mobile fade is stronger than the reference so slate text remains readable across the full text column. The lower homepage retains its previous appearance until later phases.

Reference: [saved target](../design-reference/simplekit-v2-target.png). Its original SHA-256 remains `3a3dda8eacc4d1795643e6be4672a51d5310133529366f158e45cae2df97ad23`.

## Navigation and accessibility evidence

`assets/v2/home.js` implements a non-modal disclosure. The button has an accessible Open/Close name, `aria-controls` and `aria-expanded`; decorative icons are hidden from assistive technology. Closed links leave the accessibility tree and tab order. Native links retain ordinary navigation semantics; no application-menu roles or focus trap are applied.

Verified with Chromium 151.0.7922.173 and isolated Playwright 1.56.1:

- Enter and Space toggle the menu. Tab proceeds through links and closes the disclosure when leaving the header. Escape closes and restores button focus. Outside pointer input dismisses the menu, leaving focus on a visible button/content target. Repeated button activation and actual Tools navigation work.
- On breakpoint changes, focus transfers away from a control that becomes hidden. The desktop navigation remains visible. JavaScript-disabled mobile navigation exposes all five ordinary links, and Tools navigation succeeds.
- Mobile button dimensions are 48 × 48 CSS px. Links have at least 44 px minimum heights, and keyboard focus outlines are visible. Touch emulation opens/dismisses the menu at 844 × 390 landscape.
- Chromium's accessibility tree exposes the expanded button name/state and named navigation landmark. There is one meaningful H1, one banner, one main and one contentinfo landmark. The hero image is decorative; copy remains visible when every v2 font and hero image request fails.

Automation covers Chromium's accessibility tree and keyboard/touch behavior. **VoiceOver/NVDA, real devices and other browser/AT combinations were unavailable and were not tested.** Their manual coverage remains part of Phase 8. Magnification checks use CSS `zoom: 2` at 1440 px and 720 px reflow with working disclosure navigation; this is **not** a claim to have operated a browser toolbar zoom control. Phase 8 retains manual browser zoom coverage.

## Responsive, contrast and loading evidence

[Browser report](phase-02/browser.json) covers **27 widths from 320 to 1920 px**, including 375, 390, 768, both sides of the navigation breakpoint, 1440 and 1920. No horizontal overflow, clipped headline or headline/body/control overlap was found. Hero images decode successfully at all widths. The report records actual selected sources, font faces and bounding rectangles.

Contrast is bounded conservatively using the darkest possible landscape pixel (black) beneath the horizontal canvas veil at the right edge of each text column. The additional bottom fade can only increase contrast. Across tested widths, the minimum body ratio is **4.62:1** (required 4.5:1), and the minimum large-heading ratio is **12.40:1** (required 3:1). Token contrast evidence from Phase 1 remains applicable to header links and solid buttons.

With fonts and images delayed by 500 ms at 390 px, the discovery controls remain at `397.4375` CSS px before/after loading, and observed local layout shift is **0**. The absolute decorative layer and content sizing prevent the image from changing document flow. This is a controlled loading check, not a field Core Web Vitals or Lighthouse result.

| Width | Baseline | Phase 2 |
| --- | --- | --- |
| 375 | [Before](baseline/screenshots/home-375.jpg) | [After](phase-02/homepage-375.jpg) |
| 390 | [Before](baseline/screenshots/home-390.jpg) | [After](phase-02/homepage-390.jpg) |
| 768 | [Before](baseline/screenshots/home-768.jpg) | [After](phase-02/homepage-768.jpg) |
| 1440 | [Before](baseline/screenshots/home-1440.jpg) | [After](phase-02/homepage-1440.jpg) |

Additional evidence: [320 px](phase-02/homepage-320.jpg), [1920 px](phase-02/homepage-1920.jpg), [full homepage/footer](phase-02/homepage-full.jpg), [375 px open menu and focus](phase-02/menu-375.jpg), [768 px open menu](phase-02/menu-768.jpg), [touch landscape](phase-02/touch-landscape-menu.jpg), [font/image failure](phase-02/image-font-fallback.jpg), [200% CSS magnification](phase-02/magnification-200-percent.jpg).

## Preservation and validation

- [Source acquisition](phase-02/source-fetch.log): all **23 pinned sources** verified, including 22 calculators and Core.
- [Repository tests](phase-02/tests.log): **15/15 pass**.
- [Build](phase-02/build.log), [SEO](phase-02/seo.log), [output validation](phase-02/output.log): pass; **22 calculator routes, 53 sitemap URLs, 67 HTML pages, 141 referenced local assets**.
- [Preservation guard](phase-02/contracts.log): all protected calculator/Core bytes, source revisions, canonical and compatibility routes, sitemap entries and original reference hash match Phase 0. All **94 calculator JS files** match pinned upstream.
- [Calculator interaction regression](phase-02/calculator-fixtures.log), [result report](phase-02/v2-browser-result.json): **22/22** exact Phase 0 fixtures pass, including displayed outputs and initial/final inputs; zero page errors or failed local requests. Fixed time, locale and rounding contracts match the baseline.
- [Artifact delta](phase-02/artifact-delta.json): **317 files**; only generated `index.html` changes relative to Phase 1, and `assets/v2/home.css` / `home.js` are added. The other **314 Phase 1 files** remain byte-identical (277 baseline files plus all 37 foundation assets). Docs, original reference, source cache and browser dependencies are excluded from output.
- The existing Google tag and metadata remain unchanged. Tests stub that external tag and use loopback calculator paths; they do not follow canonical links into production or send test interactions to analytics. The Phase 2 browser report records zero page errors and failed responses.
- [Remote references](phase-02/remote-refs.txt) confirm main/production remains `ca7826db75cb4353488786aab80857b3a71c1be1` and the Phase 1 handoff remains unchanged. Existing Phase 0 limitations on live edge HTTP validation still apply. Nothing was merged or deployed.

To reproduce browser acceptance, build the site and serve `dist/` on loopback (`PORT=8001 npm run preview`), then run the scripts with an isolated Playwright installation:

```sh
SIMPLEKIT_PREVIEW_URL=http://127.0.0.1:8001 NODE_PATH=/tmp/simplekit-v2-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium node tests/v2-header-hero-browser.cjs
SIMPLEKIT_PREVIEW_URL=http://127.0.0.1:8001 NODE_PATH=/tmp/simplekit-v2-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium node tests/v2-baseline-browser.cjs
```

Default browser evidence output is under `/tmp`; `SIMPLEKIT_EVIDENCE_DIR` may point at a separate reviewed evidence directory. Do not use baseline `--record` while checking a redesign. Browser dependencies and these optional acceptance scripts are not published runtime assets. Hosted validation status is recorded in the feature PR.
