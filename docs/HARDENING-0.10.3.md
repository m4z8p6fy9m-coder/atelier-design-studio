# Atelier 0.10.3 – Prüfbericht

Stand: 19. Oktober 2026. Lokaler unveröffentlichter Kandidat, auf Basis von 0.10.2. Kein unabhängiges Audit. Einschränkungen aus HARDENING-0.10.2.md gelten weiter, soweit unten nicht mit Tests konkret ergänzt.

## 1 – Descriptor-Verlust

Portable Backups enthalten weiterhin den bestehenden umhüllten Descriptor; neue Backups verweigern einen fehlenden Descriptor. Online-Downloads legen vor Ausgabe zusätzlich `descriptor-copy.json` mit einem vom Inhalts-Hash abgeleiteten eindeutigen Dateinamen und eigenen Dateirechten an. Bei erneutem Aufruf wird eine vorhandene identische Kopie akzeptiert, abweichender Inhalt abgelehnt. Der Descriptor enthält umhüllte Schlüssel, nicht das Passwort oder den lesbaren DEK/Recovery-Key. Auch neue unveränderliche Snapshot-Dateien enthalten eine Descriptor-Kopie. Offline erstellte Downloads können keine Remote-Kopie bestätigen.

Beim Entsperren abweichender, aber kompatibler lokaler/Online-Descriptoren ist eine ausdrückliche Bestätigung erforderlich. Andere Tresor-IDs bleiben abgelehnt. Der Bootstrap-Assistent ist nur für leeren lokalen Account-Speicher vorgesehen; er prüft alle Datensätze und speichert Descriptor und Daten atomar. Ein fehlender/abweichender Online-Descriptor verlangt eine gesonderte Zustimmung zur ausschließlich lokalen Wiederherstellung. Es werden dadurch weder Root-Datei noch Schlüsselrevisionen online ersetzt. Ein erneutes Online-Verbinden bei komplett verlorener Remote-Schlüsselhistorie braucht weiterhin eine bewusst geplante Reparatur; der Assistent behauptet diese Reparatur nicht.

Prüfung: 182 Node-Tests bestanden, darunter vier neue Descriptor-/Bootstrap-Tests. Alle Provider-Schreibprüfungen verwenden Doubles. Keine echten Nutzer-Vaults verändert.

## 2 – Passwort- und Recovery-Hüllen

Aktuelle Descriptoren lehnen das alte Passwort nach Wechsel ab. Der Recovery-Key lässt sich nach erneutem Download und Teileingabe ersetzen; Passwort-Hülle und Datensatz-Chiffretexte bleiben erhalten. Optionale `passwordEpoch`/`recoveryEpoch` binden neue Hüllen zusätzlich im AAD an ihre Wechselkennung; alte 0.10.2-Descriptoren ohne diese Felder bleiben lesbar. Tests prüfen auch das Einsetzen einer alten Hülle in den aktuellen Descriptor.

Gezielte Prüfung: 16 Recovery-/Wechseltests bestanden. **Die wörtliche Aussage „altes Passwort öffnet nur alte Backups“ ist kryptografisch mit unverändertem DEK nicht erfüllbar:** eine entschlüsselbare alte Hülle gibt denselben DEK frei, der auch spätere Daten lesen kann. Die App widerruft weder historische Kopien noch einen bereits kopierten DEK. Getestet ist die Ablehnung durch den aktuellen Descriptor. Ein vollständiger Widerruf erfordert eine gesonderte DEK-Rotation samt Neuverschlüsselung und kann alte externe Kopien trotzdem nicht löschen.

## 3 – Snapshot-Hash-Kette

Neue Remote-Envelopes verwenden `atelier-encrypted-backup-3`. Im verschlüsselten Snapshot stehen zusätzlich `sync.parentHashes` mit ID und SHA-256 des vollständigen Vorgänger-Envelopes. Der zuletzt bestätigte Head samt Hash bleibt lokal als `trustedHead` erhalten. Neue Standübernahmen prüfen die Kette bis zu diesem Anker; fehlende/beschädigte Vorgänger, veränderte bekannte Heads und ausgelieferte ältere Listen führen zu einer Rollback-/Konfliktwarnung ohne automatischen Austausch. Explizit gewählte alte Fassungen ersetzen den Vertrauensanker nicht. Portable Backups nehmen ihn verschlüsselt mit.

