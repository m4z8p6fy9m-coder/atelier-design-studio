import {privateGet,privateAll,privateWrite,privateWriter,vaultOwner,workspaceToken,checkWorkspace} from './private-storage.js';
let database;
export function openDB(){if(database)return Promise.resolve(database);return new Promise((resolve,reject)=>{const req=indexedDB.open('atelier-studio-v2',1);req.onupgradeneeded=()=>{for(const name of ['projects','assets','settings','versions'])if(!req.result.objectStoreNames.contains(name))req.result.createObjectStore(name,{keyPath:'id'})};req.onsuccess=()=>{database=req.result;database.onversionchange=()=>{database.close();database=null};resolve(database)};req.onerror=()=>reject(req.error)})}
async function access(store,mode,fn,token=workspaceToken()){const db=await openDB();checkWorkspace(token);return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode),req=fn(tx.objectStore(store));let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>{try{checkWorkspace(token);resolve(result)}catch(e){reject(e)}};tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Speichern abgebrochen'))})}
export const get=(store,id)=>vaultOwner()?privateGet(store,id):access(store,'readonly',s=>s.get(id));
export const all=store=>vaultOwner()?privateAll(store):access(store,'readonly',s=>s.getAll());
export const put=(store,value)=>vaultOwner()?privateWrite(store,value):access(store,'readwrite',s=>s.put(value));
export const remove=(store,id)=>vaultOwner()?privateWrite(store,id,true):access(store,'readwrite',s=>s.delete(id));
// Capture the workspace before enqueuing a delayed save; never fall back to guest storage.
export function writer(store){if(vaultOwner())return privateWriter(store);const token=workspaceToken();return value=>access(store,'readwrite',s=>s.put(value),token)}
export async function saveVersion(doc){const token=workspaceToken(),id=crypto.randomUUID();await put('versions',{id,projectId:doc.id,created:Date.now(),doc:structuredClone(doc)});checkWorkspace(token);const old=(await all('versions')).filter(v=>v.projectId===doc.id).sort((a,b)=>b.created-a.created).slice(12);for(const v of old){checkWorkspace(token);await remove('versions',v.id)}return id}
