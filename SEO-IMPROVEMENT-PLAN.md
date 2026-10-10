# SimpleKit SEO Improvement Plan

**Repository:** `ashleysnl/simplekit-site`  
**Site:** https://simplekit.app/  
**Created:** 2026-10-01  
**Status:** Active  
**Purpose:** Living checklist for improving SimpleKit's organic search visibility without destabilizing the calculators or rebuilding the site unnecessarily.

## Guiding principle

SimpleKit already has a solid page-level SEO foundation. The priority is to finish consolidating the site around one canonical URL architecture, then strengthen internal linking, page consistency, topical authority, trust signals, and measurement.

**Canonical architecture:** `https://simplekit.app/<tool>/`

Do not create new SEO content or architecture that reinforces the legacy calculator subdomains.

## Working rules

- Complete one task or tightly related group at a time.
- Test production behavior before marking a task complete.
- Preserve calculator functionality and existing user-facing behavior unless the task explicitly changes it.
- Prefer permanent redirects for retired URLs rather than relying on canonical tags alone.
- All internal links should point directly to final canonical URLs and should not pass through redirects.
- Keep important explanatory content crawlable in the HTML rather than dependent on JavaScript rendering.
- Use visible FAQ schema only where the same FAQ content appears on the page.
- Cite authoritative Canadian sources where a calculator depends on government rules, limits, programs, or tax policy.
- Record material SEO changes in the completion log at the bottom of this file.

---

# Phase 0 — Baseline and safeguards

**Priority:** High  
**Goal:** Preserve a measurable baseline before structural changes.

- [ ] Export or record current Google Search Console performance for the last 28 days and last 3 months.
- [ ] Record indexed-page count and any current indexing/canonical warnings.
- [x] Record top queries, pages, impressions, clicks, CTR, and average position. Initial baseline recorded in Phase 9.
- [ ] Record current GA4 organic landing-page performance.
- [x] Confirm `https://simplekit.app/sitemap.xml` is submitted in Search Console. Resubmission accepted 2026-10-02 UTC; processing remains monitored.
- [x] Confirm the sitemap currently contains only intended canonical URLs. Verified 2026-10-01 against repository sitemap: 22 calculator directory URLs plus intended site/learn pages; no legacy calculator subdomains.
- [x] Create a simple redirect test list covering every legacy SimpleKit subdomain before Phase 1 changes. The Phase 1.1 map below is the authoritative test list.

**Done when:** We have enough baseline data to compare performance after migration work.

---

# Phase 1 — Finish legacy subdomain migration

**Priority:** Critical  
**Goal:** Make `simplekit.app/<tool>/` the unambiguous home of every calculator.

Legacy calculator subdomains still exist in DNS. The site should not maintain two crawlable URL architectures for the same products.

## 1.1 Build authoritative redirect map

- [x] Inventory every historical calculator subdomain. Verified against Cloudflare DNS on 2026-10-01: 22 calculator CNAMEs plus `core` and `www`.
- [x] Map each legacy hostname to its matching canonical directory URL.
- [x] Identify any legacy URLs with no current equivalent. All 22 calculator hosts have a direct canonical calculator equivalent.
- [x] Store the final redirect map in this document.

### Authoritative redirect map — verified 2026-10-01

Cloudflare DNS and the repository sitemap were reconciled. All legacy calculator DNS records are currently proxied CNAMEs to `ashleysnl.github.io`. The canonical destinations below are present in the current sitemap.

| Legacy hostname | Canonical destination |
|---|---|
| `retirement.simplekit.app` | `https://simplekit.app/retirement-planner/` |
| `fire.simplekit.app` | `https://simplekit.app/fire-calculator/` |
| `cpp.simplekit.app` | `https://simplekit.app/cpp-calculator/` |
| `rrsptfsa.simplekit.app` | `https://simplekit.app/rrsp-vs-tfsa-calculator/` |
| `investment.simplekit.app` | `https://simplekit.app/compound-interest-calculator/` |
| `savingsgoal.simplekit.app` | `https://simplekit.app/savings-goal-calculator/` |
| `emergency.simplekit.app` | `https://simplekit.app/emergency-fund-calculator/` |
| `networth.simplekit.app` | `https://simplekit.app/net-worth-calculator/` |
| `monthlybudget.simplekit.app` | `https://simplekit.app/budget-planner/` |
| `takehomepay.simplekit.app` | `https://simplekit.app/take-home-pay-calculator/` |
| `debt.simplekit.app` | `https://simplekit.app/debt-payoff-calculator/` |
| `creditcard.simplekit.app` | `https://simplekit.app/credit-card-interest-calculator/` |
| `loan.simplekit.app` | `https://simplekit.app/loan-calculator/` |
| `houseaffordability.simplekit.app` | `https://simplekit.app/house-affordability-calculator/` |
| `rentvsbuy.simplekit.app` | `https://simplekit.app/rent-vs-buy-calculator/` |
| `mortgage.simplekit.app` | `https://simplekit.app/mortgage-paydown-vs-invest-calculator/` |
| `fees.simplekit.app` | `https://simplekit.app/investment-fee-calculator/` |
| `mortgagecalculator.simplekit.app` | `https://simplekit.app/mortgage-calculator/` |
| `taxchecklist.simplekit.app` | `https://simplekit.app/canadian-tax-checklist/` |
| `travel.simplekit.app` | `https://simplekit.app/travel-planner/` |
| `dti.simplekit.app` | `https://simplekit.app/debt-to-income-ratio-calculator/` |
| `contractorrate.simplekit.app` | `https://simplekit.app/contractor-effective-hourly-rate-calculator/` |

### Non-calculator hosts

- `core.simplekit.app` — retain for required shared assets, but handle its root separately in Phase 1.3 so it no longer behaves as a competing homepage.
- `www.simplekit.app` — verify/normalize separately to the apex site.
- `*.simplekit.app` — wildcard DNS currently points to `pixie.porkbun.com`; do not modify as part of calculator redirects without a separate review.

### Redirect implementation notes

- Cloudflare's current documentation supports zone-level Single Redirects in the `http_request_dynamic_redirect` phase.
- The calculator DNS records are already proxied through Cloudflare, satisfying the prerequisite for Cloudflare Redirect Rules.
- No zone entry-point ruleset currently exists in the dynamic redirect phase, so Phase 1.2 will create the redirect configuration rather than modifying an existing redirect ruleset.
- Use permanent redirects and preserve query strings unless testing identifies a reason not to.
- Keep each redirect one hop: legacy hostname → final canonical directory URL.


