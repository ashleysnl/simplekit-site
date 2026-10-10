# Phase 9 — SEO and content integrity

Status: `[~]` while final hosted validation runs. Owner instructed Phase 9 on 2026-10-10; continue the existing temporary PR #13 targeting `develop-v2`, without merging or deploying to production. Phase 8's outstanding manual accessibility/device checks remain unchanged.

## Audit and changes

The V2 homepage and directory retain their single H1, meaningful section headings, static descriptions and ordinary links. All 53 indexed pages have unique nonempty titles/descriptions, one H1, one correct production canonical and matching Open Graph URL/title/description. All 22 calculator WebApplication entries have their existing correct canonical URL, name and description. Existing JSON-LD parses, with homepage WebSite/maintainer identities unchanged; no ratings, reviews or nonexistent search endpoint is added. A schema parser/identity check is not an external rich-result eligibility certification.

The existing `seo:validate` previously checked manifest routes and legacy references, but did not enforce these page-level contracts. It now also audits metadata, source HTML links, share assets, preload/modulepreload/srcset resources, schema and compatibility indexing. Four negative regression tests catch missing/duplicate canonicals, wrong social URLs, noindex on indexed pages, malformed JSON-LD, missing assets/links, broken compatibility rules and corrupt/truncated PNG chunks. Portable Node build remains dependency-free.

Share-image audit found two defects: FIRE and Investment Fee refer to an absent `/social-preview.png`; the existing 7,284-byte `/og-image.png` has a truncated PNG chunk, no IEND and renders mostly blank/corrupt even though Chromium's lenient decoder reports dimensions. Its prior historical version has inverted text. The owner selected “Create a share image matching the approved V2 design” on 2026-10-10. Image generation used the unchanged approved V2 mockup for the wordmark, navy/blue typography, headline, coastal scene and truthful copy; [new share image](../../assets/v2/social-share.png) is 1730×909 with a valid PNG chunk/checksum/compressed-pixel stream. All text is legible and uncut. [Asset identity/provenance](phase-09/share-image.json), [broken original browser rendering](phase-09/before/broken-share-render.png).

Only the build output replaces `/og-image.png` and supplies `/social-preview.png` from the new asset; the repository's production-root PNG remains unchanged. The existing calculator metadata/HTML/pins are untouched. Homepage/directory metadata uses `?v=3`, dimensions matching the actual asset, secure image URL, type and meaningful Open Graph/Twitter alternatives. Other existing metadata URLs resolve to the repaired image without rewriting calculator pages. Final owner visual/release approval remains a separate review gate.

## Routes, content and indexing

[Full SEO inventory](phase-09/seo-inventory.json) covers all 53 indexed pages, 67 HTML files, 919 ordinary same-origin link references (the earlier 1,015 count also included same-page fragment links), 99 distinct HTML-referenced resource URLs, and 13 compatibility pages. No missing internal page destinations or referenced assets remain. Main/home/directory discovery content stays crawlable without JavaScript: four suggested questions, four goal links, five Featured tools and the full-directory fallback; all 22 directory tools have meaningful ordinary anchors.

Manifest/sitemap membership remains exactly 53 production URLs, with no query/filter duplicates. All 22 calculator paths, 16 Learn guides, seven retirement landing pages, support/about/privacy/methodology pages and 13 noindex/follow compatibility pages remain intact. Production robots continues `Allow: /` with the production sitemap. Only isolated preview artifacts remove CNAME and use disallow-all robots plus noindex/nofollow headers.

The authoritative legacy redirect report has 49 existing mappings with 23 distinct production destinations. All destinations remain in the canonical inventory and return 200 when mapped to the generated local/preview origin. No edge redirect, DNS or production configuration is changed. This verifies destination preservation, not a fresh live production redirect status/check; the prior 2026-10-02 report remains historical evidence.

## Inherited findings — separate upstream work

22 source-pinned calculator/retirement pages omit optional image/Twitter tags. They retain their existing title/description/canonical/Open Graph identity, and each gap is listed in the SEO inventory. No additional schema or metadata is invented in copied sources to claim uniform coverage.

Seven existing Retirement Planner landing pages contain 42 links to five old fragments (`start`, `dashboard`, `learn`, `methodology`, `about`) in the calculator. The base destinations exist, but all five IDs remain absent after JavaScript mounts. These same links and copied HTML are byte-identical to Phase 0's protected source inventory; no V2 authored link has a missing fragment. Remediation requires reviewed upstream retirement guide/shell changes and a separately authorized pin update. This phase does not claim those inherited fragments work.

The separate SEO improvement plan's production indexing, Search Console, organic engagement and field metrics checklist is unchanged. Phase 9 here verifies V2 content/build integrity, not those ongoing production measurement tasks. Phase 8's inherited accessibility findings/manual reviews remain open.

## Local validation

36 repository tests pass, including four new negative SEO/image integrity tests. Portable build, `seo:validate`, `output:validate` and preservation inventory pass: all 23 pins verified, all 22 tools/53 sitemap URLs/67 HTML routes preserved, 94 calculator JavaScript files identical to pinned upstream. Artifact grows from 333 to 335 files only for `assets/v2/social-share.png` and the missing `social-preview.png` alias; existing generated `og-image.png` is intentionally replaced. No docs/mockup/cache/test files are published.

[Local no-JS/HTTP verification](phase-09/local/seo-browser.json) passes 66 indexed/compatibility routes, 99 referenced resources, all 23 documented redirect destinations, production robots/sitemap preservation and share alias byte equality. Images are strictly checked, not merely tested for HTTP 200. Local preview sends noindex headers; hosted isolation is verified separately. Calculator guide fragment limitations are explicitly reported. An initial local browser attempt overlapped a rebuild and saw a transient missing file; the completed build was verified sequentially afterward, without relaxing any assertion.

## Hosted verification

Pending final isolated upload and secure browser checks. Source SHA, workflow results, artifact checksums, exact preview URL and hosted SEO results will be recorded before marking Phase 9 complete.
