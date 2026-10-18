import test from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import {createDescriptor,unlockDescriptor,seal,unseal} from '../src/vault-crypto.js';
import * as vault from '../src/private-storage.js';
import * as db from '../src/storage.js';
import {ManagedAccount} from '../src/managed-account.js';
globalThis.indexedDB=indexedDB;
const password='a very strong vault password';
test('vault rejects wrong passwords, wrong owners, altered ciphertext and context swaps',async()=>{
 const {key,descriptor}=await createDescriptor('alice',password);assert.equal(key.extractable,false);
 await unlockDescriptor(descriptor,'alice',password);
 await assert.rejects(unlockDescriptor(descriptor,'alice','incorrect long password'));
 await assert.rejects(unlockDescriptor(descriptor,'bob',password));
 const a=await seal(key,{title:'Private school notes'},'alice:project:1'),b=await seal(key,{title:'Private school notes'},'alice:project:1');assert.notEqual(a.iv,b.iv);assert.ok(!JSON.stringify(a).includes('Private school notes'));
 await assert.rejects(unseal(key,a,'bob:project:1'));await assert.rejects(unseal(key,{...a,data:(a.data[0]==='A'?'B':'A')+a.data.slice(1)},'alice:project:1'));
});
test('all four private stores persist only ciphertext and isolate accounts and guest mode',async()=>{
 const {key}=await createDescriptor('alice',password),bob=await createDescriptor('bob',password);
 await db.put('projects',{id:'guest',title:'Guest design'});vault.useVault('alice',key);
 for(const store of ['projects','assets','settings','versions'])await db.put(store,{id:'same',title:'ALICE PRIVATE TITLE',data:'PRIVATE IMAGE'});
 assert.equal((await db.all('projects')).length,1);
 const snapshot=await vault.encryptedSnapshot();assert.ok(!JSON.stringify(snapshot).includes('PRIVATE'));assert.equal(snapshot.records.length,4);
 vault.useVault('bob',bob.key);assert.deepEqual(await db.all('projects'),[]);await db.put('projects',{id:'same',title:'Bob'});
 vault.useVault('alice',key);assert.equal((await db.get('projects','same')).title,'ALICE PRIVATE TITLE');await db.remove('projects','same');assert.equal(await db.get('projects','same'),undefined);
 await vault.restoreSnapshot(snapshot,'head');assert.equal((await db.get('projects','same')).title,'ALICE PRIVATE TITLE');
 const invalid=structuredClone(snapshot);invalid.records[0].owner='bob';await assert.rejects(vault.restoreSnapshot(invalid,'bad'));assert.equal((await db.get('projects','same')).title,'ALICE PRIVATE TITLE');
 vault.lockVault();assert.equal((await db.all('projects'))[0].id,'guest');
});
test('account switch invalidates an encryption write already in progress',async()=>{
 const alice=await createDescriptor('race-alice',password),bob=await createDescriptor('race-bob',password);vault.useVault('race-alice',alice.key);
 const writing=db.put('projects',{id:'late',title:'Alice only'});vault.useVault('race-bob',bob.key);await assert.rejects(writing);assert.deepEqual(await db.all('projects'),[]);vault.lockVault();
});
test('managed backups send ciphertext, preserve dirty changes and stop on remote conflicts',async()=>{
 const {key}=await createDescriptor('sync-user',password);vault.useVault('sync-user',key);const m=new ManagedAccount();m.user={$id:'sync-user',emailVerification:true};m.key=key;
 let uploads=0,head=null; m.heads=async()=>head?[{$id:head}]:[];
 m.writeFile=async(id,name,payload)=>{uploads++;assert.equal(name,'snapshot.json');assert.ok(!JSON.stringify(payload).includes('SECRET'));await db.put('settings',{id:'during',text:'SECRET CHANGED WHILE UPLOADING'});return {$id:'remote-1'}};
 await db.put('projects',{id:'secret',title:'SECRET DESIGN'});await m.sync();assert.equal(uploads,1);assert.equal((await vault.vaultMeta('sync-user')).dirty,true);
 head='another-device';await assert.rejects(m.sync(),/Konflikt/);assert.equal(uploads,1);m.lock();
});