## 1.2 Implement permanent redirects

- [x] Configure server/edge redirects so each retired calculator subdomain returns a permanent redirect to its exact canonical directory page. Implemented with Cloudflare Bulk Redirects (`simplekit_legacy_redirects`) because the Free-plan Single Redirect quota is 10 rules; the Bulk Redirect list now contains all 22 mappings.
- [x] Preserve useful paths/query parameters only where doing so makes sense. Query strings are preserved; legacy path suffixes are intentionally not appended to canonical calculator destinations.
- [x] Avoid redirect chains. All configured targets point directly to final `https://simplekit.app/<tool>/` canonical URLs.
- [x] Confirm the destination returns HTTP 200. Live HTTPS checks passed 2026-10-02; see redirect verification report.
- [x] Confirm old hosts do not continue serving duplicate calculator pages at the Cloudflare configuration layer: the enabled account-level `http_request_redirect` rule evaluates the 22-host Bulk Redirect list before origin delivery.

**Validation:** Cloudflare configuration validated 2026-10-01: Bulk Redirect asynchronous update completed successfully; list contains 22 entries; all entries are status 301; the account-level `http_request_redirect` rule is enabled. An independent live HTTP header check from the available runtime timed out, so browser/external HTTP confirmation remains part of Phase 1.4 rather than being falsely recorded as passed.

## 1.3 Retire `core.simplekit.app` as a website

`core.simplekit.app` currently exposes a stale indexable homepage while also serving shared SimpleKit assets.

- [x] Preserve required shared asset URLs such as CSS/JS. The exact-root redirect excludes subpaths, so `core.css`, `core.js`, icons, and other assets remain available.
- [x] Stop the root of `core.simplekit.app` from acting as a second SimpleKit homepage. Cloudflare redirects the exact root to `https://simplekit.app/`.
- [x] Redirect the root homepage to `https://simplekit.app/` without matching asset subpaths (`subpath_matching: false`).
- [x] Verify at the routing/configuration layer that required asset paths are excluded from the root redirect. External runtime/browser smoke verification remains a separate follow-up because direct HTTP checks were unavailable.
- [x] Confirm the stale Core homepage is retired at the Cloudflare edge with a 301. Search-engine caches may continue to show the prior page until recrawl.

## 1.4 Post-migration validation

- [x] Crawl/test all legacy hosts. Live HTTPS checks passed 2026-10-02; see redirect verification report.
- [x] Confirm each legacy calculator hostname has one-hop permanent redirect behavior. Live HTTPS checks passed 2026-10-02; see redirect verification report.
- [x] Confirm no canonical directory URL redirects elsewhere. Live HTTPS checks passed 2026-10-02; see redirect verification report.
- [x] Re-submit sitemap in Search Console after migration. Accepted 2026-10-02 UTC in Phase 9.
- [ ] Monitor Search Console indexing/canonical reports for migration issues.

**2026-10-02 verification:** All 22 legacy calculator host roots returned a one-hop 301 to their expected canonical URL, preserving the test query; all 22 destinations returned HTTP 200 without another redirect. Core root also passed, and Core CSS/JS remain HTTP 200. This closes the previously blocked live verification. [Full redirect report](docs/seo/redirect-verification-2026-10-02.md).

**Phase 1 done when:** Every retired calculator subdomain resolves cleanly to one canonical SimpleKit directory URL and `core.simplekit.app` no longer functions as a competing homepage.

---

# Phase 2 — Normalize internal links

**Priority:** Critical  
**Goal:** Ensure SimpleKit itself consistently reinforces the canonical architecture.

- [x] Audit `simplekit-site` production pages for SimpleKit URL references. Homepage, Tools, Learn, About, and Support use canonical `https://simplekit.app/.../` URLs; no legacy calculator-subdomain navigation links were found.
- [x] Audit all 22 calculator repositories. Because GitHub code search is not indexed for these repos, production `index.html` files and relevant JavaScript/navigation link files were read directly.
- [x] Replace legacy calculator-subdomain links with canonical `https://simplekit.app/<tool>/` links. No production navigation replacements were required: current calculator pages already use canonical URLs.
- [x] Preserve `core.simplekit.app` references only where genuinely required for shared assets. Current calculator pages use it for shared `core.css` / `core.js` (and preconnect), not calculator navigation.
- [x] Review navigation links. Shared `SimpleKit-Core/core.js` navigation points to canonical apex/path URLs.
- [x] Review footer links. Shared footer links point to canonical apex/path URLs.
- [x] Review related-tool links across all 22 calculator production pages; current links point directly to canonical tool paths.
- [x] Review calculator explanatory/educational link sections represented in production pages; current tool-to-tool links point directly to canonical paths.
- [x] Review structured-data URLs in production calculator entry pages; the audited URLs use canonical `simplekit.app/<tool>/` destinations.
- [x] Review Open Graph/Twitter URL references in production entry pages; audited page URLs/images use the canonical site rather than legacy calculator hosts.
- [x] Confirm there are no production internal navigation links intentionally routing users through a legacy calculator redirect.

**Intentional compatibility exception:** `SimpleKitHouseAffordability/assets/js/app.js` retains the string `"mortgage.simplekit.app"` as a lookup alias only. It is not an outbound URL; it resolves directly to `https://simplekit.app/mortgage-paydown-vs-invest-calculator/`. Keep it unless backward-compatibility requirements change.

**Phase 2 done:** The current production entry pages, shared navigation layer, hub pages, and relevant application link maps contain no unintended legacy calculator-subdomain navigation links. One legacy hostname token remains intentionally as a compatibility alias and resolves to a canonical URL.

---

# Phase 3 — Standardize calculator-page SEO

**Priority:** High  
**Goal:** Bring older calculator pages up to the quality of the strongest newer SimpleKit pages.

Use the strongest current pages, particularly the newer content-rich calculators, as the implementation pattern.

For every calculator verify:

