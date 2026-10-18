# Schneller gestalten in Atelier 0.7

## Befehlssuche

Die Lupe in Übersicht oder Editor öffnet die Suche. Mit **Strg+K** bzw. **Cmd+K** geht es ebenfalls, auch wenn gerade ein Textfeld fokussiert ist. Ein bereits geöffneter Dialog oder die laufende Präsentation wird dadurch nicht unterbrochen.

Nach einer Aktion, einem Werkzeug oder „Seite“ suchen. Die Liste enthält passende verfügbare Befehle. Pfeil hoch/runter wählt einen Eintrag, Enter führt ihn aus, Escape schließt den Dialog. In der Übersicht stehen globale Aktionen zur Verfügung; im Editor kommen Gestaltung, Export, Werkzeuge und die Navigation zu einzelnen Seiten hinzu. Bei Leserechten werden schreibende Befehle ausgeblendet. Nicht alle einzelnen Eigenschaften des Editors besitzen einen Suchbefehl.

## Einrasten an Elementen

Der Einrasten-Schalter in der oberen Werkzeugleiste schaltet magnetische Ausrichtung ein bzw. aus. Beim Verschieben werden die linken/rechten/oberen/unteren Kanten und Mittelpunkte der Auswahl mit der Seite und den sichtbaren anderen Elementen verglichen. Eine Hilfslinie zeigt die gefundene Achse. Die Toleranz entspricht sechs Bildschirmpixeln und berücksichtigt den Zoom.

**Alt** pausiert das Einrasten während des Verschiebens. **Shift** hält die Bewegung auf einer Achse; Einrasten verschiebt dann nicht versehentlich quer zu dieser Achse. Gruppen verwenden ihre gemeinsame sichtbare Außenbegrenzung. Gedrehte Elemente werden anhand ihres umschließenden Rechtecks ausgerichtet; das ist kein Pfad-/Knoten-Snapping. Unsichtbare Elemente werden ignoriert, gesperrte sichtbare Elemente können als Ausrichtungsziel dienen. Gleichmäßige Abstände lassen sich weiterhin über „Verteilen“ herstellen; dynamische Abstandsmessung, Lineale und frei platzierte Hilfslinien sind nicht enthalten.

Hilfslinien sind eine Hilfe im Editor und erscheinen nicht im Export.

## Bild austauschen

Ein entsperrtes Bild auswählen und rechts **Bild austauschen** wählen. Alternativ den Befehl über die Suche finden. Das neue Bild ersetzt den Inhalt desselben Elements. Position, Größe, Drehung, Deckkraft, Maske, Kontur, Filter, Link und Gruppenzugehörigkeit bleiben erhalten. Der Ausschnitt wird auf Mitte und Zoom 1 zurückgesetzt, weil das neue Foto ein anderes Format haben kann. Über die vorhandenen Ausschnitt-Regler anschließend anpassen.

PNG, JPG, WebP und GIF sind erlaubt, maximal 15 MB. Der gemeinsame Import verkleinert auf maximal 2400 Pixel Kantenlänge; GIFs werden als Standbild übernommen. Das Ersatzbild wird auch in der lokalen Upload-Bibliothek gespeichert. Ein Projekt-/Seitenwechsel während des Ladens führt nicht zum Austausch eines Bildes auf einer anderen Seite. Rückgängig stellt das ursprüngliche Bild wieder her.

## Bild als Hintergrund

Ein Bild auswählen und **Bild als Hintergrund** anklicken. Das Bildelement füllt die Seite mit zentriertem Ausschnitt und wird hinter alle anderen Elemente gelegt. Rotation, Maske, Eckenradius, Schatten und Kontur werden für die volle Fläche zurückgesetzt; Filter, Deckkraft und Spiegelung bleiben erhalten. Es bleibt ein normales editierbares Bildelement und wird nicht automatisch gesperrt. Das Hintergrundbild lässt sich bei Bedarf über die Ebenen auswählen oder sperren. Rückgängig stellt den vorherigen Zustand wieder her.

Alle Werkzeuge funktionieren lokal und ohne Premium-Sperre. Es werden keine externen Bilddienste verwendet.
