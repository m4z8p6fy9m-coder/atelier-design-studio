# Kostenlose echte Registrierungsmails über Gmail

Du brauchst keine eigene Domain und keinen Resend-Schlüssel. Atelier kann Bestätigungs- und Passwort-Reset-Codes mit deinem vorhandenen Gmail-Konto verschicken. Das ist für den Einstieg mit wenigen Nutzern gedacht. Gmail begrenzt den Versand und kann automatisierte Anmeldungen blockieren; es ist kein unbegrenzter Transaktionsmail-Dienst. Siehe [Gmails Versandgrenzen](https://support.google.com/mail/answer/22839?hl=de).

## Einmal bei Google erledigen

1. Die [Sicherheitseinstellungen deines Google-Kontos](https://myaccount.google.com/security) öffnen und die Zwei-Faktor-Authentifizierung aktivieren, falls sie noch nicht aktiv ist.
2. [App-Passwörter](https://myaccount.google.com/apppasswords) öffnen und ein eigenes App-Passwort für „Atelier“ erstellen.
3. Den angezeigten 16-stelligen Wert nur lokal in die Konfiguration eintragen. **Nicht dein normales Google-Passwort verwenden und das App-Passwort nicht in den Chat oder auf GitHub kopieren.** Leerzeichen zwischen den angezeigten Vierergruppen sind erlaubt.

Bei manchen Schul-/Firmenkonten, erweiterter Sicherheit oder bestimmten Einstellungen sind App-Passwörter nicht verfügbar. Die Voraussetzungen und Ausnahmen stehen in der [Google-Hilfe](https://support.google.com/mail/answer/185833?hl=de). Das App-Passwort kann jederzeit wieder entzogen werden. Eine Änderung des normalen Google-Passworts widerruft bestehende App-Passwörter.

## Lokal eintragen

Im Projektordner `.env` öffnen. Falls sie fehlt, `.env.example` nach `.env` kopieren und ein `AUTH_SECRET` wie in [ACCOUNTS.md](ACCOUNTS.md) beschrieben erzeugen. Folgende Einstellungen ergänzen:

```dotenv
MAIL_MODE=gmail
GMAIL_USER=deine-adresse@gmail.com
GMAIL_APP_PASSWORD=DEIN_GOOGLE_APP_PASSWORT
```

`AUTH_SECRET` beibehalten. `MAIL_MODE=preview` durch `MAIL_MODE=gmail` ersetzen. Bei Gmail ist kein eigener `MAIL_FROM` erforderlich: Der Absender ist dein angemeldetes Gmail-Konto mit dem Anzeigenamen „Atelier“. Diese Adresse ist für Empfänger sichtbar. Falls gewünscht, ein separates Gmail-Konto für das Projekt verwenden.

## Verbindung prüfen und starten

```sh
npm ci --ignore-scripts
npm run auth:check
npm run mail:verify
npm run cloud
```

`mail:verify` prüft die verschlüsselte Verbindung zu `smtp.gmail.com:465` und die Anmeldung. Es versendet keine Mail und zeigt keine Passwörter an. Bei Erfolg anschließend **http://127.0.0.1:4174/** öffnen und ein Testkonto mit einer Adresse registrieren, deren Postfach du selbst prüfen kannst. Den dort eingegangenen sechsstelligen Code eingeben. Spamordner mitprüfen.

Eine erfolgreiche SMTP-Verbindung garantiert noch keine Postfachzustellung. Der echte Registrierungstest ist deshalb der letzte Schritt. Der Computer bzw. eigene Server muss während des Versands laufen. Manche Hoster blockieren SMTP-Port 465; dann einen anderen erlaubten Host oder den bereits eingebauten Resend-Adapter nutzen.

## Was bleibt kostenlos und was ist getrennt?

Für diese Gmail-Verbindung benötigt Atelier keine eigene Domain und keinen kostenpflichtigen Versandtarif. Es gelten die Nutzungs- und Versandgrenzen deines Google-Kontos. Hosting für eine öffentlich erreichbare App ist getrennt zu organisieren. Für viele öffentliche Nutzer ist später ein eigener Absender mit Versanddienst sinnvoll.

**„Mit Google anmelden“ ist eine andere Funktion:** Sie meldet Nutzer bei Atelier an und benötigt weiterhin die Google-OAuth-Client-Konfiguration. Das App-Passwort hier erlaubt ausschließlich den Mailversand des Servers über das Absenderkonto; es schaltet keinen Google-Login für Nutzer frei. Die App fordert dafür weder Gmail-Lesezugriff noch zusätzliche Login-Scopes an.

Der Gmail-Transport nutzt die Open-Source-Bibliothek Nodemailer, die ausschließlich auf dem Node-Server installiert wird. Sie wird nicht in den Browser-Build eingebunden. TLS-Zertifikate werden geprüft; Zertifikatsprüfung und Verschlüsselung lassen sich in dieser Integration nicht per Konfiguration abschalten. Anbieterseitige SMTP-Fehler werden ohne vertrauliche Details an die Oberfläche weitergegeben.
