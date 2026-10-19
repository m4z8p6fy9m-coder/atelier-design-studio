// Cooperative same-origin idle control. Messages carry timestamps/settings, never keys.
export const DEFAULT_IDLE_MINUTES=15;
export function idleMinutes(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>120)throw Error('Automatische Sperre: bitte 1 bis 120 Minuten wählen.');return n}
export class VaultIdle {
 constructor({storage,channel,events,now=()=>Date.now(),setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id),onLock=()=>{}}={}){
  Object.assign(this,{storage,channel,events,now,setTimer,clearTimer,onLock});this.owner=null;this.id=crypto.randomUUID();
  this.message=e=>{if(e.data?.type==='vault-idle'&&e.data.owner===this.owner&&e.data.source!==this.id)this.check()};
  this.storageEvent=e=>{if(this.owner&&(!e.key||e.key===this.activityKey||e.key===this.configKey))this.check()};
  this.wake=()=>this.check();this.input=e=>{if(e.isTrusted)this.activity()};
  channel?.addEventListener('message',this.message);events?.addEventListener('storage',this.storageEvent);
  for(const type of ['focus','pageshow'])events?.addEventListener(type,this.wake);
  events?.document?.addEventListener('visibilitychange',this.wake);
  for(const type of ['pointerdown','pointermove','keydown','input','wheel'])events?.addEventListener(type,this.input,{passive:true,capture:true});
 }
 keys(owner){return ['atelier-idle-activity-v1:'+owner,'atelier-idle-config-v1:'+owner]}
 read(){const last=Number(this.storage.getItem(this.activityKey)),raw=this.storage.getItem(this.configKey),minutes=raw===null?DEFAULT_IDLE_MINUTES:idleMinutes(raw);if(!Number.isFinite(last)||last<=0||last>this.now())throw Error('Ungültiger Aktivitätsstand oder geänderte Geräteuhr.');return {last,minutes}}
 start(owner){this.stop();[this.activityKey,this.configKey]=this.keys(owner);this.owner=owner;this.last=this.now();this.previousNow=this.last;try{const raw=this.storage.getItem(this.configKey);this.minutes=raw===null?DEFAULT_IDLE_MINUTES:idleMinutes(raw);this.storage.setItem(this.activityKey,String(this.last));this.broadcast();this.arm()}catch{this.expire('Automatische Sperre: Website-Speicher nicht verfügbar.')}}
 stop(){this.clearTimer(this.timer);this.owner=null;this.last=0}
 broadcast(){this.channel?.postMessage({type:'vault-idle',owner:this.owner,source:this.id})}
 expire(reason='Tresor wegen Inaktivität gesperrt.'){if(!this.owner)return;this.stop();this.onLock(reason)}
 check(){if(!this.owner)return false;try{const now=this.now(),state=this.read();if(now<this.previousNow)throw Error('Geräteuhr zurückgestellt.');this.previousNow=now;this.last=Math.max(this.last,state.last);this.minutes=state.minutes;if(now-this.last>=this.minutes*60000){this.expire();return false}this.arm();return true}catch{this.expire('Automatische Sperre: Aktivitätsabgleich fehlgeschlagen.');return false}}
 activity(){if(!this.check())return;const now=this.now();if(now-this.last<1000)return;try{this.last=now;this.storage.setItem(this.activityKey,String(now));this.broadcast();this.arm()}catch{this.expire('Automatische Sperre: Aktivität konnte nicht abgeglichen werden.')}}
 configure(value){if(!this.check())throw Error('Tresor zuerst erneut entsperren.');const minutes=idleMinutes(value);try{this.storage.setItem(this.configKey,String(minutes));this.broadcast();this.check()}catch{this.expire('Automatische Sperre: Einstellung konnte nicht gespeichert werden.');throw Error('Einstellung konnte nicht gespeichert werden.')}}
 arm(){this.clearTimer(this.timer);if(!this.owner)return;this.timer=this.setTimer(()=>this.check(),Math.max(1,Math.min(30000,this.last+this.minutes*60000-this.now())));this.timer?.unref?.()}
 close(){this.stop();this.channel?.removeEventListener('message',this.message);this.channel?.close();this.events?.removeEventListener('storage',this.storageEvent);for(const type of ['focus','pageshow'])this.events?.removeEventListener(type,this.wake);this.events?.document?.removeEventListener('visibilitychange',this.wake);for(const type of ['pointerdown','pointermove','keydown','input','wheel'])this.events?.removeEventListener(type,this.input,{capture:true})}
}
export function browserVaultIdle(onLock){const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('atelier-vault-idle-v1'):null;return new VaultIdle({storage:window.localStorage,channel,events:window,onLock})}
