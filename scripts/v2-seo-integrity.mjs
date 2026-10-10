import assert from 'node:assert/strict';
import {existsSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {inflateSync} from 'node:zlib';
import {attributes, filesIn, resolveLocal} from './validate-output.mjs';

const host = 'https://simplekit.app';
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(m => attributes(m[0]));
const plain = value => value.replace(/<[^>]*>/g, '').replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n))).replace(/&(amp|quot|apos|lt|gt|nbsp);/g, (_, n) => ({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '})[n]).replace(/\s+/g, ' ').trim();
const blocks = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi'))].map(m => plain(m[1]));
const one = (values, label) => { assert.equal(values.length, 1, `Expected one ${label}`); assert(values[0], `Empty ${label}`); return values[0]; };
export function schemaNodes(value) {
  if (!value || typeof value !== 'object') return [];
  return [...(Array.isArray(value) ? [] : [value]), ...Object.values(value).flatMap(schemaNodes)];
}

export function validatePageMetadata(html, canonical, {fullSocial = false} = {}) {
  const title = one(blocks(html, 'title'), `title: ${canonical}`);
  const h1 = one(blocks(html, 'h1'), `H1: ${canonical}`);
  const meta = tags(html, 'meta');
  const get = name => meta.filter(a => (a.name || a.property)?.toLowerCase() === name).map(a => plain(a.content || ''));
  const description = one(get('description'), `description: ${canonical}`);
  const actual = one(tags(html, 'link').filter(a => a.rel?.toLowerCase() === 'canonical').map(a => a.href), `canonical: ${canonical}`);
  assert.equal(actual, canonical, `Incorrect canonical: ${canonical}`);
  assert.equal(one(get('og:url'), `Open Graph URL: ${canonical}`), canonical, `Open Graph URL differs: ${canonical}`);
  one(get('og:title'), `Open Graph title: ${canonical}`);
  one(get('og:description'), `Open Graph description: ${canonical}`);
  assert(!get('robots').some(value => /(?:^|[,\s])(?:noindex|none)(?:$|[,\s])/i.test(value)), `Indexed page has noindex: ${canonical}`);
  if (fullSocial) for (const name of ['og:type','og:image','twitter:card','twitter:title','twitter:description','twitter:image']) one(get(name), `${name}: ${canonical}`);
  const structuredData = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attributes('<script ' + match[1] + '>').type !== 'application/ld+json') continue;
    let value;
    try { value = JSON.parse(match[2]); } catch { assert.fail(`Invalid JSON-LD: ${canonical}`); }
    assert(value && typeof value === 'object', `JSON-LD must be an object/array: ${canonical}`);
    const entries = Array.isArray(value) ? value : [value];
    for (const entry of entries) assert.equal(entry['@context'], 'https://schema.org', `Unexpected schema context: ${canonical}`);
    structuredData.push(value);
  }
  const missingSocial = ['og:image','twitter:card','twitter:title','twitter:description','twitter:image'].filter(name => !get(name).length);
  return {canonical, title, description, h1, headings: ['h2','h3'].flatMap(tag => blocks(html, tag).map(text => ({level:tag,text}))), structuredData, missingSocial};
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
export function validateSharePng(bytes) {
  assert(bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), 'Share image is not PNG');
  let offset = 8, dimensions, ended = false;
  const idat = [];
  while (offset < bytes.length) {
    assert(offset + 12 <= bytes.length, 'Truncated PNG chunk');
    const size = bytes.readUInt32BE(offset), end = offset + 12 + size;
    assert(end <= bytes.length, 'Truncated PNG chunk payload');
    const name = bytes.toString('ascii', offset+4, offset+8), data = bytes.subarray(offset+8, offset+8+size);
    assert.equal(crc32(bytes.subarray(offset+4, offset+8+size)), bytes.readUInt32BE(offset+8+size), `Invalid PNG ${name} checksum`);
    if (name === 'IHDR') { assert.equal(size,13); dimensions = {width:data.readUInt32BE(0),height:data.readUInt32BE(4)}; }
    if (name === 'IDAT') idat.push(data);
    offset = end;
    if (name === 'IEND') { assert.equal(size,0); ended = true; break; }
  }
  assert(ended && offset === bytes.length && idat.length && dimensions?.width > 0 && dimensions.height > 0, 'Incomplete PNG image');
  assert(inflateSync(Buffer.concat(idat)).length > 0, 'PNG has no pixel data');
  return dimensions;
}

export function auditSeoIntegrity(root, manifest) {
  const indexed = [...manifest.site.pages.filter(p => p.includeInSitemap !== false).map(p => p.loc), ...manifest.tools.filter(t => t.includeInSitemap).map(t => t.canonicalUrl)];
  const calculatorPaths = manifest.tools.map(t => t.canonicalPath);
  const pages = [], titles = new Set(), descriptions = new Set();
  for (const canonical of indexed) {
    const url = new URL(canonical);
    assert.equal(url.origin, host); assert(!url.search && !url.hash, 'Indexed query/filter duplicate');
    const filename = path.join(root, '.' + url.pathname, url.pathname.endsWith('/') ? 'index.html' : '');
    const html = readFileSync(filename, 'utf8');
    const inherited = calculatorPaths.some(p => url.pathname.startsWith(p));
    const page = validatePageMetadata(html, canonical, {fullSocial: !inherited});
    assert(!titles.has(page.title), `Duplicate indexed title: ${page.title}`); titles.add(page.title);
    assert(!descriptions.has(page.description), `Duplicate indexed description: ${canonical}`); descriptions.add(page.description);
    page.file = path.relative(root, filename); page.inheritedCalculatorSource = inherited;
    pages.push(page);
    if (manifest.tools.some(t => t.canonicalUrl === canonical)) {
      const apps = page.structuredData.flatMap(schemaNodes).filter(s => s['@type'] === 'WebApplication');
      assert.equal(apps.length,1, `Expected one calculator WebApplication: ${canonical}`);
      assert.equal(apps[0].url,canonical, `Calculator schema URL differs: ${canonical}`);
      assert(apps[0].name && apps[0].description, `Incomplete calculator schema: ${canonical}`);
    }
  }
  let internalLinks = 0, resourceReferences = 0;
  const resources = new Set(), compatibility = [], fragmentReview = [];
  const files = filesIn(root).filter(p => p.endsWith('.html'));
  const documents = new Map(files.map(filename => {
    const html = readFileSync(filename,'utf8');
    const markup = html.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
    const ids = new Set([...markup.matchAll(/<[a-z][^>]*>/gi)].map(m => attributes(m[0]).id).filter(Boolean));
    return [filename,{html,markup,ids}];
  }));
  for (const [filename, {html,markup}] of documents) {
    const relative = path.relative(root, filename);
    for (const a of tags(markup, 'a')) {
      if (!a.href) continue;
      const target = resolveLocal(a.href,filename,root,host);
      // resolveLocal excludes same-document fragments; verify those explicitly.
      if (a.href.startsWith('#')) { assert(documents.get(filename).ids.has(decodeURIComponent(a.href.slice(1))) || a.href === '#', `Missing same-page fragment ${a.href} in ${relative}`); continue; }
      if (!target) continue;
      internalLinks++;
      assert(existsSync(target), `Broken internal link ${a.href} in ${relative}`);
      const file = statSync(target).isDirectory() ? path.join(target,'index.html') : target;
      assert(existsSync(file), `Broken internal destination ${a.href} in ${relative}`);
      const fragment = new URL(a.href.replaceAll('&amp;','&'), host + '/' + relative).hash.slice(1);
      if (fragment && documents.has(file) && !documents.get(file).ids.has(decodeURIComponent(fragment))) fragmentReview.push({file:relative,href:a.href});
    }
    for (const match of html.matchAll(/<(?:img|source|script|link|meta|video)\b[^>]*>/gi)) {
      const a = attributes(match[0]);
      const refs = [a.src,a.poster];
      if (a.href && /^(?:stylesheet|icon|manifest|preload|modulepreload)$/.test(a.rel)) refs.push(a.href);
      if (a.srcset) refs.push(...a.srcset.split(',').map(s => s.trim().split(/\s+/)[0]));
      if (['og:image','og:image:secure_url','twitter:image'].includes(a.property || a.name)) refs.push(a.content);
      for (const ref of refs.filter(Boolean)) {
        const target = resolveLocal(ref,filename,root,host); if (!target) continue;
        assert(existsSync(target) && statSync(target).isFile() && statSync(target).size > 0, `Missing referenced asset ${ref} in ${relative}`);
        resources.add(new URL(ref,host+'/'+relative).pathname); resourceReferences++;
      }
    }
    if (relative.startsWith('tools/') && relative !== 'tools/index.html') {
      const canonical = tags(html,'link').find(a => a.rel === 'canonical')?.href;
      assert(manifest.tools.some(t => t.canonicalUrl === canonical), `Compatibility target changed: ${relative}`);
      const robots = tags(html,'meta').find(a => a.name === 'robots')?.content;
      assert(/noindex/.test(robots) && /follow/.test(robots), `Compatibility noindex/follow changed: ${relative}`);
      compatibility.push({file:relative,canonical,robots});
    }
  }
  const home = pages.find(p => p.canonical === host+'/');
  const website = home.structuredData.find(s => s['@type'] === 'WebSite');
  assert.equal(website?.creator?.name,'Ashley Skinner'); assert.equal(website?.creator?.['@id'],host+'/about/#maintainer');
  const checkClaims = value => {
    if (!value || typeof value !== 'object') return;
    assert(!('aggregateRating' in value) && !('review' in value) && ![value['@type']].flat().includes('SearchAction'), 'Unsupported V2 rating/review/search schema');
    for (const v of Object.values(value)) checkClaims(v);
  };
  for (const page of pages.filter(p => !p.inheritedCalculatorSource)) for (const schema of page.structuredData) checkClaims(schema);
  const png = validateSharePng(readFileSync(path.join(root,'og-image.png')));
  for (const pathname of ['index.html','tools/index.html']) {
    const html = documents.get(path.join(root,pathname)).html, meta = tags(html,'meta');
    for (const key of ['og:image','twitter:image']) assert.equal(new URL(meta.find(a => (a.name || a.property) === key).content).pathname,'/og-image.png');
    for (const [key, dimension] of [['og:image:width','width'],['og:image:height','height']]) assert.equal(Number(meta.find(a => a.property === key)?.content),png[dimension], `Share dimensions differ: ${pathname}`);
  }
  const verification = tags(documents.get(path.join(root,'index.html')).html,'meta').find(a => a.name === 'google-site-verification')?.content;
  assert.equal(verification,'uKeIX4G5ErcTLSuhhLFYufXoI-wC9OA6fSPn7REv7No');
  return {indexedPages:pages.length,htmlPages:files.length,internalLinks,resourceReferences,resources:[...resources].sort(),shareImage:png,pages,compatibility,fragmentReview,limitations:['Inherited missing optional social tags are recorded, not invented or patched in copied calculators.','JSON-LD is parsed and checked against retained identities; this is not an external rich-result eligibility certification.','Cross-page fragments mounted by calculator JavaScript need runtime verification.','No live production redirect, indexing or Search Console configuration changes.']};
}
