// Optional Phase 2 browser acceptance. Isolated Playwright; generated loopback output only.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = new URL(process.env.SIMPLEKIT_PREVIEW_URL || 'http://127.0.0.1:8001').origin;
assert(['127.0.0.1', 'localhost'].includes(new URL(origin).hostname));
const output = process.env.SIMPLEKIT_EVIDENCE_DIR || '/tmp/simplekit-v2-header-hero';
fs.mkdirSync(output, { recursive: true });
const errors = [], failed = [], external = new Set();
async function context(browser, options = {}, mode = 'normal') {
  const c = await browser.newContext({ viewport: { width: 390, height: 900 }, ...options });
  c.setDefaultTimeout(5000);
  await c.route('**/*', async r => {
    const url = new URL(r.request().url());
    if (url.origin !== origin) {
      external.add(url.hostname);
      assert.equal(url.hostname, 'www.googletagmanager.com', 'Unexpected external dependency');
      return r.fulfill({ body: '', contentType: 'text/javascript' });
    }
    const asset = url.pathname.endsWith('.woff') || url.pathname.includes('/v2/images/');
    if (asset && mode === 'blocked') return r.abort();
    if (asset && mode === 'delayed') await new Promise(resolve => setTimeout(resolve, 500));
    return r.continue();
  });
  c.on('page', p => {
    p.on('pageerror', e => errors.push(e.message));
    p.on('response', r => { if (r.status() >= 400) failed.push(r.url()); });
  });
  return c;
}
async function layout(p) {
  return p.evaluate(() => {
    const box = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    const h1 = document.querySelector('h1');
    const range = document.createRange(); range.selectNodeContents(h1);
    return {
      viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      header: box('.v2-header'), hero: box('.v2-home-hero'), headline: box('h1'),
      textRects: [...range.getClientRects()].map(r => r.toJSON()),
      body: box('.v2-hero-body'), discovery: box('.v2-discovery-slot'),
      source: document.querySelector('.v2-coastal-picture img').currentSrc,
      fontFaces: [...document.fonts].map(f => ({ family: f.family, weight: f.weight, status: f.status }))
    };
  });
}
async function assertLayout(p) {
  const value = await layout(p);
  assert(value.scrollWidth <= value.viewport, `Overflow at ${value.viewport}`);
  for (const rect of value.textRects) {
    assert(rect.left >= 0 && rect.right <= value.viewport + 1, 'Clipped headline');
    assert(rect.top >= value.hero.top && rect.bottom <= value.hero.bottom, 'Headline outside hero');
  }
  assert(value.headline.bottom <= value.body.top, 'Headline/body overlap');
  assert(value.body.bottom <= value.discovery.top, 'Body/control overlap');
  return value;
}
function luminance(rgb) {
  return rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
}
function worstContrast(width, right, color) {
  const x = right / width, end = width < 1024 ? .72 : .54;
  const alpha = width < 768 ? .98 - .10 * x : x <= end ? .98 - .04 * x / end : .94 - .76 * (x - end) / (1 - end);
  // Black is the darkest possible landscape pixel. The additional bottom fade only raises contrast.
  const background = [252, 252, 251].map(v => v * alpha);
  return (luminance(background) + .05) / (luminance(color) + .05);
}
async function menu(p, screenshot) {
  const button = p.locator('.v2-menu-toggle');
  assert.equal(await button.getAttribute('aria-label'), 'Open navigation menu');
  const nav = p.getByRole('navigation', { name: 'Primary' });
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
  assert.equal(await nav.count(), 0, 'Closed navigation exposed to accessibility tree');
  await button.focus(); await button.press('Enter');
  assert.equal(await button.getAttribute('aria-expanded'), 'true');
  assert.equal(await button.getAttribute('aria-label'), 'Close navigation menu');
  const box = await button.boundingBox(); assert(box.width >= 44 && box.height >= 44);
  await p.keyboard.press('Tab'); await p.getByRole('link', { name: 'Home', exact: true }).evaluate(n => {
    if (document.activeElement !== n) throw Error('First tab did not reach Home');
  });
  assert.equal(await p.locator(':focus').evaluate(n => getComputedStyle(n).outlineStyle), 'solid');
  if (screenshot) await p.screenshot({ path: path.join(output, screenshot), type: 'jpeg', quality: 85 });
  const session = await p.context().newCDPSession(p);
  const tree = await session.send('Accessibility.getFullAXTree'); await session.detach();
  const control = tree.nodes.find(n => !n.ignored && n.role?.value === 'button' && n.name?.value === 'Close navigation menu');
  assert(control?.properties.some(v => v.name === 'expanded' && v.value.value === true));
  assert(tree.nodes.some(n => !n.ignored && n.role?.value === 'navigation' && n.name?.value === 'Primary'));
  await p.keyboard.press('Escape'); assert.equal(await button.getAttribute('aria-expanded'), 'false');
  assert(await button.evaluate(n => n === document.activeElement), 'Escape must return focus');
  await button.press('Space'); assert.equal(await button.getAttribute('aria-expanded'), 'true');
  await p.getByRole('link', { name: 'Support', exact: true }).focus(); await p.keyboard.press('Tab');
  assert.equal(await button.getAttribute('aria-expanded'), 'false', 'Tab leaving header must close disclosure');
  assert(await p.locator('.v2-discovery-slot a').first().evaluate(n => n === document.activeElement), 'Disclosure must allow onward tabbing');
  await button.click(); await p.getByRole('link', { name: 'Home', exact: true }).focus();
  await p.locator('.v2-home-hero').click({ position: { x: 2, y: 20 } });
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
  assert(await p.locator('#home-navigation').evaluate(n => !n.contains(document.activeElement)
    && document.activeElement.getClientRects().length > 0), 'Outside click must leave focus on a visible control or content target');
  await button.click(); await button.click(); assert.equal(await button.getAttribute('aria-expanded'), 'false');
  return { keyboardEnterSpaceTab: true, escapeFocusReturn: true, outsideClickVisibleFocus: true, nonModalTabExit: true, chromiumAXNameExpandedNavigation: true };
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const results = [], contrasts = [], menuResults = [];
  try {
    const widths = [...new Set([320, 375, 390, 768, 899, 900, 1024, 1440, 1920, ...Array.from({ length: 21 }, (_, i) => 320 + i * 80)])].sort((a, b) => a - b);
    for (const width of widths) {
      const c = await context(browser, { viewport: { width, height: 900 } });
      const p = await c.newPage(); const response = await p.goto(origin, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200); assert.equal(await p.locator('h1').count(), 1);
      assert.equal(await p.locator('h1').innerText(), 'Better financial decisions start here.');
      assert.equal(await p.getByRole('banner').count(), 1); assert.equal(await p.getByRole('main').count(), 1);
      assert.equal(await p.getByRole('contentinfo').count(), 1);
      const img = p.locator('.v2-coastal-picture img');
      assert.equal(await img.getAttribute('alt'), '');
      await img.evaluate(async n => { await n.decode(); if (!n.naturalWidth) throw Error('Image failed to decode'); });
      await p.evaluate(() => document.fonts.ready);
      const value = await assertLayout(p); results.push({ width, ...value });
      for (const [key, color, minimum] of [['body', [82, 98, 124], 4.5], ['headline', [16, 27, 70], 3]]) {
        const ratio = worstContrast(width, value[key].right, color);
        assert(ratio >= minimum, `Hero ${key} contrast ${ratio} at ${width}`);
        contrasts.push({ width, text: key, darkestPossiblePixelRatio: ratio, minimum });
      }
      if ([320, 375, 390, 768, 1440, 1920].includes(width))
        await p.screenshot({ path: path.join(output, `homepage-${width}.jpg`), type: 'jpeg', quality: 85 });
      if ([375, 768].includes(width)) menuResults.push({ width, ...await menu(p, `menu-${width}.jpg`) });
      if (width >= 900) assert.equal(await p.getByRole('navigation', { name: 'Primary' }).getByRole('link').count(), 5);
      await c.close();
    }
    const c = await context(browser); const p = await c.newPage(); await p.goto(origin, { waitUntil: 'networkidle' });
    // All existing navigation destinations resolve locally; canonical tool hrefs are preserved separately.
    const destinations = await p.locator('#home-navigation a').evaluateAll(nodes => nodes.map(n => ({ name: n.textContent, href: n.getAttribute('href') })));
    for (const { href } of destinations) assert.equal((await c.request.get(new URL(href, origin + '/').href)).status(), 200);
    await p.locator('.v2-menu-toggle').click(); await p.getByRole('link', { name: 'Tools', exact: true }).click();
    await p.waitForURL(origin + '/tools/'); assert.equal(await p.locator('h1').count(), 1);
    await p.goto(origin, { waitUntil: 'networkidle' });
    // Resize with active menu link, then with active desktop link: focus stays on a visible control.
    await p.locator('.v2-menu-toggle').click(); await p.getByRole('link', { name: 'Home', exact: true }).focus();
    await p.setViewportSize({ width: 1440, height: 900 });
    assert(await p.getByRole('link', { name: 'Home', exact: true }).evaluate(n => n === document.activeElement));
    await p.setViewportSize({ width: 390, height: 900 });
    assert(await p.locator('.v2-menu-toggle').evaluate(n => n === document.activeElement));
    await p.setViewportSize({ width: 1440, height: 900 });
    assert(await p.getByRole('link', { name: 'Home', exact: true }).evaluate(n => n === document.activeElement));
    await p.screenshot({ path: path.join(output, 'homepage-full.jpg'), type: 'jpeg', quality: 80, fullPage: true });
    await c.close();
    const touch = await context(browser, { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
    const t = await touch.newPage(); await t.goto(origin, { waitUntil: 'networkidle' });
    await assertLayout(t); await t.locator('.v2-menu-toggle').tap();
    assert.equal(await t.locator('.v2-menu-toggle').getAttribute('aria-expanded'), 'true');
    await t.screenshot({ path: path.join(output, 'touch-landscape-menu.jpg'), type: 'jpeg', quality: 85 });
    await t.locator('.v2-home-hero').tap({ position: { x: 2, y: 20 } });
    assert.equal(await t.locator('.v2-menu-toggle').getAttribute('aria-expanded'), 'false');
    await touch.close();
    const nojs = await context(browser, { javaScriptEnabled: false }); const n = await nojs.newPage();
    await n.goto(origin, { waitUntil: 'networkidle' }); await assertLayout(n);
    assert.equal(await n.getByRole('navigation').getByRole('link').count(), 5);
    assert.equal(await n.getByRole('button').count(), 0); await n.getByRole('link', { name: 'Tools', exact: true }).click();
    await n.waitForURL(origin + '/tools/'); await nojs.close();
    const fallback = await context(browser, {}, 'blocked'); const f = await fallback.newPage();
    await f.goto(origin, { waitUntil: 'networkidle' }); await assertLayout(f); assert(await f.locator('h1').isVisible());
    await menu(f); await f.screenshot({ path: path.join(output, 'image-font-fallback.jpg'), type: 'jpeg', quality: 85 });
    await fallback.close();
    const delayed = await context(browser, {}, 'delayed'); const d = await delayed.newPage();
    await d.addInitScript(() => { window.v2Shifts = []; new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.v2Shifts.push(entry.value);
    }).observe({ type: 'layout-shift', buffered: true }); });
    await d.goto(origin, { waitUntil: 'domcontentloaded' }); const before = await layout(d);
    await d.waitForLoadState('networkidle'); await d.evaluate(() => document.fonts.ready);
    const after = await assertLayout(d), cls = await d.evaluate(() => window.v2Shifts.reduce((a, b) => a + b, 0));
    assert(Math.abs(before.discovery.top - after.discovery.top) <= 1, 'Font/image loading moved hero controls');
    assert(cls <= .01, `Local delayed-load CLS ${cls}`); await delayed.close();
    // CSS magnification plus half-width reflow cover 200% reading and navigation geometry.
    // This is not an OS/browser toolbar zoom or a real-device claim.
    const zoom = await context(browser, { viewport: { width: 1440, height: 900 } }); const z = await zoom.newPage();
    await z.goto(origin, { waitUntil: 'networkidle' }); await z.evaluate(() => document.body.style.zoom = '2');
    await assertLayout(z); assert.equal(await z.getByRole('navigation').getByRole('link').count(), 5);
    for (const link of await z.getByRole('navigation').getByRole('link').all()) { await link.focus(); assert(await link.isVisible()); }
    await z.screenshot({ path: path.join(output, 'magnification-200-percent.jpg'), type: 'jpeg', quality: 85 });
    await z.evaluate(() => document.body.style.zoom = ''); await z.setViewportSize({ width: 720, height: 450 });
    await assertLayout(z); await menu(z); await zoom.close();
    assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    fs.writeFileSync(path.join(output, 'browser.json'), JSON.stringify({
      browser: browser.version(), results, contrasts, menuResults, destinations,
      touchLandscape: true, noJavaScriptNavigation: true, imageFontFailureVisible: true,
      resizeFocus: true, delayedLoading: { before: before.discovery.top, after: after.discovery.top, cls },
      magnification200Percent: 'CSS zoom 2 at 1440 plus 720px reflow; no browser toolbar zoom claim',
      accessibilityScope: 'Chromium AX tree, role/name/state, keyboard and touch emulation. VoiceOver/NVDA and real devices unavailable; Phase 8 manual coverage remains.',
      pageErrors: errors, failedResponses: failed, stubbedExternalHosts: [...external]
    }, null, 2) + '\n');
    console.log(`Phase 2: ${results.length} widths 320–1920 pass; keyboard/ARIA/touch/navigation/fallback/loading/200% geometry checks pass.`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
