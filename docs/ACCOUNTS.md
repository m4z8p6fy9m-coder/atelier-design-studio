# Konten, automatische E-Mail-Codes und Google-Anmeldung

Version 0.6 ergänzt die bestehende Serveranmeldung um bestätigte E-Mail-Adressen, Passwort-Wiederherstellung und Google OpenID Connect. Der Editor funktioniert weiterhin lokal ohne Konto. Kontofunktionen benötigen den Node-Server; GitHub Pages allein führt sie nicht aus.

## Was bereits implementiert ist

- Registrierung mit Anzeigename und Passwort, anschließend sechsstelliger Bestätigungscode per E-Mail. Ein Konto und eine Sitzung entstehen erst nach erfolgreicher Bestätigung.
- Zehn Minuten Code-Gültigkeit, maximal fünf falsche Eingaben je Code, erneuter Versand frühestens nach 60 Sekunden, maximal fünf Code-Anforderungen je Adresse und Stunde. Die Adressgrenze gilt gemeinsam für Registrierung, Wiederherstellung und erneuten Versand.
- Passwort vergessen: Code anfordern, Code und neues Passwort eingeben, erneut anmelden. Vorherige Sitzungen und offene Codes werden ungültig.
- Google-Anmeldung über einen serverseitigen Authorization-Code-Flow mit PKCE, State, Nonce und Prüfung der signierten ID-Tokens. Angefordert werden ausschließlich `openid email profile`.
- Bestehende Passwortkonten werden **nicht automatisch anhand der E-Mail-Adresse mit Google verknüpft**. Erst mit dem bestehenden Konto anmelden und unter Kontoeinstellungen „Google-Konto verbinden“ wählen. Beide bestätigten E-Mail-Adressen müssen übereinstimmen.
- Kontoeinstellungen mit Anzeigename, Bestätigungsstatus, Google-Verbindung, Passwortänderung und Abmeldung auf allen Geräten. Google-Konten können über die E-Mail-Wiederherstellung zusätzlich ein Passwort festlegen, wenn der Maildienst eingerichtet ist.

## 1. Konfiguration anlegen

`.env.example` im Projektverzeichnis nach `.env` kopieren. Node.js **20.12 oder neuer** verwenden, empfohlen ist eine unterstützte LTS-Version. `npm run cloud` liest die Datei automatisch; bereits gesetzte Prozessvariablen haben Vorrang. Keine echten Zugangsdaten in GitHub, Browsercode oder Chatnachrichten eintragen.

Ein zufälliges `AUTH_SECRET` erzeugen:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Die Ausgabe nur lokal als `AUTH_SECRET` in `.env` eintragen. Der Schlüssel muss mindestens 32 Zeichen lang sein und über Neustarts gleich bleiben. Er schützt die gespeicherten Code-Prüfwerte per HMAC. Eine Rotation macht bisherige Codes ungültig.

## 2. Echte E-Mails aktivieren

**WEB.DE-Postfach:** [WEBDE.md](WEBDE.md) beschreibt die Einrichtung mit einem WEB.DE-App-Passwort. Ein Google-App-Passwort kann nicht dafür verwendet werden.

**Ohne eigene Domain:** Der Gmail-Adapter verwendet dein bestehendes Postfach. Dazu [GMAIL.md](GMAIL.md) verwenden. Alternativ folgt hier die Resend-Einrichtung mit eigener Domain.

