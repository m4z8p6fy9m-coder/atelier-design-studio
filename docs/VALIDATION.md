# Prüfstand vom 18. Oktober 2026

- 20 Node-Tests bestanden: Dokumentmodell, Verlauf, Transformationen, Gruppierung, Importvalidierung, CSV, SVG-Escaping, Textumbruch, Bildausschnitt, leere Tabellen, ZIP-Struktur.
- 9 Prüfungen im verbundenen Chromium-Browser bestanden: alle Vorlagen als SVG/Canvas, PNG-Abmessungen und Farben, transparente Pixel, Bildfilter, Ellipsenmaske, gemischte Elementtypen im Export, IndexedDB, Mehrseiten-ZIP, WebM-Erzeugung und Dekodierung.
- Manueller UI-Test: neue Projekte, Vorlagenwahl, Textbearbeitung, Seitenkopie, Diagrammdaten, PNG-Export, Präsentationsnavigation, JSON-Download und Wiederimport eines dreiseitigen Projekts.
- Desktop-Ansicht bei 1440 × 900 geprüft; schmale Ansicht mit aufklappbarem Eigenschaftenbereich geprüft.
- JavaScript-Syntaxprüfung und statisches Build erfolgreich.

## Erweiterung 0.3: optionaler Server

- 37 Node-Testfälle einschließlich Untertests bestanden: die ursprünglichen 20 Modell-/Exporttests, drei Serverclient-Tests, die Serversuite mit zwölf Einzelprüfungen und ein Test des statischen Vorschau-Servers.
- Geprüft wurden Registrierung, Anmeldungen, Cookie-Attribute, CSRF-/Origin-/Content-Type-Prüfung, Zugriff durch fremde Konten, Leserechte, Einladungen, Bearbeitungsrechte, Konflikte bei parallelen Schreibzugriffen, Server-Sent Events, Widerruf, Mitgliederausschluss, Persistenz und Sitzungsende nach Neustart.
- Die persistierte Testdatenbank enthält Passwort-Hashes und keine Klartextpasswörter oder vollständigen Einladungstokens.
- Browser-Smoke-Test: lokales Testkonto erstellt, Design auf dem Server gespeichert, in einem zweiten Tab geöffnet, Projektnamen geändert und die automatische Übernahme im zweiten Editor bestätigt. Einladungslink erstellt und widerrufen; Abmeldung und Ausblenden zugehöriger Projektcaches geprüft.
- Der statische Modus und der Servermodus liefern ausschließlich freigegebene Website-Dateien aus. Serverdaten gehören nicht in ein Deployment-Archiv.

Docker, ein öffentliches HTTPS-Deployment und der GitHub-Actions-Workflow wurden hier nicht ausgeführt. Die Tests ersetzen keine externe Sicherheitsprüfung oder einen Lasttest.

## Erweiterung 0.4: zusätzliche frei nutzbare Werkzeuge

- **49 Node-Testfälle bestanden.** Neue Prüfungen betreffen Zusammenhang und Farbtoleranz der Hintergrundentfernung, Erhalt eingeschlossener Farbflächen, Pinsel-Wiederherstellung, Alpha-Erhalt, ungültige Eingaben, sichere Links, Website-Ausgabe und die internen Beziehungen im PPTX-Paket.
- **12 Browserprüfungen bestanden.** Zusätzlich zur bisherigen Suite: Freistellung bis zum transparenten PNG, mehrseitige HTML-Ausgabe mit Link und wohlgeformte XML-Teile des PowerPoint-Exports.
- Eine echte zweifolige PowerPoint-Datei wurde über die Editor-Oberfläche heruntergeladen und unabhängig mit `python-pptx` geöffnet. Beide Folien enthalten jeweils ein gültiges PNG-Bild; die Bilddaten wurden zusätzlich mit Pillow geprüft. PowerPoint selbst wurde nicht geöffnet; Editierbarkeit einzelner Text-/Formelemente ist bewusst nicht implementiert.
- Der Freistell-Dialog wurde mit einem eigenen Testbild bedient: weißer Rand entfernt, eingeschlossene weiße Fläche erhalten und Ergebnis als transparentes PNG ins Design übernommen.
- Der Canva-Abgleich basiert auf öffentlichen Beschreibungen, Codeinspektion und diesen Funktionsprüfungen. Er bestätigt ausdrücklich **keine vollständige Funktionsgleichheit**.

