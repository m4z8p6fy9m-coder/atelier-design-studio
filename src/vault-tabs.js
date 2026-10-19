// Invalidation messages contain no email, password, project content or key.
export class VaultTabs {
 constructor({storage,channel,events,onRevoke=()=>{}}={}){
  this.storage=storage;this.channel=channel;this.events=events;this.onRevoke=onRevoke;this.id=crypto.randomUUID();this.name='atelier-vault-revocation-v1';this.known=this.read();
  this.receive=()=>this.check();this.message=event=>{if(event.data?.type==='vault-revoke'&&event.data.source!==this.id)this.check(event.data.token)};
  channel?.addEventListener('message',this.message);for(const type of ['storage','focus','pageshow'])events?.addEventListener(type,this.receive);
  this.visible=()=>{if(!events?.document?.hidden)this.check()};events?.document?.addEventListener('visibilitychange',this.visible);
 }
 read(){try{return this.storage?.getItem(this.name)||''}catch{throw Error('Sicherer Tab-Abgleich benötigt verfügbaren Website-Speicher.')}}
 ticket(){if(this.failed)throw Error('Tab-Abgleich ist ausgefallen. Bitte andere Tabs schließen und die Seite neu laden.');this.check();return this.read()}
 valid(ticket){this.check();return ticket===this.read()}
 check(message){let token;try{token=message||this.read()||''}catch{if(!this.failed){this.failed=true;this.onRevoke()}return}if(token!==this.known){this.known=token;this.onRevoke()}}
 revoke(){const token=crypto.randomUUID();let error;try{this.storage?.setItem(this.name,token)}catch(e){this.failed=true;error=e}this.known=token;try{this.channel?.postMessage({type:'vault-revoke',source:this.id,token})}catch(e){error??=e}if(error)throw error;return token}
 close(){this.channel?.removeEventListener('message',this.message);this.channel?.close();for(const type of ['storage','focus','pageshow'])this.events?.removeEventListener(type,this.receive);this.events?.document?.removeEventListener('visibilitychange',this.visible)}
}
export function browserVaultTabs(onRevoke){let channel=null;try{if(typeof BroadcastChannel==='function')channel=new BroadcastChannel('atelier-vault-control-v1')}catch{}return new VaultTabs({storage:window.localStorage,channel,events:window,onRevoke})}
