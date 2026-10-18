import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('static preview exposes only public files, never server data or source', async () => {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../scripts/serve.mjs', import.meta.url))], {
    env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  try {
    const origin = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Static server did not start.')), 10000);
      let text = '';
      child.stdout.on('data', chunk => {
        text += chunk.toString();
        const match = /http:\/\/127\.0\.0\.1:\d+/.exec(text);
        if (match) { clearTimeout(timer); resolve(match[0]); }
      });
      child.once('error', e => { clearTimeout(timer); reject(e); });
      child.once('exit', () => { clearTimeout(timer); reject(Error('Static server exited before startup.')); });
    });
    for (const resource of ['/', '/src/app.js', '/tests/browser.html']) assert.equal((await fetch(origin + resource)).status, 200);
    for (const resource of ['/server/app.js', '/data/atelier.json', '/package.json', '/scripts/cloud.mjs']) assert.equal((await fetch(origin + resource)).status, 404);
    assert.equal((await fetch(origin + '/.env')).status, 403);
  } finally {
    if (child.exitCode === null) await new Promise(resolve => { child.once('exit', resolve); child.kill(); });
  }
});
