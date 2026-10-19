# Atelier Vault- und Envelope-Formate

Stand: 19. Oktober 2026, Implementierung 0.10.3. Für externes Review, **keine Sicherheitszertifizierung**. Verbindliche Referenz ist zusätzlich der Code `vault-crypto.js`, `vault-backup.js`, `vault-chain.js`, `private-storage.js`, `managed-account.js`. Projekt-/Editor-JSON wird nicht ersetzt. Alle Beispiele/Vektoren sind öffentliche Testdaten und dürfen niemals als echte Schlüssel benutzt werden.

## Primitive, Kodierung und Grenzen

- Browser WebCrypto, AES-256-GCM, 128-Bit-Tag (WebCrypto-Standard), pro Verschlüsselung zufälliger 96-Bit-IV aus `crypto.getRandomValues`.
- Strings/JSON: `TextEncoder` UTF-8, `JSON.stringify` ohne Pretty-Print. Binärfelder: RFC-4648-Base64 mit Padding; Leser benutzt `atob` und akzeptiert dessen Whitespace-Toleranz. Recovery-Key verwendet Base32 mit Alphabet `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`, ohne Padding.
- SHA-256 wird als 64 kleine Hexzeichen gespeichert. Envelope-/Descriptor-Datei-Hashes sind SHA-256(UTF8(`JSON.stringify`(geparstes Objekt))). **Keine kanonische JSON-Sortierung:** Eigenschaftsreihenfolge ist Teil dieser Hash-Darstellung; äquivalentes Umordnen kann eine Warnung auslösen. Andere Implementierungen müssen diese Serialisierung reproduzieren. Der Datensatz-Digest sortiert dagegen die Records lexikalisch nach `id`, bevor das Array serialisiert wird.
- Maximal 128 MiB Klartext je seal/unseal und portables Backup; maximal 100000 Datensätze pro Snapshot. Cloud-Uploads maximal 20 MiB JSON-Dateigröße im Client; gelesene Remote-JSON-Texte maximal 30 MiB Zeichenlänge. Providerlimits können niedriger sein.
- Private IndexedDB heißt `atelier-private-v1`, Schema 2. Stores `records`, `meta`, `recoveries`. Projekt-IDs und Datensatz-AAD bleiben unverändert.

## Sealed Value V1 und V2

| Feld | V1 | V2 |
|---|---|---|
| `v` | Zahl 1 | Zahl 2 |
| `iv` | Base64, genau 12 Bytes | ebenso |
| `data` | Base64(Ciphertext mit angehängtem GCM-Tag) | ebenso |
| `codec` | fehlt | exakt `gzip` |
| `plainBytes` | fehlt | positive sichere Ganzzahl, originale UTF-8-JSON-Länge, höchstens 128 MiB |

V1-AAD = UTF8(Kontextstring). V2-AAD = UTF8(JSON-Array `["atelier-seal-2", Kontextstring, "gzip", plainBytes]`). V2 komprimiert **vor** Verschlüsselung. Der Writer verwendet gzip nur ab 1024 Klartextbytes und wenn es mindestens 64 Bytes spart; sonst V1. Implementierungen dürfen andere gültige gzip-Bytes erzeugen. Kompressionsbytes sind nicht kanonisch. Der Leser authentifiziert vor Entpacken, liest den DecompressionStream mit harter `plainBytes`-Grenze und prüft danach exakte Länge und JSON. Falscher Codec, Version, IV, Tag, AAD oder übergroße Länge werden abgelehnt. Große Inhalte bei fehlendem Kompressor dürfen V1 sein; ohne DecompressionStream lassen sich V2-Daten nicht öffnen.

V1 bleibt lesbar; V2 braucht den neuen Client. Codec/Länge sind sichtbare authentifizierte Metadaten, keine verborgenen Angaben. Keine Längenverschleierung oder Zusage gegen Kompressions-Seitenkanäle.

## Passwortableitung

`kdf` ist exakt `PBKDF2-SHA256-600000`. Passwort: unverändert als UTF-8, ohne Unicode-Normalisierung oder Trimming, mindestens 12 JavaScript-Zeicheneinheiten. Salt: zufällige 16 Bytes Base64. PBKDF2 mit SHA-256 und 600000 Iterationen liefert direkt den 256-Bit-AES-GCM-KEK. Es gibt kein separat einstellbares Iterationsfeld und keine automatische Änderung des KDF. Standard-Schlüsselimporte sind nicht extractable. Nur bei ausdrücklicher Legacy-Migration wird der alte Schlüssel kurzzeitig neu exportierbar abgeleitet, um ihn umhüllt einzubetten. Das ist keine beweisbare Speicherlöschung.

