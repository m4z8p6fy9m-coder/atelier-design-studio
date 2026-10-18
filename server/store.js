import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';

/** Single-process persistence. Commit to disk before exposing a changed state. */
export class Store {
  constructor(directory) {
    this.directory = path.resolve(directory);
    this.file = path.join(this.directory, 'atelier.json');
    this.state = { schema: 1, users: {}, projects: {}, invites: {}, authChallenges: {}, authDeliveries: {} };
    this.queue = Promise.resolve();
  }

  async open() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    try {
      this.state = JSON.parse(await readFile(this.file, 'utf8'));
      if (this.state.schema !== 1 || !this.state.users || !this.state.projects || !this.state.invites) {
        throw Error('Unsupported server database. Restore a valid backup.');
      }
      this.state.authChallenges??={};this.state.authDeliveries??={};
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    return this;
  }

  transaction(update) {
    const result = this.queue.then(async () => {
      const next = structuredClone(this.state);
      const value = await update(next);
      const temporary = this.file + '.tmp';
      await writeFile(temporary, JSON.stringify(next), { mode: 0o600 });
      await rename(temporary, this.file);
      this.state = next;
      return structuredClone(value);
    });
    this.queue = result.catch(() => {});
    return result;
  }
}
