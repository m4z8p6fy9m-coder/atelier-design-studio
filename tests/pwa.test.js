import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,access} from 'node:fs/promises';
import {templates} from '../src/templates.js';
import {newDoc,normalizeDocument} from '../src/model.js';
import {svgMarkup} from '../src/render.js';

async function worker(){
  const listeners={},store=new Map(),deleted=[];let claimed=false,activated=false;
  const scope='https://example.test/atelier/';
  const cache={async addAll(urls){for(const url of urls)store.set(url,new Response('cached:'+url))},async match(req){return store.get(typeof req==='string'?req:req.url)?.clone()}};
  const caches={async open(){return cache},async keys(){return ['atelier-shell-0.8.0','other-app-cache','atelier-shell-0.9.0-r1']},async delete(key){deleted.push(key)}};
  const self={registration:{scope},location:{origin:new URL(scope).origin},clients:{async claim(){claimed=true}},skipWaiting(){activated=true},addEventListener(type,callback){listeners[type]=callback}};
  vm.runInNewContext(await readFile(new URL('../sw.js',import.meta.url),'utf8'),{self,caches,URL,fetch:async()=>{throw Error('Network offline')}});
  let installation;listeners.install({waitUntil(p){installation=p}});await installation;
  function request(url,options){let response;listeners.fetch({request:new Request(url,options),respondWith(p){response=p}});return response}
  return {listeners,store,deleted,request,scope,get claimed(){return claimed},get activated(){return activated}};
}

test('offline shell serves under a repository subpath while the network is unavailable',async()=>{
  const w=await worker();
  for(const path of ['', 'index.html','src/app.js','src/pwa.js','manifest.webmanifest'])assert.match(await (await w.request(w.scope+path)).text(),/^cached:/);
  for(const url of w.store.keys())await access(new URL('../'+new URL(url).pathname.replace('/atelier/',''),import.meta.url));
  for(const module of ['app','accounts-ui','cloud','commands','design','editor-tools','export','font-assets','image-editor','image-tools','links','model','publishing','pwa','render','starter-kits','storage','templates'])assert.ok(w.store.has(w.scope+'src/'+module+'.js'));
});
test('offline worker never intercepts account APIs, private files, queries, mutations or other origins',async()=>{
  const w=await worker();
  for(const path of ['api/session','api/projects','server/app.js','.env','data/atelier.json','tests/browser.html','?auth=private','src/app.js?token=secret'])assert.equal(w.request(w.scope+path),undefined);
  assert.equal(w.request('https://elsewhere.test/atelier/src/app.js'),undefined);
  assert.equal(w.request(w.scope+'index.html',{method:'POST',body:'private'}),undefined);
  assert.equal(w.request(w.scope+'index.html',{headers:{range:'bytes=0-10'}}),undefined);
});
test('updates activate explicitly and only remove Atelier shell caches',async()=>{
  const w=await worker();assert.equal(w.activated,false);
  w.listeners.message({data:{type:'unrelated'}});assert.equal(w.activated,false);
  w.listeners.message({data:{type:'ACTIVATE_UPDATE'}});assert.equal(w.activated,true);
  let activation;w.listeners.activate({waitUntil(p){activation=p}});await activation;
  assert.deepEqual(w.deleted,['atelier-shell-0.8.0']);assert.equal(w.claimed,true);
});
test('twenty original templates remain importable and render finite SVGs with fresh identities',()=>{
  assert.equal(templates.length,20);
  for(const t of templates){const doc=newDoc();doc.pages[0].bg=t.bg;doc.pages[0].elements=t.els();const normalized=normalizeDocument(doc);const svg=svgMarkup(normalized.pages[0],1080,1080);assert.ok(!/NaN|Infinity|undefined/.test(svg),t.name);assert.notEqual(t.els()[0].id,t.els()[0].id)}
});
