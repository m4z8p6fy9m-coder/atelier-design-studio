import {randomBytes,randomInt,randomUUID,createHash,createHmac,scrypt as derive,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive),token=()=>randomBytes(32).toString('base64url');
const digest=value=>createHash('sha256').update(value).digest('hex');
const fault=(status,message)=>Object.assign(Error(message),{status});
const emailOf=value=>typeof value==='string'?value.trim().toLowerCase():'';
const validEmail=email=>email.length<=200&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const publicUser=u=>({id:u.id,name:u.name,email:u.email,emailVerified:u.emailVerified===true,hasPassword:!!u.passwordHash,googleLinked:!!u.googleSub});
async function passwordRecord(password){if(typeof password!=='string'||password.length<12||password.length>256)throw fault(400,'Das Passwort muss 12 bis 256 Zeichen haben.');const salt=randomBytes(16).toString('hex');return {salt,passwordHash:(await scrypt(password,salt,64)).toString('hex')}}
async function matchesPassword(user,password){const key=await scrypt(typeof password==='string'?password:'',user?.salt||'00000000000000000000000000000000',64);return !!user?.passwordHash&&timingSafeEqual(key,Buffer.from(user.passwordHash,'hex'))}

export function accountRoutes({store,mail,google,authSecret,requireEmailVerification=true,allowRegistration,session,sessions,startSession,revokeUser,auth,rate,body,send,secure,now=Date.now}){
  if(mail&&(!authSecret||authSecret.length<32))throw Error('Für E-Mail-Codes AUTH_SECRET mit mindestens 32 Zeichen konfigurieren.');
  const secret=authSecret||randomBytes(32).toString('hex'),flows=new Map(),failures=new Map();
  const codeHash=(id,code)=>createHmac('sha256',secret).update(id+':'+code).digest('hex');
  const capabilities={emailCodes:!!mail,mailMode:mail?.mode||'disabled',google:!!google,requireEmailVerification};
  function finishLogin(req,res,user){return send(res,200,{user:publicUser(user),csrf:startSession(res,user.id,session(req)?.key)})}
  function mailRequired(){if(!mail)throw fault(503,'Der Mailversand ist noch nicht eingerichtet. Bitte den Serverbetreiber kontaktieren.')}
  function challengeResponse(res,c){return send(res,202,{verificationRequired:true,challengeId:c.id,purpose:c.purpose,expiresAt:c.expires,resendAt:c.sentAt+60000,message:'Falls die Anfrage möglich ist, wurde ein Code versendet. Prüfe auch den Spamordner.'})}
  async function issue({email,purpose,pending=null,userId=null,previousId=null}){
    mailRequired();const timestamp=now(),id=previousId||token(),code=String(randomInt(1000000)).padStart(6,'0');
    const challenge=await store.transaction(state=>{
      state.authChallenges??={};state.authDeliveries??={};
      for(const [key,c] of Object.entries(state.authChallenges))if(c.expires<timestamp-3600000)delete state.authChallenges[key];
      for(const [key,d] of Object.entries(state.authDeliveries))if(d.until<timestamp)delete state.authDeliveries[key];
      if(Object.keys(state.authChallenges).length>=10000&&!previousId)throw fault(429,'Zu viele Anfragen. Bitte später erneut versuchen.');
      const prior=state.authChallenges[id];
      if(previousId&&(!prior||prior.used||prior.expires<timestamp))throw fault(400,'Dieser Vorgang ist abgelaufen. Bitte neu beginnen.');
      if(prior&&timestamp<prior.sentAt+60000)throw fault(429,'Bitte mindestens 60 Sekunden vor einem neuen Code warten.');
      const key=digest(email),delivery=state.authDeliveries[key]||{count:0,until:timestamp+3600000};
      if(delivery.count>=5)throw fault(429,'Für diese Adresse wurden zu viele Codes angefordert. Bitte später erneut versuchen.');
      delivery.count++;state.authDeliveries[key]=delivery;
      const c={id,email,purpose,pending,userId,codeHash:codeHash(id,code),expires:timestamp+600000,sentAt:timestamp,attempts:0,used:false};
      state.authChallenges[id]=c;return c;
    });
    if(pending||userId){
      const reset=purpose==='reset';
      try{await mail.send({id:randomUUID(),to:email,subject:reset?'Dein Atelier-Code zum Passwort-Zurücksetzen':'Bestätige deine E-Mail für Atelier',text:`Dein Atelier-Code: ${code}\n\n${reset?'Mit diesem Code kannst du dein Passwort zurücksetzen.':'Mit diesem Code bestätigst du deine E-Mail-Adresse.'}\nDer Code ist 10 Minuten gültig und kann einmal verwendet werden. Nach fünf falschen Eingaben ist er gesperrt.\n\nWenn du das nicht angefordert hast, ignoriere diese Nachricht. Teile den Code mit niemandem.`})}
      catch{await store.transaction(state=>{const c=state.authChallenges[id];if(c?.codeHash===challenge.codeHash){c.used=true;delete c.pending;delete c.codeHash}return true});throw fault(503,'Die E-Mail konnte nicht versendet werden. Bitte später erneut versuchen.')}
    }
    return challenge;
  }
  async function consume(input,purpose,password){
    if(typeof input.challengeId!=='string'||!/^[a-z\d_-]{40,50}$/i.test(input.challengeId)||typeof input.code!=='string'||!/^\d{6}$/.test(input.code))throw fault(400,'Bitte den sechsstelligen Code eingeben.');
    const record=purpose==='reset'?await passwordRecord(password):null;
    const result=await store.transaction(state=>{
      const c=state.authChallenges?.[input.challengeId],timestamp=now();
      if(!c||c.used||c.expires<timestamp||c.attempts>=5||c.purpose!==purpose)return {error:true};
      c.attempts++;
      const expected=codeHash(c.id,input.code);
      if(!timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(c.codeHash,'hex')))return {error:true};
      let user;
      if(purpose==='register'){
        if(!c.pending||Object.values(state.users).some(u=>u.email===c.email))return {error:true};
        user={...c.pending,id:randomUUID(),email:c.email,emailVerified:true,created:timestamp};state.users[user.id]=user;
      }else{
        user=state.users[c.userId];if(!user||user.email!==c.email)return {error:true};
        if(purpose==='reset')Object.assign(user,record,{passwordChanged:timestamp});
        user.emailVerified=true;
      }
      c.used=true;delete c.pending;delete c.codeHash;
      if(purpose==='reset')for(const other of Object.values(state.authChallenges))if(other.userId===user.id||other.email===user.email){other.used=true;delete other.pending;delete other.codeHash}
      return {user};
    });
    if(result.error)throw fault(400,'Der Code ist falsch, abgelaufen oder bereits verwendet. Bitte einen neuen anfordern.');
    return result.user;
  }
  function redirect(res,location){res.writeHead(303,{Location:location,'Cache-Control':'no-store'});res.end()}
  const oauthCookie=(value,maxAge)=>`atelier_oauth=${value}; HttpOnly; SameSite=Lax; Path=/api/auth/google; Max-Age=${maxAge}${secure?'; Secure':''}`;
  function beginGoogle(req,res,link=false){
    if(!google)throw fault(503,'Google-Anmeldung ist noch nicht eingerichtet.');
    rate(req,'oauth',10);const s=link?auth(req,true):null;
    if(link&&!store.state.users[s.userId].emailVerified)throw fault(403,'Bestätige zuerst deine E-Mail-Adresse.');
    for(const [key,f] of flows)if(f.expires<now())flows.delete(key);
    if(flows.size>=10000)throw fault(429,'Bitte später erneut versuchen.');
    const flow=google.begin(),binding=token();flows.set(digest(flow.state),{...flow,binding:digest(binding),expires:now()+600000,userId:s?.userId,sessionKey:s?.key});
    res.setHeader('Set-Cookie',oauthCookie(binding,600));
    if(link)return send(res,200,{url:flow.url});
    return redirect(res,flow.url);
  }
  return {capabilities,async handle(req,res,url){
    const route=url.pathname,method=req.method;
    if(route==='/api/auth/google/start'&&method==='GET'){beginGoogle(req,res);return true}
    if(route==='/api/auth/google/link'&&method==='POST'){beginGoogle(req,res,true);return true}
    if(route==='/api/auth/google/callback'&&method==='GET'){
      rate(req,'oauthCallback',20);
      const state=url.searchParams.get('state')||'',key=digest(state),flow=flows.get(key),binding=/(?:^|;\s*)atelier_oauth=([a-zA-Z0-9_-]+)/.exec(req.headers.cookie||'')?.[1];
      // An invalid browser binding must not consume another browser's legitimate flow.
      if(!flow||flow.expires<now()||!binding||digest(binding)!==flow.binding){redirect(res,'/#auth-error=invalid-state');return true}
      flows.delete(key);res.setHeader('Set-Cookie',oauthCookie('',0));
      if(url.searchParams.has('error')){redirect(res,'/#auth-error=cancelled');return true}
      const code=url.searchParams.get('code');if(!code||code.length>4096){redirect(res,'/#auth-error=failed');return true}
      try{
        if(flow.userId&&session(req)?.key!==flow.sessionKey)throw fault(401,'session-changed');
        const identity=await google.exchange(code,flow);
        const user=await store.transaction(state=>{
          const existing=Object.values(state.users).find(u=>u.googleSub===identity.sub);
          if(flow.userId){if(session(req)?.key!==flow.sessionKey)throw fault(401,'session-changed');const u=state.users[flow.userId];if(!u||!u.emailVerified||u.email!==identity.email||(existing&&existing.id!==u.id)||(u.googleSub&&u.googleSub!==identity.sub))throw fault(409,'link-failed');u.googleSub=identity.sub;return u}
          if(existing)return existing;
          if(Object.values(state.users).some(u=>u.email===identity.email))throw fault(409,'account-exists');
          if(!allowRegistration)throw fault(403,'registration-disabled');
          const u={id:randomUUID(),email:identity.email,name:identity.name||'Atelier-Nutzer',emailVerified:true,googleSub:identity.sub,created:now()};state.users[u.id]=u;return u;
        });
        startSession(res,user.id,session(req)?.key);redirect(res,'/#auth-success=google');
      }catch(e){const known=['account-exists','registration-disabled','link-failed','session-changed'];redirect(res,'/#auth-error='+(known.includes(e.message)?e.message:'failed'))}
      return true;
    }
    if(['/api/register','/api/login','/api/auth/resend','/api/auth/verify','/api/auth/forgot','/api/auth/reset'].includes(route)&&method==='POST'){
      rate(req,'auth',20);const input=await body(req,8192),email=emailOf(input.email);
      if(route==='/api/auth/resend'){
        const c=typeof input.challengeId==='string'?store.state.authChallenges?.[input.challengeId]:null;
        if(!c||c.used||c.expires<now())throw fault(400,'Dieser Vorgang ist abgelaufen. Bitte neu beginnen.');
        challengeResponse(res,await issue({...c,previousId:c.id}));return true;
      }
      if(route==='/api/auth/verify'){
        if(!['register','verify'].includes(input.purpose))throw fault(400,'Ungültiger Bestätigungsvorgang.');
        const user=await consume(input,input.purpose);finishLogin(req,res,user);return true;
      }
      if(route==='/api/auth/reset'){
        const user=await consume(input,'reset',input.password);revokeUser(user.id);
        send(res,200,{ok:true,message:'Passwort geändert. Bitte mit dem neuen Passwort anmelden.'});return true;
      }
      if(!validEmail(email))throw fault(400,'Bitte eine gültige E-Mail-Adresse eingeben.');
      if(route==='/api/auth/forgot'){
        const u=Object.values(store.state.users).find(u=>u.email===email);
        challengeResponse(res,await issue({email,purpose:'reset',userId:u?.id}));return true;
      }
      const password=typeof input.password==='string'?input.password:'';
      if(password.length>256)throw fault(400,'Das Passwort ist zu lang.');
      if(route==='/api/register'){
        if(!allowRegistration)throw fault(403,'Neue Registrierungen sind auf diesem Server deaktiviert.');
        if(requireEmailVerification)mailRequired();
        const name=typeof input.name==='string'?input.name.trim().slice(0,80):'';if(!name)throw fault(400,'Bitte einen Anzeigenamen eingeben.');
        const record=await passwordRecord(password),exists=Object.values(store.state.users).some(u=>u.email===email);
        if(requireEmailVerification){challengeResponse(res,await issue({email,purpose:'register',pending:exists?null:{name,...record}}));return true}
        const user=await store.transaction(state=>{if(Object.values(state.users).some(u=>u.email===email))throw fault(409,'Diese E-Mail-Adresse ist bereits registriert.');const u={id:randomUUID(),email,name,...record,emailVerified:false,created:now()};state.users[u.id]=u;return u});finishLogin(req,res,user);return true;
      }
      const timestamp=now(),prior=failures.get(email);if(prior&&prior.until>timestamp&&prior.count>=10)throw fault(429,'Zu viele Anmeldeversuche. Bitte in 15 Minuten erneut versuchen.');
      const user=Object.values(store.state.users).find(u=>u.email===email);
      if(!await matchesPassword(user,password)){
        for(const [key,f] of failures)if(f.until<timestamp)failures.delete(key);
        if(failures.size<10000||failures.has(email))failures.set(email,{count:prior&&prior.until>timestamp?prior.count+1:1,until:prior&&prior.until>timestamp?prior.until:timestamp+900000});
        throw fault(401,'E-Mail-Adresse oder Passwort stimmt nicht.');
      }
      if(store.state.users[user.id]?.passwordHash!==user.passwordHash)throw fault(401,'Das Passwort wurde inzwischen geändert. Bitte erneut anmelden.');
      failures.delete(email);
      if(requireEmailVerification&&!user.emailVerified){challengeResponse(res,await issue({email,purpose:'verify',userId:user.id}));return true}
      finishLogin(req,res,user);return true;
    }
    if(route==='/api/account/profile'&&method==='POST'){
      const s=auth(req,true);rate(req,'account',20);const input=await body(req,8192),name=typeof input.name==='string'?input.name.trim().slice(0,80):'';if(!name)throw fault(400,'Bitte einen Anzeigenamen eingeben.');const user=await store.transaction(state=>{state.users[s.userId].name=name;return state.users[s.userId]});send(res,200,{user:publicUser(user)});return true;
    }
    if(route==='/api/account/password'&&method==='POST'){
      const s=auth(req,true);rate(req,'password',5);const input=await body(req,8192),original=store.state.users[s.userId],oldHash=original.passwordHash;if(typeof input.currentPassword!=='string'||input.currentPassword.length>256||!await matchesPassword(original,input.currentPassword))throw fault(401,'Das bisherige Passwort stimmt nicht.');
      const record=await passwordRecord(input.password);auth(req,true);
      const user=await store.transaction(state=>{const u=state.users[s.userId];if(u.passwordHash!==oldHash)throw fault(409,'Das Passwort wurde inzwischen geändert. Bitte erneut anmelden.');Object.assign(u,record,{passwordChanged:now()});for(const c of Object.values(state.authChallenges||{}))if(c.email===u.email){c.used=true;delete c.pending;delete c.codeHash}return u});revokeUser(user.id);finishLogin(req,res,user);return true;
    }
    if(route==='/api/account/logout-all'&&method==='POST'){
      const s=auth(req,true);revokeUser(s.userId);res.setHeader('Set-Cookie',`atelier_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure?'; Secure':''}`);send(res,200,{ok:true});return true;
    }
    return false;
  }};
}
