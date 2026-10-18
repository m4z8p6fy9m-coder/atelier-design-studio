import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {createAtelierServer} from '../server/app.js';
const password='test-password-at-least-twelve',email='student@example.test',secret='test-only-secret-32-characters-minimum';
async function fixture(t,options={}){
  const directory=await mkdtemp(path.join(os.tmpdir(),'atelier-auth-test-')),mailbox=[];let clock=Date.now();
  const settings={directory,mail:{mode:'test',send:async message=>mailbox.push(message)},authSecret:secret,now:()=>clock,...options};
  let app=await createAtelierServer(settings),origin=await app.listen(0);
  t.after(async()=>{await app.close();const relative=path.relative(os.tmpdir(),directory);assert.ok(relative.startsWith('atelier-auth-test-')&&!relative.includes(path.sep));await rm(directory,{recursive:true,force:true})});
  const f={mailbox,get app(){return app},get origin(){return origin},advance:ms=>clock+=ms,async restart(){await app.close();app=await createAtelierServer(settings);origin=await app.listen(0)},async req(route,input,user,extra={}){const res=await fetch(origin+'/api/'+route,{method:input===undefined?'GET':'POST',headers:{...(input!==undefined?{'Content-Type':'application/json'}:{}),...(user?{Cookie:user.cookie,'X-CSRF-Token':user.csrf}:{}),...extra},body:input===undefined?undefined:JSON.stringify(input),redirect:'manual'});let data;try{data=await res.json()}catch{}return {res,status:res.status,data,cookie:res.headers.get('set-cookie')?.split(';')[0]}},code(){return mailbox.at(-1).text.match(/Code: (\d{6})/)[1]},async register(address=email){const r=await f.req('register',{name:'Student',email:address,password});assert.equal(r.status,202);const v=await f.req('auth/verify',{challengeId:r.data.challengeId,code:f.code(),purpose:'register'});assert.equal(v.status,200);return {...v.data,cookie:v.cookie}}};return f;
}
test('email registration creates no account or session until a single-use code is confirmed',async t=>{
 const f=await fixture(t),r=await f.req('register',{name:'Student',email,password});assert.equal(r.status,202);assert.equal(r.cookie,undefined);assert.equal(Object.keys(f.app.store.state.users).length,0);assert.equal((await f.req('session')).data.user,null);assert.equal(f.mailbox.length,1);
 const disk=await readFile(f.app.store.file,'utf8');assert.ok(!disk.includes(password));assert.ok(!disk.includes(f.code()));assert.ok(!JSON.stringify(r.data).includes(f.code()));
 const wrong=f.code()==='000000'?'111111':'000000';assert.equal((await f.req('auth/verify',{challengeId:r.data.challengeId,code:wrong,purpose:'register'})).status,400);
 const v=await f.req('auth/verify',{challengeId:r.data.challengeId,code:f.code(),purpose:'register'});assert.equal(v.status,200);assert.equal(v.data.user.emailVerified,true);assert.equal(v.data.user.passwordHash,undefined);assert.match(v.res.headers.get('set-cookie'),/HttpOnly; SameSite=Lax/);assert.equal((await f.req('auth/verify',{challengeId:r.data.challengeId,code:f.code(),purpose:'register'})).status,400);
});
test('five wrong codes lock a challenge; resend cooldown and replacement code are enforced',async t=>{
 const f=await fixture(t),r=await f.req('register',{name:'Student',email,password}),first=f.code(),wrong=first==='000000'?'111111':'000000';
 for(let i=0;i<5;i++)assert.equal((await f.req('auth/verify',{challengeId:r.data.challengeId,purpose:'register',code:wrong})).status,400);
 assert.equal((await f.req('auth/verify',{challengeId:r.data.challengeId,purpose:'register',code:first})).status,400);
 assert.equal((await f.req('auth/resend',{challengeId:r.data.challengeId})).status,429);f.advance(61000);
 const resend=await f.req('auth/resend',{challengeId:r.data.challengeId});assert.equal(resend.status,202);assert.equal(f.mailbox.length,2);
 if(f.code()!==first)assert.equal((await f.req('auth/verify',{challengeId:r.data.challengeId,purpose:'register',code:first})).status,400);
 assert.equal((await f.req('auth/verify',{challengeId:r.data.challengeId,purpose:'register',code:f.code()})).status,200);
});
test('codes survive restart with the same secret and expire after ten minutes',async t=>{
 const f=await fixture(t),r=await f.req('register',{name:'Student',email,password});await f.restart();assert.equal((await f.req('auth/verify',{challengeId:r.data.challengeId,purpose:'register',code:f.code()})).status,200);
 const reset=await f.req('auth/forgot',{email});f.advance(600001);assert.equal((await f.req('auth/reset',{challengeId:reset.data.challengeId,code:f.code(),password:'new-test-password-13579'})).status,400);
});
test('password reset hides unknown addresses, replaces credentials and revokes all old sessions and codes',async t=>{
 const f=await fixture(t),u=await f.register(),login=await f.req('login',{email,password}),other={...login.data,cookie:login.cookie};
 const a=await f.req('auth/forgot',{email}),old=f.code(),unknown=await f.req('auth/forgot',{email:'unknown@example.test'});assert.equal(unknown.status,a.status);assert.deepEqual(Object.keys(unknown.data),Object.keys(a.data));assert.equal(f.mailbox.length,2);
 f.advance(61000);const b=await f.req('auth/forgot',{email}),code=f.code(),next='new-password-2468';
 assert.equal((await f.req('auth/reset',{challengeId:b.data.challengeId,code,password:next})).status,200);assert.equal((await f.req('session',undefined,u)).data.user,null);assert.equal((await f.req('session',undefined,other)).data.user,null);
 assert.equal((await f.req('login',{email,password})).status,401);assert.equal((await f.req('login',{email,password:next})).status,200);
 assert.equal((await f.req('auth/reset',{challengeId:a.data.challengeId,code:old,password:'another-test-password'})).status,400);assert.equal((await f.req('auth/reset',{challengeId:b.data.challengeId,code,password:next})).status,400);
});
test('existing unverified accounts must prove mailbox ownership on their next login',async t=>{
 const f=await fixture(t),u=await f.register();await f.app.store.transaction(state=>{state.users[u.user.id].emailVerified=false;return true});const login=await f.req('login',{email,password});assert.equal(login.status,202);assert.equal(login.data.purpose,'verify');assert.equal((await f.req('auth/verify',{challengeId:login.data.challengeId,purpose:'verify',code:f.code()})).status,200);
});
test('account profile and password changes enforce CSRF, current password and session rotation',async t=>{
 const f=await fixture(t),u=await f.register();assert.equal((await f.req('account/profile',{name:'Updated'},u,{'X-CSRF-Token':'wrong'})).status,403);
 assert.equal((await f.req('account/profile',{name:'Updated'},u)).data.user.name,'Updated');assert.equal((await f.req('account/password',{currentPassword:'wrong',password:'a-new-password-1234'},u)).status,401);
 const changed=await f.req('account/password',{currentPassword:password,password:'a-new-password-1234'},u);assert.equal(changed.status,200);assert.notEqual(changed.cookie,u.cookie);assert.equal((await f.req('session',undefined,u)).data.user,null);
 const fresh={...changed.data,cookie:changed.cookie};assert.equal((await f.req('account/logout-all',{},fresh)).status,200);assert.equal((await f.req('session',undefined,fresh)).data.user,null);
});
test('delivery failures invalidate codes; missing mail configuration fails closed',async t=>{
 const f=await fixture(t,{mail:{mode:'test',send:async()=>{throw Error('provider detail must remain private')}}});const r=await f.req('register',{name:'Student',email,password});assert.equal(r.status,503);assert.ok(!r.data.error.includes('provider detail'));assert.equal(Object.keys(f.app.store.state.users).length,0);assert.ok(Object.values(f.app.store.state.authChallenges).every(c=>c.used&&!c.codeHash&&!c.pending));
 const g=await fixture(t,{mail:null});assert.equal((await g.req('register',{name:'Student',email,password})).status,503);assert.equal((await g.req('auth/forgot',{email})).status,503);assert.equal((await g.req('health')).data.auth.emailCodes,false);
});
test('per-address mail budgets persist across restarts and login attempts are limited',async t=>{
 const f=await fixture(t);for(let i=0;i<5;i++){assert.equal((await f.req('auth/forgot',{email})).status,202);f.advance(61000)}await f.restart();assert.equal((await f.req('auth/forgot',{email})).status,429);
 for(let i=0;i<10;i++)assert.equal((await f.req('login',{email:'other@example.test',password:'wrong'})).status,401);assert.equal((await f.req('login',{email:'other@example.test',password:'wrong'})).status,429);
});
function mockGoogle(identity){let last;return {begin(){last={state:randomBytes(32).toString('base64url'),verifier:'test-verifier',nonce:'test-nonce',url:'https://accounts.google.com/o/oauth2/v2/auth'};return last},async exchange(code,flow){assert.equal(code,'test-code');assert.equal(flow.nonce,'test-nonce');return identity},get last(){return last}}}
test('Google callbacks are browser-bound, single-use and create verified accounts without passwords',async t=>{
 const provider=mockGoogle({sub:'google-sub-1',email,name:'Google Student'}),f=await fixture(t,{google:provider});const start=await f.req('auth/google/start');assert.equal(start.status,303);const state=provider.last.state;
 const missing=await f.req('auth/google/callback?state='+state+'&code=test-code');assert.match(missing.res.headers.get('location'),/invalid-state/);
 const callback=await f.req('auth/google/callback?state='+state+'&code=test-code',undefined,{cookie:start.cookie});assert.equal(callback.res.headers.get('location'),'/#auth-success=google');const cookies=callback.res.headers.getSetCookie();assert.equal(cookies.length,2);const cookie=cookies.find(c=>c.startsWith('atelier_session=')).split(';')[0];
 const u=(await f.req('session',undefined,{cookie})).data.user;assert.equal(u.emailVerified,true);assert.equal(u.googleLinked,true);assert.equal(u.hasPassword,false);assert.equal((await f.req('auth/google/callback?state='+state+'&code=test-code',undefined,{cookie:start.cookie})).res.headers.get('location'),'/#auth-error=invalid-state');
});
test('Google never automatically links by email; explicit linking requires the signed-in matching account',async t=>{
 const provider=mockGoogle({sub:'google-sub-2',email,name:'Google Student'}),f=await fixture(t,{google:provider}),u=await f.register();const start=await f.req('auth/google/start');const callback=await f.req('auth/google/callback?state='+provider.last.state+'&code=test-code',undefined,{cookie:start.cookie});assert.equal(callback.res.headers.get('location'),'/#auth-error=account-exists');assert.equal(Object.keys(f.app.store.state.users).length,1);
 assert.equal((await f.req('auth/google/link',{},u,{'X-CSRF-Token':'wrong'})).status,403);const link=await f.req('auth/google/link',{},u);assert.equal(link.status,200);
 const linked=await f.req('auth/google/callback?state='+provider.last.state+'&code=test-code',undefined,{cookie:u.cookie+'; '+link.cookie});assert.equal(linked.res.headers.get('location'),'/#auth-success=google');assert.equal(f.app.store.state.users[u.user.id].googleSub,'google-sub-2');
});
test('Google does not create accounts when registration is disabled',async t=>{
 const provider=mockGoogle({sub:'google-sub-3',email,name:'Google Student'}),f=await fixture(t,{google:provider,allowRegistration:false});const start=await f.req('auth/google/start');const callback=await f.req('auth/google/callback?state='+provider.last.state+'&code=test-code',undefined,{cookie:start.cookie});assert.equal(callback.res.headers.get('location'),'/#auth-error=registration-disabled');assert.equal(Object.keys(f.app.store.state.users).length,0);
});
test('Google linking cannot complete after the initiating session was revoked',async t=>{
 let entered,release;const waiting=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
 const provider=mockGoogle({sub:'google-sub-race',email,name:'Google Student'});provider.exchange=async()=>{entered();await gate;return {sub:'google-sub-race',email,name:'Google Student'}};
 const f=await fixture(t,{google:provider}),u=await f.register(),link=await f.req('auth/google/link',{},u);
 const callback=f.req('auth/google/callback?state='+provider.last.state+'&code=test-code',undefined,{cookie:u.cookie+'; '+link.cookie});await waiting;
 assert.equal((await f.req('account/logout-all',{},u)).status,200);release();assert.equal((await callback).res.headers.get('location'),'/#auth-error=session-changed');assert.equal(f.app.store.state.users[u.user.id].googleSub,undefined);
});
test('two concurrent password changes cannot both succeed with the previous password',async t=>{
 const f=await fixture(t),u=await f.register();const changes=await Promise.all(['concurrent-password-one','concurrent-password-two'].map(password=>f.req('account/password',{currentPassword:'test-password-at-least-twelve',password},u)));assert.equal(changes.filter(r=>r.status===200).length,1);assert.ok(changes.some(r=>[401,409].includes(r.status)));
});
