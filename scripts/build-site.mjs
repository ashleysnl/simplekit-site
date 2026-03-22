import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  getCanonicalToolRegistry,
  getManifestToolMap,
  getTemplateToolUrls,
  loadSeoManifest,
  runSeoValidation,
  writeCompatToolRegistry,
  writeRobotsTxt,
  writeSitemapXml
} from "./seo-utils.mjs";

const repoRoot = process.cwd();
const templatesRoot = path.join(repoRoot, "templates");
const trackerPath = path.join(repoRoot, "data", "tool-migration-tracker.json");
const manifest = loadSeoManifest(repoRoot);
const registry = getCanonicalToolRegistry(manifest);
const tracker = JSON.parse(readFileSync(trackerPath, "utf8"));
const trackerById = new Map(tracker.map((entry) => [entry.id, entry]));
const toolById = new Map(registry.map((tool) => [tool.id, tool]));
const manifestToolUrls = getTemplateToolUrls(manifest);
const manifestToolMap = getManifestToolMap(manifest);
const migratedTools = registry.filter((tool) => tool.status === "path");
const toolUrlPattern = /\{\{toolUrl:([a-z0-9-]+)\}\}/g;
const toolCountPattern = /\{\{toolCount\}\}/g;

runSeoValidation(manifest, repoRoot, { scanRepo: false });
writeCompatToolRegistry(repoRoot, manifest);
buildTemplates();
syncMigratedToolSites();
writeToolRegistryAsset();
writeActiveToolsMarkdown();
writeRobotsTxt(repoRoot, manifest);
writeSitemapXml(repoRoot, manifest);
writeToolUrlAudit();
validateTemplates();

function buildTemplates(relativeDir = ".") {
  const absoluteDir = path.join(templatesRoot, relativeDir);
  for (const entry of readdirSync(absoluteDir)) {
    const relativePath = path.join(relativeDir, entry);
    const absolutePath = path.join(templatesRoot, relativePath);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      buildTemplates(relativePath);
      continue;
    }

    const destinationPath = path.join(repoRoot, relativePath);
    mkdirSync(path.dirname(destinationPath), { recursive: true });
    const template = readFileSync(absolutePath, "utf8");
    const rendered = template
      .replace(toolUrlPattern, (_, toolId) => {
        const tool = toolById.get(toolId);
        if (!tool) {
          throw new Error(`Unknown tool token "${toolId}" in ${relativePath}`);
        }
        return tool.currentPublicUrl;
      })
      .replace(toolCountPattern, String(registry.length));
    writeFileSync(destinationPath, rendered);
  }
}

function writeToolRegistryAsset() {
  const outputPath = path.join(repoRoot, "assets", "tool-registry.js");
  const browserRegistry = registry.map(({ id, name, slug, subdomainUrl, pathUrl, status, currentPublicUrl }) => ({
    id,
    name,
    slug,
    subdomainUrl,
    pathUrl,
    status,
    currentPublicUrl
  }));

  const content = [
    "window.SimpleKitToolLinks = Object.freeze(" + JSON.stringify(Object.fromEntries(browserRegistry.map((tool) => [tool.id, tool])), null, 2) + ");",
    "",
    "window.getSimpleKitToolUrl = function getSimpleKitToolUrl(toolId) {",
    "  var tool = window.SimpleKitToolLinks[toolId];",
    "  if (!tool) {",
    "    throw new Error('Unknown SimpleKit tool: ' + toolId);",
    "  }",
    "  return tool.currentPublicUrl;",
    "};",
    ""
  ].join("\n");

  writeFileSync(outputPath, content);
}

