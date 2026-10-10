import assert from 'node:assert/strict';
export const systemVersion = 1;
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function href(value) {
  assert(/^\/(?!\/)/.test(value) || /^#[a-z][\w-]*$/i.test(value), 'Use canonical root-relative routes or local anchors');
  assert(!/[\\\s]/.test(value), 'Unsafe route');
  return escapeHtml(value);
}
export function shellHeader(active = '', prefix = 'v2s') {
  assert(/^[a-z][\w-]*$/i.test(prefix), 'Invalid ID prefix');
  const links = [['Home','/'],['Tools','/tools/'],['Learn','/learn/'],['About','/about/'],['Support','/support/']];
  return `<a class="v2s-skip v2-button" href="#main">Skip to content</a><header class="v2s-header"><div class="v2s-wrap v2s-header-inner"><a class="v2s-brand" href="/" aria-label="SimpleKit home"><svg aria-hidden="true" focusable="false"><use href="/assets/v2/icons/sprite.svg#calculator"></use></svg>SimpleKit</a><button type="button" class="v2s-menu" data-v2s-menu aria-controls="${prefix}-nav" aria-expanded="false" hidden>Menu</button><nav class="v2s-nav" id="${prefix}-nav" aria-label="Main navigation">${links.map(([label,url])=>`<a href="${url}"${active===label?' aria-current="page"':''}>${label}</a>`).join('')}</nav></div></header>`;
}
export function shellFooter() {
  return `<footer class="v2s-footer"><div class="v2s-wrap v2s-footer-inner"><div class="v2s-stack"><strong>SimpleKit</strong><p class="v2s-help">Free planning tools with clearer next steps.</p></div><div class="v2s-stack"><nav aria-label="Footer navigation"><a href="/tools/">Tools</a><a href="/learn/">Learn</a><a href="/methodology/">Methodology &amp; sources</a><a href="/privacy/">Privacy</a><a href="/support/">Support</a></nav><p class="v2s-help">Estimates for planning, not financial advice. Financial inputs stay in your browser; existing site analytics are described in our privacy policy.</p></div></div></footer>`;
}
export function breadcrumbs(items) {
  return `<nav class="v2s-breadcrumb" aria-label="Breadcrumb"><ol>${items.map((item,i)=>`<li>${i===items.length-1?`<span aria-current="page">${escapeHtml(item.label)}</span>`:`<a href="${href(item.href)}">${escapeHtml(item.label)}</a>`}</li>`).join('')}</ol></nav>`;
}
export function relatedContent(items) {
  return `<div class="v2s-related">${items.map(item=>`<a href="${href(item.href)}">${escapeHtml(item.label)}<span aria-hidden="true">→</span></a>`).join('')}</div>`;
}
