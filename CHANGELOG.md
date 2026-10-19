# Änderungen

## 0.10.4 — 2026-10-19 (Gastmodus-Demo)

- Öffentliche Demo ausschließlich im Gastmodus: Appwrite deaktiviert, Betreiber-Projekt-/Bucket-IDs entfernt, kein automatischer Wechsel zum Legacy-Kontendienst.
- Konto-/Registrierungsaktionen zeigen einen deutschen Gastmodus-Hinweis; der konfigurierte SDK-Client weist Netzaufrufe bei abgeschaltetem Kontendienst ab. Demo-CSP und Header-Beispiele erlauben nur Verbindungen derselben Origin.
- Private Tresore ausschließlich zum bewussten Selbsthosting mit eigenem Appwrite-Projekt, dokumentiert in SELF-HOSTING-VAULTS.md. Vorhandene lokale/Cloud-Vaults werden nicht gelöscht.
- Enthält den unten dokumentierten Checkpoint-Arbeitsstand mit erneut zustimmungspflichtiger Aufbewahrung (Standard aus), Migration und Tests.
- Versions-/Cache-Abgleich, Source-ZIP mit separater SHA-256-Datei und aktualisierte Download-/Betriebsdokumentation. Prüfergebnisse und ausstehende Schritte: docs/RELEASE-CHECKS-0.10.4.md.
- Kontolöschung und kombinierter Metadatenexport bleiben offen. Kein unabhängiges Sicherheitsreview, keine Aussage zu juristischer Konformität.


## Unveröffentlicht – Stufe 0.10.4, Aufgabe 1 – 2026-10-19

- Vollständiger verschlüsselter V4-Checkpoint mit bisherigem Head und transitiver Hash-Liste. Bestehende Vaults werden additiv ergänzt; Projekte, Schlüsselhüllen und portable Formate bleiben unverändert.
- Aufbewahrung verlangt erneute Zustimmung; vorherige Aktivierung ohne Checkpoint-Protokollversion übernimmt keine Löschfreigabe. Standard bleibt aus.
- Löschungen erst nach Rücklesen/Validieren und Head-Abgleich, nur für abgedeckte alte Dateien; Unterbrechungen sind ohne neuen Snapshot wiederholbar. Aktueller Head, eigener Anker und zehn neueste Dateien bleiben geschützt.
- Neue Tests für Pruning, alte/neue Geräte, wiederholte Checkpoints, Manipulation, Rollback, Abbruch, Migration und CAS-Doubles; Browser-Suite erweitert. [Prüfbericht und offene Risiken](docs/HARDENING-0.10.4.md).
- Bewusst begrenzter Lieferumfang gemäß Aufgabenstellung: Aufgaben 2 (Konto-/Cloud-Löschung und Export) und 3 (Release-Vorbereitung) nur geplant. Paketversion bleibt 0.10.3, neuer Shell-Cache r4. Kein 0.10.4-Release, kein neuer ZIP-/Prüfsummen- oder Rechtsdokument-Stand.


## 0.10.3 — 2026-10-19 (lokaler Kandidat)

- Descriptor-Backup, unveränderliche Remote-Kopie, ausdrücklicher Abgleich und Offline-Wiederherstellung ohne lokalen Descriptor.
- Passwort-/Recovery-Hüllenwechsel mit Epochenbindung und Tests gegen alte Hüllen im aktuellen Descriptor. Historische DEKs bleiben nutzbar.
- Hash-Verkettung neuer Snapshots und lokaler Rollback-Anker; Pruning neuer Ketten vorerst ausgesetzt.
- Transaktionaler Appwrite-CAS-Prototyp und persistente idempotente Upload-Outbox, standardmäßig ausgeschaltet.
- Streng gesperrtes Zwei-Nutzer-Provider-Testskript mit geheimnisfreiem Markdown-Bericht; echter Providerlauf mangels Testumgebung nicht ausgeführt.
- Native Kompression vor AES-GCM und gemessene Speicheranzeige; projektweites Providerlimit unbekannt. Chunking/Deduplizierung nur als Entwurf.
- Externe Format-Spezifikation, feste öffentliche Testvektoren und deterministischer Backup-Import-Fuzz-Test.
- Syntax/Build bestanden, 211 Node-Tests, 17 Vault-Browserprüfungen und 16 bestehende Browserprüfungen bestanden. Keine neuen Abhängigkeiten; lokaler Kandidat, nicht veröffentlicht.
- Einzelheiten und Prüfstand: docs/HARDENING-0.10.3.md.


## 0.10.2 — 2026-10-18 (lokaler Kandidat)

- B: accountbezogene Inaktivitätssperre (Standard 15 Minuten), BroadcastChannel-Abgleich, Meta-CSP und Hosting-Header-Beispiele.
- A: zufälliger DEK, Passwort-/Recovery-Hüllen, bestätigter Base32-Download, Passwortwechsel und additive Legacy-Migration.
- Schlüsselrevisionen bleiben erhalten; alte Passwort-Hüllen werden nicht widerrufen.
- 178 Node-Tests, 15 Vault-Browserprüfungen und 16 bestehende Browserprüfungen bestanden; Syntax und Build bestanden.
- Prüfungen und verbleibende Grenzen: docs/HARDENING-0.10.2.md. Noch unveröffentlicht.

## 0.10.1 — Vault hardening candidate (unreleased)

- Reproduce and fix late unlock, descriptor loss on restore, and redundant dirty writes.
- Origin-scoped tab revocation, guarded queued saves, account/session checks and bounded lock flush.
- Atomic restore with generation checks and a recoverable encrypted local previous version.
- Snapshot parent graph, explicit branch selection, fewer full uploads and opt-in conservative retention.
- Named dialogs, erased closed inputs, focus restoration and associated account-form notices.
- New security/browser/release regression checks; no added dependencies.
- See docs/HARDENING-0.10.1.md for validation and remaining provider/race limits.

## 0.10.0 — Private account vaults

- Optional Appwrite email signup, verification OTP and account-password recovery.
- Separate client-side encrypted vaults for projects, uploads, settings and versions; isolated guest workspace.
- Automatic encrypted online snapshots, conflict detection, portable backups, restore and offline unlock.
- Explicit recovery/privacy limitations and third-party SDK license notices.
- 110 automated tests. See docs/RELEASE-CHECKS-0.10.md for real-provider checks and pending validation.

## 0.9.0 · 18. Oktober 2026

- 20 eigene editierbare Vorlagen, darunter zwölf neue Designs für Social Media, Poster, Business und Lernen.
- Installierbare Web-App mit Manifest, PNG-Symbolen und Installationshilfe.
- Offline-Programmspeicher mit expliziter Update-Aktivierung und Ausschluss privater API-Routen.
- Lokale Offline-Diagnose sowie Tests für Unterpfade, private Routen, Updates und Vorlagen.
- Hinweise zu Browserunterstützung, Projektspeicher und Backups.

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
