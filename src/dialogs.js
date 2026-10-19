import {esc} from './render.js';
export function createDialogs(dialog,body){
 let returnFocus=null;
 dialog.removeAttribute('aria-label');dialog.setAttribute('aria-labelledby','atelierDialogTitle');
 dialog.addEventListener('close',()=>{if(dialog.open)return;body.replaceChildren();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null});
 return {show(title,content,wide=false){if(!dialog.open)returnFocus=document.activeElement;dialog.classList.toggle('large',wide);body.innerHTML=`<div class="dialog-head"><h2 id="atelierDialogTitle">${esc(title)}</h2><button data-action="close" aria-label="Dialog schließen">✕</button></div>${content}`;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;body.querySelector('[autofocus], input:not([type="file"]):not([disabled]), button[data-action="close"]')?.focus({preventScroll:true})}};
}
