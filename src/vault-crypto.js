// Keys and passphrases remain in memory. Every value has a fresh GCM nonce.
const encoder=new TextEncoder(),decoder=new TextDecoder();
const b64=bytes=>{let binary='';for(let offset=0;offset<bytes.length;offset+=32768)binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));return btoa(binary)};
const bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
export async function deriveKey(password,salt,extractable=false){
  if(typeof password!=='string'||password.length<12)throw Error('Das Tresorpasswort braucht mindestens zwölf Zeichen.');
  const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(salt),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},extractable,['encrypt','decrypt']);
}
export const MAX_PLAIN_BYTES=128*1024*1024;
async function boundedStream(stream,limit){const reader=stream.getReader(),parts=[];let length=0;try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit)throw Error('Entpackte Tresordatei überschreitet das Größenlimit.');parts.push(value)}}catch(error){await reader.cancel().catch(()=>{});throw error}finally{reader.releaseLock()}const result=new Uint8Array(length);let offset=0;for(const part of parts){result.set(part,offset);offset+=part.length}return result}
const encryptedAAD=(value,context)=>encoder.encode(value.v===2?JSON.stringify(['atelier-seal-2',context,value.codec,value.plainBytes]):context);
export async function seal(key,value,context){
 const plain=encoder.encode(JSON.stringify(value));if(plain.length>MAX_PLAIN_BYTES)throw Error('Tresorinhalt überschreitet 128 MiB.');let content=plain,envelope={v:1};
 if(plain.length>=1024&&typeof CompressionStream==='function'){let zipped;try{zipped=await boundedStream(new Blob([plain]).stream().pipeThrough(new CompressionStream('gzip')),plain.length)}catch{zipped=null}if(zipped&&zipped.length+64<plain.length){content=zipped;envelope={v:2,codec:'gzip',plainBytes:plain.length}}}
 const iv=crypto.getRandomValues(new Uint8Array(12)),data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encryptedAAD(envelope,context)},key,content);return {...envelope,iv:b64(iv),data:b64(new Uint8Array(data))};
}
export async function unseal(key,value,context,{allowLegacy=true}={}){
 if(![1,2].includes(value?.v)||typeof value.iv!=='string'||typeof value.data!=='string'||value.data.length>Math.ceil((MAX_PLAIN_BYTES+1040)/3)*4||bytes(value.iv).length!==12)throw Error('Ungültige Tresordatei.');
 if(value.v===2&&(value.codec!=='gzip'||!Number.isSafeInteger(value.plainBytes)||value.plainBytes<1||value.plainBytes>MAX_PLAIN_BYTES))throw Error('Ungültige Kompressionsangaben.');
 let data;const algorithm={name:'AES-GCM',iv:bytes(value.iv),additionalData:encryptedAAD(value,context)};try{data=await crypto.subtle.decrypt(algorithm,key,bytes(value.data))}catch(error){const old=allowLegacy&&legacyKeys.get(key);if(!old)throw error;data=await crypto.subtle.decrypt(algorithm,old,bytes(value.data))}
 if(value.v===1&&data.byteLength>MAX_PLAIN_BYTES)throw Error('Tresorinhalt überschreitet 128 MiB.');
 if(value.v===2){if(typeof DecompressionStream!=='function')throw Error('Dieser Browser kann komprimierte Tresordaten nicht öffnen.');data=await boundedStream(new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip')),value.plainBytes);if(data.length!==value.plainBytes)throw Error('Entpackte Länge stimmt nicht überein.')}
 return JSON.parse(decoder.decode(data));
}
export async function createLegacyDescriptor(owner,password){
  const salt=b64(crypto.getRandomValues(new Uint8Array(16))),key=await deriveKey(password,salt);
  return {key,descriptor:{format:'atelier-vault-1',owner,salt,kdf:'PBKDF2-SHA256-600000',check:await seal(key,{ok:true},owner+':check')}};
}
export async function unlockDescriptor(descriptor,owner,password){
  if(descriptor?.format==='atelier-vault-2')return openV2(descriptor,owner,password,false);
  if(descriptor?.format!=='atelier-vault-1'||descriptor.owner!==owner||descriptor.kdf!=='PBKDF2-SHA256-600000'||bytes(descriptor.salt).length!==16)throw Error('Ungültiger Tresorschlüssel.');
  const key=await deriveKey(password,descriptor.salt);
  try{if(!(await unseal(key,descriptor.check,owner+':check')).ok)throw Error();return key}catch{throw Error('Tresorpasswort falsch oder Schlüsseldatei beschädigt.');}
}

export const MAX_BACKUP_BYTES=128*1024*1024;
const canonical=value=>JSON.stringify(value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.keys(value).sort().map(k=>[k,JSON.parse(canonical(value[k]))])):value);
export function sameDescriptor(a,b){return canonical(a)===canonical(b)}
const legacyKeys=new WeakMap(),alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const random=n=>crypto.getRandomValues(new Uint8Array(n));
const importAES=raw=>crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
export function recoveryParts(value){const text=String(value).toUpperCase().replace(/[\s-]/g,'');if(text.length!==52||!/^[A-Z2-7]+$/.test(text))throw Error('Recovery-Key muss aus 13 Gruppen mit je vier Base32-Zeichen bestehen.');let bits=0,acc=0,out=[];for(const c of text){acc=(acc<<5)|alphabet.indexOf(c);bits+=5;if(bits>=8){bits-=8;out.push((acc>>bits)&255)}}if((acc&15)!==0)throw Error('Ungültiger Recovery-Key.');return new Uint8Array(out)}
export function newRecoveryKey(){let bits=0,acc=0,text='';for(const x of random(32)){acc=(acc<<8)|x;bits+=8;while(bits>=5){bits-=5;text+=alphabet[(acc>>bits)&31]}}if(bits)text+=alphabet[(acc<<(5-bits))&31];return text.match(/.{1,4}/g).join('-')}
const wrapContext=(d,purpose)=>JSON.stringify(['atelier-vault-2',d.owner,d.id,purpose,...(d[purpose+'Epoch']?[d[purpose+'Epoch']]:[])]);
async function v2Key(d,raw){if(raw.length!==32)throw Error('Ungültiger Datenschlüssel.');const key=await importAES(raw);if(d.legacy){const old=await unseal(key,d.legacy,wrapContext(d,'legacy'));legacyKeys.set(key,await importAES(bytes(old.raw)))}if(!(await unseal(key,d.check,d.owner+':check')).ok)throw Error('Ungültiger Schlüsseltest.');return key}
function validateV2(d,owner){if(d?.format!=='atelier-vault-2'||d.owner!==owner||typeof d.id!=='string'||!/^[-a-f0-9]{36}$/.test(d.id)||d.kdf!=='PBKDF2-SHA256-600000'||bytes(d.salt).length!==16)throw Error('Ungültige Schlüsseldatei.')}
async function unwrap(d,owner,secret,recovery){validateV2(d,owner);const kek=recovery?await importAES(recoveryParts(secret)):await deriveKey(secret,d.salt);const value=await unseal(kek,recovery?d.recoveryWrap:d.passwordWrap,wrapContext(d,recovery?'recovery':'password'));return bytes(value.raw)}
async function openV2(d,owner,secret,recovery){try{const raw=await unwrap(d,owner,secret,recovery);try{return await v2Key(d,raw)}finally{raw.fill(0)}}catch{throw Error('Passwort/Recovery-Key falsch oder Schlüsseldatei beschädigt.')}}
export const unlockRecovery=(descriptor,owner,recoveryKey)=>openV2(descriptor,owner,recoveryKey,true);
export async function createDescriptor(owner,password,{legacyDescriptor=null}={}){
 const raw=random(32),recoveryKey=newRecoveryKey(),descriptor={format:'atelier-vault-2',owner,id:crypto.randomUUID(),salt:b64(random(16)),kdf:'PBKDF2-SHA256-600000'};
 try{const key=await importAES(raw);descriptor.check=await seal(key,{ok:true},owner+':check');
  if(legacyDescriptor){await unlockDescriptor(legacyDescriptor,owner,password);const old=await deriveKey(password,legacyDescriptor.salt,true),oldRaw=new Uint8Array(await crypto.subtle.exportKey('raw',old));try{descriptor.legacy=await seal(key,{raw:b64(oldRaw),descriptor:legacyDescriptor},wrapContext(descriptor,'legacy'));legacyKeys.set(key,await importAES(oldRaw))}finally{oldRaw.fill(0)}}
  descriptor.passwordWrap=await seal(await deriveKey(password,descriptor.salt),{raw:b64(raw)},wrapContext(descriptor,'password'));
  descriptor.recoveryWrap=await seal(await importAES(recoveryParts(recoveryKey)),{raw:b64(raw)},wrapContext(descriptor,'recovery'));
  return {key,descriptor,recoveryKey};
 }finally{raw.fill(0)}
}
export async function changeVaultPassword(descriptor,owner,secret,password,{recovery=false}={}){const raw=await unwrap(descriptor,owner,secret,recovery);try{await v2Key(descriptor,raw);const next={...descriptor,salt:b64(random(16)),passwordEpoch:crypto.randomUUID()};next.passwordWrap=await seal(await deriveKey(password,next.salt),{raw:b64(raw)},wrapContext(next,'password'));return next}finally{raw.fill(0)}}
export async function acceptsBackup(key,current,backup){if(sameDescriptor(current,backup))return true;if(current?.format!=='atelier-vault-2'||backup?.owner!==current.owner)return false;if(backup.format==='atelier-vault-2')return current.id===backup.id&&canonical(current.check)===canonical(backup.check)&&canonical(current.legacy||null)===canonical(backup.legacy||null);if(current.legacy){const old=await unseal(key,current.legacy,wrapContext(current,'legacy'));return sameDescriptor(old.descriptor,backup)}return false}

export async function rotateRecoveryKey(descriptor,owner,secret,{recovery=false}={}){const raw=await unwrap(descriptor,owner,secret,recovery);try{await v2Key(descriptor,raw);const recoveryKey=newRecoveryKey(),next={...descriptor,recoveryEpoch:crypto.randomUUID()};next.recoveryWrap=await seal(await importAES(recoveryParts(recoveryKey)),{raw:b64(raw)},wrapContext(next,'recovery'));return {descriptor:next,recoveryKey}}finally{raw.fill(0)}}
