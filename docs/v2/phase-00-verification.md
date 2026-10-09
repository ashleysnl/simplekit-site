# SimpleKit v2 Phase 0 verification

Recorded 2026-10-09 UTC on `feature/simplekit-v2-phase-0`. [Phase 0 PR #7](https://github.com/ashleysnl/simplekit-site/pull/7), evidence commit `0e3d0cc747f5a4d07e4747d0460bb67e6d954c1d`. Phase 0 only; no redesign code, calculator edits, source revision changes, hosting changes, merge or deployment.

Baseline tasks and acceptance checks pass. The owner instructed proceeding to Phase 1 on 2026-10-09, clearing the roadmap execution pause; Phase 0 is `[x]`. This does not claim a GitHub review or production release approval. At baseline capture, [plan PR #6](https://github.com/ashleysnl/simplekit-site/pull/6) was OPEN with no recorded review decision when inspected. The owner explicitly requested this baseline work. Phase 1 is authorized by that subsequent instruction. Live edge responses remain unverified because this environment receives HTTP 403; that limitation does not invalidate the separate generated-output fixtures.

## Source and architecture inventory

- Latest `main` and successful production Pages build: `ca7826db75cb4353488786aab80857b3a71c1be1`. Plan branch and implementation starting commit: `866f691b2ef4f23431e1642f65f8337dd5b41d85`. No existing workspace edits were present before creating the implementation branch.
- Node 24.19.0 matches `.node-version`; npm 11.9.0, isolated Playwright 1.56.1, Chromium 151.0.7922.173 on Linux. Sources were verified from the existing cache against all 23 immutable GitHub revisions. This run did not claim an empty-cache fetch.
- No applicable repository/workspace `AGENTS.md` was found. Instructions inside downloaded calculator checkouts were outside the authored changes; caches were not edited.
- Read `README.md`, `CLOUD_DEVELOPMENT.md`, prior cloud validation evidence, the complete v2 plan and its original PNG. Reference SHA-256 remains `3a3dda8eacc4d1795643e6be4672a51d5310133529366f158e45cae2df97ad23`.
- `templates/index.html` and `templates/tools/index.html` are authored landing sources. Build resolves `{{toolUrl:ID}}` and `{{toolCount}}` through `data/tools.json` and `getCanonicalToolRegistry()` in `scripts/seo-utils.mjs`; `assets/tool-registry.js` in output is generated. No second route authority was added.
- `scripts/build-site.mjs` uses pinned repositories, renders templates, localizes bundled Core, preserves supplemental sitemap pages and excludes documentation from `dist/`. Existing compatibility pages are retained.
- `assets/site.css` has **37 output HTML consumers**, listed in [css-consumers.json](baseline/css-consumers.json). A future shared CSS change needs that scope checked. Authored CSS and all existing templates remain unchanged.
- The validation workflow tests/builds/uploads without deploying. Preview is manual, uses `source_ref`, and verifies the dedicated `simplekit-preview` project, `__production_disabled__` branch and absence of custom domains. Neither workflow was modified or dispatched.

[Source identity and input hashes](baseline/source-identity.json) · [23 source locks, tools, routes and protected assets](baseline/contracts.json) · [94 upstream JS comparisons](baseline/upstream-js.json).

## Route, link and artifact evidence

| Contract | Result |
| --- | --- |
| Tool inventory | Exactly 22 unique IDs; names, canonical paths/URLs and legacy hosts saved unchanged. |
| Sitemap | Exactly 53 URLs; manifest plus supplemental pages, checked-in sitemap and generated sitemap sets match. |
| HTML routes | 67 generated HTML pages, including 13 `/tools/.../` compatibility pages and the retirement 404 page. Canonical metadata is recorded where applicable. |
| Links | 1,109 anchor occurrences saved in [links.json](baseline/links.json); existing SEO/output validation passes. |
| All output HTTP requests | 278/278 files returned 200, matching SHA-256 bytes and local `X-Robots-Tag: noindex, nofollow`. [Inventory](baseline/http-inventory.json). |
| Tool runtime | 22/22 canonical **paths on loopback origin**, with real local calculator code and mounted Core. |
| Protected assets | 231 calculator/Core files saved with byte counts and hashes. All 94 calculator JS files match pinned upstream bytes. |
| Repeat build | All 278 file hash/size entries identical after rebuilding. [Artifact inventory](baseline/artifact-inventory.json), [repeat evidence](baseline/reproducibility.json). |
| Guard sensitivity | A deliberate comment appended to generated mortgage JS was rejected; original bytes restored in `finally`, then the guard passed. [Evidence](baseline/negative-guard-check.json). No cache/source edits. |

The artifact inventory is the complete baseline, while the guard checks the protected calculator/Core assets, source pins, original reference, routes and sitemap. Homepage/shared-site assets may change in their authorized later phases. Changes to generated wrappers require explicit comparison/review instead of silently refreshing the baseline.

Generated baseline archive and production source archive are saved under `/workspace/scratch/simplekit-v2-baseline/`, with paths and SHA-256 values in [reproducibility.json](baseline/reproducibility.json). These are local retained copies, not a production release destination. Generated `dist/` and caches are not committed. The immutable source SHA and source pins allow reconstruction after this workspace ends.

## Calculator fixtures

[tool-fixtures.json](baseline/tool-fixtures.json) saves initial and final input states, before/after displayed outputs and every action's intermediate output for all 22 tools. Each tool uses a fresh context; time is fixed to `2026-10-09T12:00:00Z`, locale `en-CA`, timezone UTC. Compare exact tool-displayed text after whitespace normalization; tool rounding is preserved, with no additional numeric tolerance. Random checklist item IDs are excluded from input selectors; completion count and the clicked checkbox interaction are compared.

| Tool | Meaningful interaction | Recorded result after interaction |
| --- | --- | --- |
| Retirement Planner | Load landing demo | Annual shortfall $93,531; projected portfolio $1,268,983; target age 63. |
| FIRE | Annual spending → $80,000 | FIRE target $2,000,000; estimated 29 years. |
| CPP | Age-65 amount → $1,200; Compare | Monthly/lifetime recommendation panel recomputes; full displayed panel saved. |
| RRSP / TFSA | Contribution → $12,000; Calculate | Leading reinvested-refund option $909,645. |
| Compound interest | Starting amount → $20,000 | Ending portfolio $388,952. |
| Savings goal | Goal → $20,000 | Goal date Sep 9, 2031; projected progress 42.4%. |
| Emergency fund | Essentials $2,500, saved $5,000, contribution $300 | Six-month target $15,000; gap $10,000. |
| Net worth | Cash → $15,000 | Net worth $15,000. |
| Budget | Load sample; first income row → $7,000 | Income $7,850; expenses $4,259; surplus $3,591. Sample and recalculation outputs both saved. |
| Take home pay | Monthly salary → $6,000 | Monthly net $4,530 (2026 Ontario). |
| Debt payoff | Extra monthly → $300; Calculate | 2 years 9 months; total interest $2,245. |
| Credit card | Monthly payment → $300 | 1 year 11 months; interest $1,342. |
| Loan | Principal → $30,000 | Regular monthly payment $586.84. |
| House affordability | Annual income → $150,000 | Planning target $685,785. |
| Rent vs buy | Home price → $650,000 | Renting ahead by $41,482. |
| Mortgage paydown vs invest | Extra monthly → $1,000 | Investing ahead by $3,125. |
| Investment fees | Portfolio B fee → 1% | Portfolio B $595,355; wealth difference $98,722. |
| Mortgage | Principal $480,000 → $960,000 | Rounded payment $2,860 → $5,721. |
| Tax checklist | Open first group; check first item | Completion 0 → 1; remaining 43 → 42; total stays 43. |
| Travel | Load hero demo | Sample Family Theme Park Trip and populated itinerary. |
| Debt-to-income | Monthly gross → $8,000 | Back/front DTI 27.5%. |
| Contractor hourly rate | Hourly rate → $120 | Effective rate $112.98/hr. |

Both record and subsequent comparison runs passed 22/22, with zero page errors or failed local requests. [Record log](baseline/fixtures-record.log), [comparison log](baseline/fixtures-compare.log), [comparison environment/result](baseline/browser-compare.json). The existing smoke also passed all routes and mortgage principal doubling: [smoke log](baseline/browser-smoke.log).

External Google Tag Manager requests were stubbed. This establishes local calculator behavior, not live analytics behavior, exhaustive formula correctness, storage/export/import coverage or every edge case. No fixture navigation followed production canonical links.

## Screenshots and existing behavior

28 JPEG screenshots (80% quality, 1× device scale) are committed under [baseline/screenshots](baseline/screenshots). Homepage, header, directory, retirement demo, budget sample and mortgage each have the required 375, 390, 768 and 1440 px views. Homepage/directory capture full pages; representative tools capture the viewport after the named interaction. Extra homepage checks cover 320, 1920, 844×390 landscape and a 2× CSS zoom approximation. Native browser zoom, screen readers and real devices were not tested in Phase 0.

- [390 px homepage](baseline/screenshots/home-390.jpg), [header](baseline/screenshots/header-390.jpg), [directory](baseline/screenshots/directory-390.jpg), [retirement demo](baseline/screenshots/retirement-demo-390.jpg), [budget](baseline/screenshots/budget-sample-390.jpg), [mortgage](baseline/screenshots/mortgage-390.jpg).
- Current header wraps ordinary navigation links; it has **no hamburger/menu state** to capture. The screenshot records that baseline instead of inventing an open menu.
- Current homepage is much longer than the reference and uses existing sans-serif/card styling, with no coastal image, new wordmark, search panel or guided onboarding. Reference layout/typography/hero changes belong to later phases. No intentional design deviations were introduced in Phase 0.
- Homepage/directory and retirement/budget sampled widths show no document overflow. **Existing mortgage overflow**: 681 px document at 375/390 px viewports; 829 px at 768 px. Desktop mortgage is 1440/1440. This is a baseline layout issue, not a v2 regression; calculator source/layout remains unchanged. [All observations](baseline/screenshots/observations.json).

## Production identity, redirects and rollback baseline

Read-only GitHub evidence establishes Pages legacy publishing from `main:/`, custom hostname `simplekit.app`, latest successful build `1271753503` at `ca7826d`, and deployment `6961109871`. [Pages config](baseline/pages-config.json), [build](baseline/production-build.json), [deployment/status](baseline/production-deployment.json), [status](baseline/production-status.json), [workflow identities](baseline/baseline-workflow-runs.json).

The actual production **github-pages artifact 11616387902** from [run 37932730808](https://github.com/ashleysnl/simplekit-site/actions/runs/37932730808) was recovered through the GitHub connector and saved as ZIP plus `artifact.tar` under `/workspace/scratch/simplekit-v2-baseline/production-pages/`. It contains 284 files; checksums and full inventory are in [preserved-production-artifact.json](baseline/preserved-production-artifact.json). Its homepage, sitemap and robots match checked-in source bytes. The artifact has no CNAME file; the GitHub Pages API records the configured custom domain separately. The GitHub artifact expires October 10; the downloaded copy and conversation file `file_0000000020f881f7afe81f7629133cbc` retain its bytes separately. Retention in approved durable release storage and operational rollback permissions must be verified before Phase 12.

Production's Jekyll/root artifact and the 278-file generated baseline differ **before v2**: production includes Markdown/converted documentation, templates and build files; generated output excludes them, bundles local Core and restores calculator modules. There are 37 changed common files. This is the existing publishing distinction documented in the roadmap, not authorization to replace production output. Do not use a local `dist/` checksum as the identity of the deployed production artifact.

[Cloudflare snapshot](baseline/cloudflare-config.json) records DNS, zone/page-rule configuration and the dedicated preview project. Existing preview is `https://d3201261.simplekit-preview.pages.dev`, alias `https://codex-preview.simplekit-preview.pages.dev`, production branch `__production_disabled__`, no custom domains. This historical preview was not uploaded or exercised by this task.

[Configured redirects](baseline/configured-redirects.json) contains all **49 entries** with complete pagination and the enabled account redirect ruleset. [Reconciliation](baseline/redirect-reconciliation.json) confirms all 22 legacy hosts target their manifest canonical destination with 301 configuration. Configuration checks are separate from live HTTP behavior.

**Unresolved read limitation:** HTTPS homepage, sitemap, robots and all 22 legacy roots returned 403 (`error code: 1010`, server `envoy`) from this environment. [Live request evidence](baseline/live-production.json). This does not establish that public visitors receive 403 or that redirects are broken. Live response/byte verification must be repeated from permitted access before release; no DNS, rules or security settings were changed to bypass it. The CLI artifact redirect also returned 403; connector download successfully recovered the artifact.

The retained previous production artifact/source, deployed SHA and configuration provide comparison/rollback preparation evidence. No rollback was executed, and no operational production rollback permission is implied.

## Reproduce and handoff

Run the supported sequence with Node 24.19.0:

```sh
npm run sources:fetch
npm test
npm run build
npm run seo:validate
npm run output:validate
node scripts/v2-baseline-inventory.mjs
npm run preview
```

Results: source verification 23/23; **15 tests pass** (11 existing plus 4 preserved-contract tests); build 22 tools; SEO passes; output validates 53 sitemap URLs, 67 HTML pages and 133 referenced local assets. [Command logs](baseline/build.log), [tests](baseline/tests.log), [SEO](baseline/seo.log), [output](baseline/output.log), [guard](baseline/contracts-compare.log).

With preview running, reproduce browser checks using the isolated setup from `docs/cloud-native-validation.md`:

```sh
browser_test_dir=$(mktemp -d)
npm --cache "$browser_test_dir/cache" install --prefix "$browser_test_dir" --no-package-lock --no-audit --no-fund playwright@1.56.1
NODE_PATH="$browser_test_dir/node_modules" CHROMIUM_PATH=/usr/bin/chromium node tests/browser-smoke.cjs
NODE_PATH="$browser_test_dir/node_modules" CHROMIUM_PATH=/usr/bin/chromium node tests/v2-baseline-browser.cjs
NODE_PATH="$browser_test_dir/node_modules" CHROMIUM_PATH=/usr/bin/chromium node tests/v2-baseline-screenshots.cjs
```

Screenshots default to `/tmp/simplekit-v2-screenshots`; comparison result defaults to `/tmp/v2-browser-result.json`. `--record` on inventory/browser scripts is only for deliberate, reviewed baseline replacement; normal checks must compare committed evidence. Do not record v2 changes as a new expected result to hide a regression. Existing npm tests require no Playwright installation.

Authored changes are only this evidence, Phase 0 checklist updates, a preservation inventory script and optional/browser plus Node contract tests. No runtime dependencies were added. Production root pages, templates, CSS, calculator routes/formulas/defaults/data behavior, all source pins, CNAME and hosting workflows/configuration remain unchanged. Nothing from this task is deployed.

Next bounded action: Phase 1 foundations, as subsequently requested by the owner. Resolve live-access limitations before release; Phases 2–12 remain pending.
