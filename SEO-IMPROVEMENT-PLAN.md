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
- [ ] Record top queries, pages, impressions, clicks, CTR, and average position.
- [ ] Record current GA4 organic landing-page performance.
- [ ] Confirm `https://simplekit.app/sitemap.xml` is submitted in Search Console.
- [ ] Confirm the sitemap currently contains only intended canonical URLs.
- [ ] Create a simple redirect test list covering every legacy SimpleKit subdomain before Phase 1 changes.

**Done when:** We have enough baseline data to compare performance after migration work.

---

# Phase 1 — Finish legacy subdomain migration

**Priority:** Critical  
**Goal:** Make `simplekit.app/<tool>/` the unambiguous home of every calculator.

Legacy calculator subdomains still exist in DNS. The site should not maintain two crawlable URL architectures for the same products.

## 1.1 Build authoritative redirect map

- [ ] Inventory every historical calculator subdomain.
- [ ] Map each legacy hostname to its matching canonical directory URL.
- [ ] Identify any legacy URLs with no current equivalent and decide whether they should redirect to a relevant tool, `/tools/`, or return an intentional status.
- [ ] Store the final redirect map in this document or a dedicated migration file.

Initial hosts to verify include:

- `retirement.simplekit.app`
- `fire.simplekit.app`
- `cpp.simplekit.app`
- `rrsptfsa.simplekit.app`
- `investment.simplekit.app`
- `savingsgoal.simplekit.app`
- `emergency.simplekit.app`
- `networth.simplekit.app`
- `monthlybudget.simplekit.app`
- `takehomepay.simplekit.app`
- `debt.simplekit.app`
- `creditcard.simplekit.app`
- `loan.simplekit.app`
- `houseaffordability.simplekit.app`
- `rentvsbuy.simplekit.app`
- `mortgage.simplekit.app`
- `fees.simplekit.app`
- `mortgagecalculator.simplekit.app`
- `taxchecklist.simplekit.app`
- `travel.simplekit.app`

## 1.2 Implement permanent redirects

- [ ] Configure server/edge redirects so each retired calculator subdomain returns a permanent redirect to its exact canonical directory page.
- [ ] Preserve useful paths/query parameters only where doing so makes sense.
- [ ] Avoid redirect chains.
- [ ] Confirm the destination returns HTTP 200.
- [ ] Confirm old hosts do not continue serving duplicate calculator pages.

**Validation:** Test each hostname manually and with an HTTP status check.

## 1.3 Retire `core.simplekit.app` as a website

`core.simplekit.app` currently exposes a stale indexable homepage while also serving shared SimpleKit assets.

- [ ] Preserve required shared asset URLs such as CSS/JS.
- [ ] Stop the root of `core.simplekit.app` from acting as a second SimpleKit homepage.
- [ ] Prefer redirecting the root homepage to `https://simplekit.app/` if this can be done without breaking asset delivery.
- [ ] Verify required assets still load after the change.
- [ ] Confirm search engines are no longer being presented with a stale second homepage.

## 1.4 Post-migration validation

- [ ] Crawl/test all legacy hosts.
- [ ] Confirm each legacy calculator hostname has one-hop permanent redirect behavior.
- [ ] Confirm no canonical directory URL redirects elsewhere.
- [ ] Re-submit sitemap in Search Console after migration.
- [ ] Monitor Search Console indexing/canonical reports for migration issues.

**Phase 1 done when:** Every retired calculator subdomain resolves cleanly to one canonical SimpleKit directory URL and `core.simplekit.app` no longer functions as a competing homepage.

---

# Phase 2 — Normalize internal links

**Priority:** Critical  
**Goal:** Ensure SimpleKit itself consistently reinforces the canonical architecture.

- [ ] Search `simplekit-site` for all `.simplekit.app` references.
- [ ] Search every calculator repository for all `.simplekit.app` references.
- [ ] Replace legacy calculator-subdomain links with canonical `https://simplekit.app/<tool>/` links.
- [ ] Preserve `core.simplekit.app` references only where they are genuinely required for shared assets.
- [ ] Review navigation links.
- [ ] Review footer links.
- [ ] Review related-tool links.
- [ ] Review links embedded in educational content and FAQs.
- [ ] Review structured data URLs.
- [ ] Review Open Graph/Twitter URLs.
- [ ] Confirm there are no internal links that intentionally route users through a redirect.

