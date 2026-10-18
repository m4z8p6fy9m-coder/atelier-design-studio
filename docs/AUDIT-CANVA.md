# Canva-Abgleich und Kostenmodell

Geprüft am 18. Oktober 2026 gegen öffentliche Produktbeschreibungen und den ausgelieferten Atelier-Code. **Ergebnis: Atelier enthält nicht sämtliche Canva-Funktionen.** Auch Version 0.7 ist keine vollständige Alternative mit identischem Funktionsumfang. Die Tabelle benennt die vorhandenen Teilfunktionen und die verbleibenden Lücken.

Ein vollständiger 1:1-Nachweis wäre mit diesen öffentlichen Beschreibungen ohnehin nicht möglich: Varianten nach Produkt, Tarif, Plattform und Integration sowie interne Qualitätsmerkmale sind damit nicht vollständig prüfbar. Deshalb gibt es hier keine erfundene Prozentzahl zur Funktionsgleichheit.

## Frei nutzbar bedeutet hier

- Der ausgelieferte Anwendungscode steht unter MIT-Lizenz. Alle implementierten Werkzeuge sind ohne Abonnement, Bezahlsperre, Premium-Schalter, Lizenzschlüssel oder Wasserzeichen-Abfrage zugänglich.
- Für Bildbearbeitung und Export erfolgen keine Aufrufe an kostenpflichtige KI- oder Export-APIs. Sie laufen lokal im Browser.
- Der optionale Server benötigt keinen bezahlten Kontodienst und keine kostenpflichtige Datenbank. Er läuft auf deiner Infrastruktur.
- Automatische Konto-Mails nutzen den konfigurierten Gmail-SMTP- oder Resend-Adapter. Versandlimits und mögliche Kosten hängen vom eigenen Anbieter-Konto ab; Google benötigt eigene OAuth-Konfiguration.
- Eigene Hardware, Strom, Speicher, Domain oder gemietetes Hosting können dennoch Kosten verursachen. Es wird kein unbegrenzt kostenloser Cloud-Dienst mitgeliefert.
- Die Vorlagen wurden für Atelier erstellt. Es wird kein Zugriff auf Canvas Premium-Medienbestand mitgeliefert. Du kannst eigene Medien hochladen.
- KI-Generierung ist derzeit **nicht implementiert**. Es wird keine vermeintlich kostenlose KI-Schaltfläche angezeigt, die später einen kostenpflichtigen Dienst voraussetzt.

## Geprüfte Funktionsbereiche

„Vorhanden“ bezeichnet den angegebenen Atelier-Umfang; es bestätigt keine Gleichheit der Qualität oder aller Optionen mit Canva.

