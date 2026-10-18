import {loadServerConfig} from '../server/config.js';
try{
 const {options}=loadServerConfig();
 if(!['gmail','webde'].includes(options.mail?.mode))throw Error('Diese Verbindungsprüfung benötigt MAIL_MODE=gmail oder webde.');
 await options.mail.verify();
 console.log('SMTP: verschlüsselte Verbindung und Anmeldung erfolgreich. Es wurde keine E-Mail versendet.');
 console.log('Als Nächstes im Editor ein eigenes Testkonto registrieren und die eingegangene Mail prüfen.');
}catch(error){console.error('Mail-Prüfung: '+error.message);process.exitCode=1;}
