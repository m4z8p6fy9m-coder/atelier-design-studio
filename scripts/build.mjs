import {mkdir,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),out=new URL('dist/',root);
await mkdir(out,{recursive:true});
for(const f of ['index.html','style.css','icon.svg','icon-192.png','icon-512.png','icon-maskable.png','manifest.webmanifest','sw.js','src'])await cp(new URL(f,root),new URL(f,out),{recursive:true});
console.log(`Static build ready: ${fileURLToPath(out)}`);
