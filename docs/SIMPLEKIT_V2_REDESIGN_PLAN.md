# SimpleKit v2 phased redesign implementation plan

Prepared: 2026-10-09. Repository: `ashleysnl/simplekit-site`.

This is an execution roadmap, not an implementation or release approval. All new tasks start incomplete. Implement one phase at a time on `develop-v2`, using a PR targeting `develop-v2` only when required, preserving all 22 calculators, their URLs, and production until the owner explicitly approves release.

## Git Branch Strategy — Mandatory

SimpleKit V2 uses a simplified development workflow.

### Permanent branches

* `main`: Stable production branch. Do not use for ongoing V2 development.
* `develop-v2`: The only persistent development branch for SimpleKit V2.

### Rules for all future Codex tasks

1. Always begin by checking out `develop-v2` and synchronizing with its latest remote state.
2. Implement all V2 tasks, fixes, refinements, SEO improvements, and documentation updates on `develop-v2`.
3. Do not create new persistent feature, phase, experiment, or Codex development branches.
4. Commit completed work directly to `develop-v2` when repository permissions and execution environment allow.
5. If Codex Cloud or GitHub requires a temporary task branch, create only the minimum necessary branch and merge it back into `develop-v2` as soon as the task passes validation.
6. Never leave completed work isolated on a temporary branch.
7. Before starting a new task, verify that previous completed changes have been integrated into `develop-v2`.
8. Do not merge V2 into `main` until the V2 release checklist and testing requirements have been satisfied.
9. Do not deploy V2 to the production website until explicitly authorized.
10. Treat `develop-v2` as the single source of truth for current V2 development.

### Standard Codex workflow

Checkout `develop-v2` → Sync → Implement → Test → Commit → Push → Update V2 plan

If the environment requires a pull request, target `develop-v2`, not `main`.

Start with a clean working tree, `git fetch origin`, `git switch develop-v2`, and `git pull --ff-only origin develop-v2`. If synchronization cannot fast-forward, inspect and preserve both histories; do not force-push or reset away work. Review outstanding PRs targeting `develop-v2` before beginning another task. Commit and push the plan update too so its handoff remains current.

### Release workflow

`develop-v2` → Final QA → Approved PR into `main` → Production deployment

After release, preserve `main` as the production source of truth and explicitly decide whether `develop-v2` is still required.

The [2026-10-09 branch audit and consolidation](v2/branch-consolidation-2026-10-09.md) records the inherited plan/Phase 0–4 history and archived branches. Those historical branches and PR references are evidence, not development destinations. Phase acceptance, unfinished checks, and release approval gates below remain in force.

## Task state convention

| State | Meaning | Transition rule |
| --- | --- | --- |
| `[ ]` | Incomplete | Default for every new task and acceptance check. |
| `[~]` | In progress | Work has actually begun; record the branch/PR and remaining work. |
| `[x]` | Complete | Acceptance criteria passed and evidence is linked. |

Use literal `- [~]` for work in progress; GitHub may display it as text rather than a native checkbox. A blocked task stays `[ ]` or `[~]` with a written blocker. Do not mark implementation complete because this plan or its reference image was committed. Phase status becomes complete only after every task and acceptance check passes.

## Persistent visual target

![SimpleKit v2 mobile design target: coastal hero, search, suggested questions, trust indicators, goal cards, calculator list and guided discovery](design-reference/simplekit-v2-target.png)

[Open the original design target](design-reference/simplekit-v2-target.png). This is the unchanged user-uploaded `image.png` recovered from the referenced “Premium design proposal” chat (original environment path `/mnt/data/image.png`). It is 851 × 1848 pixels; SHA-256: `3a3dda8eacc4d1795643e6be4672a51d5310133529366f158e45cae2df97ad23`.

Keep this original file stable for comparisons during every phase. Commit production hero imagery and icons separately; do not render the whole mockup as the website or use its embedded text as imagery. Record intentional visual deviations, their reason, and owner decisions in the phase evidence. The image establishes mobile visual hierarchy; desktop arrangements, exact font families, spacing values, and interaction states must be designed and verified rather than assumed to exist in the reference.

### Design requirements observed in the reference

- White/off-white background, deep navy headings, bright blue links/buttons, muted slate supporting text, subtle borders/shadows and generous spacing.
- “SimpleKit.” wordmark with blue “Kit.”; tagline “Free planning tools for Canadians”; rounded hamburger control.
- A misty coastal mountain/lake or inlet landscape fading behind live text: eyebrow “YOUR MONEY, MADE CLEARER”, headline “Better financial decisions start here.” and “Free, practical calculators to plan your money with confidence. No signup required.”
- Rounded search field: “What would you like to figure out?”; a separate white “POPULAR QUESTIONS” panel with four question rows and chevrons.
- Three trust items: “No signup / Just open and use”, “Private / Stays in your browser”, “Built for Canadians / Local context and tax”. Verify those claims before shipping (Phase 4).
- “EXPLORE BY GOAL / What are you planning?” with Retirement, Home & mortgage, Budget & debt, Investing cards and “View all 22 tools”.
- “POPULAR CALCULATORS” with Retirement Planner, Mortgage Calculator, Compound Interest Calculator, Budget Planner and FIRE Calculator in that order.
- Pale blue “Not sure where to start?” panel, short guidance copy and a blue “Get started” button.
- Serif display headings and calculator names, sans-serif interface/body text, consistent outlined icons in pastel circular backgrounds. The image uses two goal columns; use one on narrow screens if necessary for readable labels and usable controls.

## Repository contracts and boundaries

Baseline inspected: `main` commit `ca7826db75cb4353488786aab80857b3a71c1be1`. Recheck the latest approved baseline when implementation begins.

