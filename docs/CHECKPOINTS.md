# Checkpoints und Aufbewahrung – Arbeitsstand für 0.10.4

Stand: 19. Oktober 2026. Implementierter Protokollzusatz, kein externes Sicherheitsreview. „Beglaubigt“ bedeutet hier ausschließlich: mit dem vorhandenen Tresorschlüssel durch AES-GCM authentifiziert. Bei einem migrierten DEK-Vault akzeptiert V4 ausschließlich den aktuellen DEK, nicht den für alte Records erhaltenen Legacy-Schlüssel. Bestehende Record-/V1–V3-Lesepfade behalten ihren Fallback; deren bekannte Grenzen werden hier nicht insgesamt behoben. Es gibt weder eine unabhängige Beglaubigungsstelle noch eine Signatur eines Servers oder eine vertrauenswürdige Uhr.

## Format

Ein neuer Remote-Envelope hat `format: "atelier-encrypted-backup-4"`, denselben umhüllten `descriptor` wie V3 und ein `encrypted`-Feld. Schlüssel, KDF und AAD bleiben unverändert: `owner + ":snapshot"`, mit der bestehenden V1-/V2-Sealed-Value-Konstruktion. Der Dateiname ist `snapshot-checkpoint-v1.json`. Ältere Clients kennen diesen Namen/dieses Format nicht und brechen ab; alle verwendeten Geräte vor Aktivierung aktualisieren.

Der verschlüsselte Inhalt enthält den **vollständigen** `atelier-snapshot-1`-Zustand mit allen verschlüsselten Records. Dazu kommt:

```json
{
  "sync": {
    "id": "checkpointFileId",
    "parents": [],
    "parentHashes": [],
    "digest": "SHA256-des-sortierten-Record-Arrays",
    "checkpoint": {
      "v": 1,
      "head": {"id": "bisherigerHead", "hash": "64-Hex-Zeichen"},
      "count": 2,
      "ancestors": [
        {"id": "bisherigerHead", "hash": "64-Hex-Zeichen"},
        {"id": "vorherigerSnapshot", "hash": "64-Hex-Zeichen"}
      ]
    }
  }
}
```

Die Werte im Beispiel sind Platzhalter, kein Testvektor. `count` ist die Anzahl eindeutiger zusammengefasster Datei-IDs, einschließlich des bisherigen Heads und gegebenenfalls älterer Checkpoints. Die Liste ist nach IDs sortiert; ihre Länge muss `count` entsprechen. IDs entsprechen den bestehenden Provider-ID-Regeln, Hashes sind SHA-256 über `JSON.stringify` des vollständigen Remote-Envelopes, wie in [FORMAT.md](FORMAT.md). Die Serialisierung wird nicht kanonisiert. Selbstverweise, doppelte IDs, ein fehlender/falscher bisheriger Head, unzulässige Hashes und mehr als 10.000 Einträge werden abgelehnt.

Spätere gewöhnliche V3-Snapshots referenzieren die Checkpoint-ID und ihren vollständigen Envelope-Hash in `parentHashes`. Sie benötigen keine gelöschten Vorgänger des Checkpoints mehr.

## Erstellung und Bestätigung

