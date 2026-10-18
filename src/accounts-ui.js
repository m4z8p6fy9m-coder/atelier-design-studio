import {esc} from './render.js';
const button=(action,label,extra='')=>`<button data-action="${action}" ${extra}>${label}</button>`;
const $=s=>document.querySelector(s);
export function createAccountUI({cloud,modal,toast,onAuthenticated,onLogout,beforeRedirect}){
  let challenge=null,email='',mode='login',busy=false,timer;
  const notice=()=>'<p id="accountNotice" role="status" aria-live="polite" class="account-notice"></p>';
  function showLogin(next='login'){
    clearInterval(timer);challenge=null;mode=next;
    const register=mode==='register',forgot=mode==='forgot',caps=cloud.auth||{},canRegister=cloud.registration&&(!caps.requireEmailVerification||caps.emailCodes);
    modal(forgot?'Passwort vergessen?':register?'Dein Studio beginnt hier':'Willkommen zurück',`<p class="sub">${forgot?'Wir schicken dir einen einmaligen Code zum Zurücksetzen.':register?'Erstelle dein Konto und bestätige deine E-Mail-Adresse.':'Melde dich an, um auf deine Online-Projekte zuzugreifen.'}</p>${caps.mailMode==='preview'?'<div class="panel-note">Lokaler Testmodus: Mails liegen im Vorschauordner des Servers. Es werden keine echten E-Mails versendet.</div>':''}${!register&&!forgot&&caps.google?button('accountGoogle','Mit Google fortfahren','class="wide google-button"')+'<div class="account-divider">oder mit E-Mail</div>':''}<form id="accountForm"><fieldset>${register?'<label for="accountName">Dein Name</label><input id="accountName" autocomplete="nickname" maxlength="80" required>':''}<label for="accountEmail">E-Mail-Adresse</label><input id="accountEmail" type="email" autocomplete="username" placeholder="du@beispiel.de" maxlength="200" value="${esc(email)}" required>${!forgot?`<label for="accountPassword">Passwort</label><input id="accountPassword" type="password" autocomplete="${register?'new-password':'current-password'}" ${register?'minlength="12"':''} maxlength="256" placeholder="${register?'Mindestens zwölf Zeichen':'Dein Passwort'}" required>${button('accountTogglePassword','Passwort anzeigen','type="button" class="text-button"')}`:''}${notice()}${button(register?'cloudRegister':forgot?'accountSendReset':'cloudLogin',register?'Konto erstellen':forgot?'Code anfordern':'Anmelden','type="submit" class="primary wide"')}</fieldset></form><div class="account-links">${!forgot&&caps.emailCodes?button('accountForgot','Passwort vergessen?'):''}${mode!=='login'?button('accountLogin','Zur Anmeldung'):canRegister?button('accountRegister','Noch kein Konto? Registrieren'):''}</div>${!caps.google||!caps.emailCodes?`<details class="account-setup"><summary>Verfügbare Anmeldemethoden</summary><p class="sub">${!caps.google?'Google-Anmeldung ist auf diesem Server noch nicht eingerichtet. ':''}${!caps.emailCodes?'E-Mail-Codes sind noch nicht eingerichtet. Neue Konten mit E-Mail-Bestätigung benötigen den Maildienst.':''}</p></details>`:''}`);
    $('#accountForm').onsubmit=event=>{event.preventDefault();handle(register?'cloudRegister':forgot?'accountSendReset':'cloudLogin')};
  }
  function showChallenge(data){
    clearInterval(timer);challenge=data;const reset=data.purpose==='reset';
    modal(reset?'Neues Passwort festlegen':'Bestätige deine E-Mail',`<p class="sub">Falls die Anfrage möglich ist, erhält <strong>${esc(email)}</strong> einen sechsstelligen Code. Prüfe auch den Spamordner. Der Code gilt zehn Minuten.</p><form id="accountForm"><fieldset><label for="accountCode">Bestätigungscode</label><input id="accountCode" class="code-input" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required>${reset?'<label for="resetPassword">Neues Passwort</label><input id="resetPassword" type="password" autocomplete="new-password" minlength="12" maxlength="256" placeholder="Mindestens zwölf Zeichen" required>':''}${notice()}${button('accountVerify',reset?'Passwort speichern':'E-Mail bestätigen & anmelden','type="submit" class="primary wide"')}</fieldset></form>${button('accountResend','Code erneut senden','id="resendCode" class="wide"')}${button('accountLogin','Zur Anmeldung','class="wide"')}<p class="sub">Keine E-Mail erhalten? Adresse prüfen oder die Anmeldung bzw. Registrierung erneut beginnen.</p>`);
    $('#accountForm').onsubmit=event=>{event.preventDefault();handle('accountVerify')};
    const tick=()=>{const b=$('#resendCode');if(!b||!$('#modal').open){clearInterval(timer);return}const seconds=Math.max(0,Math.ceil((challenge.resendAt-Date.now())/1000));b.disabled=seconds>0;b.textContent=seconds?`Neuer Code in ${seconds} Sekunden`:'Code erneut senden'};tick();timer=setInterval(tick,1000);
  }
  function showSettings(){
    clearInterval(timer);const u=cloud.user;if(!u)return showLogin();
    modal('Dein Konto',`<div class="cloud-account"><span class="avatar">${esc(u.name[0]?.toUpperCase())}</span><div><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small></div></div><div class="account-status"><span>${u.emailVerified?'✓ E-Mail bestätigt':'E-Mail noch nicht bestätigt'}</span><span>${u.googleLinked?'✓ Google verbunden':'Google nicht verbunden'}</span></div><label for="profileName">Anzeigename</label><input id="profileName" maxlength="80" autocomplete="nickname" value="${esc(u.name)}">${button('accountSaveProfile','Namen speichern','class="wide"')}${cloud.auth?.google&&!u.googleLinked&&u.emailVerified?button('accountLinkGoogle','Google-Konto verbinden','class="wide google-button"'):''}${u.hasPassword?`<details><summary>Passwort ändern</summary><label for="currentPassword">Bisheriges Passwort</label><input id="currentPassword" type="password" autocomplete="current-password" maxlength="256"><label for="newPassword">Neues Passwort</label><input id="newPassword" type="password" autocomplete="new-password" minlength="12" maxlength="256">${button('accountChangePassword','Passwort ändern','class="wide"')}</details>`:cloud.auth?.emailCodes?'<p class="sub">Du meldest dich über Google an. Über „Passwort vergessen“ kannst du zusätzlich ein Passwort per E-Mail-Code festlegen.</p>':''}${notice()}<div class="separator"></div>${button('accountLogoutAll','Auf allen Geräten abmelden','class="wide"')}<p class="sub">Beendet alle aktiven Sitzungen auf diesem Atelier-Server.</p>`);
  }
  async function googleStart(link){
    await beforeRedirect();if(location.hash.startsWith('#invite='))sessionStorage.setItem('atelier-invite-return',location.hash);
    if(link){const data=await cloud.request('auth/google/link',{method:'POST',body:{}}),url=new URL(data.url);if(url.origin!=='https://accounts.google.com')throw Error('Ungültige Google-Weiterleitung.');location.assign(url.href)}else location.assign('./api/auth/google/start');
  }
  async function handle(a){
    const supported=['cloudLogin','cloudRegister','accountLogin','accountRegister','accountForgot','accountSendReset','accountVerify','accountResend','accountGoogle','accountSettings','accountSaveProfile','accountChangePassword','accountLogoutAll','accountLinkGoogle','accountTogglePassword'];
    if(!supported.includes(a))return false;
    if(busy)return true;
    if(a==='accountLogin'){showLogin();return true}if(a==='accountRegister'){showLogin('register');return true}if(a==='accountForgot'){email=$('#accountEmail')?.value||email;showLogin('forgot');return true}if(a==='accountSettings'){showSettings();return true}
    if(a==='accountTogglePassword'){const input=$('#accountPassword');input.type=input.type==='password'?'text':'password';$('[data-action="accountTogglePassword"]').textContent=input.type==='password'?'Passwort anzeigen':'Passwort verbergen';return true}
    busy=true;const fieldset=$('#accountForm fieldset');if(fieldset)fieldset.disabled=true;if($('#accountNotice'))$('#accountNotice').textContent='Bitte warten …';
    try{
      if(a==='cloudLogin'||a==='cloudRegister'){
        email=$('#accountEmail').value.trim();const data=await cloud.authenticate(a==='cloudLogin'?'login':'register',{name:$('#accountName')?.value,email,password:$('#accountPassword').value});
        $('#accountPassword').value='';if(data.verificationRequired)showChallenge(data);else await onAuthenticated();
      }
      if(a==='accountSendReset'){email=$('#accountEmail').value.trim();showChallenge(await cloud.request('auth/forgot',{method:'POST',body:{email}}))}
      if(a==='accountVerify'){
        if(challenge.purpose==='reset'){await cloud.request('auth/reset',{method:'POST',body:{challengeId:challenge.challengeId,code:$('#accountCode').value,password:$('#resetPassword').value}});cloud.stop();cloud.user=null;cloud.csrf=null;showLogin();$('#accountNotice').textContent='Passwort geändert. Melde dich mit dem neuen Passwort an.'}
        else{await cloud.authenticate('auth/verify',{challengeId:challenge.challengeId,code:$('#accountCode').value,purpose:challenge.purpose});clearInterval(timer);await onAuthenticated()}
      }
      if(a==='accountResend'){showChallenge(await cloud.request('auth/resend',{method:'POST',body:{challengeId:challenge.challengeId}}));$('#accountNotice').textContent='Falls die Anfrage möglich ist, wurde ein neuer Code versendet.'}
      if(a==='accountGoogle'||a==='accountLinkGoogle')await googleStart(a==='accountLinkGoogle');
      if(a==='accountSaveProfile'){const data=await cloud.request('account/profile',{method:'POST',body:{name:$('#profileName').value}});cloud.user=data.user;showSettings();$('#accountNotice').textContent='Name gespeichert.'}
      if(a==='accountChangePassword'){await cloud.authenticate('account/password',{currentPassword:$('#currentPassword').value,password:$('#newPassword').value});await onAuthenticated();showSettings();$('#accountNotice').textContent='Passwort geändert. Andere Sitzungen wurden beendet.'}
      if(a==='accountLogoutAll'){await beforeRedirect();await cloud.request('account/logout-all',{method:'POST',body:{}});cloud.stop();cloud.user=null;cloud.csrf=null;cloud.revisions.clear();await onLogout();toast('Alle Sitzungen beendet.')}
    }catch(error){if($('#accountNotice'))$('#accountNotice').textContent=error.message;else toast(error.message)}finally{busy=false;if(fieldset?.isConnected)fieldset.disabled=false}
    return true;
  }
  return {showLogin,showSettings,handle};
}
