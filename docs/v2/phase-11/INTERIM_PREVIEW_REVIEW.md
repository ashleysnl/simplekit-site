# Interim homepage preview — supplemental review packet

Review status: **Awaiting owner feedback**. This packet identifies the candidate for visual acceptance; it records no permission to merge or deploy production.

- Immutable preview: **https://68d6205d.simplekit-preview.pages.dev**.
- Shared, replaceable alias: https://codex-preview.simplekit-preview.pages.dev.
- Reviewed runtime source: `f978df5c48209a02b107d4a31a81f7ba49088335`.
- Preserved release candidate tar.gz SHA-256: `e329da8c7c6afd7e7a36d0bb23805c336aa147deb406549d59a62bad86b868d4`.
- [Trusted default-branch preview upload](https://github.com/ashleysnl/simplekit-site/actions/runs/38073399192); [read-only deployed verification](https://github.com/ashleysnl/simplekit-site/actions/runs/38088742754).
- [PR #13](https://github.com/ashleysnl/simplekit-site/pull/13) targets `develop-v2` and remains unmerged.

## Reference and responsive comparisons

[Approved reference](../../design-reference/simplekit-v2-target.png) · [Original fidelity refinements and comparison](../mobile-fidelity-issue-12/COMPARISON.md) · [Phase 10 release-candidate verification](../phase-10-verification.md).

The reference is a static mobile composition. Tablet/desktop views are responsive adaptations; a 44px control minimum and readable text take precedence over shrinking everything to the raster's scaled dimensions.

| Width | Current viewport | Full page | Review focus |
| --- | --- | --- | --- |
| 375px | [Screenshot](hosted/viewport-375.jpg) | [Screenshot](hosted/home-375.jpg) | Headline wrapping, hero/image balance, search/questions, trust and two-column goals. |
| 390px | [Screenshot](hosted/viewport-390.jpg) | [Screenshot](hosted/home-390.jpg) | Mobile hierarchy, row proportions, card alignment and section spacing. |
| 768px | [Screenshot](hosted/viewport-768.jpg) | [Screenshot](hosted/home-768.jpg) | Tablet crop, navigation and responsive goal/featured layouts. |
| 1440px | [Screenshot](hosted/viewport-1440.jpg) | [Screenshot](hosted/home-1440.jpg) | Desktop adaptation, line length and overall alignment. |

## Differences requiring review

| Reference treatment | Candidate treatment | Reason or review decision |
| --- | --- | --- |
| Detailed coastal/forest reference photo. | Existing generated coastal asset, a different crop/scene and lighter overlay. | The image is not identical; approve this imagery/readability balance or request a specific refinement. |
| Dense static headline/questions/trust composition. | Readable responsive typography and minimum 44px touch controls increase vertical height relative to a scaled raster. | Check whether the compactness/readability balance is acceptable at both phone widths. |
| “Popular questions” and “Popular calculators.” | “Suggested questions” and “Featured calculators.” | No popularity data exists to support a popularity claim. |
| “Private / Stay in your browser.” | “Local results / Inputs stay local,” with the existing analytics qualification in privacy/methodology copy. | Financial inputs stay local; the site retains existing analytics. Avoid an absolute tracking/privacy claim. |
| Reference's icon circles and single-line goal names. | Responsive icon treatment and natural word wrapping, preserving 44px targets. | Assess border/radius/shadow/colour consistency and legibility, rather than forcing undersized controls. |
| Optional “Get started” panel. | Implemented guided discovery with seven goals, skip/back/restart/close and one to three existing tool recommendations. | Optional; all 22 tools remain accessible without using it. |

The interim preview work introduces verification tooling and evidence only; it makes no layout or calculator changes. The new deployment artifact is byte-identical to the verified Phase 10 preview. Any new layout refinement will require a new exact candidate, preview and verification before acceptance.

## Checks and remaining release gates

Phase 10 passed 36 repository tests, all 22 exact calculator fixtures, Budget/Retirement JSON save/import/reload, mortgage principal/payment and CSV reconciliation, 78 cross-engine layouts and 24 V2 axe states. Mobile Lighthouse medians: performance 98, accessibility 100, LCP 2.290s, CLS 0. The supplemental read-only run verifies the same candidate's public file bytes on both URLs and reruns all eight interaction suites and SEO; its final result is recorded in the [Phase 11 report](../phase-11-verification.md).

Pending manual checks: VoiceOver/Safari, NVDA/Firefox, real iPhone/Android, native toolbar zoom and human contrast review. Existing calculator accessibility findings and retired guide fragments remain separately recorded upstream work. Automated accessibility/lab scores do not complete those checks.

GitHub Pages still publishes production from `main` at repository root. This preview publishes the portable `dist/` artifact in the separate disabled-production Cloudflare project. A merge into `main` must not be treated as an approved or sufficient V2 publishing procedure; Phase 18 requires a separate reviewed release/deployment/rollback package and explicit approval.

## Owner outcome — fill after review

| Decision | Status | Exact candidate |
| --- | --- | --- |
| Visual/design acceptance | Pending | `f978df5c48209a02b107d4a31a81f7ba49088335` / `68d6205d-37ff-4827-86d9-6c2e3f861f82` |
| Requested refinements | Awaiting feedback | Same candidate |
| Outstanding manual accessibility/device review | Pending | See Phase 8 review matrix. |
| Permission to merge PR #13 into develop-v2 | Not granted | Separate explicit action. |
| Production release/deployment permission | Not granted | Requires Phase 18 package and separate explicit approval. |

Owner response, date and rationale: **not yet received**. The owner-expanded roadmap moved final full-site preview/design approval to Phase 17. This interim homepage packet does not complete Phase 17, the current Phase 11 inventory, or any release gate; the required develop-v2 candidate remains pending PR integration approval.