1. Aufbewahrung ist aus, bis die verschlüsselte Kontoeinstellung `{enabled:true, checkpointVersion:1}` ausdrücklich gesetzt wird. Vorhandenes `{enabled:true}` ohne Protokollversion bleibt deaktiviert. Keine IndexedDB-Schemaänderung, keine Umschreibung vorhandener Record-/Projekt-/Descriptor-Dateien.
2. Beim nächsten Upload mit mindestens einem bereinigungsfähigen, noch nicht zusammengefassten Vorgänger wird ein Checkpoint statt eines zusätzlichen gewöhnlichen Snapshots erstellt. Ohne geeignete alte Dateien entsteht kein Checkpoint. Unveränderte Inhalte erzeugen weiterhin keinen zusätzlichen vollständigen Upload.
3. Vorher: vollständige Online-Liste, genau ein Head, Prüfung des lokalen Ankers und der verfügbaren V3-Hash-Kette bis zur Wurzel oder einem vorhandenen Checkpoint. Alle zusammengefassten vorhandenen Dateien werden gelesen und entschlüsselt; fehlende unzusammengefasste Vorgänger verhindern die Erstellung. Der neue vollständige Zustand durchläuft dieselbe Record-/Modellprüfung wie eine Wiederherstellung.
4. Ein weiterer Checkpoint übernimmt die **gesamte** Hash-Liste früherer Checkpoints, einschließlich bereits entfernter Dateien, sowie die Hashes der noch nicht zusammengefassten Vorgänger. Widersprüche werden abgelehnt. Damit bleibt ein alter Anker prüfbar, auch wenn sein erster Checkpoint später entfernt wurde.
5. Nach Upload wird die Online-Liste erneut geprüft. Der Checkpoint wird tatsächlich zurückgelesen, sein vollständiger Envelope-Hash muss dem Upload entsprechen, und sein Inhalt wird entschlüsselt sowie strukturell/inhaltlich validiert. Vorhandene abgedeckte Dateien müssen die angegebenen Envelope-Hashes besitzen. Erst bei genau einem passenden Head wird der lokale Head atomar bestätigt. Vor jedem Löschen erfolgt nochmals ein Online-Abgleich und eine vollständige Prüfung der noch benötigten Kette zum Checkpoint.
6. Im optionalen, standardmäßig ausgeschalteten CAS-Prototyp läuft derselbe Checkpoint durch die bestehende dauerhafte Outbox und Head-Transaktion. Die Function akzeptiert zusätzlich V4; sie entschlüsselt oder beglaubigt den Inhalt nicht. Vor Einsatz muss die aktualisierte Function separat ausgerollt und im Testprojekt geprüft werden. Kein Live-CAS-Nachweis in diesem Arbeitsstand.

V1/V2-Historien bleiben lesbar. Ein Checkpoint kann ihre aktuell vorgefundenen und entschlüsselten Dateien zusammenfassen; V1-Dateien besitzen aber keine authentifizierte historische Reihenfolge, V2 keine Vorgänger-Envelope-Hashes. Deren vorherige Echtheit/Reihenfolge wird dadurch **nicht nachträglich bewiesen**. Der neue lokale Hash-Anker beginnt beim ausdrücklich bestätigten Stand. Direkt passwortbasierte V1-Descriptoren sowie vorhandene DEK/KEK-Vaults werden nicht ersetzt.

## Prüfung beim Laden

Der Client entschlüsselt Checkpoints, bevor er ihre Hash-Listen als virtuelle Graph-Kanten verwendet. Noch vorhandene abgedeckte Dateien werden gegen ihre Hashes geprüft. Ein neuer Checkpoint, der einen älteren Checkpoint abdeckt, muss dessen komplette Liste unverändert übernehmen. Dateinamen abgedeckter gewöhnlicher Snapshots erzeugen keine zusätzlichen Graph-Kanten: ein geänderter alter Name darf keinen unabhängigen Konfliktzweig verstecken.

Mit vorhandenem Anker muss entweder die normale Hash-Kette den exakt passenden `(id, hash)`-Anker erreichen oder ein erreichter Checkpoint genau diesen Eintrag enthalten. Gleiche ID mit anderem Hash reicht nicht. Ein pruned Anker muss nicht mehr als Datei vorhanden sein. Fehlt der Anker, wird vor automatischer Übernahme abgebrochen. Auch eine bestehende alte Head-ID ohne Hash wird beim Übergang nicht stillschweigend ignoriert; das ist lediglich ein ID-Warnhinweis.

