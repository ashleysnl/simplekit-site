# SimpleKit V2 design system — version 1

Contract version: **1**. This extends Phase 1's existing tokens; it does not silently change their values or retrofit legacy selectors. Load `foundations.css`, then `system.css`, and explicitly opt a complete page or isolated subtree into `.sk-v2[data-v2-system="1"]`. Load `shell.js` only for its disclosure navigation. As of Phase 15A, renderers are owned by pinned Core `v2/components.mjs`; `scripts/v2-system-components.mjs` is the site import bridge. See [the current ownership and upgrade handoff](../phase-15a-handoff.md). No new framework or site dependency is required.

## Tokens and responsive rules

| Area | Version 1 specification |
| --- | --- |
| Type | Existing locally licensed SimpleKit Display 400/700 for headings; SimpleKit Sans 400/700 for body/UI. Visible serif/sans fallbacks and `font-display: swap`. Body 1rem / 1.55; help .9375rem; eyebrow .8125rem, 700, .14em. Interior h1 uses 1.75–2.75rem, h2 1.5–2rem; homepage retains its separate hero scale. |
| Colours | Canvas #fcfcfb; white surfaces; navy #101b46; secondary #52627c; action/focus #0759d9, hover #0349b6; teal #006f62; warning #8d4b08; error #a52229. Soft blue/teal/amber/purple fills are supporting surfaces, never the only state cue. |
| Borders | Decorative #dbe2ec; functional input/menu border #7e8ba1. Error input has a 2px error border and visible corrective text, linked to the field. |
| Space | Retain .25/.5/.75/1/1.5/2/3/4.5rem ladder. Interior layout gap 1–2rem, gutters 1–3rem, cards 1–1.5rem padding. Avoid multiple nested article cards; use reading flow and discrete callouts. |
| Width/reflow | Site 72rem maximum; reading 44rem maximum; form target 34rem; mobile one column. 48rem breakpoint permits editorial sidebar and balanced input/results columns. Grids use `minmax(0,…)`; tables scroll locally, never widen the page. |
| Surfaces/elevation | Small radius .75rem, card 1.25rem, panel 1.75rem; soft shadow 0 8px 24px navy at 5%. Theme 1.1 primary actions use the existing pill token; task-specific secondary controls retain their treatment. Homepage discovery keeps its established treatment. |
| Icons | Reuse the existing 18-symbol SVG sprite. Decorative icons have aria-hidden/focusable=false; icon-only actions require a text name. Meaningful state labels never rely on an icon or colour alone. |
| States | Visible 3px action-colour focus with 3px offset, hover, current page, expanded disclosure, disabled, inline error, empty and loading. Existing reduced-motion rules apply. Forced colours preserve native control borders; example chart uses explicit white backing plus its textual data alternative. No bespoke dark palette is claimed. |

All buttons, navigation/related links, native inputs/selects, range controls and disclosures have at least 44px activation height/width. Checkbox/radio glyphs are 20px inside an associated full-width label with a 44px activation area. Inline links within prose retain underlines and use the inline-text target exception; do not convert every citation into a button.

## Shared shell and content components

- `shellHeader(active, prefix)`: named home link, normal Home/Tools/Learn/About/Support links, current-page state, skip link and a native mobile disclosure button. Without JS, navigation remains visible. Keyboard activation, Escape/focus return, selection close and responsive focus recovery are required. This is ordinary navigation, not an application menu or modal; it does not trap focus or lock scrolling.
- Initialise the disclosure immediately after its header markup, as in the references, so desktop/mobile visibility is established before rendering the remaining page. During adoption, measure layout shifts on the real migrated page; this foundation does not establish a site-wide CLS result.
- `breadcrumbs(items)`: labelled navigation/list, final current-page text, wrapped separators and normal links. Match the page's actual hierarchy; do not invent a parent URL.
- `shellFooter()`: concise brand, canonical Tools/Learn/Methodology/Privacy/Support routes and qualified financial-input/analytics disclosure. Preserve any route-specific sources or disclosures when integrating.
- `.v2s-section-nav`: ordinary article anchors before article content on mobile and alongside on desktop, retaining useful DOM/keyboard order. Related content uses the canonical manifest through `relatedContent(items)`; do not create a second tool registry.
- `.v2s-note[data-tone]`: information/success/warning/error text and visible border treatment. Use `role=status` only for real dynamic updates; use `role=alert` for consequential newly inserted errors, not every static coloured box.
- Native `details/summary`: disclosure/accordion with an adequately sized target and no redundant custom ARIA state. Preserve semantics, print content and existing unique tool behavior.

## Calculator primitives and behavior contracts

| Primitive | Integration requirement |
| --- | --- |
| Currency/percent/number | Visible label includes unit; persistent help and error IDs connect with aria-describedby; aria-invalid reflects actual validation. Decimal currency may use inputmode=decimal with explicit parser/locale rules. Numeric/range min/max/step must come from that calculator's preserved domain. Never reformat while typing or substitute a new formula/parser without source review. |
| Select/radio/checkbox/switch | Use native controls and associated labels/fieldset/legend. Meaningful checked state and disabled help; preserve persistence and default values. A native checkbox may use role=switch when the action is an on/off setting. |
| Slider | Native range, visible current value and units, keyboard arrows and programmatic accessible value text where units matter. Do not depend on drag-only interaction. |
| Help/validation | Keep help readable; identify the field and correction. On submit, focus the first invalid field or linked summary. Announce a concise result/status change without repeatedly reading an entire chart/table during typing. |
| Results/KPI | Definition lists with descriptive units, readable values and tabular figures. Reflow to one column at small/enlarged widths. Preserve values, rounding and associated assumptions. |
| Charts | Responsive viewport with a meaningful name/description and equivalent data/text. Actual canvases need tool-specific accessible alternatives. Maintain explicit chart colours/legends and forced-colour contrast; the example SVG is not a replacement chart engine. |
| Tables | Caption, column/row scope, complete values and a labelled focusable local scroll region. Keep exports intact; never hide columns to make screenshots fit. Print permits wrapping. |
| Actions/states | Clear primary versus secondary actions, meaningful export names/formats, native disabled semantics, explicit empty state and aria-busy only while genuinely loading. Preserve existing storage/export/import behavior. |

Review-only references exercise real keyboard navigation, sample validation/reset, a slider/switch and a downloadable **illustrative** CSV. They contain no financial calculations, persistence, analytics or financial-input requests. Never ship the example controller or substitute its fixed chart/KPIs for a tool's real results.

## Versioning and adoption

1. Preserve Phase 11 route/content/source inventories and Phase 0 numerical fixtures before adopting the contract.
2. Add the opt-in marker/assets through authored templates or reviewed upstream changes. Legacy pages receive no broad CSS reset. Do not double-inject Core and a second header/footer.
3. Phase 13 applies site-owned editorial/support markup while preserving article text, metadata/schema/indexing and links. Phases 14–15 implement calculator-specific interiors upstream.
4. Changes to token meaning, component semantics or public class contracts require a new contract version or explicitly documented compatible amendment; retain prior rollback artifacts/pins.
5. Every adoption needs responsive/keyboard/axe/content/SEO checks plus actual tool calculations/state/export tests. Manual AT/devices/native zoom/human contrast remain separately recorded acceptance work.
