import { findLegacySubdomainReferences, loadSeoManifest, runSeoValidation } from "./seo-utils.mjs";

const repoRoot = process.cwd();
const manifest = loadSeoManifest(repoRoot);

runSeoValidation(manifest, repoRoot);

const legacyMatches = findLegacySubdomainReferences(repoRoot, manifest);
if (legacyMatches.length > 0) {
  throw new Error(`Legacy subdomain references found:\n${legacyMatches.map((match) => `${match.file}: ${match.url}`).join("\n")}`);
}

console.log(`SEO validation passed for ${manifest.tools.length} tools.`);
