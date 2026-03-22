import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const manifestPath = ["data", "tools.json"];
const textFilePattern = /\.(html|md|txt|xml|js|json|webmanifest|css)$/i;

export function loadSeoManifest(repoRoot) {
  const absolutePath = path.join(repoRoot, ...manifestPath);
  const manifest = JSON.parse(readFileSync(absolutePath, "utf8"));

  if (!manifest.site || !Array.isArray(manifest.tools)) {
    throw new Error(`SEO manifest at ${absolutePath} must contain "site" and "tools"`);
  }

  return manifest;
}

export function getCanonicalToolRegistry(manifest) {
  return manifest.tools.map((tool) => ({
    id: tool.slug,
    name: tool.name,
    slug: tool.slug,
    subdomainUrl: tool.legacySubdomain,
    pathUrl: tool.canonicalUrl,
    status: "path",
    currentPublicUrl: tool.canonicalUrl
  }));
}

export function getManifestToolMap(manifest) {
  return new Map(manifest.tools.map((tool) => [tool.slug, tool]));
}

export function getTemplateToolUrls(manifest) {
  return Object.fromEntries(manifest.tools.map((tool) => [tool.slug, tool.canonicalUrl]));
}

export function runSeoValidation(manifest, repoRoot, options = {}) {
  const { scanRepo = true } = options;
  const issues = [];
  const slugSet = new Set();
  const urlSet = new Set();
  const host = manifest.site.canonicalHost.replace(/\/$/, "");
  const toolCanonicalUrlSet = new Set();
  const sitePageUrlSet = new Set();

  for (const page of manifest.site.pages || []) {
    if (!page.loc) {
      issues.push("Site page entry is missing loc");
      continue;
    }

    if (!page.loc.startsWith("http://") && !page.loc.startsWith("https://")) {
      issues.push(`Site page loc must be an absolute URL: ${page.loc}`);
    }

    if (page.loc.includes("?")) {
      issues.push(`Site page loc must not include query parameters: ${page.loc}`);
    }

    if (sitePageUrlSet.has(page.loc)) {
      issues.push(`Duplicate site page URL found: ${page.loc}`);
    }
    sitePageUrlSet.add(page.loc);
  }

  for (const tool of manifest.tools) {
    if (!tool.slug) {
      issues.push(`Tool "${tool.name || "Unnamed tool"}" is missing slug`);
    }

    if (slugSet.has(tool.slug)) {
      issues.push(`Duplicate slug found: ${tool.slug}`);
    }
    slugSet.add(tool.slug);

    if (tool.canonicalUrl && urlSet.has(tool.canonicalUrl)) {
      issues.push(`Duplicate canonical URL found: ${tool.canonicalUrl}`);
    }
    urlSet.add(tool.canonicalUrl);

    if (tool.includeInSitemap && !tool.canonicalUrl) {
      issues.push(`Tool "${tool.slug}" has includeInSitemap=true but canonicalUrl is missing`);
    }

    const expectedUrl = `${host}${tool.canonicalPath}`;
    if (tool.canonicalUrl !== expectedUrl) {
      issues.push(`Tool "${tool.slug}" canonicalUrl must equal canonicalHost + canonicalPath (${expectedUrl})`);
    }

    toolCanonicalUrlSet.add(tool.canonicalUrl);
  }

  for (const pageUrl of sitePageUrlSet) {
    if (toolCanonicalUrlSet.has(pageUrl)) {
      issues.push(`Site page URL duplicates a canonical tool URL: ${pageUrl}`);
    }
  }

  if (scanRepo) {
    const legacyMatches = findLegacySubdomainReferences(repoRoot, manifest);
    if (legacyMatches.length > 0) {
      const formatted = legacyMatches
        .map((match) => `${match.file}: ${match.url}`)
        .join("\n");
      issues.push(`Legacy subdomain URLs found in repo content:\n${formatted}`);
    }
  }

  if (issues.length > 0) {
    throw new Error(issues.join("\n\n"));
  }

  return true;
}

export function writeCompatToolRegistry(repoRoot, manifest) {
  const registryPath = path.join(repoRoot, "data", "tool-registry.json");
  const registry = getCanonicalToolRegistry(manifest).map(({ id, name, slug, subdomainUrl, pathUrl, status }) => ({
    id,
    name,
    slug,
    subdomainUrl,
    pathUrl,
    status
  }));

  writeFileSync(registryPath, JSON.stringify(registry, null, 2) + "\n");
}

export function writeRobotsTxt(repoRoot, manifest) {
  const outputPath = path.join(repoRoot, "robots.txt");
  const { userAgent, allow, sitemap } = manifest.site.robots;
  const content = [`User-agent: ${userAgent}`, `Allow: ${allow}`, "", `Sitemap: ${sitemap}`, ""].join("\n");
  writeFileSync(outputPath, content);
}

export function writeSitemapXml(repoRoot, manifest) {
  const outputPath = path.join(repoRoot, "sitemap.xml");
  const sitePages = (manifest.site.pages || []).filter((page) => page.includeInSitemap !== false);
  const toolPages = manifest.tools
    .filter((tool) => tool.includeInSitemap)
    .map((tool) => ({
      loc: tool.canonicalUrl,
      changefreq: tool.changefreq || manifest.site.defaultChangefreq,
      priority: tool.priority ?? manifest.site.defaultPriority
    }));

  const entries = [...sitePages, ...toolPages];
  const uniqueEntries = [];
  const seen = new Set();

  for (const entry of entries) {
    if (seen.has(entry.loc)) {
      continue;
    }
    seen.add(entry.loc);
    uniqueEntries.push(entry);
  }

  const content = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
    ...uniqueEntries.map((entry) => {
      const lines = ["  <url>", `    <loc>${entry.loc}</loc>`];
      if (entry.changefreq) {
        lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      }
      if (entry.priority !== undefined && entry.priority !== null) {
        lines.push(`    <priority>${Number(entry.priority).toFixed(1)}</priority>`);
      }
      lines.push("  </url>");
      return lines.join("\n");
    }),
    "</urlset>",
    ""
  ].join("\n");
  writeFileSync(outputPath, content);
}

export function findLegacySubdomainReferences(repoRoot, manifest) {
  const ignoredDirectories = new Set([
    ".git",
    "node_modules",
    "data",
    "scripts"
  ]);
  const ignoredFiles = new Set([
    "tool-registry.json",
    "tool-migration-tracker.json",
    "tool-link-audit.json",
    "tools.json",
    "assets/tool-registry.js",
    "robots.txt",
    "sitemap.xml"
  ]);

  const legacyUrls = manifest.tools
    .map((tool) => tool.legacySubdomain)
    .filter(Boolean)
    .flatMap((url) => [url, url.replace(/\/$/, "")]);
  const matches = [];

  scan(repoRoot);
  return matches;

  function scan(currentDir) {
    for (const entry of readdirSync(currentDir)) {
      const absolutePath = path.join(currentDir, entry);
      const relativePath = path.relative(repoRoot, absolutePath);
      const stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        if (ignoredDirectories.has(entry)) {
          continue;
        }
        scan(absolutePath);
        continue;
      }

      if (ignoredFiles.has(relativePath) || !textFilePattern.test(entry)) {
        continue;
      }

      const content = readFileSync(absolutePath, "utf8");
      for (const legacyUrl of legacyUrls) {
        if (content.includes(legacyUrl)) {
          matches.push({ file: relativePath, url: legacyUrl });
        }
      }
    }
  }
}
