# Prüfbericht – Arbeitsstand für 0.10.4, nur Aufgabe 1

Stand: **19. Oktober 2026**. Ausgangsstand: 0.10.3, Commit `cc46cba`. [Prüfbericht 0.10.3](HARDENING-0.10.3.md) und [FORMAT.md](FORMAT.md) wurden vor Änderungen gelesen. Kein unabhängiges Audit, kein Nachweis einer Sicherheitskonformität.

Der Auftrag erlaubt ausdrücklich, bei zu großem Umfang **Aufgabe 1 vollständig** zu liefern und den Rest als Plan zu beschreiben. Dieser Arbeitsstand nutzt diese Begrenzung. Aufgaben 2 und 3 sind **nicht implementiert**. Paketversion bleibt 0.10.3; Cache-Revision r4 trennt den geänderten lokalen Anwendungscode vom bisherigen Shell-Cache. Kein vollständiges 0.10.4-Release, keine Veröffentlichung, kein neuer Download mit behaupteter 0.10.4-Prüfsumme.

## Aufgabe 1 – Implementierung und Migration

V4-Checkpoints enthalten den vollständigen verschlüsselten Zustand, den vorherigen Head mit Envelope-Hash und eine transitive Liste eindeutiger Vorgänger-IDs/Hashes. Die vorhandenen DEKs, Passwort-/Recovery-Hüllen, PBKDF2-Parameter, Sealed-Value-Versionen, AAD und Projekt-/Portable-Formate bleiben bestehen. Details und Vertrauensgrenzen: [CHECKPOINTS.md](CHECKPOINTS.md).

Vorhandene Vaults werden beim nächsten geeigneten Upload **additiv** ergänzt. V1-Descriptoren sowie V1-/V2-/V3-Snapshot-Historien bleiben lesbar; alte Historien erhalten dadurch keinen nachträglichen Echtheitsnachweis. Ein altes `enabled:true` aktiviert die neue Bereinigung nicht. Erst erneute Zustimmung setzt die synchronisierte verschlüsselte Regel mit `checkpointVersion:1`. Ohne Zustimmung bleibt Pruning aus. Vor Aktivierung alle Geräte aktualisieren; alte Clients können V4 nicht lesen.

Der Ersteller prüft vor der Zusammenfassung die verfügbare Hash-Kette bis zum vorherigen Checkpoint beziehungsweise zur Wurzel und validiert den vollständigen neuen Record-Zustand. Vor Löschungen wird der hochgeladene Checkpoint zurückgelesen und validiert. Noch vorhandene abgedeckte Envelopes müssen ihre Hashes behalten; bestehende Checkpoint-Listen müssen vollständig übernommen werden. Dateinamen abgedeckter gewöhnlicher Dateien dürfen keine unabhängigen Zweige verstecken. Der Client prüft die noch benötigte Kette zum Checkpoint auch dann vollständig, wenn sein eigener Anker bereits der aktuelle Head ist.

Gelöscht werden höchstens drei abgedeckte, nach Provider-Datum über 30 Tage alte Dateien pro Durchlauf. Zehn neueste Dateien, aktueller Head, eigener aktueller Anker und vor dem Upload verwendeter Anker sind geschützt. Unsaubere lokale Zustände, Konflikte, fremde/geteilte Dateirechte, Accountwechsel, fehlgeschlagene Authentifizierung oder inkonsistente Metadaten verhindern weitere Löschungen. Ein unterbrochener Lauf wird durch erneutes Listen wiederholt; „Jetzt online sichern“ braucht dafür keinen zusätzlichen vollständigen Snapshot.

### Geänderte Dateien für Aufgabe 1

| Bereich | Dateien |
| --- | --- |
| Protokoll, Graph, Prüfung | `src/vault-checkpoints.js` (neu), `src/vault-chain.js`, `src/vault-sync.js`, `src/vault-crypto.js` (V4 ohne Legacy-Fallback) |
| Integration, Wiederherstellungsvalidierung, deutsche Hinweise | `src/managed-account.js`, `src/private-storage.js`, `src/managed-ui.js` |
| Optionaler CAS-Prototyp | `functions/remote-cas/main.mjs`, `docs/REMOTE-CAS.md` |
| Shell und Syntaxprüfung | `sw.js`, `package.json` (nur Prüfbefehl, keine Versions-/Abhängigkeitsänderung) |
| Tests | `tests/vault-checkpoints.test.js` (neu), `tests/vault-security.test.js`, `tests/remote-cas.test.js`, `tests/vault-browser.js`, `tests/pwa.test.js` |
| Dokumentation | `docs/CHECKPOINTS.md` (neu), `docs/FORMAT.md`, `docs/HARDENING-0.10.3.md` (historischer Nachtrag), dieser Bericht, `CHANGELOG.md`, `README.md` (nur Hinweis auf begrenzten Arbeitsstand) |

