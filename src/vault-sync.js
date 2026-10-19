export const SYNC_POLICY=Object.freeze({debounceMs:30000,minUploadMs:300000,keepNewest:10,minAgeMs:30*86400000,maxDeletes:3,maxFiles:1000});
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,35}$/.test(id);
export function snapshotName(parents){if(parents.length>5||parents.some(p=>!validId(p)))throw Error('Zu viele Konfliktzweige. Bitte Fassungen exportieren und manuell zusammenführen.');return 'snapshot-v2~'+(parents.length?parents.join('~'):'_')+'.json'}
export function snapshotParents(file){if(file.name==='snapshot-checkpoint-v1.json')return [];if(file.name==='snapshot.json')return null;if(!file.name?.startsWith('snapshot-v2~')||!file.name.endsWith('.json'))throw Error('Unbekanntes Online-Sicherungsformat.');const raw=file.name.slice(12,-5);if(raw==='_' )return [];const parents=raw.split('~');if(parents.length>5||new Set(parents).size!==parents.length||parents.some(p=>!validId(p)))throw Error('Ungültige Sicherungsverknüpfung.');return parents}
export function snapshotGraph(files,checkpoints=new Map()){
 const ordered=[...files].sort((a,b)=>(Date.parse(a.$createdAt)||0)-(Date.parse(b.$createdAt)||0)||a.$id.localeCompare(b.$id)),nodes=new Map();let previousLegacy=null;
 for(const file of ordered){if(!validId(file.$id)||nodes.has(file.$id))throw Error('Ungültige Online-Sicherungsliste.');const parsed=snapshotParents(file),parents=parsed===null?(previousLegacy?[previousLegacy]:[]):parsed;if(parsed===null)previousLegacy=file.$id;nodes.set(file.$id,{file,parents,legacy:parsed===null})}
 const covered=new Set([...checkpoints.values()].flatMap(entries=>[...entries.keys()]));for(const [id,node]of nodes)if(covered.has(id)&&!checkpoints.has(id))node.parents=[];
 for(const [id,entries]of checkpoints){const node=nodes.get(id);if(node)node.parents=[...entries.keys()].filter(key=>nodes.has(key));}
 const visited=new Set(),visiting=new Set();function visit(id){if(visiting.has(id))throw Error('Zyklische Online-Sicherung.');if(visited.has(id)||!nodes.has(id))return;visiting.add(id);for(const parent of nodes.get(id).parents)visit(parent);visiting.delete(id);visited.add(id)}for(const id of nodes.keys())visit(id);
 const referenced=new Set([...nodes.values()].flatMap(n=>n.parents));return {checkpoints,nodes,tips:ordered.filter(file=>!referenced.has(file.$id)).map(file=>file.$id),ordered};
}
export function retentionCandidates(files,now=Date.now()){
 const graph=snapshotGraph(files);if(graph.tips.length!==1)return [];
 const keep=new Set(graph.ordered.slice(-SYNC_POLICY.keepNewest).map(f=>f.$id)),ancestors=new Set();
 function visit(id){if(ancestors.has(id))return;ancestors.add(id);for(const p of graph.nodes.get(id)?.parents||[])visit(p)}visit(graph.tips[0]);
 const candidates=graph.ordered.filter(f=>ancestors.has(f.$id)&&!keep.has(f.$id)&&!graph.nodes.get(f.$id).legacy&&Number.isFinite(Date.parse(f.$createdAt))&&now-Date.parse(f.$createdAt)>SYNC_POLICY.minAgeMs),selected=[];let remaining=[...files];
 for(const file of candidates){const next=remaining.filter(f=>f.$id!==file.$id),tips=snapshotGraph(next).tips;if(tips.length!==1||tips[0]!==graph.tips[0])continue;selected.push(file);remaining=next;if(selected.length>=SYNC_POLICY.maxDeletes)break}return selected;
}
export async function snapshotDigest(snapshot){const text=JSON.stringify([...snapshot.records].sort((a,b)=>(a.id<b.id?-1:a.id>b.id?1:0)));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('')}