- [ ] Unique, concise `<title>`.
- [ ] Unique meta description aligned to actual page intent.
- [ ] Self-referencing canonical URL.
- [ ] One clear H1.
- [ ] Logical H2/H3 hierarchy.
- [ ] Open Graph title, description, URL, and image where appropriate.
- [ ] Twitter metadata where appropriate.
- [ ] Crawlable introductory explanation.
- [ ] Crawlable methodology/assumptions section where useful.
- [ ] Useful explanation of results.
- [ ] Visible FAQ section where search intent warrants it.
- [ ] Related-tools section using canonical links.
- [ ] No important SEO copy exists only after JavaScript interaction.
- [ ] Mobile layout does not hide essential explanatory content.

## 3.1 Standardize structured data

Adopt one consistent baseline where appropriate:

- [ ] `WebApplication`
- [ ] canonical `url`
- [ ] `name`
- [ ] `description`
- [ ] `applicationCategory`
- [ ] `isAccessibleForFree`
- [ ] `inLanguage`
- [ ] SimpleKit/Organization publisher identity
- [ ] `FAQPage` only when corresponding visible FAQ content exists

Do not add schema solely to maximize the number of schema types.

## 3.2 Page-by-page audit tracker

Initial repository audit completed 2026-10-01. This matrix is based on the current production `index.html` in each calculator repository plus the relevant shared/internal link files. "Yes" means the baseline signal is present in the current page source; "Gap" means the page should be reviewed or normalized in this phase. Source requirements are intentionally stricter for calculators that depend on Canadian government/tax/mortgage program rules.

| Tool | Title/meta | Canonical | H1 | Static explanatory copy / methodology | Visible FAQ | FAQ schema | WebApplication | Related canonical links | Primary sources | Initial priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Retirement Planner | Yes | Yes | Yes | Yes | Gap | — | Gap | Yes | Yes | Medium |
| FIRE Calculator | Yes | Yes | Yes | Yes | Gap | — | Gap | Yes | Gap | Medium |
| CPP Calculator | Yes | Yes | Yes | Yes | Yes | Yes | Gap | Yes | Yes | Medium |
| RRSP vs TFSA | Yes | Yes | Yes | Yes | Yes | Yes | Gap | Yes | Gap | High |
| Compound Interest | Yes | Yes | Yes | Yes | Yes | Yes | Gap | Yes | N/A / optional | Medium |
| Savings Goal | Yes | Yes | Yes | Yes | Yes | Gap | Gap | Yes | N/A / optional | Medium |
| Emergency Fund | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A / optional | Low |
| Net Worth | Yes | Yes | Yes | Yes | Yes | Yes | Gap | Yes | Yes | Medium |
| Budget Planner | Yes | Yes | Yes | Yes | Yes | Yes | Gap | Yes | N/A / optional | Medium |
| Take-Home Pay | Yes | Yes | Yes | Yes | Yes | Gap | Yes | Yes | Gap | **High** |
| Debt Payoff | Yes | Yes | Yes | Gap | Yes | Yes | Gap | Yes | N/A / optional | Medium |
| Credit Card Interest | Yes | Yes | Yes | Yes | Yes | Gap | Gap | Yes | N/A / optional | Medium |
| Loan Calculator | Yes | Yes | Yes | Yes | Yes | Gap | Gap | Yes | N/A / optional | Medium |
| House Affordability | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Low |
| Rent vs Buy | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Gap | Medium |
| Mortgage Paydown vs Invest | Yes | Yes | Yes | Yes | Yes | Gap | Gap | Yes | Gap | High |
| Investment Fee | Yes | Yes | Yes | Yes | Yes | Gap | Gap | Yes | N/A / optional | Medium |
| Mortgage Calculator | Yes | Yes | Yes | Yes | Yes | Yes | Gap | Yes | Gap | **High** |
| Canadian Tax Checklist | Yes | Yes | Yes | Gap | Yes | Gap | Gap | Yes | Yes | Medium |
| Travel Planner | Yes | Yes | Yes | Gap | Gap | — | Gap | Gap | N/A | Medium |
| Debt-to-Income Ratio | Yes | Yes | Yes | Yes | Yes | Gap | Gap | Yes | Gap | **High** |
| Contractor Rate | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A / optional | Low |

### Initial Phase 3 findings

- **Strong universal foundation:** 22/22 audited pages have a unique title, meta description, self-referencing canonical, one H1, and Open Graph/Twitter metadata.
- **Canonical linking is already strong:** Phase 2 confirmed production tool-to-tool links point directly to canonical `simplekit.app/<tool>/` URLs.
- **Structured data is inconsistent:** only a subset currently declares `WebApplication`; several pages with visible FAQ content do not declare matching `FAQPage` schema.
- **Source coverage is the more important content gap:** calculators whose outputs depend materially on Canadian tax/payroll/mortgage/registered-account rules should cite the relevant primary Canadian source in visible page content.
- **Do not add citations merely for appearance:** generic arithmetic tools such as savings goals, budgeting, debt payoff, and investment growth do not need government citations unless a rule-based claim is made.
- **Highest-priority normalization group:** Take-Home Pay, Mortgage Calculator, Debt-to-Income Ratio, RRSP vs TFSA, and Mortgage Paydown vs Invest. These combine meaningful Canadian/rule-based assumptions with missing or incomplete source/schema normalization.
- **Strong reference implementations:** House Affordability, Emergency Fund, Rent vs Buy, and Contractor Rate currently cover most of the baseline and should be used as implementation references where their patterns are semantically appropriate.

### Phase 3 execution order

1. Normalize the five high-priority rule-sensitive pages first.
2. Standardize the baseline `WebApplication` structured data across calculator pages where appropriate.
3. Add `FAQPage` only to pages that already expose the corresponding FAQ visibly.
4. Improve methodology/static explanation only on pages with a real content gap; do not pad pages with SEO filler.
5. Re-audit the matrix after each batch and mark individual tools complete only after the repository source passes the baseline.

Create a complete 22-tool matrix before closing this phase. Suggested columns:

| Tool | Title | Description | Canonical | H1 | Static copy | Methodology | FAQ | Schema | Related links | Sources | Complete |
|---|---|---|---|---|---|---|---|---|---|---|---|