function syncMigratedToolSites() {
  for (const tool of migratedTools) {
    const trackerEntry = trackerById.get(tool.id);
    if (!trackerEntry?.completed) {
      continue;
    }
    if (!trackerEntry.toolRepoPath) {
      throw new Error(`Tracker entry for ${tool.id} is missing toolRepoPath`);
    }

    const sourceDir = trackerEntry.toolRepoPath;
    const sourceIndexPath = path.join(sourceDir, "index.html");
    if (!existsSync(sourceIndexPath)) {
      throw new Error(`Tool repo for ${tool.id} does not contain index.html at ${sourceDir}`);
    }

    const destinationDir = path.join(repoRoot, tool.slug);
    rmSync(destinationDir, { recursive: true, force: true });
    mkdirSync(destinationDir, { recursive: true });

    for (const entry of readdirSync(sourceDir)) {
      const sourcePath = path.join(sourceDir, entry);
      const destinationPath = path.join(destinationDir, entry);
      cpSync(sourcePath, destinationPath, {
        recursive: true,
        filter: (candidatePath) => shouldCopyMigratedToolFile(sourceDir, candidatePath)
      });
    }

    pruneMigratedToolSite(destinationDir);
    rewriteMigratedToolUrls(destinationDir);
  }
}

function shouldCopyMigratedToolFile(sourceRoot, sourcePath) {
  const relativePath = path.relative(sourceRoot, sourcePath);
  if (!relativePath) {
    return true;
  }

  const duplicateNamePattern = / \d+(?=(\.[^.]+)?$)/;

  if (statSync(sourcePath).isDirectory()) {
    const directoryName = path.basename(sourcePath);
    const blockedDirectories = new Set([".git", ".factory", "docs", "src", "tests", "tools"]);
    return !blockedDirectories.has(directoryName) && !duplicateNamePattern.test(directoryName);
  }

  const parts = relativePath.split(path.sep);
  const blockedTopLevel = new Set([".git", ".factory", "docs", "src", "tests", "tools"]);
  const blockedNames = new Set([
    ".DS_Store",
    "README.md",
    "LICENSE",
    ".gitignore",
    "AGENTS.md",
    "FACTORY_CONTEXT.md",
    "SIMPLEKIT_CALCULATOR_STYLE_GUIDE.md",
    "calculator-spec.yaml"
  ]);

  if (blockedTopLevel.has(parts[0])) {
    return false;
  }

  if (parts.some((part) => blockedNames.has(part))) {
    return false;
  }

  const allowedExtensions = new Set([
    ".html",
    ".css",
    ".js",
    ".json",
    ".txt",
    ".xml",
    ".webmanifest",
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico"
  ]);

  const extension = path.extname(sourcePath).toLowerCase();
  const baseName = path.basename(sourcePath).toLowerCase();
  if (duplicateNamePattern.test(path.basename(sourcePath))) {
    return false;
  }
  if (extension === ".json" && (baseName.includes("backup") || baseName.includes("export"))) {
    return false;
  }
  return allowedExtensions.has(extension);
}

function pruneMigratedToolSite(destinationDir) {
  const blockedTopLevel = ["docs", "src", "tests", "tools", ".factory", ".git"];
  const blockedFiles = [
    "README.md",
    "LICENSE",
    ".gitignore",
    "AGENTS.md",
    "FACTORY_CONTEXT.md",
    "SIMPLEKIT_CALCULATOR_STYLE_GUIDE.md",
    "calculator-spec.yaml",
    ".DS_Store"
  ];

  for (const name of blockedTopLevel) {
    rmSync(path.join(destinationDir, name), { recursive: true, force: true });
  }

  for (const name of blockedFiles) {
    rmSync(path.join(destinationDir, name), { recursive: true, force: true });
  }
}

