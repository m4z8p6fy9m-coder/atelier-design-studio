import http from 'node:http';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from './store.js';
import {accountRoutes,publicUser} from './accounts.js';
import { normalizeDocument } from '../src/model.js';

const sourceRoot = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const hash = token => createHash('sha256').update(token).digest('hex');
const freshToken = () => randomBytes(32).toString('base64url');
const uuid = /^[a-z0-9-]{1,80}$/i;
const error = (status, message) => Object.assign(Error(message), { status });
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

function cleanDocument(raw, id) {
  let doc;
  try { doc = normalizeDocument(raw); }
  catch { throw error(400, 'Das Projekt enthält ungültige Daten.'); }
  doc.id = id;
  // Preserve stable object identities for collaborators. Other fields are allowlisted by normalizeDocument.
  const seen = new Set();
  const identity = value => {
    if (typeof value !== 'string' || !uuid.test(value) || seen.has(value)) return randomUUID();
    seen.add(value);
    return value;
  };
  doc.pages.forEach((page, i) => {
    const p = raw.pages[i];
    page.id = identity(p.id);
    page.elements.forEach((e, j) => {
      e.id = identity(p.elements[j].id);
      if (p.elements[j].group && uuid.test(p.elements[j].group)) e.group = p.elements[j].group;
    });
    page.comments.forEach((c, j) => { c.id = identity(p.comments?.[j]?.id); });
  });
  doc.updated = Date.now();
  return doc;
}

