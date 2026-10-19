# Remote-CAS und persistente Upload-Outbox

Stand: 19. Oktober 2026. Implementierter, **standardmäßig ausgeschalteter Prototyp**. Kein Deployment oder Nachweis gegen einen echten Appwrite-Transaktionsdienst. Bestehende Datei-Synchronisation bleibt bei ausgeschaltetem Flag aktiv. Der Legacy-Node-Server wird nicht geändert.

Arbeitsstand für 0.10.4: Die Function akzeptiert neben V3 auch V4-Checkpoint-Envelopes. Dafür muss vor einer aktivierten Checkpoint-Aufbewahrung die aktualisierte Function ausgerollt werden. Der Client verwendet dieselbe Outbox und prüft den zurückgelesenen Checkpoint vor Löschungen. Die Function prüft Datei-Hash/Rechte und CAS, aber keinen entschlüsselten Checkpoint-Inhalt. Ohne aktivierte Aufbewahrung wird kein zusätzlicher Bereinigungslauf nach CAS-Commit gestartet. Nur lokale Doubles, kein Live-Nachweis: [CHECKPOINTS.md](CHECKPOINTS.md), [Prüfbericht](HARDENING-0.10.4.md).

## Datenmodell und atomarer Entscheidungspunkt

Appwrite DocumentsDB (Databases-REST-API mit Transaktionen) bekommt zwei Collections:

| Collection | Attribute (jeweils erforderlich) | Indizes |
|---|---|---|
| `vault_heads` | `owner`: string(200), `version`: integer(0..2147483647), `fileId`: string(36), `hash`: string(64), `operation`: string(36) | **Unique** `owner` |
| `vault_commits` | gleiche Felder, dazu `previousHead`: string(36), darf leer sein | **Unique** zusammengesetzt `(owner, version)` |

Head-ID: `c` + erste 31 Hexzeichen von SHA-256(JSON-Array `[owner,"head"]`). Receipt-ID: entsprechend `[owner,operation]`. Beide Collections haben keine direkten Client-Rechte; ausschließlich die Function darf lesen/schreiben. Der eindeutige Owner/Versions-Index ist eine zusätzliche Versionsreservierung, kein Ersatz für eine Transaktion.

Die Function prüft den vom Appwrite-Execution-Dienst gelieferten User-JWT mit `/account`, verlangt eine bestätigte E-Mail und leitet den Owner ausschließlich daraus ab. Sie prüft Eigentümerrechte, Größe und Hash des bereits verschlüsselten Snapshot-Files. Sie erhält keinen Datenschlüssel. Nach Kontrolle von `expectedVersion` und `expectedHead` legt sie in **derselben Transaktion** das unveränderliche Receipt für Version N+1 an und aktualisiert/erstellt das Head-Dokument. Konkurrierende Requests für dieselbe Owner/Version müssen am Unique-Index oder Transaktions-Commit scheitern. Ein alter Request darf einen neueren Head nicht überschreiben. Normales GET/PATCH ohne Transaktion wird nicht als CAS verwendet.

Die Implementierung liegt in `functions/remote-cas/core.mjs` und `main.mjs`. Sie benutzt nur Node-Bordmittel und REST. `commitHead` ist gegen ein atomar prüfendes Test-Double getestet; das beweist nicht die korrekte Konfiguration eines echten Unique-Index.

## Einrichtung in einem getrennten Testprojekt