| Source or workflow | Codex guidance |
| --- | --- |
| `templates/index.html`, `templates/tools/index.html` | Edit authored landing-page templates. Use `{{toolUrl:tool-slug}}` and `{{toolCount}}`; do not hardcode canonical tool URLs in templates. |
| `assets/site.css`, new homepage assets/modules | Scope v2 styles under a homepage class or component namespace. Shared CSS changes require checking every consumer. |
| `data/tools.json` | Authoritative 22-tool names, slugs, canonical paths/URLs and legacy subdomains. Derive discovery metadata from these IDs and validate coverage. |
| `assets/tool-registry.js` and generated registries | Inspect generation before editing; use canonical registry contracts, do not create a second route authority. |
| `data/calculator-sources.json` | Pinned calculator/Core GitHub sources. Leave revisions unchanged throughout this redesign unless separately reviewed and explicitly authorized. |
| Calculator route directories and `.cache/calculator-sources/` | Existing calculator logic comes from independent repositories. Do not patch copied calculator code or downloaded caches to implement the homepage. |
| `scripts/build-site.mjs` | Produces ignored `dist/`; documentation is excluded. Keep this plan and original mockup under `docs/`, out of public deployment output. |
| `tests/browser-smoke.cjs` | Current optional Playwright test accepts local preview only, checks all tool routes/Core, and verifies mortgage recalculation. Add homepage behavior coverage; do not claim existing smoke covers every calculator computation. |
| `.github/workflows/validate.yml` | PR validation builds/tests/validates artifacts and checks tracked files remain unchanged. It does not deploy. |
| `.github/workflows/cloudflare-preview.yml` | Manual workflow with `source_ref`; dedicated `simplekit-preview` project and `codex-preview` deployment branch; production branch guard `__production_disabled__`, no custom domains. |

See [README](../README.md), [Cloud development](../CLOUD_DEVELOPMENT.md), [cloud validation evidence](cloud-native-validation.md), [SEO migration](../SEO-MIGRATION.md), and [Core shell migration](../CORE-SHELL-MIGRATION.md). Cloud-development setup statements reflect an earlier task. The prior chat reports a successful preview workflow and browser verification; treat that as historical evidence, not verification of the future v2 build. Do not recreate existing preview infrastructure without checking it.

Non-negotiable boundaries:

1. Preserve calculator formulas, defaults, storage/export/import behavior, source pins and public routes. Keep existing `/tools/` compatibility pages, legacy redirects, guides, privacy/methodology/support links, and sitemap inventory.
2. Keep production root pages, `CNAME`, GitHub Pages publishing configuration, DNS, Cloudflare production settings and deployed commit untouched during implementation/preview phases. Do not copy `dist/` over checked-in root pages.
3. No automatic merge into `main`, production deploy, hosting migration, account requirement or remote collection of search/onboarding answers. Explicit production approval must identify the exact commit/artifact and deployment destination.
4. Existing canonical navigation may point to `simplekit.app` even in previews. Distinguish canonical-link verification from exercising a calculator in the preview: open its canonical **path** on the preview origin. Never mistake a successful production navigation for a preview test.

## Execution protocol for every phase

Read this plan, repository instructions, relevant source files and the target PNG before changing code. Confirm prerequisite phases and start from the latest reviewed work. Check out and synchronize `develop-v2` as required above, and verify previous completed work is integrated. Continue directly on `develop-v2`; use a temporary task branch and a PR targeting `develop-v2` only if the environment requires it. Do not edit `main` directly. A documentation-plan PR does not authorize implementation or release.

Set only the active phase/task to `[~]`. Implement its bounded scope. Reuse the current static HTML/CSS/JavaScript architecture unless a separate decision is approved. Capture before/after screenshots at 375, 390, 768 and 1440 CSS pixels; check 320 and 1920 widths, portrait/landscape and zoom. Compare section order, typography, landscape fade/crop, spacing, colors and controls with the reference; document differences.

For code phases run the current supported validation sequence with the Node version in `.node-version`:

```sh
npm run sources:fetch
npm test
npm run build
npm run seo:validate
npm run output:validate
npm run preview
```

Use the isolated Playwright setup documented in `docs/cloud-native-validation.md` for `tests/browser-smoke.cjs`. Do not add runtime dependencies just to run browser checks. Run focused interaction checks appropriate to the phase. Build must leave tracked files unchanged apart from intentional authored changes; do not commit `dist/` or `.cache/`.

Record evidence in the `develop-v2` commit (and a PR targeting `develop-v2` if required) and a future `docs/v2/phase-NN-verification.md`: source commit, task states, files changed, commands/results, browser/device scope, screenshot paths, comparison notes, route checks, known limitations, and preview workflow/deployment links if used. Add evidence links to this plan. Mark `[x]` only after the criteria pass; report blockers without checking them off. Obtain review of the finished phase before proceeding to the next phase when working through the roadmap step by step.

Reusable Codex execution prompt:

> Implement Phase NN only from `docs/SIMPLEKIT_V2_REDESIGN_PLAN.md` on synchronized `develop-v2`. Read `docs/design-reference/simplekit-v2-target.png` and the repository instructions first. Confirm prerequisites, set active tasks to `[~]`, implement the phase using existing source/template/registry contracts, and run its acceptance checks and the supported build validations. Preserve all 22 calculators, existing URLs, source pins, production files/configuration and deployment. Record screenshots, results, limitations and evidence links; set passing tasks to `[x]`. Commit completed work to `develop-v2`; if a temporary branch is required, open or update a focused PR targeting `develop-v2` and integrate it after validation. Update this plan and report the next incomplete task. Do not merge or deploy production.

## Phase 0 — Baseline inventory and regression guardrails

Status: `[x]`. Baseline tasks and acceptance checks passed. Owner instructed proceeding to Phase 1 on 2026-10-09; this clears the execution pause without representing a GitHub review or production release approval.

- [x] Reinspect the latest approved commit, repository instructions, templates, registry generation, CSS consumers, source pins and hosting workflows; record baseline SHAs.
- [x] Capture the current homepage, header/menu, directory and representative tool screenshots; save route/link inventories and deterministic tool input/output fixtures.
- [x] Record all 22 tools from the inventory below, all existing site/sitemap URLs, compatibility routes and configured legacy redirect destinations. Confirm the currently documented 53 sitemap URLs against actual manifests/output.
- [x] Establish the current build, SEO/output validation and browser-smoke results; document existing failures separately from v2 regressions.
- [x] Record production deployment identity/configuration through permitted read-only evidence and preserve the previous deployment/artifact for later comparison and rollback.