| Bereich / Funktion | Atelier 0.7 | Code / Umfang / Lücke |
| --- | --- | --- |
| Texte, Formen und Bildplatzierung | Vorhanden | `model.js`, `render.js`, `app.js` |
| Verschieben, Skalieren und Drehen | Vorhanden | Maus, Tastatur, Zahlenfelder |
| Ebenen, Transparenz und Sperren | Vorhanden | Elementreihenfolge, Sichtbarkeit, Opazität |
| Gruppen und Mehrfachauswahl | Vorhanden | Gruppieren, duplizieren, ausrichten, verteilen |
| Hilfslinien und Einrasten | Teilweise | Seiten- und Elementkanten/Mittelpunkte mit Zoomtoleranz; keine frei platzierten Lineale oder Abstandsmessungen |
| Textstile und Umbruch | Teilweise | Systemschriften, Stärke, Abstände, Umbruch; keine Rich-Text-Spans |
| Eigene Schriftdateien | Vorhanden im Teilumfang, neu | TTF/OTF/WOFF/WOFF2, bis sechs Dateien à 3 MB pro Projekt, eingebettet; keine zentrale Team-Schriftbibliothek |
| Gebogener Text / umfangreiche Texteffekte | Teilweise, erweitert | Einzeiliger Bogen mit Stärke −100 bis 100, Kontur und Schatten; kein 3D-Textsystem |
| Farbverläufe | Vorhanden im Teilumfang, neu | Zwei Farben, linear mit Winkel oder radial, Hintergrund und Text/Formen/Zeichnungen |
| Editierbare Vorlagen | Teilweise | Acht Startvorlagen und eigene lokale Vorlagen mit Archiv; kein großer Online-Katalog |
| Premium-Medienbibliothek | Fehlt | Eigene Uploads und einfache Symbole statt Stock-Katalog |
| Bildzuschnitt und Masken | Vorhanden im Teilumfang | Ausschnitt, Zoom, Rechteck und Ellipse; Austausch im bestehenden Rahmen und Hintergrundbild |
| Bildfilter | Teilweise | Helligkeit, Kontrast, Sättigung, Blur, Graustufen, Spiegelung, Invertierung |
| Hintergrund entfernen | Teilweise, neu | Farbähnlichkeit und zusammenhängende Regionen; keine universelle KI-Motiverkennung |
| Manuelles Radieren / Wiederherstellen | Vorhanden, neu | Lokaler Alpha-Pinsel mit Verlauf; kein generatives Auffüllen |
| Generatives Entfernen / Ersetzen / Erweitern | Fehlt | Keine Rekonstruktion fehlender Bildinhalte |
| Bildschärfung / Hochskalierung / Restaurierung | Fehlt | Kein KI-Modell und kein Spezialwerkzeug dafür |
| Freihandzeichnen | Vorhanden | Bearbeitbare Vektorlinien |
| Vektorbearbeitung | Teilweise | Formen und Linien; kein umfassender Pfad-/Knoten-Editor |
| QR-Codes, umfangreiche Sticker und Lottie | Fehlt | Keine entsprechenden Generatoren bzw. Laufzeit |
| Formate ändern | Teilweise | Proportionale bzw. geometrische Größenänderung; keine KI-basierte Layout-Neukomposition |
| Markenprofile | Teilweise | Ein lokales Profil mit Farben und Systemschrift |
| Team-Markenkontrolle / Freigabeabläufe | Fehlt | Keine zentrale Brand-Governance oder Genehmigungsketten |
| Tabellen / Diagramme | Teilweise | CSV, einfache Tabellen, Balken/Linie/Ring; kein Spreadsheet-Produkt |
| Whiteboard | Teilweise | Großes freies Zeichenformat; kein vollständiges Moderations-/Diagramm-System |
| Dokument- und PDF-Bearbeitung | Fehlt / teilweise | PDF-Ausgabe über Druckdialog; kein PDF-/DOCX-Importeditor |
| Präsentationen | Teilweise | Seiten, Notizen, Vollbild, Dauer und Übergänge |
| PowerPoint-Ausgabe | Teilweise, neu | PNG-Bild pro Folie in einer echten `.pptx`; Texte sind nicht separat bearbeitbar |
| PowerPoint-Import | Fehlt | Keine Übernahme editierbarer PPTX-Objekte |
| Live-Publikumsfragen / Präsentationsanalyse | Fehlt | Keine entsprechende Serverfunktion |
| Animationen | Teilweise | Seitenübergänge; keine vollständigen Element-Keyframes |
| Video-/Audio-Timeline | Fehlt | Keine mehrspurige Clipbearbeitung oder Audiomischung |
| Animierter Videoexport | Teilweise | WebM aus Designseiten; keine Audiospur oder MP4-Pipeline |
| Untertitel / Transkription / Beat-Synchronisierung | Fehlt | Keine Sprach-/Musikmodelle |
| Bildschirm- und Kameraaufnahme | Fehlt | Keine Recorder-Oberfläche |
| Bild-/Text-/Videogenerierung durch KI | Fehlt | Kein angebundener oder mitgelieferter Modellbetrieb |
| Übersetzen / Zusammenfassen / KI-Analyse | Fehlt | Keine entsprechenden Modelle |
| Lokale Projekte und Versionsstände | Vorhanden | IndexedDB, Projektdateien, Verlauf und Sicherungspunkte |
| Benutzerkonten und Serverprojekte | Vorhanden im optionalen Server | E-Mail-Code, Passwort-Wiederherstellung, Google-OIDC, Sitzungen und gespeicherte Dokumente; Anbieter-Konfiguration erforderlich |
| Zusammenarbeit | Teilweise | Live-Benachrichtigungen mit Versionskonflikten; kein CRDT/OT oder Live-Cursor |
| Einladungen und Rollen | Vorhanden im Teilumfang | Eigentümer, Bearbeiter, Leser, Ablauf und Widerruf |
| Kommentare | Vorhanden im Teilumfang | Seitenanmerkungen und Erledigt-Status; keine Benachrichtigungs-E-Mails |
| Bildexport / Transparenz | Vorhanden | PNG, JPG, SVG, Mehrseiten-ZIP; keine Bezahlsperre |
| Website-Ausgabe | Teilweise, neu | Eigenständige HTML-Datei aus skalierbaren SVG-Designseiten und Links |
| Website-Hosting / eigener Layout-Builder | Fehlt | Hosting separat; keine HTML/CSS-Neukomposition oder CMS-Funktion |
| Social-Media-Planung und Veröffentlichung | Fehlt | Keine Kalender- oder Plattformverbindungen |
| Druckbestellung / CMYK / Beschnitt | Fehlt | Keine Druckdienstleistung oder professionelle Druckvorbereitung |
| App-Marktplatz und Cloud-Integrationen | Fehlt | Keine entsprechende Plattform |
| Enterprise-Verwaltung / SSO / Audit / Abrechnung | Fehlt | Kein Enterprise- oder kommerzielles Betriebssystem |

