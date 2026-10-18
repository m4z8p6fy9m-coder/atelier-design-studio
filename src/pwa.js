export function setupPWA(onChange=()=>{}){
  let prompt=null,registration=null;
  const state={supported:'serviceWorker' in navigator,online:navigator.onLine,ready:false,updateReady:false,installed:matchMedia('(display-mode: standalone)').matches};
  const notify=()=>onChange({...state});
  window.addEventListener('online',()=>{state.online=true;notify()});
  window.addEventListener('offline',()=>{state.online=false;notify()});
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;notify()});
  window.addEventListener('appinstalled',()=>{state.installed=true;prompt=null;notify()});
  const watch=reg=>{
    registration=reg;
    if(reg.waiting){state.updateReady=true;notify()}
    reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){state.updateReady=!!navigator.serviceWorker.controller;notify()}})});
  };
  if(state.supported&&window.isSecureContext){
    navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{updateViaCache:'none'})
      .then(watch).catch(error=>{console.warn('Offline-Einrichtung nicht verfügbar:',error.message)});
    navigator.serviceWorker.ready.then(reg=>{registration=reg;state.ready=true;notify()});
  }
  notify();
  return {
    get state(){return {...state}},
    async install(){if(!prompt)return 'manual';const pending=prompt;prompt=null;await pending.prompt();const result=await pending.userChoice;notify();return result.outcome},
    async update(){const worker=registration?.waiting;if(!worker)return false;let reload=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reload){reload=true;location.reload()}},{once:true});worker.postMessage({type:'ACTIVATE_UPDATE'});return true}
  };
}
