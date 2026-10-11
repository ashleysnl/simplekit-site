# Branch consolidation audit — 2026-10-11

## Scope and original inventory

Integrate existing work into `develop-v2`; do not complete or release V2. Original remote heads:

| Branch | Original SHA |
| --- | --- |
| main | ca7826db75cb4353488786aab80857b3a71c1be1 |
| develop-v2 | dd72499d7db3170d6bb7a0eadaaa8f469e3d1eff |
| feat/cloud-native-build | a12596c216406f6555eb98dada04428296f293be |
| feature/simplekit-v2-mobile-fidelity | 78aa5c2c2d9a9ceb79e1f7b0e84c65eed51a8b90 |

## Cloud-native decisions

The full tree of `feat/cloud-native-build` is exactly identical to `main` at its PR #5 squash integration, `ca7826d`. That squash commit is already an ancestor of both V2 branches. Comparing cloud-native acquisition, build, SEO, output validation, source pins, browser smoke and CI files against `develop-v2` found only subsequent V2 additions: discovery/goals generation, image/font MIME types and the `develop-v2` CI trigger. No missing cloud-native build, CI/CD or migration functionality was identified.

| Original commit | Decision and reason |
| --- | --- |
| a0666afc3d7e2889ac584aba5c1410eb0746cdef | Portable build and pinned sources already implemented through PR #5. Retain portable paths, immutable calculator/Core sources, route manifests, migration trackers, validations, CI and isolated manual preview. Do not cherry-pick over newer V2 build changes. |
| 9e3e22c2d34330908342a04ecf4e10464bd09ab5 | Linux validation documentation and reproducible browser smoke already present. Preserve history; no duplicate patch needed. |
| a12596c216406f6555eb98dada04428296f293be | Historical PR/hosted validation evidence already present. Preserve history; no duplicate patch needed. |

History-only merge `8192dbb9dd589eea95e78a58bb4e0ac0daf21cbc` deliberately uses the `ours` strategy **only after whole-tree equivalence and subsequent V2 functionality were verified**. Its tree is identical to its first parent. This records the original three commits as ancestors without importing old files or resolving redundant squash-history conflicts by overwriting V2. No unique implementation was excluded or discarded.

## PR #13 integration

[PR #13](https://github.com/ashleysnl/simplekit-site/pull/13) is the only open PR found in the initial audit. It targets `develop-v2`; its 31 commits are integrated by merge `340120241aa9dc14ccf54b8d90e883e5499b79bc`. No conflicts occurred. The resulting whole tree is exactly identical to the audited feature tip `78aa5c2`, before adding this audit document. Both feature tips are ancestors of the resulting development history. No shared history was rewritten.

The user's consolidation instruction authorizes integration into development. It does not authorize redesign acceptance or production release. The roadmap and all evidence retain their existing task states, source ownership, original mockup and outstanding acceptance requirements. Phases 13–18 remain incomplete: editorial/support pages; two calculator pilots and upstream integration; remaining 20 calculators; final full-site QA/release candidate; owner preview/review; separately authorized production rollout. Manual assistive-technology, physical-device and native zoom review and inherited calculator accessibility/link/overflow findings remain documented. Issue #12 remains open.

## Dependency audit and cleanup blocker

- GitHub Pages is built from `main`, path `/`, with CNAME `simplekit.app`. Latest production build is `ca7826d`, updated 2026-10-09T12:51:33Z. Configuration is unchanged.
- No Actions runs were active during the initial check. Validation workflows build/test only; Cloudflare upload requires manual dispatch and an isolated environment. No deploy workflow was dispatched.
- Cloudflare account `ce3b573d73e4b31d543e121324ab8c74` has one Pages project, `simplekit-preview`, production branch `__production_disabled__`, only a `.pages.dev` domain and no Git source connection. Its latest successful deployment is `68d6205d-37ff-4827-86d9-6c2e3f861f82`, an ad-hoc preview on `codex-preview`; it does not depend on either feature branch remaining present. Existing GitHub preview deployment records reference historical mobile-fidelity commits, all preserved as ancestors.
- **Repository webhook inspection fails with HTTP 403: `Resource not accessible by integration` from `GET /repos/ashleysnl/simplekit-site/hooks`.** External automation dependencies therefore cannot be fully checked with the available GitHub integration. Do not infer that there are no webhooks.

Under the requested stop condition, neither remote feature branch is deleted. Four remote branches remain; the requested two-branch end state is blocked pending successful webhook/dependency inspection. Code preservation and integration can still be completed safely. After access is available, re-fetch all heads, recheck dependencies and CI, confirm both tips remain ancestors, then delete only the two redundant feature refs. No force-push or production change is permitted.

## Validation

Node 24.19.0. Logs and browser evidence are retained in `/tmp/simplekit-consolidation/`.

- All 23 pinned GitHub sources verified; 38 repository tests pass.
- Build, SEO generation, SEO/output validation pass: 22 calculators, 53 sitemap URLs, 67 HTML routes, 919 internal links and 13 compatibility pages.
- Preservation guard verifies 94 calculator JavaScript files match pinned upstream. All 335 prior runtime files are unchanged; only two opt-in system assets are added. Review reference HTML/controllers remain excluded from publication.
- Three review references regenerate byte-identically. A second build matches all 337 published files; aggregate artifact checksum `639d1c6a0ef62b5a9ee082a2531c1287ff1277e408875e35d2a7de925111b84c`.
- Source pins, production root homepage/CNAME/robots/sitemap and protected production files remain unchanged. Live HTTP reads of homepage, robots, sitemap and all 22 calculator HTML pages match `main` byte-for-byte.
- Local Chromium browser smoke and all 22 exact numerical fixtures pass with zero page errors/failed local requests. Foundations, header/hero, discovery, trust, goals, featured, onboarding, accessibility, release/state/export, SEO, design-system and site-inventory suites all pass.
- Onboarding covers all 93 answer/skip paths. Accessibility covers 26 reflow/fallback layouts and audits all 22 unchanged legacy tools separately. Budget/Retirement JSON import/export/storage reload and mortgage calculations/both CSV reconciliations pass.
- SEO browser checks pass for 66 routes, 99 assets, all 53 sitemap URLs, no-JS discovery and 23 documented redirect destinations. System checks pass 33 layouts, 11 clean axe states and four legacy isolation comparisons. Site inventory audits all 67 routes with 155 captures/layouts, zero errors/failed requests and documented inherited calculator overflow findings.
- Three Lighthouse mobile laboratory runs pass: median performance 99, accessibility 100, LCP 1955.86305 ms and CLS 0. These are local simulated results, not field performance or manual acceptance.
- Git whitespace checks pass, the working build does not alter tracked files, and every roadmap phase status/task line is preserved. Automated hosted validation runs on the pushed development commit; its final result and URL are supplied in the handoff. No manual acceptance is inferred from automated checks.

## Final inventory

Cleanup is intentionally blocked, so the remote branch names remain `main`, `develop-v2`, `feat/cloud-native-build`, and `feature/simplekit-v2-mobile-fidelity`. Only `develop-v2` advances to the audited integration and documentation; all other SHAs remain as above. Its final SHA is available through the commit containing this report and the final handoff. Production configuration, deployed commit, DNS, calculator formulas, source pins and URLs are untouched.
