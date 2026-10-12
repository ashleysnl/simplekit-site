# Phase 17 — Isolated full-site preview preparation

Status: `[~]`. Preview procedure and deployed verification are prepared. No new upload is claimed. Full Phase 16 QA and execution-environment network access must succeed before dispatch.

The manual-only `cloudflare-preview.yml` retains its dedicated `simplekit-preview` project, `codex-preview` branch, `simplekit-preview` environment, `__production_disabled__` production-branch guard and rejection of custom domains. No automatic deployment trigger is added.

After final QA, dispatch from `develop-v2` with the exact verified source SHA, `full_qa=false` and empty `baseline_url`. The workflow records a production-ready immutable archive and source/checksum first, then removes `CNAME` and adds preview-only noindex/robots controls before upload. It never changes production or DNS.

Deployed verification checks the homepage/directory and all 22 calculator paths, reruns the exact 22 financial fixtures and key JSON/storage/CSV plus retirement fallback interactions, captures mobile/tablet/desktop homepage screenshots, and compares every ordinary published file against the recorded production inventory on both the immutable URL and shared branch alias. The only exceptions are removed `CNAME`, preview robots and the Cloudflare-consumed `_redirects` control file if one is present. Each fetched file must retain `X-Robots-Tag: noindex`; robots must disallow crawling. Full visual/accessibility/performance matrices stay in Phase 16.

Record upload workflow URL, immutable demo URL, replaceable alias, source SHA, archive/inventory digests and artifact links after success. The existing demo remains the Phase 14 candidate at https://1e526422.simplekit-preview.pages.dev until a new upload succeeds; it must not be presented as the complete new candidate.

Owner review is required against the exact full-site candidate, the saved mockup and derived page references. Document design acceptance separately from production release permission. Physical-device/screen-reader/native-toolbar-zoom review remains explicitly pending or requires specific owner acceptance of the documented limitations.

All 24 production/source branch heads were rechecked against their baselines and remain unchanged ([evidence](phase-16/production-heads.json)). Pages configuration is retained in the Phase 18 baseline. New upload, deployed checks, owner acceptance and production release are not marked complete before verification.