Acceptance:

- [x] Inventory contains exactly 22 unique tool IDs and unchanged canonical paths; every route returns the expected working page in local output.
- [x] Baseline fixture evidence exists for Retirement Planner demo, Budget Planner recalculation, mortgage principal/payment, and one meaningful input/output or checklist/planner interaction for every remaining tool.
- [x] A reproducible baseline build and artifact inventory are saved with any unresolved blocker; no new code is started with unexplained baseline failures.

Codex guidance: start with manifests/build outputs rather than assuming the checked-in root is the new deployment artifact. Add meaningful preservation checks that compare the baseline contracts and pinned calculator assets, not tests that merely mirror HTML styling. Evidence: [Phase 0 verification](v2/phase-00-verification.md), including 22 runtime fixtures, 28 screenshots, complete route/artifact inventories, 49 configured redirects, preserved production artifact and read-only hosting evidence. Branch: `feature/simplekit-v2-phase-0`. Live edge requests return HTTP 403 from this environment; configuration/deployment identity and downloaded artifact are verified separately.

## Phase 1 — Design tokens, typography and assets

Status: `[x]`. Technical acceptance passed. Owner instructed Phase 2 on 2026-10-09, accepting the proposed foundations/coastal asset for implementation; no GitHub review or production release permission is implied.

- [x] Define documented CSS tokens for navy/blue/slate neutrals, blue/teal/amber/purple category accents, type scale, spacing, radii, shadows, borders, content widths, focus rings and responsive breakpoints.
- [x] Select licensed serif/sans-serif fonts matching the reference hierarchy; document source/license, fallback stacks, limited weights and loading strategy.
- [x] Create or source an approved coastal hero with no baked-in text, responsive AVIF/WebP variants and fallback; document provenance and focal point. Keep the original mockup unchanged.
- [x] Create a consistent local SVG icon set for search/menu/chevrons, trust items, goals, calculator rows and onboarding; define decorative versus labelled usage.
- [x] Add component foundations scoped to v2 and asset dimensions; document asset filenames, fonts and token usage for subsequent phases.

Acceptance:

- [x] Tokens cover every v2 component; contrast checks meet 4.5:1 for normal text, 3:1 for large text and required non-text controls.
- [x] Fonts have valid licenses, readable system fallbacks and no invisible text period; no external font request is required to use the page.
- [x] Hero variants have declared dimensions/aspect ratio, mobile and desktop crops, no embedded UI text and a largest initial mobile variant budget of 250 KB; icons render crisply at normal and 2× density.
- [x] Original reference hash is unchanged; production assets are separate; generated `dist/` excludes `docs/` and the reference PNG.