Die Tests sind im Repository enthalten. Der Workflow wurde vorbereitet, aber noch nicht auf GitHub ausgeführt. Nicht jeder denkbare Browser, Exportumfang oder große Datenbestand wurde geprüft. PDF verwendet den Druckdialog; die Erzeugung einer PDF-Datei über einen Betriebssystemdialog wurde nicht automatisiert getestet.


## Erweiterung 0.5: Schriften, Textbiegung, Verläufe und Vorlagen

- **55 Node-Testfälle bestanden.** Zusätzlich: Format-/Größenprüfung eigener Schriftdateien, sichere Familiennamen, Ablehnung unbekannter Schriftreferenzen, Gradientvalidierung, Kurvengeometrie, Projekt-Roundtrip und Rückgängig mit allen neuen Dokumentfeldern.
- **15 Browserprüfungen bestanden.** Verläufe wurden anhand echter Pixel im Canvas geprüft. Ein gebogener Text wurde als SVG dekodiert und als PNG gerendert. Für die Schriftprüfung wurde lokal eine System-Schriftdatei hochgeladen; die exportierten Pixel wurden mit der Arial-Ersatzdarstellung verglichen. Die Schriftdatei ist nicht im Repository enthalten. Ohne vorherigen Schriftupload führt die Browsersuite 14 Prüfungen aus; die optionale Prüfung der eigenen Schrift wird dann ausgelassen.
- UI geprüft: Schriftupload, automatische Übernahme auf den ausgewählten Text, Farbverlaufsdialoge, Textbiegung, Speichern einer eigenen Vorlage, Archivieren, Wiederherstellen und Anwenden auf einer neuen Seite. Browser neu geladen und Projekt mit eigener Schrift und Effekten erneut geöffnet.
- Syntaxprüfung und statischer Build erfolgreich. Die vier neuen Dokumentmerkmale werden über die vorhandene normalisierte Serverspeicherung unterstützt; die Serversuite wurde erneut ausgeführt. Ein separater Mehrnutzer-UI-Test dieser neuen Werkzeuge wurde nicht durchgeführt.
- Neue Screenshots: `docs/editor-0.5.png`. Beispiel ohne zusätzliche Schriftdateien: `examples/gradient-studio.atelier.json`.

## Erweiterung 0.6: verifizierte Konten und Google

- **78 Node-Testfälle einschließlich Untertests bestanden.** Die zusätzlichen Accountprüfungen betreffen Registrierung ohne vorzeitige Sitzung, einmalige Codes, falsche Codes, fünf Fehlversuche, Versand-Cooldown, Ablauf, Neustart mit gleichem Geheimnis, persistente Versandlimits, generische Reset-Antworten, ungültig gewordene alte Passwörter und Sitzungen, CSRF, Passwortwechsel, Profiländerung, Anbieterausfälle und fehlende Konfiguration.
- Google-Protokolltests verwenden lokal signierte RSA-Testtokens und nachgebildete HTTP-Antworten. Geprüft werden PKCE, State, Nonce, Callback-Adresse, Signatur, Issuer, Audience, Ablauf, bestätigte E-Mail und die Ablehnung ungültiger Tokens. Route-Tests prüfen Browserbindung, Einmaligkeit, Registrierungsstopp und das Verbot automatischer Verknüpfung nur anhand der E-Mail-Adresse.
- Zusätzliche Nebenläufigkeitsprüfungen: Eine Google-Verknüpfung kann nach Widerruf der startenden Sitzung nicht abgeschlossen werden; zwei Passwortänderungen mit dem alten Passwort können nicht beide erfolgreich sein.
- Die Mailadapter-Prüfung bestätigt Resend-Endpunkt, serverseitigen API-Schlüssel, Idempotenz-Header, Empfänger und Nachrichtentext anhand eines simulierten HTTP-Transports. Es wurden keine echten API-Zugangsdaten oder Mailkonten benutzt.
- Browserprüfung auf localhost im ausdrücklich markierten Mail-Vorschaumodus: Konto erstellt, Nachricht im lokalen Vorschauordner erzeugt, Code eingegeben, bestätigten Kontostatus gesehen, auf allen Geräten abgemeldet, Reset-Code angefordert, neues Passwort gesetzt und damit erneut angemeldet. Keine JavaScript-Konsolenfehler während dieser Abläufe. Screenshot: `docs/account-0.6.png`.
- `npm run check`, `npm test`, `npm run build` und `npm run auth:check` mit lokaler Vorschaukonfiguration erfolgreich.