### Tests und belegte Aussagen

Die neue Node-Suite enthält 28 Fälle mit tatsächlicher Produktionskryptografie und `fake-indexeddb`; Cloud-Antworten/Löschungen sind ausschließlich Doubles:

- bestätigter Checkpoint vor Pruning; vollständiger Zustand und Verkettung späterer V3-Snapshots;
- neuer unanchored Client nach Pruning, ohne gelöschte Glieder abzurufen;
- exakter alter Hash-Anker im gekürzten Bereich und Ablehnung eines falschen Hashes;
- manipulierte Ciphertexte, authentifizierte ungültige Listen, beschädigte Record-IDs, geänderte erhaltene Vorgänger und unvollständige Zusammenfassungen früherer Checkpoints;
- Rollback auf Dateien vor dem bestätigten Checkpoint, ohne lokalen Zustand zu ersetzen;
- Abweichender zurückgelesener Envelope und konkurrierender Zweig während des Checkpoint-Uploads verhindern die lokale Bestätigung und jede Bereinigung;
- Abbruch vor Löschung, mitten im Pruning und nach erfolgreicher Löschung mit verlorener Antwort; wiederholbares Laden und Fortsetzen ohne neuen Checkpoint;
- geschützte eigene Anker, ausschließlich eigene Dateirechte und lokale Änderung während der letzten Account-Prüfung;
- V4 akzeptiert bei migrierten DEK-Vaults ausschließlich den aktuellen Datenschlüssel; alte Records bleiben über den bisherigen Fallback lesbar;
- V1-Descriptor-, V1-/V2-Snapshot-Migration, ausgeschalteter Standard und notwendige neue Zustimmung;
- wiederholte Checkpoints bis zur echten Entfernung des ersten Checkpoints; alter ursprünglicher Anker bleibt prüfbar;
- geänderte alte Dateinamen verstecken keinen unabhängigen Zweig;
- CAS-Outbox, bestätigter Head und Pruning im Double; kein zusätzlicher Nach-Commit-Listenlauf bei deaktivierter Aufbewahrung; Descriptor-Prüfung vor Schlüsselentsperrung;
- Function-Adapter prüft zusätzlich V4-Envelope-Hash/Rechte und transaktionale Head-/Receipt-Schreibvorgänge im HTTP-Double.

Vorherige Retention-Tests wurden nicht zu einer Löschfreigabe ohne Checkpoint umgedeutet: die bisherige Erwartung „Opt-in allein löscht alte Dateien“ wurde durch „ohne Checkpoint bleibt alles erhalten“ ersetzt. Neue Integrationstests prüfen die tatsächliche checkpointgebundene Löschung einschließlich eigener Rechte. Vorhandene Gast-/Editor-/Export-/Legacy-Tests bleiben Teil der Gesamtsuite.

### Abschließende Prüfungen

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| `npm run check` | Bestanden, Exit 0; neuer Checkpoint-Code und vorhandene Laufzeit-/Fixture-/Function-Quellen geprüft. |
| `npm test` | **240 bestanden, 0 fehlgeschlagen, 0 übersprungen**, Exit 0. Ausgangsstand 211; 28 neue Checkpoint-Fälle und ein zusätzlicher V4-Function-Fall. |
| `npm run build` | Bestanden, Exit 0; vorhandenes SDK gebündelt und statische Ausgabe neu aufgebaut. Keine Installation/neue Abhängigkeit. |
| Start ohne Installation | Gesamtsuite startet die Vorschau aus isoliertem Ordner ohne installierte Pakete; bestanden. Separater Testserver zusätzlich per `npm start` gestartet. |
| Native Vault-Browser-Suite | **18 bestanden, 0 fehlgeschlagen**. Neuer Fall: echtes IndexedDB/WebCrypto, checkpointgebundenes Pruning, unterbrochener Lauf, Wiederaufnahme, gelöschter alter Anker, vollständig leerer ankerloser Client, UI-Hinweis und Ciphertext-Manipulation. Cloud ist ein Double. |
| Bestehende Browser-/Export-Suite | **16 bestanden, 0 fehlgeschlagen**: Canvas/SVG/PNG/Bilder/IndexedDB/ZIP/Website/PPTX/WebM. Optionale eigene echte Testschrift nicht ausgeführt. |
| Unveränderter Kern | Quellvergleich gegen `cc46cba`: `src/app.js`, Modell, Render-/Exportkern, Gastspeicher, Legacy-Cloud-/Kontenoberfläche und gesamter `server/` unverändert. Kein Vollständigkeitsnachweis jeder Editor-Interaktion. |
| Echte Provider-/Mehrgeräte-Prüfungen | **Nicht ausgeführt**. Keine Appwrite-Nutzer-/Dateilöschungen, keine produktive Vault-Migration, keine CAS-Function ausgerollt, keine Anbieter-Mails und keine Veröffentlichung. |

