# Cloud-native validation — October 9, 2026

## Tested revision and environment

Build implementation: `a0666afc3d7e2889ac584aba5c1410eb0746cdef` on `feat/cloud-native-build`, based on main `997f5e0b82da88d2177a830c9129419cd7be0719`. The follow-up review commit adds this report and the reusable optional browser smoke script; build inputs and implementation are unchanged.

A new checkout was cloned from GitHub into `/tmp/simplekit-clean-checkout` using `git clone --single-branch --branch feat/cloud-native-build https://github.com/ashleysnl/simplekit-site.git`. It initially contained neither `dist/` nor `.cache/`. All 23 dependency repositories were fetched from their pinned GitHub commits, without using the earlier source-audit checkouts. `/Users` did not exist on the Linux machine.

Tools: Node **24.19.0**, npm **11.9.0**, Chromium **151.0.7922.173** on Debian Linux, optional Playwright **1.56.1**. Build/unit checks require only Node and Git.

## Exact results

| Check | Result |
| --- | --- |
| `npm run sources:fetch` from empty cache | Exit 0; 23 exact GitHub revisions fetched/verified (22 calculators + Core). |
| `npm test` | Exit 0; **11 tests passed, 0 failed, 0 skipped/cancelled**. |
| `npm run build` | Exit 0; **22 calculator routes** generated. |
| `npm run seo:validate` | Exit 0; source and published output passed. |
| `npm run output:validate` | Exit 0; **53 sitemap URLs, 67 HTML pages, 133 local asset/dependency targets** checked. |
| Repeat build | **278 files** with exactly identical SHA256 maps before/after rebuilding. |
| Working-directory independence | Fetch, SEO generation/validation, output validation and build scripts invoked by absolute filename from `/tmp`; all exited 0. |
| Clean checkout status | `git status --porcelain=v1` empty after all generating/check commands. |
| HTTP preview | **278/278 files** returned HTTP 200, exact bytes and `X-Robots-Tag: noindex, nofollow`. |
| Sitemap preservation | Generated and original sitemap URL sets identical: **53 URLs**; `data/tools.json` unchanged. |
| JavaScript integrity | All **94** generated calculator JS files identical to pinned upstream files. This includes all **32** previously checked-in JS files; **62** browser modules omitted by the old copy filter are included unchanged. |
| Chromium smoke | **22/22** calculator pages loaded; Core navigation mounted on every route; **0 page errors, 0 failed local responses**. |
| Functional interaction | Doubling the mortgage principal changed rounded monthly payment from **$2,860 to $5,721**, within $1 of double. |
| Actions syntax/semantics | Both workflows parsed; **actionlint 1.7.7 passed**, its Linux binary verified against the official release SHA256 checksum. |
| GitHub-hosted validation | [Run 37928920339](https://github.com/ashleysnl/simplekit-site/actions/runs/37928920339), implementation commit `a0666af`, **Success**, total duration **29 seconds**. |
| Wrangler preview command | Wrangler **4.45.0** `pages deploy --help` exited 0 with supported `--project-name` and `--branch` options; no upload executed. |

The tests exercise immutable source declarations, cache edits/ignored files/origin changes, historical documentation scope, legacy URLs in HTML/robots/sitemap/navigation JS, compatibility registry exceptions, canonical routes, URL resolution, Core module loading and missing output assets/module imports.

The browser smoke test stubs unrelated external requests, including analytics. It loads real local calculator JavaScript and bundled Core, checks all initial pages and one mortgage interaction. It is not an exhaustive numerical test suite for all 22 calculators or a live analytics verification. Calculator logic was not modified.

## Reproduce browser verification

Start `npm run preview` from the repository in one terminal. Chromium must be available. In another terminal, install the optional test dependency outside the checkout and run the committed smoke script:

```sh
browser_test_dir=$(mktemp -d)
npm --cache "$browser_test_dir/cache" install --prefix "$browser_test_dir" --no-package-lock --no-audit --no-fund playwright@1.56.1
NODE_PATH="$browser_test_dir/node_modules" CHROMIUM_PATH=/usr/bin/chromium node tests/browser-smoke.cjs
```

Set `SIMPLEKIT_PREVIEW_URL` if using another loopback port. The script refuses a production hostname. Playwright is not a build dependency and no browser package is committed. The clean-checkout test used port 8002.

## Diagnosed issues and retained behavior

- Absolute Mac source paths and cwd-dependent scripts were replaced with pinned GitHub sources and module-relative paths.
- The old generator would lose **19 existing sitemap entries**; a supplemental page inventory preserves them without editing the calculator canonical manifest.
- Templates lagged behind published page edits. They now preserve current author/source sections, related links and retired route fallbacks.
- The historical redirect report caused the original SEO failure. Source documentation is now scoped out because it is not deployed; production HTML/JS/robots/sitemap checks remain strict and have regression tests.
- Retired compatibility pages had Open Graph URLs differing from canonical destinations. Generated fallback metadata is now consistent.
- Retirement Planner's original classic Core tag produced `Unexpected token 'export'` with the pinned Core module. Generated HTML now loads Core as a module. Core implementation and calculator implementations remain untouched.
- The old copy filter omitted Retirement Planner's `src/` module dependencies. Unchanged upstream browser modules are now shipped.

## Outstanding external steps

The feature branch is pushed and reviewable. Creating a PR through `gh` is blocked by a **Forbidden** response for `api.github.com` under the current cloud egress policy; native Git read/push already succeeded. The environment draft includes that domain for review. After applying the network setting, retry GitHub API access before requesting any new credential. Do not supply tokens in chat.

The Cloudflare preview workflow is prepared and linted but **not dispatched or deployed**. The owner confirmed no preview project exists. Create and protect the dedicated preview-only project/environment as documented in `CLOUD_DEVELOPMENT.md` before using it. Existing live Cloudflare account settings were unavailable; no DNS, redirects or production hosting were changed.

Production has **not** been merged or deployed. A future approved deployment must confirm the actual Pages publishing settings and adopt the validated `dist/` artifact through a separately reviewed publishing change. The existing tracked root/CNAME are preserved.
