# Neue Gestaltungswerkzeuge in 0.5

Alle Funktionen sind ohne Premium-Sperre nutzbar und funktionieren im statischen Editor.

## Eigene Schriften

Im Bereich **Text → Eigene Schriften** eine TTF-, OTF-, WOFF- oder WOFF2-Datei hochladen. Es sind bis zu sechs Dateien mit jeweils 3 MB pro Projekt möglich. Die neue Schrift wird für ausgewählte, entsperrte Texte übernommen und erscheint im Schriftmenü. Entfernen ersetzt ihre Verwendung im Projekt durch Arial; Rückgängig stellt sie wieder her.

Die Dateien liegen im Projekt und werden mit der JSON-Projektdatei weitergegeben. SVG und HTML betten sie ein; PNG/JPG/PDF/WebM/PPTX verwenden die gerenderten Schriftformen. Eigene Schriften erfordern passende Nutzungs- und Weitergaberechte. Es werden keine proprietären Schriftdateien mitgeliefert. Eine defekte oder vom Browser nicht unterstützte Schrift wird mit einer Fehlermeldung abgelehnt. Unterschiedliche Schnitte werden als eigene Dateien verwaltet; es gibt keine automatische Familien-/Schnittzuordnung.

## Textbiegung

Text auswählen und rechts **Textbiegung** zwischen −100 und 100 einstellen. Null bedeutet normalen Text. Gebogener Text läuft auf einer quadratischen Kurve einzeilig; Zeilenumbrüche werden als Leerzeichen dargestellt. Breite und Schriftgröße bestimmen, wie viel Text auf den Bogen passt. Sehr lange Texte können am Pfadende abgeschnitten werden. Es gibt keine automatische Schriftverkleinerung oder frei bearbeitbare Kurvenknoten.

## Farbverläufe

Unter **Farben → Hintergrund mit Farbverlauf** einen Seitenverlauf erstellen. Für ein ausgewähltes Text-, Form- oder Zeichenelement rechts **Farbverlauf** wählen. Startfarbe, Endfarbe, linear/radial und Winkel festlegen. Der Winkel wirkt auf lineare Verläufe. **Zur einfarbigen Fläche** entfernt den Verlauf. Die Wahl einer normalen Farbe ersetzt ebenfalls den Verlauf. Bilder, Tabellen und Diagramme haben hier keinen Verlaufsdialog.

Verläufe bleiben beim Verschieben, Speichern, JSON-Import und den unterstützten Exporten erhalten. Mehr als zwei Farbstopps und frei positionierbare radiale Zentren sind nicht enthalten.

## Eigene Vorlagen

Unter **Vorlagen → Seite als Vorlage speichern** wird die aktuelle Seite mit Hintergrund, Elementen und verwendeten Schriftdateien gespeichert. Notizen und Kommentare werden nicht als Vorlage übernommen. **Meine Vorlagen** zeigt diese lokale Bibliothek. Anwenden ersetzt die aktuelle Seite und passt das Layout geometrisch an das Projektformat an. Die Änderung lässt sich rückgängig machen. Archivieren und Wiederherstellen sind möglich.

Die Vorlagenbibliothek gehört zum lokalen Browserspeicher. Sie wird nicht automatisch zwischen Konten oder Geräten synchronisiert. Zum Weitergeben eine Vorlage anwenden und das resultierende Projekt als JSON exportieren. Ein Projekt darf auch nach dem Anwenden höchstens sechs eigene Schriften enthalten. Alte Schriften können über den Schriftendialog entfernt werden.

## Kompatibilität

Projektformat-Version 3 ergänzt Schriften, Verläufe und Textbiegung. Ältere Atelier-Dateien bleiben importierbar. Für den neuen Funktionsumfang müssen alle Beteiligten Version 0.5 verwenden; ältere Programmversionen können diese zusätzlichen Felder beim Import verwerfen. Speichere wichtige Projekte zusätzlich als JSON-Datei.
