// Repeatable reference-review captures; Playwright is isolated and test-only.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = process.env.SIMPLEKIT_EVIDENCE_DIR || '/tmp/simplekit-v2-fidelity';
const origin = new URL(process.env.SIMPLEKIT_PREVIEW_URL || 'http://127.0.0.1:8003').origin;
require('./v2-preview-origin.cjs')(origin);
const selectors = ['.v2-header', '.v2-hero-copy', 'h1', '.v2-hero-body', '.v2-discovery-slot',
  '.v2-search-bar', '.v2-discovery-panel', '.v2-home-trust', '.v2-trust', '.v2-trust-note',
  '.v2-home-goals', '.v2-goal-heading', '.v2-home-goal-list'];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const metrics = [];
  try {
    for (const width of [375, 390, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      // Match the acceptance suites: exercise local code without sending analytics.
      await context.route('**/*', route => new URL(route.request().url()).origin === origin
        ? route.continue() : route.fulfill({ body: '', contentType: 'text/javascript' }));
      const page = await context.newPage();
      await page.goto(origin, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(output, `home-${width}.jpg`), type: 'jpeg', quality: 88, fullPage: true });
      await page.screenshot({ path: path.join(output, `viewport-${width}.jpg`), type: 'jpeg', quality: 88 });
      metrics.push(await page.evaluate(selectors => ({
        width: innerWidth,
        overflow: document.documentElement.scrollWidth > innerWidth,
        sections: Object.fromEntries(selectors.map(selector => {
          const node = document.querySelector(selector);
          return [selector, { ...node.getBoundingClientRect().toJSON(), font: getComputedStyle(node).fontSize }];
        }))
      }), selectors));
      await context.close();
    }
    fs.writeFileSync(path.join(output, 'geometry.json'), JSON.stringify(metrics, null, 2) + '\n');
    console.log('Reference-review screenshots and geometry captured at 375, 390, 768 and 1440px.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
