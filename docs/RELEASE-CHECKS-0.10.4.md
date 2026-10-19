# Atelier 0.10.4 – Gastmodus-Release

Stand: 19. Oktober 2026. Dieses Release ergänzt den historischen Checkpoint-Arbeitsstand aus [HARDENING-0.10.4.md](HARDENING-0.10.4.md) um eine ausschließlich lokale Demo und die Release-Artefakte. Private Tresore sind nur für bewusst eingerichtetes [Selbsthosting](SELF-HOSTING-VAULTS.md) vorgesehen. Kein unabhängiges Audit und keine Sicherheits-/Rechtskonformitätszusage.

## Was geändert wurde

- `src/managed-config.js`: `demoMode:true`, `enabled:false`, keine Betreiber-Projekt-/Bucket-IDs. Der Platzhalter `appwrite.invalid` ist kein konfigurierter Dienst. CAS bleibt aus.
- `src/app.js`: keine Managed- oder Legacy-Kontoinitialisierung in der Demo; Konto-, Registrierungs-, Einladungs- und Vault-Aktionen führen zum deutschen Gastmodus-Hinweis. Kein Registrierungsformular und kein automatischer Backend-Fallback. Gastprojekte bleiben lokal lesbar; vorhandene private Daten werden nicht gelöscht.
- `src/managed-account.js`: Initialisierung bei deaktiviertem Dienst ohne Anbieteranfrage, zusätzlicher SDK-Transport-Guard. Die bewusst konfigurierte Selbsthosting-Variante bleibt über einen gemockten Transport prüfbar.
- `index.html` und beide `_headers`-Beispiele: `connect-src 'self'`, keine Appwrite-Verbindungsfreigabe für die Demo. Eigene Vault-Hosts müssen ihre eigene exakte Provider-Origin bewusst ergänzen.
- Paket/Lock auf 0.10.4, Shell-Cache `atelier-shell-0.10.4-r1`, datierter Changelog, aktuelle Screenshot-/Download-Verweise und neue Selbsthosting-Anleitung.
- `scripts/package-release.mjs`: Source-ZIP aus öffentlicher Whitelist, separate SHA-256-Datei, keine Abhängigkeit erforderlich. Kein `.env`, `data`, `node_modules`, `dist`, Git-Verzeichnis, lokaler Providerbericht oder Log im Archiv. Symlinks und nicht freigegebene Quellpfade werden abgelehnt. `release/` ist ignorierter Ausgabeordner.
- Neue Node- und Browserprüfungen für den Gastmodus; bestehende private Editor-Fixture aktiviert ausschließlich ihren synthetischen Selbsthosting-Testkontext vor dem Modulstart. Keine Produktkonfiguration durch URL-Parameter oder Testdaten freischaltbar.

## Lokale Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| `npm run check` | Bestanden, Exit 0. |
| `npm test` | **245 bestanden, 0 fehlgeschlagen, 0 übersprungen**, Exit 0. Inklusive 4 neuer Demo-Tests und ZIP-/SHA-256-Prüfung. |
| `npm run build` | Bestanden, Exit 0; bestehendes SDK und öffentliche statische Ausgabe erzeugt. Keine neue Abhängigkeit. |
| `npm start` | Auf separater Origin `http://127.0.0.1:4190/` gestartet. Bestehender automatisierter Starttest ohne installierte Pakete bestanden. |
| Gastmodus-Browserprüfung | **5 bestanden, 0 fehlgeschlagen**; 35 beobachtete Ressourcen, 0 Fetch-/XHR-/WebSocket-Versuche, 0 Appwrite-/Drittanbieter-/API-Zugriffe im instrumentierten Test. |
| Vault-Browserprüfung | **18 bestanden, 0 fehlgeschlagen**, synthetische Selbsthosting-Fixtures, kein echter Anbieterzugriff. |
| Bestehende Editor-/Export-Browserprüfung | **16 bestanden, 0 fehlgeschlagen**; optionale eigene echte Testschrift nicht ausgeführt. |
| Appwrite-Konsole | Vom Nutzer bestätigt: Demo-Hostnamen entfernt. Keine eigene Admin-Nachprüfung; keine behauptete Projektstilllegung. |

