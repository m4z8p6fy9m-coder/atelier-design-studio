> Managed accounts in 0.10: the default client uses Appwrite and separate encrypted vaults. This document describes the optional legacy Node server (`managedConfig.enabled=false`), whose shared projects are not end-to-end encrypted. See [private vaults](PRIVATE-VAULTS.md).

# Echte Konten in der öffentlichen Atelier-App

## Aktueller Stand

Der beiliegende Node-Server implementiert Registrierung mit E-Mail-Code, Anmeldung, Passwort-Wiederherstellung und kontoabhängige Projektberechtigungen. Die öffentliche GitHub-Pages-Version ist dagegen ein statischer Editor: Sie kann diesen Server nicht ausführen und stellt keine öffentliche Kontendatenbank bereit.

Eine Anmeldung allein verschlüsselt keine Designinhalte gegenüber dem Hoster. Der aktuelle Online-Projektserver speichert Dokumente lesbar. Ihn nicht als Ende-zu-Ende-verschlüsselten oder unabhängig sicherheitszertifizierten Dienst bezeichnen.

## Für einen echten Kontenbetrieb erforderlich

1. Ein Hosting-Dienst für eine Node-Anwendung bzw. den mitgelieferten Docker-Container.
2. Dauerhafter Speicher für `ATELIER_DATA_DIR`. Flüchtiger Container-Speicher reicht nicht: Konten und Projekte müssen Neustarts und Deployments überstehen.
3. Eine öffentliche HTTPS-Adresse in `PUBLIC_URL`. Website und API werden unter derselben Adresse ausgeliefert. Die vom Hosting-Anbieter bereitgestellte Adresse kann verwendet werden; eine gekaufte Domain ist nicht zwingend erforderlich.
4. Ein gültiger Mailanbieter. Für den vorhandenen Gmail-Adapter wird ein eigenes 16-stelliges Google-App-Passwort benötigt. Normale Gmail-Passwörter gehören nicht in diese Konfiguration.
5. Ein stabiler zufälliger `AUTH_SECRET`, mindestens 32 Zeichen. Zugangsdaten ausschließlich in den Secret-Einstellungen des Hosts bzw. in einer lokalen `.env` hinterlegen, niemals im Repository, README oder Chat.
6. Backups und ein überprüfter Wiederherstellungsablauf. Der bisherige Dateispeicher ist für eine einzelne kleine Serverinstanz vorgesehen.

Vor dem Start lokal prüfen:

```sh
npm ci --ignore-scripts
npm run auth:check
npm run mail:verify
```

Die SMTP-Prüfung versendet keine Nachricht. Erst eine tatsächlich empfangene Registrierungsmail bestätigt die vollständige Zustellung. Für einen öffentlichen Dienst sind Zustelllimits, Spam-Schutz, Datenaufbewahrung und Betriebsüberwachung zusätzlich zu berücksichtigen.

## Projekte gehören zum Konto

Im bestehenden Servermodus wird ein Projekt über **Teilen → Online-Kopie speichern** dem angemeldeten Konto zugeordnet. Änderungen dieser Kopie werden danach synchronisiert. Nach einer Anmeldung auf einem anderen Gerät können die Online-Projekte über **Konto & Online** geöffnet werden. Rein lokale Entwürfe werden dadurch nicht automatisch hochgeladen.

Für die Anforderung „Der Hoster darf die Designs nicht lesen“ muss vor einer automatischen Kontenspeicherung eine zusätzliche clientseitige Verschlüsselung mit Schlüsselverwaltung implementiert und getestet werden. Ein E-Mail-Passwortreset darf dabei nicht stillschweigend Zugriff auf alte verschlüsselte Inhalte gewähren: Dafür braucht es etwa einen getrennten Tresorschlüssel oder eine explizite Wiederherstellungslösung.

Auch mit clientseitiger Verschlüsselung bleiben Grenzen: Ein geänderter ausgelieferter Web-App-Code, bösartige Browser-Erweiterungen oder ein kompromittiertes entsperrtes Gerät können Daten abgreifen. Ein lokaler, überprüfter Build reduziert die direkte Abhängigkeit vom laufend ausgelieferten Hosting-Code.

## Vor der Freigabe testen

- Registrierung: richtiger Code, falscher Code, Ablauf, erneuter Versand und Versandlimits.
- Passwort vergessen: E-Mail-Empfang, einmalige Verwendung und Abmeldung bisheriger Sitzungen.
- Zwei Konten: kein Zugriff auf fremde Projekte, auch nicht durch direkte API-Anfragen.
- Serverneustart: Konten und Projekte bleiben erhalten.
- Verschlüsselter Modus, sobald implementiert: persistierte Daten und Netzwerkübertragung enthalten keine lesbaren Designinhalte; verlorene Schlüssel und Wiederherstellung sind ausdrücklich getestet.

Der Dockerfile enthält die PWA-Dateien und eine HTTP-Healthcheck-Anweisung. Sein tatsächlicher Bau und Betrieb beim gewählten Hosting-Anbieter müssen dort geprüft werden.
