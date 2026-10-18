> Managed accounts in 0.10: the default client uses Appwrite and separate encrypted vaults. This document describes the optional legacy Node server (`managedConfig.enabled=false`), whose shared projects are not end-to-end encrypted. See [private vaults](PRIVATE-VAULTS.md).

# Konten, gemeinsame Projekte und eigener Server

Für echte Konten in einer öffentlich gehosteten App: [Hosting, Mailversand und Datenschutz vorbereiten](ACCOUNT-DEPLOYMENT.md). Der aktuelle Server speichert Online-Designs lesbar; eine Verschlüsselung gegenüber dem Hoster ist noch nicht implementiert.

Atelier besitzt zwei Betriebsarten:

| Modus | Start | Speicherung | GitHub Pages |
| --- | --- | --- | --- |
| Lokaler Editor | `npm start` | Browserdatenbank | Ja, über das statische Build |
| Server mit Konten | `npm run cloud` | Browser und Server | Benötigt einen Node-Host; Pages allein reicht nicht |

Einmal `npm ci --ignore-scripts` ausführen. Der Server nutzt die Node-Standardbibliothek und Nodemailer für den optionalen Gmail-Versand. Die Website und die API werden unter **derselben Adresse** ausgeliefert. Eine beliebige externe API-Adresse im Editor ist bewusst nicht vorgesehen.

## Lokal ausprobieren

```sh
npm ci --ignore-scripts
npm run cloud
```

**http://127.0.0.1:4174/** öffnen. Unter Windows alternativ `START-SERVER-WINDOWS.cmd` starten.

1. Zuerst [E-Mail-Codes und/oder Google einrichten](ACCOUNTS.md). Dann „Konto & Online“ öffnen. E-Mail-Registrierung benötigt Anzeigenamen, Adresse, ein Passwort mit mindestens zwölf Zeichen und den per Mail empfangenen Code. Ohne Mailanbieter ist ein expliziter lokaler Vorschau-Modus möglich; Google benötigt eigene OAuth-Zugangsdaten.
2. Ein Design öffnen und „Teilen“ → „Online-Kopie speichern“ auswählen. Bis zu diesem Schritt bleibt das Design lokal.
3. Nachfolgende Änderungen werden lokal und online gesichert. Der Status zeigt, ob der Server den Stand bestätigt hat.
4. Als Eigentümer einen Einladungslink mit **Ansehen** oder **Bearbeiten** erzeugen. Er ist sieben Tage gültig und kann widerrufen werden. Der Empfänger benötigt ein Konto auf demselben Server und nimmt die Einladung ausdrücklich an.
5. Mitglieder lassen sich aus einem Projekt entfernen. Das Widerrufen eines Links verhindert weitere Eintritte; schon beigetretene Mitglieder werden separat entfernt.

Ansehen erlaubt Export und lokale Kopien, aber keine Änderungen am gemeinsamen Original. Bereits geladene oder exportierte Inhalte lassen sich durch einen späteren Rechteentzug nicht vom Gerät eines Empfängers entfernen.

Die Projektübersicht blendet zwischengespeicherte Online-Projekte nach dem Abmelden bzw. bei einem anderen Konto aus. Der Browsercache ist dennoch kein verschlüsselter Tresor: Nutze auf gemeinsam verwendeten Geräten getrennte Browserprofile und entferne Browserdaten bzw. exportierte Dateien, wenn Inhalte dort nicht bleiben sollen. Explizit erstellte lokale Kopien sind unabhängig vom Serverkonto.

## Gemeinsame Änderungen

Offene Editoren erhalten Server-Sent Events. Liegen keine eigenen ungespeicherten Änderungen vor, wird ein neuer Serverstand übernommen. Identische Elemente behalten ihre IDs.

Der Server prüft vor jeder Speicherung die Dokumentversion. Bei gleichzeitig konkurrierenden Änderungen antwortet er mit einem Konflikt, statt einen Stand zu überschreiben. Eigene Arbeit bleibt lokal. Über „Teilen & Sync“ kann der aktuelle Serverstand geladen werden; ausstehende eigene Änderungen werden dabei als zusätzliche lokale Konfliktkopie gesichert. Alternativ eine lokale Kopie abzweigen und weiterarbeiten.

Nach einem Verbindungsabbruch oder erneuter Anmeldung kann „Jetzt synchronisieren“ ausstehende Änderungen erneut senden. Hat sich der Serverstand inzwischen geändert, greift dieselbe Konfliktprüfung.

Dies ist eine **Zusammenarbeit auf Dokumentebene mit Konfliktprüfung**. Es gibt keine CRDT/OT-Zusammenführung einzelner Zeichen, geteilte Live-Cursor oder konfliktfreie gleichzeitige Bearbeitung desselben Textes. Sprechernotizen und Kommentare sind Bestandteil des gemeinsamen Dokuments; Markenprofile und die Upload-Bibliothek bleiben lokal. In das Design eingefügte Bilder werden mit dem Dokument gespeichert.

## Konfiguration

