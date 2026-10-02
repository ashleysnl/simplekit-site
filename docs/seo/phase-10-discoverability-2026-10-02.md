# Phase 10 — initial discoverability audit, 2026-10-02

## Scope and outcome
Audited current GitHub homepage, About, Methodology, Learn hub, and all 16 published Learn guides. Checked representative generated templates. Existing calculator normalization is covered by Phase 3; this pass did not re-verify every calculator's regulated numeric constants.
Initial entity/content discoverability pass completed. Regulated-value maintenance and earning independent references remain ongoing; analytics/CWV setup gaps remain open.

## Evidence and fixes
- 16/16 guide sources have one H1, static introductory explanations, and contextual canonical calculator links.
- About identifies Ashley Skinner as the Canada-based maintainer and distinguishes educational estimates from official determinations. Methodology exposes assumptions and primary-source policy.
- Added a stable WebSite identity and truthful Person creator reference to homepage JSON-LD. Added AboutPage markup referencing the same identities. No professional credentials, ratings, organizational status or publication/review dates invented.
- Home template's older keyword-list schema description replaced with the current concise description.
- About template lacked the published maintainer/trust/privacy content; synchronized it to the maintained production About page so rebuilding retains those statements.
- CPP Basics had no primary pension citation. Added official CPP overview/timing links and contextual Methodology link.
- RRSP/TFSA Basics had no primary account citation. Added CRA TFSA overview/RRSP withdrawals and contextual Methodology link. Clarified that TFSA contributions are not deductible and RRSP withdrawals generally taxable, checked against the linked CRA pages.
- Updated both guide templates while preserving tool URL tokens.
- General arithmetic guides do not need decorative government citations. Existing mortgage-affordability and prepayment guides already provide relevant CMHC/OSFI/Canada.ca references.

## Validation
npm run seo:validate passed for all 22 tools. git diff --check passed. All eight edited files retain one H1 and canonical; all edited JSON-LD parses.
After GitHub publication, fresh live responses for homepage, About, CPP Basics and RRSP/TFSA Basics contained the expected new identity markup or visible source section. First live check was stale during deployment; fresh cache-busting GETs then verified the deployed content. Cloudflare purged only the four changed public URLs after publication.
No calculator forms, scripts or numerical logic changed. JSON parsing is not a Google rich-result eligibility guarantee.

## Ongoing work
1. Maintain regulated Canadian constants with a per-tool record of value, effective period, exact primary source, code location and verified review date. Do not label the entire suite current until each relevant value has been checked.
2. Earn independent references through useful tools and substantive original resources; no outreach, backlink purchase or external posting performed.
3. Recheck unresolved Google hub/guide indexing around October 9.
4. Link SimpleKit GA4 and configure CrUX to finish measurement; retain October 2–29 post-release performance window.
No automatic recurring task created.

## Primary references
- https://www.canada.ca/en/services/benefits/publicpensions/cpp.html
- https://www.canada.ca/en/services/benefits/publicpensions/cpp/when-start.html
- https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/what.html
- https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/making-withdrawals.html
