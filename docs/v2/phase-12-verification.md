# Phase 12 — Unified V2 design system and shared site shell

Status: `[~]`. System v1, shared components and responsive review references are implemented. Final hosted cross-engine verification is pending. No editorial/calculator migration or owner design acceptance is claimed.

## Implemented contract and reference pages

[System v1](phase-12/DESIGN_SYSTEM.md) extends the existing Phase 1 type/space/colour/surface/icon/state tokens through explicitly scoped `assets/v2/system.css`. `.sk-v2[data-v2-system="1"]` is the opt-in boundary. Existing foundation values, homepage bundle and legacy pages remain unchanged. `assets/v2/shell.js` enhances only opted-in disclosure navigation and adds no financial-input, storage, analytics or network behavior.

[Page-family specifications](phase-12/PAGE_FAMILIES.md) link the approved homepage reference and define responsive homepage/directory/editorial/calculator conventions. [Core/upstream adoption plan](phase-12/CORE_MIGRATION.md) preserves all 23 pins and assigns source-reviewed changes to later phases. Site-owned build helpers render header/normal menu links, skip link, breadcrumbs, footer and canonical related content; they are exemplars for reviewed Core integration, not an unreviewed replacement Core API.

Three reproducible review-only HTML documents cover editorial reading, interactive calculator presentation and the complete component/state workbench. They include labelled currency/percent/number/select/radio/checkbox/switch/slider controls, help/validation, KPI/chart/data table, disclosure, feedback, disabled/empty/loading and sample export states. Fixed illustrative data does not replace any financial calculation. Reference HTML/controller live under docs and are excluded from the build, sitemap and public routes.

The first screenshot review refined mobile article navigation order and checkbox/radio presentation: navigation now precedes reading in DOM/mobile order and sits alongside on desktop; compact glyphs retain 44px associated-label targets. Forced-colour charts have an explicit contrasting backing and equivalent descriptive/table data. Versioned adoption rules and purpose-specific functional deviations are documented.

## Validation contracts

- `tests/v2-system-browser.cjs`: 33 layouts per engine at 320/375/390/768/1440/1920 plus no-JS, dark/forced-colour, blocked-font and 200% text modes. Strict page overflow, actual text-glyph bounds and 44px activation checks; 11 axe states per engine; keyboard skip/menu/Escape/resize focus, native disclosure/switch/slider, invalid/corrected/reset input states, real sample CSV download and print behavior. Reference interactions must add no requests or persisted data.
- Four legacy pages (home, long article, Mortgage and Retirement) load the new assets without opting in; exact geometry/type/colour/control comparisons must remain unchanged.
- `tests/v2-system-artifact.cjs`: all 335 previous runtime file sizes/hashes remain exact; only `assets/v2/system.css` and `assets/v2/shell.js` may be added. No reference HTML/controller is published.
- Existing source/preservation guard, repository tests, portable build, SEO/output, all 22 exact numerical fixtures and state/import/export/CSV checks remain mandatory. The new isolated read-only CI job executes these and Chromium/Firefox/WebKit references; no deployment environment/secrets.

Local Firefox startup encountered Linux sandbox/cache limitations (`uid_map` read-only and no writable font/dconf caches). No assertion is removed or browser result invented. Hosted Ubuntu validation supplies the standard browser dependencies and runs the full three-engine suite. Manual VoiceOver/NVDA, devices, native zoom, human contrast and owner acceptance remain explicit future checks; automation is not WCAG certification or design approval.

## Protected workflow and remaining scope

Develop-v2 was fetched and fast-forwarded to the owner-expanded roadmap commit `dd72499d7db3170d6bb7a0eadaaa8f469e3d1eff`. Previous completed work remains in open PR #13; the next phase continues on its existing temporary branch, `feature/simplekit-v2-mobile-fidelity`, without creating another branch or inferring merge approval. Main and production stay at `ca7826db75cb4353488786aab80857b3a71c1be1`. No deployment, DNS, upstream pin or financial-source mutation occurs.

The [interim homepage demo](https://68d6205d.simplekit-preview.pages.dev) still shows the Phase 10 runtime; these review-only references are not deployed. Phase 13 migrates site-owned editorial/support pages after this foundation is verified; Phases 14–15 migrate calculator interiors through reviewed upstream changes. Inherited overflow/accessibility/retired-fragment findings remain recorded until addressed. Phases 16–18 and final production approval are incomplete.
