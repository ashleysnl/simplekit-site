# Phase 16 — Full-site final QA candidate

## Current checkpoint after Phases 15A–15D

Status: `[~]`. Candidate `ba06376e02fd88e26e0da09f2450d50918087cb7` completed [the consolidated run](https://github.com/ashleysnl/simplekit-site/actions/runs/38548702694). Validation (including preservation and reproducibility), rollback packaging, pilots, editorial, accessibility/SEO and performance passed. System, homepage and calculators need the focused follow-up below. Earlier evidence below is historical for inputs changed by the latest shared theme and family refinements. No production merge/deployment.

### Focused repair checkpoint

- The system isolation test incorrectly treated the now opted-in homepage as a legacy consumer. It now serves the unchanged production authoring source for that one isolation case, retaining the before/after geometry and control assertions. Its independently saved CPP legacy case is unchanged.
- The homepage contrast test modeled an obsolete gradient. It now measures the rendered photo/gradients beneath non-space characters, retaining WCAG thresholds of 3:1 for the headline and 4.5:1 for body text. This exposed an actual 4.44:1 body-text failure at 320px. Mobile hero body text now mixes the existing slate/ink tokens slightly darker, preserving the image and layout. The repaired Chromium suite passes all 27 widths (320–1920), keyboard/ARIA/touch/navigation, fallback/loading and enlarged-text checks. Evidence is preserved locally at `scratch/phase16-current/home-repair/` in the parent workspace; hosted evidence will be authoritative for the published candidate.
- All 20 remaining calculators passed Chromium and Firefox; 19 passed WebKit. TakeHomePay still has document overflow at 200% text in WebKit (519px document at 390px viewport). The published table containment change alone did not resolve it. Additional failure diagnostics now include non-table overflowing elements, ancestor geometry and table containers, plus a failure screenshot; previously the first 30 overflowing table descendants obscured other possible causes. No speculative runtime change or acceptance claim is made.
- `[repair-qa]`/the optional `repairs` scope reruns system, calculators, homepage, accessibility/SEO and performance, plus the existing static/preservation/reproducibility and rollback gates. Pilot and editorial results are retained for unchanged inputs. Initial/full QA still covers all seven suites; `main` and PRs into `main` always select all suites even if a focused marker/input is present.

Follow-up candidate `a0522ec9e9b1f2407fbf129ce26a39af9f926e19` ([run 38837029465](https://github.com/ashleysnl/simplekit-site/actions/runs/38837029465)) passed hosted validation/preservation/reproducibility, rollback packaging, homepage, accessibility/SEO and performance. Homepage search (44 name/slug cases), all 22 tool routes, all 93 guided answer/skip paths and responsive/fallback checks pass. Lighthouse medians: performance 99, accessibility 100, LCP 1965ms, CLS 0. Its 381-file inventory hash is `cd704e5c9c475d833bb169be71ec7e2651fe4031518cff122069836bab4c1557`.

The remaining follow-up is limited to integration:

- WebKit diagnostics show no non-table element overflowing; the outer table shell is 324px and its scrolling child is 322px, while table descendants still extend the document to 519px. Source commit `deea7d7fbfde25393c64e673781dc40703493641` in `ashleysnl/SimpleKitTakeHomePay/develop-v2` establishes a positioned local containing block on that scroll child. No columns/data are removed. Verification additionally requires keyboard horizontal scrolling and access to the last tax-result column at 200% text. This source refinement remains `[~]` until the fresh WebKit check passes; rollback restores pin `28b1ca0` through a normal revert.
- Chromium/Firefox system references, including legacy isolation, passed. WebKit reached the interaction privacy assertion after passing reference layouts/audits, but redraws made four exact local sprite GETs. The guard now records and permits only `GET /assets/core/v2/icons/sprite.svg` on the preview origin, without a query; all other action requests, external requests and local/session storage remain forbidden. This does not permit input-bearing traffic.
- `[integration-qa]`/the optional `integration` scope runs system (including numerical baseline, export/state and fallback suites) plus all 20 remaining calculators in all three engines. Earlier unchanged homepage/editorial/pilot/accessibility/performance evidence is retained. Static/preservation/reproducibility and rollback gates still run, and main/release PRs still select the full matrix.

The restarted cloud environment lost temporary browser installations but retained repository changes and saved evidence. Local WebKit execution has not established a pass. Formula/state/export fixtures and acceptance thresholds are unchanged. Follow-up verification and the remaining WebKit defect keep Phase 16 in progress.

Preflight: all ten repository test files pass; SEO validates 53 indexed pages, 1464 internal links and 13 compatibility pages; output validates 22 calculators, 53 sitemap URLs, 67 HTML pages and 201 assets. The independent preservation guard protects 262 exact pre-pilot runtime files and unchanged editorial head/content hashes outside the reviewed shell replacement. Its historical shell fixture is from `5bb3fc1`; financial baselines were not replaced with current output. Homepage-owned assets and generated immutable Core aliases have explicit source/ownership checks. Legacy browser selectors are updated to the current shared header/navigation contract without removing functional assertions.

The preserved Contractor runtime files are byte-identical to published pin `c56104e`, including the hidden backing checkboxes and pressed-state updates. Its local divergent history/dirty files remain preserved; there is no missing runtime change to silently include. The TakeHomePay enlarged-table containment fix is now published as `28b1ca0b7f3d6aba3689e24582ba691cffb0b52c`; its original patch/private commit are backed up. No formula, parsing, state or export change. WebKit/enlarged table verification is part of this checkpoint.

[Exact frozen runtime pins](phase-16/current/source-pins.json). The candidate source SHA and artifact identity are recorded by the full-QA workflow's `release-source.txt` and release inventory/archive. Full numerical/state/accessibility/cross-browser/performance suites, final gallery and current rollback evidence are pending. Physical-device/screen-reader/native-zoom and owner visual approval remain distinct manual gates. Phase 17 uploads/reviews the verified isolated demo; production remains protected.

Status: `[~]`. Implementation and source-owned QA fixes are integrated. Final hosted QA is requested once for the consolidated candidate. No production release approval is recorded.

## Candidate and preservation

All 22 calculator interfaces are V2, with 23 immutable upstream pins in `data/calculator-sources.json`. The production-ready build contains 381 files, 67 HTML routes and the unchanged 53 sitemap URLs. No original artifact file is removed. Superseded pre-final inventory: `d3327aea4499be16f48d4d30807444f2fe48f0938107324c2033f1742a3318ac`; superseded archive: `88c71108b7f54314f6ba15d5eafda71c3822a27fb0e2299143d053b9f3242700` (SHA-256).

The source preservation guard retains 299 original runtime files exactly, preserves original metadata, inline scripts, controls/defaults and anchors, and checks all 94 calculator JS files against immutable upstream pins. Eight JS files permit exact reviewed chart/control presentation transformations. The classic retirement fallback is an explicit release exception, reproduced from the canonical module sources with a scoped bundler. All modular financial formulas remain original. Source fixes and commits: [manifest](phase-16/source-fixes.json).

## Findings resolved

- Rent/buy and RRSP/TFSA mobile layouts: intrinsic grid widths and adapter specificity squeezed headline copy and caused 320px overflow. Preserve hero columns on desktop and stack them on mobile.
- Compound-interest/emergency-fund labels: inherited opacity weakened otherwise accessible colours. Remove opacity on semantic labels and use V2 text colours.
- Debt payoff: move the delete button out of the interactive disclosure summary, preserving its action and debt ID.
- Budget planner: keep the programmatically triggered JSON upload input hidden instead of exposing an unnamed focus target.
- Investment fees: give labelled charts an image role; reflow input widths at 200% text sizing.
- Contractor rate: hide backing checkboxes and expose selection on the visible keyboard-accessible buttons without changing financial defaults.
- Retirement fallback: the original concatenating bundler merged private module functions into a global scope. Two different `computeBracketTax` helpers collided. Replace it with a deterministic scoped, dependency-free bundler; both loading paths now match the frozen module result (money lasts to age 77, replacing the erroneous fallback age 75). Canonical modular formulas are unchanged.

## Verified locally

- Repository unit suites pass; full unrestricted run reported 40 tests, restricted Node reports the same 10 passing test files.
- All 22 frozen numerical/input/step fixtures pass, with zero page errors or failed local requests. Original fixtures are unchanged. A test-only visible clone normalizes results panels whose `innerText` differs when their ancestors are hidden; closed detail bodies remain excluded.
- Module and forced-classic retirement paths pass the same exact financial fixtures at 390px/DPR 2; fallback proof includes regenerated SHA and deterministic rebuild validation.
- SEO/output validation passes: 53 indexed routes, 1,353 internal links, 13 compatibility pages, 22 calculators and 201 local assets.
- Two earlier coherent builds matched exactly. Reproducibility is rechecked for the final pinned candidate in hosted QA.
- Initial geometry/axe audit covered all 22 at 320/375/390/768/1440/1920 and 200% text. All initial WCAG audit findings are resolved. The new 20-tool browser suite additionally checks populated states, keyboard menu behavior, 44px controls and enlarged text. The fee refinement passes; complete cross-engine verification of the final hero/control refinements is pending.

## Final acceptance still required

- [~] Complete hosted Chromium/Firefox/WebKit calculator, pilot, editorial, discovery, SEO, accessibility, export/storage, reduced-motion and performance suites, with final screenshots and exact candidate SHA.
- [ ] Verify the deployed candidate and isolated preview protections in Phase 17.
- [ ] Owner review against `docs/design-reference/simplekit-v2-target.png` and the approved derived references; document any accepted deviations.
- [ ] Perform or explicitly owner-accept outstanding physical-device and screen-reader review from Phase 8. Linux browser automation cannot establish VoiceOver/Safari, a second real screen reader, native toolbar zoom or real iPhone/Android acceptance.

Evidence and candidate identity will be updated from the completed hosted run. No task is marked complete based only on a successful build. `main`, GitHub Pages publishing, DNS and production remain unchanged.

Final QA is split into independent suites so failures can be isolated and unrelated gates need not be rerun. Source refinements preserve nested desktop hero width and 44px action widths. Final inventory/archive digests supersede the earlier preparation values and will be taken from the new hosted candidate.

## Focused completion after the independent QA run

Run [38198828023](https://github.com/ashleysnl/simplekit-site/actions/runs/38198828023), candidate `85c20662849d13cda59670032565d23d41409064`, passed validation, system, pilots, editorial, homepage, accessibility/SEO and performance. The calculator job failed on the populated Travel calendar's nested buttons and orange cost-marker contrast. The rollback job failed because the official Jekyll builder omits `CNAME`.

The follow-up changes only the Travel source's calendar markup and two scoped CSS declarations, plus QA/documentation files. The day header becomes a standalone button within a labelled group, retaining the existing delegated selection handlers; cost markers use a darker orange with readable white text. Financial algorithms, state, fixtures and all other published page assets are unchanged. Exact source transformations are recorded and enforced. The rollback builder restores the unchanged source `CNAME` metadata before inventorying its output; it does not change live Pages settings or DNS.

The `[remaining-qa]` commit marker requests fresh static/preservation/reproducibility gates, the complete 20-calculator suite in all three engines, and the rollback package. The six independent passing suites above are retained for their unchanged inputs, avoiding unrelated repetition. Full QA remains the default manual/release gate. An optional calculator-ID filter supports focused local diagnosis; hosted QA does not set that filter.

The subsequent calculator pass completed all 20 Chromium interaction/audit checks but exposed an inherited resize-handler bug in Mortgage Paydown vs Invest: a DOM event was treated as financial chart results. The source-owned fix wraps the listener to call the unchanged chart scheduler without the event. Exact preservation guards permit only that one listener replacement; formulas and frozen outputs remain unchanged. Travel’s source-owned backup action is also placed in normal flow to avoid covering shared mobile navigation. These focused changes require fresh calculator verification, while unrelated passing suites remain applicable.

Run 38244668706 passed static validation/reproducibility and the rebuilt rollback package, plus all 20 calculator cases in Chromium and Firefox. WebKit detected native province-select overflow at 200% text in Take Home Pay; its source adapter now constrains form fields and native controls to the container width. The browser suite collects all tool failures within each engine so one failure no longer hides later findings. The superseded dcbc301 archive is retained for traceability; final candidate identity will come from the subsequent verified build.

### Integration follow-up result

Candidate `c479820` ([run 38837940382](https://github.com/ashleysnl/simplekit-site/actions/runs/38837940382)) passes static/preservation/reproducibility, rollback and the complete system chain: three-engine reference/isolation checks, all 22 unchanged numerical fixtures, Budget/Retirement JSON round trips and storage reload, mortgage CSV reconciliation and module/classic retirement equivalence. All 20 calculators pass Chromium/Firefox, and 19 pass WebKit. The positioned scroll region does **not** fix the remaining 519px TakeHomePay document width at 200% text. Its additional local-scroll assertions have passed Chromium/Firefox but are blocked by the existing WebKit width assertion. No acceptance is claimed.

A diagnostic-only `[remaining-qa] [takehome-diagnostic]` follow-up filters calculator verification to TakeHomePay in all three engines, retaining all mandatory static gates. On failure it temporarily applies/removes individual style probes, records document widths and preserves the original failing assertion. It does not change the published runtime or permit full release validation to use this narrow selection; the marker is restricted to `develop-v2`. The next runtime fix must follow these measurements rather than assume visible overflowing table descendants are the cause.

### Measured overflow cause and final focused fix

Diagnostic run [38838611229](https://github.com/ashleysnl/simplekit-site/actions/runs/38838611229) keeps the original failure and records reversible probes. Hiding the table, changing its border model/wrapping/containment, hiding footer/SVG/pseudo-elements all leave document width at 519px. Styling native selects with `appearance:none; white-space:normal` (or hiding selects) restores exactly 390px. The prior table hypothesis is disproved.

TakeHomePay source `8341a79be9a1f767b7337f711c0776f62787fb72` removes ineffective table containment/position rules and applies the measured select treatment, with a visible CSS dropdown indicator and native forced-colour appearance. Native elements, option values, IDs, formulas and state remain intact. The focused follow-up adds keyboard province selection alongside the local table-scroll/last-column checks, in all three engines. No completed result is assumed before that run.

Source inspection also found the first homepage colour declaration referenced an undefined `--v2-ink`; the passing rendered result inherited the existing navy. The declaration now explicitly uses `--v2-navy`, preserving that tested appearance. `[verify-hero]` runs the full 27-width header/hero suite after the focused calculator cases to recheck actual rendered contrast and navigation. Existing unrelated suite results are retained.

### Enlarged keyboard integration

Run [38839185080](https://github.com/ashleysnl/simplekit-site/actions/runs/38839185080) confirms the select change fixes WebKit document width. Chromium/Firefox pass the new keyboard checks. WebKit then exposes a separate failure: ArrowRight does not scroll its focused table region natively. Core commit `04a7cfb5406fab82ec4a568e75cbbcc03e117932` adds a narrow shared fallback to `v2/calculators.js`: only an unmodified horizontal arrow targeted at the scroll region itself, and only while it overflows. Nested financial controls are excluded; formulas/storage/network remain untouched. Core documents the compatible upgrade/rollback contract. Its `develop-v2` includes the prior documentation-only authoring commit; all other runtime bytes from the earlier Core pin are unchanged.

The site deliberately adopts this Core revision in both manifests and the current source-pin record. Integration verification reruns the complete 20-calculator suite, all 22 numerical fixtures/export/storage/fallback checks in the system chain, plus the focused header/hero suite for explicit navy. Other visual/pilot/editorial/performance results remain applicable to unchanged assets. A WebKit enlarged-table screenshot is now retained after its keyboard check passes.
