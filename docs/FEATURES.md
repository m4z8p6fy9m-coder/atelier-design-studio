# Funktionsumfang und Abgleich

Aktueller detaillierter Bericht für **Atelier 0.7**: [AUDIT-CANVA.md](AUDIT-CANVA.md). Die folgende kompakte Übersicht wurde entsprechend aktualisiert.

Stand: 18. Oktober 2026. Dieser Abgleich ordnet zentrale Funktionsbereiche ein. Er ist keine vollständige Bestandsaufnahme aller Funktionen, Tarife, Integrationen oder Plattformvarianten von Canva. „Vorhanden“ bedeutet implementiert im hier gelieferten Umfang; es bedeutet keine vollständige Funktionsgleichheit.

| Bereich | Atelier 0.7 | Umfang / fehlende Teile |
| --- | --- | --- |
| Design-Editor | Vorhanden | Texte, Formen, Bilder, Zeichnen, Gruppen, Ebenen, Positionierung; kein vollwertiger professioneller Vektorpfad-Editor |
| Vorlagen | Teilweise | 20 Startvorlagen und eigene lokale Vorlagen mit Archiv; kein kommerzieller Vorlagen- oder Stock-Katalog |
| Bildbearbeitung | Teilweise | Filter, Ausschnitt, Masken, Schatten, lokales farbbasiertes Freistellen und manuelles Radieren; keine KI-Retusche oder automatische Motivauswahl |
| Markenverwaltung | Teilweise | Ein lokales Profil mit Farben und Schrift; keine umfassenden Teamrichtlinien, Freigabeprozesse oder gemeinsam verwalteten Markenbibliotheken |
| Diagramme / Tabellen | Teilweise | CSV-Daten, drei Diagrammtypen und einfache Tabellen; kein Spreadsheet-Produkt |
| Präsentationen | Teilweise | Seiten, Übergänge, Dauer, Sprechernotizen, Vollbild und PPTX-Bildfolienexport; kein PPTX-Import, editierbarer Objektexport oder Präsentations-Analyseportal |
| Animation / Video | Teilweise | Animierte Designseiten als WebM; keine mehrspurige Video-/Audiotimeline, automatische Untertitel oder Bildschirmaufnahme |
| Konten | Vorhanden im optionalen Server | E-Mail-Code, Passwort-Wiederherstellung, Google-OIDC und Sitzungen; keine zusätzliche 2FA oder Passkeys |
| Online-Projekte | Vorhanden im optionalen Server | Auf eigenem Server gespeichert; kein fertig betriebener Cloud-Dienst |
| Gemeinsames Arbeiten | Teilweise | Live-Benachrichtigungen, Dokumentversionen, Konfliktkopien; keine CRDT/OT-Zusammenführung oder Live-Cursor |
| Freigaben | Vorhanden im optionalen Server | Zeitlich begrenzte Einladungen und Rollen; kein anonymes öffentliches Vorschauportal |
| Kommentare | Vorhanden | Anmerkungen mit Erledigt-Status; im gemeinsamen Projekt mitsynchronisiert |
| Exporte | Teilweise | PNG, JPG, SVG, Projektdatei, Bild-ZIP, Browser-PDF, WebM, PPTX-Bildfolien und HTML; keine professionelle Druckpipeline |
| KI | Offen | Keine Bild-/Video-/Textgenerierung und keine automatische Designgenerierung |
| Websites / Publishing / Apps | Teilweise | HTML-Ausgabe aus Designseiten und Links; kein eigener Hosting-Dienst, Layout-Builder, Social-Media-Planer oder App-Marktplatz |
| Kommerzieller Betrieb | Offen | Kein Abrechnungssystem, Enterprise-Admin, externe Sicherheitsprüfung oder zugesicherter Produktionsbetrieb |

Canva dokumentiert ein deutlich breiteres Produkt, unter anderem KI-Werkzeuge für Designs, Bilder und Videos, eine Videobearbeitung mit Timeline und Audio sowie umfangreiche Markenverwaltung. Die obigen Lücken werden deshalb ausdrücklich benannt und nicht durch wirkungslose Schaltflächen verdeckt. Quellen: [Funktionsübersicht](https://www.canva.com/features/), [Canva AI](https://www.canva.com/help/using-canva-ai/), [Video-Editor](https://www.canva.com/video-editor/), [Markenverwaltung](https://www.canva.com/business/features/brand/).

Für den Betrieb des gelieferten Servers siehe [SERVER.md](SERVER.md). Die durchgeführten Prüfungen stehen in [VALIDATION.md](VALIDATION.md).


## Version 0.9

20 eigene editierbare Vorlagen, drei vierseitige Starter-Kits und eine installierbare Web-App mit Offline-Programmspeicher. Installationsvoraussetzungen, Updates und Testgrenzen: [OFFLINE.md](OFFLINE.md).
