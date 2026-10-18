// Cache only this explicit application shell. Accounts, API responses, project
// data, imports, tests, query-string requests and other origins are never cached.
const VERSION='atelier-shell-0.9.0-r1';
const FILES=['./','index.html','style.css','icon.svg','icon-192.png','icon-512.png','icon-maskable.png','manifest.webmanifest',
  'src/app.js','src/accounts-ui.js','src/cloud.js','src/commands.js','src/design.js','src/editor-tools.js','src/export.js','src/font-assets.js','src/image-editor.js','src/image-tools.js','src/links.js','src/model.js','src/publishing.js','src/pwa.js','src/render.js','src/starter-kits.js','src/storage.js','src/templates.js'];
const SHELL=new Set(FILES.map(file=>new URL(file,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll([...SHELL]))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('atelier-shell-')&&key!==VERSION)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.search||url.origin!==self.location.origin||!SHELL.has(url.href)||request.headers.has('range'))return;
  event.respondWith((async()=>{
    const cache=await caches.open(VERSION),cached=await cache.match(request);
    if(cached)return cached;
    // A missing shell entry should not turn an error page into a saved asset.
    return fetch(request);
  })());
});
