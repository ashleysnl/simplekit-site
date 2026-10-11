import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validatePageMetadata, validateSharePng, auditSeoIntegrity} from '../scripts/v2-seo-integrity.mjs';
const host='https://simplekit.app';
const png=readFileSync(new URL('../assets/v2/social-share.png',import.meta.url));
const dimensions=validateSharePng(png);
function page(url,title='Test page') {
 return `<!doctype html><title>${title}</title><meta name="description" content="Description of ${title}"><meta name="robots" content="index,follow"><link rel="canonical" href="${url}"><meta property="og:url" content="${url}"><meta property="og:title" content="${title}"><meta property="og:description" content="Description of ${title}"><meta property="og:type" content="website"><meta property="og:image" content="${host}/og-image.png?v=3"><meta property="og:image:width" content="${dimensions.width}"><meta property="og:image:height" content="${dimensions.height}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="Description of ${title}"><meta name="twitter:image" content="${host}/og-image.png?v=3"><h1>${title}</h1>`;
}
test('indexed metadata rejects missing/duplicate canonicals, mismatched social URLs, noindex and invalid JSON-LD',()=>{
 const url=host+'/', valid=page(url);
 assert.equal(validatePageMetadata(valid,url,{fullSocial:true}).h1,'Test page');
 for(const changed of [valid.replace('<title>Test page</title>','<title></title>'),valid.replace('<h1>Test page</h1>',''),valid+'<h1>Duplicate</h1>',valid.replace(/<link[^>]+>/,''),valid+`<link rel="canonical" href="${url}">`,valid.replace(`property="og:url" content="${url}"`,'property="og:url" content="https://wrong.example/"'),valid.replace('index,follow','noindex,follow'),valid+'<script type="application/ld+json">{broken}</script>']) assert.throws(()=>validatePageMetadata(changed,url,{fullSocial:true}));
});
test('authored social tags are required; inherited optional gaps remain explicitly reportable',()=>{
 const url=host+'/', changed=page(url).replace(/<meta[^>]+(?:property="og:image"|name="twitter:image")[^>]*>/g,'');
 assert.throws(()=>validatePageMetadata(changed,url,{fullSocial:true}),/og:image/);
 assert.deepEqual(validatePageMetadata(changed,url).missingSocial,['og:image','twitter:image']);
});
test('share-image integrity rejects truncated payloads, corrupt checksums and trailing bytes',()=>{
 assert(dimensions.width>1000 && dimensions.height>500);
 assert.throws(()=>validateSharePng(png.subarray(0,Math.floor(png.length/2))),/Truncated/);
 assert.throws(()=>validateSharePng(png.subarray(0,png.length-7)),/Truncated/);
 const corrupt=Buffer.from(png);corrupt[24]^=1;
 assert.throws(()=>validateSharePng(corrupt),/checksum/);
 assert.throws(()=>validateSharePng(Buffer.concat([png,Buffer.from('bad')])),/Incomplete/);
});
test('output integrity rejects broken HTML links, preloads, share assets and compatibility indexing',t=>{
 const root=mkdtempSync(path.join(os.tmpdir(),'simplekit-seo-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 mkdirSync(path.join(root,'tools/old'),{recursive:true});
 const home=page(host+'/','Home')+'<meta name="google-site-verification" content="uKeIX4G5ErcTLSuhhLFYufXoI-wC9OA6fSPn7REv7No"><a href="/tools/">Tools</a><script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'WebSite',creator:{name:'Ashley Skinner','@id':host+'/about/#maintainer'}})+'</script>';
 const tools=page(host+'/tools/','Tools');
 writeFileSync(path.join(root,'index.html'),home);writeFileSync(path.join(root,'tools/index.html'),tools);writeFileSync(path.join(root,'og-image.png'),png);
 const manifest={site:{pages:[{loc:host+'/'},{loc:host+'/tools/'}]},tools:[]};
 // The compatibility fixture is introduced after ordinary metadata/resources pass.
 rmSync(path.join(root,'tools/old'),{recursive:true});
 assert.equal(auditSeoIntegrity(root,manifest).indexedPages,2);
 writeFileSync(path.join(root,'index.html'),home+'<a href="/missing/">Missing</a>');assert.throws(()=>auditSeoIntegrity(root,manifest),/Broken internal link/);
 writeFileSync(path.join(root,'index.html'),home+'<link rel="modulepreload" href="missing.js">');assert.throws(()=>auditSeoIntegrity(root,manifest),/Missing referenced asset/);
 writeFileSync(path.join(root,'index.html'),home.replace('og-image.png?v=3','missing.png'));assert.throws(()=>auditSeoIntegrity(root,manifest),/Missing referenced asset/);
 writeFileSync(path.join(root,'index.html'),home);
 mkdirSync(path.join(root,'tools/old'));
 writeFileSync(path.join(root,'tools/old/index.html'),'<link rel="canonical" href="https://simplekit.app/example/"><meta name="robots" content="index,follow">');
 manifest.tools.push({canonicalUrl:host+'/example/',canonicalPath:'/example/',includeInSitemap:false});
 assert.throws(()=>auditSeoIntegrity(root,manifest),/Compatibility noindex/);
});
