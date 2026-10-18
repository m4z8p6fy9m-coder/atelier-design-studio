# Echte Mails über dein WEB.DE-Postfach

Ein Google-Konto kann mit einer bestehenden WEB.DE-Adresse registriert sein. Der Mailversand dieser Adresse erfolgt weiterhin über WEB.DE. Ein bei Google erstelltes App-Passwort ist dafür nicht geeignet.

1. Bei WEB.DE anmelden und unter den Mail-Einstellungen den Zugriff für externe Mailprogramme aktivieren. [Offizielle Anleitung](https://hilfe.web.de/pop-imap/einschalten.html).
2. Im WEB.DE-Konto **Account verwalten → Login & Sicherheit → App-Passwörter (für externe Apps)** ein neues App-Passwort für Atelier anlegen. [Offizielle Anleitung](https://hilfe.web.de/sicherheit/2fa/anwendungsspezifisches-passwort.html).
3. Dieses Passwort ausschließlich lokal in `.env` unter `WEBDE_APP_PASSWORD` eintragen. Kein Google-App-Passwort und kein Passwort im Chat verwenden.

```dotenv
MAIL_MODE=webde
WEBDE_USER=deine-adresse@web.de
WEBDE_APP_PASSWORD=DEIN_WEBDE_APP_PASSWORT
```

`AUTH_SECRET` beibehalten. Frühere Gmail-Felder werden bei ausdrücklich gewähltem `MAIL_MODE=webde` nicht für den Versand verwendet. Insbesondere wird kein Google-Passwort automatisch an WEB.DE übertragen.

```sh
npm ci --ignore-scripts
npm run auth:check
npm run mail:verify
npm run cloud
```

`mail:verify` prüft die Anmeldung und verschlüsselte Verbindung, versendet aber noch keine Mail. Danach im Editor eine Registrierung mit einem selbst zugänglichen Postfach durchführen und den eingehenden Code prüfen.

Der Adapter verwendet `smtp.web.de:587`, verlangt STARTTLS und prüft das TLS-Zertifikat. Absender ist ausschließlich das angemeldete WEB.DE-Postfach. Die Konfiguration folgt den [offiziellen Serverdaten](https://hilfe.web.de/pop-imap/imap/imap-serverdaten.html). Anbieterlimits und Kontofreigaben gelten weiterhin; die Integration stellt keinen unbegrenzten Versanddienst bereit.

Die Google-Anmeldung für Atelier ist davon unabhängig und benötigt weiterhin eigene OAuth-Client-Einstellungen. Ein WEB.DE-Postfach muss dafür nicht durch ein Gmail-Postfach ersetzt werden.
