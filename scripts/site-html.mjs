// Bundle Core's supported API without changing its implementation or URLs used
// for calculator navigation. Core exports an ES module, even for older callers.
export function localizeCoreHtml(html) {
  return html
    .replace(/https:\/\/core\.simplekit\.app\/(core\.(?:css|js))/g, "/assets/core/$1")
    .replace(/<script\b[^>]*\bsrc=["']\/assets\/core\/core\.js["'][^>]*>/gi, tag => {
      return /\btype\s*=/.test(tag)
        ? tag.replace(/\btype\s*=\s*(["'])[^"']*\1/, 'type="module"')
        : tag.replace("<script", '<script type="module"');
    });
}
