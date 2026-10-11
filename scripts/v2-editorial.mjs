import assert from 'node:assert/strict';
import { breadcrumbs, escapeHtml, shellHeader, shellFooter } from './v2-system-components.mjs';

// Controlled, authored templates only. Keep substantive inner HTML verbatim.
// Unexpected template structure fails the build instead of dropping content.
export function elementAt(html, pattern) {
  const match = pattern.exec(html);
  assert(match, `Missing template element: ${pattern}`);
  const tag = match[0].match(/^<([a-z][\w-]*)/i)[1];
  const tokens = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
  tokens.lastIndex = match.index;
  let depth = 0, token;
  while ((token = tokens.exec(html))) {
    depth += token[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return { start: match.index, end: tokens.lastIndex, html: html.slice(match.index, tokens.lastIndex), tag };
  }
  throw new Error(`Unclosed template element: ${tag}`);
}
const inner = element => element.html.replace(/^<[^>]+>/, '').replace(/<\/[^>]+>$/, '');
const without = (html, element) => html.slice(0, element.start) + html.slice(element.end);
const plain = html => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

export function renderEditorialPage(html) {
  const marker = html.match(/<!-- simplekit-v2-page:([a-z-]+) -->/);
  if (!marker) return html;
  const family = marker[1];
  assert(['article','learn-hub','directory','about','methodology','legal','support'].includes(family), 'Unsupported editorial family');
  const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
  assert(canonical && new URL(canonical).origin === 'https://simplekit.app', 'Canonical site URL required');
  const main = elementAt(html, /<main\b[^>]*class="page"[^>]*>/i);
  const content = elementAt(main.html, /<(?:section|article)\b[^>]*class="content"[^>]*>/i);
  const intro = elementAt(content.html, /<(?:div|header)\b[^>]*class="page-intro"[^>]*>/i);
  const crumb = elementAt(intro.html, /<div\b[^>]*class="breadcrumb"[^>]*>/i);
  const items = [...inner(crumb).matchAll(/<(a|span)\b([^>]*)>([\s\S]*?)<\/\1>/gi)].map(m => ({label: plain(m[3]), href: m[2].match(/href="([^"]+)"/) ? new URL(m[2].match(/href="([^"]+)"/)[1], canonical).pathname : undefined}));
  assert(items.length >= 2 && !items.at(-1).href, 'Breadcrumb hierarchy required');
  const oldFooter = elementAt(main.html, /<footer\b[^>]*class="footer"[^>]*>/i);
  let article = without(inner(content), {...intro, start: intro.start - content.html.indexOf('>') - 1, end: intro.end - content.html.indexOf('>') - 1});
  // Existing authored in-page navigation is retained, not duplicated.
  const existingNav = /<nav\b[^>]*aria-label="In this guide"/.test(article);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  const headings = [];
  article = article.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (whole, attrs, label) => {
    let id = attrs.match(/\bid="([^"]+)"/)?.[1];
    // Keep a section's existing anchor, including links from outside this page.
    if (!id) {
      const preceding = article.slice(0, article.indexOf(whole));
      const section = preceding.match(/<section\b[^>]*\bid="([^"]+)"[^>]*>\s*$/i);
      id = section?.[1];
    }
    if (!id) {
      const base = 'reading-' + plain(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,70);
      id = base; let index = 2; while(ids.has(id)) id = base + '-' + index++;
      ids.add(id); attrs += ` id="${id}"`;
    }
    const preceding = article.slice(0, article.indexOf(whole));
    const category = family === 'learn-hub' ? preceding.match(/<div class="section-kicker">([^<]*)<\/div>\s*$/)?.[1] : null;
    headings.push({label: plain(category || label), id});
    return `<h2${attrs}>${label}</h2>`;
  });
  // A labelled keyboard-scrollable region preserves every table cell on mobile.
  article = article.replace(/<div style="overflow-x:auto">\s*(<table[\s\S]*?<\/table>)\s*<\/div>/gi, (_, table) => {
    const label = plain(table.match(/<caption\b[^>]*>([\s\S]*?)<\/caption>/i)?.[1] || 'Article data table');
    return `<div class="v2s-table-scroll" role="region" tabindex="0" aria-label="${escapeHtml(label)}">${table}</div>`;
  });
  const toc = family !== 'directory' && !existingNav && headings.length >= 3 ? `<aside class="v2s-surface v2e-toc"><nav class="v2s-section-nav" aria-label="On this page"><strong>On this page</strong>${headings.map(h => `<a href="#${escapeHtml(h.id)}">${escapeHtml(h.label)}</a>`).join('')}</nav></aside>` : '';
  const reading = ['article','legal','methodology'].includes(family);
  const contentAttrs = content.html.match(/^<[^>]+>/)[0].match(/\bid="([^"]+)"/)?.[1];
  const transformed = `${breadcrumbs(items)}<header class="v2s-intro">${inner(withIntroBreadcrumbRemoved(intro, crumb))}</header><div class="${toc ? 'v2s-layout v2s-layout--editorial' : 'v2e-flow'}">${toc}<article class="v2e-content${reading ? ' v2s-prose' : ''}"${contentAttrs ? ` id="${contentAttrs}" tabindex="-1"` : ''}>${article}</article></div><section class="v2e-related" aria-label="Related guides, tools and support">${inner(oldFooter)}</section>`;
  const active = family === 'directory' ? 'Tools' : ['article','learn-hub'].includes(family) ? 'Learn' : family === 'about' ? 'About' : family === 'support' ? 'Support' : '';
  html = html.slice(0, main.start) + shellHeader(active, 'editorial') + '<script src="/assets/v2/shell.js"></script>' + `<main class="v2s-wrap v2e-main" id="main" tabindex="-1" data-page-family="${family}">${transformed}</main>` + shellFooter() + html.slice(main.end);
  html = html.replace(/<body\b[^>]*>/i, '<body class="sk-v2 v2-editorial" data-v2-system="1">');
  html = html.replace(/<a\b[^>]*class="v2-tools-skip"[^>]*>[\s\S]*?<\/a>/i, '');
  html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/gi, '');
  html = html.replace('</head>', '<link rel="stylesheet" href="/assets/v2/foundations.css"><link rel="stylesheet" href="/assets/v2/system.css"><link rel="stylesheet" href="/assets/v2/editorial.css">' + (family === 'directory' ? '<link rel="stylesheet" href="/assets/v2/goals.css">' : '') + '</head>');
  return html;
}
function withIntroBreadcrumbRemoved(intro, crumb) { return {...intro, html: without(intro.html, crumb)}; }
