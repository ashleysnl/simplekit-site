# Phase 15D — Maintained V2 authoring handoff

Documentation and starter render checks complete. This closes the authoring implementation tasks, not final acceptance of the V2 website. Phases 15A–15C remain implemented pending Phase 16 consolidated QA; no production or preview deployment.

## Maintained owners and deliverables

The accessible sources contain five copied legacy style guides and rendered `.factory/build-prompt.md` files: TakeHomePay, CreditCard, TaxChecklist, DTI and ContractorRate. Their original App Factory/template paths point into an unavailable Mac workspace. No connected Factory/template repository was found. This phase does not claim that external generator was edited; future generator adoption requires its actual owning source.

Core owns the new maintained V2 counterparts at **`49de30920a878b4b23c09a9803b7cacf3d1d41ba`** on its `develop-v2`:

| Source | Purpose |
| --- | --- |
| `docs/v2-authoring/README.md` | Authoritative entrypoint, owners and legacy precedence |
| `docs/v2-authoring/calculator-style-guide.md` | Compact task hierarchy, shared tokens/components, accessible controls/results, task-layout exceptions and support |
| `docs/v2-authoring/master-codex-build-prompt.md` | Branch/ownership, preservation, build-first cadence, immutable adoption, tracking and release rules |
| `docs/v2-authoring/calculator-spec.template.yaml` | Financial behavior requirements plus explicit V2 integration/verification/rollback planning fields |
| `starter/v2/index.template.html` | Authored shared-shell skeleton using existing named-slot replacement; no fake formula or new framework |
| `starter/v2/README.md` | Pinned renderer/assets, required slot filling/escaping, financial content preservation and standalone asset localization |
| `AGENTS.md`, `README.md` | References to the maintained V2 counterparts; legacy platform guidance remains scoped to its original consumers |

[Core authoring entrypoint](https://github.com/ashleysnl/SimpleKit-Core/blob/49de30920a878b4b23c09a9803b7cacf3d1d41ba/docs/v2-authoring/README.md). Documentation revisions are separate from immutable runtime adoption. Site runtime remains Core `c9c0a3177502d2e320f07de203d35890fd2efc1a`; every calculator pin is unchanged in this phase. No shared runtime bytes changed.

Five owning calculator repositories updated `AGENTS.md`, `FACTORY_CONTEXT.md`, `SIMPLEKIT_CALCULATOR_STYLE_GUIDE.md` and `.factory/build-prompt.md` with a V2 precedence section linking the maintained Core revision. It explicitly supersedes legacy large-gradient hero, old palette/font, mutable CDN injection, fixed two-column and unavailable Mac-prompt directions for V2, preserving the older material as provenance/legacy guidance. Existing local financial specs, formulas and task copy are unchanged. [Exact documentation revisions](phase-15d/documentation-revisions.json).

Site `AGENTS.md`, `README.md` and `TOOL-MIGRATION-PROMPT.md` now reference the same contract. The migration prompt distinguishes implementation-first checks from final route/release acceptance; broad final requirements and production gates remain intact. No persistent branch, registry or dependency introduced.

## Starter and upgrade contract

The starter uses existing Core `shellHeader`, `shellFooter`, `breadcrumbs` and `escapeHtml` through a deliberate full immutable SHA. It supplies opt-in markers, a compact introduction, stable main/skip IDs and authored task slots. It contains no calculator algorithm, default numeric example, registry or automatic publishing path. Existing tools should not be regenerated from it. It lives outside Core `v2/`, so portable assembly does not publish a new route or copy the starter into deployed assets.

Standalone consumers must vendor/localize the same pinned assets and relative fonts/sprite. Portable `/assets/core/v2/` aliases are not assumed to exist on unrelated hosts. Preserve one shared shell, meaningful metadata/analytics and loading order. Reject unresolved template slots and validate/escape metadata; financial HTML is trusted authored source, not user input. The YAML template is authoring guidance, not an installed parser/schema migration for the unavailable Factory.

System contract stays 1, compatible theme 1.1. Compatible additions keep the contract; breaking marker/API/class/token changes require a new explicit version and consumer migration. Common changes belong in Core, task behavior/adapters in owning calculators, and assembly/routes/homepage composition in the site. Runtime updates require deliberate pins and affected QA; documentation updates alone need not repin unchanged assets. Roll back by normal documentation/source reverts and, when runtime changed, restoring the associated previous pins and rebuilding. Never force-push, clear saved state or edit generated output/caches as source.

## Checks and preserved work

- Reviewed maintained guide/prompt/spec/starter and their ownership/branch/opt-in/rollback references. Existing copied material is retained behind explicit V2 precedence; local financial specs and runtime file sets unchanged.
- Rendered the starter with the existing Core functions: all slots filled, escaped title text, one header/footer/canonical, matching skip/main target and shared asset order. Review artifact `/workspace/scratch/phase15d/starter-render.html`; it is not a real calculator or published route.
- YAML template parsed successfully; System v1 and production-authorized=false defaults checked.
- One portable production build passed after the authored starter was added, assembling all 22 calculators from the same 23 runtime pins. No broader browser, numerical, SEO or accessibility suite run; mandatory CI remains unchanged.
- Core publication used a non-forced connected-GitHub fast-forward; published tree/object identity verified and local branch synchronized. Five calculator guidance changes target their own `develop-v2`. Contractor documentation was published remotely from `c56104e`, preserving its divergent local `95dcc71` and dirty runtime files without creating a task branch or resetting work.
- Unrelated TakeHomePay CSS and Contractor HTML/JS patches remain byte-identical to preserved backups. Main remains the production source; publishing/hosting/DNS untouched.

## Phase 16 entry

Review preserved Contractor work separately before final candidate freeze; do not silently substitute the dirty checkout for its published pinned source. Freeze the exact site/runtime pins, then run one consolidated numerical/state/export, content/SEO, accessibility, cross-engine and visual checkpoint. Include the pending Phase 15C guide browser check and mobile FIRE/Loan snapshot height, Budget long-row/zoom/reflow and TakeHomePay WebKit/zoom finding. Earlier builds are limited implementation evidence; they do not replace current final QA or owner acceptance. Phase 17 uploads/verifies the isolated tested demo; Phase 18 prepares release/rollback and requires explicit production authorization.