**Noch nicht live geprüft:** Zustellung über ein echtes Resend-Konto, echte Google-Einwilligung und Anmeldung, Domain-/DNS-Konfiguration, öffentlicher HTTPS-Reverse-Proxy und Docker. Diese Schritte benötigen die Betreiber-Konfiguration. Die Google-Implementierung und der Mailadapter sind vorhanden; simulierte Tests belegen keinen erfolgreichen Live-Login oder echte Postfachzustellung. Das System hat kein externes Sicherheitsaudit durchlaufen.

## Erweiterung 0.6.1: Gmail ohne eigene Domain

- **81 Node-Testfälle bestanden**, Syntaxprüfung und statischer Build erfolgreich.
- Gmail-Tests mit injiziertem SMTP-Transport prüfen Host, Port 465, aktiviertes TLS, Zertifikatsprüfung, Mindest-TLS-Version, abgeschaltete Debugausgabe, Normalisierung von App-Passwort-Leerzeichen, festen authentifizierten Absender, Verbindungstest ohne Versand, Ablehnung ungültiger Konfiguration und vertrauliche Fehlermeldungen.
- Gepinnte Nodemailer-Installation aus der npm-Registry erfolgreich; npm meldete bei der Installation keine bekannten Sicherheitslücken. Die Lockdatei ist enthalten. CI und Docker installieren die Abhängigkeit mit `npm ci --ignore-scripts`.
- Eine lokale, von Git und ZIP ausgeschlossene `.env` mit zufälligem `AUTH_SECRET` wurde vorbereitet. Gmail-Adresse und App-Passwort sind noch leer. **Eine echte SMTP-Anmeldung oder Zustellung konnte deshalb noch nicht stattfinden.** `npm run mail:verify` ist für diese abschließende Prüfung vorbereitet.


## Erweiterung 0.6.2: WEB.DE

84 Node-Testfälle und Syntaxprüfung bestanden; statischer Build erfolgreich. Neue Prüfungen bestätigen erzwungenes STARTTLS, Zertifikatsprüfung, festen authentifizierten Absender und getrennte WEB.DE-Zugangsdaten ohne Wiederverwendung eines Google-App-Passworts. Die lokale Konfiguration wurde auf WEB.DE umgestellt, die vorhandene WEB.DE-Adresse übernommen und das neue Passwortfeld leer gelassen. Echte SMTP-Anmeldung und Zustellung stehen bis zur Eingabe des WEB.DE-App-Passworts aus.


## Erweiterung 0.7: schnellerer Editor

- 94 Node-Testfälle bestanden. Die zehn zusätzlichen Prüfungen betreffen Seiten- und Objektausrichtung, Zoomtoleranz, unsichtbare Elemente, Achsensperre, gedrehte Außenbegrenzungen, Bildaustausch, gesperrte Elemente, Hintergrundeinordnung, Verlauf/Import und Suchbegriffe einschließlich Akzenten und ß.
- 17 Browserprüfungen bestanden (einschließlich der optionalen eigenen Schrift). Neu: tatsächlicher PNG-Import mit Verkleinerung auf 2400 Pixel, Ablehnung einer defekten PNG-Datei und ein ausgetauschtes Bild im echten Rasterexport. Ohne vorhandene eigene Schrift läuft die Suite mit 16 Prüfungen.
- UI geprüft: Suche per Lupe und Strg+K aus einem Eingabefeld, Text per Enter hinzufügen, Werkzeug mit Pfeiltaste auswählen und öffnen, Bild hochladen, anderes Bild auswählen und unveränderte X/Y/Breite/Höhe bestätigen, Bild über die ganze Seite anordnen und beide Bildaktionen rückgängig machen. Keine Konsolenfehler. Das Zeigerziehen für Snapping wurde in dieser Browserumgebung nicht automatisiert bedient; die Geometrie ist durch die Node-Tests geprüft.
- Syntaxprüfung und statischer Build erfolgreich. Screenshot: `docs/commands-0.7.png`.
- Der Mailversand wurde in dieser Erweiterung nicht erneut eingerichtet. Vorhandene echte Anbieterzugangsdaten und ein erfolgreicher Live-Verbindungstest bleiben Voraussetzung für echte Code-Mails. Es wurden keine Code-Mails simuliert als echte Zustellung ausgegeben.