## Wesentliche Prüfstellen im Code

- `src/model.js`: Dokumentmodell, Transformationen, Importvalidierung.
- `src/render.js`: tatsächliche SVG-/Rasterdarstellung; keine externen Bild- oder Texteffekte versteckt angebunden.
- `src/image-tools.js` und `src/image-editor.js`: lokale Pixelfunktionen und Bedienung.
- `src/publishing.js`: eigenständige Website- und Bildfolien-PPTX-Ausgabe.
- `src/cloud.js`, `server/app.js`, `server/store.js`: Konten, Rollen, Persistenz und Synchronisierung.
- `package.json`: keine kostenpflichtigen Runtime-Abhängigkeiten oder Bezahldienste.

Die durchgeführten Tests sind in [VALIDATION.md](VALIDATION.md) beschrieben. Tests einzelner Werkzeuge sind kein Nachweis vollständiger Canva-Parität.

## Quellen zum Original

Die öffentlichen Seiten belegen, welche Funktionsbereiche das Original anbietet; sie belegen nicht, dass Atelier dieselben Fähigkeiten besitzt.

- [Canva-Funktionsübersicht](https://www.canva.com/features/): öffentlich beschriebene Bild-, Video-, Stil- und Büro-Werkzeuge.
- [Canva Pro](https://www.canva.com/pro/): zusätzliche Gestaltungs-, Medien- und Automatisierungsfunktionen.
- [Canva Video](https://www.canva.com/video-editor/): Video-/Audio-Timeline und zugehörige Werkzeuge.
- [Canva AI](https://www.canva.com/help/using-canva-ai/): generative und assistierende Funktionen.
- [Canva Markenverwaltung](https://www.canva.com/business/features/brand/): Markenbibliotheken und Markenprozesse.

Es wurde keine Premium-Sperre im Canva-Dienst umgangen und kein Canva-Code oder Canva-Medienbestand übernommen. Atelier ist eine eigenständige Anwendung mit dem oben angegebenen Umfang.
