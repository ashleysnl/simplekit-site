# SimpleKit Tool Migration Prompt

Use the existing `ashleysnl/simplekit-site` checkout in Codex Cloud. Tasks already run in isolated environments; do not create a worktree unless explicitly requested.

Read `data/tools.json`, `data/calculator-sources.json`, both migration trackers, `SEO-MIGRATION.md`, and `CLOUD_DEVELOPMENT.md`.

Select the requested tool, preserve its independent GitHub repository, and make only the changes needed to support its canonical `https://simplekit.app/<slug>/` route. Do not rebuild calculators, change unrelated calculation logic, introduce iframes, or merge/deploy automatically.

For a completed migration:

1. Review and merge the authorized source change in that calculator's repository separately.
2. Set its full 40-character commit revision in `data/calculator-sources.json`. Never use a branch or local filesystem path as a source pin.
3. Set its `sourceId` in `data/tool-migration-tracker.json` to its slug. Preserve tracker order and migration history.
4. Run `npm run sources:fetch`, `npm test`, `npm run build`, `npm run seo:validate`, and `npm run output:validate`.
5. Verify `dist/<slug>/index.html`, canonical metadata, related links, runtime navigation, and calculator interaction before marking completion.
6. Update `completed`, `completedAt`, and `notes` only after verification. Open a pull request with the exact source revision and validation evidence.

The canonical URL source of truth is `data/tools.json`; the compatibility registry is generated. Deployment output is `dist/`. Temporary source checkouts are ignored under `.cache/calculator-sources/`. Production deployment requires separate approval; see `CLOUD_DEVELOPMENT.md`.