- [x] Populate initial 22-tool matrix from current production repository source.
- [x] Fix highest-opportunity/weakest pages first. Batch 1 completed 2026-10-01: Take-Home Pay, Mortgage Calculator, Debt-to-Income Ratio, RRSP vs TFSA, and Mortgage Paydown vs Invest now include visible official Canadian primary-source references; application schema was normalized to `WebApplication` where needed. Calculator logic was not changed.
- [x] Re-audit every row after changes. Final audit completed 2026-10-01 against current `main` for all 22 calculator repositories.
- [x] Batch 2 schema normalization completed 2026-10-01 across all 13 medium-priority pages: all now use `WebApplication`; matching `FAQPage` schema was added only where visible FAQ content already existed. No calculator logic or visible copy changed.
- [x] Final audit completed 2026-10-01. All 22 production calculators now have one self-referencing canonical, one H1, and `WebApplication` schema; no audited page retains `SoftwareApplication`. Every page has related canonical tool links. Every page with a genuine visible FAQ now has matching `FAQPage` schema; Retirement Planner and Travel Planner intentionally have neither visible FAQ nor FAQ schema. Final gaps on Take-Home Pay, DTI, and Mortgage Paydown vs Invest were fixed using only their existing visible FAQ text. Rule-sensitive Canadian pages retain primary-source coverage where applicable. No calculator logic was changed.

### Final Phase 3 audit outcome — 2026-10-01

- **22/22:** title/meta baseline, self-referencing canonical, one H1, `WebApplication`, and related canonical tool links.
- **20/20 pages with visible FAQ:** matching `FAQPage` structured data.
- **2 pages without visible FAQ:** Retirement Planner and Travel Planner; no FAQ schema added by design.
- **0/22:** remaining `SoftwareApplication` schema.
- **Rule-sensitive Canadian calculators:** primary-source references retained/added where the output depends materially on tax, payroll, registered-account, mortgage, or government-program rules.
- **Generic arithmetic/planning tools:** government citations remain optional and were not added merely to fill the matrix.
- **Phase 3 status:** **COMPLETE**.

**Phase 3 done when:** Every production calculator meets the agreed baseline and the matrix is complete.

---

# Phase 4 — Refocus homepage and hub metadata

**Priority:** High  
**Goal:** Let hub pages describe SimpleKit broadly while individual calculators own specific long-tail queries.

## Homepage

- [x] Shorten and refocus homepage title.
- [x] Shorten meta description.
- [x] Keep primary positioning Canadian where appropriate.
- [x] Avoid keyword-list style metadata.
- [x] Ensure H1 communicates the product benefit rather than duplicating the title.

Final title:

> Free Financial Calculators & Planning Tools for Canadians | SimpleKit

Final description:

> Free Canadian calculators for retirement, budgeting, mortgages, debt, investing, taxes, and everyday money decisions. No signup required.

The homepage now owns the broad SimpleKit value proposition rather than enumerating individual calculator keywords.

## Tools hub

- [x] Give `/tools/` a distinct title/H1/description focused on calculator discovery.
- [x] Keep useful category copy around the existing grouped tool catalogue.
- [x] Organize tools into clear goal-based groups.
- [x] Add contextual links into relevant Learn guides.

The Tools hub now owns **browse/discovery intent**: users choose a financial goal and then the matching calculator.

## Learn hub

- [x] Give `/learn/` a distinct educational search purpose.
- [x] Organize the six existing guides into topic clusters.
- [x] Add direct guide-to-calculator next steps so tool links are contextual rather than decorative.

The Learn hub now owns **education intent**: understand a concept first, then move into the corresponding calculator or planner.

**Validation — 2026-10-01:** All three hubs retain exactly one self-referencing canonical and one H1; titles/descriptions are distinct; no legacy calculator-subdomain links were introduced. Homepage description is 137 characters, Tools 157, Learn 142. Existing 22-tool catalogue and six-guide inventory were preserved.

**Phase 4 status:** **COMPLETE**.

---

# Phase 5 — Trust, authorship, methodology, and sources

**Priority:** High  
**Goal:** Make it easy for users and search engines to understand who maintains SimpleKit, how calculations are built, and where rule-based inputs come from.

## Site-level trust

- [x] Strengthen About page with transparent maintainer information.
- [x] State that SimpleKit is built and maintained by Ashley Skinner.
- [x] State Canada-based context where relevant.
- [x] Explain SimpleKit's calculation-development philosophy.
- [x] Explain update/maintenance approach.
- [x] Provide a corrections/contact path.
- [x] Link privacy information clearly.
- [x] Explain browser/local processing without claiming that the site has no analytics.
- [x] Avoid unsupported expertise or authority claims.

Implemented through the About, Support, Privacy, Methodology & Sources, and homepage trust sections. SimpleKit is described as an independent Canadian project and explicitly not a bank, government service, accounting firm, or financial-advice practice.

## Calculator methodology

For calculators involving assumptions or regulated values:

- [x] Confirm important formulas/assumptions are exposed in the regulated-value calculators audited in Phase 5.
- [x] Confirm material defaults/assumptions are surfaced where they materially affect results.
- [x] Distinguish planning estimates from official determinations at the site level and on audited regulated-value calculators.
- [x] Establish a maintenance policy for rule-based values and direct users to primary sources for current regulated values.

Phase 5 audit sampled CPP, RRSP-vs-TFSA, House Affordability, Mortgage, Take-Home Pay, and Retirement. Existing pages already expose methodology/assumption language to varying degrees; CPP already links directly to Canada.ca and House Affordability already links directly to CMHC. Rather than inventing a universal "last reviewed" date that the repositories cannot substantiate, the new methodology page explains the review policy and treats the linked primary source as authoritative for current regulated values.

## Authoritative citations

- [x] CPP/OAS source policy → Government of Canada / Service Canada.
- [x] Federal tax and registered-account source policy → CRA / Canada.ca.
- [x] Mortgage/insured-mortgage source policy → Government of Canada / CMHC / OSFI.
- [x] Other regulated calculations → primary regulator/government source policy.

Created `/methodology/` with direct primary-source references for CPP, RRSP, TFSA, mortgage down-payment/debt-service guidance, and OSFI's uninsured-mortgage minimum qualifying rate. Existing calculator-specific primary links are retained. Future rule-based calculator changes should link the exact primary source beside the relevant methodology/assumption rather than relying on finance-blog summaries.

## Privacy and corrections

