# Phase 16 handoff — verified automation, preview review next

Status: `[~]`. Automated QA is complete for site candidate
`6ac53323275bc8348e7a97558b71bab694a68151`; owner visual/physical-device acceptance
and Phase 17 deployed-preview verification remain pending. No production change.

## Changes and ownership

- Site `assets/v2/home.css`: explicit existing navy for readable mobile hero body text. The final 27-width rendered-contrast/navigation/fallback/enlarged-text suite passes.
- `ashleysnl/SimpleKitTakeHomePay` `develop-v2` commit `8341a79be9a1f767b7337f711c0776f62787fb72`: `v2-calculator.css` constrains WebKit native-select appearance at 200% text, retains native select semantics/keyboard behavior and a dropdown indicator. Ineffective table containment rules were removed after reversible diagnostics disproved that hypothesis.
- `ashleysnl/SimpleKit-Core` `develop-v2` commit `04a7cfb5406fab82ec4a568e75cbbcc03e117932`: `v2/calculators.js` supports focused result-region arrow scrolling in WebKit. Nested controls and modified keys are excluded; no financial inputs/state/network are accessed. `docs/v2-shared-theme.md` documents the compatible opt-in/upgrade/rollback contract. Other Core runtime bytes are unchanged from the prior pin.
- Site manifests `data/calculator-sources.json`, `data/v2-calculator-migrations.json` and `docs/v2/phase-16/current/source-pins.json` adopt the exact source revisions deliberately.
- `tests/v2-header-hero-browser.cjs`: measure actual painted contrast instead of an obsolete gradient formula. `tests/v2-system-browser.cjs`: use genuine legacy source for isolation and distinguish exact local sprite redraw GETs from forbidden input-bearing requests. `tests/v2-calculator-browser.cjs`: capture useful overflow diagnostics and verify enlarged native-select and table keyboard behavior.
- `.github/workflows/validate.yml`: focused follow-up scopes retain unchanged passing evidence. Initial/default full QA and main/release PRs keep the full matrix; mandatory validation is preserved.
- The redesign plan, verification log, [machine evidence](phase-16/current/qa-evidence.json) and [screenshot index](phase-16/current/gallery.md) record current results separately from superseded attempts.

No financial formula, parsing, default, saved-state/export schema, canonical URL,
metadata, article content or production asset was changed. Unrelated Contractor
dirty files/divergent history and the Core preservation stash remain untouched.

## Verification and artifact

[Final integration run 38839747189](https://github.com/ashleysnl/simplekit-site/actions/runs/38839747189) passes static tests, SEO/output, preservation, deterministic build comparison, rollback packaging, system regression and all 20 remaining calculator cases in Chromium/Firefox/WebKit, plus the 27-width homepage header/hero suite. The system chain passes all 22 frozen numerical fixtures, Budget/Retirement JSON/storage round trips, mortgage CSV reconciliation and module/classic retirement equivalence. Source-preservation checks retain 262 pre-pilot runtime files exactly and all unchanged editorial head/content outside the reviewed shell replacement.

Unchanged pilot/editorial results from run 38548702694 and homepage/accessibility/SEO/performance from run 38837029465 are retained with archive-diff provenance. Lighthouse medians are performance 99, accessibility 100, LCP 1965ms, CLS 0. This does not claim new physical-device or screen-reader acceptance.

- [Candidate artifact](https://github.com/ashleysnl/simplekit-site/actions/runs/38839747189/artifacts/12020194392): 381 files, 67 HTML pages, 22 calculators, unchanged 53 sitemap URLs.
- Inventory SHA-256: `172332591b31e8277a3c42f2da3616e4ab51ac1f4cceb773df58a0f7555807c9`.
- Archive SHA-256: `6dfa9617aa4382781de6bdbe369e4a742174c70f451f4fd4d820b9395ff4c384`.
- Downloaded archive checksum/source/inventory match the CI artifact and local build. Workspace copy: `/workspace/artifacts/simplekit-v2/6ac53323275bc8348e7a97558b71bab694a68151/`.
- [Production rollback artifact](https://github.com/ashleysnl/simplekit-site/actions/runs/38839747189/artifacts/12020433644): source `ca7826db75cb4353488786aab80857b3a71c1be1`, archive SHA-256 `eb8f6a20d0048e919a90aceb7d4b9d7883a6b13b020e8aa2119f92f768f8cda4`. The pinned official builder reproduces four primary live file hashes. Rebuild/check is read-only.

## Next step and remaining gates

**Current update:** Phase 17 is now deployed and verified at https://1081e2fa.simplekit-preview.pages.dev, including preview-only navigation. [Phase 17 evidence](phase-17-verification.md) supersedes the historical access limitation below. Owner review and production authorization remain pending.

Phase 17 uploads and verifies the isolated demo, then obtains owner review. The trusted
[Manual Cloudflare preview workflow](https://github.com/ashleysnl/simplekit-site/actions/workflows/cloudflare-preview.yml)
on `main` accepts `source_ref` only: use the exact candidate SHA above. It preserves
the `simplekit-preview` environment, disabled production branch, no-custom-domain
guard and `codex-preview` branch upload. It removes the preview CNAME, disallows
crawling and sends `noindex, nofollow`; canonical metadata stays unchanged.
Capture the immutable upload URL and verify the candidate inventory with those
three intentional preview differences before requesting owner acceptance.

No dispatch or upload was performed here. The connected GitHub tools expose no
workflow-dispatch action, and the execution environment's GitHub CLI authentication
is invalid. A valid dispatch-capable connection or a manual run is required;
do not weaken environment protections or change main to work around this.

Physical iPhone/Android, VoiceOver/a second screen reader, native toolbar zoom and
owner design approval remain explicit manual gates. Analytics requests were
stubbed during browser tests; actual delivery/configuration remains a deployed
preview/authorized monitoring check. Main, production hosting/publishing and DNS
remain unchanged. Production merge/deploy still requires separate explicit approval.
