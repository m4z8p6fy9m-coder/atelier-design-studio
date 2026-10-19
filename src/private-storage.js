import {seal,unseal} from './vault-crypto.js';
const STORES=['projects','assets','settings','versions'];
let connection,context=null,revision=0;
const listeners=new Set();
export const vaultOwner=()=>context?.owner||null;
export const vaultRevision=()=>revision;
export function onVaultChange(fn){listeners.add(fn);return ()=>listeners.delete(fn)}
export function useVault(owner,key){if(!owner||!key)throw Error('Ungültiger Tresor.');context={owner,key,reads:new Map()};revision++}
export function lockVault(){context=null;revision++}
export const workspaceToken=()=>({owner:vaultOwner(),revision});
export function checkWorkspace(token){if(token.revision!==revision||token.owner!==vaultOwner())throw Error('Arbeitsbereich wurde gewechselt.')}
function capture(){if(!context)throw Error('Tresor ist gesperrt.');return {...context,revision}}
function check(c){checkWorkspace(c);if(context?.key!==c.key)throw Error('Tresorschlüssel wurde gewechselt.')}
function database(){return connection??=new Promise((resolve,reject)=>{
 const r=indexedDB.open('atelier-private-v1',2);let blocked=false;
 r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('records'))r.result.createObjectStore('records',{keyPath:'id'}).createIndex('owner','owner');if(!r.result.objectStoreNames.contains('meta'))r.result.createObjectStore('meta',{keyPath:'id'});if(!r.result.objectStoreNames.contains('recoveries'))r.result.createObjectStore('recoveries',{keyPath:'owner'})};
 r.onsuccess=()=>{if(blocked){r.result.close();return}r.result.onversionchange=()=>{r.result.close();connection=null};resolve(r.result)};r.onerror=()=>{connection=null;reject(r.error)};r.onblocked=()=>{blocked=true;connection=null;reject(Error('Bitte ältere Atelier-Tabs schließen und den Tresor erneut öffnen, um den Speicher zu aktualisieren.'))};
})}
async function transaction(store,mode,operation){const d=await database();return new Promise((resolve,reject)=>{const t=d.transaction(store,mode),r=operation(t.objectStore(store));let result;r.onsuccess=()=>result=r.result;t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('Tresor-Schreibvorgang abgebrochen.'))})}
const recordId=(owner,store,id)=>JSON.stringify([owner,store,id]);
const fingerprint=row=>row?JSON.stringify(row.value):null;
const equal=(store,a,b)=>JSON.stringify(store==='projects'?{...a,updated:0}:a)===JSON.stringify(store==='projects'?{...b,updated:0}:b);
const aad=(owner,store,id)=>'atelier-record:'+recordId(owner,store,id);
const empty=owner=>({id:owner,head:null,generation:0,dirty:false});
export async function vaultMeta(owner){return await transaction('meta','readonly',s=>s.get(owner))||empty(owner)}
// Compatibility helper for setup/tests. Concurrent state updates use guarded transactions below.
export async function updateVaultMeta(value){return transaction('meta','readwrite',s=>s.put(value))}
export async function patchVaultMeta(owner,patch,token){const d=await database();if(token)checkWorkspace(token);return new Promise((resolve,reject)=>{const t=d.transaction('meta','readwrite'),s=t.objectStore('meta'),r=s.get(owner);let result;r.onsuccess=()=>{try{if(token)checkWorkspace(token);result={...(r.result||empty(owner)),...patch,id:owner};s.put(result)}catch{t.abort()}};t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('Tresor wurde gewechselt.'))})}
export async function privateGet(store,id){const c=capture(),r=await transaction('records','readonly',s=>s.get(recordId(c.owner,store,id)));check(c);const value=r?await unseal(c.key,r.value,aad(c.owner,store,id)):undefined;check(c);c.reads.set(recordId(c.owner,store,id),fingerprint(r));return value}
export async function privateAll(store){const c=capture(),rows=await transaction('records','readonly',s=>s.index('owner').getAll(c.owner)),values=[];for(const r of rows.filter(r=>r.store===store))values.push(await unseal(c.key,r.value,aad(c.owner,store,r.item)));check(c);for(const r of rows.filter(r=>r.store===store))c.reads.set(r.id,fingerprint(r));return values}
export function privateWriter(store){const c=capture();return (value,remove=false)=>write(c,store,value,remove)}
export function privateWrite(store,value,remove=false){return write(capture(),store,value,remove)}
async function write(c,store,value,remove){
 if(!STORES.includes(store))throw Error('Ungültiger Speicherbereich.');const item=remove?value:value?.id;if(typeof item!=='string'||!item||item.length>200)throw Error('Ungültige Datensatz-ID.');const id=recordId(c.owner,store,item),plain=remove?null:JSON.stringify(value);
 for(let attempt=0;attempt<5;attempt++){
  check(c);const before=await transaction('records','readonly',s=>s.get(id));check(c);
  if(remove&&!before)return item;
  if(before&&!remove){const old=await unseal(c.key,before.value,aad(c.owner,store,item));check(c);if(equal(store,old,value)){c.reads.set(id,fingerprint(before));return item}}
  if(c.reads.has(id)&&c.reads.get(id)!==fingerprint(before)||store==='projects'&&before&&!c.reads.has(id))throw Error('Gleichzeitige lokale Änderungen erkannt. Entwurf exportieren und Projekt erneut laden.');
  const encrypted=remove?null:await seal(c.key,JSON.parse(plain),aad(c.owner,store,item));check(c);const d=await database();check(c);
  const committed=await new Promise((resolve,reject)=>{
   const t=d.transaction(['records','meta'],'readwrite'),records=t.objectStore('records'),meta=t.objectStore('meta'),r=records.get(id);let changed=false,stale=false;
   r.onsuccess=()=>{try{check(c);if(JSON.stringify(r.result?.value)!==JSON.stringify(before?.value)){stale=true;t.abort();return}if(remove)records.delete(id);else records.put({id,owner:c.owner,store,item,value:encrypted});const m=meta.get(c.owner);m.onsuccess=()=>{try{check(c);const value=m.result||empty(c.owner);meta.put({...value,dirty:true,generation:value.generation+1});changed=true}catch{t.abort()}}}catch{t.abort()}};
   t.oncomplete=()=>resolve(changed);t.onerror=()=>reject(t.error);t.onabort=()=>stale?resolve(false):reject(t.error||Error('Tresor wurde gewechselt.'));
  });
  check(c);if(committed){c.reads.set(id,remove?null:JSON.stringify(encrypted));for(const fn of listeners)fn(c.owner);return item}
 }
 throw Error('Gleichzeitiger Schreibzugriff. Bitte erneut speichern.');
}
// Records and generation come from the same IndexedDB read transaction.
export async function snapshotState(){const c=capture(),d=await database();check(c);return new Promise((resolve,reject)=>{const t=d.transaction(['records','meta'],'readonly'),r=t.objectStore('records').index('owner').getAll(c.owner),m=t.objectStore('meta').get(c.owner);t.oncomplete=()=>{try{check(c);resolve({snapshot:{format:'atelier-snapshot-1',owner:c.owner,records:r.result},meta:m.result||empty(c.owner)})}catch(e){reject(e)}};t.onerror=()=>reject(t.error)})}
export async function encryptedSnapshot(){return (await snapshotState()).snapshot}
async function validateSnapshotContent(snapshot,c,validate){
 if(snapshot?.format!=='atelier-snapshot-1'||snapshot.owner!==c.owner||!Array.isArray(snapshot.records)||snapshot.records.length>100000)throw Error('Ungültige Kontensicherung.');
 const seen=new Set();for(const r of snapshot.records){if(r?.owner!==c.owner||!STORES.includes(r.store)||typeof r.item!=='string'||!r.item||r.item.length>200||r.id!==recordId(c.owner,r.store,r.item)||seen.has(r.id))throw Error('Ungültiger Datensatz in der Sicherung.');seen.add(r.id);const value=await unseal(c.key,r.value,aad(c.owner,r.store,r.item));check(c);if(!value||typeof value!=='object'||Array.isArray(value)||value.id!==r.item)throw Error('Datensatz-ID stimmt nicht überein.');if(validate)validate(r.store,value)}
 check(c);
}
export async function validateSnapshot(snapshot,validate){return validateSnapshotContent(snapshot,capture(),validate)}
export async function restoreSnapshot(snapshot,head,options={}){
 const c=capture(),initial=options.expectedMeta||await vaultMeta(c.owner);
 await validateSnapshotContent(snapshot,c,options.validate);
 check(c);const d=await database();check(c);
 return new Promise((resolve,reject)=>{const t=d.transaction(['records','meta','recoveries'],'readwrite'),records=t.objectStore('records'),meta=t.objectStore('meta'),r=meta.get(c.owner);let result,error;
 r.onsuccess=()=>{try{check(c);const current=r.result||empty(c.owner);if(current.generation!==initial.generation||current.head!==initial.head)throw Error('Lokale Änderungen während der Wiederherstellung. Nichts wurde ersetzt.');const old=records.index('owner').getAll(c.owner);old.onsuccess=()=>{try{check(c);t.objectStore('recoveries').put({owner:c.owner,snapshot:{format:'atelier-snapshot-1',owner:c.owner,records:old.result},head:current.head,created:Date.now()});for(const row of old.result)records.delete(row.id);for(const row of snapshot.records)records.put(row);result={...current,...(options.trustedHead?{trustedHead:options.trustedHead}:{}),...(options.descriptor?{descriptor:options.descriptor}:{}),head,generation:current.generation+1,dirty:!!options.dirty,conflict:false,lastDigest:null};meta.put(result)}catch(e){error=e;t.abort()}}}catch(e){error=e;t.abort()}};
 t.oncomplete=()=>{try{check(c);c.reads.clear();for(const row of snapshot.records)c.reads.set(row.id,fingerprint(row));resolve(result)}catch(e){reject(e)}};t.onerror=()=>reject(error||t.error||Error('Wiederherstellung abgebrochen.'));t.onabort=()=>reject(error||t.error||Error('Wiederherstellung abgebrochen.'));
 });
}
export async function previousSnapshot(){const c=capture(),value=await transaction('recoveries','readonly',s=>s.get(c.owner));check(c);return value}
export async function markVaultSynced(owner,head,generation,extra={},token){const d=await database();if(token)checkWorkspace(token);return new Promise((resolve,reject)=>{const t=d.transaction('meta','readwrite'),s=t.objectStore('meta'),r=s.get(owner);let result;r.onsuccess=()=>{try{if(token)checkWorkspace(token);const m=r.result;if(!m)throw Error();result={...m,...extra,head,dirty:m.generation!==generation};s.put(result)}catch{t.abort()}};t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('Tresor-Metadaten geändert.'))})}
export async function hasVaultRecords(owner){return (await transaction('records','readonly',s=>s.index('owner').count(owner)))>0}
