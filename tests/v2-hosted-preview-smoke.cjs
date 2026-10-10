const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = require('./v2-preview-origin.cjs')(process.env.SIMPLEKIT_PREVIEW_URL);
const manifest = require('../data/tools.json');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext();
    const paths = ['/', '/tools/', ...manifest.tools.map(tool => tool.canonicalPath)];
    const routes = [];
    for (const pathname of paths) {
      const response = await context.request.get(origin + pathname);
      assert.equal(response.status(), 200, pathname);
      assert.match(response.headers()['x-robots-tag'] || '', /noindex/);
      const html = await response.text();
      const tool = manifest.tools.find(tool => tool.canonicalPath === pathname);
      const canonical = tool?.canonicalUrl || 'https://simplekit.app' + pathname;
      const tag = html.match(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/i)?.[0];
      const actualCanonical = tag?.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
      assert.equal(actualCanonical, canonical, `Canonical changed: ${pathname}`);
      routes.push({ path: pathname, status: response.status(), noindex: true, canonical });
    }
    const robots = await context.request.get(origin + '/robots.txt');
    assert.match(await robots.text(), /Disallow: \/\s*$/);
    const cname = await context.request.get(origin + '/CNAME');
    assert(!fs.existsSync(path.join(__dirname, '../dist/CNAME')), 'Preview artifact carries a production CNAME');
    // Pages may serve its HTML fallback for unknown routes. Never serve the hostname file.
    assert.notEqual((await cname.text()).trim(), new URL(manifest.site.canonicalHost).hostname);
    const output = process.env.SIMPLEKIT_EVIDENCE_DIR;
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, 'hosted-http.json'), JSON.stringify({ origin, routes, robotsDisallowAll: true, productionCNAMEAbsent: true, cnameHTTPStatus: cname.status() }, null, 2) + '\n');
    console.log('Hosted preview: 24 routes, canonical URLs, noindex headers, disallow robots and absent production CNAME verified.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
