# SimpleKit Tool URL Migration

This repo now uses a single source of truth for tool public URLs in `data/tool-registry.json`.

Each tool entry includes:

- `name`
- `slug`
- `subdomainUrl`
- `pathUrl`
- `status`

`status` controls the live public URL used throughout this repo:

- `subdomain` keeps the tool linked to its existing subdomain
- `path` switches the tool to its canonical `https://simplekit.app/<tool-slug>/` URL

## How to migrate one tool

1. Change that tool's `status` in `data/tool-registry.json` from `subdomain` to `path`.
2. Make sure the tool is marked complete in `data/tool-migration-tracker.json` and includes its `toolRepoPath`.
3. Run `npm run build`.
4. Commit and push this repo, then deploy the repo root output.

To migrate a tool, change its status in `data/tool-registry.json` from subdomain to path, regenerate if needed, then deploy this repo.

## What the build updates

- Rendered HTML pages from `templates/`
- Root path tool folders like `/cpp-calculator/` for completed path-mode tools
- `simplekit-active-tools.md`
- `sitemap.xml`
- `assets/tool-registry.js`
- `data/tool-link-audit.json`

## Notes

- Default behavior preserves current traffic by keeping every tool in `subdomain` mode.
- Only tools marked `path` are added to the root-domain calculator URLs in `sitemap.xml`.
- Tools marked `path` are only published into root path folders when their tracker entry is complete and has a valid `toolRepoPath`.
- The repo root is now the single deployable site output. There is no separate `publish/` bundle.
- The repo remains static-friendly: published files are plain HTML, CSS, JS, XML, and Markdown.
- `debt-to-income-ratio-calculator` remains in the registry because it is still linked in the current site, even though it was not part of the supplied migration list.
