import {VaultIdle} from '../src/vault-idle.js';
import {ManagedAccount} from '../src/managed-account.js';
import {browserVaultTabs} from '../src/vault-tabs.js';
import * as vault from '../src/private-storage.js';
import * as db from '../src/storage.js';
let idleClock=null;const m=new ManagedAccount();m.idle=new VaultIdle({storage:localStorage,channel:new BroadcastChannel('atelier-vault-idle-v1'),events:window,now:()=>idleClock??Date.now(),onLock:()=>m.requestLock()});m.account.get=async()=>m.user;
m.tabs=browserVaultTabs(()=>m.requestLock({broadcast:false}));
m.lifecycle={beforeLock:()=>{document.querySelector('#private').textContent='';document.querySelector('#state').textContent='Wird gesperrt';return Promise.resolve()},afterLock:async()=>{document.querySelector('#state').textContent='Gesperrt';parent.postMessage({type:'peer-locked',peer:new URLSearchParams(location.search).get('peer')},location.origin)}};
window.addEventListener('message',async event=>{
 if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='vault-test')return;
 const {id,action,args=[]}=event.data;try{let result;
 if(action==='seed'){await vault.patchVaultMeta(args[0].owner,{descriptor:args[0]});result=true}
 if(action==='unlock'){await m.unlockOffline(args[0],args[1]);document.querySelector('#private').textContent='SYNTHETIC PRIVATE DESIGN';document.querySelector('#state').textContent='Entsperrt';result=true}
 if(action==='write'){await db.put('settings',{id:'browser-record',value:args[0]});result=true}
 if(action==='read'){result=await db.get('settings','browser-record')}
 if(action==='lock'){await m.requestLock();result=true}
 if(action==='late-unlock'){const opening=m.unlockOffline(args[0],args[1]);m.lock();try{await opening;result={reopened:true}}catch{result={reopened:false,key:m.key===null}}}
 if(action==='idle-config'){m.idle.configure(args[0]);result=m.idle.minutes}
 if(action==='idle-info'){result={minutes:m.idle.minutes,active:!!m.idle.owner}}
 if(action==='idle-expire'){idleClock=Date.now()+16*60000;m.idle.check();while(m.transitioning)await new Promise(r=>setTimeout(r,10));result=!m.key;idleClock=null}
 if(action==='state'){m.tabs.check();result={owner:vault.vaultOwner(),key:m.key!==null,text:document.querySelector('#private').textContent}}
 if(action==='exclusive'){result=await m.exclusive(args[0],async()=>{const old=Number(localStorage.getItem('vault-lock-counter')||0);await new Promise(resolve=>setTimeout(resolve,60));localStorage.setItem('vault-lock-counter',String(old+1));return old+1})}
 parent.postMessage({type:'vault-result',id,result},location.origin);
 }catch(error){parent.postMessage({type:'vault-result',id,error:error.message},location.origin)}
});
parent.postMessage({type:'peer-ready',peer:new URLSearchParams(location.search).get('peer')},location.origin);
