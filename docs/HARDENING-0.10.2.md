# Atelier 0.10.2 – Prüfbericht

Stand: 18. Oktober 2026. Lokaler, unveröffentlichter Kandidat auf Basis des lokalen 0.10.1-Prüfstands. Kein unabhängiges Audit. Dieser Bericht ersetzt nicht die Einschränkungen aus HARDENING-0.10.1.md.

## A – Recovery-Key und DEK/KEK

Neue Tresore erhalten einen zufälligen 256-Bit-Datenschlüssel (DEK). PBKDF2-SHA256 mit 600.000 Iterationen und zufälligem 16-Byte-Salt liefert den Passwortschlüssel (KEK). Zwei getrennte AES-GCM-Hüllen verpacken den DEK: eine mit dem KEK, eine mit einem zufälligen 256-Bit-Recovery-Key. Jede Hülle hat einen zufälligen 12-Byte-IV und bindet Format, Konto, Tresor-ID und Zweck als Additional Data. Der Recovery-Key besteht aus 52 Base32-Zeichen in 13 Vierergruppen. Er wird nicht an den Anbieter gesendet.

Der Erstellungsdialog verlangt einen ausgelösten Textdownload, eine ausdrückliche Speicherbestätigung und zwei zufällig ausgewählte Gruppen. Die Browser-Download-API kann nicht feststellen, ob ein Benutzer die Datei tatsächlich aufbewahrt hat. Bis zur Bestätigung gibt es keine Provider-Schlüsseldatei. Abbruch erstellt keinen Tresor. Passwörter/Recovery-Key werden in diesem Ablauf vorübergehend im Arbeitsspeicher gehalten; Javascript bietet kein belegbares vollständiges Löschen aller Kopien.

### Bestehende Vaults

Migration ist ausdrücklich im geöffneten Online-Tresor zu wählen. Vor Bestätigung wird ein verschlüsseltes Backup des alten Stands angeboten. Alte Tabs vorher schließen. Der alte Schlüssel wird erst nach Prüfung des bisherigen Passworts erneut abgeleitet, unter dem zufälligen neuen DEK verschlüsselt und als Legacy-Leseschlüssel eingebettet. Vorhandene Datensätze, Projektformat, Rücksicherung und Cloud-Snapshots werden nicht umgeschrieben. Neue Schreibvorgänge verwenden den neuen DEK. Leser versuchen den neuen und bei Authentifizierungsfehler den eingebetteten Legacy-Schlüssel. Alte portable Backups werden nur nach Vergleich ihres Descriptors mit dem eingebetteten alten Descriptor akzeptiert. Der alte Client kann neue Daten nicht lesen.

Schlüsseländerungen werden als neue `key-v2~<parent>.json`-Datei mit ausschließlich eigenen Rechten gespeichert; das ursprüngliche `key.json` bleibt Anker. Vollständiges Auflisten und eindeutiger erreichbarer Zweig sind Voraussetzung. Bei Uploadfehler bleibt lokal der alte Descriptor erhalten. Bei unklarem Uploadausgang kann eine Revision online dennoch existieren; erneutes Laden und manuelle Prüfung können erforderlich sein. Es gibt keine serverseitige CAS-Transaktion zwischen verschiedenen Geräten. Gleichzeitige Revisionen werden abgelehnt, nicht automatisch zusammengeführt. Schlüsselrevisionen werden nicht automatisch gelöscht.

Passwortwechsel und Zurücksetzen mit Recovery-Key ersetzen nur die Passwort-Hülle. Recovery-Hülle, DEK und Datensatz-Chiffretexte bleiben erhalten. Andere erreichbare Tabs werden gesperrt. Ein anderes Gerät kann die neue Revision anhand derselben Tresor-ID/Prüfchiffre akzeptieren; eine migrierte Legacy-Installation prüft nach Entschlüsselung zusätzlich ihren bisherigen Descriptor. Wiederherstellung älterer passender Backups bleibt möglich.

**Verbleibende Grenzen:** Alte Descriptor-Dateien, Backups und bereits kopierte Schlüssel bleiben mit ihren damaligen Passwörtern lesbar. Dieser Passwortwechsel ist keine Schlüsselrotation und kein Widerruf alter Kopien. Der Recovery-Key muss getrennt aufbewahrt werden; wer ihn und passende Daten besitzt, kann entschlüsseln. Verlust von Passwort und Key ist nicht per E-Mail reparierbar. Ohne lokalen und Remote-Descriptor gibt es weiterhin keinen vollständigen Bootstrap-Assistenten aus einer portablen Datei. Anbieter-/Host-Code kann entsperrte Inhalte lesen. Konflikte in der Schlüsselhistorie brauchen derzeit manuelle Diagnose.

### Prüfnachweise A