Alte V1/V2-Snapshots bleiben lesbar. Der erste neue Hash-Link bestätigt ihre jetzt beobachteten Bytes; er beweist keine historische Unverändertheit vor diesem Zeitpunkt. Ohne lokalen/aus Backup übernommenen Anker kann eine vollständig alte, in sich gültige Historie weiter nicht als Rollback erkannt werden. Ein böswilliger Host mit laufendem Clientzugriff bleibt außerhalb dieses Nachweises. Um neue Geräte nicht durch gelöschte Kettenglieder auszusperren, ist automatische Retention bei vorhandenem Hash-Anker ausgesetzt; ein beglaubigtes Pruning-/Checkpoint-Verfahren fehlt. Es werden dadurch mehr Dateien aufbewahrt.

Neue Tests reproduzieren alte Remote-Auslieferung, Änderung desselben Head-IDs und manipulierte Vorgänger. Der vorhandene Fork-Test enthält nun auch einen tatsächlich entschlüsselbaren zweiten Zweig, weil dessen Bytes vor einem gemeinsamen Checkpoint geprüft werden müssen. Gezielt 36 Ketten-/Sicherheitstests bestanden.

## 4 – Remote-CAS hinter Flag

Function mit Head-Dokument, Versionszähler, atomarem Receipt-/Head-Commit und Unique-Indizes entworfen und implementiert. Browserpfad mit persistenter verschlüsselter Upload-Outbox, stabiler Datei-ID, Hash-Abgleich bei 409 und idempotentem Commit-Receipt ist hinter `remoteCAS.enabled=false`. Vier Tests mit Doubles bestanden: konkurrierender Gewinner, idempotente Antwort, belegte Datei-ID und Neustart nach verlorener Commit-Antwort ohne zweite Datei. Setup, bestehende Vault-Migration, Konfigurationsgrenzen und fehlende Live-Prüfung stehen in [REMOTE-CAS.md](REMOTE-CAS.md). Das Feature wurde nicht beim Anbieter aktiviert. Unbestätigte Upload-Waisen und manuelle Konfliktbehandlung bleiben erforderlich.

## 5 – Provider-Testskript

`scripts/provider-check.mjs` hat eine vollständige `APPWRITE_TEST_*`-Sperre inklusive separater Testprojekt-Bestätigung und reservierter Mail-Domain. Es prüft Fremd-/Anonymzugriffe auf zwei synthetische Nutzerdateien und bereinigt bestätigte eigene Testressourcen. Drei Tests mit Fake-HTTP bestanden, einschließlich absichtlich erlaubtem Fremdzugriff als Fehlerfall und Prüfung des geheimnisfreien Berichts. Der tatsächliche lokale Aufruf erzeugte `provider-check.local.md` mit **NICHT AUSGEFÜHRT**, da die erforderliche Testumgebung fehlt; keine echten Konten angelegt und keine Netzwerkanfragen. Anleitung: [PROVIDER-CHECK.md](PROVIDER-CHECK.md). Keine echte Provider-Isolation als bestanden behauptet.

## 6 – Quota-Anzeige und Kompression

Die Tresoroberfläche zeigt die Summe aller für den angemeldeten Account sichtbaren Dateien (vollständig paginiert) sowie, soweit verfügbar, die Browser-Speicherschätzung dieser Origin. Das tatsächliche projektweite Providerlimit ist im Client unbekannt und wird so benannt; keine Free-Plan-Zahl wird erfunden. Die Browserschätzung umfasst auch Gastmodus und andere lokale Konten. Ein Fehler oder Offline-Modus blockiert weder lokale Arbeit noch andere Tresoraktionen.

Große gut komprimierbare JSON-Inhalte werden **vor AES-GCM** mit nativem `CompressionStream('gzip')` verkleinert. Envelope V2 bindet Codec und ursprüngliche UTF-8-Länge im AAD. Kleine/nicht lohnende Inhalte und Browser ohne Kompressor schreiben weiterhin V1; V1 bleibt lesbar. Beim Lesen wird nach Authentifizierung mit hartem Stream-Limit entpackt und die exakte Länge geprüft (maximal 128 MiB). Ohne DecompressionStream wird V2 mit Fehlermeldung abgelehnt. Alte Clients ohne V2-Leser können neue komprimierte Datensätze nicht öffnen; alte Tabs vor Upgrade schließen.