1. Appwrite-Version/Region mit DocumentsDB-Transaktionen wählen. Datenbank erstellen. Collections mit Document Security und **keinen** Client-CREATE/UPDATE/DELETE/READ-Rechten erstellen.
2. Attribute gemäß Tabelle anlegen, auf „available“ warten. Die beiden Unique-Indizes erstellen, ebenfalls auf Bereitschaft warten. Das Versionsfeld nicht als Float anlegen.
3. Appwrite Function mit Node.js 20+ anlegen. Inhalt von `functions/remote-cas/` als Deployment-Root, Einstieg `main.mjs`, kein Installations-/Buildschritt nötig. Execution ausschließlich für angemeldete Nutzer freigeben; die Function prüft zusätzlich serverseitig die E-Mail-Bestätigung. Keine anonyme öffentliche Function-Domain als Authentifizierungsersatz verwenden.
4. Function-Umgebung setzen: `APPWRITE_CAS_ENDPOINT` (HTTPS-API mit `/v1`), `APPWRITE_CAS_PROJECT`, `APPWRITE_CAS_DATABASE`, `APPWRITE_CAS_HEADS=vault_heads`, `APPWRITE_CAS_COMMITS=vault_commits`, `APPWRITE_CAS_BUCKET`, `APPWRITE_CAS_API_KEY`. Nur dieser Server-Key darf Dokumente lesen/schreiben, Transaktionen anlegen/committen und Dateien lesen. Die im eigenen Provider angebotenen minimalen Scopes auswählen. Key niemals in Frontend, Git oder Logs kopieren.
5. Zuerst zwei gleichzeitige Version-0-Commits im Testprojekt ausführen: genau einer darf gewinnen, Head/Receipt müssen zusammen sichtbar werden. Danach verlorene Commit-Antwort simulieren und dieselbe Operation wiederholen. Zuletzt fremde Datei-IDs und JWTs sowie anonyme Aufrufe prüfen. Diese Live-Nachweise stehen noch aus.
6. Erst danach `managedConfig.remoteCAS` auf `{enabled:true,functionId:'DEINE_FUNCTION_ID'}` setzen. Standard bleibt `false`. Unter `connect-src` muss die verwendete Appwrite-Origin zulässig sein. Ein Function-Fehler führt bei aktivem Flag zum Abbruch, nicht zum stillen Rückfall auf nicht-atomare Sync.

Neue leere Tresore können mit Version 0/Head null starten. Bestehende Cloud-Historien brauchen vor Aktivierung eine administrative, ausdrücklich bestätigte Seed-Migration: aktuellen einzigen Head samt Datei-Hash prüfen, Head-Dokument mit Version 0, Owner, File-ID, Hash und `operation:"seed"` setzen. Dazu andere Clients schließen; danach auf allen beteiligten Clients dasselbe Flag benutzen. Es gibt bewusst keine automatische Übernahme einer beliebigen Dateiliste als autoritativen Server-Head.

## Wiederholung ohne doppelte Snapshot-Dateien

Vor jedem Netzwerk-Upload speichert der Client `casOutbox` in Account-Metadaten von IndexedDB: feste Operation/File-ID, Dateiname, bereits verschlüsseltes Envelope, dessen Hash, lokale Generation und erwartete Head-Version. Keine Passwort-/DEK-Werte werden darin abgelegt. Erst nach erfolgreichem lokalen Schreiben wird hochgeladen.

Bei unbekanntem Upload-Ergebnis bleibt die Outbox erhalten. Wiederholung benutzt exakt dieselbe ID und dieselben Bytes. Ein 409 wird nur akzeptiert, wenn die vorhandene Datei denselben Hash hat. Danach wird die Function mit derselben Operation-ID wiederholt. Bereits bestätigte Receipts liefern denselben Abschluss zurück. Head/Generation, CAS-Version, lokaler Hash-Anker und Löschen der Outbox werden gemeinsam in einer Metadaten-Transaktion bestätigt. Zwischenzeitlich geänderte lokale Datensätze bleiben dirty und werden später hochgeladen.

Im CAS-Modus werden nur vom bestätigten Head erreichbare Dateien als Historie betrachtet; unbestätigte Uploads bleiben als verschlüsselte Waisen liegen. Konflikte werden nicht durch Neunummerieren „gelöst“. Im Tresormenü kann der ausstehende Stand als portables Backup gespeichert und der Wiederholauftrag ausdrücklich beendet werden. Lokale Daten und Remote-Dateien bleiben dabei erhalten; danach ist manueller Abgleich erforderlich. Automatisches Garbage Collecting von Waisen ist nicht implementiert.

## Grenzen

Function/API-Key/DB-Konfiguration sind eine neue Vertrauens- und Betriebsgrenze. Kontingente, Drosselung, Kosten und serverseitige Aufbewahrung sind zusätzlich zu planen. Version und Owner sind lesbare Metadaten. CAS-Receipts und Dateien sind nicht gemeinsam in einer Storage-/DB-Transaktion; die unveränderliche Datei wird zuerst hochgeladen, weshalb Waisen möglich bleiben. Ein kompromittierter Admin/Host kann Head und Daten manipulieren; der lokale Hash-Anker hilft nur bei noch vorhandenem Vertrauensstand. Gemischte alte/CAS-Clients sind nicht unterstützt. Live-Races, API-Kompatibilität und tatsächliche Indizes müssen vor Aktivierung getestet werden.

Referenzen: [Appwrite Transaktionen](https://appwrite.io/docs/products/databases/documentsdb/transactions), [Function-Kontext und User-JWT](https://appwrite.io/docs/products/functions/develop), [REST-Authentifizierung](https://appwrite.io/docs/apis/rest).