export async function createAtelierServer({ directory, publicUrl, allowRegistration = true, sessionHours = 24, mail = null, google = null, authSecret, requireEmailVerification = true, now } = {}) {
  if(publicUrl){const u=new URL(publicUrl);if(u.pathname!=='/'||u.search||u.hash||u.username||u.password||!(u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw Error('PUBLIC_URL muss HTTPS verwenden (HTTP nur auf localhost) und darf keinen Pfad enthalten.');}
  const store = await new Store(directory || path.join(sourceRoot, 'data')).open();
  const sessions = new Map();
  const subscribers = new Map();
  const limits = new Map();
  let localPort;
  const secure = publicUrl ? new URL(publicUrl).protocol === 'https:' : false;
  const publicOrigin = publicUrl ? new URL(publicUrl).origin : null;
  function rate(req, action, maximum = 30) {
    const key = `${req.socket.remoteAddress}:${action}`;
    const now = Date.now();
    let entry = limits.get(key);
    if (!entry || now > entry.until) { entry = { count: 0, until: now + 60000 }; limits.set(key, entry); }
    if (++entry.count > maximum) throw error(429, 'Zu viele Versuche. Bitte in einer Minute erneut versuchen.');
    if (limits.size > 10000) for (const [k, v] of limits) if (v.until < now) limits.delete(k);
  }
  function session(req) {
    const token = /(?:^|;\s*)atelier_session=([a-zA-Z0-9_-]+)/.exec(req.headers.cookie || '')?.[1];
    const key = token ? hash(token) : null;
    const result = key ? sessions.get(key) : null;
    if (!result || result.expires < Date.now()) { if (key) sessions.delete(key); return null; }
    return { ...result, key };
  }
  function auth(req, write = false) {
    const s = session(req);
    if (!s || !store.state.users[s.userId]) throw error(401, 'Bitte anmelden.');
    if (write && req.headers['x-csrf-token'] !== s.csrf) throw error(403, 'Ungültiger Sitzungsschutz. Bitte erneut anmelden.');
    return s;
  }
  function member(id, userId, write = false, owner = false) {
    const p = store.state.projects[id];
    if (!p || !p.members[userId]) throw error(404, 'Projekt nicht gefunden oder kein Zugriff.');
    const role = p.members[userId];
    if ((write && role === 'viewer') || (owner && role !== 'owner')) throw error(403, 'Für diese Aktion fehlen dir die Rechte.');
    return p;
  }
  function result(p, userId) {
    return { id: p.id, revision: p.revision, role: p.members[userId], updated: p.updated, doc: p.doc };
  }
  function notify(id, payload) {
    for (const client of subscribers.get(id) || []) {
      if (!store.state.projects[id]?.members[client.userId]) {
        client.res.write('event: revoked\ndata: {"reason":"access"}\n\n'); client.res.end();
      } else client.res.write(`event: changed\ndata: ${JSON.stringify(payload)}\n\n`);
    }
  }
  async function body(req, max = 32 * 1024 * 1024) {
    if (!String(req.headers['content-type']).startsWith('application/json')) throw error(415, 'JSON erforderlich.');
    let length = 0;
    const chunks = [];
    for await (const chunk of req) {
      length += chunk.length;
      if (length > max) throw error(413, 'Die Anfrage ist zu groß.');
      chunks.push(chunk);
    }
    try { const input = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error(); return input; }
    catch { throw error(400, 'Ungültiges JSON.'); }
  }
  function send(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  }
  function startSession(res, userId, previousKey) {
    if(previousKey)sessions.delete(previousKey);
    const owned=[...sessions].filter(([,s])=>s.userId===userId);while(owned.length>=20)sessions.delete(owned.shift()[0]);
    for (const [key, session] of sessions) if (session.expires < Date.now()) sessions.delete(key);
    const token = freshToken(), csrf = freshToken();
    sessions.set(hash(token), { userId, csrf, expires: Date.now() + sessionHours * 3600000 });
    const cookie=`atelier_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionHours * 3600}${secure ? '; Secure' : ''}`;
    const prior=res.getHeader('Set-Cookie'),cookies=prior?(Array.isArray(prior)?prior:[prior]):[];res.setHeader('Set-Cookie',[...cookies,cookie]);
    return csrf;
  }
  function revokeUser(userId){for(const [key,s] of sessions)if(s.userId===userId)sessions.delete(key);for(const list of subscribers.values())for(const client of list)if(client.userId===userId){client.res.write('event: revoked\ndata: {"reason":"session"}\n\n');client.res.end()}}
  const accounts=accountRoutes({store,mail,google,authSecret,requireEmailVerification,allowRegistration,session,sessions,startSession,revokeUser,auth,rate,body,send,secure,now});
  async function api(req, res, url) {
    const route = url.pathname, method = req.method;
    if (route === '/api/health' && method === 'GET') return send(res, 200, { service: 'atelier', version: '0.7.0', registration: allowRegistration, auth: accounts.capabilities });
    if (route === '/api/session' && method === 'GET') {
      const s = session(req);
      return send(res, 200, s ? { user: publicUser(store.state.users[s.userId]), csrf: s.csrf } : { user: null });
    }
    if(await accounts.handle(req,res,url))return;
    if (route === '/api/logout' && method === 'POST') {
      const s = auth(req, true); sessions.delete(s.key);
      for (const list of subscribers.values()) for (const client of list) if (client.sessionKey === s.key) client.res.end();
      res.setHeader('Set-Cookie', `atelier_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? '; Secure' : ''}`);
      return send(res, 200, { ok: true });
    }
    const write = !['GET', 'HEAD'].includes(method);
    const s = auth(req, write);
    if (write) rate(req, 'write', 120);
    if (route === '/api/projects' && method === 'GET') {
      const projects = Object.values(store.state.projects).filter(p => p.members[s.userId]).map(p => ({ id: p.id, revision: p.revision, title: p.doc.title, role: p.members[s.userId], pages: p.doc.pages.length, updated: p.updated }));
      return send(res, 200, { projects });
    }
    if (route === '/api/projects' && method === 'POST') {
      const input = await body(req), id = randomUUID(), clean = cleanDocument(input.doc, id);
      const p = await store.transaction(state => {
        if (Object.values(state.projects).filter(p => p.ownerId === s.userId).length >= 100) throw error(409, 'Maximal 100 Online-Projekte pro Konto.');
        const p = { id, ownerId: s.userId, members: { [s.userId]: 'owner' }, revision: 1, updated: Date.now(), doc: clean };
        state.projects[id] = p; return p;
      });
      return send(res, 201, result(p, s.userId));
    }
    if (route === '/api/invites/redeem' && method === 'POST') {
      const { token } = await body(req, 8192);
      if (typeof token !== 'string' || token.length > 100) throw error(400, 'Ungültiger Einladungslink.');
      const id = await store.transaction(state => {
        const invite = state.invites[hash(token)];
        if (!invite || invite.expires < Date.now()) throw error(404, 'Der Einladungslink ist abgelaufen oder wurde widerrufen.');
        const p = state.projects[invite.projectId];
        if (!p) throw error(404, 'Projekt nicht gefunden.');
        if (!p.members[s.userId] || (p.members[s.userId] === 'viewer' && invite.role === 'editor')) p.members[s.userId] = invite.role;
        return p.id;
      });
      return send(res, 200, { id });
    }
    const match = /^\/api\/projects\/([a-z0-9-]+)(?:\/(events|members|invites))?$/.exec(route);
    if (!match) throw error(404, 'Unbekannte Schnittstelle.');
    const [, id, operation] = match;
    const p = member(id, s.userId);
    if (!operation && method === 'GET') return send(res, 200, result(p, s.userId));
    if (!operation && method === 'PUT') {
      member(id, s.userId, true);
      const input = await body(req), clean = cleanDocument(input.doc, id);
      const updated = await store.transaction(state => {
        const p = state.projects[id];
        if (!p?.members[s.userId] || p.members[s.userId] === 'viewer') throw error(403, 'Bearbeitungsrechte wurden geändert.');
        if (input.revision !== p.revision) throw error(409, 'Eine andere Person hat das Projekt geändert. Lade den neuen Stand oder sichere deine Änderungen als lokale Kopie.');
        p.doc = clean; p.revision++; p.updated = Date.now(); return p;
      });
      notify(id, { id, revision: updated.revision, by: store.state.users[s.userId].name, clientId: String(req.headers['x-atelier-client'] || '').slice(0,80) });
      return send(res, 200, result(updated, s.userId));
    }
    if (operation === 'events' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no', Connection: 'keep-alive' });
      res.write(`event: ready\ndata: ${JSON.stringify({ revision: p.revision })}\n\n`);
      const entry = { res, userId: s.userId, sessionKey: s.key };
      if (!subscribers.has(id)) subscribers.set(id, new Set());
      subscribers.get(id).add(entry);
      const timer = setInterval(() => {
        if (!sessions.has(s.key) || s.expires < Date.now()) { res.write('event: revoked\ndata: {"reason":"session"}\n\n'); res.end(); }
        else res.write(': keepalive\n\n');
      }, 15000);
      res.on('close', () => { clearInterval(timer); subscribers.get(id)?.delete(entry); if (!subscribers.get(id)?.size) subscribers.delete(id); });
      return;
    }
    if (operation === 'members' && method === 'GET') {
      member(id, s.userId, false, true);
      return send(res, 200, { members: Object.entries(p.members).map(([id, role]) => ({ id, role, name: store.state.users[id]?.name || 'Nutzer' })) });
    }
    if (operation === 'members' && method === 'DELETE') {
      member(id, s.userId, false, true);
      const { userId } = await body(req, 8192);
      if (userId === p.ownerId) throw error(400, 'Die Eigentümerrolle kann nicht entfernt werden.');
      await store.transaction(state => { delete state.projects[id].members[userId]; return true; });
      notify(id, { id, revision: p.revision, accessChanged: true });
      return send(res, 200, { ok: true });
    }
    if (operation === 'invites' && method === 'GET') {
      member(id, s.userId, false, true);
      return send(res, 200, { invites: Object.values(store.state.invites).filter(i => i.projectId === id && i.expires > Date.now()).map(({ id, role, expires }) => ({ id, role, expires })) });
    }
    if (operation === 'invites' && method === 'POST') {
      member(id, s.userId, false, true);
      const { role } = await body(req, 8192);
      if (!['viewer', 'editor'].includes(role)) throw error(400, 'Ungültige Freigaberolle.');
      const token = freshToken(), invite = { id: randomUUID(), projectId: id, role, expires: Date.now() + 7 * 86400000 };
      await store.transaction(state => {
        for (const [key, i] of Object.entries(state.invites)) if (i.expires < Date.now()) delete state.invites[key];
        if (Object.values(state.invites).filter(i => i.projectId === id).length >= 20) throw error(409, 'Maximal 20 aktive Einladungen.');
        state.invites[hash(token)] = invite; return true;
      });
      return send(res, 201, { ...invite, token });
    }
    if (operation === 'invites' && method === 'DELETE') {
      member(id, s.userId, false, true);
      const input = await body(req, 8192);
      await store.transaction(state => { for (const [key, invite] of Object.entries(state.invites)) if (invite.projectId === id && invite.id === input.id) delete state.invites[key]; return true; });
      return send(res, 200, { ok: true });
    }
    throw error(405, 'Methode nicht unterstützt.');
  }

  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    try {
      const localHosts = [`127.0.0.1:${localPort}`, `localhost:${localPort}`];
      if (!localHosts.includes(req.headers.host) && req.headers.host !== (publicOrigin ? new URL(publicOrigin).host : null)) throw error(403, 'Unbekannter Host.');
      const origin = req.headers.origin;
      if (origin && origin !== publicOrigin && !localHosts.map(h => `http://${h}`).includes(origin)) throw error(403, 'Anfragen von anderen Websites sind nicht erlaubt.');
      const url = new URL(req.url, publicOrigin || `http://${req.headers.host}`);
      if (url.pathname.startsWith('/api/')) return await api(req, res, url);
      if (!['GET', 'HEAD'].includes(req.method)) throw error(405, 'Methode nicht unterstützt.');
      const pathname = decodeURIComponent(url.pathname);
      const target = path.resolve(sourceRoot, '.' + pathname);
      const relative = path.relative(sourceRoot, target).replaceAll('\\', '/');
      // Serve only explicit public files and front-end modules. Never expose database, tests, server or credentials.
      if (!['', 'index.html', 'style.css', 'icon.svg'].includes(relative) && !/^src\/[a-z0-9-]+\.js$/.test(relative)) throw error(404, 'Datei nicht gefunden.');
      const file = relative ? target : path.join(sourceRoot, 'index.html');
      if (!(await stat(file)).isFile()) throw error(404, 'Datei nicht gefunden.');
      const content = await readFile(file);
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (err) {
      if (res.headersSent) { res.end(); return; }
      const status = err.status || (err.code === 'ENOENT' ? 404 : 500);
      if (status === 500) console.error('Atelier server error:', err.message);
      send(res, status, { error: status === 500 ? 'Interner Serverfehler.' : err.message });
    }
  });
  server.requestTimeout = 30000;
  server.keepAliveTimeout = 10000;
  return {
    server,
    store,
    listen(port = 4174, host = '127.0.0.1') {
      return new Promise(resolve => server.listen(port, host, () => { localPort = server.address().port; resolve(`http://127.0.0.1:${localPort}`); }));
    },
    async close() {
      for (const list of subscribers.values()) for (const client of list) client.res.end();
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
      await store.queue;
    },
  };
}
