/** Optional same-origin server integration. Static GitHub Pages stays local-only. */
export class CloudClient {
  constructor() {
    this.available = false;
    this.user = null;
    this.csrf = null;
    this.clientId = crypto.randomUUID();
    this.events = null;
    this.saving = false;
    this.revisions = new Map();
  }

  async request(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (method !== 'GET') {
      if (this.csrf) headers['X-CSRF-Token'] = this.csrf;
      headers['X-Atelier-Client'] = this.clientId;
    }
    const response = await fetch('./api/' + path, { method, headers, credentials: 'same-origin', signal: AbortSignal.timeout(path==='health'?4000:30000), body: body === undefined ? undefined : JSON.stringify(body) });
    let data;
    try { data = await response.json(); }
    catch { throw Error('Die Serverantwort ist ungültig. Bitte die Verbindung prüfen.'); }
    if (!response.ok) throw Object.assign(Error(data.error || 'Serveranfrage fehlgeschlagen.'), { status: response.status });
    return data;
  }

  async init() {
    try {
      const health = await this.request('health');
      this.available = health.service === 'atelier';
      this.registration = health.registration;
      this.auth = health.auth || {};
      if (this.available) Object.assign(this, await this.request('session'));
    } catch { this.available = false; }
    return this;
  }

  async authenticate(mode, fields) {
    const data = await this.request(mode, { method: 'POST', body: fields });
    if(data.user){this.user = data.user;this.csrf = data.csrf;}
    return data;
  }

  async logout() {
    this.stop();
    await this.request('logout', { method: 'POST', body: {} });
    this.stop(); this.user = null; this.csrf = null; this.revisions.clear();
  }

  list() { return this.request('projects'); }
  open(id) { return this.request('projects/' + encodeURIComponent(id)); }
  create(doc) { return this.request('projects', { method: 'POST', body: { doc } }); }
  async save(doc) {
    this.saving = true;
    try {
      const revision=Math.max(doc.cloud.revision,this.revisions.get(doc.cloud.id)||0);
      const result=await this.request('projects/' + encodeURIComponent(doc.cloud.id), { method: 'PUT', body: { doc, revision } });
      this.revisions.set(doc.cloud.id,result.revision);
      return result;
    } finally { this.saving = false; }
  }
  members(id) { return this.request(`projects/${id}/members`); }
  invites(id) { return this.request(`projects/${id}/invites`); }
  invite(id, role) { return this.request(`projects/${id}/invites`, { method: 'POST', body: { role } }); }
  redeem(token) { return this.request('invites/redeem', { method: 'POST', body: { token } }); }
  revoke(id, inviteId) { return this.request(`projects/${id}/invites`, { method: 'DELETE', body: { id: inviteId } }); }
  removeMember(id, userId) { return this.request(`projects/${id}/members`, { method: 'DELETE', body: { userId } }); }

  watch(id, changed, revoked) {
    this.stop();
    this.events = new EventSource('./api/projects/' + encodeURIComponent(id) + '/events');
    this.events.addEventListener('ready', event => changed(JSON.parse(event.data)));
    this.events.addEventListener('changed', event => {
      const message = JSON.parse(event.data);
      if (message.clientId !== this.clientId) changed(message);
    });
    this.events.addEventListener('revoked', event => { this.stop(); revoked(JSON.parse(event.data).reason); });
  }

  stop() { this.events?.close(); this.events = null; }
}

export const cloud = new CloudClient();
