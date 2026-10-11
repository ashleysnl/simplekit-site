# Phase 13 — Articles, Learn hub and supporting pages

Status: `[~]`. All 23 site-owned pages are migrated locally; hosted three-engine verification and final evidence retention are in progress. Manual AT/device/native-zoom review and owner design acceptance remain open.

## Scope and protected sources

Started from synchronized `develop-v2` at `1f8d27bedd82f15cb1e4737dc0ac10445b7ee477`, which includes the owner's integration of PR #13 and all completed Phase 12 work. The minimum temporary task branch is `codex/v2-phase-13`; its PR targets develop-v2 and must not be merged without approval. Main and production remain protected at `ca7826db75cb4353488786aab80857b3a71c1be1`.

[Per-route coverage](phase-13/coverage.json) accounts for every one of the inventory's 45 non-calculator routes:

- 23 authored pages: 17 Learn articles, Learn hub, Tools directory, About, Methodology, Privacy and Support.
- Homepage: already migrated/verified in Phases 2–10; its published bytes remain exact.
- 13 compatibility routes: retain their noindex redirects and canonical destinations. They do not serve a reading layout.
- Seven retirement guides and the upstream 404: retained, not marked redesigned. Phase 11 assigns them to pinned Retirement Planner; Phase 12's immutable-pin contract requires a reviewed upstream migration in Phase 14. This is the documented scope exception, not a claim that these pages have passed V2 visual acceptance.

No calculator formulas, source pins, upstream caches, checked-in production pages, URLs, analytics configuration, production deployments or DNS are edited. Site-owned pages without an authored template now have a template copy; the original production source is preserved.

## Implementation and refinement

`scripts/v2-editorial.mjs` applies shared System v1 only to explicitly marked authored templates. `scripts/build-site.mjs` renders that opt-in after resolving existing tool tokens. The original substantive HTML remains intact: intro, article content, citations, author/date information where present, original section IDs and related-content links. Existing analytics and JSON-LD scripts remain exact. The renderer fails on unexpected template structure instead of silently dropping content.

Shared header/menu, skip link, breadcrumbs and footer replace the decorative legacy window/header. `assets/v2/editorial.css` adopts serif headings, local sans-serif body fonts, responsive gutters, reading widths, restrained card surfaces, CTA/link states and print styles. Articles flow in a readable column; hub/support cards use responsive grids. Generated section navigation precedes content on mobile and sits beside it on desktop. Existing authored cash-flow navigation is retained. Learn navigation uses the existing category names; Tools retains its original goal navigation without a redundant second panel.

The first screenshot comparison identified overlapping nested articles: the System v1 grid rule applied to all descendant articles/asides. Two selectors now target direct children only. A strict text-rectangle intersection check accompanies overflow/clipping and 44px targets so the regression cannot pass unnoticed. Tables retain all cells and scroll within a named keyboard-focusable region; the cash-flow example keeps all six rows, amounts and header scopes. Print hides navigation while retaining article content and table data.

## Verification contracts

- Independent Phase 12 baseline: [23 original HTML documents and provenance](phase-13/baseline.json). Browser comparison checks intro/body/related text, corresponding link labels/destinations, all meta/canonical/title values, JSON-LD, analytics snippets, table cells/scopes and every original content anchor.
- Artifact guard: 312 prior published files are byte-identical. The only changes are 23 opted-in pages, the two explicitly checked direct-child selectors, and the derived tool-token provenance audit. Exactly one new stylesheet is published. The audit retains every original entry and adds only newly authored templates. Homepage, all calculator/upstream/redirect files, robots, sitemap and route registry remain exact.
- Editorial browser suite: all 23 pages at mobile and desktop; nine representatives additionally cover 320/375/390/768/1440/1920, no-JS, forced/dark preference, blocked-font fallback and 200% text. Per engine: 141 layouts, 33 axe states, strict overlapping/clipped text and target checks, keyboard/menu/Escape, original section links, real table scrolling, print and all 22 directory links. Baseline screenshots use the preserved original HTML and unchanged original CSS on the same local origin.
- Existing goals/SEO/accessibility checks, System v1 references, calculator fixtures and JSON/storage/CSV regression suites remain required. The historical directory skip-link test now expects the shared shell's `Skip to content` link and actual `main#main` focus destination; its assertions remain strict.

Local Chromium passes all 23 content comparisons, 141 layouts and 33 clean axe states. Existing goals and SEO browser checks pass. 40 unit tests execute in process (`node --test --test-isolation=none`) to verify all named cases explicitly; the local default command reports file-level results, and hosted CI uses normal isolated execution. Final hosted results will be recorded before completion.

## Remaining boundaries

The isolated public demo remains the previous homepage runtime; no Phase 13 deployment is claimed. Phase 14 owns Retirement/Mortgage pilots and upstream guide adoption; Phase 15 owns the remaining calculator interiors. Final full-site QA, owner preview and separately authorized production release remain Phases 16–18. Inherited calculator accessibility/overflow/fragment findings are retained for those source-owned changes. Automated browser checks do not establish manual accessibility or owner acceptance.
