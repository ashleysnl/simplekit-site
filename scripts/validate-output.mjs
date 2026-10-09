import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repoRoot, outputRoot } from "./paths.mjs";
import { loadSeoManifest, runSeoValidation } from "./seo-utils.mjs";

export function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), `Unexpected symlink: ${filename}`);
    return entry.isDirectory() ? filesIn(filename) : [filename];
  });
}

export function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(match => [match[1].toLowerCase(), match[3]]));
}

export function resolveLocal(url, filename, root, host) {
  if (/^(?:data:|mailto:|tel:|javascript:|#)/i.test(url)) return null;
  const relative = path.relative(root, filename).split(path.sep).join("/");
  const resolved = new URL(url.replaceAll("&amp;", "&"), `${host}/${relative}`);
  if (resolved.origin !== new URL(host).origin) return null;
  const pathname = decodeURIComponent(resolved.pathname);
  const target = path.resolve(root, `.${pathname}`);
  assert(target.startsWith(`${path.resolve(root)}${path.sep}`) || target === path.resolve(root), `Asset escapes output: ${url}`);
  return target;
}

export function validateOutput(root = outputRoot, manifest = loadSeoManifest(repoRoot)) {
  assert(existsSync(root), "Run npm run build first");
  runSeoValidation(manifest, root, { published: true });
  const files = filesIn(root);
  assert(!files.some(file => /(?:^|\/)(?:\.git|\.cache|node_modules|scripts|templates|docs|tests|\.github)(?:\/|$)/.test(path.relative(root, file))), "Non-site files in bundle");
  const sitemap = readFileSync(path.join(root, "sitemap.xml"), "utf8");
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  const expected = [...manifest.site.pages.filter(p => p.includeInSitemap !== false).map(p => p.loc), ...manifest.tools.filter(t => t.includeInSitemap).map(t => t.canonicalUrl)];
  assert.deepEqual([...locations].sort(), [...new Set(expected)].sort(), "Sitemap differs from canonical inventory");
  assert(readFileSync(path.join(root, "robots.txt"), "utf8").includes(`Sitemap: ${manifest.site.robots.sitemap}`), "Incorrect robots sitemap");
  for (const url of locations) {
    const location = resolveLocal(url, path.join(root, "index.html"), root, manifest.site.canonicalHost);
    assert(location, `Non-canonical sitemap URL: ${url}`);
    const filename = url.endsWith("/") ? path.join(location, "index.html") : location;
    assert(existsSync(filename), `Missing canonical route: ${url}`);
  }
  let pages = 0;
  const assets = new Set();
  for (const filename of files.filter(file => file.endsWith(".html"))) {
    pages++;
    const html = readFileSync(filename, "utf8");
    assert(!/\{\{(?:toolUrl:|toolCount)/.test(html), `Unrendered token: ${filename}`);
    const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0])).filter(a => a.rel === "canonical");
    const relative = path.relative(root, filename).split(path.sep).join("/");
    const ownUrl = `${manifest.site.canonicalHost}/${relative.replace(/index\.html$/, "")}`;
    const isCanonicalRoute = locations.includes(ownUrl);
    if (isCanonicalRoute) assert.equal(canonical.length, 1, `Expected one canonical: ${relative}`);
    for (const link of canonical) {
      assert(locations.includes(link.href), `Unknown canonical ${link.href} in ${relative}`);
      if (isCanonicalRoute) assert.equal(link.href, ownUrl, `Incorrect canonical in ${relative}`);
      const socialUrls = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0])).filter(a => a.property === "og:url");
      for (const social of socialUrls) assert.equal(social.content, link.href, `Open Graph URL differs from canonical in ${relative}`);
    }
    for (const match of html.matchAll(/<(?:script|img|link)\b[^>]*>/gi)) {
      const attrs = attributes(match[0]);
      const reference = attrs.src || (attrs.rel === "stylesheet" || attrs.rel === "icon" || attrs.rel === "manifest" ? attrs.href : null);
      if (!reference) continue;
      assert(!reference.startsWith("https://core.simplekit.app/"), `Unbundled Core asset in ${relative}`);
      const target = resolveLocal(reference, filename, root, manifest.site.canonicalHost);
      if (!target) continue;
      assert(existsSync(target) && statSync(target).isFile() && statSync(target).size > 0, `Missing local asset ${reference} in ${relative}`);
      assets.add(target);
    }
  }
  // Include CSS resources and ES-module imports, even when a page uses a
  // classic bundle today. Shipping a broken alternative module is an error.
  for (const filename of files.filter(file => /\.(?:css|js)$/.test(file))) {
    const text = readFileSync(filename, "utf8");
    const references = filename.endsWith(".css")
      ? [...text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)].map(m => m[1])
      : [...text.matchAll(/(?:\bfrom\s*|\bimport\s*)(["'])([^"']+)\1/g)].map(m => m[2]).filter(url => url.startsWith(".") || url.startsWith("/"));
    for (const reference of references) {
      const target = resolveLocal(reference, filename, root, manifest.site.canonicalHost);
      if (!target) continue;
      assert(existsSync(target) && statSync(target).isFile(), `Missing dependency ${reference} in ${path.relative(root, filename)}`);
      assets.add(target);
    }
  }
  console.log(`Output validation passed: ${manifest.tools.length} calculator routes, ${locations.length} sitemap URLs, ${pages} HTML pages, ${assets.size} local assets.`);
  return { calculators: manifest.tools.length, sitemapUrls: locations.length, pages, assets: assets.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) validateOutput();
