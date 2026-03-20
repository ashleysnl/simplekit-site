# SimpleKit Tool URL Migration

This repo now uses a single source of truth for tool public URLs and SEO metadata in `data/tools.json`.

Each tool entry includes:

- `name`
- `slug`
- `canonicalPath`
- `canonicalUrl`
- `legacySubdomain`
- `includeInSitemap`

This manifest is the SEO control plane for the site. The landing pages, `robots.txt`, and `sitemap.xml` are generated from it.

## How to migrate one tool

1. Add or update that tool in `data/tools.json` with its canonical `https://simplekit.app/<tool-slug>/` URL.
2. Make sure the tool is marked complete in `data/tool-migration-tracker.json` and includes its `toolRepoPath`.
3. Run `npm run build`.
4. Commit and push this repo, then deploy the repo root output.

To migrate a tool, update `data/tools.json`, regenerate with `npm run build`, then deploy this repo.

## What the build updates

- Rendered HTML pages from `templates/`
- Root path tool folders like `/cpp-calculator/` for completed path-mode tools
- `robots.txt`
- `simplekit-active-tools.md`
- `sitemap.xml`
- `assets/tool-registry.js`
- `data/tool-registry.json`
- `data/tool-link-audit.json`

## Notes

- Canonical path URLs now drive SEO output, even if legacy subdomains still exist.
- Completed tools are only published into root path folders when their tracker entry is complete and has a valid `toolRepoPath`.
- The repo root is now the single deployable site output. There is no separate `publish/` bundle.
- The repo remains static-friendly: published files are plain HTML, CSS, JS, XML, and Markdown.
- `data/tool-registry.json` remains as a generated compatibility file for the existing migration workflow. Edit `data/tools.json` instead.