`tests/vault-recovery.test.js`: falscher Key/Konto, manipulierte Hüllen/Check/ID/Legacy-Hülle, Passwortwechsel ohne Datensatzänderung, Recovery-Reset, Legacy-Datensätze/portable Backups, migrationsbedingte Uploadfehler, verspätete Migration nach Sperre und verzweigte Schlüsselrevisionen. Providerzugriffe sind Doubles; keine echten Passwortänderungen.

`tests/vault-browser.js`: ergänzt den echten Dialogablauf mit fehlendem Download, falscher Teileingabe und bestätigtem Recovery-Key. Ausgeführte Endergebnisse werden nach Abschluss von B unten ergänzt.

## Noch offen außerhalb A/B

Echte Zwei-Konten-Isolation, parallele Geräte-Uploads, Provider-Recovery-Mail und Bereinigung; persistente Upload-Outbox und atomare Remote-Koordination; verlässliche historische Eltern für alte Snapshots; vollständiger Descriptor-Verlust-Assistent; weitere Browser, Offline-Neustart und eigene Schrift; unabhängiges Audit sowie serverseitige Quoten-/Missbrauchsregeln. Keine neue Zusage über zertifizierte Sicherheit oder Datenschutzkonformität.

Zwischenstand A tatsächlich ausgeführt: 158 Node-Tests bestanden, Syntaxprüfung bestanden; echte Browser-Suite 13 bestanden, 0 fehlgeschlagen auf separater Test-Origin (4184), einschließlich Recovery-Download-/Teileingabe-Dialog. Die später ergänzte Close-Bereinigung wird im B-Endlauf erneut geprüft.

## B – Inaktivität und CSP

`vault-idle.js` führt eine konfigurierbare Frist von 1–120 Minuten pro Account/Origin/Browserprofil ein; Standard 15 Minuten, auch bei alten V1-Tresoren ohne Änderung des verschlüsselten Inhalts. Die Einstellung wird lokal gespeichert (kein Passwort, Schlüssel oder Projektinhalt), zusammen mit dem letzten Aktivitätszeitpunkt. BroadcastChannel kündigt Änderungen an, Storage-Ereignisse und Fokus/pageshow/Sichtbarkeit prüfen nach. Echte Pointer-/Tastatur-/Input-/Wheel-Ereignisse zählen; synthetische DOM-Ereignisse nicht. Hintergrund-Sync ist keine Aktivität. Die Sperrung nutzt den vorhandenen begrenzten Save-/Sperrablauf und dessen Tab-Widerruf.

Ein Timer prüft spätestens alle 30 Sekunden aktiver Ausführung, an der Frist entsprechend früher. Tresoraktionen prüfen die Frist ebenfalls. Ein eingefrorener Prozess kann erst beim Fortsetzen reagieren. Eine stark veränderte Uhr oder nicht lesbarer/ungültiger Aktivitätsstand löst Sperrung aus. Kooperative Tabs einer Origin sind keine Sicherheitsgrenze gegen gleichberechtigten schadhaften JavaScript-Code. Ein aktiver anderer Tab darf die gemeinsame Frist verlängern. Andere Geräte/Profile/Origins und alte Clients gehören nicht zu dieser gemeinsamen Aktivität. Der Gastmodus und die Servermodule bleiben unverändert.

Die Meta-CSP steht vor Ressourcen in den HTML-Einstiegen. Ausführbare Inline-App-Skripte waren bereits nicht enthalten; externe lokale Module bleiben erhalten. `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`; kein Inline-/Eval-Skripting zugelassen. Dynamische CSS-Stile erfordern weiterhin `style-src 'unsafe-inline'`. Header-only-Grenzen und getrennte Cloudflare-/Netlify-Beispiele: [CSP-HEADERS.md](CSP-HEADERS.md). Keine reale Hosting-Header-Prüfung ohne Deployment behauptet.

Tests: `vault-idle-csp.test.js` prüft exakte Fristen, tabübergreifende Aktivität/Konfiguration, Account-Trennung, synthetische Ereignisse, verkürzte Fristen, Wiederaufnahme, Uhrsprung, Speicherfehler, Meta-Reihenfolge und Header-Konsistenz. Die echte Browser-Suite prüft native Broadcast-Übertragung/Tab-Sperren und tatsächliche CSP-Verstöße für Inline-Skript, Data-Skript, Inline-Handler, Eval, Object und fremde Basis-URL. Der Timer-Aufruf mit falschem Browser-Kontext wurde im ersten B-Browserlauf als Fehler reproduziert und korrigiert. Ein Testfixture las Export-Blobs zuvor per fetch; diese Testtechnik wurde durch die CSP blockiert. Das Fixture erfasst nun den tatsächlichen erzeugten Blob, ohne die Produktions-CSP zu erweitern.

