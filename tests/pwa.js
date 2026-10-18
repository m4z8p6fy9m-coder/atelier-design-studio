const result=document.querySelector('#result'),base=new URL('../',location.href),script=new URL('sw.js',base).href;
document.querySelector('#inspect').onclick=async()=>{
  try{
    const registrations=(await navigator.serviceWorker.getRegistrations()).filter(r=>r.scope===base.href);
    const names=(await caches.keys()).filter(k=>k.startsWith('atelier-shell-'));
    const lines=['Atelier-Registrierungen: '+registrations.length];
    for(const name of names){const entries=await (await caches.open(name)).keys();const forbidden=entries.filter(e=>/\/api\/|\/server\/|\/data\/|\.env|\?/.test(e.url));lines.push(name+': '+entries.length+' Programmdateien; '+forbidden.length+' private/API-Einträge');if(forbidden.length)throw Error('Unerwartete Cache-Einträge');}
    result.textContent=lines.join('\n');
  }catch(error){result.textContent='Fehler: '+error.message}
};
document.querySelector('#reset').onclick=async()=>{
  try{
    for(const r of await navigator.serviceWorker.getRegistrations())if(r.scope===base.href&&[r.active,r.waiting,r.installing].some(w=>w?.scriptURL===script))await r.unregister();
    for(const name of await caches.keys())if(name.startsWith('atelier-shell-'))await caches.delete(name);
    result.textContent='Offline-Programmspeicher zurückgesetzt. Projekte bleiben erhalten. Atelier erneut öffnen, um die aktuelle Version einzurichten.';
  }catch(error){result.textContent='Fehler: '+error.message}
};
