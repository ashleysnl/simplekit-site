# Phase 16 screenshot and evidence index

Candidate: `6ac53323275bc8348e7a97558b71bab694a68151`. Automated checks pass;
visual acceptance remains with the owner in Phase 17. Compare with the
[approved reference](../../../design-reference/simplekit-v2-target.png).

| Page family | Screenshot gallery / report | Provenance |
| --- | --- | --- |
| Homepage, mobile menu, fallback and 200% text | [Final calculator + header/hero artifact](https://github.com/ashleysnl/simplekit-site/actions/runs/38839747189/artifacts/12021575030): `v2-header-hero/homepage-{320,375,390,768,1440,1920}.jpg`, `homepage-full.jpg`, menu/fallback/magnification specimens | Final candidate |
| CPP, Budget and the other 18 migrated calculators | Same artifact: `v2-calculator/<tool>-before-{375,390,1440}.jpg`, `<tool>-initial-{375,390,768,1440}.jpg`, populated and enlarged-text specimens | Final candidate; before images use independently saved pre-migration HTML/JS |
| TakeHomePay WebKit enlarged table | Same artifact: `v2-calculator/webkit-take-home-pay-calculator-text-200.jpg`; `calculator-browser.json` records native province selection, keyboard scrolling, final-column access and zero document overflow | Final candidate; all three engines pass |
| System reference pages, validation, keyboard, fallback, print | [Final system artifact](https://github.com/ashleysnl/simplekit-site/actions/runs/38839747189/artifacts/12020962135) | Final candidate; 33 reference layouts per engine, 11 clean axe states per engine, legacy isolation |
| Retirement/Mortgage pilots | [Pilot gallery](https://github.com/ashleysnl/simplekit-site/actions/runs/38548702694/artifacts/11885478737) | Retained unchanged templates/styles/financial code; final system run repeats all 22 fixtures and JSON/CSV/fallback checks |
| Articles, guides, directory and supporting pages | [Editorial gallery](https://github.com/ashleysnl/simplekit-site/actions/runs/38548702694/artifacts/11886495070) | Retained: published markup, metadata and referenced visual assets unchanged |
| Search, goals, featured tools, guided discovery | [Homepage suite gallery](https://github.com/ashleysnl/simplekit-site/actions/runs/38837029465/artifacts/12019961332) | Retained behavior/layout; final header/hero checks confirm explicit navy appearance |
| SEO/accessibility and performance | [Accessibility/SEO](https://github.com/ashleysnl/simplekit-site/actions/runs/38837029465/artifacts/12019269579), [Lighthouse](https://github.com/ashleysnl/simplekit-site/actions/runs/38837029465/artifacts/12019916731) | Unchanged inputs retained; affected calculator and hero checks refreshed |

Only four published files differ from the initial full-run archive: the Core
presentation helper, two homepage CSS outputs and TakeHomePay's scoped CSS.
No artifact file is removed. The [machine evidence](qa-evidence.json) records
why each retained suite applies; this index does not imply every suite reran on
the final commit. Artifact download sizes vary and GitHub retention is finite.

Automated screenshots are not physical-device, screen-reader or owner design
acceptance. The isolated demo has not been updated during this QA phase.
