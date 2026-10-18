import test from 'node:test';
import assert from 'node:assert/strict';
import { CloudClient } from '../src/cloud.js';

test('client waits for email verification before accepting an authenticated session',async()=>{
 const originalFetch=globalThis.fetch,client=new CloudClient();
 try{globalThis.fetch=async()=>Response.json({verificationRequired:true,challengeId:'test-challenge',purpose:'register'});const result=await client.authenticate('register',{email:'test@example.test'});assert.equal(result.verificationRequired,true);assert.equal(client.user,null);assert.equal(client.csrf,null);
 globalThis.fetch=async()=>Response.json({user:{id:'verified-user'},csrf:'new-session-token'});await client.authenticate('auth/verify',{challengeId:'test-challenge',code:'123456'});assert.equal(client.user.id,'verified-user');assert.equal(client.csrf,'new-session-token');}finally{globalThis.fetch=originalFetch}
});

test('client serial saves advance the server revision even for queued older snapshots', async () => {
  const originalFetch = globalThis.fetch;
  const client = new CloudClient(), revisions = [];
  client.csrf = 'test-csrf';
  globalThis.fetch = async (url, options) => {
    const input = JSON.parse(options.body);
    revisions.push(input.revision);
    assert.equal(options.headers['X-CSRF-Token'], 'test-csrf');
    assert.equal(options.credentials, 'same-origin');
    return new Response(JSON.stringify({ id: 'project', revision: input.revision + 1 }));
  };
  try {
    const snapshot = { cloud: { id: 'project', revision: 1 }, title: 'Test' };
    await client.save(snapshot);
    await client.save(snapshot);
    assert.deepEqual(revisions, [1, 2]);
    assert.equal(client.saving, false);
  } finally { globalThis.fetch = originalFetch; }
});

test('client preserves conflict status and resets its saving flag', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Conflict' }), { status: 409 });
  try {
    const client = new CloudClient();
    await assert.rejects(client.save({ cloud: { id: 'project', revision: 1 } }), e => e.status === 409);
    assert.equal(client.saving, false);
    assert.equal(client.revisions.size, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test('client treats a static host as local-only and handles invalid server responses', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('<html>Not found</html>', { status: 404 });
  try {
    const client = await new CloudClient().init();
    assert.equal(client.available, false);
    assert.equal(client.user, null);
  } finally { globalThis.fetch = originalFetch; }
});