**Phase 2 done when:** A repository-wide search finds no unintended legacy calculator-subdomain links.

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

Create a complete 22-tool matrix before closing this phase. Suggested columns:

| Tool | Title | Description | Canonical | H1 | Static copy | Methodology | FAQ | Schema | Related links | Sources | Complete |
|---|---|---|---|---|---|---|---|---|---|---|---|

- [ ] Populate matrix.
- [ ] Fix highest-opportunity/weakest pages first.
- [ ] Re-audit every row after changes.

**Phase 3 done when:** Every production calculator meets the agreed baseline and the matrix is complete.

---

# Phase 4 — Refocus homepage and hub metadata

**Priority:** High  
**Goal:** Let hub pages describe SimpleKit broadly while individual calculators own specific long-tail queries.

## Homepage

Current homepage metadata attempts to enumerate too many tool categories.

- [ ] Shorten and refocus homepage title.
- [ ] Shorten meta description.
- [ ] Keep primary positioning Canadian where appropriate.
- [ ] Avoid keyword-list style metadata.
- [ ] Ensure H1 communicates the product benefit rather than duplicating the title.

Working title direction:

> Free Financial Calculators & Planning Tools for Canadians | SimpleKit

Working description direction:

> Free Canadian calculators for retirement, budgeting, mortgages, debt, investing, taxes and financial planning. No signup required.

These are working directions, not locked copy. Validate against Search Console query data before finalizing.

## Tools hub

- [ ] Ensure `/tools/` has a distinct title/H1/description from the homepage.
- [ ] Add useful category copy rather than only a grid of links.
- [ ] Organize tools into clear topical groups.
- [ ] Link to relevant Learn hubs/guides.

## Learn hub

- [ ] Give `/learn/` a distinct search purpose.
- [ ] Organize guides into topic clusters.
- [ ] Make calculator links contextually useful rather than decorative.

**Phase 4 done when:** Homepage, Tools, and Learn each have a clear and non-overlapping search purpose.

---

# Phase 5 — Trust, authorship, methodology, and sources

**Priority:** High  
**Goal:** Make it easy for users and search engines to understand who maintains SimpleKit, how calculations are built, and where rule-based inputs come from.

## Site-level trust

- [ ] Strengthen About page with transparent maintainer information.
- [ ] State that SimpleKit is built and maintained by Ashley Skinner.
- [ ] State Canada-based context where relevant.
- [ ] Explain SimpleKit's calculation-development philosophy.
- [ ] Explain update/maintenance approach.
- [ ] Provide a corrections/contact path.
- [ ] Link privacy information clearly.
- [ ] Explain local/browser processing where accurate.
- [ ] Avoid unsupported expertise or authority claims.

## Calculator methodology

For calculators involving assumptions or regulated values:

- [ ] Explain important formulas/assumptions in plain language.
- [ ] Show material default assumptions.
- [ ] Distinguish estimates from official determinations.
- [ ] Show when important rule-based values were last reviewed where practical.

## Authoritative citations

Add direct primary-source links where relevant, for example:

- [ ] CPP/OAS → Government of Canada / Service Canada.
- [ ] Federal tax rules and registered-account limits → CRA / Canada.ca.
- [ ] Mortgage/insured-mortgage rules → relevant Government of Canada, CMHC, or OSFI source.
- [ ] Other regulated calculations → primary regulator/government source.

Prefer primary sources over finance blogs for factual rules.

**Phase 5 done when:** Users can readily determine who maintains SimpleKit, how important calculations work, and which authoritative sources support regulated inputs.

---

# Phase 6 — Build topical authority

**Priority:** Medium-High  
**Goal:** Grow SimpleKit from a collection of calculators into a connected financial-planning resource.

Do not mass-produce thin articles. Each guide should answer a real question, add useful explanation beyond the calculator UI, and connect naturally to one or more tools.

## 6.1 Housing cluster

Candidate topics:

- [ ] Mortgage affordability in Canada.
- [ ] Rent vs. buy in Canada.
- [ ] How much house can I afford?
- [ ] Mortgage payment vs. total cost of home ownership.
- [ ] Accelerated biweekly mortgage payments.
- [ ] Pay down the mortgage or invest?

## 6.2 Retirement cluster

