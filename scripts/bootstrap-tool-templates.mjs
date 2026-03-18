import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const templatesRoot = path.join(repoRoot, "templates");
const registryPath = path.join(repoRoot, "data", "tool-registry.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8"));

const toolUrls = new Map();
for (const tool of registry) {
  toolUrls.set(tool.subdomainUrl.replace(/\/?$/, "/"), tool.id);
  toolUrls.set(tool.subdomainUrl.replace(/\/$/, ""), tool.id);
  toolUrls.set(tool.pathUrl.replace(/\/?$/, "/"), tool.id);
  toolUrls.set(tool.pathUrl.replace(/\/$/, ""), tool.id);
}

const skipTopLevel = new Set(["templates", "node_modules", ".git"]);
const skipFiles = new Set([
  "package.json",
  "package-lock.json",
  "sitemap.xml",
  "robots.txt",
  "og-image.png",
  "og-image.svg"
]);

function walk(relativeDir = ".") {
  const absoluteDir = path.join(repoRoot, relativeDir);
  for (const entry of readdirSync(absoluteDir)) {
    if (relativeDir === "." && skipTopLevel.has(entry)) {
      continue;
    }

    const relativePath = path.join(relativeDir, entry);
    const absolutePath = path.join(repoRoot, relativePath);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      walk(relativePath);
      continue;
    }

    if (skipFiles.has(entry)) {
      continue;
    }

    if (!/\.(html|md)$/.test(entry)) {
      continue;
    }

    const destinationPath = path.join(templatesRoot, relativePath);
    if (existsSync(destinationPath)) {
      continue;
    }

    mkdirSync(path.dirname(destinationPath), { recursive: true });
    const source = readFileSync(absolutePath, "utf8");
    const rendered = replaceToolUrlsWithTokens(source);
    writeFileSync(destinationPath, rendered);
  }
}

function replaceToolUrlsWithTokens(source) {
  let output = source;
  const entries = [...toolUrls.entries()].sort((left, right) => right[0].length - left[0].length);
  for (const [url, id] of entries) {
    const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    output = output.replace(new RegExp(escapedUrl, "g"), `{{toolUrl:${id}}}`);
  }
  return output;
}

mkdirSync(templatesRoot, { recursive: true });
walk();

const templateSitemapPath = path.join(templatesRoot, "sitemap.xml");
if (!existsSync(templateSitemapPath)) {
  cpSync(path.join(repoRoot, "sitemap.xml"), templateSitemapPath);
}
