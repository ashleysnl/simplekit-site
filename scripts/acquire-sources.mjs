import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, renameSync, mkdtempSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repoRoot, sourcesRoot } from "./paths.mjs";

export function loadSources(root = repoRoot) {
  const lock = JSON.parse(readFileSync(path.join(root, "data/calculator-sources.json"), "utf8"));
  if (lock.version !== 1 || !Array.isArray(lock.sources)) throw new Error("Unsupported source lock format");
  const ids = new Set();
  for (const source of lock.sources) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.id) || ids.has(source.id)) {
      throw new Error(`Invalid or duplicate source ID: ${source.id}`);
    }
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repository) ||
        !/^[0-9a-f]{40}$/.test(source.revision)) throw new Error(`Unpinned or invalid source: ${source.id}`);
    ids.add(source.id);
  }
  return lock.sources;
}

export function sourceDirectory(source) {
  return path.join(sourcesRoot, source.id, source.revision);
}

function git(directory, ...args) {
  return execFileSync("git", ["-C", directory, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

export function verifySource(source, directory = sourceDirectory(source)) {
  if (git(directory, "rev-parse", "HEAD") !== source.revision ||
      git(directory, "config", "--get", "remote.origin.url") !== `https://github.com/${source.repository}.git` ||
      git(directory, "status", "--porcelain", "--untracked-files=all", "--ignored").length) {
    throw new Error(`Source cache changed for ${source.id}; remove ${directory} and run npm run sources:fetch`);
  }
  if (git(directory, "ls-files", "--stage").split("\n").some(line => /^(120000|160000) /.test(line))) {
    throw new Error(`Source ${source.id} contains unsupported symlinks or submodules`);
  }
}

export function acquireSources() {
  const sources = loadSources();
  for (const source of sources) {
    const destination = sourceDirectory(source);
    if (existsSync(destination)) {
      verifySource(source);
      continue;
    }
    mkdirSync(path.dirname(destination), { recursive: true });
    const temporary = mkdtempSync(path.join(path.dirname(destination), ".fetch-"));
    try {
      git(temporary, "init", "--quiet");
      git(temporary, "remote", "add", "origin", `https://github.com/${source.repository}.git`);
      git(temporary, "fetch", "--quiet", "--depth=1", "origin", source.revision);
      git(temporary, "-c", "advice.detachedHead=false", "checkout", "--quiet", "--detach", source.revision);
      verifySource(source, temporary);
      renameSync(temporary, destination);
      console.log(`Fetched ${source.id} at ${source.revision}`);
    } catch (error) {
      throw new Error(`Unable to acquire pinned source ${source.id} (${source.repository}@${source.revision})`, { cause: error });
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  }
  console.log(`Verified ${sources.length} pinned GitHub sources.`);
  return sources;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) acquireSources();