## Descriptor V1 (Legacy)

`{format:"atelier-vault-1", owner, salt, kdf, check}`. `check` verschlüsselt `{ok:true}` mit dem direkt aus Passwort abgeleiteten Schlüssel und Kontext `owner + ":check"`. Derselbe alte Schlüssel verschlüsselte Daten. V1 bleibt lesbar und wird ausschließlich auf ausdrücklichen Wunsch migriert.

## Descriptor V2 (DEK/KEK)

Erforderliche Felder: `format:"atelier-vault-2"`, `owner`, `id` (erzeugte UUID, Leser prüft 36 Zeichen aus kleinen Hexzeichen/Bindestrichen), `salt`, `kdf`, `check`, `passwordWrap`, `recoveryWrap`. Optional: `legacy`, `passwordEpoch`, `recoveryEpoch`, `revision`.

DEK: zufällige 32 Bytes. `check` verschlüsselt `{ok:true}` unter DEK mit Kontext `owner + ":check"`. Eine Hülle enthält JSON `{raw: Base64(DEK)}`:

- Passwort-Hülle unter dem PBKDF2-KEK. Kontext = JSON-Array `["atelier-vault-2",owner,id,"password"]`, bei vorhandenem `passwordEpoch` zusätzlich dieses Feld als fünftes Array-Element.
- Recovery-Hülle unter einem unabhängigen zufälligen 32-Byte-Recovery-Key, direkt als AES-GCM-Key importiert. Kontext analog mit `"recovery"` und optional `recoveryEpoch`.
- `legacy` unter DEK: `{raw:Base64(alter Schlüssel),descriptor:alter V1-Descriptor}`; Kontext `["atelier-vault-2",owner,id,"legacy"]`, ohne Epoch. Der Leser kann nach fehlgeschlagener Datenentschlüsselung den eingebetteten Legacy-Schlüssel versuchen.

Der Recovery-Key wird als 52 Base32-Zeichen in 13 Vierergruppen angezeigt. Die vier ungenutzten Endbits müssen null sein. Trennstriche/Whitespace werden ignoriert, Kleinschreibung wird akzeptiert. Er wird weder im Descriptor noch im Backup im Klartext gespeichert.

`passwordEpoch`/`recoveryEpoch` werden beim Wechsel zufällig neu erzeugt und in den jeweiligen Hüllen-Kontext gebunden. Alte V2-Descriptoren ohne Epoch bleiben mit ihrem bisherigen AAD gültig. Passwortwechsel ersetzt Salt/Passwort-Hülle/Passwort-Epoch. Recovery-Wechsel ersetzt Recovery-Hülle/Recovery-Epoch. Der DEK bleibt dabei gleich. **Alte Hüllen bleiben entschlüsselbar und geben weiterhin denselben DEK frei; kein Widerruf historischer Kopien.** Der ganze Descriptor besitzt keine externe Signatur und kein unabhängiges Transparenzprotokoll.

Root-Datei-ID: `v` + erste 31 Hexzeichen von SHA-256(UTF8(owner)). Name `key.json`. Unveränderliche Revisionen: `key-v2~<parent-ID>.json`, Body `{format:"atelier-key-revision-1",owner,parent,descriptor}`. `revision` ist die ausgewählte Provider-Datei-ID. Mehrere erreichbare Tips werden abgelehnt, keine Auswahl anhand Zeitstempel. Ein neuer kompatibler lokaler Descriptor wird erst nach ausdrücklicher Bestätigung übernommen. Zusätzliche Kopie: Body `{format:"atelier-descriptor-copy-1",descriptor}`, ID `d` + erste 31 Hexzeichen des oben definierten Descriptor-Hashes, Name `descriptor-copy.json`. Diese Metadatenstrukturen ersetzen keine authentifizierte serverseitige Versionsentscheidung.

## Datensätze und Kontextstrings

Record `{id,owner,store,item,value}`. `store` genau `projects`, `assets`, `settings` oder `versions`. `item`: nichtleerer String bis 200 Zeichen. `id` = JSON-Array als String `[owner,store,item]`. `value` ist ein Sealed Value. AAD-Kontext: `"atelier-record:" + id`.

