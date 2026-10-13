// One implementation: the pure shared renderers owned by pinned SimpleKit-Core.
import {pathToFileURL} from 'node:url';
import {coreAssetPath} from './v2-core-assets.mjs';
const core=await import(pathToFileURL(coreAssetPath('components.mjs')).href);
export const {systemVersion,themeVersion,escapeHtml,shellHeader,shellFooter,breadcrumbs,relatedContent,alignSharedShell}=core;
