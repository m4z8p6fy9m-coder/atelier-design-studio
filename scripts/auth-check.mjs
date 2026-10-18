import {loadServerConfig} from '../server/config.js';
try{
 const {options}=loadServerConfig();
 console.log(`E-Mail-Codes: ${options.mail?.mode||'nicht eingerichtet'}`);
 console.log(`Google-Anmeldung: ${options.google?'eingerichtet':'nicht eingerichtet'}`);
 console.log(`E-Mail-Bestätigung: ${options.requireEmailVerification?'erforderlich':'lokaler Entwicklungsmodus ohne Bestätigung'}`);
 if(options.google)console.log('Google-Callback: '+new URL(options.publicUrl).origin+'/api/auth/google/callback');
 console.log('Dies prüft die lokale Konfiguration. Es sendet keine Mail und prüft keine echten Anbieter-Zugangsdaten.');
 if(!options.mail&&!options.google){console.log('Einrichtung: docs/ACCOUNTS.md');process.exitCode=1;}
}catch(error){console.error('Konfiguration unvollständig: '+error.message);process.exitCode=1;}
