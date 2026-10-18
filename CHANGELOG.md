# Änderungen

## 0.8.0 · 18. Oktober 2026

- Neu gestaltete Studio-Startseite mit klarer Typografie und zugänglichen Starter-Karten.
- Drei unabhängige Starter-Kits mit jeweils vier editierbaren Seiten: Creator Carousel, Product Story und Study Notes.
- Starter-Kits auch über Strg/Cmd+K erreichbar; neue Projekte behalten individuelle IDs und lokale Sicherung.
- Download-Paket mit Schnellstart, Prüfsumme und Community-Dokumentation.
- Professioneller GitHub-Auftritt mit eigener Marke und ehrlicher Funktionsübersicht.

## 0.7.0 · 18. Oktober 2026

- Durchsuchbare, kontextabhängige Befehle mit Strg/Cmd+K und Tastaturnavigation.
- Magnetische Ausrichtung an Seiten- und Elementkanten/Mittelpunkten, mit Zoomtoleranz, Alt-Pause und Shift-Achsensperre.
- Bildinhalte austauschen und den bestehenden Rahmen sowie Stil erhalten.
- Bild als vollflächiges Hintergrundelement hinter anderen Inhalten anordnen.
- Gemeinsame validierte Bildimport-Pipeline für Uploads und Austausch.


## 0.6.2 · 18. Oktober 2026

- WEB.DE-SMTP über Port 587 mit verpflichtendem STARTTLS und Zertifikatsprüfung.
- Getrennte WEB.DE-Zugangsdaten; keine Übernahme von Google-App-Passwörtern.
- Gemeinsamer SMTP-Verbindungstest und WEB.DE-Anleitung.
- 84 Node-Testfälle bestanden. Echte WEB.DE-Anmeldung steht mangels WEB.DE-App-Passwort noch aus.


## 0.6.1 · 18. Oktober 2026

- Gmail-SMTP für echte Code-Mails ohne eigene Domain, mit Google-App-Passwort und fest erzwungenem TLS.
- Verbindungstest ohne Mailversand: `npm run mail:verify`.
- Nodemailer als gepinnte Server-Abhängigkeit, Lockdatei und aktualisierte CI-/Docker-Installation.
- Lokale Einrichtungsanleitung für Gmail. Echte Zugangsdaten fehlen noch; keine Live-Zustellung behauptet.
- 81 Node-Testfälle, Syntaxprüfung und statischer Build erfolgreich.


## 0.6.0 · 18. Oktober 2026

- Bestätigte E-Mail-Registrierung mit automatischen Einmalcodes über den Resend-Adapter.
- Ablauf, Versuchslimits, erneuter Versand und persistente Versandbegrenzung; keine aktiven E-Mail-Konten vor Bestätigung.
- Passwort-Wiederherstellung und Passwortwechsel mit Sitzungswiderruf.
- Google OpenID Connect mit PKCE, State, Nonce, signierter ID-Token-Prüfung und explizitem Account-Linking.
- Kontoeinstellungen und Abmeldung auf allen Geräten.
- Lokale `.env`-Konfiguration, `npm run auth:check` und abgesicherter lokaler Mail-Vorschaumodus.
- Bestehende Konten müssen ihre E-Mail beim nächsten Passwortlogin bestätigen.
- 78 Node-Testfälle bestanden; Registrierung, Bestätigung und Passwort-Rücksetzung im Browser mit lokalen Testmails durchlaufen. Echte Google-/Resend-Zugangsdaten noch nicht eingerichtet oder live geprüft.


## 0.5.0 · 18. Oktober 2026

- Eigene TTF-/OTF-/WOFF-/WOFF2-Schriften mit Projekt-Einbettung und Exportunterstützung.
- Gebogener Text mit einstellbarer Biegung und Ausrichtung.
- Lineare und radiale Zwei-Farben-Verläufe für Seiten und geeignete Elemente.
- Eigene Seitenvorlagen mit lokaler Bibliothek, Archivierung und Wiederherstellung.
- Projektformat 3, weiterhin Import älterer Projekte.
- 55 Node-Testfälle und 15 Browserprüfungen bestanden (einschließlich hochgeladener Testschrift).


## 0.4.0 · 18. Oktober 2026

- Lokaler Farbbereich-Freisteller, Radier- und Wiederherstellungspinsel, Pixel-Invertierung und Bearbeitungsverlauf ohne externe API.
- Elementlinks mit erlaubten Protokollen; im Editor nicht anklickbar, in SVG-/HTML-Ausgaben aktiv.
- Eigenständiger HTML-Export mit mehrseitiger Navigation und eingebetteten Designseiten.
- PowerPoint-Ausgabe mit einer gerenderten PNG-Bildfolie je Seite; keine separate Text-/Formbearbeitung in PowerPoint.
- Detaillierter Abgleich mit den öffentlichen Canva-Funktionsbeschreibungen und transparente Dokumentation von Kostenmodell und Lücken.
- 49 Node-Testfälle und 12 Browserprüfungen bestanden. Echte exportierte PPTX zusätzlich mit einer unabhängigen Bibliothek gelesen.

## 0.3.0 · 18. Oktober 2026

- Optionaler Node-Server mit Konten, Sitzungen und persistenter Projektspeicherung.
- Eigentümer-, Bearbeiter- und Leserechte, Einladungslinks, Widerruf und Mitgliederverwaltung.
- Automatische Online-Speicherung und Übernahme fremder Änderungen über Server-Sent Events.
- Dokumentversionen verhindern stilles Überschreiben konkurrierender Änderungen. Lokale Konfliktkopien sichern eigene Arbeit.
- Erneute Synchronisierung ausstehender Änderungen; lokale Kopien bleiben unabhängig vom Server.
- Cloud-Sitzungen, CSRF-/Host-/Origin-Prüfungen und eingeschränkte öffentliche Dateiauslieferung.
- Autorenanzeige für Anmerkungen, sofortige Speicherung von Projektnamen und überarbeitete Dialoge.
- Getrennte Startdateien für statischen Editor und Servermodus, Dockerfile und Server-Anleitung.
- 37 Node-Testfälle bestanden; Anmeldung, Online-Projekt, Live-Übernahme in zweitem Tab, Einladungswiderruf und Abmeldung im Browser geprüft.

## 0.2.0

- Modulare Editor-Version mit Projektübersicht, IndexedDB, Gruppen und Ebenen.
- Bildbearbeitung, Zeichnen, Diagramme, Tabellen und Markenprofil.
- Präsentationen, Übergänge, Sprechernotizen, lokale Versionen und erweiterte Exporte.
- Vorbereiteter GitHub-Pages-Workflow, MIT-Lizenz und Beispiele.
