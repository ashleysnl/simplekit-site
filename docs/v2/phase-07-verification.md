# Phase 7 — optional guided discovery

Status: `[~]`. Owner instructed Phase 7 after Phase 6. Work continues on temporary `feature/simplekit-v2-mobile-fidelity` in [PR #13](https://github.com/ashleysnl/simplekit-site/pull/13), targeting `develop-v2`. No merge or production deployment is authorized.

The reference's blue “Not sure where to start?” panel now offers an optional inline flow. Three optional questions ask for a broad goal, an immediate question and whether to start with one tool or a few related tools. Native radio groups and buttons provide Continue/Show tools, Skip, Back, Restart and Close. Step/status text announces progress, each step focuses its heading, and close/Escape restores the Get started control. This is nonmodal; users can tab onward normally.

Names, descriptions and destinations come from the existing validated discovery index and canonical manifest. No account, numeric financial input, AI service, dependency or backend is added. Answers are held in a local module variable; close/restart clear it and remove the rendered answer controls. No answers go into storage, the URL, analytics or network APIs. The existing site-wide analytics/privacy qualification remains visible; this statement describes onboarding choices, not a claim that the website has no analytics.

## Deterministic mapping

Goal-only paths use the first row for that goal. An immediate question narrows the selection. “Start with one tool” or skipping the detail question returns the first ID; “Explore a few related tools” returns the listed one to three IDs in order. When the goal is skipped, the next question offers the first need for each goal. All-skipped/unknown choices return an all-tools fallback. Changing the goal discards a stale need; the pure mapping also rejects a need from another selected goal.

| Goal | Immediate question | Tool IDs in order |
| --- | --- | --- |
| Retirement | Build a plan | retirement-planner, cpp-calculator, fire-calculator |
| Retirement | Early retirement | fire-calculator, retirement-planner |
| Retirement | CPP start ages | cpp-calculator, retirement-planner |
| Home | Affordability | house-affordability-calculator, mortgage-calculator, debt-to-income-ratio-calculator |
| Home | Rent/buy | rent-vs-buy-calculator, mortgage-calculator |
| Home | Payments | mortgage-calculator, mortgage-paydown-vs-invest-calculator |
| Budget/debt | Monthly budget | budget-planner, emergency-fund-calculator, net-worth-calculator |
| Budget/debt | Repayment | debt-payoff-calculator, credit-card-interest-calculator |
| Budget/debt | Cash buffer | emergency-fund-calculator, savings-goal-calculator |
| Investing | Savings growth | compound-interest-calculator, investment-fee-calculator, savings-goal-calculator |
| Investing | RRSP/TFSA | rrsp-vs-tfsa-calculator, compound-interest-calculator |
| Investing | Fees | investment-fee-calculator, compound-interest-calculator |
| Tax | Documents | canadian-tax-checklist, take-home-pay-calculator |
| Pay/work | Take-home pay | take-home-pay-calculator, budget-planner |
| Pay/work | Contractor rate | contractor-effective-hourly-rate-calculator, take-home-pay-calculator |
| Travel | Trip/budget | travel-planner, savings-goal-calculator |

Recommendations explain what tools explore and explicitly identify educational estimates. They do not predict outcomes or recommend financial actions. All 22 calculators remain directly available through the directory. With JavaScript disabled or the onboarding module unavailable, the callout is an ordinary Browse all tools link.

## Verified implementation; manual acceptance pending

- [x] 30 repository tests: all 93 goal/need/detail/skip combinations; canonical, unique and bounded recommendations; all 16 immediate needs; primary/secondary goals; changed/unknown inputs; explicit fallback and unknown-tool rejection.
- [x] Portable build/23 pins, SEO/output and preservation: 22 calculators, 53 unchanged sitemap URLs, 67 HTML routes, 327 files, 94 unchanged calculator JavaScript files.
- [x] Actual browser paths, keyboard/AX, private state, back/restart/close and no-JS/failed-module fallback.
- [x] Responsive/screenshots, readable enlargement, forced colors and blocked fonts/icons.
- [x] Isolated Cloudflare candidate, secure hosted regressions and artifact comparison.
- [ ] Owner visual review; no merge or production deployment.

Manual screen readers, native toolbar zoom and real devices remain Phase 8 follow-up. Automated Chromium AX/keyboard checks must not be reported as manual assistive-technology coverage.

## Local visual refinement

The first responsive pass exposed a 200% text overflow at 320px; rem-based reflow and readable button/choice spacing correct it. Screenshot review then found a compressed mobile CTA despite valid control rectangles. Phones now use a full-width Get started row; tablet/desktop retain the reference side-by-side layout. The browser suite checks actual text glyph bounds inside controls, not just their boxes. All 93 browser paths and 24 responsive/fallback states pass after both refinements. No answer requests, storage changes or analytics-array changes occur. Header checks at 27 widths still pass with delayed-loading CLS 0.

[375px panel](phase-07/panel-375.jpg) · [390px panel](phase-07/panel-390.jpg) · [Tablet](phase-07/panel-768.jpg) · [Desktop](phase-07/panel-1440.jpg) · [390px flow](phase-07/flow-390.jpg) · [Browser evidence](phase-07/onboarding-browser.json).

## Final isolated preview

[Demo](https://6feb3be4.simplekit-preview.pages.dev) runs commit `9abcee3f2a6b0eb157ae5feaacfcb6598616ea1c`. [CI 38060235701](https://github.com/ashleysnl/simplekit-site/actions/runs/38060235701) and [deployment/hosted verification 38060246506](https://github.com/ashleysnl/simplekit-site/actions/runs/38060246506) both pass. Final tracking changes contain documentation/evidence only; deployed runtime files remain identical.

All seven secure hosted suites pass: header/hero (27 widths and delayed-loading CLS 0), discovery (44 exact searches, intents and four suggested questions), trust/privacy, goals, five featured rows, onboarding (93 answer/skip paths and 24 responsive/fallback states), and all 22 exact calculator fixtures. HTTP checks verify 24 routes return 200 with production canonical URLs and preview noindex. No browser page errors or failed application responses remain. Onboarding adds no answer requests, storage, URL or analytics-array changes. Manual screen readers, real devices and native toolbar zoom remain unverified Phase 8 work.

Both artifact ZIP digests were verified. Preview-site artifact `11672921378` has SHA-256 `6305fa40fec270921d313e09fbf001a2c55e50acfe9b7a84ba1fa4c9dca062be`: all 325 ordinary files match the portable local build byte for byte; 327 total preview files include intentional robots/header isolation and omit CNAME. Browser-evidence artifact `11673291064` has SHA-256 `e6400861ced445a71f395f6ee005474de0f1219d552dbbf4c28240c883aa6291`. [Artifact comparison](phase-07/preview-artifact.json) and [deployment identity](phase-07/deployment.json) preserve the check results. The dedicated project has production branch `__production_disabled__`, no production canonical deployment, and only its pages.dev hostname.

Secure before/after screenshots cover 375/390/768/1440px. Mobile review confirms readable full-width CTA text, native choice spacing, and no horizontal overflow; tablet/desktop retain the side-by-side callout. This supplements the [fidelity discrepancy report](mobile-fidelity-issue-12/COMPARISON.md), preserving its baseline and earlier checkpoints.

| Width | Hosted baseline | Verified homepage |
| --- | --- | --- |
| 375px | [Before](phase-07/hosted/before/home-375.jpg) | [After](phase-07/hosted/after/home-375.jpg) |
| 390px | [Before](phase-07/hosted/before/home-390.jpg) | [After](phase-07/hosted/after/home-390.jpg) |
| 768px | [Before](phase-07/hosted/before/home-768.jpg) | [After](phase-07/hosted/after/home-768.jpg) |
| 1440px | [Before](phase-07/hosted/before/home-1440.jpg) | [After](phase-07/hosted/after/home-1440.jpg) |

[Hosted mobile callout](phase-07/hosted/regression/v2-onboarding/panel-375.jpg) · [Hosted flow](phase-07/hosted/regression/v2-onboarding/flow-390.jpg) · [Hosted onboarding results](phase-07/hosted/regression/v2-onboarding/onboarding-browser.json). Every suite's JSON/log is retained under `phase-07/hosted/regression/`.

`main` remains `ca7826db75cb4353488786aab80857b3a71c1be1`; `develop-v2` remains `6e3acc72506b40ec11c1bd0015c6eee2ca473213`. Production root pages, source pins, analytics and calculator logic are unchanged. No merge, production deployment or DNS modification occurred. PR #13 targets `develop-v2`; owner visual approval remains pending.
