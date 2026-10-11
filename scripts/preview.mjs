import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { brotliCompressSync, gzipSync, constants } from "node:zlib";
import { outputRoot } from "./paths.mjs";
import { validateOutput, resolveLocal } from "./validate-output.mjs";

validateOutput();
const port = Number(process.env.PORT || 8000);
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".xml": "application/xml", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".woff": "font/woff", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".txt": "text/plain" };
createServer((request, response) => {
  response.setHeader("X-Robots-Tag", "noindex, nofollow");
  try {
    let filename = resolveLocal(request.url, path.join(outputRoot, "index.html"), outputRoot, "http://localhost");
    if (!filename) throw new Error("Invalid URL");
    if (statSync(filename).isDirectory()) filename = path.join(filename, "index.html");
    let body = readFileSync(filename);
    const mime = types[path.extname(filename)] || "application/octet-stream";
    const headers = { "Content-Type": mime };
    // Mirror the CDN's ordinary text transport so local mobile lab runs do not
    // charge the website for loopback-only uncompressed HTML/CSS/JS payloads.
    if (/^(text\/|application\/(json|xml|manifest\+json)|image\/svg\+xml)/.test(mime)) {
      headers.Vary = "Accept-Encoding";
      const accepted = new Map((request.headers['accept-encoding'] || '').split(',').map(part => {
        const [name, ...parameters] = part.trim().split(';');
        const quality = parameters.find(p => p.trim().startsWith('q='));
        return [name, quality ? Number(quality.trim().slice(2)) : 1];
      }));
      if (accepted.get('br') > 0) {
        body = brotliCompressSync(body, {params:{[constants.BROTLI_PARAM_QUALITY]:4}});
        headers['Content-Encoding'] = 'br';
      } else if (accepted.get('gzip') > 0) {
        body = gzipSync(body);
        headers['Content-Encoding'] = 'gzip';
      }
    }
    response.writeHead(200, headers);
    response.end(body);
  } catch {
    response.writeHead(404); response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Static preview server listening on port ${port} (dist/, noindex).`));