Die Browser-Suiten liefen auf der separaten Test-Origin `http://127.0.0.1:4186/`, ausschließlich mit synthetischen Konten und simuliertem Provider. Bestehende echte Benutzer-Vaults unter Port 4173 wurden nicht entsperrt, migriert oder bereinigt. Screenshot außerhalb des Source-Projekts: `outputs/atelier-0.10.4-checkpoints-tests.png` im übergeordneten Arbeitsbereich.

## Aufgabe 2 – Noch nicht umgesetzt: konkreter Folgeplan

**Geänderte Implementierungsdateien: keine. Tests für die geforderte Kontolöschung/Datenexport-Funktion: nicht vorhanden/noch nicht ausgeführt. Keine echten Konten oder Cloud-Dateien gelöscht.**

1. Vor Implementierung exakt Web-SDK 29.0.0 im vorhandenen SDK und primären Appwrite-Referenzen prüfen. Belege für eigene Datei-Löschung, Accountstatus/Sitzungen und endgültige serverseitige Kontolöschung in `docs/ACCOUNT-DELETION.md` mit Versionsbezug festhalten. Dieser Bericht behauptet deren API-Verfügbarkeit ausdrücklich noch nicht.
2. Eigenen Kontodaten-Löschlauf mit vollständiger paginierter Liste und überprüften Owner-Rechten entwerfen: Snapshots und Descriptor-Kopien genau erfassen; Root-/Revisionsdateien ausdrücklich in den Löschumfang einordnen. Standard-CAS und optionales CAS-Head/Receipt/Outbox-Verhalten vorab festlegen; eine verbleibende CAS-Head-Referenz darf keine gelöschte Datei zur vermeintlich gültigen Sicherung machen.
3. Pro Owner dauerhaften lokalen Fortschrittszustand mit Operation-ID, bestätigten/ausstehenden Löschungen und explizitem Cloud-Überspringen speichern. Netzwerkabbruch, verlorene Antwort und bereits fehlende Dateien durch erneuten Abgleich wiederholbar behandeln. Automatische Uploads während dieses Laufs stoppen, damit sie keine gelöschten Daten erneut hochladen.
4. Deutsche Oberfläche mit Warnung/Backup-Knopf und Bestätigungswort. Lokale Löschung erst nach bestätigtem Cloud-Abschluss oder gesondert protokolliertem ausdrücklichem Überspringen. Vorher tabübergreifend sperren, laufende Writer entwerten und nur Records/Meta/Rücksicherungen des betroffenen Owners löschen. Gastdaten und andere Konten erhalten. Migration bestehender Meta-Zustände mit leerem Löschjournal testen.
5. Falls dokumentiert erlaubt: Account sperren und Sitzungen beenden; endgültige Konto-Löschung ausschließlich nach belegtem Serververfahren. Manueller Kontakt muss zunächst sichtbar als `[BETREIBER-KONTAKTADRESSE VOR VERÖFFENTLICHUNG EINTRAGEN]` markiert bleiben; keine erfundene Adresse veröffentlichen.
6. Ein Exportknopf erstellt verschlüsseltes portables Backup und separat lesbare Zusammenfassung mit ausgewiesenen Metadaten, Projektanzahl und Snapshot-Liste. Keine automatischen Klartext-Projektexporte. Kontext-/Accountwechsel und asynchrone Download-Erstellung absichern.
7. Eigener Commit erst nach Doubles für Teilfehler, verlorene Antworten, Wiederaufnahme, lokale Löschsperre, ausdrückliches Überspringen, tabübergreifende Sperren, fremde Konten, Gastdaten, CAS-Sonderfälle und Metadatenexport sowie Browserprüfung der Bestätigung.

## Aufgabe 3 – Noch nicht umgesetzt: konkreter Folgeplan