- [x] Create `/privacy/` because no privacy page existed in the repository at the start of Phase 5.
- [x] State that no account is required for public calculators.
- [x] Describe browser-based calculation/local-storage behavior conservatively.
- [x] Disclose Google Analytics usage rather than claiming the site is telemetry-free.
- [x] Tell users not to enter unnecessary sensitive identifiers.
- [x] Add a reproducible correction path through the SimpleKit GitHub issue tracker.
- [x] Add Methodology and Privacy URLs to the sitemap.

**Validation — 2026-10-01:** About identifies the maintainer and project context; Methodology documents the estimate/source/maintenance policy and links Canadian primary authorities; Privacy accurately acknowledges the existing GA tag; Support provides a correction route; homepage surfaces the trust layer; both new pages are canonical/indexable and included in the sitemap. No unsupported professional credential or authority claim was added.

**Phase 5 status:** **COMPLETE**.

---

# Phase 6 — Build topical authority

**Priority:** Medium-High  
**Goal:** Grow SimpleKit from a collection of calculators into a connected financial-planning resource without mass-producing thin articles.

## 6.1 Housing cluster

- [x] Mortgage affordability in Canada.
- [x] Rent vs. buy in Canada.
- [x] Mortgage payment vs. total cost of home ownership.
- [x] Pay down the mortgage or invest.
- [x] Connect the cluster to House Affordability, Rent vs Buy, Mortgage, DTI, and Mortgage Paydown vs Invest tools.

The housing cluster deliberately consolidates overlapping intents instead of creating separate thin pages for "mortgage affordability" and "how much house can I afford." Accelerated-payment mechanics are covered inside the total-cost guide and the Mortgage Calculator's existing educational content rather than duplicated as a standalone article.

## 6.2 Retirement cluster

- [x] Preserve and connect Retirement Planning Basics, CPP Basics, FIRE Explained, RRSP vs TFSA Basics, and Understanding Net Worth.
- [x] Connect retirement education to Retirement Planner, CPP, FIRE, RRSP/TFSA, Net Worth, compound growth, and savings pathways.
- [x] Keep future expansion query-led rather than inventing articles without Search Console evidence.

## 6.3 Budgeting and cash-flow cluster

- [x] Monthly budgeting and household cash-flow methodology.
- [x] Emergency funds and savings goals.
- [x] Connect take-home pay, budget, emergency-fund, and savings-goal concepts.

## 6.4 Debt and credit cluster

- [x] Debt snowball vs. avalanche payoff methods.
- [x] Credit-card interest and payoff education.
- [x] Loan payment and amortization education.
- [x] Connect debt education to the existing DTI and budgeting pathways.

## 6.5 Investing cluster

- [x] Compound interest and investment fees.
- [x] RRSP vs. TFSA.
- [x] Mortgage prepayment vs. investing.
- [x] Connect investing guides to compound-interest, investment-fee, RRSP/TFSA, retirement, and mortgage-vs-invest tools.

## Content standard

Every new guide has:

- [x] A single clear search intent.
- [x] Unique title/meta/H1.
- [x] Useful original explanation.
- [x] Semantic headings.
- [x] Relevant primary sources where factual regulated rules are discussed.
- [x] Contextual links to calculators.
- [x] Contextual links to related guides.
- [x] Representative links from calculators back to supporting Learn content in each major cluster.
- [x] No filler written merely to increase word count.

## Phase 6 implementation — 2026-10-01

Added 10 guides, taking SimpleKit Learn from 6 to **16 substantive guides**:

**Housing**
- `/learn/mortgage-affordability-canada/`
- `/learn/rent-vs-buy-canada/`
- `/learn/mortgage-costs-beyond-the-payment/`
- `/learn/mortgage-prepayment-vs-investing/`

**Budget / cash flow**
- `/learn/monthly-budgeting-and-cash-flow/`
- `/learn/emergency-fund-and-savings-goals/`

**Debt / credit**
- `/learn/debt-snowball-vs-avalanche/`
- `/learn/credit-card-interest-and-payoff/`
- `/learn/loan-payments-and-amortization/`

**Investing**
- `/learn/compound-interest-and-investment-fees/`

The Learn hub now exposes five financial topic clusters plus everyday planning. All 10 new pages are canonical/indexable, have one H1, semantic sections, calculator links, related-guide links, and no legacy calculator-subdomain URLs. The regulated mortgage-affordability/prepayment content links directly to CMHC, OSFI, and Canada.ca sources. All 10 new URLs were added to the sitemap.

Representative calculator-to-guide links were added in each major cluster (including Retirement, Savings, Mortgage, Budget, Debt Payoff, and Compound Interest) without forcing a new education panel into every calculator.

**Phase 6 status:** **COMPLETE**.

---

# Phase 7 — Sitemap, indexing, and crawl hygiene

**Priority:** Medium  
**Goal:** Keep discovery signals clean as the site grows.

- [x] Keep `robots.txt` simple unless a real crawl-control need emerges.
- [x] Keep sitemap limited to canonical, indexable URLs.
- [x] Do not add `lastmod` until it can accurately reflect meaningful page changes.
- [x] Remove retired/noncanonical URLs from sitemap.
- [x] Check for accidental `noindex`.
- [x] Check for canonical mismatches.
- [x] Check for 404 / soft-404 risk in the published architecture.
- [x] Check legacy-host redirect configuration for chains.
- [x] Check for orphan pages.
- [x] Check that important pages are reachable through normal HTML links.
- [ ] Periodically inspect Search Console's indexed/not-indexed reports.

## Phase 7 audit and cleanup — 2026-10-01

### Robots and sitemap

`robots.txt` remains intentionally minimal: allow crawling and advertise `https://simplekit.app/sitemap.xml`. No unnecessary crawl blocks were introduced.

The sitemap describes the current canonical architecture: homepage/hubs/trust pages, 16 Learn guides, 22 primary calculators/planners, plus seven unique retirement resources that were already self-canonical and linked from the Retirement Planner. Those seven retirement resources were added to the sitemap during Phase 7.

No synthetic `lastmod` dates were added. The repository does not currently maintain reliable per-page meaningful-change dates, so adding them would create false freshness signals.

### Duplicate `/tools/<calculator>/` pages

The audit found 13 older calculator pages under `/tools/<calculator>/` that were still published as indexable, self-canonical pages even though the canonical calculator architecture is now root-level (for example, `/budget-planner/`).

