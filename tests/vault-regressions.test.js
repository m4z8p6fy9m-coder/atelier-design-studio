import test from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import {createDescriptor} from '../src/vault-crypto.js';
import * as vault from '../src/private-storage.js';
import * as db from '../src/storage.js';
import {ManagedAccount} from '../src/managed-account.js';
globalThis.indexedDB=indexedDB;
const password='a long unique regression password';
test('regression: lock while offline key derivation is pending must not reopen the vault',async()=>{
 const made=await createDescriptor('late-unlock',password),m=new ManagedAccount();
 await vault.updateVaultMeta({id:'late-unlock',descriptor:made.descriptor,head:null,generation:0,dirty:false});
 const pending=m.unlockOffline('late-unlock',password);m.lock();
 await assert.rejects(pending);assert.equal(m.key,null);assert.equal(vault.vaultOwner(),null);
});
test('regression: restoring a backup must preserve its descriptor atomically',async()=>{
 const made=await createDescriptor('atomic-restore',password);vault.useVault('atomic-restore',made.key);
 await vault.updateVaultMeta({id:'atomic-restore',descriptor:made.descriptor,head:'old',generation:12,dirty:false});
 await db.put('settings',{id:'example',value:'keep me'});const snapshot=await vault.encryptedSnapshot();
 await vault.restoreSnapshot(snapshot,'remote');const meta=await vault.vaultMeta('atomic-restore');
 assert.deepEqual(meta.descriptor,made.descriptor);assert.ok(meta.generation>12);vault.lockVault();
});
test('regression: identical local writes must not make a clean vault dirty',async()=>{
 const made=await createDescriptor('unchanged',password);vault.useVault('unchanged',made.key);
 const record={id:'same',value:'unchanged'};await db.put('settings',record);let meta=await vault.vaultMeta('unchanged');await vault.markVaultSynced('unchanged','head',meta.generation);
 await db.put('settings',structuredClone(record));meta=await vault.vaultMeta('unchanged');assert.equal(meta.dirty,false);vault.lockVault();
});
