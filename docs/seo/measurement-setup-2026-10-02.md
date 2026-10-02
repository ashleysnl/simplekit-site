# Performance and organic engagement measurement — 2026-10-02

## Status
Attempted measurement; both items remain OPEN. No performance score, Core Web Vitals pass, or organic engagement result is claimed.

| Check | Result | Required next step |
|---|---|---|
| Mobile CrUX field data through GSC Wizard | notConfigured: no CrUX API key | Configure a Google API key with Chrome UX Report API enabled using the property's Core Web Vitals API Key button |
| Public PageSpeed mobile homepage test | HTTP 429, daily project quota 0 | Use the PageSpeed Insights website or an appropriately configured API project |
| Organic landing-page GA4 report | notConfigured: no_property | Link SimpleKit GA4 property 526477995 to sc-domain:simplekit.app in GSC Wizard |
| GA4 connection/property inventory | Connected; SimpleKit property visible, linkedSiteUrls empty | Existing consent is present; link the property on its Analytics page |

Property links are scoped to the GSC Wizard account. Use the same account as the connected plugin. Do not select the separate Capehelm GA4 property 556074197.
The connector exposes no GA4 linking or CrUX key configuration action. The previous browser authentication attempt was stopped when the owner supplied a snapshot; no new credential request or configuration change was made in this batch.
A local lab fallback was checked, but no Chromium executable or Lighthouse installation was available. Installing another runtime was not required for the requested measurement.

## Organic engagement report to obtain
GA4 property: SimpleKit (526477995).
Baseline dates: September 3–30, matching the owner's supplied snapshot.
Dimension: Landing page (or Landing page + query string).
Filter: Session default channel group exactly Organic Search.
Metrics: Sessions, engaged sessions, engagement rate, average engagement time per session, and key events. Include landing-page paths. Export a CSV or provide the table.
For post-release comparison, use October 2–29 once settled and compare matching dates across GSC/GA4. The existing all-traffic page-title snapshot cannot supply organic landing-page engagement.

## Representative mobile performance set
- https://simplekit.app/
- https://simplekit.app/tools/
- https://simplekit.app/loan-calculator/
- https://simplekit.app/retirement-planner/
- https://simplekit.app/emergency-fund-calculator/

Collect available mobile LCP, INP and CLS field data separately from Lighthouse laboratory results. Record source, collection window and whether data represents a page or origin. No-data is not a passing score. Lab measurements can diagnose loading/layout issues but cannot close an unavailable real-user INP measurement.
No public code changes are justified until actual results identify a defect.

## Evidence
- GSC Wizard get_core_web_vitals, PHONE, sc-domain:simplekit.app: notConfigured=true.
- GSC Wizard query_ga4_report, landingPage, Organic Search, 2026-09-03 through 2026-09-30: notConfigured=true, reason=no_property.
- list_ga4_properties: connected=true; SimpleKit properties/526477995, linkedSiteUrls=[].
- PageSpeed mobile request: RESOURCE_EXHAUSTED / RATE_LIMIT_EXCEEDED; quota_limit_value=0.