Phase 7 retires those duplicate pages by:
- setting `noindex,follow`,
- pointing their canonical tags to the root-level calculator,
- adding immediate client-side fallback redirects to the canonical destination.

They remain outside the sitemap. On 2026-10-02, Cloudflare permanent redirects were added for all 13 retired calculator paths with and without trailing slashes. All 26 variants passed live one-hop 301 checks with query preservation and HTTP 200 destinations. Repository fallbacks remain as a secondary safeguard.

### Redirect hygiene

Cloudflare was re-audited. The active `simplekit_legacy_redirects` redirect list contains the 22 retired calculator subdomains plus the `core.simplekit.app/` root retirement rule. Calculator-host rules use 301 status codes and point directly to the current root-level canonical calculator URLs. The list is active through the account-level redirect phase.

### Orphans and discovery

The 16 Learn guides are exposed through the Learn hub and cross-linked by cluster. Representative calculators link back to Learn content. The seven retirement resources are linked from the Retirement Planner and now included in the sitemap. Primary calculators are exposed through the Tools/Home architecture.

### Validation limits

Repository and Cloudflare configuration were verified directly. Public HTTP spot checks through the available web fetcher were partially limited by cache/fetch failures, so Search Console coverage/indexing remains an ongoing measurement task rather than a one-time code-completion condition.

**Phase 7 status:** **COMPLETE** for site/configuration hygiene. Search Console indexed/not-indexed monitoring remains an ongoing operational task.

---

# Phase 8 — Performance and user experience

**Priority:** Medium  
**Goal:** Improve search landing-page usefulness without compromising calculator functionality.

- [ ] Measure Core Web Vitals on representative calculator pages. The public PageSpeed Insights endpoint returned HTTP 429 because its available daily quota is zero; no CWV score is claimed.
- [x] Improve responsive navigation and touch targets in the marketing site and shared calculator shell. Mobile styles use a three-column navigation grid with 44px minimum link targets.
- [x] Minimize layout shift and rendering work. Removed the landing-page entrance transform and large backdrop blur; simplified the page background. The shared floating support control no longer uses backdrop blur.
- [x] Keep primary calculator use quick. After release, `/`, `/tools/`, and `/retirement-planner/` returned HTTP 200. No calculator form, script, or calculation logic was changed.
- [x] Audit shared asset weight and caching. Live `core.css` is 7,500 bytes and `core.js` is 15,122 bytes; homepage `assets/site.css` is 11,728 bytes. Core CSS and JS responses use `max-age=14400`, HTML uses `max-age=600`. Cloudflare has no cache-settings entrypoint ruleset, so the existing four-hour TTL was retained for mutable, unversioned URLs.
- [x] Check for oversized images/assets on the landing experience. The homepage and Tools hub do not load raster images in the page body; the 69,513-byte Open Graph image is metadata-only and was left unchanged.
- [x] Keep explanatory SEO copy from pushing calculator controls down. No calculator page copy or layout was changed.
- [x] Make tool discovery and next steps clearer. The homepage offers a direct “Choose a tool” path, the Tools page begins with the visitor’s question, and the featured planner uses one action instead of two duplicate links. Calculator forms and result areas remain unchanged.
- [ ] Review GA4 engagement after major page changes once a complete post-release reporting window is available.

**Phase 8 implementation status:** **COMPLETE** on 2026-10-02. The live homepage, Tools hub, representative planner route, and shared Core assets were checked after release. Core Web Vitals and GA4 engagement remain measurement follow-ups: the public PageSpeed Insights API returned HTTP 429 because its daily quota is zero, and a complete post-change GA4 reporting window is not yet available. No passing metrics are claimed.

**Phase 8 done when:** SEO improvements do not come at the expense of the site's core calculator experience.

---

# Phase 9 — Search Console feedback loop

**Priority:** Ongoing  
**Goal:** Let actual search demand guide later optimization.

**Initial cycle:** Search Console review completed; GA4 acquisition/general engagement baseline recorded. Organic landing-page engagement remains open. See [Phase 9 baseline](docs/seo/phase-9-baseline-2026-10-01.md). The latest GSC data predates the October 1 release; next full review should use 28 settled post-release days. Published 52-URL sitemap resubmission accepted October 2 UTC; Google downloaded it at 01:55:46 UTC and reported 52 submitted URLs, zero errors and zero warnings. Release annotation added in GSC Wizard. No further public copy/UX changes justified by this small baseline.

Review monthly initially:

- [x] Queries with high impressions and low CTR. Initial review completed 2026-10-01; repeat monthly.
- [x] Queries ranking approximately positions 5–20. Initial review completed 2026-10-01; repeat monthly.
- [x] Pages gaining or losing impressions. Initial review completed 2026-10-01; repeat monthly.
- [x] Unexpected queries that reveal missing content. Initial review completed 2026-10-01; repeat monthly.
- [x] Canonical/indexing warnings. Initial review completed 2026-10-01; repeat monthly.
- [x] New pages that remain undiscovered or unindexed. Initial review completed 2026-10-01; repeat monthly.
- [ ] Organic landing-page engagement in GA4. Owner-supplied September 3–30 snapshot reviewed; organic acquisition measured (10 sessions), but page engagement is all-traffic, so the organic landing-page breakdown remains open.

For promising queries:

1. Determine whether the existing page actually satisfies the intent.
2. Improve title/description only when CTR is the problem.
3. Improve content when relevance/completeness is the problem.
4. Improve internal linking when discovery/context is weak.
5. Create a new page only when the query represents a genuinely different intent.

Avoid changing pages repeatedly before enough data accumulates to judge the previous change.

---

# Phase 10 — AI/search discoverability

**Priority:** Ongoing / secondary  
**Goal:** Make SimpleKit easy for conventional search engines and AI-powered search systems to understand and cite.

This phase should build on good web fundamentals rather than special AI-only tricks.

**Initial audit complete:** homepage identity markup, About template alignment, primary citations on CPP/RRSP-TFSA guides, and all 16 guide introductions/headings/tool links reviewed. [Audit report](docs/seo/phase-10-discoverability-2026-10-02.md). Regulated-value verification and earning independent references remain ongoing.

