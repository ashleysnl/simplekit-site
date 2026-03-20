import { writeCompatToolRegistry, writeRobotsTxt, writeSitemapXml, loadSeoManifest, runSeoValidation } from "./seo-utils.mjs";

const repoRoot = process.cwd();
const manifest = loadSeoManifest(repoRoot);

runSeoValidation(manifest, repoRoot, { scanRepo: false });
writeCompatToolRegistry(repoRoot, manifest);
writeRobotsTxt(repoRoot, manifest);
writeSitemapXml(repoRoot, manifest);
