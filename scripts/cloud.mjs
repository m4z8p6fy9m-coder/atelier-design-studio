import {createAtelierServer} from '../server/app.js';
import {loadServerConfig} from '../server/config.js';
const config=loadServerConfig();
const app=await createAtelierServer(config.options);
const address=await app.listen(config.port,config.host);
console.log(`Atelier mit Konten und gemeinsamen Projekten: ${address}`);
console.log('Serverdaten bleiben im konfigurierten Datenverzeichnis. Zum Beenden Strg+C.');
console.log(`E-Mail: ${config.options.mail?.mode||'nicht eingerichtet'} · Google: ${config.options.google?'eingerichtet':'nicht eingerichtet'}`);
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>app.close().then(()=>process.exit(0)));