import { existsSync } from "node:fs";
import { loadSeoManifest, runSeoValidation } from "./seo-utils.mjs";
import { repoRoot, outputRoot } from "./paths.mjs";

const manifest = loadSeoManifest(repoRoot);

runSeoValidation(manifest, repoRoot);

if (!existsSync(outputRoot)) throw new Error("Run npm run build first; generated output must also pass SEO validation.");
runSeoValidation(manifest, outputRoot, { published: true });

console.log(`SEO validation passed for ${manifest.tools.length} tools.`);
