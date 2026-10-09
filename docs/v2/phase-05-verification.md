# Phase 5 — Explore-by-goal navigation verification

Date: 2026-10-09. Branch: `develop-v2`. Starting commit: `f47189720c09d535ad7a72e495b36eaa861e58e7`.

The owner instructed Phase 5 after consolidation. Phases 1–4 implementations are present. Their existing manual accessibility/toolbar-zoom and owner-review limitations remain documented; this task does not mark those checks complete or authorize release.

## Implementation and navigation contract

The homepage places “Explore by goal / What are you planning?” after the trust strip. Four full-card links match the reference order, copy, icons and accents:

| Card | Description | Icon / accent | Stable destination |
| --- | --- | --- | --- |
| Retirement | Plan your future | bank / blue | `/tools/#retirement` |
| Home & mortgage | Understand costs | home / teal | `/tools/#home` |
| Budget & debt | Manage money | wallet / amber | `/tools/#budget` |
| Investing | Grow your savings | growth / purple | `/tools/#investing` |

The existing `/tools/` route always renders all 22 tools. Native anchors scroll and focus the category heading (`tabindex="-1"`); direct loading, reload, Back/Forward, keyboard and JavaScript-disabled navigation work. There is no filtering, query parser, hidden subset, storage or new telemetry. Unknown fragments do not remove tools. Homepage “View all 22 tools” opens `/tools/`; the directory's all-tools link returns to `#all-tools`. Counts use `{{toolCount}}`.

`scripts/v2-goals.mjs` uses the validated discovery index: **the first existing goal tag in `data/v2-discovery.json` is the primary directory category**. Each tool appears once; secondary tags still power search. Names and destinations derive from `data/tools.json`, with the existing canonical tool-token renderer resolving links. Duplicate tools, missing/unknown primary categories and empty destinations fail the build. Generated directory tokens are included in the existing tool-link audit.

| Primary category | Tool IDs (exactly one entry each) |
| --- | --- |
| Retirement (`#retirement`) | `retirement-planner`, `fire-calculator`, `cpp-calculator` |
| Home & mortgage (`#home`) | `house-affordability-calculator`, `rent-vs-buy-calculator`, `mortgage-paydown-vs-invest-calculator`, `mortgage-calculator`, `debt-to-income-ratio-calculator` |
| Budget & debt (`#budget`) | `savings-goal-calculator`, `emergency-fund-calculator`, `net-worth-calculator`, `budget-planner`, `debt-payoff-calculator`, `credit-card-interest-calculator`, `loan-calculator` |
| Investing (`#investing`) | `rrsp-vs-tfsa-calculator`, `compound-interest-calculator`, `investment-fee-calculator` |
| Tax (`#tax`) | `canadian-tax-checklist` |
| Pay & work (`#income`) | `take-home-pay-calculator`, `contractor-effective-hourly-rate-calculator` |
| Travel (`#travel`) | `travel-planner` |

Tax, Pay & work, and Travel appear in the complete directory and its jump navigation. This is discovery metadata, not a claim that all tools implement Canadian tax rules. The old homepage grouped tool list is replaced by the goal section; the directory's repeated featured entry and broad groups are replaced by the seven-category catalogue. Homepage legacy featured/education/footer content and directory education/footer content remain. Phase 6 rows and Phase 7 onboarding remain unimplemented.

## Visual comparisons

The [original reference](../design-reference/simplekit-v2-target.png) is unchanged. Cards use the existing local sprite/foundations; shared styles and earlier v2 scripts are unchanged. Two columns start at 390 px; 320/375 px use one column for readable copy and targets. On narrow screens the all-tools link moves below the heading. Desktop retains the reference's two-column hierarchy. Screenshot review caught mid-word wraps at 390 px; compact icon/spacing refinements fixed them, and a new browser check rejects split words at ordinary tested widths.

