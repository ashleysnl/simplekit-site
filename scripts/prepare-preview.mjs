import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {previewHtml,previewScript,previewScriptPath} from './preview-artifact.mjs';
import {outputRoot} from './paths.mjs';

export function preparePreview(root) {
  const html=[];
  function walk(dir) {
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      const file=path.join(dir,entry.name);
      if(entry.isSymbolicLink())throw Error('Preview artifacts cannot contain symlinks');
      if(entry.isDirectory())walk(file);
      else if(file.endsWith('.html'))html.push(file);
    }
  }
  walk(root);
  for(const file of html)fs.writeFileSync(file,previewHtml(fs.readFileSync(file,'utf8')));
  fs.rmSync(path.join(root,'CNAME'),{force:true});
  fs.writeFileSync(path.join(root,'robots.txt'),'User-agent: *\nDisallow: /\n');
  fs.writeFileSync(path.join(root,'_headers'),'/*\n  X-Robots-Tag: noindex, nofollow\n');
  fs.writeFileSync(path.join(root,previewScriptPath),previewScript);
  return {htmlPages:html.length,productionCnameRemoved:true,previewNavigation:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(preparePreview(outputRoot)));
