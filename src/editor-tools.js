/** Axis-aligned visual bounds, including element rotation. */
export function visualBounds(elements){
  const boxes=elements.filter(e=>!e.hidden).map(e=>{const a=(e.rotation||0)*Math.PI/180,c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a)),w=e.w*c+e.h*s,h=e.w*s+e.h*c;return {x:e.x+(e.w-w)/2,y:e.y+(e.h-h)/2,w,h}});
  if(!boxes.length)return null;
  const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));
  return {x,y,w:Math.max(...boxes.map(b=>b.x+b.w))-x,h:Math.max(...boxes.map(b=>b.y+b.h))-y};
}
export function snapMovement(elements,others,width,height,dx,dy,tolerance=6,axis=null){
  const b=visualBounds(elements),guides=[];if(!b)return {dx,dy,guides};
  const selected=new Set(elements.map(e=>e.id)),targets={x:[0,width/2,width],y:[0,height/2,height]};
  for(const e of others){if(e.hidden||selected.has(e.id))continue;const t=visualBounds([e]);targets.x.push(t.x,t.x+t.w/2,t.x+t.w);targets.y.push(t.y,t.y+t.h/2,t.y+t.h)}
  const nearest=(key,offset)=>{const size=key==='x'?'w':'h',points=[b[key]+offset,b[key]+offset+b[size]/2,b[key]+offset+b[size]];let best=null;
    for(const target of targets[key])for(const point of points){const correction=target-point;if(Math.abs(correction)<=tolerance&&(!best||Math.abs(correction)<Math.abs(best.correction)))best={correction,position:target};}
    if(best){guides.push({axis:key,position:best.position});return offset+best.correction}return offset;
  };
  return {dx:axis==='y'?dx:nearest('x',dx),dy:axis==='x'?dy:nearest('y',dy),guides};
}
export function replaceImageAsset(element,asset){
  if(element?.type!=='image'||element.locked)throw Error('Bitte ein entsperrtes Bild auswählen.');
  if(!asset||!Number.isFinite(asset.w)||!Number.isFinite(asset.h)||asset.w<=0||asset.h<=0||!/^data:image\/(png|jpeg|webp|gif);base64,/.test(asset.src))throw Error('Ungültiges Ersatzbild.');
  Object.assign(element,{src:asset.src,imageW:asset.w,imageH:asset.h,name:asset.name||element.name,cropZoom:1,cropX:0,cropY:0});
}
export function imageToBackground(page,id,width,height){
  const index=page.elements.findIndex(e=>e.id===id),e=page.elements[index];
  if(e?.type!=='image'||e.locked)throw Error('Bitte ein entsperrtes Bild auswählen.');
  Object.assign(e,{x:0,y:0,w:width,h:height,rotation:0,mask:'rect',radius:0,cropZoom:1,cropX:0,cropY:0,shadowX:0,shadowY:0,shadowBlur:0,strokeWidth:0});
  page.elements.splice(index,1);page.elements.unshift(e);
}
export async function readImageAsset(file){
  if(!file||!/^image\/(png|jpeg|webp|gif)$/.test(file.type))throw Error('Bitte PNG, JPG, WebP oder GIF verwenden.');
  if(file.size>15*1024*1024)throw Error('Ein Bild darf maximal 15 MB groß sein.');
  const source=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Die Bilddatei konnte nicht gelesen werden.'));reader.readAsDataURL(file)});
  const image=new Image();image.src=source;try{await image.decode()}catch{throw Error('Die Datei enthält kein lesbares Bild.')}
  const ratio=Math.min(1,2400/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  return {id:crypto.randomUUID(),name:file.name,src:canvas.toDataURL('image/png'),w:canvas.width,h:canvas.height};
}