test('portable encrypted backup restores the same vault and rejects other accounts without modifying local data',async()=>{
 const made=await createDescriptor('backup-owner',password),m=new ManagedAccount();m.user={$id:'backup-owner',emailVerification:true};m.key=made.key;m.descriptorValue=made.descriptor;vault.useVault('backup-owner',made.key);await db.put('projects',{id:'restore-me',title:'Original'});const backup=await m.backup();assert.ok(!JSON.stringify(backup).includes('Original'));await db.put('projects',{id:'restore-me',title:'Changed'});await m.restoreBackup(backup);assert.equal((await db.get('projects','restore-me')).title,'Original');assert.equal((await vault.vaultMeta('backup-owner')).dirty,true);
 const wrong=structuredClone(backup);wrong.descriptor.owner='other';await assert.rejects(m.restoreBackup(wrong));assert.equal((await db.get('projects','restore-me')).title,'Original');m.lock();
});
test('failed remote download leaves dirty local data untouched',async()=>{
 const made=await createDescriptor('download-owner',password),m=new ManagedAccount();m.user={$id:'download-owner',emailVerification:true};m.key=made.key;vault.useVault('download-owner',made.key);await db.put('projects',{id:'safe',title:'Safe local edit'});m.heads=async()=>[{$id:'head'}];m.readFile=async()=>{throw Error('Offline')};await assert.rejects(m.reloadRemote(),/Offline/);assert.equal((await vault.vaultMeta('download-owner')).dirty,true);assert.equal((await db.get('projects','safe')).title,'Safe local edit');m.lock();
});
test('file uploads grant only the signed-in owner access and never include a vault password',async()=>{
 const m=new ManagedAccount();m.user={$id:'only-owner'};let captured;m.storage.createFile=async args=>{captured=args;return {$id:'file'}};await m.writeFile('file','key.json',{check:{data:'ciphertext'}});assert.deepEqual(captured.permissions,['read("user:only-owner")','update("user:only-owner")','delete("user:only-owner")']);assert.equal(captured.file.type,'application/json');assert.equal(await captured.file.text(),'{"check":{"data":"ciphertext"}}');m.lock();
});

test('private downloads include the project header and use SDK authenticated text decoding',async()=>{
 const m=new ManagedAccount();let observed;m.client.call=async(...args)=>{observed=args;return '{"format":"encrypted"}'};assert.deepEqual(await m.readFile('private-id'),{format:'encrypted'});assert.equal(observed[2]['X-Appwrite-Project'],'6ad4d716001e228da8e2');assert.equal(observed[4],'text');assert.match(observed[1].pathname,/private-id\/download$/);m.lock();
});
test('a cached descriptor unlocks offline without making an account request',async()=>{
 const made=await createDescriptor('offline-owner',password),m=new ManagedAccount();await vault.updateVaultMeta({id:'offline-owner',descriptor:made.descriptor,head:null,generation:0,dirty:false});m.account.get=()=>{throw Error('Must not connect')};await m.unlockOffline('offline-owner',password);assert.equal(vault.vaultOwner(),'offline-owner');await db.put('projects',{id:'offline',title:'Offline saved'});m.lock();await m.unlockOffline('offline-owner',password);assert.equal((await db.get('projects','offline')).title,'Offline saved');m.lock();
});
test('upload size limits fail before sending data',async()=>{
 const m=new ManagedAccount();m.user={$id:'quota-user'};m.storage.createFile=()=>{throw Error('Must not upload')};await assert.rejects(m.writeFile('file','snapshot.json',{encrypted:'X'.repeat(20*1024*1024)}),/20 MB/);m.lock();
});