**Ohne bisherigen lokalen oder aus einem Backup übernommenen Anker vertraut ein neues Gerät dem angebotenen Checkpoint nur so weit wie dem Remote-Stand.** Eine ältere vollständig gültige Historie mit einem älteren gültigen Checkpoint ist dann nicht als Rollback unterscheidbar. Ein Checkpoint liefert weder globale Aktualität noch eine vertrauenswürdige Zeit. Wer den DEK besitzt oder bösartigen Anwendungscode ausliefert, liegt außerhalb des hier getesteten Schutzmodells.

## Löschregeln und Unterbrechungen

- Nur abgedeckte Snapshot-Dateien sind Kandidaten. Descriptoren, Descriptor-Kopien und nicht abgedeckte Zweige werden nicht bereinigt.
- Mindestens die zehn nach Provider-Datum neuesten Dateien bleiben erhalten; außerdem aktueller Head, aktueller lokaler Hash-Anker und der vor diesem Upload verwendete Anker. Ein vor dem Upload geschützter Anker kann in späteren Durchläufen nach Fortschreibung des eigenen Ankers Kandidat werden.
- Kandidaten müssen nach Provider-Datum mehr als 30 Tage alt sein. Keine Berechnung anhand einer möglicherweise vorgehenden lokalen Uhr. Höchstens drei Löschungen pro Durchlauf.
- Vor jeder Löschung: unveränderter sauberer lokaler Head, genau ein Online-Head, gültige zum bestätigten Checkpoint verkettete Inhalte, exakter Hash der abgedeckten Datei, ausschließlich eigene Read-/Update-/Delete-Rechte und erneute Prüfung der angemeldeten Account-ID. Bei einer Abweichung wird gestoppt.
- Erst vollständigen Checkpoint speichern und bestätigen, dann einzelne alte Dateien entfernen. Es gibt keinen Zustand, in dem für die Wiederherstellung erst ein halber Checkpoint fertiggeladen werden müsste. Ein Netzwerkfehler kann einige alte Dateien übriglassen; der bestätigte vollständige Zustand bleibt vorhanden. „Jetzt online sichern“ nimmt bei sauberem Zustand die Bereinigung ohne neuen Snapshot wieder auf.
- Zwischen Online-Prüfung und einzelner Löschung besteht ohne serverseitige Transaktion ein Zeitfenster. Es wird keine atomare globale Mehrgeräte-Bereinigung behauptet. Der Löschkandidat bleibt durch einen vollständigen bestätigten Checkpoint abgedeckt; konkurrierende Änderungen führen beim nächsten beobachteten Konflikt zum Stopp. Eine verlorene Löschantwort wird durch erneutes Listen behandelt, nicht durch Annahme einer erfolgreichen Löschung.

## Grenzen und Betrieb

Die aktuelle Implementierung nutzt eine Hash-Liste statt einer Merkle-Wurzel. Sie wächst linear und bewahrt Hash-/ID-Metadaten dauerhaft im verschlüsselten Zustand. 10.000 zusammengefasste IDs, 1.000 gleichzeitig gelistete Provider-Dateien und die vorhandenen Byte-Grenzen sind harte Grenzen; darüber wird abgebrochen. Das Verfahren beseitigt weder Quotenprobleme noch die Kosten der vollständigen Snapshots. Prüfungen können erhebliche zusätzliche Downloads erfordern. Merkle-Beweise/Chunking sind nicht implementiert.

Ein Prüffehler löscht keine verdächtigen Dateien zur „Reparatur“. Ein hochgeladener, aber nicht lokal bestätigbarer Checkpoint kann als Konflikt liegenbleiben; vorhandenen Stand und Backup sichern, dann bewusst über die bestehende Konfliktoberfläche prüfen. Alte App-Versionen nicht parallel weiterverwenden. Kein automatisches Downgrade nach Pruning.

Tests und noch ausstehende Provider-/Browser-Nachweise stehen in [HARDENING-0.10.4.md](HARDENING-0.10.4.md). Ein verschlüsselter Download vor der Aktivierung und unabhängige zusätzliche Kopien bleiben eine bewusste Nutzerentscheidung; die Aufbewahrung alter Cloud-Dateien ersetzt kein separat aufbewahrtes Backup.