GCM bindet damit Account, Store und ID, aber keine Generation und keine zusätzliche Tresor-ID. Der DEK trennt Tresore. Gelesene Chiffretexte werden vor lokalen Updates zusätzlich verglichen (CAS gegen zwischenzeitliche Änderungen). Restore prüft doppelte IDs, Feldzuordnung und lesbare `value.id === item`; Projekte/Versionen werden durch die bestehende Modellvalidierung geprüft, Assets auf die bisherigen Bildformate. Settings haben weiterhin kein vollständiges fachliches Schema.

Snapshot: `{format:"atelier-snapshot-1",owner,records:[Record...],sync?,trustedHead?}`. Portable Stände dürfen `sync` weglassen. `trustedHead`, sofern vorhanden: `{id:Provider-ID,hash:64-Hex}`. Er ist beim Backup innerhalb der verschlüsselten Inhalte, lokal jedoch als Metadatum in `meta` gespeichert.

## Portable und Remote-Envelopes

Portable Backup: `{format:"atelier-portable-vault-1",descriptor,encrypted}`. `encrypted` versiegelt den Snapshot mit Kontext `owner + ":snapshot"`. Descriptor enthält nur umhüllte Schlüssel und Metadaten. Nur bei leeren lokalen Account-Daten kann der Bootstrap-Assistent mit Passwort/Recovery-Key den eingebetteten Descriptor übernehmen; Inhalt und Descriptor werden vor/bei atomarem Restore geprüft. Ein abweichender/fehlender Online-Descriptor wird nicht automatisch repariert. Eine fehlgeschlagene Remote-Kopie darf den unabhängigen lokalen Backup-Download nicht verhindern; die App meldet fehlende Bestätigung.

Remote V1: `{format:"atelier-encrypted-backup-1",encrypted}`; keine beweisbaren Eltern. V2: `{format:"atelier-encrypted-backup-2",encrypted,descriptor?}`; V3: `{format:"atelier-encrypted-backup-3",encrypted,descriptor}`. Derselbe Snapshot-Kontext wie portable Backups.

V2/V3 enthalten im verschlüsselten `sync`: `id` = eigene Datei-ID, `parents` = geordnete eindeutige Vorgänger-IDs (höchstens fünf), `digest` = SHA-256 des sortierten verschlüsselten Record-Arrays. V3 zusätzlich `parentHashes:[{id,hash},...]` in genau derselben Reihenfolge wie `parents`. Hash ist der vollständige Vorgänger-Envelope-Hash inklusive seines verschlüsselten Inhalts und optionalen Descriptors. Dateiname bleibt `snapshot-v2~<parent1>~...json`, ohne Vorgänger `snapshot-v2~_.json`; der Dateiname bindet IDs, nicht Hashes. Der Leser vergleicht Name und authentifizierte Eltern.

Auch ohne Hash-Anker wird eine bereits gespeicherte lokale Head-ID beim Upgrade nicht ignoriert: fehlt sie online, erfolgt eine Rollback-/Konfliktwarnung. Das beweist keine unveränderte alte Historie. Ein lokal bestätigter `trustedHead` muss vom neuen Remote-Head erreichbar sein und dieselben Bytes repräsentieren. Fehlende Glieder oder Hashabweichungen werden gewarnt/abgelehnt. V1/V2 bleiben lesbar, bekommen aber keine nachträgliche historische Vertrauensgarantie. Ohne vorhandenen Anker ist eine alte vollständige gültige Historie nicht als Rollback unterscheidbar. Im Arbeitsstand für 0.10.4 ergänzt das folgende V4-Checkpoint-Format die Hash-Kette. Aufbewahrung bleibt ohne erneute ausdrückliche Zustimmung deaktiviert.

## Remote V4: Checkpoint-Erweiterung (Arbeitsstand für 0.10.4)

V4: `{format:"atelier-encrypted-backup-4",descriptor,encrypted}`, Dateiname `snapshot-checkpoint-v1.json`. Keine Änderung des Sealed-Value-Formats, KDF, Descriptors oder Projektformats. V4 entschlüsselt ausschließlich mit dem aktuellen Tresorschlüssel; bei migrierten DEK-Vaults wird der Legacy-Fallback für diesen neuen Envelope-Typ deaktiviert. Alte Record-/V1–V3-Lesepfade bleiben unverändert. AAD bleibt `owner + ":snapshot"`. Der entschlüsselte vollständige Snapshot enthält `sync:{id,parents:[],parentHashes:[],digest,checkpoint}`.

