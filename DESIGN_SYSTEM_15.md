# FORM 15.0.0 — The Living Sketchbook

Zweiter Durchgang mit Icon-Reparatur, Build 150002. Beschrieben wird der implementierte Quellcode. Das Asset-Sheet ist tatsächlich gerendert; native Screenshots, Gerätebedienung und FPS werden nicht vorgetäuscht.

## Referenz und eigenständige Umsetzung

[HeyClicky](https://www.heyclicky.com/) wurde am 25.11.2026 im Browser angesehen, einschließlich der sichtbaren Zeichen-Demonstration. Beobachtet wurden Desktopfenster, Ordner-/Notizformen, einzelne Doodles, Papierflächen, große Hierarchie und ein sichtbar entstehender Strich. Daraus wurde abstrakt ein persönliches FORM-Arbeitsheft abgeleitet. Logo, Figuren, Texte, Bilder, Bildschirmaufbau und Code der Referenz wurden nicht übernommen. Dies ist keine Behauptung, jede Interaktion der Referenz vollständig geprüft zu haben.

Heute ist ein Tagesblatt mit einem zentralen Start-/Fortsetzenweg. Plan ist ein Heft mit Zykluswochen und einzelnen Tagen. Gym bleibt ein präzises Arbeitsblatt. Fortschritt erhält Kalender und Monatsfilm, Gesundheit ein freiwilliges Beobachtungsbuch. Die Werkstatt gruppiert Einstellungen; zusätzliche Auswertungen und Importfunktionen liegen auf passenden Unterseiten.

## Farben und bestehende Einstellungen

Die Tokens liegen in `src/components/Design.tsx`. `src/art/themes.ts` löst System/Hell/Dunkel/Papier/Retro auf. Fehlt die neue Einstellung, bleibt die alte Kombination aus `appearance` und `paperMode` maßgeblich. Ein gewähltes dunkles Thema wird nicht durch einen alten Papier-Schalter ersetzt.

| Rolle | Hell | Dunkel | Papier | Retro |
| --- | --- | --- | --- | --- |
| Papier | `#FAF9F3` | `#17191D` | `#F5F3EE` | `#F0F2E9` |
| Blatt | `#FFFEFB` | `#22262C` | `#FFFEFA` | `#FBFCF7` |
| Tinte | `#1D2025` | `#F3F5F7` | `#20201D` | `#1F302C` |
| Sekundärtext | `#606369` | `#B1B9C4` | `#5E605A` | `#52635B` |
| Aktion | `#2655D9` | `#9BCCFF` | `#454740` | `#2456C4` |
| Fehlertext | `#A43B31` | `#FFB8AE` | `#A43B31` | `#A43B31` |

Sticker-Gelb, Mint und Rose sind Akzentflächen, kein Ersatz für lesbaren Fehlertext. `scripts/check-design-contrast.cjs` liest die tatsächlichen Palette-Objekte: 56 geprüfte undurchsichtige Text-/Flächenpaare erreichen mindestens 4,5:1. Die Berechnung liegt in `docs/qa/15-second/palette-contrast.json`. Transparenz, disabled Zustände und zusammengesetzte Screens brauchen die native Sichtprüfung; daraus wird keine pauschale WCAG-Zertifizierung abgeleitet.

Der Themenwechsel benötigt keinen Neustart. Die kleine Vorschau interpoliert die Papierfarbe über die zentrale Motion-Bibliothek; ohne Bewegung erscheint sofort der richtige Endzustand. Darstellungseinstellungen verändern keine Trainingshistorie.

## Typografie, Raster und Eingabe

| Rolle | Lokale Schrift | Einsatz |
| --- | --- | --- |
| Display | Outfit / `FormDisplay.ttf` | Große redaktionelle Überschriften |
| UI | DM Sans / `FormText.ttf` | Normale Texte, Buttons und Felder |
| Zahlen | JetBrains Mono / `FormMono.ttf` | Zeit, Last und tabellarische Ziffern |
| Randnotiz | Patrick Hand / `FormHand.ttf` | Ausschließlich optionale Figurtexte und Nebenbemerkungen |

Die vier unveränderten OFL-Lizenzen liegen neben den Fontdateien. Der Start wartet weder auf einen Download noch auf eine Introanimation; bei fehlender/noch ladender Schrift bleibt die Systemschrift verfügbar. Kritische Werte nutzen keine Handschrift.

`PaperGrain` erzeugt deterministische kleine lokale Punkte und Striche. Die Textur beeinträchtigt keine Felder. `MarginNote` besitzt einen echten Schließen-/Wiederanzeigenpfad. Das Sieben-Tap-Retrofenster erzeugt keine Aufgabe oder Trainingsbelohnung. Eine freiwillige echte 100-Workout-Marke zählt abgeschlossene archivierte Einheiten, keine riskante Belastung.

Buttons und Chips besitzen mindestens 44 pt Mindestbreite und 44 pt Mindesthöhe; normale Hauptbuttons sind höher. Home-/Plan-Tage brechen auf schmalen Geräten um. Plan verwendet bei kleiner Breite oder großer Schrift mehrere Reihen. Modal-Schließen, Suche und Profil haben explizite 44-pt-Ziele. Die Navigation nutzt vorhandene native Safe-Area-/Stack-Komponenten. Diese Quellmaße ersetzen keine reale Trefferflächenprüfung.

Dynamic Type bleibt aktiv. Die Gym-Einstellung skaliert die Eingabeschrift zusätzlich um 1 / 1,15 / 1,3. Große Systemschrift blendet dekorative Header-/Pip-Grafiken aus. Controls, Text und Daten bleiben erhalten. Normale Datencontainer werden nicht dekorativ gedreht. Die Links-/Rechtshänderwahl verlegt die tatsächlichen Check-/Schnellaktionen.

## Eigene Assets im echten Produkt

Die Registry enthält 48 kanonische Motive: 32 Gegenstände/Zustände und 16 verschiedene Pip-Posen. Zusätzlich gibt es zehn neutrale Gerätekategorien sowie zwölf eigene Tabzustände für sechs Symbole. Farbvarianten, Aliasse und wiederholte Exporte werden nicht als neue Motive gezählt.

- Quellen: `src/art/objects.ts`, `pip.ts`, `categories.ts`, `tabs.ts`, `registry.ts`.
- Echte SVGs mit SHA-256: `assets/art/manifest.json`.
- Native Tab-PNGs: sechs Symbole × zwei Zustände × drei Dichten; der Fallback zeichnet dieselben Pfade.
- Ein festes eigenes Ink-App-Symbol, 1024/180/120 px, deckend. Die Icon-Wechselfunktion und die alternativen App-Icon-Assets sind auf Nutzerwunsch entfernt.
- Export: `node scripts/export-art15.cjs` und `python3 scripts/export-icons15.py`.
- Das echte Asset-Sheet `docs/design/FORM_15_SECOND_PASS_ASSET_SHEET.{svg,png}` stammt aus den Registry-Daten. Es wurde visuell angesehen, ebenso die Ink-Icon-PNGs.

`ASSET_MANIFEST.md` nennt pro Motiv den tatsächlichen Produktpfad. Die zusätzliche Galerie in der Werkstatt ist nur eine ausdrücklich geöffnete Inspektionsansicht. Neutrale Doodles sind keine Übungsanleitung. Vorhandene Originalfotos werden nur anhand der konkreten Quell-ID verwendet; fehlende Fotos erhalten passende neutrale Platzhalter.

Die alternate Icon-Auswahl prüft die native Fähigkeit und bestätigt die vom System gelesene Auswahl. Ein Fehler speichert keinen falschen Erfolg. Konfiguration und Adaptertests sind geprüft; echtes iOS-Umschalten bleibt ein Gerätegate.

## Persönlichkeit und Bewegung

`CHARACTER_BIBLE.md` beschreibt Pip. `COPY_GUIDE.md` dokumentiert die 104 eigenen typisierten Texte und ihre tatsächlichen Auslöser. Figur und Sprüche sind separat und bei neuer Installation aus. Texte haben stabile Ereignis-IDs, eine Wiederholungsbremse und kurze Lebensdauer. Gesundheit bleibt sachlich; Essen, Körper und Pausen werden nicht moralisch bewertet.

Die zentrale Bibliothek besteht aus `src/motion/spec.ts`, `MotionCue.tsx` und den SVG-Komponenten in `Sketchbook.tsx`. `MOTION_CATALOG.md` dokumentiert 40 Varianten/Abläufe samt echten Aufrufern, Dauer und Fallback. Der Restbogen ist bewusst datengetrieben, ohne Tween.

Erfolgsmarken benötigen bestätigte Commit-/Dateiereignisse. Planreorder bewegt die reale Positionsliste, Extra Row die konkret neu bestätigte Zeile. SVG-Striche verwenden Dashoffsets. Neue Ereignisse brechen vorige Effekte ab; sie legen keine Domain-Aktionen in eine Queue. Die kurzen Sprechblasen räumen sich bei Hintergrund/Unmount auf. Technische Fehler und Speicherstatus bleiben unabhängig davon lesbar.

Aus/Dezent/Lebendig, Reduce Motion und AppState wirken zentral. Verpasste Hintergrundereignisse werden beim Zurückkehren nicht abgespielt. Keine Aktion wird in einem Animations-Endcallback gespeichert. Timerwerte kommen aus echten Zeitstempeln in kleinen Komponenten. SVG-/Farbanimationen verwenden den JS-Treiber, weil die Attribute nicht allgemein vom nativen Treiber abgedeckt sind. Native FPS oder CPU-Werte sind nicht gemessen.

## Hauptflüsse und Geräteabnahme

| Bereich | Reale Hauptaufgabe | Gestaltung | Grenze |
| --- | --- | --- | --- |
| Heute | Start, Fortsetzen oder Plan einrichten | Tagesblatt, Kalenderstempel | Eine Hauptaktion, höchstens eine freiwillige Zusatznotiz |
| Plan | Programm/Woche/Tag, Vorgaben, Terminverschiebung | Reiter, Marker, sichtbare Kopie/Umsortierung | Entwurf getrennt von bestätigter Planrevision |
| Gym | Satz ausfüllen, prüfen, bewusst Extras/Undo | Haken, neue Zeile, Stoppuhr/Klammer | Keine Dekoration speichert eine Eingabe |
| Pause | Restzeit sehen und ausdrücklich ändern | Zeitstempelbogen, einzelner Ablaufstrich | Keine erfundenen Timerwerte |
| Abschluss | Tatsächliche Einträge prüfen und speichern | Receipt, belegter Rekord | Kein Erfolgszettel bei fehlgeschlagenem Commit |
| Fortschritt | Kalender, Rekordtyp, Zeitraum oder Vergleich | Horizontaler Monatsfilm, echte Chartlinie | Tooltip plus Tabelle; Einheiten getrennt |
| Gesundheit | Freiwillige Messansicht oder Health-Abfrage | Ruhige lokale Motive | Quelle, fehlende Daten und Capability sichtbar |
| Suche/Werkstatt | Reales Detail finden, Einstellungen/Backup | Lupe, Ordner, Diskette, Speicherzeichen | Kein Quick-Start und keine irreführende Ersatzroute |

Hier stehen kein iOS-Simulator und kein physisches iPhone zur Verfügung. Offen bleiben SE/größeres Gerät, Tastatur/Fokus, tatsächliche Touchflächen, sehr große Schrift, VoiceOver-Reihenfolge, Iconumschaltung, Reduce Motion bei nativer Navigation, Performance mit 100+ Historieneinträgen, Sperren/Force Quit, echte App-Screenshots und Screenrecordings. Die Testmatrix trennt das von bestandenen JavaScript-, SQLite-, Prebuild- und Assetprüfungen.
