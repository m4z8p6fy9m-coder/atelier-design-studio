import {readFile,readdir,lstat,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {zip} from '../src/export.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const folders=['.github','docs','examples','functions','scripts','server','src','tests'];
const roots=['.dockerignore','.env.example','.gitignore','CHANGELOG.md','CONTRIBUTING.md','SECURITY.md','Dockerfile','icon.svg','index.html','LICENSE','package.json','package-lock.json','README.md','START-SERVER-WINDOWS.cmd','START-WINDOWS.cmd','style.css','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','icon-maskable.png'];
export async function packageRelease({outputDir=path.join(root,'release')}={}){
 const names=[...roots];
 async function walk(relative){for(const entry of await readdir(path.join(root,relative),{withFileTypes:true})){const name=path.posix.join(relative,entry.name);if(entry.isSymbolicLink())throw Error('Symlink im öffentlichen Paket: '+name);if(entry.name.endsWith('.local.md')||entry.name.endsWith('.log'))continue;if(entry.name.startsWith('.')||['data','node_modules','dist','release','__pycache__'].includes(entry.name))throw Error('Nicht freigegebener Quellpfad: '+name);if(entry.isDirectory())await walk(name);else if(entry.isFile())names.push(name)}}
 for(const folder of folders){const info=await lstat(path.join(root,folder));if(info.isSymbolicLink()||!info.isDirectory())throw Error('Kein regulärer Quellordner: '+folder);await walk(folder)}names.sort();
 const files=[];for(const name of names){const target=path.join(root,name);if(!(await lstat(target)).isFile())throw Error('Keine reguläre Paketdatei: '+name);files.push({name,blob:new Blob([await readFile(target)])})}
 const version=JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).version;
 if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Ungültige Release-Version.');
 const name='Atelier-v'+version+'.zip',bytes=Buffer.from(await(await zip(files)).arrayBuffer()),sha256=createHash('sha256').update(bytes).digest('hex');
 await mkdir(outputDir,{recursive:true});await writeFile(path.join(outputDir,name),bytes);await writeFile(path.join(outputDir,name.replace('.zip','.sha256')),sha256+'  '+name+'\n');
 return {version,name,files:names.length,bytes:bytes.length,sha256,outputDir};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await packageRelease()));
