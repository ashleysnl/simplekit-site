# SimpleKit V2 instructions

Follow [Git Branch Strategy — Mandatory](docs/SIMPLEKIT_V2_REDESIGN_PLAN.md#git-branch-strategy--mandatory) for every V2 task.

- Begin with a clean working tree, fetch origin, check out `develop-v2`, and synchronize with `git pull --ff-only origin develop-v2`. Preserve divergent or uncommitted work rather than resetting it.
- Verify previous completed tasks and any required temporary PRs are integrated into `develop-v2` before starting new work.
- Implement and commit validated V2 code, fixes, SEO, and documentation directly to `develop-v2`. Do not create persistent feature/phase/experiment/Codex branches. If a temporary branch is required, target its PR to `develop-v2` and integrate it promptly after validation.
- Keep the existing V2 plan, phase status, evidence, and outstanding checks current; do not equate branch consolidation with phase acceptance.
- Keep `main`, production root pages, source pins, and production hosting/deployments unchanged unless the task explicitly authorizes the relevant change. Release into `main` requires the plan's final QA and approved release PR; production deployment requires explicit authorization.
- Use the existing checkout; do not create another worktree unless requested. Edit authored landing templates, never copied calculator logic or downloaded source caches.
- Run source verification, `npm test`, build, SEO/output validation, the V2 preservation guard, and relevant browser checks. See `CLOUD_DEVELOPMENT.md` and `docs/v2/phase-04-verification.md` for commands and browser prerequisites.

Historical branches recorded in the branch audit are archival evidence, not destinations for new V2 work.
