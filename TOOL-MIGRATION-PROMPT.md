# SimpleKit Tool Migration Prompt

Use the existing `ashleysnl/simplekit-site` checkout in Codex Cloud. Tasks already run in isolated environments; do not create a worktree unless explicitly requested.

For V2 work, begin on synchronized `develop-v2` in the site and owning sources. Follow [the maintained Core authoring contract](https://github.com/ashleysnl/SimpleKit-Core/blob/49de30920a878b4b23c09a9803b7cacf3d1d41ba/docs/v2-authoring/README.md); reuse existing migrations and one pinned local shared shell. Keep main and production unchanged. Commit/push to develop-v2; if a temporary PR is required, target develop-v2.

Read `data/tools.json`, `data/calculator-sources.json`, both migration trackers, `SEO-MIGRATION.md`, and `CLOUD_DEVELOPMENT.md`.

Select the requested tool, preserve its independent GitHub repository, and make only the changes needed to support its canonical `https://simplekit.app/<slug>/` route. Do not rebuild calculators, change unrelated calculation logic, introduce iframes, or merge/deploy automatically.

For ongoing V2 implementation batches, use the current roadmap cadence: inspect the diff, build once per coherent batch and check touched behavior; defer the comprehensive checklist below to Phase 16. Keep unverified implementation `[~]`. The checklist remains a final acceptance gate for new route migrations and release, rather than a requirement to repeat every suite after a styling batch.

For a completed migration:

1. Review and merge the authorized source change in that calculator's repository separately.
2. Set its full 40-character commit revision in `data/calculator-sources.json`. Never use a branch or local filesystem path as a source pin.
3. Set its `sourceId` in `data/tool-migration-tracker.json` to its slug. Preserve tracker order and migration history.
4. Run `npm run sources:fetch`, `npm test`, `npm run build`, `npm run seo:validate`, and `npm run output:validate`.
5. Verify `dist/<slug>/index.html`, canonical metadata, related links, runtime navigation, and calculator interaction before marking completion.
6. Update `completed`, `completedAt`, and `notes` only after verification. Open a pull request with the exact source revision and validation evidence.

The canonical URL source of truth is `data/tools.json`; the compatibility registry is generated. Deployment output is `dist/`. Temporary source checkouts are ignored under `.cache/calculator-sources/`. Production deployment requires separate approval; see `CLOUD_DEVELOPMENT.md`.
