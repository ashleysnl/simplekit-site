import { test } from "node:test";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadSources, verifySource } from "../scripts/acquire-sources.mjs";
import { localizeCoreHtml } from "../scripts/site-html.mjs";
import { loadSeoManifest, runSeoValidation, findLegacySubdomainReferences } from "../scripts/seo-utils.mjs";
import { repoRoot } from "../scripts/paths.mjs";
import { resolveLocal } from "../scripts/validate-output.mjs";
import { validateOutput } from "../scripts/validate-output.mjs";

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "simplekit-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test("every canonical calculator has one completed, immutable GitHub source", () => {
  const sources = loadSources();
  const manifest = loadSeoManifest(repoRoot);
  const tracker = JSON.parse(readFileSync(path.join(repoRoot, "data/tool-migration-tracker.json"), "utf8"));
  assert.equal(sources.length, manifest.tools.length + 1);
  assert.equal(tracker.length, manifest.tools.length);
  for (const tool of manifest.tools) {
    assert.equal(sources.filter(s => s.id === tool.slug).length, 1);
    assert(tracker.some(t => t.id === tool.slug && t.sourceId === tool.slug && t.completed));
  }
  assert(sources.some(s => s.id === "simplekit-core"));
});

test("source acquisition rejects branch pins, duplicate IDs and traversal", t => {
  const root = fixture(t);
  mkdirSync(path.join(root, "data"));
  const good = { id: "test-tool", repository: "owner/repo", revision: "a".repeat(40) };
  for (const sources of [[{ ...good, revision: "main" }], [good, good], [{ ...good, id: "../outside" }], [{ ...good, repository: "https://example.com/repo" }]]) {
    writeFileSync(path.join(root, "data/calculator-sources.json"), JSON.stringify({ version: 1, sources }));
    assert.throws(() => loadSources(root));
  }
});

test("historical reports are excluded only in source checks; published legacy links fail", t => {
  const root = fixture(t);
  const manifest = loadSeoManifest(repoRoot);
  const legacy = manifest.tools[0].legacySubdomain;
  mkdirSync(path.join(root, "docs/seo"), { recursive: true });
  writeFileSync(path.join(root, "docs/seo/report.json"), JSON.stringify({ legacy }));
  assert.equal(findLegacySubdomainReferences(root, manifest).length, 0);
  assert.throws(() => runSeoValidation(manifest, root, { published: true }), /Legacy subdomain/);
  writeFileSync(path.join(root, "index.html"), `<a href="${legacy}">Old link</a>`);
  assert.throws(() => runSeoValidation(manifest, root), /Legacy subdomain/);
});

test("SEO checks reject legacy URLs in robots, sitemap and browser code", t => {
  const root = fixture(t);
  const manifest = loadSeoManifest(repoRoot);
  for (const name of ["robots.txt", "sitemap.xml", "navigation.js"]) {
    writeFileSync(path.join(root, name), manifest.tools[0].legacySubdomain);
    assert.throws(() => runSeoValidation(manifest, root, { published: true }), /Legacy subdomain/);
    rmSync(path.join(root, name));
  }
});

test("intentional compatibility registry is allowed, adjacent production files are checked", t => {
  const root = fixture(t);
  const manifest = loadSeoManifest(repoRoot);
  mkdirSync(path.join(root, "assets"));
  writeFileSync(path.join(root, "assets/tool-registry.js"), manifest.tools[0].legacySubdomain);
  assert.doesNotThrow(() => runSeoValidation(manifest, root, { published: true }));
  writeFileSync(path.join(root, "assets/navigation.js"), manifest.tools[0].legacySubdomain);
  assert.throws(() => runSeoValidation(manifest, root, { published: true }), /Legacy subdomain/);
});

test("canonical manifest rejects mismatched, duplicate and unsafe routes", t => {
  const root = fixture(t);
  for (const mutate of [m => m.tools[0].canonicalUrl = m.tools[0].legacySubdomain, m => m.tools.push(m.tools[0]), m => m.tools[0].canonicalPath = "/../outside/", m => m.site.pages[0].loc = "https://wrong.example/"]) {
    const manifest = loadSeoManifest(repoRoot);
    mutate(manifest);
    assert.throws(() => runSeoValidation(manifest, root, { scanRepo: false }));
  }
});

