# Phase 16 — Full-site final QA candidate

Status: `[~]`. Implementation and source-owned QA fixes are integrated. Final hosted QA is requested once for the consolidated candidate. No production release approval is recorded.

## Candidate and preservation

All 22 calculator interfaces are V2, with 23 immutable upstream pins in `data/calculator-sources.json`. The production-ready build contains 381 files, 67 HTML routes and the unchanged 53 sitemap URLs. No original artifact file is removed. Final inventory: `d3327aea4499be16f48d4d30807444f2fe48f0938107324c2033f1742a3318ac`; reproducible archive: `88c71108b7f54314f6ba15d5eafda71c3822a27fb0e2299143d053b9f3242700` (SHA-256).

The source preservation guard retains 302 original runtime files exactly, preserves original metadata, inline scripts, controls/defaults and anchors, and checks all 94 calculator JS files against immutable upstream pins. Five JS files permit exact reviewed chart/control presentation transformations. The classic retirement fallback is an explicit release exception, reproduced from the canonical module sources with a scoped bundler. All modular financial formulas remain original. Source fixes and commits: [manifest](phase-16/source-fixes.json).

## Findings resolved

- Rent/buy and RRSP/TFSA mobile layouts: intrinsic grid widths and adapter specificity squeezed headline copy and caused 320px overflow. Preserve hero columns on desktop and stack them on mobile.
- Compound-interest/emergency-fund labels: inherited opacity weakened otherwise accessible colours. Remove opacity on semantic labels and use V2 text colours.
- Debt payoff: move the delete button out of the interactive disclosure summary, preserving its action and debt ID.
- Budget planner: keep the programmatically triggered JSON upload input hidden instead of exposing an unnamed focus target.
- Investment fees: give labelled charts an image role; reflow input widths at 200% text sizing.
- Contractor rate: explicitly label the original hidden toggle inputs without changing their defaults or calculator state.
- Retirement fallback: the original concatenating bundler merged private module functions into a global scope. Two different `computeBracketTax` helpers collided. Replace it with a deterministic scoped, dependency-free bundler; both loading paths now match the frozen module result (money lasts to age 77, replacing the erroneous fallback age 75). Canonical modular formulas are unchanged.

## Verified locally

- Repository unit suites pass; full unrestricted run reported 40 tests, restricted Node reports the same 10 passing test files.
- All 22 frozen numerical/input/step fixtures pass, with zero page errors or failed local requests. Original fixtures are unchanged. A test-only visible clone normalizes results panels whose `innerText` differs when their ancestors are hidden; closed detail bodies remain excluded.
- Module and forced-classic retirement paths pass the same exact financial fixtures at 390px/DPR 2; fallback proof includes regenerated SHA and deterministic rebuild validation.
- SEO/output validation passes: 53 indexed routes, 1,353 internal links, 13 compatibility pages, 22 calculators and 201 local assets.
- Two earlier coherent builds matched exactly. Reproducibility is rechecked for the final pinned candidate in hosted QA.
- Initial geometry/axe audit covered all 22 at 320/375/390/768/1440/1920 and 200% text. All initial WCAG audit findings are resolved. The new 20-tool browser suite additionally checks populated states, keyboard menu behavior, 44px controls and enlarged text. The last fee input refinement awaits its complete final run.

## Final acceptance still required

- [~] Complete hosted Chromium/Firefox/WebKit calculator, pilot, editorial, discovery, SEO, accessibility, export/storage, reduced-motion and performance suites, with final screenshots and exact candidate SHA.
- [ ] Verify the deployed candidate and isolated preview protections in Phase 17.
- [ ] Owner review against `docs/design-reference/simplekit-v2-target.png` and the approved derived references; document any accepted deviations.
- [ ] Perform or explicitly owner-accept outstanding physical-device and screen-reader review from Phase 8. Linux browser automation cannot establish VoiceOver/Safari, a second real screen reader, native toolbar zoom or real iPhone/Android acceptance.

Evidence and candidate identity will be updated from the completed hosted run. No task is marked complete based only on a successful build. `main`, GitHub Pages publishing, DNS and production remain unchanged.
