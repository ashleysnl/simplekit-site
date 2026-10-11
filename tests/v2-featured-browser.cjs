// Phase 6 acceptance: generated rows, canonical destinations and readable reflow.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = require('./v2-preview-origin.cjs')(process.env.SIMPLEKIT_PREVIEW_URL || 'http://127.0.0.1:8003');
const output = process.env.SIMPLEKIT_EVIDENCE_DIR || '/tmp/simplekit-v2-featured';
const tools = require('../data/tools.json').tools;
const ids = ['retirement-planner', 'mortgage-calculator', 'compound-interest-calculator', 'budget-planner', 'fire-calculator'];
const errors = [], failed = [], layouts = [];
async function check(page, state) {
  assert.equal(await page.locator('#home-featured-title').textContent(), 'Featured calculators');
  const rows = page.locator('[data-featured-tool]');
  assert.deepEqual(await rows.evaluateAll(nodes => nodes.map(n => n.dataset.featuredTool)), ids);
  for (let i = 0; i < ids.length; i++) {
    const tool = tools.find(t => t.slug === ids[i]);
    assert(tool, ids[i]);
    assert.equal(await rows.nth(i).getAttribute('href'), tool.canonicalUrl);
    assert.equal(await rows.nth(i).locator('.v2-featured-name').innerText(), tool.name);
  }
  const geometry = await page.locator('.v2-home-featured').evaluate(section => {
    const rect = node => node.getBoundingClientRect().toJSON();
    const splitWords = [...section.querySelectorAll('.v2-featured-name, .v2-featured-description')].flatMap(copy => {
      const node = copy.firstChild;
      return [...node.textContent.matchAll(/\S+/g)].filter(word => {
        const range = document.createRange();
        range.setStart(node, word.index); range.setEnd(node, word.index + word[0].length);
        return range.getClientRects().length > 1;
      }).map(word => word[0]);
    });
    return {width: innerWidth, scrollWidth: document.documentElement.scrollWidth, section: rect(section), splitWords,
      rows: [...section.querySelectorAll('[data-featured-tool]')].map(row => ({id: row.dataset.featuredTool,
        rect: rect(row), icon: rect(row.querySelector('.v2-icon-disc')), copy: rect(row.querySelector('.v2-featured-copy')),
        chevron: rect(row.querySelector('.v2-featured-chevron')), anchors: row.closest('li').querySelectorAll('a').length}))};
  });
  assert(geometry.scrollWidth <= geometry.width, `${state}: horizontal overflow`);
  assert.deepEqual(geometry.splitWords, [], `${state}: split words`);
  for (const row of geometry.rows) {
    assert(row.rect.height >= 44 && row.rect.width >= 44, `${state}: small target`);
    assert.equal(row.anchors, 1, `${state}: nested/duplicate links`);
    assert(row.icon.right <= row.copy.left && row.copy.right <= row.chevron.left + .5, `${state}: overlap`);
    assert(row.copy.right <= geometry.width && row.rect.height >= row.copy.height, `${state}: clipped text`);
  }
  assert.equal(await page.locator('.v2-featured-all').getAttribute('href'), 'tools/');
  layouts.push({state, ...geometry});
}
(async () => {
  fs.mkdirSync(output, {recursive: true});
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
  async function context(options = {}, blockAssets = false) {
    const c = await browser.newContext({viewport: {width: 390, height: 1000}, ...options});
    await c.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.fulfill({body: '', contentType: 'text/javascript'});
      if (blockAssets && /\.(woff|svg)$/.test(url.pathname)) return route.abort();
      return route.continue();
    });
    c.on('page', page => {
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {if (response.status() >= 400) failed.push(response.url());});
      page.on('console', message => {if (message.type() === 'error' && !blockAssets) errors.push(message.text());});
    });
    return c;
  }
  try {
    for (const width of [320, 375, 390, 768, 1440, 1920]) {
      const c = await context({viewport: {width, height: 1000}}), page = await c.newPage();
      await page.goto(origin, {waitUntil: 'networkidle'}); await page.evaluate(() => document.fonts.ready);
      await check(page, `width-${width}`);
      await page.locator('.v2-home-featured').screenshot({path: path.join(output, `featured-${width}.jpg`), type: 'jpeg', quality: 88});
      await c.close();
    }
    const c = await context(), page = await c.newPage();
    await page.goto(origin, {waitUntil: 'networkidle'});
    const links = page.locator('[data-featured-tool]');
    await links.first().focus();
    for (let i = 0; i < ids.length; i++) {
      assert.equal(await page.locator(':focus').getAttribute('data-featured-tool'), ids[i]);
      assert.equal(await page.locator(':focus').evaluate(n => getComputedStyle(n).outlineStyle), 'solid');
      if (i < ids.length - 1) await page.keyboard.press('Tab');
    }
    // Activate each real anchor, intercepting its public destination so testing
    // never navigates to production. Calculator functionality is tested separately.
    await c.route('https://simplekit.app/**', route => route.fulfill({body: '<title>Destination verified</title>', contentType: 'text/html'}));
    for (const id of ids) {
      await page.goto(origin, {waitUntil: 'networkidle'});
      await page.locator(`[data-featured-tool="${id}"]`).focus(); await page.keyboard.press('Enter');
      await page.waitForURL(tools.find(t => t.slug === id).canonicalUrl);
    }
    await page.goto(origin, {waitUntil: 'networkidle'}); await page.locator('.v2-featured-all').click();
    await page.waitForURL(origin + '/tools/');
    const directoryIds = await page.locator('.v2-directory-tool').evaluateAll(nodes => nodes.map(n => n.dataset.toolId));
    assert.equal(new Set(directoryIds).size, 22); assert.equal(directoryIds.length, 22);
    await page.goto(origin, {waitUntil: 'networkidle'}); await page.setViewportSize({width: 320, height: 900});
    await page.evaluate(() => document.documentElement.style.fontSize = '200%'); await check(page, '200% text at 320');
    await page.screenshot({path: path.join(output, 'text-200-percent.jpg'), type: 'jpeg', quality: 85, fullPage: true});
    await c.close();
    for (const mode of ['no-js', 'blocked-fonts-icons', 'forced-colors']) {
      const c = await context({javaScriptEnabled: mode !== 'no-js', ...(mode === 'forced-colors' ? {forcedColors: 'active'} : {})}, mode === 'blocked-fonts-icons');
      const page = await c.newPage(); await page.goto(origin, {waitUntil: 'networkidle'}); await check(page, mode); await c.close();
    }
    assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    fs.writeFileSync(path.join(output, 'featured-browser.json'), JSON.stringify({browser: browser.version(), layouts,
      ids, canonicalActivation: true, keyboard: true, directoryTools: 22, pageErrors: errors, failedResponses: failed,
      label: 'Curated featured tools; no popularity claim or usage data implied.', limitations: 'External analytics stubbed; no real-device, manual screen-reader or native toolbar zoom claim.'}, null, 2) + '\n');
    console.log('Phase 6: five ordered canonical tools; 10 responsive/fallback layouts, keyboard activation, 44px targets and all-22 directory passed.');
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
