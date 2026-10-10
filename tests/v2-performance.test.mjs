import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {repoRoot} from '../scripts/paths.mjs';
import {homepageStyles, navigationScript} from '../scripts/v2-home-resources.mjs';

test('homepage bundle preserves CSS order and resolves local font resources', () => {
  const css = homepageStyles(repoRoot);
  assert(css.indexOf('/* site.css */') < css.indexOf('/* v2/foundations.css */'));
  assert(css.indexOf('/* v2/home.css */') < css.indexOf('/* v2/discovery.css */'));
  assert(css.indexOf('/* v2/onboarding.css */') < css.indexOf('/* v2/accessibility.css */'));
  for (const url of [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1])) {
    assert(!url.includes('://'), 'No external CSS resource is introduced');
    assert(readFileSync(new URL('../assets/v2/' + url, import.meta.url)).byteLength > 0);
  }
});

test('navigation enhancement is synchronous at its markup boundary, with JS-free fallback', () => {
  const html = readFileSync(new URL('../templates/index.html', import.meta.url), 'utf8');
  assert(html.indexOf('</header>') < html.indexOf('<script>{{v2NavigationScript}}</script>'));
  assert(html.indexOf('<script>{{v2NavigationScript}}</script>') < html.indexOf('<main'));
  assert(!html.includes('defer src="assets/v2/home.js"'));
  assert(!/<nav[^>]+data-v2-navigation[^>]*\bhidden\b/.test(html));
  assert(!navigationScript(repoRoot).includes('</script'));
});
