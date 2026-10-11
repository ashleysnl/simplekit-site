import {readFileSync} from 'node:fs';
import path from 'node:path';

// Keep authored sheets separate; publish one ordered, dependency-free homepage
// stylesheet to avoid eight serial render-blocking requests on mobile.
export function homepageStyles(root) {
  return ['site.css', 'v2/foundations.css', 'v2/home.css', 'v2/discovery.css',
    'v2/trust.css', 'v2/goals.css', 'v2/featured.css', 'v2/onboarding.css',
    'v2/accessibility.css'].map(file => {
      const css = readFileSync(path.join(root, 'assets', file), 'utf8');
      // The bundled file lives in assets/v2; font URLs already resolve there.
      // No generic minifier or URL rewriting is applied to shared/calculator CSS.
      return `/* ${file} */\n${css}`;
    }).join('\n');
}

export function navigationScript(root) {
  // Run at the header boundary, before layout, instead of changing its height
  // after a deferred request. With JS disabled the ordinary links stay visible.
  return readFileSync(path.join(root, 'assets/v2/home.js'), 'utf8')
    .replaceAll('</script', '<\\/script');
}
