# Phase 15B — Calculator reference interiors

Status: `[~]` implemented with lightweight verification. Final numerical/state, accessibility, cross-browser and visual acceptance remain deferred to Phase 16. Continues [Phase 15A's shared ownership contract](phase-15a-handoff.md); existing Retirement/Mortgage pilots are retained.

## Changes and ownership

Only source-owned `index.html` and `v2-calculator.css` changed in CPP and Monthly Budget. Shared Core remains pinned at `fa778283ea4c892a15a7554202240d6addcc646e`; no second design system or framework added. The site changes its two source pins and corresponding migration records.

CPP now uses a plain, compact introduction with shared breadcrumbs. The existing title is inside the main landmark so its skip link reaches the introduction. Promotional/trust content remains available after the form; the educational disclaimer and official Service Canada link remain near the introduction. Desktop fields occupy two actual field columns; contextual instructions, validation, actions and advanced assumptions span the form. Mobile fields remain sequential. The primary answer uses the shared soft-blue surface.

Budget uses a compact title/description and shared breadcrumbs. The working planner comes before existing educational/quick-start sections; their copy, IDs and links remain. Section links wrap compactly, the mobile summary stays in normal flow, and optional starter packs/planner mode use native disclosures. The existing hero snapshot remains available as a disclosure in the results column. The genuine input/result workflow stays intact, including dynamic rows, sample packs, mode switching, goals, charts, export and saved state. Heading treatment is tighter; source calculators retain their own task layout.

## Immutable revisions

| Repository | Previous pin | Current develop-v2 pin |
| --- | --- | --- |
| `ashleysnl/SimpleKitCPP` | `6dd3bbd05c1ac357f15bd27cbd4cf88b05e2da8e` | `6061a0a9c1935ec40dd463e4e25a707c2b98be29` |
| `ashleysnl/SimpleKitMonthlyBudget` | `93e61eff224bcc1a6c4fb45b581dc08ed18a1890` | `2d410fd86b8b06da70dadeb5a6921311c3afcd05` |

CPP commit `6061a0a`; Budget commits `a0c4c27`, `f86643f`, `2d410fd`. All pushed by normal fast-forward to source `develop-v2`. Site assembly based on `e428e65`; deliberate pin updates are in `data/calculator-sources.json` and `data/v2-calculator-migrations.json`. All other calculator pins and Core remain unchanged.

Rollback with normal source reverts and/or restoring these two previous immutable pins and rebuilding. No history rewriting, storage clearing, hosting or production changes are needed.

## Lightweight checks

- Three portable builds passed: initial combined reference batch; Budget compact navigation/optional suggestions refinement; final optional-mode/field-heading refinement. Each built all 22 calculators from 23 verified source pins. Builds were repeated only after screenshot findings caused new source changes.
- Final focused Chromium look at CPP and Budget at 402×900 and 1440×900, with small viewport/field captures. No horizontal overflow, page errors or failed local resource responses. External services were intercepted; analytics delivery is unverified.
- CPP: changed monthly amount, submitted comparison, confirmed scenario output, opened advanced assumptions.
- Budget: switched full/simple mode through its new disclosure, loaded sample, confirmed primary results, opened starter packs and added an income row.
- Source preservation comparison against previous pins: entire head/metadata and inline/external script tags unchanged; input/select/textarea attributes and order unchanged; all existing IDs preserved with no duplicates. External calculator/financial script files are outside the changed file set. Source diffs/whitespace reviewed.
- Final diagnostic JSON: `/workspace/scratch/phase15b/checks.json`; viewport captures beside it. CPP first numeric input at ~646px mobile/~622px desktop. Budget first amount input at ~1537px mobile/~1212px desktop: improvement is implemented, but Budget's existing nested row/header presentation still warrants refinement. These are document coordinates, not an acceptance threshold.
- Mandatory CI is unchanged; exhaustive numerical fixtures, state/import-export cases, SEO/axe audits, browser matrices and final screenshot galleries were not run during implementation.

## Remaining gaps / next step

Phase 15C should use these existing references and the shared theme to refine remaining tool families without restarting migrations. Review Budget's nested panels/row density and first-input distance, including mobile name/amount/remove controls; keep visible labels and touch targets. Consider reducing secondary explanatory copy inside working panels without deleting meaningful content. CPP still has extra example/help copy that may be tightened during that review.

Phase 16 must verify numerical/state/export and complete article-content/anchor preservation, keyboard/no-JS disclosure behavior, zoom/print/reflow, cross-engine rendering and final visual coherence against exact source pins. Passing builds and focused interactions do not establish release acceptance. Final demo upload/review remains Phase 17.

Main, production publishing, hosting and DNS were not modified. No deployment was performed. Unrelated TakeHomePay dirty source work and prior local backups remain preserved.
