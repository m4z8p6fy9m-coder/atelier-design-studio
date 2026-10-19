# Chunking und Deduplizierung – nur Entwurf

Stand: 19. Oktober 2026. Nicht implementiert und kein Bestandteil des 0.10.3-Datenformats.

## Vorschlag

1. Datensätze vor Verschlüsselung komprimieren, große Assets in feste 256-KiB-Chunks zerlegen. Content-defined Chunking erst anhand echter Bearbeitungsmuster bewerten; es ist komplexer als feste Grenzen.
2. Deduplizierung ausschließlich innerhalb eines Tresors. Öffentliche SHA-256-IDs lesbarer Inhalte erlauben Wörterbuch-/Gleichheitsabgleiche. Stattdessen zukünftig einen im DEK-Keyring umhüllten Indexschlüssel für HMAC-SHA256 verwenden. Dieser neue Schlüssel ist Teil des Entwurfs, wird jetzt nicht erzeugt. Keine globale kontenübergreifende Deduplizierung.
3. Jeden neuen Chunk einmal mit zufälligem AES-GCM-IV verschlüsseln; ID, Owner, Tresor-ID, Format, Codec und Länge im AAD binden. Wiederverwendung referenziert vorhandene Ciphertexte. Ein kompromittierter Index darf keine fremden Dateien referenzieren können; Ownerrechte und Inhaltsauthentifizierung bleiben erforderlich.
4. Ein verschlüsseltes unveränderliches Manifest beschreibt Projekte/Versionen/Assets und ihre Chunk-Referenzen. Sein vollständiger Envelope-Hash bildet den Snapshot-Head. Veröffentlichungen erfolgen erst, wenn sämtliche Chunks bestätigt sind, über den noch ausgeschalteten CAS-Pfad.
5. Die Outbox speichert pro Chunk eine feste Datei-ID und Upload-Bestätigung. Abbruch/Neustart lädt keine bestätigten Chunks doppelt hoch. Gleichzeitige Nutzergeräte brauchen transaktionale Manifest-/Lease-Zuordnung.
6. Garbage Collection erfordert eine bestätigte Menge erreichbarer Manifeste **und** aller offenen Upload-Leases. Ein einfaches Alter oder lokaler Referenzzähler genügt nicht. Zunächst ausschließlich Diagnose, keine automatische Löschung. Wiederherstellung aus portablen Backups muss unabhängig von Remote-Chunks bleiben.

## Migration und Grenzen

Projektdateien bleiben unverändert. Ein neues äußeres Vault-/Manifestformat liest die heutigen vollständigen Snapshots weiter; eine explizite Migration erzeugt erst nach überprüfbarem Export das erste Chunk-Manifest. Alte Clients können es nicht schreiben. Bestehende 1000-Dateien-Grenzen, Bereinigung und Quotenanzeige müssen angepasst werden. Viele kleine Dateien verursachen zusätzliche Requests, Metadaten und mögliche Providerlimits. Bei einem 20-MiB-Asset ergeben sich etwa 80 Chunks plus Manifest. Tatsächliche Providerkosten/Free-Limits sind vor Implementierung zu prüfen, nicht aus dieser Schätzung abzuleiten.

Verschlüsselte Deduplizierung macht Gleichheit, Wiederverwendung und Zugriffsmuster teilweise sichtbar. Kompression kann Längeninformationen und bei geeignetem Angreifermodell adaptive Seitenkanäle schaffen. Schlüsselrotation muss Chunk- und Indexschlüssel sowie alle Referenzen berücksichtigen. Es gibt hier keinen Nachweis, dass alle nötigen GC-/CAS-Eigenschaften erfüllt wären.

## Aufwandsschätzung (Entwicklungstage, eine Person)

| Arbeitspaket | Schätzung |
|---|---:|
| Format, Bedrohungsmodell und Migration | 2–4 |
| Chunk-/Index-/Manifest-Implementierung | 3–5 |
| CAS-/Outbox-/Lease-Integration | 3–5 |
| Portable Exporte und Wiederherstellung | 2–4 |
| Race-, Quota-, Browser-, Fuzz- und Lasttests | 4–6 |
| Review, Dokumentation und Pilotmigration | 2–4 |

Insgesamt etwa **16–28 Entwicklungstage**, zusätzlich unabhängiges Review und Reserve für Provider-/Migrationsprobleme. Ohne reale Testdaten sind Speicherersparnis und Durchsatz offen. Vorher die Kompressions-/Quota-Messungen aus 0.10.3 verwenden; kein positiver Deduplizierungsgewinn wird vorausgesetzt.