Bekannte Schlüsselrevisionen müssen in der Provider-Liste enthalten bleiben; sonst wird ein möglicher Rücksprung auf einen älteren Schlüsselstand abgelehnt. Auf einem Gerät ohne vorhandenen lokalen Anker kann ein böswilliger Anbieter dennoch eine alte vollständige Historie präsentieren. Die Revisionen bilden keinen unabhängig beglaubigten Transparenznachweis. Zusätzliche A-Tests prüfen echte ManagedAccount-Erstellung, konkurrierende Ersterstellung, Offline-/Online-Recovery, Übernahme auf einer alten Legacy-Installation, gefälschte Vorgänger und fehlende bekannte Revisionen.

Aktivitätszeit und Account-ID in den lokalen Idle-Einträgen sind für Code derselben Origin lesbare Metadaten. Die Konfiguration betrifft die Aktivitätsmessung pro Account; die anschließende vorhandene Sperrnachricht sperrt vorsichtshalber alle erreichbaren privaten Tabs der Origin. Eine fehlgeschlagene Entwurfsspeicherung wird bei Inaktivität nicht durch die allgemeine Sperrmeldung verdeckt. Auch ein asynchrones ManagedAccount-Ergebnis prüft die Frist bei Wiederaufnahme vor der Übernahme.

## Tatsächlich ausgeführter Endstand

- `npm run check`: bestanden (einschließlich neuem Idle-Modul und Browserfixtures).
- `npm test`: **178 bestanden, 0 fehlgeschlagen**. Ausgangsstand: 151; hinzugekommen sind 14 Recovery-/Migrations-/Passworttests, 12 Idle-/CSP-Tests und ein Start-ohne-Installation-Test.
- `npm run build`: bestanden, offizielles vorhandenes SDK lokal gebündelt, statische Ausgabe neu aufgebaut. Keine neuen Abhängigkeiten oder Paketinstallation.
- Echte Vault-Browser-Suite: **15 bestanden, 0 fehlgeschlagen**, isolierte Origin `http://127.0.0.1:4184/`, synthetische Konten, native IndexedDB/BroadcastChannel/Web Locks und tatsächlicher Editor. Das asynchrone Eintreffen einer Tab-Nachricht wird im Test begrenzt abgewartet; eine zuvor verfrühte unmittelbare Prüfung war als intermittierender Testfehler sichtbar.
- Bestehende Canvas-/SVG-/PNG-/Bilder-/ZIP-/Website-/PPTX-/WebM-Browser-Suite unter derselben CSP: **16 bestanden, 0 fehlgeschlagen**. Die optionale Prüfung mit einer eigenen echten Schrift bleibt ohne bereitgestellte Testschrift unausgeführt.
- Vergleich mit lokalem 0.10.1-Basis-Commit: `model`, `render`, `export`, `publishing`, `templates`, `design`, `image-tools`, Gast-/Private-Storage, Legacy-Kontenoberfläche, Legacy-Cloud-Client und komplette Servermodule unverändert. Das belegt den unveränderten Quellstand dieser Module, nicht jede denkbare Interaktion.
- Keine echten Nutzer-Vaults migriert, Passwörter geändert, Provider-Dateien gelöscht oder Hosting-/GitHub-Veröffentlichung vorgenommen. Alle neuen Schlüsseldatei-Schreibprüfungen verwenden Doubles. Für einen echten Benutzer-Vault zuerst alle alten Tabs schließen, das angebotene verschlüsselte Backup sichern und den separat gespeicherten Recovery-Key bestätigen.

### Wiederholen

`npm run check`, `npm test`, `npm run build`. `npm start` verwendet ausschließlich Node-Bordmittel und bereits mitgelieferte Browserdateien; eine Installation ist für die Vorschau nicht erforderlich. Tests/SDK-Neubündelung benötigen die bereits vorhandenen Entwicklungsabhängigkeiten. Für Browserprüfungen ausschließlich eine separate Test-Origin verwenden: `tests/vault-browser.html` und `tests/browser.html`, jeweils die Prüfungen starten. Tests sind nicht Bestandteil des Produktionsbuilds.

Die offenen Punkte aus dem Abschnitt „Noch offen außerhalb A/B“ bleiben bestehen. Zusätzlich bedürfen reale Migration, Recovery-Key-Entsperrung und Passwort-Hüllenwechsel beim Provider sowie empfangene Cloudflare-/Netlify-Header einer Prüfung in einer getrennten echten Testinstallation. Es wird kein vollständiger Schutz gegen XSS, böswilligen Host, Speicheranalyse, historische Kopien oder Anbieter-Rollback ohne lokalen Anker behauptet.

Folgestand: [0.10.3 – gezielte Ergänzungen und verbleibende Grenzen](HARDENING-0.10.3.md). Dieser Bericht bleibt der historische Prüfstand von 0.10.2.
