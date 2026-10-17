import {readFileSync} from 'node:fs';

export const previewScriptPath='__simplekit-preview-navigation.js';
export const previewScript=readFileSync(new URL('./preview-assets/navigation.js',import.meta.url),'utf8');
export const previewScriptTag=`<script src="/${previewScriptPath}" defer data-simplekit-preview-navigation></script>`;
export function previewHtml(html) {
  // Skip comments and raw script/style bodies. Financial inline scripts and SEO
  // link/meta/JSON-LD elements must remain byte-for-byte unchanged.
  const tags=/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<a\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
  const result=html.replace(tags,tag=>{
    if(!/^<a\b/i.test(tag))return tag;
    return tag.replace(/(\bhref\s*=\s*)(["'])(.*?)\2/i,(attribute,prefix,quote,value)=>{
      try {
        const url=new URL(value,'https://simplekit.app');
        if(url.origin==='https://simplekit.app'&&/^(https:)?\/\//i.test(value))return prefix+quote+url.pathname+url.search+url.hash+quote;
      }catch{}
      return attribute;
    });
  });
  if(result.includes('data-simplekit-preview-navigation'))return result;
  if(!/<\/head\s*>/i.test(result))throw Error('Preview HTML requires an explicit head boundary');
  return result.replace(/<\/head\s*>/i,tag=>previewScriptTag+'\n'+tag);
}
