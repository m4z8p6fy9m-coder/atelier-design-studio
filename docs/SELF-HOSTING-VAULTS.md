# Private Tresore selbst betreiben

Stand: 19. Oktober 2026 · Atelier 0.10.4. Die öffentliche GitHub-Pages-Demo und das unveränderte Download-Paket starten **ausschließlich im Gastmodus**. Gastdaten sind im Browser lesbar gespeichert. Private Tresore, Registrierung und Cloud-Synchronisation werden erst in deiner eigenen Installation bewusst aktiviert. Es wird kein gemeinsamer Kontendienst bereitgestellt.

## Vorher sichern

Bestehende Tresore werden durch den Demo-Modus weder geöffnet noch gelöscht. Die bisherigen Daten bleiben an Browser, Origin und Backend gebunden. Vor Umzug auf eine andere Adresse aus der bisherigen Installation ein verschlüsseltes portables Backup und den Recovery-Key separat sichern. Ein fremdes neues Appwrite-Projekt enthält deine bisherigen Accounts/Descriptoren nicht. Keine leere Schlüsseldatei über einen vorhandenen Tresor schreiben. Bei verlorenem Online-Descriptor den dokumentierten Offline-Import nutzen und die offenen Grenzen im Prüfbericht beachten.

## Eigene Installation einrichten

1. Source-ZIP entpacken oder Repository klonen. `npm start` benötigt keine Paketinstallation; Node.js ab 20.12 muss vorhanden sein. Für einen neu erzeugten statischen Build die gepinnten Abhängigkeiten mit `npm ci --ignore-scripts` installieren und `npm run build` ausführen. Keine weiteren Pakete hinzufügen.
2. Ein **eigenes** Appwrite-Projekt und einen eigenen Bucket anlegen. Den genauen Hostnamen deiner Installation als Web-Plattform eintragen; lokal verwendest du den tatsächlich geöffneten Host, etwa `127.0.0.1`. Kein fremder Demo-Hostname und keine Wildcard. Endpunkt/Projekt-ID aus deiner Konsole übernehmen. Hintergrund: [offizieller Web-Quickstart](https://appwrite.io/docs/quick-starts/web).
3. Bucket: File Security einschalten. Auf Bucket-Ebene nur CREATE für angemeldete Nutzer; keine globalen READ-/UPDATE-/DELETE- oder Gastrechte. Atelier vergibt eigene Read-/Update-/Delete-Rechte pro Datei. Wichtig: Bucket- **oder** Dateiberechtigungen können Zugriff geben, deshalb ist ein globales Leserecht kein Ersatz für File Security. Einstellungen speichern und nochmals prüfen. [Offizielle Storage-Permissions](https://appwrite.io/docs/products/storage/permissions).
4. Dateityp `json`, maximal 20 MB. Die aktuelle App begrenzt Uploads entsprechend; Providerkontingente, Mailzustellung und Kosten musst du für dein tatsächliches Projekt prüfen. Keine dauerhafte Gratiszusage. CREATE für angemeldete Nutzer erzwingt noch keine serverseitige E-Mail-Verifizierung oder faire Upload-Quote.
5. In `src/managed-config.js` **alle** Platzhalter durch eigene öffentliche Werte ersetzen:

```js
export const managedConfig={
  demoMode:false,
  enabled:true,
  endpoint:'https://DEIN-APPWRITE-HOST/v1',
  project:'DEINE-PROJEKT-ID',
  bucket:'DEINE-BUCKET-ID',
  remoteCAS:{enabled:false,functionId:''}
};
```

Die Großbuchstabenwerte sind Platzhalter und funktionieren nicht unverändert. **Keine** Admin-API-Keys, Passwörter oder SMTP-Zugangsdaten im Browsercode ablegen. Für dieses statische SDK-Setup sind `.env` und der Legacy-Server nicht erforderlich.

6. In der Meta-CSP von `index.html` `connect-src 'self'` gezielt um die HTTPS-Origin deines eigenen Endpunkts ergänzen; falls eine verwendete Funktion tatsächlich WebSockets benötigt, auch deren exakte WSS-Origin. Beispielsyntax: `connect-src 'self' https://DEIN-APPWRITE-HOST wss://DEIN-APPWRITE-HOST`. Keine Wildcards. Dieselbe Anpassung in tatsächlich ausgelieferten HTTP-CSP-Headern vornehmen; mehrere Policies gelten gleichzeitig. [Header-Anleitung](CSP-HEADERS.md). Die Beispiele werden nicht automatisch von GitHub Pages angewendet.
7. `npm run check`, `npm test`, `npm run build`; danach eigene Installation starten/deployen und echte Zwei-Nutzer-Isolation in einem separaten Testprojekt nachweisen. Das vorhandene [Provider-Skript](PROVIDER-CHECK.md) läuft nur mit vollständiger ausdrücklich gesetzter Testumgebung. Mailzustellung, Rechte, Quoten und Wiederherstellung sind durch lokale Doubles nicht belegt.

## Betrieb und Grenzen

Recovery-Key getrennt sichern und die geforderte Teileingabe abschließen. Vor Migration/Pruning unabhängiges verschlüsseltes Backup herunterladen. Checkpoint-Aufbewahrung bleibt standardmäßig aus und verlangt erneute Zustimmung; alle Geräte vorher aktualisieren. Ohne alten Hash-Anker erkennt ein neues Gerät keinen vollständig gültigen alten Remote-Stand. Der CAS-Prototyp bleibt ausgeschaltet und erfordert ein eigenes überprüftes Function-/Datenbank-Setup.

Die Gastmodus-Demo ist keine Zugriffssperre für ein früher öffentlich konfiguriertes Appwrite-Projekt: alte Versionen, Forks oder andere Clients können weiter existieren. **Nur der Projektinhaber** soll in seiner Appwrite-Konsole nicht mehr benötigte Demo-Plattformen entfernen beziehungsweise das Projekt über tatsächlich angebotene Betreiberfunktionen deaktivieren. Verfügbare Optionen in der Konsole prüfen. Eine entfernte Browser-Origin allein ist keine allgemeine API-Abschaltung; bestehende Sitzungen/Nutzer/Dateien werden dadurch nicht automatisch gelöscht. Vor einer umfassenden Stilllegung die Auswirkungen auf bisherige Nutzer klären. Atelier nimmt hier keine Betreiberänderung vor.

Für den optionalen bisherigen Node-Kontendienst: `demoMode:false`, `enabled:false` und bewusster Betrieb von `npm run cloud` mit eigener Serverkonfiguration. Sein Code bleibt unverändert; private DEK-Vaults sind ein getrenntes Verfahren. Niemals den unveränderten Gastmodus-Download als öffentliche Kontenplattform bewerben.

Kein unabhängiges Audit. Kontolöschung und kombinierter Metadatenexport sind weiterhin nicht implementiert. Alte Passwort-/Recovery-Hüllen können alte Datenschlüssel weiter freigeben; V4 begrenzt den Legacy-Fallback nur für Checkpoints, nicht für sämtliche alten Formate. Böswillig ausgelieferter JavaScript-Code, kompromittierte Geräte und Speicherlöschung im Browser bleiben Grenzen. Details: [FORMAT.md](FORMAT.md), [Checkpoint-Prüfbericht](HARDENING-0.10.4.md), [Release-Prüfbericht](RELEASE-CHECKS-0.10.4.md).