test("all restored sitemap routes still resolve to the same canonical host", t => {
  const manifest = loadSeoManifest(repoRoot);
  assert.equal(manifest.site.pages.length + manifest.tools.length, 53);
  runSeoValidation(manifest, fixture(t), { scanRepo: false });
});

test("URL resolver handles relative/query assets and refuses external or encoded traversal", t => {
  const root = fixture(t);
  const file = path.join(root, "tool/index.html");
  assert.equal(resolveLocal("../assets/site.css?v=2", file, root, "https://simplekit.app"), path.join(root, "assets/site.css"));
  assert.equal(resolveLocal("https://external.example/a.js", file, root, "https://simplekit.app"), null);
  assert.throws(() => resolveLocal("/%2e%2e%2foutside", file, root, "https://simplekit.app"));
});

test("bundled Core loads as an ES module for classic and module callers", () => {
  const classic = '<script src="https://core.simplekit.app/core.js" defer></script>';
  const module = '<script type="module" src="https://core.simplekit.app/core.js"></script>';
  for (const script of [classic, module]) {
    const localized = localizeCoreHtml(script);
    assert(localized.includes('type="module"'));
    assert(localized.includes('src="/assets/core/core.js"'));
    assert.equal(localizeCoreHtml(localized), localized);
  }
  assert.equal(localizeCoreHtml('<script src="./app.classic.js" defer></script>'), '<script src="./app.classic.js" defer></script>');
});

test("cached sources fail verification after edits, ignored files, or origin changes", t => {
  const root = fixture(t);
  const git = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init", "--quiet");
  git("remote", "add", "origin", "https://github.com/owner/repo.git");
  writeFileSync(path.join(root, "index.html"), "original");
  writeFileSync(path.join(root, ".gitignore"), "ignored.txt\n");
  git("add", ".");
  git("-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "--quiet", "-m", "Fixture");
  const source = { id: "fixture", repository: "owner/repo", revision: git("rev-parse", "HEAD") };
  assert.doesNotThrow(() => verifySource(source, root));
  writeFileSync(path.join(root, "index.html"), "edited");
  assert.throws(() => verifySource(source, root), /cache changed/);
  writeFileSync(path.join(root, "index.html"), "original");
  writeFileSync(path.join(root, "ignored.txt"), "unexpected");
  assert.throws(() => verifySource(source, root), /cache changed/);
  rmSync(path.join(root, "ignored.txt"));
  git("remote", "set-url", "origin", "https://github.com/wrong/repo.git");
  assert.throws(() => verifySource(source, root), /cache changed/);
});

test("output checks detect wrong metadata, missing assets and module dependencies", t => {
  const root = fixture(t);
  const manifest = loadSeoManifest(repoRoot);
  manifest.site.pages = [];
  manifest.tools = [manifest.tools[0]];
  const tool = manifest.tools[0];
  const directory = path.join(root, tool.slug);
  mkdirSync(directory);
  writeFileSync(path.join(root, "sitemap.xml"), `<urlset><url><loc>${tool.canonicalUrl}</loc></url></urlset>`);
  writeFileSync(path.join(root, "robots.txt"), `Sitemap: ${manifest.site.robots.sitemap}`);
  const html = `<html><link rel="canonical" href="${tool.canonicalUrl}"><meta property="og:url" content="${tool.canonicalUrl}"><script src="./app.js"></script></html>`;
  writeFileSync(path.join(directory, "index.html"), html);
  assert.throws(() => validateOutput(root, manifest), /Missing local asset/);
  writeFileSync(path.join(directory, "app.js"), 'import "./missing.js";');
  assert.throws(() => validateOutput(root, manifest), /Missing dependency/);
  writeFileSync(path.join(directory, "app.js"), "console.log('ok');");
  assert.doesNotThrow(() => validateOutput(root, manifest));
  writeFileSync(path.join(directory, "index.html"), html.replace(`content="${tool.canonicalUrl}"`, 'content="https://simplekit.app/wrong/"'));
  assert.throws(() => validateOutput(root, manifest), /Open Graph URL/);
});
