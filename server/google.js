import {randomBytes,createHash,createPublicKey,verify} from 'node:crypto';

const token=()=>randomBytes(32).toString('base64url');
export function googleProvider({clientId,clientSecret,publicUrl,fetcher=fetch}={}){
  if(!clientId&&!clientSecret)return null;
  if(!clientId||!clientSecret||!publicUrl)throw Error('Google benötigt GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET und PUBLIC_URL.');
  const base=new URL(publicUrl);
  if(base.pathname!=='/'||base.search||base.hash||base.username||base.password||!(base.protocol==='https:'||base.protocol==='http:'&&['localhost','127.0.0.1'].includes(base.hostname)))throw Error('PUBLIC_URL muss eine HTTPS-Website-Adresse sein (HTTP nur auf localhost).');
  const redirectUri=base.origin+'/api/auth/google/callback';
  let keys=null,keyUntil=0;
  async function getKeys(force=false){if(!force&&keys&&keyUntil>Date.now())return keys;const r=await fetcher('https://www.googleapis.com/oauth2/v3/certs',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Google-Schlüssel sind nicht erreichbar.');const data=await r.json();if(!Array.isArray(data.keys)||data.keys.length>20)throw Error('Ungültige Google-Schlüssel.');keys=data.keys;keyUntil=Date.now()+300000;return keys}
  return {
    begin(){const state=token(),nonce=token(),verifier=token(),url=new URL('https://accounts.google.com/o/oauth2/v2/auth');url.search=new URLSearchParams({client_id:clientId,redirect_uri:redirectUri,response_type:'code',scope:'openid email profile',state,nonce,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256',prompt:'select_account'}).toString();return {state,nonce,verifier,url:url.href}},
    async exchange(code,flow){
      const r=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,code,grant_type:'authorization_code',redirect_uri:redirectUri,code_verifier:flow.verifier}),signal:AbortSignal.timeout(10000)});
      if(!r.ok)throw Error('Google-Anmeldung fehlgeschlagen.');
      const tokens=await r.json(),jwt=tokens.id_token;
      if(typeof jwt!=='string'||jwt.length>20000)throw Error('Google-ID-Token fehlt.');
      const parts=jwt.split('.');if(parts.length!==3)throw Error('Ungültiges Google-ID-Token.');
      let head,claims;try{head=JSON.parse(Buffer.from(parts[0],'base64url'));claims=JSON.parse(Buffer.from(parts[1],'base64url'))}catch{throw Error('Ungültiges Google-ID-Token.')}
      if(head.alg!=='RS256'||typeof head.kid!=='string')throw Error('Ungültige Google-Signatur.');
      let key=(await getKeys()).find(k=>k.kid===head.kid&&k.kty==='RSA');
      if(!key)key=(await getKeys(true)).find(k=>k.kid===head.kid&&k.kty==='RSA');
      if(!key||!verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),createPublicKey({key,format:'jwk'}),Buffer.from(parts[2],'base64url')))throw Error('Ungültige Google-Signatur.');
      const now=Date.now()/1000,aud=Array.isArray(claims.aud)?claims.aud:[claims.aud];
      if(!['https://accounts.google.com','accounts.google.com'].includes(claims.iss)||!aud.includes(clientId)||(aud.length>1&&claims.azp!==clientId)||(claims.azp&&claims.azp!==clientId)||!Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+60||claims.nonce!==flow.nonce||typeof claims.sub!=='string'||!/^[a-z\d_-]{1,255}$/i.test(claims.sub)||claims.email_verified!==true||typeof claims.email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email)||claims.email.length>200)throw Error('Google-Identität konnte nicht bestätigt werden.');
      return {sub:claims.sub,email:claims.email.toLowerCase(),name:typeof claims.name==='string'?claims.name.slice(0,80):claims.email.split('@')[0]};
    }
  };
}
