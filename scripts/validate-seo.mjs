import { existsSync } from "node:fs";
import { loadSeoManifest, runSeoValidation } from "./seo-utils.mjs";
import { repoRoot, outputRoot } from "./paths.mjs";
import { auditSeoIntegrity } from "./v2-seo-integrity.mjs";

const manifest = loadSeoManifest(repoRoot);

runSeoValidation(manifest, repoRoot);

if (!existsSync(outputRoot)) throw new Error("Run npm run build first; generated output must also pass SEO validation.");
runSeoValidation(manifest, outputRoot, { published: true });
const integrity = auditSeoIntegrity(outputRoot, manifest);
console.log(`SEO integrity passed: ${integrity.indexedPages} indexed pages, ${integrity.internalLinks} internal links, ${integrity.compatibility.length} compatibility pages.`);

console.log(`SEO validation passed for ${manifest.tools.length} tools.`);
