import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import nodemailer from 'nodemailer';

/** WEB.DE credentials belong to WEB.DE, independently of any Google account. */
export function webdeMailer({user,appPassword,createTransport=nodemailer.createTransport}={}){
  const address=typeof user==='string'?user.trim().toLowerCase():'',password=typeof appPassword==='string'?appPassword.trim():'';
  if(!/^[^\s@<>]+@web\.de$/i.test(address)||/[\r\n]/.test(address))throw Error('Für MAIL_MODE=webde eine gültige WEBDE_USER-Adresse eintragen.');
  if(!password||password.length>256||/[\r\n]/.test(password))throw Error('WEBDE_APP_PASSWORD benötigt ein eigenes WEB.DE-App-Passwort. Ein Google-App-Passwort funktioniert hier nicht.');
  const transport=createTransport({host:'smtp.web.de',port:587,secure:false,requireTLS:true,auth:{user:address,pass:password},tls:{minVersion:'TLSv1.2',rejectUnauthorized:true},dnsTimeout:5000,connectionTimeout:8000,greetingTimeout:8000,socketTimeout:12000,disableFileAccess:true,disableUrlAccess:true,logger:false,debug:false});
  return {mode:'webde',async verify(){try{await transport.verify()}catch{throw Error('WEB.DE-Verbindung fehlgeschlagen. WEB.DE-App-Passwort, Freigabe für externe Mailprogramme und Port 587 prüfen.')}},async send(message){
    try{const result=await transport.sendMail({from:{name:'Atelier',address},envelope:{from:address,to:[message.to]},to:message.to,subject:message.subject,text:message.text,disableFileAccess:true,disableUrlAccess:true});if(!result.accepted?.length||result.rejected?.length)throw Error('rejected')}
    catch{throw Error('WEB.DE konnte die Nachricht nicht annehmen. Bitte App-Passwort, Freigabe und Versandlimit prüfen.')}
  }};
}

/** Gmail SMTP with implicit TLS and an app-specific password. No main account password. */
export function gmailMailer({user,appPassword,createTransport=nodemailer.createTransport}={}){
  const address=typeof user==='string'?user.trim().toLowerCase():'',password=typeof appPassword==='string'?appPassword.replace(/\s/g,''):'';
  if(!/^[a-z\d.!#$%&'*+/=?^_`{|}~-]+@(gmail|googlemail)\.com$/i.test(address))throw Error('Für MAIL_MODE=gmail eine gültige GMAIL_USER-Adresse eintragen.');
  if(!/^[a-z]{16}$/i.test(password))throw Error('GMAIL_APP_PASSWORD muss das 16-stellige Google-App-Passwort sein. Nicht das normale Gmail-Passwort verwenden.');
  const transport=createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:address,pass:password},tls:{minVersion:'TLSv1.2',rejectUnauthorized:true},dnsTimeout:5000,connectionTimeout:8000,greetingTimeout:8000,socketTimeout:12000,disableFileAccess:true,disableUrlAccess:true,logger:false,debug:false});
  return {mode:'gmail',async verify(){try{await transport.verify()}catch{throw Error('Gmail-Verbindung fehlgeschlagen. Adresse, App-Passwort, 2-Faktor-Authentifizierung und Erreichbarkeit von Port 465 prüfen.')}},async send(message){
    try{const result=await transport.sendMail({from:{name:'Atelier',address},envelope:{from:address,to:[message.to]},to:message.to,subject:message.subject,text:message.text,disableFileAccess:true,disableUrlAccess:true});if(!result.accepted?.length||result.rejected?.length)throw Error('rejected')}
    catch{throw Error('Gmail konnte die Nachricht nicht annehmen. Bitte Verbindung, Versandlimit und App-Passwort prüfen.')}
  }};
}

/** Transactional delivery only; credentials and verification codes never enter client responses. */
export function resendMailer({apiKey,from,fetcher=fetch}={}) {
  if(!apiKey||!from)return null;
  if(/[\r\n]/.test(from))throw Error('MAIL_FROM darf keine Zeilenumbrüche enthalten.');
  return {mode:'resend',async send(message){
    const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':message.id},body:JSON.stringify({from,to:[message.to],subject:message.subject,text:message.text}),signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error('Mailversand wurde vom Anbieter abgelehnt.');
  }};
}

/** Explicit local development mode. Never enabled as a fallback for a failed real mail provider. */
export function previewMailer(directory){
  return {mode:'preview',async send(message){await mkdir(directory,{recursive:true,mode:0o700});await writeFile(path.join(directory,randomUUID()+'.json'),JSON.stringify(message,null,2),{mode:0o600})}};
}