Variablen werden über die Prozessumgebung oder `.env` im Projektverzeichnis gesetzt. `.env.example` dient als Vorlage; `npm run cloud` liest `.env` automatisch. Node.js 20.12 oder neuer verwenden. E-Mail-/Google-Einrichtung und weitere Variablen: [ACCOUNTS.md](ACCOUNTS.md).

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `PORT` | `4174` | HTTP-Port |
| `HOST` | `127.0.0.1` | Bind-Adresse; für Container oder Reverse Proxy ggf. `0.0.0.0` |
| `PUBLIC_URL` | leer | Öffentliche HTTPS-Adresse, etwa `https://design.example.com` |
| `ATELIER_DATA_DIR` | `data/` im Repository | Persistente Serverdaten |
| `ALLOW_REGISTRATION` | `true` | `false` sperrt neue Registrierungen |

Für eine öffentlich erreichbare Installation einen **HTTPS-Reverse-Proxy** vor den Node-Prozess stellen und `PUBLIC_URL` auf die echte HTTPS-Adresse setzen. Damit erhalten Sitzungs-Cookies auch das `Secure`-Attribut. Der Proxy muss den öffentlichen Host weiterreichen und SSE-Streams ohne Pufferung durchleiten. HTTP auf localhost ist nur für lokale Entwicklung gedacht.

Der Server bindet standardmäßig ausschließlich localhost. Das GitHub-Repository enthält keinen automatisch gestarteten öffentlichen Dienst und keine Hosting-Zugangsdaten.

## Docker

Der Dockerfile verwendet einen Benutzer ohne Root-Rechte und ein persistentes Datenvolume:

```sh
docker build -t atelier-studio .
docker run --rm -p 127.0.0.1:4174:4174 -v atelier-data:/app/data atelier-studio
```

Für ein Hosting mit HTTPS die passenden Umgebungsvariablen und ein dauerhaftes Volume konfigurieren. Der Dockerfile ist vorbereitet, wurde in dieser Umgebung jedoch nicht gebaut oder ausgeführt.

## Speicherung, Grenzen und Sicherung

- Serverdaten liegen in `data/atelier.json`: Nutzer mit Passwort-Hashes und optionaler Google-Verbindung, Projekte mit Rollen, gehashte Einladungen sowie Bestätigungsvorgänge und Versandlimits. Passwörter werden mit `scrypt` und individuellen Zufalls-Salts abgeleitet.
- Sitzungen werden nur im Arbeitsspeicher gehalten. Ein Serverneustart meldet Nutzer ab, erhält aber Konten und Projekte.
- Datenbankänderungen werden innerhalb eines Prozesses serialisiert und über eine temporäre Datei atomar ersetzt. Es gibt keine verteilten Sperren. **Nur eine Serverinstanz je Datenverzeichnis betreiben.**
- Für Backups den Server geordnet stoppen und das komplette Datenverzeichnis kopieren. Beim Wiederherstellen dieselbe Datenstruktur verwenden. Browserprojekte zusätzlich als Atelier-Dateien exportieren.
- Pro Eigentümer maximal 100 Online-Projekte; maximal 20 aktive Einladungen je Projekt; API-Nutzlast maximal 32 MiB. Aufwendige Bildprojekte können diese Grenzen früher erreichen.
- Der gesamte Datenbestand liegt im Arbeitsspeicher und wird bei Änderungen als JSON geschrieben. Dies ist eine Basis für kleine Installationen und Erprobung, keine Architektur für einen Dienst in Canva-Größe. Für größere Installationen sind Datenbank, Objektspeicher, Quoten und Betriebsüberwachung weiterzuentwickeln.

## Zugriffsschutz und offene Betriebsaufgaben

Vorhanden sind serverseitige Rollenprüfung, Versionsprüfung, HttpOnly-/SameSite-Cookies, CSRF-Token, Host-/Origin-Prüfung, begrenzte Anfragen pro IP und Sicherheitsheader. Datenbank, Tests, Servercode und Konfigurationsdateien werden nicht als Website-Dateien ausgeliefert.

E-Mail-Verifikation, Passwort-Zurücksetzen, Google-Anmeldung und Kontoeinstellungen sind seit 0.6 enthalten. Noch nicht enthalten: Zwei-Faktor-Authentifizierung, Kontolöschung/-export, Abrechnung, ein Admin-Panel, externe Sicherheitsprüfung, revisionssicheres Auditlog, Malwareprüfung, automatisierte Backups und ein kommerzielles Betriebskonzept. Eine bestätigte Registrierung prüft den Zugriff auf die E-Mail-Adresse; sie stellt keine reale Identität fest. Den aktuellen Stand nicht als vollständig geprüften öffentlichen SaaS-Dienst vermarkten.

`data/`, `.env` und Runtime-Dateien sind in `.gitignore` und `.dockerignore` ausgeschlossen. Bei einem **manuellen Website-Upload auf GitHub** diese Dateien trotzdem ausdrücklich weglassen; `.gitignore` schützt nur Git-Operationen.