- [x] Maintain clear entity/about information. Initial audit completed 2026-10-02; retain during future updates.
- [x] Use descriptive headings and direct answers. Initial audit completed 2026-10-02; retain during future updates.
- [x] Keep methodology and assumptions explicit. Initial audit completed 2026-10-02; retain during future updates.
- [x] Cite primary sources. Initial audit completed 2026-10-02; retain during future updates.
- [x] Keep important facts in crawlable HTML. Initial audit completed 2026-10-02; retain during future updates.
- [x] Maintain consistent naming for SimpleKit and its calculators. Initial audit completed 2026-10-02; retain during future updates.
- [x] Use structured data accurately. Initial audit completed 2026-10-02; retain during future updates.
- [ ] Keep content current, especially regulated Canadian financial values.
- [ ] Earn legitimate references/links through useful calculators and original resources.

---

# Items that are NOT current priorities

Do not spend significant time on these unless evidence identifies a real problem:

- Repeatedly tweaking `robots.txt`.
- Adding large numbers of schema types.
- Keyword stuffing.
- Creating hundreds of thin AI-generated articles.
- Rebuilding working calculators purely for SEO.
- Changing URLs that are already clean and canonical.
- Buying backlinks.
- Duplicating calculator pages for minor keyword variations.

---

# Recommended execution order

1. **Phase 0:** Baseline.
2. **Phase 1:** Legacy subdomain redirects + `core.simplekit.app`.
3. **Phase 2:** Internal-link normalization.
4. **Phase 3:** 22-tool SEO normalization.
5. **Phase 4:** Homepage/Tools/Learn positioning.
6. **Phase 5:** Trust, methodology, and authoritative sources.
7. **Phase 6:** Topic clusters.
8. **Phase 7:** Crawl/indexing hygiene.
9. **Phase 8:** Performance/UX.
10. **Phases 9–10:** Continuous measurement and discoverability.

The first three phases should be treated as cleanup of the existing architecture. Content expansion should follow, not precede, that cleanup.

---

# Completion log

Use this section to record material work so future audits can distinguish planned work from completed work.

| Date | Phase / Task | Change | Validation | Commit / PR |
|---|---|---|---|---|
| 2026-10-10 | V2 Phase 9 — preview only | Add page-level SEO/resource/image integrity validation; prepare owner-selected V2 share image and repair generated share-image URLs without editing pinned calculators or production inputs. | Local 36 tests, build/SEO/output/preservation, 53 indexed URLs, 66 route checks and no-JS discovery pass; hosted evidence in [V2 Phase 9 report](docs/v2/phase-09-verification.md). Existing optional social gaps/stale retirement guide fragments documented upstream. No production indexing/metrics checklist completed by this work. | PR #13 targeting `develop-v2`, unmerged |
| 2026-10-01 | Plan created | Added repository SEO improvement plan based on initial GitHub, live-site, and Cloudflare audit. | Plan committed to repository. | `987c573` |
| 2026-10-01 | Phase 0 / 1.1 | Reconciled Cloudflare DNS with sitemap; built authoritative 22-host redirect map. | 22 legacy calculator hosts map 1:1 to 22 canonical calculator URLs. | `ea94454` |
| 2026-10-01 | Phase 1.2 | Reconciled existing Cloudflare Bulk Redirect configuration, verified 20 existing mappings, and added missing `taxchecklist` and `contractorrate` mappings. | Bulk operation completed; list now has 22 calculator entries, all 301 with query preservation; enabled account redirect rule references the list. Independent runtime HTTP check timed out, so external/browser validation remains in Phase 1.4. | Cloudflare config |
| 2026-10-01 | Phase 1.3 | Retired the stale `core.simplekit.app` homepage at the edge while preserving shared asset paths. | Added exact-root 301 `core.simplekit.app/` → `https://simplekit.app/` with `subpath_matching: false`; `core.css`/`core.js` remain outside the redirect match. Search cache may show the previously crawled page pending recrawl. | Cloudflare config |
| 2026-10-01 | Phase 1.4 | Audited the completed Cloudflare redirect set against the authoritative migration map. | 22/22 calculator mappings exist exactly once, all status 301 with direct canonical targets and query preservation; Core root is 301 with subpath matching disabled; account redirect rule is enabled. Independent runtime HTTP requests timed out/inconsistently resolved, so destination no-chain/browser smoke check remains open. | Cloudflare config |
| 2026-10-01 | Phase 2 | Audited `simplekit-site`, all 22 calculator production entry pages, shared `SimpleKit-Core/core.js`, and relevant calculator JS link maps. | No production internal navigation links use legacy calculator subdomains. `core.simplekit.app` is limited to shared asset references. One `mortgage.simplekit.app` token remains intentionally as a compatibility alias and maps directly to the canonical path. | tracker-only; no production code change required |
| 2026-10-01 | Phase 3.2 | Built the initial 22-tool SEO matrix from current production repository source and prioritized normalization work. | 22/22 have title/meta/canonical/H1/social baseline. Main gaps are structured-data consistency, source coverage on rule-sensitive Canadian calculators, and a small number of methodology/related-link gaps. | tracker update |
| 2026-10-01 | Phase 3 Batch 1 | Improved Take-Home Pay, Mortgage, DTI, RRSP vs TFSA, and Mortgage Paydown vs Invest. Added visible CRA/CMHC/OSFI/FCAC primary-source references and normalized application schema where needed; no calculator JS/calculation logic changed. | All five changes reviewed as one-file `index.html` diffs and merged through PRs. Merge commits: Take-Home Pay `f02af48`; Mortgage `92cf246`; DTI `ce62748`; RRSP/TFSA `ef07a5e`; Mortgage vs Invest `59aea61`. | five calculator repos |
| 2026-10-01 | Phase 3 Batch 2 | Normalized structured data across the 13 medium-priority tools. All now declare `WebApplication`; FIRE, Savings Goal, Credit Card, Loan, Investment Fee, and Tax Checklist received `FAQPage` markup copied from their existing visible FAQ content. Pages without a visible FAQ did not receive FAQ schema. | Branch audit confirmed 13/13 have one canonical, one H1, `WebApplication`, and no remaining `SoftwareApplication`; all changes were limited to `index.html` structured data and merged through PRs. Merge commits: Retirement `77babb4`; FIRE `e44404c`; CPP `e2f14e9`; Compound `cd7ec0d`; Savings `0f4a7e4`; Net Worth `55ede2d`; Budget `35a6c68`; Debt `c36650f`; Credit Card `2b75e7a`; Loan `bda0374`; Fees `470270f`; Tax Checklist `ebe6150`; Travel `dc5b680`. | 13 calculator repos |
| 2026-10-01 | Phase 3 Final Audit | Re-audited all 22 production calculators and closed the last FAQ-schema gaps on Take-Home Pay, DTI, and Mortgage Paydown vs Invest using their existing visible FAQ content. | Post-merge audit: 22/22 one canonical, one H1, `WebApplication`, related canonical links; 20/20 pages with visible FAQ have `FAQPage`; Retirement and Travel intentionally have no FAQ/schema; 0 `SoftwareApplication` remain. Merge commits: Take-Home Pay `78d539f`; DTI `d3c05a1`; Mortgage vs Invest `7e7198d`. Phase 3 complete. | three calculator repos + tracker |
| 2026-10-01 | Phase 4 | Refocused homepage, Tools, and Learn around separate search intents: broad Canadian planning proposition, calculator discovery by goal, and plain-English education. Added contextual Tools-to-Learn links and guide-to-calculator next steps. | All three hubs have distinct metadata, one canonical, one H1, no legacy calculator-subdomain links; existing 22-tool catalogue and six-guide inventory preserved. | `simplekit-site` Phase 4 PR |
| 2026-10-02 | Phase 8 | Clarified the homepage entry paths and trust language, simplified the Tools hub, added mobile navigation targets, and reduced nonessential motion/blur in both shells. | `npm run seo:validate` passed. After release, homepage, Tools hub, and Retirement Planner returned HTTP 200; Core CSS/JS returned HTTP 200 at 7,500/15,122 bytes. Cloudflare purged only the changed HTML/CSS URLs. PageSpeed Insights returned 429 (daily quota 0); no CWV score is claimed. No calculator form or calculation logic changed. | `simplekit-site` (`0731235`, `0a09032`, `4a60ce8`, `8783e30`, `cd6aafe`, `8010757`, `6f668e1`) + `SimpleKit-Core` (`cb1da347`) |

