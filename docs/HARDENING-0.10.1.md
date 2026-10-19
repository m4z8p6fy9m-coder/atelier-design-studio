# Atelier 0.10.1 — Vault hardening candidate

Stand: 18. Oktober 2026. **Lokaler, noch nicht veröffentlichter Kandidat** auf Basis von Atelier 0.10.0. Die GitHub-Demo und vorhandenen Release-Downloads wurden in diesem Arbeitsschritt nicht verändert. Projektformat, Editor-/Render-/Exportmodule und die bestehenden Abhängigkeiten bleiben erhalten.

Folgestand: [0.10.2 – Recovery-Key/DEK und Inaktivität/CSP](HARDENING-0.10.2.md). Die folgenden Ergebnisse beschreiben weiterhin ausschließlich den historischen 0.10.1-Stand.

## Ausgangslage und belegte Fehler

Zuerst liefen die vorhandenen Syntaxprüfungen und **110 Node-Tests erfolgreich**. Anschließend wurden drei Regressionsfälle mit dem ursprünglichen Code ausgeführt: Alle drei schlugen fehl.

| Reproduktion | Änderung | Beleg |
| --- | --- | --- |
| Offline-Entsperrung läuft noch, während gesperrt wird | Asynchrone Operationen prüfen Sitzungs-Epoche, Workspace und Schlüsselidentität | `vault-regressions.test.js`, `vault-security.test.js`, Browser-Test zur verspäteten Entsperrung |
| Wiederherstellung ersetzt Metadaten ohne Descriptor und setzt Generation auf null | Eine Transaktion erhält Descriptor, erhöht Generation, prüft den erwarteten lokalen Stand und legt eine verschlüsselte Rücksicherung an | Descriptor-/CAS-/Quota-/Rollback-Tests |
| Unveränderte Datensätze markieren den Tresor erneut als geändert | Inhaltsvergleich, unveränderte Projektzeitstempel ignorieren, Vergleich verschlüsselter Snapshot-Digests | No-op-/Timestamp-/Coalescing-Tests |

Zusätzliche Tests sichern verspätete Upload-Antworten, tatsächliche Account-Identität, falsche Deskriptoren, manipulierte Vorgänger, lokale parallele Änderungen, paginierte Listen und fehlgeschlagene Bereinigung ab. Ein verzögert ausgeführter Editor-Save ist an den ursprünglichen Workspace gebunden und kann nach einer Sperre nicht in den unverschlüsselten Gastbereich fallen.

## Tab-Sperren und Accountwechsel

`vault-tabs.js` verwendet BroadcastChannel und eine persistierte zufällige Sperrmarke in localStorage. Nachrichten enthalten keine Schlüssel, E-Mails oder Designinhalte. Storage-, Fokus-, Sichtbarkeits- und pageshow-Ereignisse prüfen nach, ob ein zuvor angehaltener Kontext eine Sperre verpasst hat. Editor-Aktionen prüfen die Marke ebenfalls.

Eine Sperranforderung macht den Editor sofort unbedienbar, entfernt private Anzeige, Dialogeingaben und Präsentation und verwirft Auswahl, internen Clipboard-Inhalt, Historie und Font-Caches. Der bereits angeforderte lokale Save darf mit seinem gebundenen Workspace fertig werden. Danach werden Schlüsselreferenzen freigegeben. Nach spätestens drei Sekunden aktiver Ausführung beendet ein Zeitlimit das Warten und meldet einen möglichen Verlust letzter ungespeicherter Änderungen. Verschlüsselung/Transaktionen, die noch laufen, können nicht zuverlässig aus einem Browser-Kernel gelöscht werden; ihre veralteten Ergebnisse dürfen keinen neuen Workspace aktivieren.

