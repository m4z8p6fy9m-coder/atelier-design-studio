# Isolierte Provider-Prüfung

Stand: 19. Oktober 2026. `node scripts/provider-check.mjs` benutzt nur Node-Bordmittel. Es lädt keine `.env` automatisch und läuft nicht als Teil von `npm start` oder des Produktionsbuilds. Ohne vollständige Freigabe wird ausschließlich ein Markdown-Bericht „NICHT AUSGEFÜHRT“ erstellt (Exit 2), ohne Netzwerkzugriff.

Erforderliche Prozess-Umgebung:

| Variable | Zweck |
|---|---|
| `APPWRITE_TEST_ENDPOINT` | HTTPS-API-Endpunkt mit `/v1`, ohne URL-Zugangsdaten |
| `APPWRITE_TEST_PROJECT` | ausschließlich separates, wegwerfbares Testprojekt |
| `APPWRITE_TEST_API_KEY` | nur lokal: Testnutzer/Sessions anlegen und löschen, Dateien bereinigen; niemals committen |
| `APPWRITE_TEST_BUCKET` | separater Test-Bucket, File Security an, CREATE für angemeldete Testnutzer, keine globalen READ/UPDATE/DELETE-Rechte |
| `APPWRITE_TEST_EMAIL_DOMAIN` | reservierte Testdomain, etwa `example.test` oder `atelier.invalid`; keine echten Mail-Empfänger |
| `APPWRITE_TEST_CONFIRM` | exakt `ISOLATED_TEST_PROJECT` |
| `APPWRITE_TEST_REPORT` | optionaler lokaler Berichtspfad; Standard `provider-check.local.md` (gitignoriert) |

Variablen außerhalb des Repositories über die lokale Prozessumgebung setzen. Das Skript erzeugt zwei zufällige Testnutzer mit zufälligen Passwörtern, erstellt ausschließlich für diese Nutzer Sessions und lädt je eine kleine synthetische JSON-Datei unter deren Session hoch. Es prüft beide Zugriffsrichtungen und anonyme GET-Metadaten, GET-Inhalt, PATCH und DELETE. Nur 401/403/404 werden als Verweigerung akzeptiert; 429/5xx sind kein erfolgreicher Berechtigungsnachweis. Danach muss der jeweilige Owner die Datei unverändert lesen können.

Im `finally` werden ausschließlich vom Lauf erfolgreich angelegte Dateien und Nutzer per Test-Admin-Key bereinigt. Bei Prozessabbruch oder unbekanntem Erstellungs-Ergebnis können Reste im isolierten Projekt verbleiben. Fehlgeschlagene Bereinigung wird im Bericht als Fehler erfasst. Das Skript löscht keine bestehenden fremden Projektressourcen und sendet keine OTP-E-Mails. Es validiert keine echte E-Mail-Zustellung.

Bericht und Konsole enthalten keine Provider-Antworttexte, Keys, Sessions, Passwörter, Mailadressen oder Ressourcen-IDs. Secrets auch nicht an den Chat schicken. Exit 0 bedeutet bestandenen Lauf, Exit 1 Fehler, Exit 2 fehlende Freigabe. Der aktuelle Entwicklungsnachweis stammt ausschließlich aus drei automatisierten Skript-Tests mit Fake-HTTP; der tatsächliche Skriptaufruf wurde mangels Testumgebung ohne Netzwerk beendet. Ein echter Zwei-Nutzer-Providerlauf steht aus.

Referenzen: [Appwrite Users API](https://appwrite.io/docs/references/cloud/server-nodejs/users), [Sessions](https://appwrite.io/docs/references/cloud/models/session), [REST](https://appwrite.io/docs/apis/rest).
