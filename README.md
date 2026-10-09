# SimpleKit Main Site

SimpleKit is a static HTML/CSS/JavaScript site. Build it on Linux, Codex Cloud, or a local machine with Git and Node.js (the tested version is pinned in [.node-version](.node-version)). No npm package installation is required for the build.

```sh
git clone https://github.com/ashleysnl/simplekit-site.git
cd simplekit-site
git switch develop-v2
git pull --ff-only origin develop-v2
npm run sources:fetch
npm test
npm run build
npm run seo:validate
npm run output:validate
npm run preview
```

The preview serves `dist/` on port 8000. All generating scripts resolve paths from their own repository location. Downloaded sources live under ignored `.cache/calculator-sources/`; output lives under ignored `dist/`. Neither should be committed. The checked-in site root is preserved for the current GitHub Pages/Cloudflare hosting arrangement.

- [data/tools.json](data/tools.json): canonical calculator URLs and primary SEO settings.
- [data/site-pages.json](data/site-pages.json): existing guide and retirement subpage sitemap additions.
- [data/calculator-sources.json](data/calculator-sources.json): independent GitHub repositories pinned to full commits, including shared Core.
- [data/tool-migration-tracker.json](data/tool-migration-tracker.json): migration history with portable source IDs.
- [data/core-shell-migration-tracker.json](data/core-shell-migration-tracker.json): shared shell rollout status.

Edit landing-page sources in `templates/`, keep authored pages without templates in their existing route directories, and change calculator logic in its original repository. Add a tool to the canonical manifest, source lock, and tracker; use `{{toolUrl:tool-slug}}` in templates. Update source pins through reviewed pull requests.

`npm run seo:build` refreshes SEO files in an existing `dist/` build. SEO validation checks published links and canonical metadata without treating historical reports as production navigation.

See [CLOUD_DEVELOPMENT.md](CLOUD_DEVELOPMENT.md) for the dependency map, Codex Cloud setup, CI, manual Cloudflare previews, source revision updates, clean-environment results, and production deployment procedure. [SEO-MIGRATION.md](SEO-MIGRATION.md) and [CORE-SHELL-MIGRATION.md](CORE-SHELL-MIGRATION.md) cover the tool migration workflows.

The included Actions validate and prepare artifacts. Production merge and deployment remain separate approved actions.

SimpleKit V2 development uses only `develop-v2`; `main` stays stable until the approved release. Start by checking out and synchronizing `develop-v2`, commit validated V2 work there, and target it for any required temporary PR. See [Git Branch Strategy — Mandatory](docs/SIMPLEKIT_V2_REDESIGN_PLAN.md#git-branch-strategy--mandatory) for the binding workflow and [branch audit](docs/v2/branch-consolidation-2026-10-09.md) for historical branches. Production deployment requires explicit approval.
