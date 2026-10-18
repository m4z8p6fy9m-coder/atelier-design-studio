import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
const root=fileURLToPath(new URL('../',import.meta.url));
const result=await build({absWorkingDir:root,entryPoints:['src/appwrite-entry.js'],outfile:'src/appwrite-sdk.js',bundle:true,format:'esm',platform:'browser',minify:true,legalComments:'inline',metafile:true});
const packages=new Set();
for(const input of Object.keys(result.metafile.inputs)){const match=input.replaceAll('\\','/').match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);if(match)packages.add(match[1])}
let notices='# Bundled browser dependencies\n\nAtelier application code: MIT. The Appwrite SDK bundle includes these separately licensed packages. Regenerate with npm run build.\n';
for(const name of [...packages].sort()){const folder=path.join(root,'node_modules',name),pkg=JSON.parse(await readFile(path.join(folder,'package.json'),'utf8'));let license='';for(const file of ['LICENSE','LICENSE.md','LICENSE.txt','license','LICENSE-MIT','LICENCE','LICENCE.md','LICENCE.txt']){try{license=await readFile(path.join(folder,file),'utf8');break}catch{}}if(!license)throw Error('Missing bundled license: '+name);notices+='\n## '+name+' '+pkg.version+' ('+pkg.license+')\n\n'+license+'\n'}
await writeFile(path.join(root,'docs','THIRD-PARTY-NOTICES.md'),notices);
console.log('Bundled official SDK; licenses included for '+packages.size+' packages.');
