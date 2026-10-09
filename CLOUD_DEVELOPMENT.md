# Cloud development

## Codex Cloud and Linux setup

Use the existing checkout in `/workspace/simplekit-site`. Cloud tasks are already isolated: do not create another worktree unless explicitly requested. For a new machine, clone this repository and check out `develop-v2` and synchronize it with `git pull --ff-only origin develop-v2` for all V2 work. Follow [Git Branch Strategy — Mandatory](docs/SIMPLEKIT_V2_REDESIGN_PLAN.md#git-branch-strategy--mandatory); any required temporary PR targets `develop-v2` and must be integrated after validation. `main` is reserved for the approved release. Install/use Git and the Node.js version in `.node-version` (24.19.0); no Mac tools or npm dependencies are needed to build. Network access to GitHub over HTTPS is required. Public source repositories need no personal token; use Codex's supplied Git proxy authentication for private access. Never store credentials here.

```sh
npm run sources:fetch
npm test
npm run build
npm run seo:validate
npm run output:validate
npm run preview
```

`npm run build` also acquires/verifies all pinned sources, so explicitly fetching first is optional. Scripts derive all paths from their module locations and can be invoked by absolute filename from another working directory. They never depend on `process.cwd()` or the developer's home directory. The preview binds to loopback on port 8000 (`PORT` can select another port) and returns `X-Robots-Tag: noindex, nofollow`. Do not expose local preview links in the onboarding UI. A server must restart in each new task; processes do not survive environment snapshots.

`.cache/calculator-sources/<source-id>/<full-revision>/` holds ignored source checkouts. `dist/` is the only newly generated deployment bundle. No downloaded repos, Git metadata, documentation, workflow files, build scripts, or package manifests are included in it. Each source must have the pinned HEAD, expected HTTPS origin and no tracked/untracked/ignored modifications. Corrupt/modified caches fail rather than silently changing inputs. Remove only the indicated cache directory to fetch it again. Source symlinks and Git submodules are rejected; no upstream install scripts execute.

## Dependency map and audit

The previous build depended on 22 `toolRepoPath` entries in `data/tool-migration-tracker.json`, each referring to a developer Mac checkout. The shell tracker duplicated seven local paths. README, core-shell instructions and the migration prompt also referenced that machine. The scripts assumed the caller's working directory and regenerated tracked pages in place. Those dependencies are replaced by a portable source lock, source IDs, module-relative paths and isolated output.

```text
data/calculator-sources.json -> GitHub commits -> .cache/calculator-sources/
  22 calculators -----------------------------> dist/<canonical-slug>/
  SimpleKit-Core -----------------------------> dist/assets/core/
templates/ + existing authored pages/assets ---> dist/HTML, CSS, images
data/tools.json + data/site-pages.json --------> robots, sitemap, registries
build + SEO/output validation -----------------> CI artifact / approved preview
```

`data/tools.json` is unchanged: it remains the calculator canonical URL manifest. `data/site-pages.json` records the 19 guide/subpage entries already present in the published sitemap but missing from the legacy generator's inputs. Together they preserve all 53 sitemap URLs. Existing published template edits, noindex fallback pages, maintainer copy and related links were brought back into their templates so a new build cannot revert them.

The GitHub revisions below were selected from the actual repository HEADs on October 9, 2026. Every existing checked-in calculator JavaScript file matched its corresponding upstream file byte for byte at these pins. The build preserves those bytes. Retirement Planner's unchanged browser modules under `src/` are now included; the old filter omitted them even though shipped module entry points imported them. Core's unchanged supported `core.css` and `core.js` are bundled locally and referenced from generated HTML; the module script attribute is normalized for the older Retirement caller. Calculator navigation continues to use the same canonical public URLs.

| Source ID | Independent repository | Pinned commit |
| --- | --- | --- |
| `retirement-planner` | [ashleysnl/RetirementPlanner](https://github.com/ashleysnl/RetirementPlanner) | `77babb4a4d8da834c3118c80e50b989ba7429130` |
| `cpp-calculator` | [ashleysnl/SimpleKitCPP](https://github.com/ashleysnl/SimpleKitCPP) | `e2f14e9401f9e16bf25fa6801dbf5df494676edf` |
| `take-home-pay-calculator` | [ashleysnl/SimpleKitTakeHomePay](https://github.com/ashleysnl/SimpleKitTakeHomePay) | `78d539f338078443563a7927e68c156aa261beac` |
| `debt-payoff-calculator` | [ashleysnl/SimpleKitDebt](https://github.com/ashleysnl/SimpleKitDebt) | `c36650f1ef95b446ec2035e1ee28d37d11d69e28` |
| `mortgage-calculator` | [ashleysnl/SimpleKITMortgageCalculator](https://github.com/ashleysnl/SimpleKITMortgageCalculator) | `92cf246721bf6b152334b7bc4185c62098abb8b4` |
| `house-affordability-calculator` | [ashleysnl/SimpleKitHouseAffordability](https://github.com/ashleysnl/SimpleKitHouseAffordability) | `1a34b31ba85ca3cf0e31175bc93446bb01a61154` |
| `credit-card-interest-calculator` | [ashleysnl/SimpleKitCreditCard](https://github.com/ashleysnl/SimpleKitCreditCard) | `2b75e7a44d3af3eb87cfb68c2cdbac9312114ef3` |
| `loan-calculator` | [ashleysnl/SimpleKITLoan](https://github.com/ashleysnl/SimpleKITLoan) | `bda03742ce0f2d8677a34e56e4a665d66a9113ae` |
| `rent-vs-buy-calculator` | [ashleysnl/SimplekitRentVsBuy](https://github.com/ashleysnl/SimplekitRentVsBuy) | `6d361109616df603b15b5a7b4f501d0407fa542f` |
| `budget-planner` | [ashleysnl/SimpleKitMonthlyBudget](https://github.com/ashleysnl/SimpleKitMonthlyBudget) | `35a6c68bca49d56b5e46d1ca7530dede48eccb36` |
| `compound-interest-calculator` | [ashleysnl/SimpleKitInvestment](https://github.com/ashleysnl/SimpleKitInvestment) | `cd7ec0dfeb1199a1e09f80a4c04ff3f2f29d4955` |
| `net-worth-calculator` | [ashleysnl/SimpleKitNetWorth](https://github.com/ashleysnl/SimpleKitNetWorth) | `55ede2d5e2130aa10530cccbc4fc8dac52f24975` |
| `savings-goal-calculator` | [ashleysnl/SimpleKitSavingsGoal](https://github.com/ashleysnl/SimpleKitSavingsGoal) | `0f4a7e4a276535694e121168b2f0e85d50e41630` |
| `emergency-fund-calculator` | [ashleysnl/SImpleKitEmergency](https://github.com/ashleysnl/SImpleKitEmergency) | `144367cf3e024810b70b373677844e7f36c2c829` |
| `mortgage-paydown-vs-invest-calculator` | [ashleysnl/SimpleKitMortOrInvest](https://github.com/ashleysnl/SimpleKitMortOrInvest) | `7e7198d600e545bf4b61c23fee50db9421b5b4c2` |
| `investment-fee-calculator` | [ashleysnl/SimpleKitFees](https://github.com/ashleysnl/SimpleKitFees) | `470270f4adfcdc6987ac1d20c3657453e65e6c1c` |
| `rrsp-vs-tfsa-calculator` | [ashleysnl/SimpleKitRRSPTFSA](https://github.com/ashleysnl/SimpleKitRRSPTFSA) | `ef07a5e34a6d838d34dbf39a3e860c39d8b0eccd` |
| `fire-calculator` | [ashleysnl/SimpleKitFIRE](https://github.com/ashleysnl/SimpleKitFIRE) | `e44404c1405382840c12a2edf7aae3d1aa816e1b` |
| `canadian-tax-checklist` | [ashleysnl/SimpleKitTaxCheckListCAN](https://github.com/ashleysnl/SimpleKitTaxCheckListCAN) | `ebe6150565b6e6dff5fcf0f96837f9710cbc422a` |
| `travel-planner` | [ashleysnl/TravelPlanner](https://github.com/ashleysnl/TravelPlanner) | `dc5b680e1bf49b75a0f8a746cf49c58b0914707a` |
| `debt-to-income-ratio-calculator` | [ashleysnl/SimpleKitDTI](https://github.com/ashleysnl/SimpleKitDTI) | `d3c05a120862cc5c46e27fd527d2369fd6679121` |
| `contractor-effective-hourly-rate-calculator` | [ashleysnl/SimpleKitContractorRate](https://github.com/ashleysnl/SimpleKitContractorRate) | `f8feb8c5d6193dc1a300a7632a26203223e95ecd` |
| `simplekit-core` | [ashleysnl/SimpleKit-Core](https://github.com/ashleysnl/SimpleKit-Core) | `cb1da347956f66cec40c72f48fae38b6daf201ed` |

Sources remain independent repositories. This site is their deployment assembler, not a new monorepo for calculator development. Migration completion/history stays in `data/tool-migration-tracker.json`; shared shell status stays in `data/core-shell-migration-tracker.json`, both referencing portable source IDs.

Browser-only external dependencies include optional Google Analytics (`www.googletagmanager.com`) and outbound support/reference links. They are not build prerequisites. Canonical cross-page links intentionally still point to `simplekit.app`, including during previews. Core CSS/JS no longer need a live network request in the generated bundle. No live DNS, Cloudflare edge redirects, custom-domain configuration, or existing production hosting settings have been changed.

## Build and validation

`npm run build` retrieves exact Git commits, validates manifest/templates, copies public authored pages/assets, renders templates, assembles all 22 calculator routes, bundles Core, and writes SEO outputs into `dist/`. Missing sources, incomplete trackers, unknown template tokens, unpinned commits, unsafe source paths, dirty caches, and published legacy links fail the build. Building twice with the same inputs must produce identical files and leave the tracked checkout unchanged.

`npm run seo:build` refreshes only SEO outputs in an existing `dist/` build. `npm run seo:validate` checks source templates/pages and deployment files; it fails if output is absent. Historical `docs/seo/redirect-verification-2026-10-02.json` intentionally records redirect origins, not promoted page links. `docs/` and named developer Markdown documents are excluded only when scanning the source checkout, and are never copied into the bundle. The published-output scan still checks such files if they appear in output. The only published compatibility exceptions are the generated browser registry and data registries; HTML, navigation JS, CSS, robots and sitemaps are not exempt. Tests prove these boundaries.

`npm run output:validate` verifies all canonical routes, the exact sitemap inventory, one correct canonical per indexed page, agreement between canonical and Open Graph URLs, rendered tokens, referenced local images/styles/scripts/manifests, CSS resources, and static ES-module dependencies. Retired `/tools/` compatibility pages remain noindex with canonical and refresh destinations; their Open Graph URLs now agree with those destinations. No genuine legacy calculator links were found in the published content during the source audit.

`npm test` uses Node's built-in test runner; it checks pin/route contracts, cache tampering, historical report scope, legacy URLs in production files, compatibility exceptions, canonical validation, local path resolution, Core module integration and broken output dependencies. Build output validation is also required; unit tests alone do not establish site readiness.

## Updating calculator revisions

1. Change calculator code in its original GitHub repository through a reviewed PR. Review its HTML, metadata, assets and logic there.
2. Resolve a reviewed commit, for example `git ls-remote https://github.com/ashleysnl/SimpleKitCPP.git refs/heads/main`. Inspect the commit and select its full 40-character SHA; never put `main`, a tag, an absolute path or a short SHA in the lock.
3. Update only that source's `revision` in `data/calculator-sources.json`. Keep its source ID/route stable. Old ignored cache directories can stay until deliberately cleaned.
4. Fetch, test, build, validate SEO/output, inspect the calculator interaction and bundle diff, and review any intended changes to JavaScript before merging the source-pin PR.
5. New tools additionally need the canonical manifest entry and completed tracker/source ID. Keep original tool repositories separate.

For shared Core changes, follow the same process for `simplekit-core`; verify headers, navigation, footers and every consuming tool before approving the new pin.

## GitHub Actions

`.github/workflows/validate.yml` runs for PRs, main/develop-v2 and temporary feature/fix/chore pushes, or manual dispatch. It pins the Actions revisions, uses `.node-version`, retrieves all sources, runs tests/build/SEO/output checks, verifies that tracked files stay unchanged and uploads `dist/` as the `simplekit-site` artifact. It has only `contents: read` and contains no deployment step. Configure this validation job as a required branch-protection check before production merges. An actual hosted Actions run is distinct from executing its commands locally.

## Cloudflare previews

The repository has no existing Cloudflare Pages project, Wrangler configuration or deployment workflow. Documentation describes GitHub Pages (`ashleysnl.github.io`) behind Cloudflare DNS/edge redirects; the root `CNAME` is `simplekit.app`. The owner confirmed that no preview project exists. Live account/Pages settings were not available from this environment, so this change preserves that arrangement rather than switching production hosting.

`.github/workflows/cloudflare-preview.yml` is **manual only**. It builds the selected ref in a job without Cloudflare credentials, validates it, removes the preview CNAME, adds `X-Robots-Tag: noindex, nofollow`, and changes only the preview artifact's robots policy to disallow crawling. The approved deployment job reads the project through Cloudflare's API and refuses any production branch other than `__production_disabled__` or any custom domain. It deploys only branch `codex-preview` to project `simplekit-preview`, using pinned Wrangler 4.45.0. It never targets the production host or changes production robots/sitemap/canonical files.

Before using it (these resources have **not** been created):

1. Create a separate Cloudflare Pages Direct Upload project named `simplekit-preview`; set its production branch to `__production_disabled__`, disable Git-based automatic deployment, and attach no custom domains. This should be reviewed in Cloudflare settings before first upload.
2. Create the GitHub environment `simplekit-preview`, require reviewer approval, and restrict permitted workflow branches to the trusted default branch. Without configuring these rules, GitHub's environment name alone does not enforce approval.
3. Store `CLOUDFLARE_API_TOKEN` as an environment secret and `CLOUDFLARE_ACCOUNT_ID` as an environment variable. Use only the Cloudflare Pages permissions required for the preview account; do not enter secrets into repository files or chat.
4. After the workflow is reviewed and available on the default branch, manually dispatch it with the exact reviewed `develop-v2` commit. Approve the preview environment job, then use the Cloudflare preview URL from Wrangler's output.

No preview was uploaded during this task. CI artifacts and the local noindex preview work without these prerequisites. Do not configure the production site as the preview project to bypass the guards.

## Production deployment (separate approval)

V2 must not be merged into `main` or deployed to production automatically. Validated V2 work is committed to `develop-v2`; required temporary PRs target and integrate into `develop-v2`. The included workflows have no production deployment permission or step. Existing root files/CNAME remain intact for current hosting.

After the owner approves production deployment:

1. Require a successful validation check and review source pins, canonical inventory and browser results before merging.
2. Confirm the real GitHub Pages publishing source/branch and Cloudflare DNS/redirect configuration in their settings. No live hosting switch was performed or assumed here.
3. Build the reviewed commit and validate `dist/`. Review the artifact and preserve existing edge redirects and `simplekit.app` custom-domain ownership.
4. Choose an approved artifact publishing path for the current Pages origin (or an independently approved Cloudflare Pages migration). If GitHub Pages currently publishes the repository root, add a separately reviewed Pages artifact deployment using `dist/` and the protected `github-pages` environment; do not overwrite the root or repoint hosting during this task.
5. Obtain the explicit production approval, deploy the reviewed artifact, verify the 53 sitemap routes/22 calculators and legacy redirects, and retain the previous artifact for rollback.

## Clean-environment evidence

Exact final results and browser smoke-test scope are recorded in [docs/cloud-native-validation.md](docs/cloud-native-validation.md). Browser analytics requests are stubbed during functional checks; live Google Analytics and external government/support destinations are outside this build validation. The validation workflow passed on GitHub for build commit `a0666afc3d7e2889ac584aba5c1410eb0746cdef`; preview deployment remains unrun until its settings and review are complete.
