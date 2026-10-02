# SimpleKit redirect verification — 2026-10-02
Reviewed against current GitHub sources and active Cloudflare account Bulk Redirect rules.

## Change
Added 26 exact-path entries to the existing `simplekit_legacy_redirects` list: 13 retired calculator paths, each with and without its trailing slash. All use HTTP 301, preserve query strings, do not include subdomains, and do not match arbitrary descendant paths. Existing 22 legacy-host redirects and the Core root redirect retained.
Cloudflare asynchronous operation `650d71241bd74caaaec7bbd681d3ddd0` completed. List readback confirms 49 entries. The enabled account rule references the list.

## Live verification
49/49 HTTPS redirect cases passed using GET requests without automatic redirect following. Each source returned 301 with the exact expected canonical Location and preserved `seo_redirect_check=1`; each destination returned 200 with no further redirect.
- 22 legacy calculator host roots.
- 26 retired /tools/ path variants.
- Core root to the main homepage.
Shared Core CSS and JavaScript and the /tools/ discovery hub separately returned 200 with no redirect.
These checks establish redirect behavior, not calculator numerical correctness or Google recrawl completion. Exact matches intentionally leave other paths untouched. Repository fallback pages remain in place.

## Retired path map
| Retired path (slash and no-slash) | Canonical destination |
|---|---|
| /tools/budget-planner/ | https://simplekit.app/budget-planner/ |
| /tools/cpp-calculator/ | https://simplekit.app/cpp-calculator/ |
| /tools/debt-payoff-calculator/ | https://simplekit.app/debt-payoff-calculator/ |
| /tools/emergency-fund-calculator/ | https://simplekit.app/emergency-fund-calculator/ |
| /tools/fire-calculator/ | https://simplekit.app/fire-calculator/ |
| /tools/investment-growth-calculator/ | https://simplekit.app/compound-interest-calculator/ |
| /tools/loan-calculator/ | https://simplekit.app/loan-calculator/ |
| /tools/net-worth-calculator/ | https://simplekit.app/net-worth-calculator/ |
| /tools/rent-vs-buy-calculator/ | https://simplekit.app/rent-vs-buy-calculator/ |
| /tools/retirement-planner/ | https://simplekit.app/retirement-planner/ |
| /tools/rrsp-tfsa-calculator/ | https://simplekit.app/rrsp-vs-tfsa-calculator/ |
| /tools/savings-goal-calculator/ | https://simplekit.app/savings-goal-calculator/ |
| /tools/travel-planner/ | https://simplekit.app/travel-planner/ |

## Evidence
Full response status and Location results: [redirect-verification-2026-10-02.json](redirect-verification-2026-10-02.json).
Next: confirm sitemap processing and Google recrawl/discovery, then close organic landing-page engagement and Core Web Vitals measurement gaps.
