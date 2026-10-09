# SimpleKit V2 branch audit and consolidation — 2026-10-09

## Audit before changes

Repository: `ashleysnl/simplekit-site`. Fetched all remote heads without pruning or deleting anything during the audit. Initial working tree was clean. Discovered **12 remote branches and 2 local branches**, representing **13 distinct names / 14 refs** (the build branch existed both locally and remotely). `develop-v2` did not exist. GitHub listed six open PRs, #6–#11; PR #5 was already squash-merged into `main`.

Production baseline: `ca7826db75cb4353488786aab80857b3a71c1be1`. V2 source tip: `d19eb3793a394fda5f9744dd9ef6304a96ba1870`.

| Branch | Location | Latest commit | Purpose / outstanding PR | Unique work and overlap | Recommended action |
| --- | --- | --- | --- | --- | --- |
| main | remote | ca7826d | Stable production; PR #5 merged | Baseline for all V2; unchanged | Retain; release only |
| work | local | ca7826d | Environment task checkout | None; identical to main and ancestor of V2 | Remove local alias after validation |
| feat/cloud-native-build | local + remote | a12596c | Portable build, pinned sources, CI, preview safeguards; PR #5 merged | 3 historical commits; full tree identical to main ca7826d | Retain as archive; optional later deletion after preserving commit provenance |
| feature/simplekit-v2-plan | remote | 866f691 | Roadmap and original visual target; PR #6 → main | 1 V2 commit; ancestor of Phase 4 | Inherit into develop-v2; close superseded PR and delete after validation |
| feature/simplekit-v2-phase-0 | remote | 0e3d0cc | Baseline, 22 fixtures, route/asset preservation guards; PR #7 → plan | 1 phase commit; 2 cumulative V2 commits; ancestor of Phase 4 | Inherit; close superseded PR and delete after validation |
| feature/simplekit-v2-phase-1 | remote | e79168d | Tokens, local fonts/icons, coastal image assets; PR #8 → Phase 0 | 2 phase commits; 4 cumulative; ancestor of Phase 4 | Inherit; close superseded PR and delete after validation |
| feature/simplekit-v2-phase-2 | remote | 586d594 | Responsive header, mobile navigation and coastal hero; PR #9 → Phase 1 | 2 phase commits; 6 cumulative; ancestor of Phase 4 | Inherit; close superseded PR and delete after validation |
| feature/simplekit-v2-phase-3 | remote | b1b07f9 | Local search and suggested questions; PR #10 → Phase 2 | 2 phase commits; 8 cumulative; ancestor of Phase 4 | Inherit; close superseded PR and delete after validation |
| feature/simplekit-v2-phase-4 | remote | d19eb37 | Trust indicators, privacy audit and preview evidence; PR #11 → Phase 3 | 3 phase commits; 11 cumulative V2 commits; most complete implementation | Create develop-v2 at this exact tip; close superseded PR and delete after validation |
| seo-phase4-hubs | remote | 20d600a | Distinct homepage/Tools/Learn intent; no open PR | 6 historical commits; full tree identical to production integration e348fa1 | Retain archive; no code to import |
| seo-phase5-trust | remote | 5190e07 | Authorship, privacy/methodology/support and trust links; no open PR | 8 historical commits; full tree identical to integration 73f39f3 | Retain archive; no code to import |
| seo-phase6-clusters | remote | fc80fe2 | Learn clusters, guide/tool links and sitemap; no open PR | 25 historical commits; full tree identical to integration 2477909 | Retain archive; no code to import |
| seo-phase7-crawl-hygiene | remote | 5b59101 | Compatibility noindex pages and retirement sitemap; no open PR | 15 historical commits; full tree identical to integration e68f317 | Retain archive; no code to import |

## Consolidation decision and preservation

The V2 branches form one linear history: main → plan → Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4. Every earlier V2 tip is an ancestor of Phase 4, with zero commits outside that stack. Establishing `develop-v2` at Phase 4 incorporates all six branches and all 11 V2 commits without cherry-picking, rewriting history, or changing implementation bytes. No V2 merge conflict remains.

The five older build/SEO branch trees are exactly identical to their respective production integration commits shown above (`git diff <branch> <integration>` is empty). Those integrations are ancestors of `develop-v2`, so their completed functionality is already preserved. Their commit IDs differ because earlier work was consolidated; patch-by-patch equivalence alone would give misleading results. No abandoned experiment or missing V2 implementation was found. Their historical branches are retained for provenance and are not active development destinations.

