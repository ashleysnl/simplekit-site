import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { outputRoot } from "./paths.mjs";
import { validateOutput, resolveLocal } from "./validate-output.mjs";

validateOutput();
const port = Number(process.env.PORT || 8000);
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".xml": "application/xml", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json", ".txt": "text/plain" };
createServer((request, response) => {
  response.setHeader("X-Robots-Tag", "noindex, nofollow");
  try {
    let filename = resolveLocal(request.url, path.join(outputRoot, "index.html"), outputRoot, "http://localhost");
    if (!filename) throw new Error("Invalid URL");
    if (statSync(filename).isDirectory()) filename = path.join(filename, "index.html");
    const body = readFileSync(filename);
    response.writeHead(200, { "Content-Type": types[path.extname(filename)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404); response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Static preview server listening on port ${port} (dist/, noindex).`));