Kompression kann Inhaltslängen/Gleichheit offenlegen und bei adaptiv kontrollierten Eingaben Seitenkanäle schaffen. Es wird kein Schutz gegen solche Angreifermodelle behauptet; kein Padding implementiert. Keine neuen Pakete. Drei neue Tests prüfen Roundtrip/Größengewinn, manipulierte Codec-/Längen-/AAD-Angaben sowie paginierte Belegung ohne erfundenes Projektlimit. Zusammen mit bisherigen Vault-Tests 15 gezielte Tests bestanden. Chunking/Deduplizierung ist ausschließlich ein Entwurf mit 16–28 Entwicklungstagen Schätzung: [CHUNKING.md](CHUNKING.md).

## 7 – Formatspezifikation, Testvektoren und Import-Fuzzing

[FORMAT.md](FORMAT.md) beschreibt Descriptoren, beide Sealed-Value-Versionen, PBKDF2-Parameter, Hüllen-Epochen, AAD-Konstruktion, Snapshots/Hash-Kette, portable Dateien und CAS-Metadaten. Es legt auch nicht-kanonische JSON-Hash-Serialisierung und bekannte Interoperabilitäts-/Vertrauensgrenzen offen. Feste öffentliche Vektoren wurden unabhängig mit Node/OpenSSL/zlib erzeugt und gegen Produktionsableitung, AES-GCM-Ausgabe, gzip-V2 und Passwort-/Recovery-Hüllen geprüft. Ein reproduzierbarer 128-Fall-Fuzz-Test benutzt den tatsächlichen Importpfad und kontrolliert nach jeder Ablehnung den unveränderten gespeicherten Datensatz. Weitere Fälle prüfen authentifizierte doppelte IDs, fremde Owner, falsche Anker und ein deklariertes zu kleines Entpacklimit. Das ist kein Vollständigkeitsnachweis aller Parser/Browser.

Zusätzliche Robustheitskorrektur: eine nicht bestätigbare Remote-Descriptor-Kopie verhindert den unabhängigen lokalen Backup-Download nicht. Fehler wird als fehlende Bestätigung angezeigt. Ein eigener Test prüft die anschließende descriptorlose Wiederherstellung dieses Downloads. Ein weiterer Test belegt explizite Zustimmung vor dem Austausch kompatibler lokaler/Remote-Descriptoren. Die Recovery-Entsperrmaske enthält diese Zustimmung ebenfalls.

## Ausgeführter Endstand

- `npm run check`: bestanden, einschließlich neuer Laufzeitmodule, Provider-Skript und Function-Quellen.
- `npm test`: **211 bestanden, 0 fehlgeschlagen** (178 im Ausgangsstand). Neue Suites: Descriptor 6, Hüllenwechsel 2, Hash-Kette 5, CAS 7, Provider-Skript 3, Kompression/Quota 4, Format/KAT/Fuzz 6.
- `npm run build`: bestanden, bestehendes SDK mit vorhandenen Paketen gebündelt, öffentliche Ausgabe neu aufgebaut. Keine Paketinstallation oder neue Abhängigkeit.
- Start ohne installierte Pakete: vorhandener automatisierter Test startet die mitgelieferte Vorschau aus isoliertem Ordner ohne `node_modules`; bestanden. `npm start` bleibt `node scripts/serve.mjs`.
- Echte Browser-Suite auf separater Origin `http://127.0.0.1:4185/`: **17 bestanden, 0 fehlgeschlagen**. Neu: feste AES-/gzip-Vektoren sowie tatsächlicher descriptorloser UI-Import, Quota-Anzeige und erneuter Download/Teileingabe beim Recovery-Key-Wechsel. Alle Konten und Provider-Antworten dort sind synthetisch.
- Bestehende Canvas-/SVG-/PNG-/Bilder-/ZIP-/Website-/PPTX-/WebM-Suite unter der CSP: **16 bestanden, 0 fehlgeschlagen**. Optionale eigene echte Testschrift weiterhin nicht ausgeführt.
- Quellvergleich mit 0.10.2 (`0d813bf`): Modell-/Render-/Export-/Publishing-/Vorlagen-/Design-/Bildkern, Gast-Speicherung, Legacy-Cloud-/Kontenoberfläche und kompletter Legacy-Server unverändert. Neue private Speicher-/Kontenintegration wurde gezielt geändert. Keine Behauptung, jede Interaktion vollständig geprüft zu haben.
- Tatsächlicher Provider-Skriptaufruf: **NICHT AUSGEFÜHRT**, vollständige `APPWRITE_TEST_*`-Umgebung fehlt. Lokaler Markdown-Bericht erzeugt, keine Netzwerkanfrage und keine echten Testnutzer angelegt.
- Kein Appwrite-CAS-Deployment, keine echten Index-/Transaktions-Races, keine echten Nutzer-Vault-Migrationen, Passwortänderungen, Cloud-Löschungen oder GitHub-/Hosting-Veröffentlichung in diesem Schritt.

