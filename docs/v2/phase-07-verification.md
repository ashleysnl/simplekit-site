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

## Verification in progress

- [x] 30 repository tests: all 93 goal/need/detail/skip combinations; canonical, unique and bounded recommendations; all 16 immediate needs; primary/secondary goals; changed/unknown inputs; explicit fallback and unknown-tool rejection.
- [x] Portable build/23 pins, SEO/output and preservation: 22 calculators, 53 unchanged sitemap URLs, 67 HTML routes, 327 files, 94 unchanged calculator JavaScript files.
- [x] Actual browser paths, keyboard/AX, private state, back/restart/close and no-JS/failed-module fallback.
- [x] Responsive/screenshots, readable enlargement, forced colors and blocked fonts/icons.
- [ ] Isolated Cloudflare candidate, secure hosted regressions and artifact comparison.
- [ ] Owner visual review; no merge or production deployment.

Manual screen readers, native toolbar zoom and real devices remain Phase 8 follow-up. Automated Chromium AX/keyboard checks must not be reported as manual assistive-technology coverage.

## Local visual refinement

The first responsive pass exposed a 200% text overflow at 320px; rem-based reflow and readable button/choice spacing correct it. Screenshot review then found a compressed mobile CTA despite valid control rectangles. Phones now use a full-width Get started row; tablet/desktop retain the reference side-by-side layout. The browser suite checks actual text glyph bounds inside controls, not just their boxes. All 93 browser paths and 24 responsive/fallback states pass after both refinements. No answer requests, storage changes or analytics-array changes occur. Header checks at 27 widths still pass with delayed-loading CLS 0.

[375px panel](phase-07/panel-375.jpg) · [390px panel](phase-07/panel-390.jpg) · [Tablet](phase-07/panel-768.jpg) · [Desktop](phase-07/panel-1440.jpg) · [390px flow](phase-07/flow-390.jpg) · [Browser evidence](phase-07/onboarding-browser.json).