`checkpoint` ist `{v:1,head:{id,hash},count,ancestors:[{id,hash},...]}`. `head` bezeichnet den bisherigen Chain-Head. `count` entspricht der Anzahl eindeutiger Vorfahren inklusive des bisherigen Heads und zuvor zusammengefasster IDs. Jeder Hash ist der bestehende nicht kanonisierte vollständige Envelope-Hash. Selbstreferenzen, Duplikate, ein fehlender/falscher `head`, mehr als 10.000 Einträge und widersprüchliche Zusammenfassungen vorhandener Checkpoints werden abgelehnt. Die erzeugte Hash-Liste ist nach ID sortiert. Alle bisherigen Checkpoint-Anker werden in neue Checkpoints übernommen. Der vollständige Record-Zustand wird wie beim Restore geprüft.

Die Hash-Kette endet beim entschlüsselten authentifizierten Checkpoint. Ein bekannter Anker muss mit exakt passendem Hash in seiner Liste liegen oder davor regulär erreicht werden. Spätere V3-Snapshots verketten sich auf den vollständigen V4-Envelope-Hash. Die Checkpoint-Liste ermöglicht den Graph-Abgleich trotz fehlender alter Dateien; vorhandene abgedeckte Dateien müssen ihre Hashes behalten. Dateinamen abgedeckter gewöhnlicher Snapshots bestimmen keine weiteren Graph-Kanten. Ein neues Gerät ohne erhaltenen Anker kann die Aktualität des angebotenen Checkpoints nicht belegen. Keine externe Signatur oder vertrauenswürdige Zeit.

Migration ist additiv und verlangt erneut bestätigte Aufbewahrung mit `checkpointVersion:1`. Alte Clients können V4 nicht lesen. Details zu Bestätigung, Unterbrechungen, V1/V2-Vertrauensgrenzen, Limits und Löschregeln: [CHECKPOINTS.md](CHECKPOINTS.md). Portable Backups bleiben unverändert und bewahren den jeweils bestätigten `trustedHead`; sie benötigen keine neue Dateiversion.

## CAS- und Outbox-Metadaten

Nicht Teil der verschlüsselten Projektformate: optional `meta.casOutbox` mit bereits verschlüsseltem Envelope, stabiler Operation/File-ID, Inhalts-Hash, Generation, erwarteter Head-Version und erwartetem Head. `meta.casVersion` zählt bestätigte Remote-Versionen. Die Function bestätigt Head und eindeutiges Receipt transaktional; das Verfahren und noch ungetestete Provider-Konfiguration stehen in [REMOTE-CAS.md](REMOTE-CAS.md). Default-Flag aus. Kein Admin-Key im Client. Owner, Größen, Versionen und Zugriffsmuster bleiben sichtbare Metadaten.

## Feste Testvektoren und Fuzz-Nachweise

`tests/vault-vectors.json` enthält feste öffentliche AES-Key-/IV-/Salt-/Passwort-/Recovery-Werte, PBKDF2-Ergebnis, V1-/gzip-V2-Ciphertexte und einen V2-Descriptor mit Epochen. Erzeugt unabhängig von den Produktionsfunktionen mit Node/OpenSSL `pbkdf2Sync`, `createCipheriv` und zlib. `vault-format.test.js` vergleicht die Produktionsableitung und AES-GCM-Ausgabe mit diesen Konstanten und entschlüsselt die festen Envelopes und Hüllen.

Ein deterministischer Fuzz-Lauf (Seed `0x103f00d`, 128 Mutationen) prüft den tatsächlichen Backup-Restore gegen Format-/Owner-/IV-/Cipher-/Versions-/Längen-Manipulationen und kontrolliert nach jedem Fall den unveränderten lokalen Datensatz. Zusätzliche authentifizierte ungültige Snapshots, doppelte IDs, falsche Hash-Anker und ein komprimierter Inhalt mit zu kleinem deklarierter Länge werden abgelehnt. Das ist ein begrenzter reproduzierbarer Test, kein vollständiges Fuzzing aller Parser und Browser.
