// A checkpoint is authenticated by the existing DEK, not by an external authority.
import {jsonHash} from './vault-backup.js';
import {SYNC_POLICY} from './vault-sync.js';
export const CHECKPOINT_NAME='snapshot-checkpoint-v1.json';
export const CHECKPOINT_FORMAT='atelier-encrypted-backup-4';
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,35}$/.test(id);
const validHash=hash=>typeof hash==='string'&&/^[a-f0-9]{64}$/.test(hash);
export function checkpointEntries(snapshot){
 const cp=snapshot.sync?.checkpoint;
 if(!cp||cp.v!==1||!Array.isArray(cp.ancestors)||cp.ancestors.length<1||cp.ancestors.length>10000||cp.count!==cp.ancestors.length||snapshot.sync.parents?.length!==0||snapshot.sync.parentHashes?.length!==0)throw Error('Ungültiger Checkpoint.');
 const entries=new Map();for(const item of cp.ancestors){if(!validId(item?.id)||!validHash(item.hash)||item.id===snapshot.sync.id||entries.has(item.id))throw Error('Ungültiger Checkpoint-Anker.');entries.set(item.id,item.hash)}
 if(!cp.head||entries.get(cp.head.id)!==cp.head.hash)throw Error('Checkpoint enthält den bisherigen Head nicht.');
 return entries;
}
export function coveredBy(graph,head){
 const result=new Map(),seen=new Set();function visit(id){if(seen.has(id))return;seen.add(id);const cp=graph.checkpoints?.get(id);if(cp)for(const [key,value]of cp)result.set(key,value);for(const p of graph.nodes.get(id)?.parents||[])visit(p)}visit(head);return result;
}
export function pruningCandidates(files,covered,now,protectedIds=[]){
 const ordered=[...files].sort((a,b)=>Date.parse(a.$createdAt)-Date.parse(b.$createdAt)||a.$id.localeCompare(b.$id));
 const keep=new Set([...protectedIds,...ordered.slice(-SYNC_POLICY.keepNewest).map(f=>f.$id)]);
 return ordered.filter(f=>covered.has(f.$id)&&!keep.has(f.$id)&&Number.isFinite(Date.parse(f.$createdAt))&&now-Date.parse(f.$createdAt)>SYNC_POLICY.minAgeMs).slice(0,SYNC_POLICY.maxDeletes);
}
export async function checkpointProof(graph,head,load){
 const entries=new Map(),seen=new Set();const add=(id,hash)=>{if(entries.has(id)&&entries.get(id)!==hash)throw Error('Checkpoint-Hash-Konflikt.');entries.set(id,hash)};
 async function visit(id){if(seen.has(id))return;seen.add(id);const {payload,snapshot}=await load(id);add(id,await jsonHash(payload));if(payload.format===CHECKPOINT_FORMAT){for(const [key,value]of checkpointEntries(snapshot))add(key,value);return}for(const parent of graph.nodes.get(id)?.parents||[]){if(!graph.nodes.has(parent))throw Error('Checkpoint kann eine fehlende Historie nicht zusammenfassen.');await visit(parent)}}
 await visit(head);if(entries.size>10000)throw Error('Checkpoint überschreitet das Ankerlimit.');
 return {v:1,head:{id:head,hash:entries.get(head)},count:entries.size,ancestors:[...entries].sort(([a],[b])=>a.localeCompare(b)).map(([id,hash])=>({id,hash}))};
}
