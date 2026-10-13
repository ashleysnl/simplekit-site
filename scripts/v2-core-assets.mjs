// Resolve the existing immutable Core manifest; never a second theme registry.
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {repoRoot} from './paths.mjs';
import {loadSources,sourceDirectory,acquireSources} from './acquire-sources.mjs';
export function coreAssetPath(file,root=repoRoot) {
 if(!/^[a-z0-9][a-z0-9./-]*$/i.test(file)||file.split('/').includes('..'))throw Error('Invalid Core asset path');
 const core=loadSources(root).find(s=>s.id==='simplekit-core');if(!core)throw Error('Pinned Core source required');
 const filename=path.join(sourceDirectory(core),'v2',file);
 if(!existsSync(filename))acquireSources();
 if(!existsSync(filename))throw Error('Pinned Core does not provide '+file);
 return filename;
}
export const readCoreAsset=(file,root=repoRoot)=>readFileSync(coreAssetPath(file,root),'utf8');
