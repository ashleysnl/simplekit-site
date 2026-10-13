# Phase 17 — Isolated full-site preview preparation

Status: `[~]`. Preview procedure and deployed verification are prepared. The full-site demo is uploaded and its deployed checks pass; see the candidate below. Final WebKit enlarged-text correction and owner review remain pending.

The manual-only `cloudflare-preview.yml` retains its dedicated `simplekit-preview` project, `codex-preview` branch, `simplekit-preview` environment, `__production_disabled__` production-branch guard and rejection of custom domains. No automatic deployment trigger is added.

After final QA, dispatch from `develop-v2` with the exact verified source SHA, `full_qa=false` and empty `baseline_url`. The workflow records a production-ready immutable archive and source/checksum first, then removes `CNAME` and adds preview-only noindex/robots controls before upload. It never changes production or DNS.

Deployed verification checks the homepage/directory and all 22 calculator paths, reruns the exact 22 financial fixtures and key JSON/storage/CSV plus retirement fallback interactions, captures mobile/tablet/desktop homepage screenshots, and compares every ordinary published file against the recorded production inventory on both the immutable URL and shared branch alias. The only exceptions are removed `CNAME`, preview robots and the Cloudflare-consumed `_redirects` control file if one is present. Each fetched file must retain `X-Robots-Tag: noindex`; robots must disallow crawling. Full visual/accessibility/performance matrices stay in Phase 16.

Record upload workflow URL, immutable demo URL, replaceable alias, source SHA, archive/inventory digests and artifact links after success. The existing demo remains the Phase 14 candidate at https://1e526422.simplekit-preview.pages.dev until a new upload succeeds; it must not be presented as the complete new candidate.

Owner review is required against the exact full-site candidate, the saved mockup and derived page references. Document design acceptance separately from production release permission. Physical-device/screen-reader/native-toolbar-zoom review remains explicitly pending or requires specific owner acceptance of the documented limitations.

All 24 production/source branch heads were rechecked against their baselines and remain unchanged ([evidence](phase-16/production-heads.json)). Pages configuration is retained in the Phase 18 baseline. New upload, deployed checks, owner acceptance and production release are not marked complete before verification.

## Verified functional full-site demo

- Immutable URL: https://c5817f32.simplekit-preview.pages.dev
- Shared alias: https://codex-preview.simplekit-preview.pages.dev
- Source: `818b22501fa3225032946a389207442a5ffbafc7`
- [Successful upload and verification](https://github.com/ashleysnl/simplekit-site/actions/runs/38247367021): 22/22 exact deployed financial fixtures, zero page errors/failed same-origin requests, JSON import/export and storage reload, mortgage CSV/payment reconciliation, and module/classic retirement parity.
- Both URLs match all 379 ordinary published files, with noindex headers and disallowed preview robots. The 381-file production artifact retains its production CNAME and indexing separately.
- All 24 production branch heads remain unchanged. The independent browser run passes all tools in Chromium/Firefox and 19/20 WebKit enlarged-text cases; Take Home Pay at 200% text remains a release-blocking layout finding. Normal-size deployed financial functionality passes; this demo is ready for feedback but is not production approval.

## Owner feedback: compact iPhone 16 Pro homepage

The owner requested a clearer coastal image and a more compact match to the vision at 402 × 874 CSS pixels. [Focused refinement and measured baseline](iphone16pro-refinement/README.md) are prepared on `develop-v2`. New after screenshots, interaction/contrast/reflow verification and a replacement demo upload are pending because browser/network commands were aborted before execution. The verified c5817f32 demo remains available; it does not contain the new CSS. The prior homepage/performance passing results must be rechecked for this refinement before release acceptance.

## Compact iPhone homepage uploaded for owner verification

Immutable demo: https://b1364470.simplekit-preview.pages.dev. Source `77664662f9b1be9eb5ff68b32d880097e952e0a5`; [successful manual upload and deployed checks](https://github.com/ashleysnl/simplekit-site/actions/runs/38417515799). Shared alias now points to this candidate. All 22 deployed financial fixtures, JSON/state/CSV and retirement loading-path checks pass; both origins match 379 ordinary published-file hashes with noindex/robots protection. [Before/after iPhone capture and measurements](iphone16pro-refinement/README.md): all four goal cards fit within the first 874px. Owner design acceptance and remaining full visual/accessibility checks are still open; no production action.

## Full-scroll continuity verified and deployed

The owner identified the legacy landing page below the V2 guided-start panel. Duplicate retirement/process/trust/promotional blocks and the long tool footer are removed; useful guides and maintainer/support/privacy/methodology links now use consistent V2 components. [Full-scroll desktop/mobile and accessibility evidence](homepage-continuity/README.md).

Review URL: https://686bceb8.simplekit-preview.pages.dev, source `4554b4e2a9663b258040d9ead595e1faa4e5d8d2`. [Workflow 38422069217](https://github.com/ashleysnl/simplekit-site/actions/runs/38422069217) passes build, upload, 22 deployed calculator fixtures, state/import/export/CSV and retirement loading-path checks; both origins match 379 ordinary published files with noindex/robots protection. This is the latest demo for owner review. Main remains `ca7826d`; no production/DNS/publishing changes.