**Geänderte Release-Artefakte: keine. Version, Download-ZIP und dessen Prüfsumme bleiben auf ihrem bisherigen Stand. Keine neuen Datenschutz-/Impressumsentwürfe erstellt.** Die oben genannten README-/Changelog-Ergänzungen dokumentieren lediglich Aufgabe 1 und sind keine abgeschlossene Release-Vorbereitung.

Nach vollständiger Umsetzung des vereinbarten Release-Umfangs in einem eigenen Dokumentations-/Metadaten-Commit: Paket/Lock/Cache/README/CHANGELOG konsistent auf 0.10.4 bringen, vorhandene Download-Links prüfen und passende synthetische Screenshots ablegen. Funktionsliste gegen tatsächliche Tests abgleichen. Datenschutz- und Impressumsdateien klar als **Entwürfe ohne Rechtsprüfung** markieren; tatsächliche Betreiber-/Kontakt-/Hosting-/Region-/Fristangaben als sichtbare Platzhalter behandeln, bis sie verlässlich vorliegen.

Source-ZIP aus der bestehenden öffentlichen Whitelist ohne `.env`, Logs, lokale Nutzerdaten, `node_modules` oder Geheimnisse erstellen. SHA-256 des fertigen ZIP extern als `.sha256` ablegen und prüfen; eine Prüfsumme kann nicht als eigene unveränderte Selbstprüfsumme innerhalb derselben ZIP-Datei stehen. Keine erfundenen Download-URLs oder behauptete Veröffentlichung. Gesamte Check-/Test-/Build-/Browser-Matrix vor Abschluss erneut ausführen; Rechtsprüfung bleibt offen.

## Verbleibende Risiken und Grenzen

1. Ein Gerät ohne erhaltenen Anker kann ein altes gültiges Checkpoint-Angebot nicht als Rollback erkennen. Historische V1/V2-Dateien werden nicht nachträglich beglaubigt. DEK-Inhaber oder bösartig ausgelieferter JavaScript-Code können außerhalb dieses Schutzmodells handeln.
2. Die Hash-Liste wächst linear, maximal 10.000 zusammengefasste IDs. Online-Listenlimit 1.000 Dateien, bestehende Byte-Limits und zusätzliche Prüfdownloads begrenzen den Einsatz. Kein Merkle-Verfahren, Chunking oder Deduplizieren implementiert.
3. Prüfung und einzelne Cloud-Löschung sind ohne passende serverseitige Transaktion nicht global atomar. Echte parallele Geräte, Providerfehler, ACLs und Quoten sind nicht live nachgewiesen. CAS bleibt standardmäßig ausgeschaltet, erfordert gesondertes Deployment und echtes Testprojekt. Keine Function aus diesem Schritt ausgerollt.
4. Ältere Clients können Checkpoints nicht lesen. Alle Geräte vor Opt-in aktualisieren. Ein nicht bestätigbarer Upload kann eine bewusst zu prüfende Konfliktsituation hinterlassen; keine automatische Remote-Reparatur.
5. Die Einschränkung auf den aktuellen Schlüssel gilt für V4. Der Legacy-Fallback bleibt für bestehende Record-/V1–V3-Pfade aktiv; Inhaber alter Schlüssel können weiterhin kompatible alte Formate erzeugen. Das ist kein protokollweiter Schlüsselwiderruf. Echte DEK-Rotation/Widerruf alter Hüllen sowie Remote-Descriptor-Root-Reparatur fehlen weiterhin. Alte Backups und kopierte Schlüssel/Klartexte sind nicht zurückholbar. Anbieter-Mailzustellung, produktive Hosting-Header, mehrere Browser und unabhängiges Review bleiben offen.
6. Kontolöschung, geregelter Metadatenexport, fertige Release-Metadaten, neue ZIP-Prüfsumme und Betreiber-Rechtsdokumente sind gemäß der gewählten Begrenzung **offene Aufgaben**, keine erledigten Funktionen.

## Nachtrag: Gastmodus-Release 0.10.4

Der obige Text bleibt der historische Lieferumfang des Checkpoint-Commits. In einem späteren Schritt wurde der Gastmodus-Release mit deaktivierten Konten, eigenständiger Selbsthosting-Anleitung, Versionsanhebung und ZIP-Paketierung vorbereitet. Der aktuelle Nachweis steht in [RELEASE-CHECKS-0.10.4.md](RELEASE-CHECKS-0.10.4.md). Kontolöschung/Metadatenexport und Rechtsentwürfe bleiben offen; der historische Teil wird nicht nachträglich als deren Umsetzung dargestellt.
