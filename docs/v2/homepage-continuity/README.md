# One continuous V2 homepage

Status: `[~]` — implemented, uploaded and locally/deployed verified; owner review remains pending. Production remains unchanged.

The owner reported that the compact V2 homepage transitioned into an appended legacy landing page when scrolling. The earlier demo at https://b1364470.simplekit-preview.pages.dev showed the duplicate retirement promotion, large process/trust/support cards and long calculator-directory footer beneath the new homepage.

## Change

- Remove the appended legacy page, repeated retirement promotion and duplicate process/trust panels. Featured calculators, goal navigation, guided discovery and qualified privacy information already cover those purposes.
- Keep useful educational destinations as three compact V2 guide rows, using the featured-list typography, icon discs, separators and colour palette.
- Replace the 22-link legacy footer with a compact V2 footer: all-tools directory, guides, maintainer, support/corrections, privacy, methodology and existing Buy Me a Coffee destination.
- Move the qualified privacy/analytics disclosure into the footer, retaining keyboard-accessible Privacy details and Methodology & sources links.
- Retain the approved compact header/hero, coastal image, search, questions, goal cards, featured calculators and guided-start flow. Enforce the header wordmark's 44px hit area.
- Remove unused homepage legacy-wrapper styling. Calculator sources, financial logic, analytics code, canonical URLs and sitemap entries are unchanged.

## Verification

- [x] Portable build: 23 immutable sources, all 22 calculators.
- [x] Existing repository unit suites pass.
- [x] SEO/output validation: unchanged 53 indexed URLs, 67 HTML pages and 201 local assets; 1,322 valid internal links. Homepage link count drops because repeated directory/promotional links are removed; all destinations remain published.
- [x] Chromium full-page inspection at 375/390/402/768/1440px; no horizontal overflow or visible touch target below 44px.
- [x] 402px enlarged text at 200% reflows without horizontal overflow.
- [x] WCAG 2 A/AA and 2.1 AA axe audits pass at 402px and 1440px.
- [x] Mobile menu open/Escape behavior, search/clear and privacy-to-methodology keyboard navigation pass; zero page errors or failed same-origin requests.
- [x] Exactly one V2 footer, three guide rows and no legacy homepage/footer wrappers.
- [x] Isolated demo upload, public artifact/robots and deployed calculator checks.
- [ ] Owner review of the complete scroll. Production permission remains separate.

[Full mobile page](home-402.jpg) · [Lower-page transition](lower-402.jpg) · [Desktop page](home-1440.jpg) · [Browser evidence](verification.json).

The full 402px page is 2,087px tall, versus 8,314px in the saved prior DPR-3 full-page capture (the appended landing page and long directory footer were responsible for most of that extra length). This is a focused Chromium check, not a claim of final cross-engine/device/screen-reader release acceptance. The previous unrelated Take Home Pay WebKit enlarged-table finding remains open and its source edit is preserved separately.

## Review demo

https://686bceb8.simplekit-preview.pages.dev · shared alias https://codex-preview.simplekit-preview.pages.dev

Source `4554b4e2a9663b258040d9ead595e1faa4e5d8d2`; [successful deployment and verification](https://github.com/ashleysnl/simplekit-site/actions/runs/38422069217). All 22 deployed financial fixtures pass with zero page errors or failed same-origin requests. Budget/Retirement JSON import/export and reload, mortgage payment/CSV reconciliation and retirement loading-path parity pass. Both demo URLs match all 379 ordinary published files and retain preview noindex/robots protections.

The production branch remains `ca7826db75cb4353488786aab80857b3a71c1be1`; production, publishing configuration and DNS were not modified. Review the entire scroll on this immutable demo; visual acceptance and production permission remain separate.