| Width | Before homepage | After homepage | Goal detail | Before directory | After directory |
| --- | --- | --- | --- | --- | --- |
| 375 | [Before](phase-05/before-home-375.jpg) | [After](phase-05/after-home-375.jpg) | [Goals](phase-05/goals-375.jpg) | [Before](phase-05/before-directory-375.jpg) | [After](phase-05/after-directory-375.jpg) |
| 390 | [Before](phase-05/before-home-390.jpg) | [After](phase-05/after-home-390.jpg) | [Goals](phase-05/goals-390.jpg) | [Before](phase-05/before-directory-390.jpg) | [After](phase-05/after-directory-390.jpg) |
| 768 | [Before](phase-05/before-home-768.jpg) | [After](phase-05/after-home-768.jpg) | [Goals](phase-05/goals-768.jpg) | [Before](phase-05/before-directory-768.jpg) | [After](phase-05/after-directory-768.jpg) |
| 1440 | [Before](phase-05/before-home-1440.jpg) | [After](phase-05/after-home-1440.jpg) | [Goals](phase-05/goals-1440.jpg) | [Before](phase-05/before-directory-1440.jpg) | [After](phase-05/after-directory-1440.jpg) |

[320 px](phase-05/goals-320.jpg) and [1920 px](phase-05/goals-1920.jpg) are also captured. Native toolbar zoom, physical devices and manual VoiceOver/NVDA remain Phase 8 follow-ups; CSS magnification/text enlargement are not presented as those checks.

## Validation

- [Source verification](phase-05/sources.log): 23 pinned sources pass.
- [Repository tests](phase-05/tests.log): four test files pass. [Expanded local run](phase-05/tests-expanded.log), `node --test --test-isolation=none tests/*.test.mjs`: **27/27 individual checks pass**, including four new category/completeness/destination/escaping checks.
- [Build](phase-05/build.log), [SEO generation](phase-05/seo-build.log), [SEO](phase-05/seo.log), [output](phase-05/output.log): pass; 22 calculators, 53 sitemap URLs, 67 HTML pages, 147 local assets.
- [Preservation](phase-05/contracts.log): routes/pins/protected calculator/Core bytes and reference match Phase 0; **94 calculator JavaScript files** match upstream.
- [Repeat build](phase-05/reproducibility.json): **323 files byte-identical**.
- [Goal browser report](phase-05/goals-browser.json), [log](phase-05/browser.log): six widths; four goal links/direct/reload/Back/Forward/native focus; 22 unique canonical tools; seven categories/all-tools/unknown fragment; keyboard/focus/touch/no-JS/blocked fonts-icons/forced colors/CSS 200%/text 200% at 320 pass. All 22 local calculator destinations return 200. Zero page errors/failed local responses.
- [Calculator regression](phase-05/regression/calculators/v2-browser-result.json), [log](phase-05/regression/calculators/browser.log): **22/22 original Phase 0 fixtures match**, zero page errors/failed local requests. Fixtures were not re-recorded.
- [Header regression](phase-05/regression/header/browser.json), [log](phase-05/regression/header/browser.log): **27 widths**, keyboard/touch/navigation/loading/fallback/magnification pass.
- [Trust regression](phase-05/regression/trust/trust-browser.json), [log](phase-05/regression/trust/browser.log): **nine layouts/fallbacks**, trust links and private-search probes pass.
- [Search regression](phase-05/regression/search/browser.json): **44 exact name/slug cases**, intent/edge cases, 22 destinations/four questions, keyboard/AX/touch/fallback/privacy pass; DOM 13.90 ms / next frame 14.00 ms (limit 100 ms).
- Syntax checks pass for all 24 script/test files; whitespace checks pass. No standalone lint script is configured.

[Artifact delta](phase-05/artifact-delta.json): 322 → 323 files. Only generated `index.html` and `tools/index.html` change; one new `assets/v2/goals.css` stylesheet is added. **All 320 other parent files are byte-identical**, including search modules/data, sitemap, tool-link audit, compatibility outputs, calculators and Core. Docs/reference/cache/test dependencies remain excluded from deployment.

## Reproduction and handoff

Run `npm run sources:fetch`, `npm test`, `npm run build`, `npm run seo:validate`, `npm run output:validate`, and `node scripts/v2-baseline-inventory.mjs`. Serve stable output with `PORT=8002 npm run preview`; do not rebuild while browser checks read it.

```sh
NODE_PATH=/tmp/simplekit-v2-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium SIMPLEKIT_PREVIEW_URL=http://127.0.0.1:8002 SIMPLEKIT_EVIDENCE_DIR=/tmp/simplekit-phase5 node tests/v2-goals-browser.cjs
```

