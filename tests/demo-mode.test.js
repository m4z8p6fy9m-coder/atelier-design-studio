import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ManagedAccount} from '../src/managed-account.js';
import {managedConfig} from '../src/managed-config.js';

test('shipped demo has no enabled account service or operator project identifiers',()=>{
 assert.equal(managedConfig.demoMode,true);assert.equal(managedConfig.enabled,false);
 assert.equal(managedConfig.project,'');assert.equal(managedConfig.bucket,'');
 assert.equal(new URL(managedConfig.endpoint).hostname,'appwrite.invalid');assert.equal(managedConfig.remoteCAS.enabled,false);
});
test('disabled initialization and SDK signup/login cannot invoke fetch',async()=>{
 const original=globalThis.fetch;let requests=0;globalThis.fetch=async()=>{requests++;throw Error('Unzulässiger Netzwerkversuch')};const m=new ManagedAccount();
 try{assert.equal(await m.init(),null);await assert.rejects(m.register('synthetic@example.test','Langes synthetisches Testpasswort','Demo'),/Gastmodus-Demo/);await assert.rejects(m.login('synthetic@example.test','Langes synthetisches Testpasswort'),/Gastmodus-Demo/);await assert.rejects(m.client.call('get',new URL(managedConfig.endpoint+'/account')),/Gastmodus-Demo/);assert.equal(requests,0)}finally{globalThis.fetch=original;m.dispose()}
});
test('explicit self-hosted configuration can still use the SDK through a mocked transport',async()=>{
 const original=globalThis.fetch,mode=managedConfig.demoMode;let requests=0;
 globalThis.fetch=async(url,options)=>{requests++;assert.equal(new URL(url).hostname,'appwrite.invalid');assert.equal(options.headers['X-Appwrite-Project'],'synthetic-selfhost');return Response.json({$id:'selfhost-user',emailVerification:true})};
 managedConfig.demoMode=false;const m=new ManagedAccount();m.enabled=true;m.client.setProject('synthetic-selfhost');
 try{assert.equal((await m.init()).$id,'selfhost-user');assert.equal(requests,1)}finally{managedConfig.demoMode=mode;globalThis.fetch=original;m.dispose()}
});
test('production CSP and hosting examples deny third-party connections in demo mode',async()=>{
 for(const file of ['index.html','examples/cloudflare-pages/_headers','examples/netlify/_headers']){const content=await readFile(new URL('../'+file,import.meta.url),'utf8'),directive=content.match(/connect-src ([^;"\n]+)/)?.[1];assert.equal(directive,"'self'",file);assert.ok(!content.includes('fra.cloud.appwrite.io'),file)}
});
