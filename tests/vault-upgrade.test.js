import test from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import * as vault from '../src/private-storage.js';
globalThis.indexedDB=indexedDB;
test('blocked upgrade can be retried after an old tab closes, preserving the v1 metadata',async()=>{
 const old=await new Promise((resolve,reject)=>{const r=indexedDB.open('atelier-private-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('records',{keyPath:'id'}).createIndex('owner','owner');r.result.createObjectStore('meta',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 await new Promise((resolve,reject)=>{const t=old.transaction('meta','readwrite');t.objectStore('meta').put({id:'existing-owner',head:'existing-head',generation:9,dirty:true,descriptor:{marker:'existing descriptor'}});t.oncomplete=resolve;t.onerror=()=>reject(t.error)});
 await assert.rejects(vault.vaultMeta('existing-owner'),/ältere Atelier/);old.close();
 const meta=await vault.vaultMeta('existing-owner');assert.equal(meta.generation,9);assert.equal(meta.head,'existing-head');assert.deepEqual(meta.descriptor,{marker:'existing descriptor'});
});
