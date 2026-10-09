import { fileURLToPath } from "node:url";
import path from "node:path";

export const repoRoot = fileURLToPath(new URL("../", import.meta.url));
export const outputRoot = path.join(repoRoot, "dist");
export const sourcesRoot = path.join(repoRoot, ".cache", "calculator-sources");
