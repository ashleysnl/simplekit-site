# SimpleKit v2 Phase 3 — local search and suggested questions

Branch: `feature/simplekit-v2-phase-3`, based on Phase 2 handoff `586d5942439661437de0776f40449f52993e3081` ([PR #9](https://github.com/ashleysnl/simplekit-site/pull/9)). The owner instructed Phase 3 on 2026-10-09, clearing the phase review pause while retaining Phase 2's documented manual browser/AT checks for Phase 8. The workspace was clean before branch creation; no existing changes were discarded.

All five implementation tasks and the available automated acceptance checks pass. Phase 3 remains `[~]` for feature PR review and unavailable manual screen-reader coverage. The last acceptance criterion stays `[~]` for that manual check; its keyboard, Chromium accessibility-tree, fallback and privacy checks pass. Phases 4–12 remain `[ ]`. No merge, deployment, hosting change, workflow dispatch, calculator change or source-pin update occurred.

## Implementation and route authority

- `data/v2-discovery.json` adds descriptions, goal tags, common synonyms and the four reference question mappings. Names and URLs are derived from `data/tools.json`; discovery metadata cannot define a second name/route authority.
- `scripts/v2-discovery.mjs` validates exact coverage of all 22 canonical IDs, metadata fields, goal tags, unique question IDs and valid primary/related IDs. It rejects missing/duplicate/unknown IDs, stale paths, non-canonical origins, unsafe protocols and query-bearing routes. The existing build runs these checks before replacing output.
- `scripts/build-site.mjs` generates `dist/assets/v2/discovery-index.js` and renders escaped static question links into `templates/index.html`. The four destinations come from canonical manifest IDs. `data/v2-discovery.json` itself is not copied into public output.
- `assets/v2/discovery-engine.js` normalizes case, accents, whitespace and punctuation, then ranks exact names/slugs ahead of exact synonyms/intents, name phrases and weighted keyword matches across names, synonyms, question intents, goal tags and descriptions. All meaningful query tokens must match. Ties use a deterministic name order; there is no backend or AI service.
- `assets/v2/discovery.js` updates native result links and a polite count/status while typing. Empty or punctuation-only input restores the four questions. Clear and Escape reset the field; no-match input shows useful guidance and a working “View all 22 tools” link. Text uses DOM text nodes rather than HTML interpolation; raw query text is never echoed into results.
- `assets/v2/discovery.css` scopes the white search surface and question/result panel to the homepage. The region expands beyond the hero copy column, up to 52 rem on desktop. The landscape layer is capped at 38 rem and fades independently, so a long result list cannot stretch its crop. Dynamic result chevrons reuse the Phase 1 vector geometry inline, preventing sprite requests on each refresh.

| Reference question | Primary destination | Optional related ID |
| --- | --- | --- |
| Can I retire at 55? | `retirement-planner` | `fire-calculator` |
| Should I rent or buy a home? | `rent-vs-buy-calculator` | `mortgage-calculator` |
| How much house can I afford? | `house-affordability-calculator` | `debt-to-income-ratio-calculator` |
| How do I pay off debt faster? | `debt-payoff-calculator` | `credit-card-interest-calculator` |

## Interaction, accessibility and privacy

The selected pattern is a **native searchbox followed by ordinary focusable links**. Type a tool name or question, Tab past Clear search to a result, and press Enter to activate that link. Arrow keys retain ordinary text editing. Enter in the field does not submit or navigate. Escape from the discovery region clears the query and returns focus to the input. Clear also returns input focus. The input has a persistent programmatic label, help text and a named search landmark; result counts use `role="status"`, polite live updates and atomic announcements. There is no partially implemented combobox or active-descendant selection.

Before JavaScript enhancement, the search controls are hidden and all four question links plus the directory link are ordinary generated HTML. The same fallback works when the discovery module fails to load. Static links remain available elsewhere for every calculator.

The input has no form submission, field name, URL query or history update. Application code performs no search-related fetch, beacon, analytics call, console logging or storage operation. The existing Google tag is preserved. During automation it is stubbed; after the page settles, search interactions generate **zero network requests**, **zero console messages**, unchanged `dataLayer`, empty local/session storage and an unchanged page URL. Queries remain in the field/local matching code. Canonical link activation is intercepted in the test to verify the destination without contacting production; calculator functionality is separately tested on loopback paths.

Chromium's accessibility tree exposes the named searchbox and polite status, and native link semantics, keyboard focus/activation/reset and touch clearing pass. **VoiceOver/NVDA and real browser/AT combinations were unavailable and were not tested.** The manual criterion remains partial and is carried into Phase 8. CSS magnification at 200% and touch landscape emulation pass; browser toolbar zoom and physical devices are not claimed.

## Acceptance evidence and reference comparison

[Browser report](phase-03/browser.json), [browser log](phase-03/browser.log), [unit checks](phase-03/tests.log):

- All **44 exact-name/slug searches** rank their intended tool first. The five required intent queries (`retire at 55`, `rent or buy`, `afford a house`, `pay debt`, `RRSP TFSA`) also rank the intended tool first. All result links match the manifest; all four reference questions activate their correct canonical destination.
- Mixed case, accents, punctuation, empty/whitespace-only input, zero matches and HTML-like input pass. HTML-like input cannot create elements or execute code; clearing restores the static question list.
- Searchbox → Clear → result tab order, visible focus, Enter activation, Escape reset/focus return and touch Clear pass. JavaScript-disabled and failed-module fallback links remain usable.
- At **320, 375, 390, 768, 1440 and 1920 px**, both default questions and matching-result layouts have no horizontal overflow or clipped search panel. Touch emulation covers **844 × 390** at 2× density. The landscape crop remains the same height as results expand.
- On the documented representative test runner (**managed Linux x64, Intel Xeon Platinum 8573C, 5 logical CPUs; Chromium 151.0.7922.173 / Playwright 1.56.1**), maximum synchronous DOM update is **39.00 ms**, and maximum time to the next animation frame is **39.50 ms**, below the **100 ms** acceptance limit. This is a local functional timing check, not a physical-mobile or field-performance claim.
- Zero browser page errors or failed responses occur. Privacy checks described above pass.

| Width | Phase 2 before | Phase 3 after |
| --- | --- | --- |
| 375 | [Before](phase-02/homepage-375.jpg) | [After](phase-03/search-empty-375.jpg) |
| 390 | [Before](phase-02/homepage-390.jpg) | [After](phase-03/search-empty-390.jpg) |
| 768 | [Before](phase-02/homepage-768.jpg) | [After](phase-03/search-empty-768.jpg) |
| 1440 | [Before](phase-02/homepage-1440.jpg) | [After](phase-03/search-empty-1440.jpg) |

Additional evidence: [320 px](phase-03/search-empty-320.jpg), [1920 px](phase-03/search-empty-1920.jpg), [matching results](phase-03/search-results-390.jpg), [no results](phase-03/search-no-results-1440.jpg), [no JavaScript](phase-03/search-nojs-390.jpg), [failed module](phase-03/search-failed-module-390.jpg), [touch landscape](phase-03/search-landscape-touch.jpg), [200% CSS magnification](phase-03/search-css-zoom-200.jpg).

The saved [target](../design-reference/simplekit-v2-target.png) remains unchanged. The search icon, placeholder, rounded white surface, four question rows and chevrons follow its hierarchy. The UI labels the curated reference prompts **“Suggested questions”** rather than asserting measured popularity. Visible keyboard guidance, result counts, Clear and View all tools are functional additions. Search and question text wrap naturally on small screens; desktop search spans more width than the headline column. Existing lower homepage sections and footer remain as they were; Phase 4 trust indicators and later navigation/featured/onboarding sections are unstarted.

## Preservation and supported validation

- [Source acquisition](phase-03/source-fetch.log): **23 pinned sources** verified; no source revisions change.
- [Repository tests](phase-03/tests.log): **23/23 pass**, including eight new discovery tests for route authority, stale/unknown IDs, question mappings, ranking and safe static rendering.
- [Build](phase-03/build.log), [SEO](phase-03/seo.log), [output validation](phase-03/output.log): pass; **22 calculators, 53 sitemap URLs, 67 HTML pages, 145 referenced local assets**.
- [Preservation guard](phase-03/contracts.log): canonical/compatibility routes, sitemap, source pins, all protected calculator/Core bytes and original reference match Phase 0; **94 calculator JS files** match pinned upstream.
- [Calculator regression log](phase-03/calculator-fixtures.log), [summary](phase-03/v2-browser-result.json): **22/22 exact baseline fixtures pass**, including displayed results and initial/final input values, with zero page errors or failed local requests. Baseline fixtures were compared, not re-recorded.
- [Header/hero regression](phase-03/header-regression.log), [report](phase-03/header-regression/browser.json): all **27 widths from 320–1920 px**, menu keyboard/ARIA/touch, resize focus, no-JS, blocked assets, loading and magnification/reflow checks pass. Delayed image/font loading produces local layout shift **0**. The test now accepts the new input as the next focus target after leaving navigation.
- [Artifact delta](phase-03/artifact-delta.json): **321 files**; generated `index.html` changes and four discovery assets are added (**21,658 uncompressed bytes**). The other **316 Phase 2 files** remain byte-identical. Root production landing files, directory, shared CSS/Core, all calculators and source pins remain unchanged; docs/reference/cache/test dependencies are excluded from output.
- [Remote references](phase-03/remote-refs.txt): main remains `ca7826db75cb4353488786aab80857b3a71c1be1`, and Phase 2 remains `586d5942439661437de0776f40449f52993e3081`. Phase 0's live-edge HTTP limitations still apply; no merge or deploy was performed.

Reproduce with the supported build sequence, serve `dist/` on loopback (`PORT=8001 npm run preview`), and use the isolated browser dependency setup:

```sh
SIMPLEKIT_PREVIEW_URL=http://127.0.0.1:8001 NODE_PATH=/tmp/simplekit-v2-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium node tests/v2-discovery-browser.cjs
SIMPLEKIT_PREVIEW_URL=http://127.0.0.1:8001 NODE_PATH=/tmp/simplekit-v2-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium node tests/v2-baseline-browser.cjs
SIMPLEKIT_PREVIEW_URL=http://127.0.0.1:8001 NODE_PATH=/tmp/simplekit-v2-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium node tests/v2-header-hero-browser.cjs
```

Optional browser outputs default to separate `/tmp` directories; set `SIMPLEKIT_EVIDENCE_DIR` to a reviewed evidence directory when recording a phase. Do not replace baseline fixtures. Hosted validation is recorded in the feature PR. The next unstarted phase is Phase 4, trust indicators and honest privacy copy.
