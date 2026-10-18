import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createAtelierServer } from '../server/app.js';
import { newDoc, txt } from '../src/model.js';

test('server authentication, access, persistence and collaboration', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'atelier-server-test-'));
  let app = await createAtelierServer({ directory, requireEmailVerification:false });
  let origin = await app.listen(0);
  const password = 'test-only-password-7482';
  async function request(route, { method = 'GET', input, user, headers = {} } = {}) {
    const response = await fetch(origin + '/api/' + route, {
      method,
      headers: { ...(input !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(user ? { Cookie: user.cookie, 'X-CSRF-Token': user.csrf } : {}), ...headers },
      body: input === undefined ? undefined : JSON.stringify(input),
    });
    const data = await response.json();
    return { response, status: response.status, data };
  }
  async function register(name) {
    const r = await request('register', { method: 'POST', input: { name, email: `${name}@example.test`, password } });
    assert.equal(r.status, 200);
    assert.match(r.response.headers.get('set-cookie'), /HttpOnly/);
    assert.match(r.response.headers.get('set-cookie'), /SameSite=Lax/);
    return { ...r.data, cookie: r.response.headers.get('set-cookie').split(';')[0] };
  }
  let owner, editor, outsider, id, invitation, project;
  try {
    await t.test('registration returns safe account data and session cookies', async () => {
      owner = await register('owner'); editor = await register('editor'); outsider = await register('outsider');
      assert.equal(owner.user.passwordHash, undefined);
      assert.equal((await request('session', { user: owner })).data.user.name, 'owner');
      assert.equal((await request('projects')).status, 401);
    });
    await t.test('password validation, duplicate accounts and bad login', async () => {
      assert.equal((await request('register', { method: 'POST', input: { name: 'x', email: 'x@example.test', password: 'short' } })).status, 400);
      assert.equal((await request('register', { method: 'POST', input: { name: 'owner', email: 'owner@example.test', password } })).status, 409);
      assert.equal((await request('login', { method: 'POST', input: { email: 'owner@example.test', password: 'wrong' } })).status, 401);
    });
    await t.test('CSRF, origin and content type are enforced', async () => {
      assert.equal((await request('projects', { method: 'POST', user: owner, input: {}, headers: { 'X-CSRF-Token': 'wrong' } })).status, 403);
      assert.equal((await request('login', { method: 'POST', input: {}, headers: { Origin: 'https://other.example' } })).status, 403);
      assert.equal((await request('login', { method: 'POST', input: {}, headers: { 'Content-Type': 'text/plain' } })).status, 415);
      assert.equal((await request('login', { method: 'POST', input: null })).status, 400);
    });
    await t.test('project creation validates data and preserves element IDs', async () => {
      project = newDoc(); project.pages[0].elements.push(txt('Original', 20, 20, 40));
      const created = await request('projects', { method: 'POST', user: owner, input: { doc: project } });
      assert.equal(created.status, 201); id = created.data.id; project = created.data.doc;
      assert.equal(created.data.role, 'owner');
      assert.equal(project.pages[0].elements[0].text, 'Original');
      const again = (await request(`projects/${id}`, { user: owner })).data;
      assert.equal(again.doc.pages[0].elements[0].id, project.pages[0].elements[0].id);
      assert.equal((await request('projects', { method: 'POST', user: owner, input: { doc: { width: 0 } } })).status, 400);
    });
    await t.test('non-members cannot read or modify projects', async () => {
      assert.equal((await request(`projects/${id}`, { user: outsider })).status, 404);
      assert.equal((await request(`projects/${id}`, { method: 'PUT', user: outsider, input: { revision: 1, doc: project } })).status, 404);
      assert.equal((await request('projects', { user: outsider })).data.projects.length, 0);
    });
    await t.test('invitations grant read-only access without update privileges', async () => {
      const invite = await request(`projects/${id}/invites`, { method: 'POST', user: owner, input: { role: 'viewer' } });
      assert.equal(invite.status, 201); invitation = invite.data;
      assert.equal((await request('invites/redeem', { method: 'POST', user: editor, input: { token: invitation.token } })).status, 200);
      assert.equal((await request(`projects/${id}`, { user: editor })).data.role, 'viewer');
      assert.equal((await request(`projects/${id}`, { method: 'PUT', user: editor, input: { revision: 1, doc: project } })).status, 403);
      assert.equal((await request(`projects/${id}/invites`, { method: 'POST', user: editor, input: { role: 'editor' } })).status, 403);
    });
    await t.test('editor access allows writes and stale revisions return conflicts', async () => {
      const invite = await request(`projects/${id}/invites`, { method: 'POST', user: owner, input: { role: 'editor' } });
      await request('invites/redeem', { method: 'POST', user: editor, input: { token: invite.data.token } });
      await request('invites/redeem', { method: 'POST', user: editor, input: { token: invitation.token } });
      assert.equal((await request(`projects/${id}`, { user: editor })).data.role, 'editor');
      project.title = 'Shared update';
      const updates = await Promise.all([owner, editor].map(user => request(`projects/${id}`, { method: 'PUT', user, input: { revision: 1, doc: project } })));
      assert.deepEqual(updates.map(r => r.status).sort(), [200, 409]);
      assert.equal((await request(`projects/${id}`, { user: owner })).data.revision, 2);
    });
    await t.test('server events deliver project changes to another session', async () => {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 5000);
      try {
        const stream = await fetch(origin + `/api/projects/${id}/events`, { headers: { Cookie: editor.cookie }, signal: controller.signal });
        assert.equal(stream.headers.get('content-type'), 'text/event-stream');
        const reader = stream.body.getReader(), decoder = new TextDecoder();
        let text = decoder.decode((await reader.read()).value);
        assert.match(text, /event: ready/);
        await request(`projects/${id}`, { method: 'PUT', user: owner, input: { revision: 2, doc: project }, headers: { 'X-Atelier-Client': 'owner-browser' } });
        while (!text.includes('event: changed')) text += decoder.decode((await reader.read()).value);
        assert.match(text, /"revision":3/);
        assert.match(text, /owner-browser/);
        await reader.cancel();
      } finally { clearTimeout(timer); controller.abort(); }
    });
    await t.test('owners can revoke links and remove members', async () => {
      await request(`projects/${id}/invites`, { method: 'DELETE', user: owner, input: { id: invitation.id } });
      assert.equal((await request('invites/redeem', { method: 'POST', user: outsider, input: { token: invitation.token } })).status, 404);
      await request(`projects/${id}/members`, { method: 'DELETE', user: owner, input: { userId: editor.user.id } });
      assert.equal((await request(`projects/${id}`, { user: editor })).status, 404);
      assert.equal((await request(`projects/${id}/members`, { method: 'DELETE', user: owner, input: { userId: owner.user.id } })).status, 400);
    });
    await t.test('database and server sources are never served as public files', async () => {
      for (const file of ['/data/atelier.json', '/server/app.js', '/.env', '/package.json']) {
        assert.equal((await fetch(origin + file)).status, 404);
      }
      assert.equal((await fetch(origin + '/')).status, 200);
      assert.equal((await fetch(origin + '/src/cloud.js')).status, 200);
    });
    await t.test('disk stores hashes, never cleartext passwords or invitation tokens', async () => {
      const contents = await readFile(path.join(directory, 'atelier.json'), 'utf8');
      assert.ok(!contents.includes(password)); assert.ok(!contents.includes(invitation.token));
      assert.equal(Object.keys(JSON.parse(contents).projects).length, 1);
    });
    await t.test('restart preserves accounts and projects; sessions require sign-in again', async () => {
      await app.close(); app = await createAtelierServer({ directory, requireEmailVerification:false }); origin = await app.listen(0);
      assert.equal((await request('projects', { user: owner })).status, 401);
      const login = await request('login', { method: 'POST', input: { email: owner.user.email, password } });
      assert.equal(login.status, 200);
      owner = { ...login.data, cookie: login.response.headers.get('set-cookie').split(';')[0] };
      assert.equal((await request(`projects/${id}`, { user: owner })).data.doc.title, 'Shared update');
      assert.equal((await request('logout', { method: 'POST', user: owner, input: {} })).status, 200);
      assert.equal((await request('projects', { user: owner })).status, 401);
    });
  } finally {
    await app.close();
    const relative = path.relative(os.tmpdir(), directory);
    if (!relative.startsWith('atelier-server-test-') || relative.includes(path.sep)) throw Error('Unexpected temporary directory.');
    await rm(directory, { recursive: true, force: true });
  }
});
