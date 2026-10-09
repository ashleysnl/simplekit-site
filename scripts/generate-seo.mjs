import { writeCompatToolRegistry, writeRobotsTxt, writeSitemapXml, loadSeoManifest, runSeoValidation } from "./seo-utils.mjs";

import { existsSync } from "node:fs";
import { repoRoot, outputRoot } from "./paths.mjs";
const manifest = loadSeoManifest(repoRoot);

runSeoValidation(manifest, repoRoot, { scanRepo: false });
if (!existsSync(outputRoot)) throw new Error("Run npm run build before generating SEO outputs.");
writeCompatToolRegistry(outputRoot, manifest);
writeRobotsTxt(outputRoot, manifest);
writeSitemapXml(outputRoot, manifest);
