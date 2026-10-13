# Phase 15A — Shared homepage theme handoff

Status: `[~]` implemented with lightweight checks; final visual acceptance and consolidated regression verification remain in Phase 16. Authored homepage templates/assets are the implementation authority; visual reference: https://686bceb8.simplekit-preview.pages.dev. No new preview deployment in this phase.

## Comparison and ownership

| Element | Prior drift | Maintained owner and adoption |
| --- | --- | --- |
| Wordmark/header | Homepage textual two-colour wordmark versus System icon/brand; separate sizing and spacing | Core `v2/components.mjs`, `foundations.css`, `system.css`: shared textual wordmark, tagline, compact header and gutters |
| Mobile navigation | Separate homepage and System controllers; different breakpoints and button treatment | Core `v2/shell.js`: SVG menu, 900px themed breakpoint, native keyboard activation, Escape/focus return, outside click and no-JS visible links |
| Fonts/colours/icons | Site and Core copies of the same licensed fonts, tokens and sprite | Pinned Core `v2/` assets; build-generated compatibility aliases preserve `/assets/v2/` URLs |
| Actions/breadcrumbs | Interior primary actions differed from homepage pills; breadcrumb markup already shared | Existing System primitives use existing pill token for themed primary actions; Core owns breadcrumb renderer and compact type. Do not invent hierarchy or change tools' field controls |
| Footer/support | Homepage compact footer versus legacy System footer and floating support | Core renders homepage-derived normal-flow footer/disclosures; opted-in pages with this footer suppress known floating Core support controls. Existing support destination retained |
| Imagery/discovery | Coastal hero, search, questions and guided discovery are homepage-specific | Site `templates/index.html`, `assets/v2/home.css` and discovery modules remain owners; no calculator hero transplant |
| Calculator interiors | Existing source-owned migrations already implemented; CPP/Budget still have large introductory panels | Existing calculator repositories remain owners. Compact intro/fields/results refinement is Phase 15B |

## Source revisions and changed files

Core `develop-v2`: previous `f3bc12213c5b91698ddc64953faa6c4a9ef15e61` → shared-theme commit `539cbb7de02f330fef5509d1521c81a82e86d46b` → final wordmark correction `fa778283ea4c892a15a7554202240d6addcc646e`.

Core changes: new `v2/components.mjs`; compatible additions in `v2/foundations.css`, `v2/system.css`; consolidated `v2/shell.js`; `docs/v2-shared-theme.md`, `docs/core-consumer-guide.md`. Legacy `core.css`/`core.js`, financial helpers, calculator CSS/JS and licensed asset bytes are unchanged.

Site batch based on synchronized `5bb3fc1`: `scripts/v2-core-assets.mjs` resolves the existing manifest; `v2-system-components.mjs` imports the pinned owner; `v2-home-resources.mjs` and `build-site.mjs` assemble shared assets/markup. Homepage template consumes Core header/footer in isolated System subtrees, retaining its hero scale. `home.css` removes duplicated shared rules. Retired authored `assets/v2/{foundations.css,system.css,shell.js,home.js}`; published compatibility URLs are generated from pinned Core. Core pins updated deliberately in both source/migration manifests; every calculator pin is unchanged. Updated performance/preservation guards and regenerated three existing review-only reference HTML files (not a new screenshot gallery or deployed routes). Updated System/adoption and legacy migration guidance.

## Upgrade contract and rollback

System contract remains version **1**, with compatible theme amendment **1.1**. `.sk-v2[data-v2-system="1"]` is the explicit opt-in; shared markup also carries `data-v2-theme="1.1"`. Legacy unmarked pages retain their existing shell. The Core-owned assembly adapter replaces existing V1 shared header/footer only, preserves navigation IDs/current page and original skip/main targets, and is idempotent. It does not replace calculator content, scripts or metadata.

Common tokens, licensed fonts/sprite, header/footer, breadcrumb/related markup and navigation behavior belong in Core `develop-v2`. Calculator-specific presentation belongs in each source repository's `develop-v2`; homepage composition and discovery belong in the site. Consume the existing immutable manifest pin, never a live unversioned stylesheet, generated output or cache edit. `/assets/core/v2/` is the portable canonical asset alias; `/assets/v2/` compatibility files come from those same bytes. Standalone consumers must vendor/localize pinned assets and adopt the documented module contract; do not assume the portable site's alias exists on another host. Historical site font/icon snapshots are not the maintained shared source.

Compatible token/component additions keep System v1. Breaking marker/API/ID semantics require an explicit new contract version and reviewed migration. Record old/new immutable pins, review the source diff, assemble one portable build and perform focused checks; final matrix belongs to Phase 16. See [Core's authoritative shared-theme contract](https://github.com/ashleysnl/SimpleKit-Core/blob/fa778283ea4c892a15a7554202240d6addcc646e/docs/v2-shared-theme.md).

Rollback the site integration with a normal reviewed revert and restore Core pin `f3bc12213c5b91698ddc64953faa6c4a9ef15e61`, then rebuild. The site bridge requires the new module, so reverting only the pin is insufficient. Restore prior authored shell assets through the site revert. Never force-push, clear saved state or modify production to roll back development.

## Lightweight validation

- Two coherent portable builds passed: initial shared integration at Core `539cbb7`, then the visually detected inherited wordmark gap correction at `fa778283`. Each assembled all 22 calculators from 23 verified pinned sources.
- Chromium inspection: homepage, CPP, Budget and `/learn/cpp-basics/` at 402×900 and 1440×900. Eight small viewport captures inspected; no horizontal overflow, duplicate shell, page errors or local HTTP resource failures. Shared wordmark/fonts and normal-flow footer present; known floating support controls absent. External services intercepted, so this does not validate analytics delivery.
- Mobile keyboard Enter opens navigation; Escape closes and returns focus; outside click closes. Footer remains reachable. CPP/Budget input controls render; no numerical fixtures were executed.
- Focused adapter checks: CPP/Budget head, main and scripts byte-preserved; repeated alignment is unchanged; unmarked legacy input unchanged. Focused `tests/v2-performance.test.mjs` passed. Source diff/whitespace reviewed.
- Local diagnostic evidence: `/workspace/scratch/phase15a/checks.json` and `screens/`; temporary probe `/tmp/phase15a-check.cjs`. These are lightweight diagnostics, not final cross-browser acceptance artifacts.

## Remaining work and deferred checks

Phase 15B: compact CPP/Budget introductions (especially Budget's long mobile panel), improve field/result hierarchy and desktop grouping, and choose appropriate breadcrumbs where absent. Preserve current financial logic/defaults/state/exports and article content. Small shared shell integration is complete; no wholesale interior redesign in this phase.

Phase 15C/D: review bespoke support controls and standalone consumption across page families, refine remaining task-specific interiors, and update source-owned starter/style guidance. Existing shared breadcrumbs remain; not every tool currently has one. Historical site font/icon compatibility snapshots can be reviewed in the maintained-guidance pass.

Phase 16: full numerical/state/import-export regression, all-tool route/SEO/content preservation, no-JS/zoom/reflow/accessibility, cross-engine/browser matrices, layout-shift/performance and final screenshot comparison. Earlier results are historical and do not establish acceptance of this changed shell. The unrelated TakeHomePay containment work and prior WebKit/zoom finding remain preserved for their owning follow-up.

Existing Core dirty CSS was proven identical to synchronized upstream and preserved in a stash/patch before synchronization; private authored commit backups are retained locally. Other unrelated dirty source work was untouched. No main, production publishing, hosting or DNS changes; CI workflows unchanged. No production deployment or release acceptance is claimed.