- [ ] Expand beyond the current starter guides.
- [ ] Connect CPP, RRSP/TFSA, retirement planning, FIRE, compound growth, and savings tools.
- [ ] Build guides around actual Search Console queries.

## 6.3 Budgeting and cash-flow cluster

- [ ] Budgeting methodology.
- [ ] Emergency funds.
- [ ] Savings goals.
- [ ] Take-home pay and household cash flow.
- [ ] Connect guides directly to relevant calculators.

## 6.4 Debt and credit cluster

- [ ] Debt payoff methods.
- [ ] Credit-card payoff/cost education.
- [ ] Loan payment/amortization education.
- [ ] Debt-to-income education.

## 6.5 Investing cluster

- [ ] Investment fees.
- [ ] Compound growth.
- [ ] RRSP vs. TFSA.
- [ ] Mortgage paydown vs. investing.

## Content standard

Every new guide should have:

- [ ] A single clear search intent.
- [ ] Unique title/meta/H1.
- [ ] Useful original explanation.
- [ ] Semantic headings.
- [ ] Relevant primary sources where factual rules are discussed.
- [ ] Contextual links to calculators.
- [ ] Contextual links to related guides.
- [ ] Links from relevant calculators back to the guide where useful.
- [ ] No filler written merely to increase word count.

**Phase 6 done when:** Each major calculator category has a meaningful supporting content cluster rather than isolated tools.

---

# Phase 7 — Sitemap, indexing, and crawl hygiene

**Priority:** Medium  
**Goal:** Keep discovery signals clean as the site grows.

- [ ] Keep `robots.txt` simple unless a real crawl-control need emerges.
- [ ] Keep sitemap limited to canonical, indexable URLs.
- [ ] Add/update `lastmod` only if it can accurately reflect meaningful page changes.
- [ ] Remove retired/noncanonical URLs from sitemap.
- [ ] Check for accidental `noindex`.
- [ ] Check for canonical mismatches.
- [ ] Check for 404s and soft 404s.
- [ ] Check for redirect chains.
- [ ] Check for orphan pages.
- [ ] Check that all important pages are reachable through normal HTML links.
- [ ] Periodically inspect Search Console's indexed/not-indexed reports.

**Phase 7 done when:** Sitemap, canonicals, redirects, indexability, and internal discovery all describe the same site architecture.

---

# Phase 8 — Performance and user experience

**Priority:** Medium  
**Goal:** Improve search landing-page usefulness without compromising calculator functionality.

- [ ] Measure Core Web Vitals on representative calculator pages.
- [ ] Check mobile usability.
- [ ] Minimize layout shift.
- [ ] Ensure primary calculator UI becomes usable quickly.
- [ ] Audit shared `core.simplekit.app` asset weight and caching.
- [ ] Optimize oversized images/assets where found.
- [ ] Avoid adding SEO content that pushes the actual calculator unreasonably far down the page.
- [ ] Improve result explanations and next-step links where they help users.
- [ ] Review GA4 engagement after major page changes.

**Phase 8 done when:** SEO improvements do not come at the expense of the site's core calculator experience.

---

# Phase 9 — Search Console feedback loop

**Priority:** Ongoing  
**Goal:** Let actual search demand guide later optimization.

Review monthly initially:

- [ ] Queries with high impressions and low CTR.
- [ ] Queries ranking approximately positions 5–20.
- [ ] Pages gaining or losing impressions.
- [ ] Unexpected queries that reveal missing content.
- [ ] Canonical/indexing warnings.
- [ ] New pages that remain undiscovered or unindexed.
- [ ] Organic landing-page engagement in GA4.

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

- [ ] Maintain clear entity/about information.
- [ ] Use descriptive headings and direct answers.
- [ ] Keep methodology and assumptions explicit.
- [ ] Cite primary sources.
- [ ] Keep important facts in crawlable HTML.
- [ ] Maintain consistent naming for SimpleKit and its calculators.
- [ ] Use structured data accurately.
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
| 2026-10-01 | Plan created | Added repository SEO improvement plan based on initial GitHub, live-site, and Cloudflare audit. | Plan committed to repository. | |

---

# Next task

**Start with Phase 0, then Phase 1.1: create and verify the complete legacy-subdomain → canonical-directory redirect map before changing Cloudflare configuration.**