Das ist eine **kooperative Sperre auf derselben Origin**, kein fernes Löschen von Arbeitsspeicher: Ein eingefrorener Tab verarbeitet die Sperre erst bei Wiederaufnahme. Andere Browserprofile, andere Origins/Ports und andere Geräte werden nicht durch BroadcastChannel gesperrt. Ältere 0.10-Tabs haben dieses Protokoll nicht. Alle alten Tabs vor dem Upgrade schließen; eine blockierte IndexedDB-Aktualisierung wird gemeldet. Native/extern exportierte Dateien, bereits begonnene lesbare Exportvorgänge, geöffnete PDF-Druckfenster und die System-Zwischenablage sind nicht durch diese Vault-Sperre widerrufbar.

Provider-Identität wird vor Online-Schreibzugriffen erneut geprüft. Ein offline geöffneter Tresor kann nicht mit einem anderen angemeldeten Account synchronisiert werden. Fehlender Tab-Speicher sperrt Vault-Aktionen; der Gasteditor bleibt unabhängig nutzbar. Fehler bei Sperrbenachrichtigungen werden angezeigt, statt eine globale Sperre zu behaupten.

## Lokale Speicherung und Wiederherstellung

- IndexedDB-Dateiname bleibt `atelier-private-v1`; Schema-Version 2 ergänzt eine `recoveries`-Tabelle. Vorhandene `records` und `meta` werden erhalten.
- Projektdateien und portable `atelier-portable-vault-1`-Backups behalten ihr Format. Verschlüsselte Datensätze verwenden weiterhin die vorhandene kontextgebundene AES-GCM-Verschlüsselung und denselben KDF.
- Gelesene Datensatzstände werden vor dem Schreiben verglichen. Veraltete lokale Entwürfe überschreiben keine zwischenzeitlich gespeicherten anderen Fassungen. Der Entwurf bleibt im Editor; Navigation/Projektwechsel werden bei Speicherfehlern blockiert. Der aktuelle Entwurf kann trotzdem als Projektdatei exportiert werden. Der vollständige Browsertest reproduzierte vorher den Navigationsverlust und prüft jetzt sowohl das Blockieren als auch den tatsächlichen JSON-Export-Blob.
- Wiederherstellung authentifiziert alle Datensätze und prüft Projekt-/Versions-/Bildstruktur. Ein lokaler Schreibvorgang während Download/Prüfung bricht den Austausch ab.
- Daten, Metadaten und die vorherige lokale Fassung werden atomar geschrieben. Reicht der Speicher für diese Rücksicherung nicht, wird die gesamte Transaktion zurückgerollt.
- Es gibt **eine** verschlüsselte lokale Rücksicherung pro Account. Eine weitere Wiederherstellung ersetzt diese durch die jeweils vorherige Fassung. „Vorherige lokale Fassung“ kann deshalb den letzten Austausch rückgängig machen; sie ist kein unbegrenztes Archiv.
- Portable Backups können bis 128 MiB eingelesen und ausgegeben werden. Größere Tresore müssen projektweise exportiert werden. Cloud-Dateien bleiben auf 20 MiB begrenzt. Browserdaten löschen entfernt auch Rücksicherungen.
- Ein fehlender/abweichender Remote-Descriptor darf vorhandene lokale Schlüssel nicht ersetzen. Bei fehlendem Server-Descriptor und bestehenden Cloud-Daten wird die Neuanlage blockiert. Offline entsperren und zuerst sichern. Ein eigener Wiederherstellungsassistent für den vollständigen Verlust von Server- **und** lokalem Descriptor ist noch nicht implementiert; portable Dateien enthalten den Descriptor, lassen sich in dieser Version aber nur in einem passend entsperrten Tresor wiederherstellen.

## Cloud-Synchronisation und Konflikte

Automatische Änderungen werden 30 Sekunden gesammelt und höchstens alle fünf Minuten hochgeladen. Manuelles „Jetzt sichern“ bleibt sofort verfügbar. Unveränderte Datensätze und reine Save-Zeitstempel erzeugen keinen neuen Snapshot. Auf Netzwerkfehler folgt ein begrenzter zeitlicher Backoff; der lokale Stand bleibt verschlüsselt und als ausstehend markiert.

