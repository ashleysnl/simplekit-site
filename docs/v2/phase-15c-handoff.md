# Phase 15C — Calculator family alignment

Status: `[~]` implemented with four passing batch builds and lightweight inspection. Final visual acceptance and numerical/state/browser QA remain Phase 16. Continues the existing [shared theme](phase-15a-handoff.md) and [CPP/Budget references](phase-15b-handoff.md); does not restart the migrations.

## Implementation and owners

Core `v2/calculators.css` owns compact task introductions and the native `v2c-context` disclosure. These additions require an opted-in calculator with the adopted theme 1.1 shell; legacy pages and the existing Retirement/Mortgage pilot layouts are preserved. No new global reset, framework or registry. Existing fonts/tokens/icons and primary actions remain shared.

Seventeen source-owned `index.html` updates add canonical breadcrumbs, put static explanations after working sections where appropriate, and place static promotional/context material in native disclosures. Existing fields, buttons, live results and financial inputs stay outside those disclosures. All existing IDs and substantive copy remain. Budget's source-owned `v2-calculator.css` reduces nested card padding and gives mobile name/amount fields two readable columns with a separate 44px removal action. No financial or persistence scripts changed.

| Family | Source updates | Retained existing implementations |
| --- | --- | --- |
| Investing | Compound Interest, Fees, RRSP/TFSA, FIRE | CPP's completed reference |
| Housing/debt | Affordability, Credit Card, Loan, Rent/Buy, Mortgage Paydown/Invest, Debt Payoff, DTI | Existing Mortgage pilot |
| Income/planning | Take-Home Pay, Net Worth, Savings Goal, Emergency Fund; Budget row density | Contractor's existing published source; existing Retirement pilot |
| Tax/travel | Tax Checklist and Travel Planner | Purpose-specific checklist and itinerary/tab interactions |

All 22 generated calculators have exactly one theme 1.1 shared header/footer. The common compact introduction amendment applies to the 20 previously migrated calculator consumers; the two pilots retain their task layout. Associated guides/supporting pages continue consuming the Core-owned shell through the existing site editorial/build contract. Their authored content, source pins, routes and compatibility behavior are unchanged; no route migration or production deployment.

## Revisions and rollback

Core: `fa778283ea4c892a15a7554202240d6addcc646e` → **`c9c0a3177502d2e320f07de203d35890fd2efc1a`**. Changed files: `v2/calculators.css`, `docs/v2-shared-theme.md`. Shared module/navigation, legacy assets and numerical helpers are unchanged. Published by a non-forced fast-forward; private equivalent authored commit preserved locally.

Eighteen calculator repositories updated their own `develop-v2` branches. [Exact old/new pins and changed files](phase-15c/source-revisions.json) are authoritative. The site updates `data/calculator-sources.json` and `data/v2-calculator-migrations.json`; assembly baseline is `24965a0`. CPP, Retirement, Mortgage and Contractor pins remain unchanged. Rent/Buy and Net Worth used the connected GitHub API after CLI credential failures; published trees were verified identical to authored local trees and local branches synchronized without rewriting shared history. Private authored commits remain in bundles/reflogs.

Rollback through ordinary reviewed source reverts or restoration of the old immutable pins in the revision record, including previous Core `fa778283`. Rebuild. Preserve state and production; never force-push or edit generated calculator content as source.

## Lightweight validation

- Four successful portable builds, one per coherent investing, housing/debt, income/planning and tax/travel batch. Every build assembled all 22 calculators from 23 verified immutable source revisions.
- Network permission prevented ordinary source fetches during some attempts. Exact already-published Git objects were acquired from local owning checkouts into clean detached source caches with canonical remote URLs, then verified by the unchanged build acquisition checks. API-created objects were reconstructed and their SHA/tree identity verified before use. No cache content was authored or substituted; CI retains the normal fresh GitHub acquisition path. Earlier network-blocked attempts are not counted as successful builds.
- Source comparisons for all 18 changed tools preserved entire heads/metadata, script tags, input/select/textarea attributes and order, existing IDs, and substantive paragraphs/headings/lists. Reviewed file lists contain only the declared HTML/CSS changes. All financial runtime files remain outside the changed set.
- Brief Chromium look: FIRE, Loan, Budget and Travel at 402×900 and 1440×900; eight viewport captures plus two Budget field views. Calculator assertions completed: one header/footer, transparent compact intro, no horizontal overflow or local HTTP/page errors; native context opens/closes by keyboard without financial controls inside. FIRE sample, Travel demo and Budget sample/results worked; Budget amount fields remained at least 70px wide and 44px high. Captures were visually inspected. External services were intercepted, so analytics delivery is unverified.
- The same probe then failed on the guide check because `article` matched eight elements. The selector was corrected to `article.v2e-content`, but its rerun was interrupted before execution. The overall browser probe did **not** exit successfully; guide browser verification remains pending. Earlier eight calculator observations remain limited evidence, not a passing complete matrix. Local captures/probe: `/workspace/scratch/phase15c/screens/`, `/tmp/phase15c-check.cjs`.
- Required CI is unchanged. No exhaustive numerical/state/export fixtures, full SEO/axe audit, browser matrix or final screenshot gallery was run. Consolidate those checks in Phase 16.

## Preserved unrelated work and remaining gaps

TakeHomePay's pre-existing uncommitted `v2-calculator.css` patch is byte-for-byte unchanged and is not included in its HTML-only commit. Contractor has a divergent local `95dcc71` and dirty `index.html`/`assets/js/app.js`; all are preserved, with patch backups in `/workspace/scratch/phase15c/`. Its published pinned `c56104e` remains the source; only the shared theme is adopted through Core. Do not reset or blindly publish that local work. Its intended behavior and integration need a separate review before final QA/release.

FIRE's trust snapshot/action area and Loan's live introductory snapshot still add mobile height. They retain useful controls/live outputs; final visual review should decide whether to relocate or condense them. Budget's editable rows are improved but still merit final zoom/reflow and long-name inspection. Travel's tool menu/tabs remain purpose-specific. All-family visual acceptance, guide browser verification, print/no-JS/keyboard/zoom, persistence/import/export, calculations and final cross-engine screenshots remain Phase 16.

Next: Phase 15D maintained style guide/starter/spec/Codex handoff. Main, production publishing, hosting and DNS are unchanged. No deployment or release approval is claimed.