## Verbleibende offene Punkte

1. Echte Zwei-Nutzer-Dateiisolation, CAS-Function/Indizes/Transaktionen, parallele Geräte und verlorene Antworten müssen im separaten Testprojekt nachgewiesen werden. Echte OTP-/Recovery-Mail-Zustellung und Hosting-Header sind weiterhin ungeprüft.
2. Vollständiger Widerruf alter Passwort-/Recovery-Hüllen benötigt eine echte DEK-Rotation samt Neuverschlüsselung. Historische Kopien und bereits kopierte Klartexte/Schlüssel sind nicht zurückholbar. Die getestete aktuelle Hülle ist keine solche Rotation.
3. Descriptorloser **lokaler** Restore ist implementiert. Vollständige Remote-Root-/Revisionsreparatur und automatische Auflösung von Schlüsselkonflikten fehlen weiterhin; es wird nichts stillschweigend überschrieben.
4. Ohne erhaltenen lokalen/Backup-Hash-Anker ist eine alte vollständig gültige Historie nicht als Rollback identifizierbar. Alte Snapshot-Historien sind nicht nachträglich beweisbar. Hash-Pruning/Checkpoints fehlen; entsprechende Retention ist ausgesetzt. CAS-Upload-Waisen werden nicht automatisch bereinigt.
5. CAS bleibt ein standardmäßig ausgeschalteter Prototyp mit neuer Function-/Admin-Key-Vertrauensgrenze. Eine gefälschte/kompromittierte Provider-/Host-Umgebung wird dadurch nicht vertrauenswürdig. Gemischte alte/CAS-Clients sind nicht unterstützt.
6. Tatsächliches Gesamt-Projektkontingent, serverseitige Quoten-/Missbrauchsregeln, Last-/Kostenverhalten und Chunking/Deduplizierung bleiben offen. Deduplizierung ist nur entworfen, nicht implementiert.
7. Mehrere Browser, kompletter Offline-Neustart, eigene Schrift, großvolumige Migrationen und unabhängiges Sicherheitsreview stehen aus. Kompressions-Längenkanäle, JavaScript-Speicherlöschung und ein böswilliger Host bleiben ausdrückliche Grenzen.

Wiederholen: `npm run check`, `npm test`, `npm run build`. Browserfixtures ausschließlich auf separater Test-Origin ausführen. Testseiten, Provider-Bericht und Function-Dateien sind nicht im statischen Produktionsbuild. Der Source-Download enthält Function-Quellen zur gesonderten Einrichtung; keine Admin-Keys.

Ergänzende Review-Tests prüfen den HTTP-Function-Adapter: anonyme/ungültige JWTs verwenden keine Admin-Identität, fremde Datei-Rechte verhindern jede Head-Änderung und ein bestätigter eigener Upload legt Head/Receipt mit derselben Transaktions-ID an. Das bleibt Fake-HTTP, kein Live-Nachweis. Ein ausgefallener oder nicht lohnender Kompressor fällt auf lesbares V1 zurück; dafür gibt es einen eigenen Test. Auch V1-Klartext wird nach Authentifizierung auf die Formatgrenze begrenzt.

Ein zusätzlicher Übergangstest erhält beim Upgrade einer 0.10.2-Installation auch die Warnung anhand der bekannten lokalen Head-ID, wenn noch kein neuer Hash-Anker vorliegt. Ein fehlender bisher bekannter Head führt vor automatischer Übernahme zum Abbruch; ältere IDs liefern damit einen Warnhinweis, aber keinen nachträglichen kryptografischen Verlaufsnachweis.

## Nachtrag zum Arbeitsstand für 0.10.4

Der obige Bericht bleibt der historische Prüfstand von 0.10.3. Checkpoint-/Pruning-Arbeiten, neue Tests, erneute Zustimmung zur Aufbewahrung und verbleibende Grenzen stehen in [HARDENING-0.10.4.md](HARDENING-0.10.4.md) und [CHECKPOINTS.md](CHECKPOINTS.md). Das ist kein vollständiges 0.10.4-Release; Kontolöschung und Release-Vorbereitung sind dort ausdrücklich als noch nicht umgesetzter Folgeplan gekennzeichnet.