Web Locks serialisieren Sync/Wiederherstellung innerhalb derselben Origin. Fehlt diese Browserfunktion, bleiben lokale Arbeit und Export verfügbar; Online-Sync und destruktiver Restore werden abgelehnt.

Neue Cloud-Dateien heißen `snapshot-v2~<parent...>.json`; die Vorgänger-IDs sind zusätzlich im verschlüsselten Inhalt gebunden. Bis zu fünf erkannte Zweige können ausdrücklich zu einem neuen gemeinsamen Checkpoint zusammengefasst werden. Das übernimmt die gewählte Fassung, **führt deren Inhalte nicht automatisch zusammen** und lässt andere Cloud-Dateien zunächst bestehen. Vor und nach Upload wird die vollständige zugängliche Liste geprüft. Die alte 100-Dateien-Grenze wird paginiert; ab 1000 gelisteten Dateien wird ohne automatische Bereinigung abgebrochen.

0.10-Snapshots hatten keine Vorgängerinformationen. Ihre zeitliche Reihenfolge ist nur eine Kompatibilitätsannahme, keine nachträgliche beweisbare Historie. Neue Clients sollten nicht parallel mit alten 0.10-Clients arbeiten. Für neue V2-Dateien werden getrennte Zweige erhalten und bei der Beobachtung erkannt.

**Keine atomare Garantie zwischen Geräten:** Appwrite-Dateilisten bieten diesem Client keinen Compare-and-swap für einen gemeinsamen Head. Beide Geräte können denselben Ausgangsstand gleichzeitig prüfen. Unveränderliche Dateien erhalten beide Fassungen; eine nachgelagerte oder spätere Listenprüfung erkennt die Verzweigung. Eventuell konsistente Listen, gelöschte Historien oder unklare Upload-Antworten können einen manuellen Abgleich erforderlich machen. Der Client besitzt noch keine persistente Upload-Outbox mit atomarer Remote-Bestätigung. Es wird weder Echtzeitkollaboration noch eine lückenlose historische Konflikterkennung für 0.10 behauptet.

## Aufbewahrungsregeln

Die automatische Bereinigung ist **standardmäßig aus** und braucht eine ausdrückliche Bestätigung im Tresor. Die verschlüsselte Einstellung gilt für diesen Account-Tresor auch auf anderen Geräten.

1. Erst nach erfolgreichem Upload und erneut bestätigtem einzigem Head prüfen.
2. Alle zehn neuesten Fassungen und alle höchstens 30 Tage alten Fassungen behalten. Die Altersprüfung benutzt den Provider-Zeitstempel des gerade bestätigten Heads, nicht eine möglicherweise falsche lokale PC-Uhr.
3. Nur bestätigte Vorfahren löschen, deren Entfernen keinen weiteren Graph-Head erzeugt. Pro Durchlauf höchstens drei Dateien.
4. Vor jeder Löschung erneut vollständige Historie, lokalen Dirty-Status, Account-Identität, exakt eigene Dateiberechtigungen und authentifizierten Inhalt prüfen.
5. Bei Konflikten, unbekannten Formaten, beschädigtem Inhalt, geteilten/fehlenden Berechtigungen, unvollständiger Liste oder Fehler stoppen. Die Schlüsseldatei ist niemals Kandidat.

Ältere 0.10-Historien können vollständig von der Bereinigung ausgenommen bleiben, weil das Entfernen ihres Ankers nicht sicher bewiesen werden kann. Das ist bewusst konservativ und bedeutet, dass freier Speicher nicht garantiert wird. Löschungen sind beim Anbieter möglicherweise unwiderruflich. Unabhängige verschlüsselte Downloads bleiben erforderlich. Eine serverseitige Transaktion zwischen „letzte Prüfung“ und „Löschen“ gibt es auch hier nicht; diese verbleibende Race-Grenze wird nicht als gelöst dargestellt. Vollständige Snapshots benötigen keine alten Dateien zum Entschlüsseln ihrer Inhalte.

## Zugänglichkeit und Release

