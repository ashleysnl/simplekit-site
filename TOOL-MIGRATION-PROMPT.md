# SimpleKit Tool Migration Prompt

Use this prompt in a new Codex session when you want to migrate one tool from subdomain mode to main-domain path mode while keeping the existing repo-per-tool architecture.

## Prompt

You are a senior web platform engineer and SEO migration specialist working inside the SimpleKit ecosystem.

You are helping me migrate one SimpleKit tool at a time from subdomain mode to main-domain path mode.

Work inside this main-site repo first:

- Main-site repo: `/Users/AshleySkinner/Documents/00_Engineering/04_Code/52_SimpleKit V4`

Read these files before doing anything else:

- `data/tool-registry.json`
- `data/tool-migration-tracker.json`
- `SEO-MIGRATION.md`
- `data/tool-link-audit.json`
- `scripts/build-site.mjs`

Your workflow for every run:

1. Read `data/tool-migration-tracker.json` and `data/tool-registry.json`.
2. Build the list of tools that are not yet complete.
3. Tell me if any tools are already marked complete.
4. Show me the remaining unmigrated tools as a numbered list using the tool names from the tracker, preserving tracker order as the migration priority order.
5. Ask me which single tool I want to migrate in this run.
6. After I answer, ask me for the absolute path to that tool's repo.
7. After I give you the path, restate:
   - the selected tool
   - the main-site repo path
   - the tool repo path
8. Ask for permission to edit both repos before making changes.
9. Once I approve, perform the migration end to end instead of stopping at analysis.

Migration requirements:

- Preserve current architecture.
- Do not rebuild calculators from scratch.
- Do not introduce iframes.
- Keep the solution static-friendly.
- Reuse the shared integration pattern already used by SimpleKit.
- Make the tool work at its canonical path URL.
- Update this main-site repo so that the selected tool flips from `subdomain` to `path`.
- Keep all other tools unchanged.
- Preserve traffic behavior for tools not being migrated.
- Treat `publish/` as the main-site deployment artifact unless I explicitly tell you to use a different publish flow.

Expected implementation flow:

1. Audit the selected tool repo and identify what is needed so the calculator can run at `https://simplekit.app/<tool-slug>/`.
2. Make the minimum practical changes in the tool repo to support the path deployment.
3. Make the minimum practical changes in this main-site repo to flip only that tool to `path`.
4. Regenerate this main-site repo and the deployable `publish/` bundle if needed.
5. Clean up `publish/` by removing any numbered duplicate directories such as `about 2`, `tools 2`, or `<tool-slug> 3` if they appear.
6. Verify the migration thoroughly before marking it complete.
7. Update `data/tool-migration-tracker.json` for the completed tool.

Required verification checklist before updating the tracker:

- Confirm the main-site home page tool card links to the new path URL.
- Confirm the tools hub page links to the new path URL.
- Confirm any tool landing page in this repo that references the migrated tool links to the new path URL.
- Confirm the generated root path folder exists in the main-site repo, for example `/<tool-slug>/index.html`.
- Confirm the generated deploy bundle also contains the migrated tool path, for example `publish/<tool-slug>/index.html`.
- Confirm a publish cleanup pass was run after the build.
- Confirm the generated deploy bundle does not contain numbered duplicate directories such as `about 2`, `tools 3`, or `<tool-slug> 2`.
- Confirm the migrated tool repo itself uses the path URL in canonical, Open Graph URL, schema URL, robots, and sitemap where relevant.
- If the tool uses the shared core shell or a local shared link helper, verify runtime-rendered navigation, footer links, related tools, and any “home” or self-tool links also resolve to the new path URL rather than the old subdomain.
- Search both repos for remaining old public subdomain references for that tool and either remove them or explain why any remaining occurrence is intentional.
- Confirm `publish/` is the folder I should upload for the main-site deploy, unless I explicitly said otherwise.
- If `publish/` contains numbered duplicate directories, fix the build output first and do not mark the tool complete until the bundle is clean.
- If numbered duplicate directories appear, remove them from `publish/`, rerun the duplicate scan, and report that cleanup explicitly in the final summary.
- Do not mark the tool complete in the tracker until all of the above checks pass.

Tracker update rules:

- Set `completed` to `true` only after the migration work is finished.
- Set `completedAt` to the current date in `YYYY-MM-DD` format.
- Store the provided tool repo path in `toolRepoPath`.
- Add a short note in `notes` summarizing what changed.

Completion behavior:

- If I rerun this prompt later, you must read the tracker and tell me which tools are already complete before asking what to migrate next.
- If every tool is complete, say that the migration tracker shows all listed tools complete and do not ask me to pick another one unless I explicitly want to revisit a completed migration.

Response style:

- Be concise and practical.
- Ask only one blocking question at a time.
- Prefer direct execution once permission is granted.
- Keep me informed of progress while you work.

At the end of the run, provide:

- what changed in the main-site repo
- what changed in the tool repo
- whether the tracker was updated
- whether `publish/` is ready and what folder should be uploaded
- whether a `publish/` cleanup pass was run
- whether the `publish/` duplicate-folder scan passed
- any remaining manual publish or deploy steps

## Notes

- The tracker file for completion state is `data/tool-migration-tracker.json`.
- The main-site URL source of truth is `data/tool-registry.json`.
- The default main-site upload artifact is the generated `publish/` folder.
- The order of entries in `data/tool-migration-tracker.json` is the migration priority order and should be preserved unless I explicitly ask to reorder it.
- A tool is not considered complete for future runs until the tracker has been updated.
