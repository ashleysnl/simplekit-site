# Open V2 PR integration — 2026-10-11

The owner explicitly authorized: “Merge all open PRs into V2.” The audit covered the site and all 23 pinned source repositories. Four open V2 PRs were found; the other 20 calculator repositories had no open owner PRs.

| Repository / PR | Target | Merge commit |
| --- | --- | --- |
| [simplekit-site #16](https://github.com/ashleysnl/simplekit-site/pull/16) | develop-v2 | `1dcd55e71e2a21a05beea4b9073d42f6ead2c014` |
| [SimpleKit-Core #1](https://github.com/ashleysnl/SimpleKit-Core/pull/1) | develop-v2 | `de9d1b7c9cc34e96b6df65a4aa2078c3c5fba6d5` |
| [RetirementPlanner #2](https://github.com/ashleysnl/RetirementPlanner/pull/2) | develop-v2 | `956a8978932b0e0b60457be48c4cfcd6ef8dd68c` |
| [SimpleKITMortgageCalculator #2](https://github.com/ashleysnl/SimpleKITMortgageCalculator/pull/2) | develop-v2 | `9d3c21c0990434cd85862d62919aadef4e29bb69` |

The upstream PRs originally targeted main. Each upstream develop-v2 was established from its unchanged main commit, the PR was retargeted and made ready, then merged with a normal merge commit and exact expected head SHA. No force push, shared-history rewrite, branch deletion or production deployment occurred.

## Verification

Site PR head `d4a3b8c4fd27c9a900c7a3ca86b43903c5960656` passed complete hosted CI [38178344222](https://github.com/ashleysnl/simplekit-site/actions/runs/38178344222). The site merge has the identical Git tree. The validated preview remains [1e526422](https://1e526422.simplekit-preview.pages.dev); no redeployment was necessary.

Every upstream pinned SHA is an ancestor of its merged develop-v2, and every merged tree equals its pinned source tree. Source pins remain unchanged, retaining reproducibility. The rebuilt 354 runtime files match the retained validated inventory exactly.

Post-merge source acquisition, all 40 repository tests, portable build, SEO/output validation and both pilot/source preservation checks pass. Previous full three-engine tests remain applicable to the identical trees: 159 pilot layouts, 33 clean axe states, 27 content contracts and all 22 calculator fixtures plus JSON/storage/CSV regressions. No unresolved merge conflicts remain.

## Protected production heads

- simplekit-site main: `ca7826db75cb4353488786aab80857b3a71c1be1`
- SimpleKit-Core main: `cb1da347956f66cec40c72f48fae38b6daf201ed`
- RetirementPlanner main: `77babb4a4d8da834c3118c80e50b989ba7429130`
- SimpleKITMortgageCalculator main: `92cf246721bf6b152334b7bc4185c62098abb8b4`

The site workspace is synchronized on develop-v2. Preserved temporary branches are integrated evidence, not destinations for new development. No open V2 owner PR remains in the audited repositories.

Merge authorization does not imply production-release approval or completion of manual device/screen-reader/native-zoom checks. Phase 14 visual acceptance remains explicit; the inherited retirement classic/module parity discrepancy and legacy missing icons remain documented. Phase 15 is not started by this integration task.