Der mitgelieferte Versandadapter verwendet die [Resend-E-Mail-API](https://resend.com/docs/api-reference/emails/send-email). Im eigenen Resend-Konto eine Absenderdomain einrichten und die angezeigten DNS-Einträge bestätigen. Einen passenden API-Schlüssel erstellen und dann lokal konfigurieren:

```dotenv
AUTH_SECRET=DEIN_LOKAL_ERZEUGTER_ZUFALLSSCHLUESSEL
RESEND_API_KEY=DEIN_RESEND_API_SCHLUESSEL
MAIL_FROM="Atelier <login@deine-domain.de>"
PUBLIC_URL=https://studio.deine-domain.de
```

`MAIL_FROM` muss zu deiner eingerichteten Absenderdomain passen. Der Server versendet die Codes automatisch bei einer entsprechenden Nutzeranfrage. Codes und Anbieter-Zugangsdaten erscheinen nicht in API-Antworten oder öffentlichen Website-Dateien. Die Nachrichten werden als Text versendet; Passwörter sind nie Bestandteil einer Mail.

Die API bestätigt die Annahme beim Anbieter, nicht die Zustellung ins Postfach. Spamfilter, Domainkonfiguration, Versandlimits und mögliche Anbieterkosten bleiben vom eigenen Konto abhängig. Es gibt keinen mitgelieferten unbegrenzten kostenlosen Maildienst und keine Hintergrund-Warteschlange mit Zustellgarantie.

## 3. Google-Anmeldung aktivieren

Nach der [offiziellen Google-Anleitung](https://developers.google.com/identity/openid-connect/openid-connect) in einem eigenen Google-Cloud-Projekt einen OAuth-Client für eine **Webanwendung** einrichten. Den Einwilligungsbildschirm, App-Namen, Kontaktangaben und die für deine Veröffentlichung erforderlichen Domain-/App-Angaben pflegen. Bei einer App im Testmodus die vorgesehenen Testnutzer zulassen.

Als autorisierte Weiterleitungsadresse exakt eintragen:

```text
https://studio.deine-domain.de/api/auth/google/callback
```

In `.env` ergänzen:

```dotenv
PUBLIC_URL=https://studio.deine-domain.de
GOOGLE_CLIENT_ID=DEINE_GOOGLE_WEB_CLIENT_ID
GOOGLE_CLIENT_SECRET=DEIN_GOOGLE_CLIENT_SECRET
```

`PUBLIC_URL` ist die Website-Adresse ohne Unterpfad. Die Callback-Adresse muss einschließlich Protokoll, Host und Port mit dem Google-Eintrag übereinstimmen. Für lokale Tests beispielsweise `PUBLIC_URL=http://127.0.0.1:4174` und exakt `http://127.0.0.1:4174/api/auth/google/callback` verwenden; im Browser dann ebenfalls diese Adresse öffnen. `localhost` und `127.0.0.1` nicht mischen.

Nach dem Serverneustart erscheint **Mit Google fortfahren**, sobald die Konfiguration vollständig ist. Bei Google angelegte Nutzer erhalten ein bestätigtes Konto ohne lokales Passwort. Google-Zugriffs-/Refresh-Tokens werden nicht als dauerhafte Nutzer-Zugangsdaten gespeichert. Der Google-Subject-Identifier bestimmt die bestehende Verbindung; eine spätere Änderung der Google-Mailadresse führt nicht automatisch zur Änderung oder Zusammenlegung des Atelier-Kontos.

## 4. Prüfen und starten

```sh
npm ci --ignore-scripts
npm run auth:check
npm run cloud
```

`auth:check` prüft die vorhandenen Konfigurationsfelder und zeigt aktivierte Methoden sowie gegebenenfalls die Callback-Adresse. Es zeigt keine Schlüssel an, sendet keine Nachricht und prüft keine echten Google- oder Mail-Zugangsdaten. Anschließend einen echten Testnutzer über die Website registrieren, den eingegangenen Code verwenden, Passwort-Wiederherstellung ausprobieren und die Google-Anmeldung mit einem zugelassenen Google-Testkonto durchlaufen.

Ein öffentlicher Betrieb benötigt HTTPS, einen dauerhaft laufenden Node-Host und persistenten Speicher. Eine einzelne Serverinstanz je Datenverzeichnis betreiben. Hinter einem Reverse Proxy dessen öffentlichen Host weiterreichen. `PUBLIC_URL` aktiviert sichere Cookies und die Hostprüfung; fremde Origin-Anfragen werden verworfen. Details: [SERVER.md](SERVER.md).

## Lokaler Test ohne Mailanbieter

Nur auf localhost kann explizit der Vorschau-Modus genutzt werden:

```dotenv
AUTH_SECRET=DEIN_LOKAL_ERZEUGTER_ZUFALLSSCHLUESSEL
MAIL_MODE=preview
```

Mails liegen dann als JSON-Dateien in `data/mail-preview/` oder dem mit `MAIL_PREVIEW_DIR` angegebenen Ordner. Der Anmeldedialog kennzeichnet den Testmodus. Dort steht der Code im Nachrichtentext. Der Vorschauordner wird nicht per HTTP ausgeliefert. **Es wird keine echte Mail versendet.** Diese Dateien und das gesamte Datenverzeichnis nicht weitergeben oder hochladen. Der Start verweigert diesen Modus auf einer öffentlichen Bind-Adresse oder mit öffentlicher `PUBLIC_URL`.

Für reine Entwicklung ohne Bestätigung existiert außerdem `ALLOW_UNVERIFIED_REGISTRATION=true`, ebenfalls nur auf localhost. Standardmäßig ist E-Mail-Bestätigung erforderlich. Fehlt der Maildienst, bleiben neue E-Mail-Registrierungen gesperrt; es gibt keinen stillen Wechsel in einen unsicheren Ersatzmodus. Google kann unabhängig vom Maildienst eingerichtet werden.

## Bestehende Konten und Grenzen

Vorhandene Konten und Projekte bleiben erhalten. Konten aus älteren Versionen besitzen noch keinen bestätigten E-Mail-Status und werden bei der nächsten Passwortanmeldung zur Code-Bestätigung aufgefordert. Vor dem Upgrade Mailversand einrichten und Serverdaten sichern. Sitzungen und laufende Google-Anmeldevorgänge werden bei einem Serverneustart beendet; E-Mail-Codes bleiben mit demselben `AUTH_SECRET` bis zu ihrem Ablauf verwendbar.

Passwörter werden mit scrypt und individuellen Salts gespeichert, Codes nur als HMAC-Prüfwerte. Ausstehende Registrierungen enthalten bereits einen Passwort-Hash, aber noch kein aktives Nutzerkonto. Abgelaufene Vorgänge werden bei folgenden Code-Anforderungen bereinigt. Reset-Anfragen und Registrierungsanfragen für bereits belegte Adressen verwenden generische Antworten. Bei einer bestehenden Adresse bitte anmelden oder das Passwort zurücksetzen; die Registrierung legt kein zweites Konto an. Dieser Ansatz ist kein Nachweis vollständiger Resistenz gegen zeitbasierte Kontenermittlung.

Anmeldeversuche werden pro IP und Adresse begrenzt. Nach zehn falschen Passwortversuchen gilt für die Adresse eine 15-minütige Sperre. Maximal 20 Sitzungen pro Konto; bei Erreichen der Grenze wird die älteste entfernt. Rate-Limits pro IP sind konservativ und gelten hinter einem Proxy für dessen direkte Verbindungsadresse; für einen größeren Dienst braucht es eine bewusst konfigurierte, vertrauenswürdige Proxy-/Limit-Infrastruktur.

Nicht enthalten sind Passkeys, zusätzliche Zwei-Faktor-Authentifizierung, E-Mail-Änderung, Google-Entkopplung, Self-Service-Kontolöschung, ein Adminportal oder ein externes Sicherheitsaudit. Der JSON-Store und die Sitzungen im Arbeitsspeicher sind für eine kleine einzelne Installation vorgesehen. Tests und eine sorgfältige Implementierung ersetzen keinen unabhängigen Produktions-Sicherheitscheck. [Prüfstand](VALIDATION.md).