Regression scripts are `v2-baseline-browser.cjs`, `v2-header-hero-browser.cjs`, `v2-discovery-browser.cjs` and `v2-trust-browser.cjs` under `tests/`. They use isolated Playwright 1.56.1/system Chromium 151. Run search timing separately from heavy browser suites. External analytics are stubbed; these checks exercise local generated output, not production or Google's processing.

Phase 5 implementation and all seven listed task/acceptance criteria pass. Owner visual review can use the comparison links above. Next bounded roadmap task is Phase 6, when instructed. Phases 6–12 remain incomplete. The implementation task made no production merge/deploy, hosting/DNS change, calculator revision change or persistent task branch. The separately owner-requested demo upload is recorded below. `main` remains `ca7826db75cb4353488786aab80857b3a71c1be1`.

Implementation/evidence commit: `c7dd255ec57ccc7f698c4f6384ea0b9f6e76e7f5`, pushed directly to `develop-v2`. [Hosted validation run 38005820544](https://github.com/ashleysnl/simplekit-site/actions/runs/38005820544) **passed** for this exact commit. The follow-up handoff commit records CI only and changes no implementation or generated artifact. The workspace is left clean on synchronized `develop-v2`; no temporary branch or PR is needed.

## Owner-requested Phase 5 demo upload

The owner subsequently requested “Upload to the demo”. [Open the immutable Phase 5 demo](https://e9070fe2.simplekit-preview.pages.dev); the shared alias is [codex-preview.simplekit-preview.pages.dev](https://codex-preview.simplekit-preview.pages.dev).

[Manual preview workflow run 38006282182](https://github.com/ashleysnl/simplekit-site/actions/runs/38006282182) built exact source commit `882b745cf879c70f852a8cd665f0ec0e3eca2b0a`, whose [validation run 38005906854](https://github.com/ashleysnl/simplekit-site/actions/runs/38005906854) passed. The trusted workflow was dispatched from unchanged main commit `ca7826db75cb4353488786aab80857b3a71c1be1`; workflow execution did not move or merge into main. Both build and preview jobs passed: 27 tests, 23 source verifications, build/SEO/output checks, preview-only CNAME/robots/header isolation, dedicated-project guard, artifact download and upload.

[Before](phase-05/preview/project-before.json) and [after](phase-05/preview/project-after.json) Cloudflare reads confirm the project remains `simplekit-preview`, production branch `__production_disabled__`, Direct Upload/no Git source, no custom domain and no production deployment. The [observed GitHub environment](phase-05/preview/request.json) currently has no protection rules and admin bypass remains disabled; this task did not alter its settings. The existing workflow and project guards were retained, not recreated or weakened.

[Artifact verification](phase-05/preview/artifact-verification.json) downloaded the 6,106,545-byte preview ZIP (artifact `11651576388`, SHA-256 `c429fe3fc8fa6f88c8d243a7203adf0cf23fc600d9ca4603ce99cd174eef9d43`). All 323 files exactly match tested local output except the intended preview isolation: `CNAME` removed, `robots.txt` disallows all crawling, and `_headers` sets `X-Robots-Tag: noindex, nofollow`. Four goal links and 22 unique directory tools are present; docs/cache/reference/test dependencies are excluded. [Upload evidence](phase-05/preview/upload-summary.log) confirms that the upload job downloaded that same digest, then uploaded only branch `codex-preview` and produced the immutable URL above.

[Deployment identity](phase-05/preview/deployment.json), [build evidence](phase-05/preview/build-summary.log) and [live HTTP attempts](phase-05/preview/http.json) are retained. **Live automated verification remains blocked here:** 28 TLS-verifying requests to the homepage, directory, 22 calculator routes, preview files and alias returned 403, as with the earlier Phase 4 environment limitation. No proxy or TLS validation was bypassed. Public headers/content/interactions are not falsely marked passing; Cloudflare deployment status, workflow success and downloaded-artifact comparison independently confirm the upload. Owner browser review can use the demo link.

This is an early review snapshot through Phase 5, not completion of Phase 11 or production release approval. Phases 6–12 and earlier manual accessibility/toolbar-zoom follow-ups remain unchanged. No production upload, merge, DNS/custom-domain/hosting change or new development branch occurred; main remains the original production commit.
