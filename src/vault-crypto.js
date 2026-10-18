// Keys and passphrases remain in memory. Every value has a fresh GCM nonce.
const encoder=new TextEncoder(),decoder=new TextDecoder();
const b64=bytes=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
const bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
export async function deriveKey(password,salt){
  if(typeof password!=='string'||password.length<12)throw Error('Das Tresorpasswort braucht mindestens zwölf Zeichen.');
  const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(salt),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function seal(key,value,context){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(context)},key,encoder.encode(JSON.stringify(value)));
  return {v:1,iv:b64(iv),data:b64(new Uint8Array(data))};
}
export async function unseal(key,value,context){
  if(value?.v!==1||typeof value.iv!=='string'||typeof value.data!=='string'||bytes(value.iv).length!==12)throw Error('Ungültige Tresordatei.');
  const data=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(value.iv),additionalData:encoder.encode(context)},key,bytes(value.data));
  return JSON.parse(decoder.decode(data));
}
export async function createDescriptor(owner,password){
  const salt=b64(crypto.getRandomValues(new Uint8Array(16))),key=await deriveKey(password,salt);
  return {key,descriptor:{format:'atelier-vault-1',owner,salt,kdf:'PBKDF2-SHA256-600000',check:await seal(key,{ok:true},owner+':check')}};
}
export async function unlockDescriptor(descriptor,owner,password){
  if(descriptor?.format!=='atelier-vault-1'||descriptor.owner!==owner||descriptor.kdf!=='PBKDF2-SHA256-600000'||bytes(descriptor.salt).length!==16)throw Error('Ungültiger Tresorschlüssel.');
  const key=await deriveKey(password,descriptor.salt);
  try{if(!(await unseal(key,descriptor.check,owner+':check')).ok)throw Error();return key}catch{throw Error('Tresorpasswort falsch oder Schlüsseldatei beschädigt.');}
}