Die neue Browser-Fixture `tests/demo-browser.html` lädt dieselbe `src/app.js` mit derselben Meta-CSP wie die Demo. Vor dem App-Start protokolliert sie `fetch`, XHR und WebSocket-Versuche sowie Resource-Timing-Einträge und zeigt das Ergebnis in der Oberfläche. Sie prüft auch direkte Aktionsnamen, lokales Speichern/Wiederladen und einen bewussten JSON-Export. Das ist ein instrumentierter Browsernachweis, **kein Mitschnitt sämtlicher Betriebssystem-, Erweiterungs- oder Service-Worker-Netzwerkaktivitäten und kein behaupteter Blick in DevTools**. Die beobachteten Seitenaufrufe und Aktionen verursachten keine Appwrite-/Drittanbieter-/Legacy-API-Anfragen. Ein vorhandener SW wird weiterhin durch die bestehenden eigenen Tests auf seine feste Cache-Whitelist geprüft.

Der Gastmodus-Nachweis ist keine serverseitige Sperre des früheren Appwrite-Projekts. Der Projektinhaber hat in dieser Sitzung bestätigt: **Demo-Hostnamen entfernt**. Das wurde nicht mit administrativem Zugriff nachgeprüft. Keine Behauptung einer vollständigen Projektstilllegung, Nutzer-/Dateilöschung oder Aufhebung bereits bestehender Sitzungen. Entfernte Browser-Plattformen allein sperren nicht jeden beliebigen API-Client.

## Veröffentlichung und Live-Prüfung

Das geprüfte Quellpaket wird separat mit der zugehörigen `.sha256` veröffentlicht. Seine Prüfsumme steht außerhalb des Archivs; dadurch entsteht keine Selbstreferenz der ZIP-Prüfsumme. Der Pakettest vergleicht die tatsächlich erzeugten Bytes und den Inhalt der Sidecar-Datei.

GitHub Actions führt Check/Test/Build aus. Das vorhandene Pages-Workflow-Deployment wird ausdrücklich gestartet; eine lokale erfolgreiche Prüfung allein gilt nicht als Deployment. Der tatsächliche Workflow-/Release-/Live-Nachweis wird nach dem Upload im Release beziehungsweise im Arbeitsbereich festgehalten. [Workflow](https://github.com/m4z8p6fy9m-coder/atelier-design-studio/actions/workflows/pages.yml), [Release](https://github.com/m4z8p6fy9m-coder/atelier-design-studio/releases/tag/v0.10.4), [Demo](https://m4z8p6fy9m-coder.github.io/atelier-design-studio/).

Ein echtes Inkognito-Fenster wird von den aktuell verfügbaren Browserwerkzeugen nicht angeboten. Eine neue normale Registerkarte wird deshalb nicht als Inkognito ausgegeben. Nach dem Deployment soll die Live-Demo zusätzlich in einem vom Nutzer geöffneten privaten Fenster geprüft werden. Vorhandene Website-Daten oder private Vaults werden zu Testzwecken nicht gelöscht. Bei einer bestehenden Installation gegebenenfalls das angebotene App-Update laden; alte Offline-Shells und bereits kopierte Clients sind nicht aus der Ferne zurückholbar.

## Weiter offen

Kontolöschung und kombinierter Metadatenexport aus dem vorigen Plan sind nicht implementiert. Juristische Entwürfe/Rechtsprüfung sind nicht Teil dieses Gastmodus-Releases. Echte Appwrite-Zwei-Nutzer-Isolation, Mailzustellung, produktive Vault-Migrationen und ein CAS-Deployment wurden hier nicht neu geprüft. DEK-Rotation, Remote-Descriptor-Root-Reparatur, Quoten-/Missbrauchsregeln und die in den Hardening-Berichten beschriebenen Vertrauensgrenzen bleiben offen. Gastprojekte sind keine verschlüsselten privaten Vaults; lokale Browserdaten können verloren gehen, weshalb bewusste Projekt-Exporte wichtig bleiben.
