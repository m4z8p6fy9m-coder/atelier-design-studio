# Atelier installieren und offline nutzen

Version 0.9 enthält ein Web-App-Manifest, App-Symbole und einen Service Worker. Die Installation setzt einen unterstützten Browser und HTTPS voraus; `localhost` bzw. `127.0.0.1` werden für die Entwicklung ebenfalls unterstützt.

## Installation

1. Atelier im normalen Browser online öffnen und auf **✓ Offline bereit** warten.
2. In der Übersicht **Atelier installieren** wählen. Wenn der Browser einen Installationsdialog anbietet, dort fortfahren.
3. Falls kein Dialog verfügbar ist, das Browsermenü für **App installieren** bzw. **Zum Home-Bildschirm** verwenden. Eingebettete Vorschauen unterstützen diese Funktion möglicherweise nicht.
4. Auf iPhone/iPad: Safari → Teilen → Zum Home-Bildschirm. Eine Installation kann einen eigenen Speicher verwenden; exportiere wichtige Projekte vorher als Atelier-Datei und importiere sie bei Bedarf in der installierten App.

Die installierte App benötigt für den lokalen Editor kein Node.js. Ohne veröffentlichte HTTPS-Version musst du Atelier zuerst über den mitgelieferten lokalen Node-Server öffnen. Das ZIP ist weiterhin ein Quellcode-Paket, kein eigenständiger Windows-Installer.

## Was offline funktioniert

Der lokale Editor, alle 20 eingebauten Vorlagen, die drei Starter-Kits, lokal gespeicherte Projekte und die im Browser verfügbaren Exporte. Neue Bilder können vom Gerät importiert werden. Für Konten, Mailversand, Google-Anmeldung und die Synchronisierung mit dem optionalen Server ist eine Verbindung nötig.

Der Service Worker speichert ausschließlich eine feste Liste öffentlicher Programmdateien. API-Antworten, Sitzungen, Projekt-Serverdaten, Anfragen mit Query-Parametern und fremde Domains werden nicht zwischengespeichert. Projekte bleiben in IndexedDB und werden beim App-Update nicht gelöscht.

## Updates und Backups

Wenn eine neue Version bereitsteht, erscheint **Update laden** in der Übersicht. Atelier versucht vorher, ausstehende Änderungen zu speichern. Danach wird die neue Version aktiviert und die Seite neu geladen. Eigene Arbeiten zusätzlich regelmäßig als Atelier-Datei exportieren.

Browserdaten löschen oder Speicherbereinigung kann sowohl Projekte als auch Offline-Dateien entfernen. Eine App-Installation ist kein Backup. Ein anderer Browser, eine andere Website-Adresse oder ein anderer Port besitzt einen eigenen Projektspeicher.

## Prüfen

Unter `npm start` steht http://127.0.0.1:4173/tests/pwa.html für lokale Diagnosen bereit. Der dortige Reset entfernt nur Atelier-Programm-Caches und den zugehörigen Service Worker, keine Projekte. Die Diagnose wird nicht mit dem statischen Build veröffentlicht.

Automatisiert geprüft: Offline-Antworten aus dem Programmspeicher, Repository-Unterpfade, Ausschluss privater Routen und explizite Update-Aktivierung. In der eingebetteten Vorschau wurden Registrierung, Bereitschaftsstatus und Installationshilfe geprüft. Ein kompletter Offline-Neustart und die native Installation konnten dort nicht bestätigt werden; diese Abläufe sollten zusätzlich im verwendeten normalen Zielbrowser geprüft werden.