---

# Next task

**Next: Close organic landing-page engagement and Core Web Vitals measurement gaps, then maintain the completed initial Phase 10 improvements. Sitemap processing is verified; hub/guide indexing remains monitored (recheck around October 9). Phase 9 continues monthly; use 28 settled post-release days before further query-led changes.**


### 2026-10-01 — Phase 9 initial review

- Recorded settled September 2–29 Search Console baseline and prior 28-day comparison: 7 clicks, 3,910 impressions, 0.179% CTR, average position 66.65.
- Reviewed all 1,102 available queries, page gains/losses, and selected URL inspections; new hubs/guides need discovery/recrawl.
- Resubmitted live 52-URL sitemap, accepted pending download; annotated October 1 SEO/UX release.
- Reviewed owner-provided September 3–30 GA4 snapshot: 32 active users, 10 organic sessions. Organic landing-page engagement remains unmeasured.
- Reviewed Cloudflare configuration; retained existing redirects. Recorded evidence and next-review criteria in docs/seo/phase-9-baseline-2026-10-01.md.


### 2026-10-02 — Redirect verification and retired path cleanup

- Added 26 exact Cloudflare Bulk Redirect entries for the 13 retired `/tools/<calculator>/` paths, covering trailing-slash and no-slash forms with query preservation.
- Live checks passed 49/49: 22 retired calculator host roots, 26 old path variants, and Core root. Each returned 301 directly to the expected HTTP 200 canonical destination.
- Core CSS/JS and the Tools hub separately returned HTTP 200 without redirects.
- Saved full verification evidence and redirect map under `docs/seo/redirect-verification-2026-10-02.*`.
- Reconciled completed baseline/sitemap tasks and replaced the stale Next task footer. Google recrawl, organic landing-page engagement, CWV and the three-month baseline remain open where not measured.


### 2026-10-02 — Sitemap processing and hub/guide discovery verification

- Google downloaded the expanded sitemap at 01:55:46 UTC: 52 submitted URLs, pending false, zero errors and zero warnings.
- Inspected both hubs and all 16 guides: 1 indexed, 7 discovered/currently not indexed, 10 unknown. Tools and the loan guide now show discovered status; the debt snowball/avalanche guide is indexed.
- Live 18/18 checks passed HTTP 200, self-canonical, one H1 and no HTML robots noindex. Learn links to all 16 guides through normal HTML links.
- Bulk inspection response timed out; recovered all 18 fresh results from persisted history. No inspections remain missing.
- Saved report/evidence in [discovery verification](docs/seo/discovery-verification-2026-10-02.md). No new public code changes were justified. Recheck unresolved indexing around October 9; organic landing engagement and CWV remain open.


### 2026-10-02 — Performance and organic engagement measurement attempt

- GSC Wizard mobile CrUX measurement blocked: no Chrome UX Report API key configured.
- Public mobile PageSpeed request returned HTTP 429 with daily quota 0; no metric or score claimed.
- Organic Search landing-page GA4 query blocked: SimpleKit property 526477995 is readable but not linked to sc-domain:simplekit.app in the connected GSC Wizard account.
- Both measurement checklist items remain open. Recorded configuration requirements, representative URLs and organic report settings in [measurement setup](docs/seo/measurement-setup-2026-10-02.md).
- Next prerequisite: link the existing SimpleKit GA4 property and configure CrUX, or supply the specified GA4 export and PageSpeed reports. No public site change made without measurement evidence.


### 2026-10-02 — Phase 10 initial discoverability pass

- Added truthful, shared WebSite/Person identities to Home/About metadata and preserved published About trust statements in its template.
- Added official Canada.ca/CRA source sections and Methodology links to CPP and RRSP/TFSA Basics, including matching templates.
- Reviewed all 16 guide sources: one H1, static introductory explanations and canonical calculator links.
- SEO validation passed for 22 tools; diff check and JSON-LD parsing passed. Fresh live HTTP responses verified deployed identity/source changes; purged the four changed URLs in Cloudflare.
- Regulated numeric-value maintenance, legitimate independent references, and blocked GA4/CWV measurements remain open. See Phase 10 audit for scope and next steps.
