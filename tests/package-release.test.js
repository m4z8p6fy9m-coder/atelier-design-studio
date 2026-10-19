import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {packageRelease} from '../scripts/package-release.mjs';
test('release source ZIP has a matching SHA-256 and excludes private/generated directories',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'atelier-package-'));
 try{const result=await packageRelease({outputDir:directory}),bytes=await readFile(path.join(directory,result.name)),hash=createHash('sha256').update(bytes).digest('hex');assert.equal(hash,result.sha256);assert.equal(await readFile(path.join(directory,result.name.replace('.zip','.sha256')),'utf8'),hash+'  '+result.name+'\n');
  const names=[];let offset=0;while(bytes.readUInt32LE(offset)===0x04034b50){const size=bytes.readUInt32LE(offset+18),length=bytes.readUInt16LE(offset+26),extra=bytes.readUInt16LE(offset+28),name=bytes.subarray(offset+30,offset+30+length).toString('utf8');names.push(name);offset+=30+length+extra+size}
  assert.equal(names.length,result.files);for(const required of ['src/managed-config.js','src/appwrite-sdk.js','scripts/serve.mjs','docs/SELF-HOSTING-VAULTS.md','docs/demo-0.10.4.png'])assert.ok(names.includes(required),required);
  for(const name of names)assert.ok(!/(^|\/)(node_modules|dist|data|release|\.git)(\/|$)|(^|\/)\.env$|\.local\.md$|\.log$/.test(name),name);
 }finally{if(path.dirname(directory)!==path.resolve(tmpdir())||!path.basename(directory).startsWith('atelier-package-'))throw Error('Unsicheres Testziel');await rm(directory,{recursive:true,force:true})}
});
