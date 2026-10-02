# Phase 9 — initial search feedback review
Reviewed October 1, 2026 (America/St_Johns); API actions October 2 UTC.
Property: sc-domain:simplekit.app. Sources: connected GSC Wizard, user-supplied SimpleKit GA4 Reports snapshot, GitHub SEO plan, Cloudflare configuration.

## Search baseline
Settled Google Web Search: September 2–29; comparison August 5–September 1. Both predate October 1 SEO/UX release.

| Metric | Current | Previous |
|---|---:|---:|
| Clicks | 7 | 2 |
| Impressions | 3,910 | 5,505 |
| CTR | 0.179% | 0.036% |
| Average position | 66.65 | 71.60 |

Retrieved all 1,102 available query rows and 28 page rows. Query privacy filtering and page aggregation mean row totals need not equal property totals.

### Demand and decisions
- Loan calculator: 1,379 page impressions versus 127 (+1,252); average position 69.64 versus 71.65. Largest opportunity, but not evidence of a title defect. Existing loan/amortization guide addresses payment intent; allow discovery and recrawl before another rewrite.
- House affordability: 41 versus 669 impressions (-628). Legacy /tools/cpp-calculator/: 142 versus 1,188 (-1,046); canonical CPP page 60 versus 333. These are pre-release observations, not migration outcomes.
- Compound interest: 448 versus 619; retirement planner 281 versus 489. Monitor after release rather than inventing a cause.
- Highest query impressions: loan calculator 127 (position 62.69), personal loan calculator 104 (79.21), loan payment calculator 85 (71.04), etf fees 78 (78.99), payment calculator 71 (75.46). Zero clicks on these low-ranking terms does not establish a snippet problem.
- Positions 5–20: Ontario take-home pay 4 impressions at 5.25; car loan Canada 3 at 5; take-home pay Canada 2 at 5; other qualifying queries only one impression. Insufficient sample for CTR optimization.
- Unexpected “csp calculator” has 38 impressions at 64.55: ambiguous acronym, no justified new page. Car loan queries can be met by the generic loan calculator; no evidence for a separate page. “Home worth” intent differs from affordability, but one impression is too weak to warrant a valuation product.
- Branded “simplekit”: 3 clicks / 29 impressions, position 3.97.

## Indexing and discovery
Inspection: homepage and loan calculator indexed. Tools and Learn hubs unknown to Google. Correct loan guide /learn/loan-payments-and-amortization/ unknown; /learn/cpp-basics/ discovered but not indexed. Legacy /tools/cpp-calculator/ and core CPP guide still indexed; last crawls September 27 and August 30 predate the release. No current canonical conflict can be inferred from those stale crawls.
An initial inspection used a nonexistent /learn/loan-payment-basics/ slug; exclude that result from conclusions.
Live sitemap fetched successfully and parsed: 52 canonical URLs. Prior GSC download September 24 listed 33 submitted URLs. Resubmitted October 2 01:22 UTC, accepted and confirmed, pending download. Submission does not guarantee indexing. The old sitemap indexed=0 field is not an indexed-page census.
Cloudflare configuration review: 23 entries in simplekit_legacy_redirects; no custom zone cache or dynamic-redirect ruleset listed. Existing account Bulk Redirect configuration retained. No evidence justified another edge configuration change.
A live legacy-path HTTP probe returned 403 in this runtime; do not label this a production outage or a passed redirect test. Recheck via browser or an independent client.
Added property-scoped October 1 “SEO Phases 1–8 release” annotation.

## GA4 baseline supplied by the owner
September 3–30 (different from GSC window), all traffic:
32 active users; 30 new users; 36.8125 seconds average engagement per active user; 160 events.
Session acquisition: direct 23, Google organic 7, Bing organic 3, ChatGPT AI-assistant 2, other referral 1 (36 sessions total). First-user acquisition: direct 20, Google organic 6, Bing organic 3, ChatGPT 2, other referral 1.
Homepage: 26 views, 23 active users, bounce rate 88.89%. Debt payoff: 36 views from 2 active users, bounce 50%. All other listed pages 1–2 views. Repeated views by two users do not prove broad debt demand. Homepage bounce is a watch item, not proof the newly released design failed.
No key-event rows were provided; this does not prove no conversions occurred. City distribution alone cannot identify bots.
This snapshot's page table is not filtered to Organic Search and contains no landing-page/session engagement cross-tab. Organic landing-page engagement remains an explicit measurement gap. No fabricated organic bounce or engagement rate.
SimpleKit GA4 property 526477995 exists but is not linked in GSC Wizard. Browser sign-in attempt was stopped when the owner supplied this report; no further credentials requested.

## Next review
Initial Search Console review completed; ongoing monthly cycle remains active. Organic landing-page engagement requires a GA4 report filtered to Organic Search with landing page, sessions, engaged sessions, engagement rate, average engagement time and key events.
Review after 28 settled post-release days (October 2–29, once GSC has settled), with matching GA4 dates. Recheck sitemap processing and hub/guide inspections sooner. Prioritize loan, take-home pay and emergency-fund query clusters. Change snippets only with enough impressions at competitive positions; improve content only for demonstrated intent gaps.
No additional public title, layout or content edits are justified by this small, pre-release sample.
