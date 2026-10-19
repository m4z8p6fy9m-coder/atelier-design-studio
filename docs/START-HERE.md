# Atelier 0.10.4 — in zwei Minuten starten

Atelier ist ein Design-Editor für aktuelle Desktopbrowser. Das ZIP enthält den Quellcode und Startdateien. Es ist kein eigenständiges Installationsprogramm und benötigt **Node.js ab Version 20.12**.

## Windows

1. Node.js von [nodejs.org](https://nodejs.org/) installieren, falls noch nicht vorhanden.
2. `Atelier-v0.10.4.zip` vollständig in einen eigenen Ordner entpacken. Nicht direkt aus der ZIP starten.
3. Im entpackten Ordner `START-WINDOWS.cmd` doppelklicken. Das Terminalfenster geöffnet lassen.
4. Im Browser **http://127.0.0.1:4173** öffnen.
5. Unter **Ein starker Anfang. Vier fertige Seiten.** ein Starter-Kit öffnen. Texte bearbeiten und oben rechts **Exportieren** wählen.

## macOS / Linux / Terminal

Nach Installation von Node.js im entpackten Projektordner:

```sh
npm start
```

Dann http://127.0.0.1:4173 öffnen. Für den statischen Editor ist kein `npm install` erforderlich. Falls der Port belegt ist, den anderen Atelier-Server schließen oder dessen bestehende Adresse verwenden.

## Deine ersten fünf Minuten

- **Creator Carousel:** vier Seiten für eine Geschichte, einen Tipp oder deinen nächsten Post.
- **Product Story:** stelle ein Problem, deine Lösung und den nächsten Schritt vor.
- **Study Notes:** strukturiere ein Lernthema mit Erklärung, Beispiel und Selbstkontrolle.
- Die Seitenleiste unten wechselt zwischen den vier Seiten. Alle Texte und Formen sind editierbar.
- **Strg/Cmd+K** öffnet die Befehlssuche. **Strg/Cmd+Z** macht Änderungen rückgängig.
- **Exportieren → Atelier-Projekt** sichert eine bearbeitbare Kopie. PNG/JPG eignen sich zum Teilen.

## Wichtig für deine Projekte

Designs werden im Browser auf diesem Gerät gespeichert. Nutze für deine Projekte immer dieselbe Adresse und exportiere Backups. Das Löschen der Browserdaten löscht lokale Projekte. Ein Download der App enthält keine deiner gespeicherten Arbeiten.

Die Grundversion braucht kein Konto, keinen Mailversand und keinen API-Schlüssel. Für den optionalen Kontenserver siehe [SERVER.md](SERVER.md). Die vollständige Anleitung und Exportgrenzen stehen in [REFERENCE.de.md](REFERENCE.de.md).

Fehler gefunden? Lies [CONTRIBUTING.md](../CONTRIBUTING.md) und beschreibe Betriebssystem, Browser und die Schritte zum Problem. Teile keine Passwörter oder privaten Designs.


## Als App installieren

Nach dem ersten vollständigen Laden zeigt die Übersicht **Offline bereit**. Mit **Atelier installieren** kannst du den unterstützten Browserdialog öffnen oder Installationshinweise anzeigen. Details und Grenzen: [OFFLINE.md](OFFLINE.md). Die Installation aus einer späteren Live-Demo benötigt keinen lokalen Node-Server.

## Gastmodus und private Tresore

Demo und unveränderter Download laufen ausschließlich lokal im Gastmodus. Konten sind deaktiviert. Gastdaten sind nicht als privater Tresor verschlüsselt; Projektdateien regelmäßig exportieren. Für eigene private Tresore: [Selbsthosting-Anleitung](SELF-HOSTING-VAULTS.md).
