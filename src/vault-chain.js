import {CHECKPOINT_FORMAT,checkpointEntries} from './vault-checkpoints.js';
import {jsonHash} from './vault-backup.js';
const hex=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export async function verifySnapshotChain(head,load,anchor=null){
 const seen=new Map();let anchored=!anchor;
 async function visit(id,expected){
  if(seen.has(id)){
   if(expected&&seen.get(id)!==expected)throw Error('Hash-Konflikt in der Sicherungskette.');
   return;
  }
  if(seen.size>=1000)throw Error('Sicherungskette überschreitet das Prüflimit.');
  const {payload,snapshot}=await load(id),hash=await jsonHash(payload);
  if(expected&&hash!==expected)throw Error('Manipulierter Vorgänger: Snapshot-Hash stimmt nicht.');
  seen.set(id,hash);
  if(anchor?.id===id){
   if(anchor.hash!==hash)throw Error('Rollback-Warnung: bekannter Head wurde verändert.');
   anchored=true;return;
  }
  if(payload.format===CHECKPOINT_FORMAT){
   const entries=checkpointEntries(snapshot);
   if(anchor&&entries.has(anchor.id)){
    if(entries.get(anchor.id)!==anchor.hash)throw Error('Rollback-Warnung: Checkpoint-Anker wurde verändert.');
    anchored=true;
   }
   return;
  }
  if(payload.format==='atelier-encrypted-backup-3'){
   const parents=snapshot.sync?.parents,hashes=snapshot.sync?.parentHashes;
   if(!Array.isArray(parents)||!Array.isArray(hashes)||hashes.length!==parents.length||hashes.some((p,i)=>p.id!==parents[i]||!hex(p.hash)))throw Error('Ungültige Hash-Verknüpfung.');
   for(const p of hashes)await visit(p.id,p.hash);
  }
 }
 await visit(head);
 if(!anchored)throw Error('Rollback-Warnung: Online-Stand enthält den lokal bestätigten Head nicht.');
 return {id:head,hash:seen.get(head)};
}
