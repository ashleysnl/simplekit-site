// Phase 5 acceptance against generated loopback output; no production navigation.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = new URL(process.env.SIMPLEKIT_PREVIEW_URL || 'http://127.0.0.1:8002').origin;
require('./v2-preview-origin.cjs')(origin);
const output = process.env.SIMPLEKIT_EVIDENCE_DIR || '/tmp/simplekit-v2-goals';
fs.mkdirSync(output, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/tools.json')));
const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/v2-discovery.json')));
const ids = ['retirement', 'home', 'budget', 'investing'];
const names = ['Retirement', 'Home & mortgage', 'Budget & debt', 'Investing'];
const errors = [], failed = [], layouts = [], routes = [];
async function context(browser, options = {}, blockAssets = false) {
  const c = await browser.newContext({ viewport: { width: 390, height: 1000 }, ...options });
  c.setDefaultTimeout(8000);
  await c.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.fulfill({ body: '', contentType: 'text/javascript' });
    if (blockAssets && (/\.woff$/.test(url.pathname) || url.pathname.endsWith('sprite.svg'))) return route.abort();
    return route.continue();
  });
  c.on('page', p => {
    p.on('pageerror', error => errors.push(error.message));
    p.on('response', response => { if (new URL(response.url()).origin === origin && response.status() >= 400) failed.push(response.url()); });
  });
  return c;
}
async function checkCards(p, state) {
  assert.deepEqual(await p.locator('.v2-goal-name').allTextContents(), names);
  const cards = await p.locator('.v2-home-goal-list a').evaluateAll(nodes => nodes.map(n => {
    const rect = item => item.getBoundingClientRect().toJSON();
    return { id: n.dataset.goalId, href: n.getAttribute('href'), rect: rect(n), copy: rect(n.querySelector('.v2-goal-copy')),
      icon: rect(n.querySelector('.v2-icon-disc')), chevron: rect(n.querySelector('.v2-goal-chevron')),
      overflow: n.scrollWidth > n.clientWidth + 1 };
  }));
  assert.deepEqual(cards.map(card => card.id), ids);
  for (const card of cards) {
    assert.equal(card.href, 'tools/#' + card.id);
    assert(card.rect.width >= 44 && card.rect.height >= 44, `${state}: small target`);
    assert(!card.overflow, `${state}: clipped card`);
    assert(card.icon.right <= card.copy.left + 1, `${state}: icon overlaps copy`);
    assert(card.copy.right <= card.chevron.left + 1, `${state}: copy overlaps chevron`);
  }
  const geometry = await p.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    columns: getComputedStyle(document.querySelector('.v2-home-goal-list')).gridTemplateColumns.split(' ').length }));
  assert(geometry.scrollWidth <= geometry.width, `${state}: horizontal overflow`);
  assert.equal(await p.locator('.v2-home-goals .v2-goal-all').innerText(), 'View all 22 tools');
  // Cover retained homepage/footer links as well as the new goal controls.
  const smallTargets = await p.locator('a:not(.v2-skip-link), button, input').evaluateAll(nodes => nodes.filter(node => {
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
  }).map(node => ({ text: node.textContent.trim(), label: node.getAttribute('aria-label') })));
  assert.deepEqual(smallTargets, [], `${state}: homepage touch target below 44px`);
  layouts.push({ state, ...geometry, cards });
  return geometry;
}
async function checkDirectory(p) {
  const links = await p.locator('.v2-directory-tool').evaluateAll(nodes => nodes.map(n => ({ id: n.dataset.toolId, href: n.href, text: n.innerText })));
  assert.equal(links.length, 22); assert.equal(new Set(links.map(link => link.id)).size, 22);
  for (const tool of manifest.tools) {
    const link = links.find(link => link.id === tool.slug);
    assert(link); assert.equal(link.href, tool.canonicalUrl); assert(link.text.includes(tool.name));
  }
  const categories = await p.locator('.v2-directory-group').evaluateAll(nodes => nodes.map(n => ({ id: n.querySelector('h3').id, tools: [...n.querySelectorAll('[data-tool-id]')].map(a => a.dataset.toolId) })));
  assert.deepEqual(categories.map(group => group.id), ['retirement', 'home', 'budget', 'investing', 'tax', 'income', 'travel']);
  for (const category of categories) assert.deepEqual(category.tools, metadata.tools.filter(tool => tool.goals[0] === category.id).map(tool => tool.id));
  assert.equal(await p.locator('.v2-directory-nav a').first().innerText(), 'View all 22 tools');
  return categories;
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  try {
    for (const width of [320, 375, 390, 768, 1440, 1920]) {
      const c = await context(browser, { viewport: { width, height: 1200 } }), p = await c.newPage();
      await p.goto(origin, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
      const geometry = await checkCards(p, `width-${width}`);
      assert.equal(geometry.columns, width < 375 ? 1 : 2);
      // Ordinary card copy should wrap between words, never split "Retirement"
      // or "Understand" just to squeeze in the reference's two-column layout.
      const splitWords = await p.locator('.v2-goal-copy span').evaluateAll(nodes => nodes.flatMap(n => {
        const text = n.firstChild;
        return [...text.textContent.matchAll(/\S+/g)].filter(match => {
          const range = document.createRange(); range.setStart(text, match.index); range.setEnd(text, match.index + match[0].length);
          return range.getClientRects().length > 1;
        }).map(match => match[0]);
      }));
      assert.deepEqual(splitWords, [], `Split card words at ${width}`);
      await p.locator('.v2-home-goals').screenshot({ path: path.join(output, `goals-${width}.jpg`), type: 'jpeg', quality: 85 });
      if ([375, 390, 768, 1440].includes(width)) await p.screenshot({ path: path.join(output, `after-home-${width}.jpg`), type: 'jpeg', quality: 80, fullPage: true });
      await p.goto(origin + '/tools/', { waitUntil: 'networkidle' }); await checkDirectory(p);
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Directory overflow at ${width}`);
      if ([375, 390, 768, 1440].includes(width)) await p.screenshot({ path: path.join(output, `after-directory-${width}.jpg`), type: 'jpeg', quality: 80, fullPage: true });
      await c.close();
    }
    // Exercise each real card with Enter, direct loading, reload and Back/Forward.
    const c = await context(browser), p = await c.newPage();
    for (const id of ids) {
      await p.goto(origin, { waitUntil: 'networkidle' });
      const link = p.locator(`[data-goal-id="${id}"]`); await link.focus();
      assert.equal(await link.evaluate(n => getComputedStyle(n).outlineStyle), 'solid');
      await p.keyboard.press('Enter'); await p.waitForURL(origin + '/tools/#' + id);
      await p.waitForLoadState('networkidle'); await checkDirectory(p);
      assert.equal(await p.evaluate(() => document.activeElement.id), id, 'Native fragment focus');
      assert(await p.locator('#' + id).evaluate(n => n.getBoundingClientRect().top >= 0 && n.getBoundingClientRect().top < innerHeight), 'Native fragment scroll');
      await p.reload({ waitUntil: 'networkidle' }); assert.equal(new URL(p.url()).hash, '#' + id);
      await p.goBack({ waitUntil: 'networkidle' }); assert.equal(p.url(), origin + '/');
      await p.goForward({ waitUntil: 'networkidle' }); assert.equal(new URL(p.url()).hash, '#' + id);
      await p.goto(origin + '/tools/#' + id, { waitUntil: 'networkidle' }); await checkDirectory(p);
      routes.push({ id, keyboard: true, direct: true, reload: true, backForward: true, focus: true });
    }
    for (const id of ['tax', 'income', 'travel']) {
      await p.locator(`.v2-directory-nav a[href="#${id}"]`).click(); await p.waitForURL(origin + '/tools/#' + id);
      assert.equal(await p.evaluate(() => document.activeElement.id), id); await checkDirectory(p);
    }
    await p.locator('.v2-directory-nav a').first().click(); await p.waitForURL(origin + '/tools/#all-tools');
    await checkDirectory(p); assert.equal(await p.evaluate(() => document.activeElement.id), 'all-tools');
    await p.goto(origin + '/tools/#unknown-goal', { waitUntil: 'networkidle' }); await checkDirectory(p);
    const localRoutes = [];
    for (const tool of manifest.tools) {
      const response = await c.request.get(origin + tool.canonicalPath);
      assert.equal(response.status(), 200); localRoutes.push(tool.canonicalPath);
    }
    await p.goto(origin, { waitUntil: 'networkidle' });
    await p.locator('.v2-home-goals .v2-goal-all').click(); await p.waitForURL(origin + '/tools/'); await checkDirectory(p);
    await c.close();
    const touch = await context(browser, { hasTouch: true, isMobile: true }), tp = await touch.newPage();
    await tp.goto(origin, { waitUntil: 'networkidle' }); await tp.locator('[data-goal-id="home"]').tap(); await tp.waitForURL(origin + '/tools/#home'); await checkDirectory(tp); await touch.close();
    const enlarged = await context(browser, { viewport: { width: 1440, height: 1200 } }), ep = await enlarged.newPage();
    await ep.goto(origin, { waitUntil: 'networkidle' }); await ep.evaluate(() => document.documentElement.style.zoom = '2');
    await checkCards(ep, 'CSS zoom 200%');
    await ep.evaluate(() => document.documentElement.style.zoom = ''); await ep.setViewportSize({ width: 320, height: 1200 });
    await ep.evaluate(() => document.documentElement.style.fontSize = '200%'); await checkCards(ep, 'text 200% at 320'); await enlarged.close();
    const fallback = await context(browser, { javaScriptEnabled: false, forcedColors: 'active' }, true), fp = await fallback.newPage();
    await fp.goto(origin, { waitUntil: 'networkidle' }); await checkCards(fp, 'no JS, blocked fonts/icons, forced colors');
    await fp.locator('[data-goal-id="budget"]').click(); await fp.waitForURL(origin + '/tools/#budget'); await checkDirectory(fp);
    assert.equal(await fp.locator('.v2-directory-tool:visible').count(), 22);
    await fp.locator('.v2-directory-nav a').first().click(); await fp.waitForURL(origin + '/tools/#all-tools'); await fallback.close();
    assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    fs.writeFileSync(path.join(output, 'goals-browser.json'), JSON.stringify({ browser: browser.version(), layouts, routes, localRoutes, tools: 22, categoryRule: 'First existing discovery goal is the primary directory category; secondary tags remain in search.', allToolsReset: true, secondaryCategories: true, touch: true, noJavaScript: true, blockedFontsIcons: true, forcedColors: true, pageErrors: errors, failedLocalResponses: failed, limitations: 'CSS zoom and text enlargement only; no native toolbar zoom, real-device or manual screen-reader claim. External analytics are stubbed.' }, null, 2) + '\n');
    console.log('Phase 5: six widths, four native goal destinations/direct/reload/Back/Forward, 22 unique canonical tools, secondary goals/all-tools, keyboard/focus/touch/no-JS/font-icon/forced-colors/200% checks pass. Zero page errors or failed local responses.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
