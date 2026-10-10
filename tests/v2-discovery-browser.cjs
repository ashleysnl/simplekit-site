// Optional Phase 3 acceptance. Isolated Playwright, loopback output, no production traffic.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const manifest = require('../data/tools.json');
const metadata = require('../data/v2-discovery.json');
const expected = new Map(manifest.tools.map(t => [t.slug, t.canonicalUrl]));
const origin = new URL(process.env.SIMPLEKIT_PREVIEW_URL || 'http://127.0.0.1:8001').origin;
require('./v2-preview-origin.cjs')(origin);
const output = process.env.SIMPLEKIT_EVIDENCE_DIR || '/tmp/simplekit-v2-discovery';
fs.mkdirSync(output, { recursive: true });
const errors = [], failed = [], navigation = [], external = new Set();
async function context(browser, options = {}, mode = 'normal') {
  const c = await browser.newContext({ viewport: { width: 390, height: 900 }, locale: 'en-CA', ...options });
  c.setDefaultTimeout(5000);
  await c.route('**/*', r => {
    const url = new URL(r.request().url());
    if (mode === 'failed-module' && url.pathname.endsWith('/discovery-index.js')) return r.abort();
    if (url.origin === origin) return r.continue();
    // Verify actual anchor activation without visiting the production calculator.
    if (url.origin === manifest.site.canonicalHost && r.request().isNavigationRequest()) {
      assert([...expected.values()].includes(url.href), 'Unknown canonical navigation');
      navigation.push(url.href);
      return r.fulfill({ body: '<!doctype html><title>Intercepted test navigation</title>', contentType: 'text/html' });
    }
    external.add(url.hostname); assert.equal(url.hostname, 'www.googletagmanager.com');
    return r.fulfill({ body: '', contentType: 'text/javascript' });
  });
  c.on('page', p => {
    p.on('pageerror', e => errors.push(e.message));
    p.on('response', r => { if (r.status() >= 400) failed.push(r.url()); });
  });
  return c;
}
async function layout(p) {
  const value = await p.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    h1: document.querySelector('h1').getBoundingClientRect().toJSON(),
    discovery: document.querySelector('[data-v2-discovery]').getBoundingClientRect().toJSON(),
    picture: document.querySelector('.v2-coastal-picture').getBoundingClientRect().toJSON(),
    input: document.querySelector('#tool-search').getBoundingClientRect().toJSON() }));
  assert(value.scrollWidth <= value.width, `Overflow at ${value.width}`);
  assert(value.h1.bottom <= value.discovery.top, 'Headline overlaps search');
  assert(value.discovery.left >= 0 && value.discovery.right <= value.width + 1, 'Clipped search panel');
  return value;
}
async function links(p) {
  const list = await p.locator('#discovery-results a').evaluateAll(nodes => nodes.map(n => ({ id: n.dataset.toolId, href: n.href })));
  assert.equal(new Set(list.map(t => t.id)).size, list.length);
  for (const link of list) assert.equal(link.href, expected.get(link.id));
  return list;
}
async function search(p, query) {
  return p.locator('#tool-search').evaluate(async (input, value) => {
    const start = performance.now(); input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const domMs = performance.now() - start;
    await new Promise(requestAnimationFrame);
    return { domMs, frameMs: performance.now() - start };
  }, query);
}
async function questions(p) {
  assert(await p.locator('[data-v2-questions]').isVisible());
  const list = await p.locator('[data-v2-questions] a').evaluateAll(nodes => nodes.map(n => ({ text: n.textContent.trim(), href: n.href })));
  assert.deepEqual(list, metadata.questions.map(q => ({ text: q.text, href: expected.get(q.toolId) })));
  return list;
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const layouts = [], timings = [], ranking = [];
  try {
    for (const width of [320, 375, 390, 768, 1440, 1920]) {
      const c = await context(browser, { viewport: { width, height: 1000 } }), p = await c.newPage();
      await p.goto(origin, { waitUntil: 'networkidle' }); assert(await p.getByRole('searchbox').isVisible());
      await questions(p); layouts.push({ state: 'suggestions', ...await layout(p) });
      await p.screenshot({ path: path.join(output, `search-empty-${width}.jpg`), type: 'jpeg', quality: 85 });
      const crop = await p.locator('.v2-coastal-picture').boundingBox();
      timings.push({ width, query: 'calculator', ...await search(p, 'calculator') });
      await links(p); layouts.push({ state: 'results', ...await layout(p) });
      assert.equal((await p.locator('.v2-coastal-picture').boundingBox()).height, crop.height, 'Results changed landscape crop');
      if (width === 390) await p.screenshot({ path: path.join(output, 'search-results-390.jpg'), type: 'jpeg', quality: 85 });
      await c.close();
    }
    const c = await context(browser, { viewport: { width: 1440, height: 1000 } }), p = await c.newPage();
    await p.goto(origin, { waitUntil: 'networkidle' });
    const input = p.getByRole('searchbox', { name: 'What would you like to figure out?' });
    const outgoing = [], consoleMessages = [];
    p.on('request', r => outgoing.push({ url: r.url(), body: r.postData() }));
    p.on('console', message => consoleMessages.push(message.text()));
    const beforeAnalytics = await p.evaluate(() => JSON.stringify(window.dataLayer));
    for (const tool of manifest.tools) for (const query of [tool.name, tool.slug]) {
      timings.push({ query, ...await search(p, query) });
      const result = await links(p); assert.equal(result[0]?.id, tool.slug, query);
      ranking.push({ query, first: result[0].id, count: result.length });
    }
    for (const [query, id] of [['retire at 55', 'retirement-planner'], ['rent or buy', 'rent-vs-buy-calculator'],
      ['afford a house', 'house-affordability-calculator'], ['pay debt', 'debt-payoff-calculator'],
      ['RRSP TFSA', 'rrsp-vs-tfsa-calculator'], ['  RéTiRE... AT   55?! ', 'retirement-planner'], ['RENT—OR—BUY', 'rent-vs-buy-calculator']]) {
      timings.push({ query, ...await search(p, query) });
      const result = await links(p); assert.equal(result[0]?.id, id, query); ranking.push({ query, first: result[0].id, count: result.length });
    }
    for (const query of ['', ' \t ', '?!...']) { await input.fill(query); await questions(p); }
    await input.fill('phase3-private-query-0f83');
    assert.equal(await p.getByRole('status').innerText(), '0 tools found');
    assert(await p.locator('[data-v2-search-empty]').isVisible());
    assert.equal(await p.locator('.v2-view-all').getAttribute('href'), 'tools/');
    assert.equal((await c.request.get(origin + '/tools/')).status(), 200);
    await p.screenshot({ path: path.join(output, 'search-no-results-1440.jpg'), type: 'jpeg', quality: 85 });
    await input.fill('<img src=x onerror="window.v2Injection=true">');
    assert.equal(await p.locator('[data-v2-discovery] img').count(), 0);
    assert.equal(await p.evaluate(() => window.v2Injection), undefined);
    assert.equal(await p.getByRole('status').innerText(), '0 tools found');
    await p.getByRole('button', { name: 'Clear search' }).click();
    assert.equal(await input.inputValue(), ''); assert(await input.evaluate(n => n === document.activeElement)); await questions(p);
    await input.press('Enter'); assert.equal(p.url(), origin + '/');
    await input.fill('retire at 55');
    assert.equal(await p.getByRole('status').innerText(), '1 tool found');
    const clear = p.getByRole('button', { name: 'Clear search' }); const size = await clear.boundingBox();
    assert(size.width >= 44 && size.height >= 44);
    await input.press('Tab'); assert(await clear.evaluate(n => n === document.activeElement));
    await p.keyboard.press('Tab'); assert(await p.locator('#discovery-results a').first().evaluate(n => n === document.activeElement));
    assert.equal(await p.locator(':focus').evaluate(n => getComputedStyle(n).outlineStyle), 'solid');
    const session = await c.newCDPSession(p), tree = await session.send('Accessibility.getFullAXTree'); await session.detach();
    assert(tree.nodes.some(n => !n.ignored && n.role?.value === 'searchbox' && n.name?.value === 'What would you like to figure out?'));
    assert(tree.nodes.some(n => !n.ignored && n.role?.value === 'status' && n.properties?.some(v => v.name === 'live' && v.value.value === 'polite')));
    await p.keyboard.press('Escape'); assert.equal(await input.inputValue(), '');
    assert(await input.evaluate(n => n === document.activeElement)); await questions(p);
    assert.deepEqual(outgoing, [], 'Search sent a network request');
    assert.deepEqual(consoleMessages, [], 'Search logged browser console text');
    assert.equal(await p.evaluate(() => JSON.stringify(window.dataLayer)), beforeAnalytics, 'Search changed analytics data');
    assert.deepEqual(await p.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, url: location.href })), { local: 0, session: 0, url: origin + '/' });
    p.removeAllListeners('request');
    // Activate a result using the keyboard; the canonical navigation is intercepted above.
    await input.fill('retire at 55'); await input.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Enter');
    await p.waitForURL(expected.get('retirement-planner'));
    for (const q of metadata.questions) {
      await p.goto(origin, { waitUntil: 'networkidle' }); await p.getByRole('link', { name: q.text, exact: true }).click();
      await p.waitForURL(expected.get(q.toolId));
    }
    await c.close();
    const touch = await context(browser, { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const t = await touch.newPage(); await t.goto(origin, { waitUntil: 'networkidle' }); await layout(t);
    await t.getByRole('searchbox').fill('rent or buy'); await links(t);
    await t.screenshot({ path: path.join(output, 'search-landscape-touch.jpg'), type: 'jpeg', quality: 85 });
    await t.getByRole('button', { name: 'Clear search' }).tap(); await questions(t); await touch.close();
    for (const mode of ['nojs', 'failed-module']) {
      const fallback = await context(browser, { javaScriptEnabled: mode !== 'nojs' }, mode);
      const f = await fallback.newPage(); await f.goto(origin, { waitUntil: 'networkidle' });
      await questions(f); assert.equal(await f.getByRole('searchbox').count(), 0);
      await f.screenshot({ path: path.join(output, `search-${mode}-390.jpg`), type: 'jpeg', quality: 85 });
      await f.locator('.v2-view-all').click(); await f.waitForURL(origin + '/tools/'); await fallback.close();
    }
    const zoom = await context(browser, { viewport: { width: 1440, height: 900 } }), z = await zoom.newPage();
    await z.goto(origin, { waitUntil: 'networkidle' }); await z.evaluate(() => document.body.style.zoom = '2');
    await layout(z); await z.getByRole('searchbox').fill('contractor'); await layout(z); await links(z);
    await z.screenshot({ path: path.join(output, 'search-css-zoom-200.jpg'), type: 'jpeg', quality: 85 });
    await z.getByRole('button', { name: 'Clear search' }).click(); await questions(z); await zoom.close();
    const maxDOM = Math.max(...timings.map(t => t.domMs)), maxFrame = Math.max(...timings.map(t => t.frameMs));
    assert(maxDOM < 100 && maxFrame < 100, `Search exceeds 100ms: DOM ${maxDOM}, frame ${maxFrame}`);
    assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    fs.writeFileSync(path.join(output, 'browser.json'), JSON.stringify({
      browser: browser.version(), testDevice: { platform: os.platform(), arch: os.arch(), cpu: os.cpus()[0].model, logicalCPUs: os.cpus().length,
        scope: 'Managed Linux Chromium headless runner with touch/viewport emulation; no physical mobile device claim' },
      layouts, ranking, timings, maxDOMMs: maxDOM, maxNextFrameMs: maxFrame,
      privacy: { requestsDuringSearch: 0, consoleMessagesDuringSearch: 0, analyticsDataUnchanged: true, noStorageOrURLQuery: true },
      canonicalNavigationIntercepted: navigation, externalHostsStubbed: [...external],
      noJavaScriptFallback: true, failedModuleFallback: true, injectionCheckPassed: true,
      keyboardPattern: 'Native searchbox, Tab through Clear and ordinary result links, Enter activates link, Escape clears/returns input focus',
      chromiumAXSearchboxAndPoliteStatus: true, manualAT: 'VoiceOver/NVDA unavailable; retained for Phase 8',
      zoomScope: 'CSS zoom 2; browser toolbar zoom unavailable, retained for Phase 8', pageErrors: errors, failedResponses: failed
    }, null, 2) + '\n');
    console.log(`Phase 3: 44 exact name/slug searches and intent/edge cases pass; 22 canonical routes, four questions, keyboard/AX/touch/fallback/privacy checks pass. DOM ${maxDOM.toFixed(2)} ms; next frame ${maxFrame.toFixed(2)} ms (limit 100 ms).`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
