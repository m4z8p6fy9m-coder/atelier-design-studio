import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resendMailer,previewMailer,gmailMailer,webdeMailer} from './mail.js';
import {googleProvider} from './google.js';
const root=fileURLToPath(new URL('../',import.meta.url));
export function serverConfig(env){
  const host=env.HOST||'127.0.0.1',port=Number(env.PORT||4174),publicUrl=env.PUBLIC_URL||undefined;
  if(!Number.isInteger(port)||port<0||port>65535)throw Error('PORT muss eine Zahl von 0 bis 65535 sein.');
  if(publicUrl){const u=new URL(publicUrl);if(u.pathname!=='/'||u.search||u.hash||u.username||u.password||!(u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw Error('PUBLIC_URL benötigt HTTPS (HTTP nur auf localhost) ohne Pfad.');}
  const localOnly=['127.0.0.1','localhost'].includes(host)&&(!publicUrl||['127.0.0.1','localhost'].includes(new URL(publicUrl).hostname));
  const preview=env.MAIL_MODE==='preview',unverified=env.ALLOW_UNVERIFIED_REGISTRATION==='true';
  if(env.MAIL_MODE&&!['preview','resend','gmail','webde'].includes(env.MAIL_MODE))throw Error('MAIL_MODE muss webde, gmail, resend oder preview sein.');
  if((preview||unverified)&&!localOnly)throw Error('Mail-Vorschau und unbestätigte Registrierung sind ausschließlich auf localhost erlaubt.');
  const directory=path.resolve(root,env.ATELIER_DATA_DIR||'data');
  if(!preview&&!['gmail','webde'].includes(env.MAIL_MODE)&&!!env.RESEND_API_KEY!==!!env.MAIL_FROM)throw Error('RESEND_API_KEY und MAIL_FROM müssen zusammen eingerichtet werden.');
  if(!env.MAIL_MODE&&(env.GMAIL_USER||env.GMAIL_APP_PASSWORD))throw Error('Für Gmail-Versand MAIL_MODE=gmail einstellen.');
  if(!env.MAIL_MODE&&(env.WEBDE_USER||env.WEBDE_APP_PASSWORD))throw Error('Für WEB.DE-Versand MAIL_MODE=webde einstellen.');
  const mail=preview?previewMailer(path.resolve(root,env.MAIL_PREVIEW_DIR||path.join(directory,'mail-preview'))):env.MAIL_MODE==='webde'?webdeMailer({user:env.WEBDE_USER,appPassword:env.WEBDE_APP_PASSWORD}):env.MAIL_MODE==='gmail'?gmailMailer({user:env.GMAIL_USER,appPassword:env.GMAIL_APP_PASSWORD}):resendMailer({apiKey:env.RESEND_API_KEY,from:env.MAIL_FROM});
  if(mail&&(!env.AUTH_SECRET||env.AUTH_SECRET.length<32))throw Error('AUTH_SECRET mit mindestens 32 zufälligen Zeichen konfigurieren.');
  const google=googleProvider({clientId:env.GOOGLE_CLIENT_ID,clientSecret:env.GOOGLE_CLIENT_SECRET,publicUrl});
  return {host,port,options:{directory,publicUrl,mail,google,authSecret:env.AUTH_SECRET,requireEmailVerification:!unverified,allowRegistration:env.ALLOW_REGISTRATION!=='false'}};
}
export function loadServerConfig(){
  try{process.loadEnvFile(path.join(root,'.env'))}catch(error){if(error.code!=='ENOENT')throw error}
  return serverConfig(process.env);
}