Dialoge haben einen zugeordneten sichtbaren Titel, geben den Fokus nach dem Schließen zurück und entfernen geschlossene private Eingaben. Kontenformulare haben benannte Feldgruppen, Labels, Statuszuordnung und native Pflichtfeldvalidierung. Das ist eine gezielte Verbesserung, keine vollständige WCAG-Konformitätsprüfung.

Paket, Lockfile, README-Kandidatenversion, Changelog und Service-Worker-Version werden automatisch abgeglichen. Alle transitiven Laufzeitmodule müssen im Offline-Shell-Cache stehen. Der statische Build entfernt zuvor verifizierte generierte `dist`-Ausgaben, damit alte `.env`-/Test-/Serverdateien nicht versehentlich mitveröffentlicht werden. Abhängigkeiten wurden nicht erweitert.

## Tatsächlich ausgeführte Prüfungen

- Ausgangsbasis: 110 Node-Tests bestanden; drei neu hinzugefügte Reproduktionen zunächst fehlgeschlagen.
- Endstand: **151 Node-Tests bestanden**, Syntaxprüfung bestanden.
- Neue echte Browser-Suite: **12 bestanden, 0 fehlgeschlagen**, einschließlich zwei Browser-Kontexten, nativem IndexedDB/BroadcastChannel/Web Locks und dem vollständigen Editor mit synthetischen Accounts.
- Bestehende Browser-Suite: **16 bestanden, 0 fehlgeschlagen** für SVG/Canvas/PNG, ZIP, Website, PPTX, Bilder, Verläufe und WebM. Der optionale Test mit einer eigenen echten Schrift war mangels Testschrift nicht aktiv.
- Alle neuen Cloud-Upload-/Konflikt-/Löschprüfungen verwenden Anbieter-Doubles. Es wurden keine echten Appwrite-Backups gelöscht und keine echten Passwörter geändert.
- Ein neuer Live-Test mit zwei verschiedenen echten Provider-Konten, echten zeitgleichen Geräte-Uploads, echtes Recovery-Mail/Passwort-Reset und die neue Provider-Bereinigung stehen vor einer Veröffentlichung noch aus.
- Die Provider-Uploadberechtigungen/Quoten wurden nicht geändert; ein veränderter Client kann weiterhin die UI-Verifikationsprüfung umgehen und das Free-Kontingent belasten (siehe APPWRITE-SETUP.md).
- Kein unabhängiges Security-Audit, keine getestete Unterstützung sämtlicher Browser und kein Nachweis einer zertifizierten Sicherheits-/Datenschutzkonformität.

### Wiederholen

`npm run check`, `npm test`, `npm run build`.

Für Browserprüfungen einen separaten lokalen Testserver starten, z. B. PowerShell `$env:PORT='4183'; npm start`, und auf **dieser Test-Origin** `tests/vault-browser.html` sowie `tests/browser.html` öffnen. Jeweils „Prüfungen starten“ wählen. Niemals Testfixtures auf einer produktiv genutzten Origin ausführen: Sie erzeugen synthetische Testkonten und lösen dort absichtlich Tab-Sperren aus. Andere 0.10-Tabs vor der Nutzung des neuen Speicher-Schemas schließen. Die lokalen Testseiten werden nicht in den statischen Produktionsbuild kopiert. Das vollständige Editor-Testfixture deaktiviert seine Service-Worker-Registrierung, damit ein alter Offline-Cache keine Quellcodeänderungen verdeckt. Eine frische Test-Origin wird empfohlen; der produktive PWA-Code bleibt erhalten und wird separat geprüft.

Die Kernmodule `model.js`, `render.js`, `export.js`, `publishing.js`, `templates.js`, `design.js` und `image-tools.js` wurden per SHA-256 mit dem vorhandenen 0.10.0-Quellpaket verglichen: unverändert. Editor-Integration und Speicheranbindung wurden gezielt geändert; daraus folgt keine Behauptung, jede bisherige Interaktion vollständig getestet zu haben.
