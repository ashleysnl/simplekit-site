# SimpleKit Main Site

This repo is the landing-page and SEO control plane for SimpleKit.

## Source Of Truth

SEO and canonical tool URLs live in [data/tools.json](/Users/AshleySkinner/Documents/00_Engineering/04_Code/52_SimpleKit%20V4/data/tools.json).

Add new tools there first. The manifest drives:

- landing-page tool URLs
- `robots.txt`
- `sitemap.xml`
- the compatibility registry in `data/tool-registry.json`
- the browser helper in `assets/tool-registry.js`

## Common Commands

- `npm run build`
  Rebuilds the site, regenerates `robots.txt` and `sitemap.xml`, refreshes `data/tool-registry.json`, and renders the static site from `templates/`.

- `npm run seo:build`
  Regenerates just the SEO outputs from the manifest.

- `npm run seo:validate`
  Validates the manifest and fails if canonical URLs drift or legacy subdomain links still appear in repo content.

## Add A New Tool

1. Add the tool to [data/tools.json](/Users/AshleySkinner/Documents/00_Engineering/04_Code/52_SimpleKit%20V4/data/tools.json).
2. Use `{{toolUrl:tool-slug}}` tokens in templates instead of hardcoded URLs.
3. Run `npm run seo:validate`.
4. Run `npm run build`.

## Notes

- Canonical production URLs should follow `https://simplekit.app/<slug>/`.
- Legacy subdomains can remain live, but this repo should only promote canonical path URLs in SEO outputs.
- `data/tool-registry.json` is still generated for compatibility with the existing migration workflow, but it should not be edited by hand.