function rewriteMigratedToolUrls(destinationDir) {
  const textExtensions = new Set([".html", ".css", ".js", ".json", ".txt", ".xml", ".webmanifest", ".md"]);
  const replacements = registry
    .flatMap((tool) => {
      const current = tool.currentPublicUrl;
      const subdomainNoSlash = tool.subdomainUrl.replace(/\/$/, "");
      return [
        [tool.subdomainUrl, current],
        [subdomainNoSlash, current],
        [`${tool.subdomainUrl}/`, current],
        [`${subdomainNoSlash}//`, current],
        [tool.pathUrl, current],
        [`${tool.pathUrl}/`, current]
      ];
    })
    .filter(([from, to], index, all) => from && to && from !== to && all.findIndex(([candidate]) => candidate === from) === index)
    .sort((a, b) => b[0].length - a[0].length);

  rewriteDirectory(destinationDir);

  function rewriteDirectory(currentDir) {
    for (const entry of readdirSync(currentDir)) {
      const entryPath = path.join(currentDir, entry);
      const stats = statSync(entryPath);
      if (stats.isDirectory()) {
        rewriteDirectory(entryPath);
        continue;
      }

      if (!textExtensions.has(path.extname(entryPath).toLowerCase())) {
        continue;
      }

      const original = readFileSync(entryPath, "utf8");
      let rewritten = original;
      for (const [from, to] of replacements) {
        rewritten = rewritten.split(from).join(to);
      }

      for (const tool of registry) {
        const current = tool.currentPublicUrl;
        rewritten = rewritten.split(`${current}/`).join(current);
      }

      if (rewritten !== original) {
        writeFileSync(entryPath, rewritten);
      }
    }
  }
}

function writeActiveToolsMarkdown() {
  const outputPath = path.join(repoRoot, "simplekit-active-tools.md");
  const lines = ["# SimpleKit Active Tools", ""];

  registry.forEach((tool, index) => {
    lines.push(`${index + 1}. [${tool.name}](${tool.currentPublicUrl})`);
  });

  lines.push("");
  writeFileSync(outputPath, lines.join("\n"));
}

function writeToolUrlAudit() {
  const outputPath = path.join(repoRoot, "data", "tool-link-audit.json");
  const files = [];

  collectTemplateAudit(files);

  const byTool = Object.fromEntries(registry.map((tool) => [tool.id, []]));

  for (const file of files) {
    for (const toolId of file.toolIds) {
      byTool[toolId].push(file.file);
    }
  }

  const content = {
    files,
    byTool
  };

  writeFileSync(outputPath, JSON.stringify(content, null, 2) + "\n");
}

function collectTemplateAudit(files, relativeDir = ".") {
  const absoluteDir = path.join(templatesRoot, relativeDir);
  for (const entry of readdirSync(absoluteDir)) {
    const relativePath = path.join(relativeDir, entry);
    const absolutePath = path.join(templatesRoot, relativePath);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      collectTemplateAudit(files, relativePath);
      continue;
    }

    if (!/\.(html|md)$/.test(entry)) {
      continue;
    }

    const template = readFileSync(absolutePath, "utf8");
    const toolIds = [...template.matchAll(toolUrlPattern)].map((match) => match[1]);
    if (toolIds.length === 0) {
      continue;
    }

    files.push({
      file: relativePath,
      toolIds: [...new Set(toolIds)].sort()
    });
  }
}

function validateTemplates(relativeDir = ".") {
  const absoluteDir = path.join(templatesRoot, relativeDir);
  for (const entry of readdirSync(absoluteDir)) {
    const relativePath = path.join(relativeDir, entry);
    const absolutePath = path.join(templatesRoot, relativePath);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      validateTemplates(relativePath);
      continue;
    }

    if (!/\.(html|md)$/.test(entry)) {
      continue;
    }

    const template = readFileSync(absolutePath, "utf8");
    for (const tool of manifest.tools) {
      const rawUrls = [
        tool.legacySubdomain,
        tool.legacySubdomain?.replace(/\/$/, ""),
        tool.canonicalUrl,
        tool.canonicalUrl?.replace(/\/$/, "")
      ].filter(Boolean);

      for (const rawUrl of rawUrls) {
        if (template.includes(rawUrl)) {
          throw new Error(`Template ${relativePath} still contains a hardcoded tool URL: ${rawUrl}`);
        }
      }
    }

    for (const toolId of [...template.matchAll(toolUrlPattern)].map((match) => match[1])) {
      if (!manifestToolMap.has(toolId)) {
        throw new Error(`Template ${relativePath} references unknown tool token "${toolId}"`);
      }
    }
  }
}
