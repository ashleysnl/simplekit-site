# SimpleKit v2 Phase 4 — trust indicators and qualified privacy

[Phase 4 PR #11](https://github.com/ashleysnl/simplekit-site/pull/11), implementation/evidence commit `03f0b9e994d465529df89fb8fa3ede0a6d1baa1e`. Branch `feature/simplekit-v2-phase-4` starts from the fetched Phase 3 handoff `b1b07f9454f9d8214197e4c673a184832f011860` ([PR #10](https://github.com/ashleysnl/simplekit-site/pull/10)). HEAD and FETCH_HEAD matched before implementation. The workspace was clean; no existing changes were discarded. The owner instructed Phase 4 on 2026-10-09, clearing Phase 3's review pause while retaining its manual screen-reader check for Phase 8.

Phase 4 implementation is complete. Available automated checks and the audit are recorded below. Actual browser-toolbar 200% zoom remains a manual Phase 8 check; CSS magnification and 200% text-size checks are recorded separately. Feature review remains open. Phases 5–12 are unstarted. The owner additionally requested a website link with all changes to date; an early review snapshot will use the existing dedicated preview workflow, without marking Phase 11 complete. No production merge/deploy, source-pin change, calculator modification, hosting/DNS change or workflow modification is authorized or performed.

## Implementation and reference comparison

`templates/index.html` adds a static list immediately after discovery, using the existing local lock, laptop and maple-leaf icons. `assets/v2/trust.css` scopes the strip to the homepage. It uses pastel icon discs, vertical separators at tablet/desktop widths and a stacked layout with horizontal separators on narrow screens. Text wraps without relying on icons or color. Privacy and methodology links have 44 px minimum height and visible keyboard focus. There is no new JavaScript, storage, analytics or network behavior.

The unchanged [design target](../design-reference/simplekit-v2-target.png) guides the strip's placement and hierarchy. Truth takes precedence over its wording:

| Reference | Implemented wording | Audit support |
| --- | --- | --- |
| No signup / Just open and use | No signup / Just open and use | All 22 tools work in fresh browser contexts without accounts or authentication. |
| Private / Stays in your browser | Local calculations / Inputs stay in your browser | Calculator code runs locally; some tools persist on the device. A nearby note explicitly discloses existing Google Analytics. This describes automatic input handling, not user-directed local file exports. |
| Built for Canadians / Local context and tax | Built for Canadians / Canadian context where relevant | Canadian pensions, payroll, registered accounts and mortgage conventions apply to relevant tools. Compound growth, budgets, travel and contractor comparisons also include general math. No claim that all tools calculate Canadian tax rules is made. |

The note distinguishes search/calculation inputs and device persistence from visits/interactions measured by Google Analytics. It links the existing [privacy page](../../privacy/index.html) and [methodology page](../../methodology/index.html), and calls outputs educational estimates. Neither those pages nor existing analytics were changed. No security certification, endorsement, professional advice or measured popularity is asserted.

| Width | Phase 3 before | Phase 4 after |
| --- | --- | --- |
| 375 | [Before](phase-03/search-empty-375.jpg) | [Homepage](phase-04/homepage-375.jpg), [trust strip](phase-04/trust-375.jpg) |
| 390 | [Before](phase-03/search-empty-390.jpg) | [Homepage](phase-04/homepage-390.jpg), [trust strip](phase-04/trust-390.jpg) |
| 768 | [Before](phase-03/search-empty-768.jpg) | [Homepage](phase-04/homepage-768.jpg), [trust strip](phase-04/trust-768.jpg) |
| 1440 | [Before](phase-03/search-empty-1440.jpg) | [Homepage](phase-04/homepage-1440.jpg), [trust strip](phase-04/trust-1440.jpg) |

Additional evidence: [320 px](phase-04/trust-320.jpg), [1920 px](phase-04/trust-1920.jpg), [200% CSS magnification](phase-04/trust-css-zoom-200.jpg), [200% text at 320 px](phase-04/trust-text-200-320.jpg). The icons, separators, wrapping and qualified copy were visually inspected. Existing lower homepage sections and footer retain their previous implementation.

## Audit and privacy regression

[Source audit](phase-04/source-audit.json) inventories every canonical tool's scope, storage references, request APIs and analytics call sites, plus shared v2/Core code. It audits the pinned generated code; it does not certify current regulated formulas or all possible third-party configuration.

- All 22 calculator pages and the homepage load the existing Google tag `G-6SS26QC3C9`. FIRE, Net Worth, Mortgage Paydown vs Invest, and Investment Fee have categorical custom events, such as `calculator_interaction` with `field` or `field_name`. Their reviewed call sites do not add financial values. Other tracked actions use categorical source, placement, related-tool, scenario or disclosure-state identifiers.
- Some tools persist inputs/checklists/trips using localStorage; retirement additionally uses sessionStorage. Manual saves and local export/import remain unchanged. Retirement's existing service worker fetches/caches GET assets and navigations; it does not construct requests from financial inputs. Shared v2/Core JavaScript contains no request API, storage or analytics calls.
- The homepage search does not submit forms, alter the URL, persist queries or call analytics/network APIs. **V2 onboarding is not implemented until Phase 7**, so there are no v2 onboarding choices to transmit. The existing Travel Planner's own local onboarding/storage is preserved; it is separate from the planned homepage wizard.
- **Existing discrepancy:** pinned Travel Planner copy says “No tracking” while its HTML loads the Google tag. This was not introduced by v2. A separately reviewed upstream wording correction is recommended; no calculator source/pin or analytics was silently changed. The new homepage and existing privacy page explicitly disclose analytics.

[Calculator privacy report](phase-04/calculator-privacy.json) and [fixture log](phase-04/calculator-fixtures.log) run the original 22 input/result fixtures in fresh account-free contexts and compare exact displayed text and inputs. The optional `SIMPLEKIT_PRIVACY_AUDIT=1` observer captures every context request after initial load and queued analytics events after interactions. Financial-input changes produce **no data-bearing requests**. RRSP vs TFSA makes two existing static favicon GETs with no query or body; all other tool interactions make no requests. Four apps queue only categorical field identifiers. No entered financial value appears in these queued parameters. Existing browser storage keys are recorded per tool.

The trust browser test enters four searches, including a unique sentinel and financial-looking query. Search produces **zero requests**, unchanged dataLayer, no local/session storage changes and no URL query. Existing external scripts are stubbed during functional checks; this tests site-authored behavior and payloads, not Google's remote settings, server processing or a real user's browser extensions. Calculator/Core hashes and all pre-existing v2 JavaScript remain identical to Phase 3, so Phase 4 adds no telemetry path.

## Acceptance and preservation evidence

- [Trust browser report](phase-04/trust-browser.json), [log](phase-04/trust-browser.log): **9 layout/fallback checks pass**, at six widths, CSS 200%, text 200% at 320 px, and JavaScript-disabled/hidden-icon/forced-color fallback. Privacy/methodology keyboard navigation and four private searches pass.

- [Repository tests](phase-04/tests.log): **23/23 pass**.
- [Build](phase-04/build.log), [SEO](phase-04/seo.log), [output](phase-04/output.log): pass; **23 pinned sources, 22 calculators, 53 sitemap URLs, 67 HTML pages, 146 local assets**.
- [Baseline preservation](phase-04/contracts.log): canonical/compatibility routes, source pins, sitemap, all protected calculator/Core bytes and the reference match Phase 0; **94 calculator JavaScript files** match upstream.
- [Exact calculator regression](phase-04/v2-browser-result.json): **22/22 pass**, zero page errors or failed local requests. No baseline fixtures were re-recorded.
- [Header regression](phase-04/header-regression.json), [log](phase-04/header-regression.log): all **27 widths 320–1920**, navigation, keyboard/touch, loading/fallback and existing magnification/reflow checks pass.
- [Discovery regression](phase-04/discovery-regression.json), [log](phase-04/discovery-regression.log): exact name/slug ranking, required intents, canonical routes, keyboard/accessibility-tree/touch/fallback/privacy checks pass; maximum DOM update **51.5 ms**, next frame **52.9 ms**, below 100 ms on this controlled Linux/Chromium runner.
- [Artifact delta](phase-04/artifact-delta.json): **322 files**; only generated `index.html` changes and `assets/v2/trust.css` is added. All **320 other Phase 3 files** remain byte-identical. Root production index, directory, shared CSS/Core, calculators, source pins and workflows remain unchanged; docs/reference/cache/dependencies stay excluded from output.

Actual browser-toolbar zoom, physical devices and manual VoiceOver/NVDA were not available. The corresponding prior-phase checks remain recorded for Phase 8. Phase 4's readability criterion stays `[~]` until actual toolbar zoom is reviewed; automated 320 px, CSS 200%, text 200% and icon-independent meaning checks cover its available portion.

## Reproduction and handoff

Run the supported `npm run sources:fetch`, `npm test`, `npm run build`, `npm run seo:validate`, `npm run output:validate`, and `node scripts/v2-baseline-inventory.mjs` checks. Serve generated output with `PORT=8001 npm run preview`. Browser checks use isolated Playwright 1.56.1 and Chromium 151.0.7922.173; no browser package is added to the repository:

```sh
NODE_PATH=/tmp/simplekit-v2-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium SIMPLEKIT_PREVIEW_URL=http://127.0.0.1:8001 node tests/v2-trust-browser.cjs
NODE_PATH=/tmp/simplekit-v2-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium SIMPLEKIT_PREVIEW_URL=http://127.0.0.1:8001 SIMPLEKIT_PRIVACY_AUDIT=1 node tests/v2-baseline-browser.cjs
NODE_PATH=/tmp/simplekit-v2-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium SIMPLEKIT_PREVIEW_URL=http://127.0.0.1:8001 node tests/v2-header-hero-browser.cjs
NODE_PATH=/tmp/simplekit-v2-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium SIMPLEKIT_PREVIEW_URL=http://127.0.0.1:8001 node tests/v2-discovery-browser.cjs
```

Set `SIMPLEKIT_EVIDENCE_DIR` to save reviewed evidence; never replace Phase 0 fixtures. [Hosted validation](phase-04/hosted-validation.json) passed for implementation commit `03f0b9e994d465529df89fb8fa3ede0a6d1baa1e`: [run 37974948400](https://github.com/ashleysnl/simplekit-site/actions/runs/37974948400), validation job 23 seconds. Follow-up evidence/checklist changes do not change the built candidate; current PR head CI is recorded in PR #11.

**Owner-requested preview is built but not uploaded.** [Run 37974947775](https://github.com/ashleysnl/simplekit-site/actions/runs/37974947775) dispatched from the trusted default workflow/main commit `ca7826db75cb4353488786aab80857b3a71c1be1`, with `source_ref` set to the exact implementation commit above. Its build, supported validation, preview-only noindex/CNAME isolation and artifact upload steps passed. The deployment job is waiting for the existing `simplekit-preview` reviewer gate. GitHub reports reviewer `ashleysnl`, `can_admins_bypass: false`, and this session eligible to approve; the app's approval API request nevertheless returned **HTTP 403, Resource not accessible by integration**. No protection was removed or bypassed. The owner must use **Review deployments → simplekit-preview → Approve and deploy** on that run. [Preview request/gate record](phase-04/preview-request.json). The alias `https://codex-preview.simplekit-preview.pages.dev` remains an older build until the upload succeeds; it is not represented as the Phase 4 preview. Live candidate checks and immutable deployment identity remain pending. This early snapshot does not complete Phase 11. Native GitHub artifact/log download redirects returned 403 in this environment. The GitHub connector recovered the completed build log; its [selected evidence](phase-04/preview-build-summary.log) confirms the exact checkout, 23 passing tests, 22 calculators, preview-only isolation and 322-file artifact (ZIP SHA256 `e23ae036589dbd73ddd054e7d18d5b93cb50463ad1a8afd6d2f74d30dbd74868`). No downloaded-artifact byte comparison is claimed. The next bounded roadmap phase is Phase 5, explore-by-goal navigation; it has not been started.