Codex guidance: prefer existing code/vector assets for UI icons. If an image generation skill is used, read its instructions and the saved reference first. Record chosen token/font values as implementation decisions, not values measured precisely from the mockup. Evidence: [Phase 1 verification](v2/phase-01-verification.md). [PR #8](https://github.com/ashleysnl/simplekit-site/pull/8), branch `feature/simplekit-v2-phase-1`; four licensed local fonts, scoped tokens/primitives, 18 SVG icons and 12 validated image variants. Technical checks pass; owner instructed proceeding to Phase 2.

## Phase 2 — Responsive header and coastal hero

Status: `[~]`. Implementation and available automated checks complete. Owner instructed Phase 3 on 2026-10-09, clearing the phase review pause; the two recorded manual browser/assistive-technology checks remain for Phase 8.

- [x] Implement the live wordmark/tagline, semantic header/navigation, mobile hamburger and desktop navigation retaining Home, Tools, Learn, About and Support destinations.
- [x] Implement menu open/close, `aria-expanded`, accessible name, Escape dismissal, logical focus return and outside-click behavior; if modal, contain focus while open.
- [x] Build the reference eyebrow/headline/body copy over the coastal fade and reserve the search region for Phase 3.
- [x] Adapt layout/crop/type sizes for mobile, tablet and desktop with a maximum content width and fluid gutters; preserve footer and existing trust/support destinations.

Acceptance:

- [~] At 320–1920 px there is no horizontal page overflow, clipped headline or overlap; text stays readable over every crop and navigation remains usable at 200% zoom. Automated CSS magnification/reflow passes; manual browser toolbar zoom coverage remains for Phase 8.
- [~] All retained navigation destinations resolve; mobile menu is operable with keyboard, touch and screen reader, closes on Escape and restores focus. Keyboard, touch and Chromium accessibility-tree checks pass; manual VoiceOver/NVDA coverage remains for Phase 8.
- [x] Heading structure has one meaningful H1 and no image-based text; hero stays stable during image/font loading and has an appropriate decorative or descriptive alternative.
- [x] Screenshots at required widths show the target hierarchy, coastal fade and wordmark treatment; desktop adaptation and any deviations are documented.

Codex guidance: change `templates/index.html` and scoped assets, leaving root `index.html` untouched during preview work. Avoid changing pinned Core as part of a homepage header; separately scope shared-shell modernization if needed. Evidence: [Phase 2 verification](v2/phase-02-verification.md), [PR #9](https://github.com/ashleysnl/simplekit-site/pull/9). Branch `feature/simplekit-v2-phase-2`; 27 responsive widths, keyboard/touch/Chromium accessibility-tree checks, loading/fallback and magnification/reflow checks pass. All 22 calculator fixtures and preservation guards pass; no merge or deploy.

## Phase 3 — Interactive search and suggested questions

Status: `[~]`. Implementation and available automated checks pass. Owner instructed Phase 4 on 2026-10-09, clearing the phase review pause; manual screen-reader coverage and Phase 2 manual coverage remain recorded for Phase 8.

- [x] Build a labelled search input and local discovery index covering all 22 manifest tool IDs, names, descriptions, goal tags and common synonyms. Validate IDs/routes against the canonical manifest at build/test time.
- [x] Rank exact names first, then keyword/synonym/intent matches; normalize case, whitespace and punctuation. Escape user input; render it as text, never executable HTML.
- [x] Show popular questions on empty input, matching results while typing, result count/status, a clear/reset action and useful no-result state with a real “View all tools” link.
- [x] Implement keyboard behavior with a documented interaction pattern: ordinary focusable results, or a fully implemented accessible combobox (arrows, Enter, Escape and announced active result).
- [x] Provide static tool/question links when JavaScript is unavailable; keep queries on-device and do not send them to analytics, logs or an AI service.

Question mappings (use tool tokens/registry IDs; do not invent routes):

| Reference question | Primary destination | Optional related tool |
| --- | --- | --- |
| Can I retire at 55? | `retirement-planner` | `fire-calculator` |
| Should I rent or buy a home? | `rent-vs-buy-calculator` | `mortgage-calculator` |
| How much house can I afford? | `house-affordability-calculator` | `debt-to-income-ratio-calculator` |
| How do I pay off debt faster? | `debt-payoff-calculator` | `credit-card-interest-calculator` |

Acceptance:

- [x] Exact name/slug queries find each of the 22 tools; `retire at 55`, `rent or buy`, `afford a house`, `pay debt`, and `RRSP TFSA` return their intended tools near the top.
- [x] Empty, mixed-case, whitespace-only, punctuation, zero-match and HTML-like input work without errors or injection; clearing restores popular questions.
- [x] All four suggested questions and every result link use the correct manifest route; results update within 100 ms on the documented representative test device with 22 entries.
- [~] Keyboard/screen-reader checks pass for the selected interaction pattern; disabled JavaScript preserves direct discovery links; no query text leaves the browser. Keyboard, Chromium accessibility-tree, fallback and privacy checks pass; manual VoiceOver/NVDA coverage remains for Phase 8.

Codex guidance: local deterministic matching is sufficient; “intelligent” discovery does not require a backend or conversational financial advice. Test real ranking outcomes and stale/unknown IDs. Canonical links may leave the preview origin; test preview tool behavior separately. Evidence: [Phase 3 verification](v2/phase-03-verification.md), [PR #10](https://github.com/ashleysnl/simplekit-site/pull/10), branch `feature/simplekit-v2-phase-3`. 23 repository tests, all 22 calculator fixtures, 44 exact name/slug browser searches and required intent queries pass. Maximum search update 39 ms (next animation frame 39.5 ms), with no search network requests or analytics/storage/console changes. The curated reference prompts are labelled “Suggested questions”; all mappings use canonical IDs. No merge or deploy.

## Phase 4 — Trust indicators and honest privacy copy

Status: `[~]`. Implementation, audit and available automated checks pass on `feature/simplekit-v2-phase-4`; feature review and actual browser-toolbar zoom remain. Owner requested an early dedicated preview with all changes to date; production remains unchanged.

- [x] Implement the three reference trust indicators with local icons, separators and readable responsive wrapping.
- [x] Verify no-signup use for every linked calculator; audit search/onboarding, local persistence, calculator behavior and existing analytics before adopting “Private / Stays in your browser”.
- [x] Keep calculator inputs and discovery answers local; qualify privacy copy to distinguish calculation data from existing usage analytics, and link existing privacy/methodology information.
- [x] Verify Canadian context claims against tool scope; avoid implying every tool applies tax rules or offers professional advice, official endorsement, security guarantees or unverified popularity.

Acceptance:

- [~] Trust items remain readable at 320 px and 200% zoom, with text conveying meaning independently of icons/color. Six widths, CSS magnification, 200% text at 320 px and no-JS/hidden-icon/forced-color checks pass; actual toolbar zoom remains for Phase 8.
- [x] Copy is supported by an audit and aligns with the privacy page. If analytics remains, no absolute claim that all browsing information stays local is shipped.
- [x] A network check confirms no search strings, onboarding choices or calculator financial values are added to requests or analytics payloads by v2.

Codex guidance: preserve the target's trust layout, but truth takes precedence over mockup wording. Do not silently add/remove analytics; document any required separately reviewed change. Evidence: [Phase 4 verification](v2/phase-04-verification.md), [PR #11](https://github.com/ashleysnl/simplekit-site/pull/11). All 22 fresh-context calculator fixtures and the source/storage/analytics/scope audit pass. Financial inputs add no data-bearing request or queued analytics value; two existing favicon GETs carry no query/body. Four search probes add zero requests/analytics/storage. V2 onboarding is unimplemented until Phase 7. New copy discloses existing Google Analytics and qualifies Canadian context. Only generated homepage HTML and one scoped stylesheet change; no production merge/deploy. Hosted CI passes. Owner approved the existing GitHub reviewer gate; early preview [run 37974947775](https://github.com/ashleysnl/simplekit-site/actions/runs/37974947775) build/upload passes for implementation commit `03f0b9e994d465529df89fb8fa3ede0a6d1baa1e`: [immutable preview](https://73147f8f.simplekit-preview.pages.dev). Live automated verification is blocked here by certificate/HTTP 403 errors; local checks pass and Phase 11 remains unstarted.

## Phase 5 — Explore-by-goal navigation

Status: `[x]`. Depends on Phases 1–4.

- [x] Implement the four goal cards in reference order, with matching icon/accent/name/description and accessible full-card links.
- [x] Map each goal to an existing directory section or deterministic filtered directory state; define stable anchors/query handling without renaming existing routes.
- [x] Ensure every tool has at least one documented discovery category. Surface tax, travel, pay and contractor tools through the complete directory/secondary groupings rather than hiding them because the mockup has only four goals.
- [x] Generate “View all 22 tools” from `{{toolCount}}`; preserve the unfiltered `/tools/` directory and a reset/all-tools option.

Acceptance:

- [x] Retirement, Home & mortgage, Budget & debt, and Investing open the expected populated directory view; direct/back/reload links preserve their intended state.
- [x] The full directory contains all 22 tools, reachable without search or onboarding, with no duplicates or missing canonical destinations.
- [x] Cards use one column at narrow widths when needed and the reference two-column treatment where space permits; each link target is at least 44 × 44 CSS px.

Codex guidance: modify authored directory templates alongside the homepage if filtering/anchors need support. Keep categories as discovery metadata tied to manifest IDs, not a competing route list. Evidence: [Phase 5 verification](v2/phase-05-verification.md). Native fragment links reach four populated goal sections; all 22 canonical tools appear once across seven primary/secondary groups. Six widths, keyboard/focus/touch/direct/reload/Back/Forward/no-JS/fallback/enlargement checks pass. 27 repository checks, 22 exact calculator fixtures, earlier header/search/trust regressions, build/SEO/output/preservation and repeat-build checks pass. Implementation/evidence commit `c7dd255` is pushed to `develop-v2`; [hosted validation](https://github.com/ashleysnl/simplekit-site/actions/runs/38005820544) passes. Main and production remain unchanged. Owner-requested [Phase 5 demo](https://e9070fe2.simplekit-preview.pages.dev) uploaded through [run 38006282182](https://github.com/ashleysnl/simplekit-site/actions/runs/38006282182); build/upload and artifact verification pass. Live automated checks return 403 here, so deployed interactions are not claimed passing. This early snapshot does not complete Phase 11. Earlier manual accessibility/toolbar-zoom limitations remain for Phase 8.

## Issue #12 — Premium mobile visual fidelity

Status: `[~]`. Focused composition pass after Phase 5, before later homepage phases. Approved reference remains `docs/design-reference/simplekit-v2-target.png`.

- [x] Locate the approved reference and measure the existing 375/390px composition before edits.
- [x] Capture matching local baseline screenshots at 375/390/768/1440px; document the blocked secure hosted-browser attempt separately.
- [x] Refine header/hero spacing, coastline visibility, typography, integrated search/questions, trust density and two-column mobile goals through five screenshot reviews.
- [x] Verify 44px controls, search/questions/menu, responsive reflow, keyboard/AX semantics and all 22 calculator fixtures.
- [x] Verify 28 repository tests, portable build, source pins, SEO/output and preservation guard.
- [x] Deploy the verified candidate to isolated Cloudflare preview and record the exact source/artifact.
- [x] Capture secure live hosted screenshots and verify hosted interactions. Run 38013211800 passes all hosted suites; runner evidence is separate from loopback captures.
- [x] Open the temporary feature PR targeting develop-v2 and update issue #12 with verified results.
- [ ] Obtain owner visual approval; no merge or production deployment is authorized.

Evidence: [mobile comparison and iteration log](v2/mobile-fidelity-issue-12/COMPARISON.md). This task explicitly requires temporary `feature/simplekit-v2-mobile-fidelity` and a review PR into `develop-v2`; keep it unmerged until explicit approval, then return ongoing work to the authoritative development branch. Existing phase completion and remaining manual accessibility checks are preserved. The owner subsequently instructed Phase 6; that work continues in the same review PR. Guided onboarding remains Phase 7.

## Phase 6 — Popular calculators

Status: `[x]`. Implementation, screenshot comparison and local/hosted automated acceptance pass. Owner subsequently instructed Phase 7. PR #13 still targets `develop-v2`; no merge or production deployment is authorized.

- [x] Implement the five reference rows in order: Retirement Planner, Mortgage Calculator, Compound Interest Calculator, Budget Planner, FIRE Calculator.
- [x] Add concise factual descriptions, matching icons and chevrons, subtle row dividers and accessible link/focus states.
- [x] Keep “View all tools” visible and use validated tool tokens for every destination.
- [x] Establish evidence for the “Popular” label; use “Featured calculators” pending owner acceptance if no usage evidence supports popularity. No popularity dataset is available; the section explicitly describes a curated selection.

Acceptance:

- [x] Five distinct manifest-backed tools appear in the required order, descriptions match tool behavior, and all links resolve.
- [x] Long descriptions wrap at 320 px without hiding names/chevrons; each row has a single clear accessible link and keyboard focus indicator.
- [x] Visual comparison confirms the reference row hierarchy and icon treatment, while all 22 tools remain available through the directory.

Codex guidance: favor semantic lists and real anchors over clickable containers. Do not add unsupported star ratings, user counts or financial outcomes. Evidence: [Phase 6 verification](v2/phase-06-verification.md). All ten layout/fallback cases and canonical/keyboard/directory checks pass locally and on the isolated hosted preview.

## Phase 7 — Guided onboarding and calculator discovery

Status: `[~]`. Implementation and local/hosted automated verification are complete. Manual screen-reader acceptance remains for Phase 8. The existing temporary PR #13 targets `develop-v2`; explicit no-merge/no-production limits remain.

- [x] Implement the reference “Not sure where to start?” panel and “Get started” control, with a lightweight accessible dialog or inline step flow.
- [x] Ask up to three optional non-sensitive questions about planning goal, immediate question and preferred level of detail; offer skip, back, close and restart.
- [x] Document deterministic answer-to-tool mappings covering all four primary goals and secondary needs; return one to three tools with brief reasons and direct manifest links.
- [x] Keep answers ephemeral in memory, clear them on restart/close, request no account or personal financial details, and retain an all-tools fallback with JavaScript disabled.

Acceptance:

- [x] Every answer path, skip path and incomplete path terminates with a relevant recommendation or all-tools fallback; back/restart/close work without stale state.
- [~] Flow supports keyboard and screen reader, announces step progress and restores focus on close; modal focus is contained when applicable. Native keyboard/Chromium AX checks pass for the nonmodal inline flow; manual screen-reader verification remains Phase 8.
- [x] No answers are transmitted or persisted by default; recommendations describe tools and do not promise financial conclusions.
- [x] Starting with retirement, housing, debt/budget or investing produces the expected documented tool IDs and working links.

Codex guidance: test the mapping table and real user paths. Keep the flow optional; users can open every calculator directly. Evidence: [Phase 7 verification and mapping](v2/phase-07-verification.md). All 93 browser paths, 24 layout/fallback states, 30 repository tests and seven hosted regression suites pass. [Verified preview](https://6feb3be4.simplekit-preview.pages.dev), runtime source `9abcee3f2a6b0eb157ae5feaacfcb6598616ea1c`, [hosted run 38060246506](https://github.com/ashleysnl/simplekit-site/actions/runs/38060246506). Chromium AX/keyboard coverage is automated; manual screen-reader coverage remains Phase 8.

## Phase 8 — Responsive polish, accessibility and performance

Status: `[~]`. Phase 8 implementation and available local/hosted automated verification pass. Continue in temporary PR #13 targeting `develop-v2`, without merging or touching production. Manual screen-reader, real-device, native-zoom and human contrast review remain pending; no field performance dataset is available.

- [~] Audit homepage/directory/menu/search/onboarding for WCAG 2.2 AA: landmarks, headings, labels, focus order/visibility, contrast, target size, announcements and alternatives. Automated axe/keyboard checks pass; human contrast and screen-reader review remain pending.
- [~] Test keyboard-only use, VoiceOver/Safari and a second documented screen-reader/browser combination; test touch and 200% text enlargement/400% reflow. Automated keyboard, touch emulation, 200% text and 320 CSS px reflow pass; manual AT/native zoom unavailable in Linux.
- [~] Test 320, 375, 390, 768, 1024, 1440 and 1920 widths and landscape; check Chrome, Safari, Firefox and at least one real iPhone/Android browser where available. Hosted Chromium 141, Firefox 142 and WebKit 26 pass all 78 layout/fallback cases and 24 axe states. Actual Safari and real phones require manual review; WebKit automation is not Safari/VoiceOver verification.
- [x] Respect reduced motion, avoid hover-only controls, support image/font/JavaScript failures, and check long labels and empty/results/dialog states. Inline onboarding has no modal/focus trap; all tested states retain readable labels and 44px targets.
- [x] Optimize hero loading, fonts and modules; reserve layout space, avoid blocking scripts and unnecessary dependencies. Existing responsive/high-priority hero retained; one ordered CSS bundle, early header enhancement, module preloads and metric-preserving WOFF2 improve loading without framework/runtime dependencies.

Acceptance:

- [~] No critical/serious automated accessibility findings remain in changed UI; manual keyboard and screen-reader paths pass. Changed UI has zero axe violations; automated keyboard paths pass; inherited tool findings documented separately. Manual assistive-technology review remains pending.
- [~] Page reflows at 320 CSS px/400% zoom without two-dimensional scrolling for normal content; controls retain 44 px targets as the project design goal, readable labels and visible focus. 320 CSS px, 200% text and text-spacing geometry/glyph tests pass; native toolbar zoom remains a manual check.
- [x] Three documented mobile Lighthouse lab runs achieve median performance ≥90, accessibility ≥95, LCP ≤2.5 s and CLS ≤0.1 on the same settings; record device/throttling and limitations. Hosted Lighthouse 12.8.2 at 390×844, simulated 150ms RTT/1,638.4 Kbps/4× CPU: median performance 99, accessibility 100, LCP 2127.2ms, CLS 0. These are lab results, not real-user INP evidence.
- [ ] Where field data later exists, monitor p75 LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1; new interactions are responsive in local/preview tests.

Codex guidance: accessibility/performance failures are acceptance blockers, not optional polish. Report device combinations unavailable to automation without pretending they were tested. Evidence: [Phase 8 audit, before/after screenshots, lab settings, inherited tool findings and manual review matrix](v2/phase-08-verification.md). Runtime `997a24480f9bc1c4dfc4abee0371b8bf9f0621b0` passes [CI 38067761497](https://github.com/ashleysnl/simplekit-site/actions/runs/38067761497) and [hosted run 38067758043](https://github.com/ashleysnl/simplekit-site/actions/runs/38067758043): 32 repository tests, portable build/SEO/preservation, seven regression suites, all 22 calculator fixtures, three browser engines and three Lighthouse runs. [Verified isolated preview](https://4bb45d9d.simplekit-preview.pages.dev); 333-file artifact SHA-256 and byte comparison recorded. Main, production and DNS unchanged; PR #13 remains unmerged. Manual acceptance remains pending.

## Phase 9 — SEO and content integrity

Status: `[x]`. Owner explicitly instructed Phase 9 on 2026-10-10. Local and hosted SEO/content/route/no-JS checks pass in the existing unmerged PR #13. The owner-selected V2 share image and retained metadata are validated. Phase 8 manual acceptance remains pending and is not waived.

- [x] Retain semantic copy, a single H1, meaningful section headings, useful descriptions and crawlable ordinary links to directory/tools/guides.
- [x] Verify titles/descriptions, production canonicals, Open Graph/Twitter metadata, approved share image and valid structured data; keep existing verification tags and maintainer attribution.
- [x] Preserve all canonical paths, sitemap/robots contracts and existing compatibility/noindex rules. Do not introduce query/filter duplicates into the sitemap.
- [x] Validate metadata against the finished design without inventing ratings, reviews or a search schema endpoint that does not exist.

Acceptance:

- [x] `seo:validate` and `output:validate` pass; each indexed page has one correct production canonical, matching Open Graph URL and preserved manifest sitemap membership (baseline currently 53 URLs).
- [x] All 22 calculator paths, existing guides, compatibility pages and documented legacy redirect destinations remain intact; no new broken internal links or assets.
- [x] Main discovery links are present with JavaScript disabled; preview indexing protections remain isolated to preview artifacts and never replace production robots policy.

Codex guidance: use the existing SEO generators and route authority. Review [SEO improvement plan](../SEO-IMPROVEMENT-PLAN.md) for context; v2 does not automatically complete its separate checklist. Evidence: [Phase 9 metadata/content audit, owner-selected V2 share image, inherited findings and validation](v2/phase-09-verification.md). Runtime `ad7018f39a15348e16007ea2585968e1017eccbc` passes [CI 38069897288](https://github.com/ashleysnl/simplekit-site/actions/runs/38069897288) and [hosted run 38069894661](https://github.com/ashleysnl/simplekit-site/actions/runs/38069894661): 36 tests, 53 indexed URLs, 66 indexed/compatibility routes, 99 assets, no-JS discovery and 23 documented redirect destinations. [Verified preview](https://1ef797bf.simplekit-preview.pages.dev). All prior interaction/calculator and three-engine checks pass; mobile Lighthouse median 99/100, LCP 2.131s, CLS 0. Source-pinned optional social gaps and 42 stale retirement guide fragments remain documented upstream work; no new V2 broken link/asset is introduced. Do not patch copied calculators or change pins to hide inherited findings. Main, production and DNS unchanged; final visual/release approval remains separate.

## Phase 10 — Full regression and release candidate

Status: `[x]`. Depends on Phases 0–9.

- [x] Run the supported commands from a clean checkout and compare repeated build inventories for deterministic output.
- [x] Run all 22 tools on the local generated origin; verify inputs render, shared Core mounts, navigation/assets/modules load and each baseline interaction/output fixture still passes.
- [x] Specifically rerun Retirement Planner demo, Budget Planner recalculation, mortgage principal/payment, storage reload and export/import where supported; compare with Phase 0.
- [x] Exercise search, suggested questions, all goals, all featured rows, onboarding, no-JS fallback and compatibility routes; collect console errors and failed requests.
- [x] Review the artifact diff: calculator logic/pins and routes unchanged, expected homepage/assets changed, no docs/mockup/cache/developer files published; preserve a versioned candidate artifact and checksum.

Acceptance:

- [x] All existing validation and meaningful new behavior tests pass; all 22 baseline fixtures match within documented tool rounding/tolerance rules.
- [x] Zero new browser errors, failed same-origin asset requests or broken internal links; external analytics/support checks are explicitly distinguished from stubbed tests.
- [x] Build reproducibility and unchanged calculator logic are demonstrated; any generated wrapper differences are reviewed and explained.
- [x] PR contains screenshot comparisons, accessibility/performance/SEO/regression evidence, candidate commit/artifact identity and known limitations; required hosted validation passes for that commit.

Codex guidance: the existing browser smoke script is a starting point, not proof of every calculation. Add fixture coverage appropriate to each tool type, and test preview paths rather than accidentally following production canonicals. Evidence: [Phase 10 verification](v2/phase-10-verification.md). Candidate `f978df5c48209a02b107d4a31a81f7ba49088335` passes CI 38071970522 and [hosted run 38072049423](https://github.com/ashleysnl/simplekit-site/actions/runs/38072049423): 36 tests, all 22 exact fixtures, JSON/import/storage/CSV regression, 78 layouts/24 axe states, SEO and mobile Lighthouse median 98/100, LCP 2.290s, CLS 0. Two builds have identical 335-file inventories; preserved candidate artifact 11676733662 has tar.gz SHA-256 `e329da8c7c6afd7e7a36d0bb23805c336aa147deb406549d59a62bad86b868d4`. [Verified preview](https://7d44ae88.simplekit-preview.pages.dev). Screenshots at all four widths are unchanged; calculator/Core logic/pins, routes and production inputs are preserved. Main, production and DNS unchanged; PR #13 remains unmerged. Phase 8 manual checks and final owner release approval remain pending.

## Phase 11 — Cloudflare preview and owner review

Status: `[ ]`. Depends on Phase 10.

- [ ] Inspect the manual preview workflow and dedicated project/environment protections through permitted tools; retain production branch guard and absence of custom domains.
- [ ] Dispatch “Manual Cloudflare preview” from the trusted default workflow with `source_ref` set to the exact reviewed `develop-v2` commit; satisfy existing environment approvals without weakening protections.
- [ ] Record source SHA, workflow URL, artifact checksum and exact deployment URL from upload output; verify the shared branch alias points to that candidate.
- [ ] Verify deployed homepage, discovery flows and all 22 calculator paths/assets on the preview origin; compare the deployed file inventory with the approved artifact and rerun key calculator interactions.
- [ ] Present mobile/tablet/desktop comparisons with the saved mockup, verification evidence and deviations for owner design/release review; resolve feedback on `develop-v2`.

Acceptance:

- [ ] Build/upload jobs succeed for the intended candidate and the deployed artifact matches; deployed pages return `X-Robots-Tag: noindex, nofollow`, preview robots disallows crawling, and the preview has no production `CNAME`.
- [ ] All 22 calculators and every new interaction pass on the preview origin; no new console errors/failed same-origin requests/broken links.
- [ ] Production content/deployed commit and publishing/DNS/custom-domain configuration remain unchanged against the recorded baseline.
- [ ] Owner review outcome is documented against the exact commit and deployment. Design acceptance and permission to release production are recorded separately.

Codex guidance: the prior verified alias was `https://codex-preview.simplekit-preview.pages.dev`; `https://simplekit-preview.pages.dev` returned 404 because only a preview branch was uploaded. Use upload output as the current authority. The `codex-preview` alias is shared/replaceable: coordinate preview uploads and retain the immutable candidate URL. Preview approval never grants production approval. Evidence link: pending.

## Phase 12 — Controlled production rollout and rollback

Status: `[ ]`. Depends on Phase 11 plus explicit owner production approval.

- [ ] Prepare the concrete release package: exact source commit/artifact/checksum, all passing checks, preview approval, intended existing production destination, deploy procedure, previous artifact/commit and rollback procedure.
- [ ] Inspect the actual GitHub Pages publishing source and Cloudflare configuration. If publishing `dist/` needs a workflow, create a separate reviewed proposal with protected approvals; do not assume merging templates deploys the new site.
- [ ] Obtain explicit owner approval for that exact release and any necessary merge/publishing action; any change to commit/artifact/destination invalidates that release approval and requires renewed review.
- [ ] Merge only as approved, rebuild/verify if commit identity changes, then deploy the reviewed artifact through the approved protected workflow to the existing production destination. Hosting migration/DNS changes require separate authorization.
- [ ] Check production homepage/discovery, all 22 calculator routes, canonical/sitemap/robots policy, key input/output fixtures, assets and legacy redirects immediately after rollout.
- [ ] Monitor at rollout, about 24 hours and 7 days using existing authorized monitoring/analytics; document errors, navigation/conversion signals and available performance data without collecting private query/answer values. Schedule new automation only if requested.
- [ ] Roll back through the approved procedure if a canonical calculator is unavailable, calculation fixture regresses, key navigation fails, or a severe accessibility/asset/JavaScript issue appears; reverify routes and record incident evidence.

Acceptance:

- [ ] Approval evidence names the final deployed commit/artifact/destination; required checks pass, a previous working artifact is available, and rollback commands/permissions are verified before release.
- [ ] Production serves the approved v2 candidate, all 22 calculators/URLs and existing redirects work, and production indexing remains correct without preview `noindex` headers.
- [ ] Monitoring/rollback evidence is recorded; no unapproved production configuration or DNS changes occur. Close the rollout phase only after its observation checks pass.

Codex guidance: this phase is an approval gate. Complete the reviewable release preparation first, then stop before unauthorized merge/deploy. Existing documentation explicitly keeps merge and production deployment separate. A plan commit, feature PR, passing CI or preview acceptance is not release permission. Evidence link: pending.

## Protected calculator inventory

Snapshot from `data/tools.json` at the inspected baseline. All canonical URLs use `https://simplekit.app` plus the path below. Preserve legacy subdomain values from the manifest and existing redirect behavior; do not repoint them in this project. During every phase verify all 22 remain discoverable; Phase 0/10/11/12 verify runtime behavior on the relevant origin.

| # | Tool | Canonical path / ID |
| --- | --- | --- |
| 1 | Retirement Planner | `/retirement-planner/` |
| 2 | FIRE Calculator | `/fire-calculator/` |
| 3 | CPP Calculator | `/cpp-calculator/` |
| 4 | RRSP / TFSA Calculator | `/rrsp-vs-tfsa-calculator/` |
| 5 | Compound Interest Calculator | `/compound-interest-calculator/` |
| 6 | Savings Goal Calculator | `/savings-goal-calculator/` |
| 7 | Emergency Fund Calculator | `/emergency-fund-calculator/` |
| 8 | Net Worth Calculator | `/net-worth-calculator/` |
| 9 | Budget Planner | `/budget-planner/` |
| 10 | Canadian Take Home Pay Calculator | `/take-home-pay-calculator/` |
| 11 | Debt Payoff Calculator | `/debt-payoff-calculator/` |
| 12 | Credit Card Interest Calculator | `/credit-card-interest-calculator/` |
| 13 | Loan Calculator | `/loan-calculator/` |
| 14 | House Affordability Calculator | `/house-affordability-calculator/` |
| 15 | Rent vs Buy Calculator | `/rent-vs-buy-calculator/` |
| 16 | Mortgage Paydown vs Invest | `/mortgage-paydown-vs-invest-calculator/` |
| 17 | Investment Fee Calculator | `/investment-fee-calculator/` |
| 18 | Mortgage Calculator | `/mortgage-calculator/` |
| 19 | Canadian Tax Checklist | `/canadian-tax-checklist/` |
| 20 | Travel Planner | `/travel-planner/` |
| 21 | Debt-to-Income Ratio Calculator | `/debt-to-income-ratio-calculator/` |
| 22 | Contractor Effective Hourly Rate Calculator | `/contractor-effective-hourly-rate-calculator/` |

## Phase tracker and handoff

| Phase | State | Evidence / next step |
| --- | --- | --- |
| 0 Baseline and guardrails | `[x]` | [Baseline evidence](v2/phase-00-verification.md); owner instructed Phase 1. Live edge HTTP checks limited by 403. |
| 1 Tokens and assets | `[x]` | [Foundation evidence](v2/phase-01-verification.md); owner instructed Phase 2. |
| 2 Header and hero | `[~]` | [Header/hero evidence](v2/phase-02-verification.md), [PR #9](https://github.com/ashleysnl/simplekit-site/pull/9); implementation complete; owner instructed Phase 3, manual coverage pending. |
| 3 Search and questions | `[~]` | [Search evidence](v2/phase-03-verification.md), [PR #10](https://github.com/ashleysnl/simplekit-site/pull/10); owner instructed Phase 4; implementation/automated checks pass, manual AT coverage pending. |
| 4 Trust indicators | `[~]` | [Trust/privacy evidence](v2/phase-04-verification.md), [PR #11](https://github.com/ashleysnl/simplekit-site/pull/11); implementation/audit/CI pass; review and toolbar zoom remain. [Early preview uploaded](https://73147f8f.simplekit-preview.pages.dev) after owner approval; live checks limited here by certificate/403 errors. |
| 5 Goal navigation | `[x]` | [Goal/directory evidence](v2/phase-05-verification.md); all seven task/acceptance criteria pass on `develop-v2`. Owner-requested [demo uploaded](https://e9070fe2.simplekit-preview.pages.dev); workflow and artifact verification pass, live checks limited here by 403. Earlier manual/review limitations remain for Phase 8. |
| 6 Popular calculators | `[x]` | Curated “Featured calculators” rows in PR #13. [Phase 6 verification](v2/phase-06-verification.md); all local/hosted checks pass in run 38013211800. |
| 7 Guided onboarding | `[~]` | Implementation and local/hosted automation verified; manual screen-reader acceptance remains Phase 8. Same unmerged PR #13. |
| 8 Accessibility/responsiveness/performance | `[~]` | Implementation and local/hosted automation pass in run 38067758043; three engines, 78 layouts, 24 axe states, mobile Lighthouse median 99/100, LCP 2.127s, CLS 0. Same unmerged PR #13; manual devices/assistive technology/native zoom/human review pending. |
| 9 SEO/content integrity | `[x]` | [Phase 9 verification](v2/phase-09-verification.md); local/hosted metadata, 53 indexed URLs, 66 routes, 99 assets, no-JS and V2 share-image checks pass in run 38069894661. Inherited source findings documented; Phase 8 manual checks remain pending. |
| 10 Full regression/candidate | `[x]` | [Phase 10 verification](v2/phase-10-verification.md); clean/repeated builds, all 22 fixtures, import/export/reload, hosted cross-engine/SEO/performance and preserved candidate pass in run 38072049423. Manual release gates remain. |
| 11 Cloudflare preview/review | `[ ]` | Phase 10 candidate verified; final owner review and outstanding manual checks remain. |
| 12 Production rollout | `[ ]` | Pending Phase 11 and explicit release approval. |

End each execution with the active phase, completed criteria/evidence, unfinished work or blocker, current branch/PR/commit, preview identity if applicable, production unchanged status, and the next bounded phase/task. Keep this file updated in the same phase commit on `develop-v2` (or required temporary PR targeting it) so the next Codex task can resume from evidence instead of conversation memory.
