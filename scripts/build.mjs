import {mkdir,cp,rm,lstat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=new URL('../',import.meta.url),out=new URL('dist/',root),rootPath=path.resolve(fileURLToPath(root)),outPath=path.resolve(fileURLToPath(out));
// Never let a stale .env, test fixture or server file survive into a deployment.
if(path.dirname(outPath)!==rootPath||path.basename(outPath)!=='dist')throw Error('Unsafe build output directory.');
try{if((await lstat(outPath)).isSymbolicLink())throw Error('Build output must not be a symlink.')}catch(error){if(error.code!=='ENOENT')throw error}
await rm(outPath,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const file of ['index.html','style.css','icon.svg','icon-192.png','icon-512.png','icon-maskable.png','manifest.webmanifest','sw.js','src'])await cp(new URL(file,root),new URL(file,out),{recursive:true});
console.log(`Static build ready: ${outPath}`);