A dry-run `git merge-tree --write-tree` of the old build history against V2 reports conflicts in `scripts/build-site.mjs` and `scripts/preview.mjs` because the build changes were squash-integrated and V2 subsequently extended them. No real merge was attempted: importing that identical old tree offers no missing functionality and risks reverting V2. This is a redundant-history conflict, not unintegrated work.

Preserved features: original reference and full 13-phase roadmap; Phase 0 evidence and 22 exact calculator fixtures; local tokens/fonts/icons/responsive imagery; responsive header/hero and accessible navigation; manifest-backed local search and four suggested questions; trust indicators and privacy disclosures; all 22 pinned calculators, shared Core, 53 sitemap URLs and compatibility routes; historical SEO fixes and portable build/preview safeguards.

## Unfinished work retained

Roadmap/task states are unchanged by consolidation. Phases 2–4 retain manual accessibility/toolbar-zoom and owner-review limitations; Phases 5–12 remain unstarted. Goals, featured calculators, onboarding, full accessibility/performance/SEO QA, release regression, final preview review and production release remain roadmap work. Pre-existing mortgage overflow, Travel Planner “No tracking” wording discrepancy, and unavailable live preview/production checks remain documented in phase evidence. No approval or passing result is inferred from consolidation.

## Instruction changes

Added the exact mandatory branch strategy to `docs/SIMPLEKIT_V2_REDESIGN_PLAN.md`; replaced future feature-branch instructions and temporary-PR destinations without changing phase tasks/completion states. Added root `AGENTS.md`; updated `README.md`, `CLOUD_DEVELOPMENT.md`, and `SEO-MIGRATION.md`. Added `develop-v2` to the non-deploying validation workflow push filter. Other contributor/AGENTS files were absent. Historical evidence references remain historical; no preview/deployment workflow or hosting setting was changed.

## Validation and cleanup outcome

Local validation on Node 24.19.0:

| Check | Result |
| --- | --- |
| Pinned-source fetch/verification | 23/23 pass |
| `npm test` | 23/23 pass |
| `npm run build`, `npm run seo:build` | Pass; repeat build byte-identical across 322 files |
| `npm run seo:validate`, `npm run output:validate` | Pass: 22 calculators, 53 sitemap URLs, 67 HTML pages, 146 local assets |
| `node scripts/v2-baseline-inventory.mjs` | Pass; all routes/pins/protected assets retained, 94 calculator JS files match upstream; docs/reference excluded |
| Syntax / whitespace / documentation links | `node --check` passes for 21 script/test files; `git diff --check` passes; updated relative Markdown links resolve; no separate lint script is configured |
| Plan integrity | All 107 checkbox states and 13 phase status lines retained; only two future-task branch references updated |
| Calculator browser smoke | 22/22 routes and Core mounts pass; mortgage recalculation passes; zero page errors/failed local responses |
| Exact calculator fixtures | 22/22 match committed Phase 0 fixtures; zero page errors/failed local requests |
| Foundations browser | Seven viewport/density specimens pass, four local fonts, 18 icons, imagery/focus/font fallback; zero external requests/errors/failed responses |
| Header/hero browser | 27 widths from 320–1920 pass; keyboard/ARIA/touch/navigation/fallback/delayed loading/CSS magnification pass |
| Search browser | 44 exact name/slug searches, intent/edge cases, 22 destinations and four questions, keyboard/AX/touch/fallback/privacy checks pass; DOM and next-frame updates below 100 ms |
| Trust browser | Nine layout/fallback checks plus keyboard trust links and private-search probes pass |

Browser checks use isolated Playwright 1.56.1 and system Chromium against the local noindex preview, with analytics/external services stubbed. Native toolbar zoom, physical devices, manual VoiceOver/NVDA and live production/preview interactions are not claimed. One initial header run encountered a transient missing discovery-index asset while the reproducibility build replaced `dist/`; the unchanged header suite passed on rerun against the stable artifact. No product defect or source change was required.

Execution logs, browser reports and screenshots are saved under `/tmp/simplekit-v2-consolidation/` in this workspace; historical committed phase evidence is preserved. Source files/assets/calculator pins are byte-identical to Phase 4; no runtime files were changed by this task.

Remote publication and cleanup pending. No branch is deleted until browser validation finishes and its tip is confirmed to be contained in the published `develop-v2` history.
