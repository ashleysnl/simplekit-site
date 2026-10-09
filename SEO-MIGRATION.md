# SimpleKit Tool URL Migration

[data/tools.json](data/tools.json) remains the authoritative calculator canonical URL manifest. Existing guide/subpage sitemap additions live in [data/site-pages.json](data/site-pages.json). Do not put retired compatibility routes in the sitemap.

To migrate a tool, update its independent GitHub repository first. Pin the reviewed full commit in [data/calculator-sources.json](data/calculator-sources.json) and set the matching `sourceId` in [data/tool-migration-tracker.json](data/tool-migration-tracker.json). No local tool repository paths are used.

Run:

```sh
npm run sources:fetch
npm test
npm run build
npm run seo:validate
npm run output:validate
```

The build writes rendered templates, all 22 calculator route directories, pinned Core assets, robots, sitemap, active tools, and compatibility registries into ignored `dist/`. The tracked site root stays unchanged for the existing hosting arrangement. Deploy `dist/` only after separate approval and hosting configuration review; pushing `develop-v2` does not deploy it through these workflows.

The validator checks both published source pages/templates and the generated bundle. Historical `docs/` reports and named developer Markdown documents are omitted from source link checks because they are not copied into the bundle. They are **not** excluded when validating deployment output. Only the generated compatibility registries retain intentional legacy identities; navigation code, HTML, CSS, robots, and sitemaps remain subject to legacy-link checks.

The 13 retired `/tools/<calculator>/` pages retain their noindex/canonical/refresh fallback behavior and now use the same canonical destination for Open Graph metadata. Cloudflare's existing edge redirects are unchanged.

See [CLOUD_DEVELOPMENT.md](CLOUD_DEVELOPMENT.md) for source updates, previews, validation, and the separately approved production procedure.

For V2 SEO and migration documentation updates, follow [Git Branch Strategy — Mandatory](docs/SIMPLEKIT_V2_REDESIGN_PLAN.md#git-branch-strategy--mandatory): synchronize and work on `develop-v2`, and target it for any required temporary PR.
