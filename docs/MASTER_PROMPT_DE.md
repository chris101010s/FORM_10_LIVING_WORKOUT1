# ATHLETE OS 8.0 — ULTRA MASTER PROMPT
## Vollständiges Re-Design, Feature-Ausbau, Migration und produktionsnaher QA-Prozess

> **Für einen Coding-Agenten mit Zugriff auf das vollständige React-Native-/Expo-Repository.** Dieser Text ist eine ausführliche Entwicklungs-Spezifikation und **keine Aussage, dass Version 8 bereits implementiert sei**. Der beigefügte ATHLETE-OS-7-Code ist die bestehende Ausgangsbasis. Arbeite direkt an dieser Codebasis; erfinde keine Screenshots, Testergebnisse, APIs oder fertigen IPAs.

---

# 0. DEINE ROLLE, DAS PROJEKT UND DIE NICHT VERHANDELBAREN REGELN

Du bist ein erfahrenes Team in einer Person: Lead iOS Product Designer, React-Native-Staff-Engineer, Datenbank-Architekt, Sportwissenschafts-UX-Redakteur, QA-Automation-Engineer und Accessibility-Spezialist. Baue aus meinem bestehenden Projekt **ATHLETE OS 7** die Version **ATHLETE OS 8 — FORM EDITION**. Die App soll wie ein echtes, jahrelang gepflegtes Premium-Produkt aussehen: originell, präzise, schnell, liebevoll gestaltet und voll mit echten, funktionierenden Features. Sie darf **nicht** wie eine generische KI-generierte Demo wirken.

**Ausgangslage:** Das Repository ist eine React-Native-/Expo-App (bisher Expo SDK 58, React Native 0.88), entwickelt auf Windows und als **unsigned iOS-Device-IPA** auf GitHub-Actions-macOS-Runnern gebaut. Die Installation erfolgt auf dem iPhone mittels Sideloadly. Das aktuelle Repository enthält Body-Scan-OCR, Gewichte, Übungen, Live-Workout, Trainingshistorie, RIR, Pausentimer, Recovery, Habits, Ziele, Ernährung, Cardio, Story-Sharing sowie JSON-Backup. Es enthält einen von `free-exercise-db` bezogenen Katalog mit zuletzt im GitHub-Log 876 Übungen. Einige Features sind noch rudimentär.

**HARTE REGELN:**
1. Arbeite **am echten Repository**, lies zuerst alle relevanten Dateien. Führe keine parallele „Show-App“ ohne reale Datenanbindung ein.
2. Nichts als „fertig“ bezeichnen, bevor Code, Tests, tatsächliche Laufzeit und iOS-Build dazu passen. Trenne „implementiert“, „lokal getestet“, „in CI gebaut“ und „auf iPhone getestet“.
3. Schütze bestehende persönliche Daten. **Nie** die Bundle-ID `app.athleteos.personal` ändern, ohne explizite Migration/Bestätigung. Den bisherigen Schlüssel `athlete-os-v4-data` beim Upgrade erkennen und **nicht vor einer erfolgreichen Migration löschen**.
4. App muss vollständig **ohne Account und ohne Internet** verwendbar sein. Keine persönlichen Werte, Gewichte, Ziele oder Vorlagen vorab eintragen. Beispielwerte sind ausschließlich isolierte Test-Fixtures, niemals Produktionsdaten.
5. Neue Möglichkeiten müssen echte End-to-End-Funktionen sein (UI → Validierung → Persistenz → Wiedergabe → Backup → Wiederherstellung → Tests), keine leeren Buttons oder „coming soon“-Seiten.
6. Lade keine Bilder, Logos, Schriftdateien oder proprietären Inhalte ohne geklärte Lizenz. Die Repo-Übungsdatenbank `yuhonas/free-exercise-db` ist Unlicense; dokumentiere Quelle und Lizenz. Zusätzliche Quellen nur nach Lizenzprüfung und Deduplikation.
7. Eine YAZIO-Verbindung darf nur über offiziell unterstützte, wirklich verfügbare Wege erfolgen. Keine erfundene YAZIO-API, kein Scraping von Nutzerkonten, kein Passwort im App-Code. Manuelle Einträge/CSV sowie ausdrücklich autorisierter Apple-Health-Datenaustausch sind separat vorzusehen.
8. Gesundheit ist kein Videospiel: Keine Schuldzuweisung für Essen, keine Belohnung für extremes Hungern oder übermäßige Trainingsbelastung. Motivation darf frech, sarkastisch und athletisch sein, bleibt aber optional und respektiert Erholung.
9. Performance vor Dekoration. Keine minutenlangen Startanimationen, ständigen Pop-ups, endlosen Kartenlisten, zufälligen KI-Sprüchen oder lauten Effekten.
10. **Frage nur, wenn das Projekt ohne die Angabe nicht sicher weitergebaut werden kann.** Wähle vernünftige Defaults und dokumentiere sie. Arbeite iterativ, mit kleinen, überprüfbaren Commits.

## Gewünschtes Endergebnis
- Ein **vollständig überarbeitetes React-Native-/Expo-Projekt** mit realem Code, nicht nur Design-Dateien.
- Eine **sehr andere, merkfähige Premium-Designsprache**, konsistente Design-Tokens und eigene Typografie.
- **Jede unten priorisierte Funktion** end-to-end umgesetzt oder mit genauer Begründung/Status markiert.
- Dokumentation der Datenmigration von 7 → 8 und Tests mit echten (anonymisierten) alten Backup-Strukturen.
- GitHub Actions: Tests → Expo-Konfigurationsprüfung → TypeScript → iOS Prebuild → CocoaPods → unsigned Device Build → IPA-Artefakt → Logs bei Fehlern.
- Dokumentierte User-Flows, Testmatrix, Design-Review und echte Simulator-/Gerätescreenshots, sofern die Umgebung sie erstellen kann.
- Ein `RELEASE_REPORT.md`, das exakt sagt: welche Tests liefen, welche fehlschlugen, was noch ungetestet ist und wie man die App auf Windows per GitHub + Sideloadly installiert.

---

# 1. RADIKAL NEUE ART DIRECTION — „FORM / ATHLETE OS“

Die alte App wirkt wie ein austauschbares weiß-blaues Dashboard mit zu viel rechteckigem Standard-UI. Das neue Produkt soll aussehen wie eine Mischung aus **hochwertiger Fitness-Journal-App, editorialem Sportmagazin, Apple-typischer Präzision und einem professionellen Trainingstool**. Modern, kraftvoll, aber **nicht** futuristisches Neon-/Cyberpunk-Gaming. Keine visuellen Plagiate bekannter Apps. Keine riesigen Glasflächen überall. Die Designästhetik muss „von Menschen gestaltet“ ausstrahlen.

## Markenidee
- Produktname in der UI: **FORM**; dezente Unterzeile „by ATHLETE OS“. Technisch Bundle-ID und interne Speicher-IDs vorerst beibehalten.
- Tagline: **„Train with intent.“** Deutsch lokalisiert: **„Trainiere mit Absicht.“**
- Markencharakter: diszipliniert, menschlich, trocken-witzig, präzise, vertrauenswürdig.
- Nicht: übertriebene Gradient-Heroes, zufällige Stockfotos, fingierte Community-Zähler, erfundene Fortschrittsrekorde, pseudo-wissenschaftliche Aussagen.

## Farben / Tokens (eine Ausgangsbasis, fein abstimmen anhand realer Screenshots)
- `canvas`: `#F6F5F0` – warmes Off-White / Papier
- `surface`: `#FFFFFF` – klares Kartenweiß
- `ink`: `#171915` – fast schwarzes, nicht blauschwarzes Textink
- `inkSecondary`: `#676B65`
- `line`: `#E6E5DF`
- `brandAccent`: `#E65E3A` – gezielter Signal-Korallton; maximal 1 dominanter Akzent pro Screen
- `deepOlive`: `#536456` – zweiter, ruhiger Akzent für Recovery/Balance
- `coolBlue`: `#2E5BD8` – ausschließlich für Diagrammvergleich und interaktive Datensignale
- `success`: `#327653`, `warning`: `#AC6B23`, `danger`: `#B83F37`
- Verwende semantische Tokens statt harte Farben in 200 JSX-Dateien zu verteilen.
- Optionales Dark Theme ist eine spätere Variante und muss denselben Kontrast-/Designstandard halten; **Light-first** ist Priorität.

## Eigene Schriftfamilie
- Display/Headlines: **Space Grotesk**, bevorzugt Medium/Semibold, breite editorial gesetzte Überschriften.
- Lesetext/UI: **Manrope**, Regular/Medium/Semibold.
- Zahlen und Trainingstabellen: **IBM Plex Mono** für tabellarische Ziffern/Timer/Bestwerte.
- Alle Schriften nur aus legitimen Quellen mit kompatibler Lizenz laden; Lizenzen im Repository dokumentieren. Keine fremden Font-Dateien blind kopieren. Der Entwickler muss Fonts in Expo korrekt einbinden, Font-Loading und Fallback testen.
- Falls Fonts im Build nicht ladbar sind: systemische Fallback-Schriften nutzen, **niemals** einen weißen/leeren Screen anzeigen.

## Typografische Hierarchie
- Auf Startseite große redaktionelle Überschrift 30–36 pt.
- Große Fitnessmetrik 42–60 pt, mit kleinen echten Einheiten.
- Section titles 18–22 pt; Button 15–16 pt; sekundäre Beschriftungen 11–13 pt.
- Tabellarische Zahlen nicht springen lassen; `fontVariant: ['tabular-nums']` / Monospace.
- Großbuchstaben sparsam für Mikrolabels (max. 9–12 px), nicht die ganze App anschreien lassen.
- Genügend Lesbarkeit mit Dynamic Type/Screenreader; kein 10-px-Pflichttext.

## Layout und iOS-Liquid-Glass-Prinzip
- Exaktes 8-pt-System, konsistente Radiusfamilie 12/18/26, ausreichend Weißraum.
- Vor allem Typografie, Abstände, überraschend gute Informationsarchitektur und subtile Bewegung erzeugen Premium-Gefühl.
- **Echtes Liquid Glass** nur für sinnvoll schwebende Navigation/Toolbar/Picker, wenn über offiziell kompatible Komponenten möglich; auf älteren Geräten sauberer opaker Fallback. Nicht jede Content-Karte zu Glas machen. Orientiere dich an Apples HIG für Materialien und Navigation.
- Kein horizontaler Überlauf; kleine iPhone-Displays und große Dynamic-Type-Stufen müssen bedienbar bleiben.
- Animationen 120–320 ms, mit natürlichen Easing-Kurven, zurückhaltenden Haptics; `Reduce Motion` respektieren.
- Swipe-/Sheet-Interaktionen müssen mit Screenreader und Buttons alternativ nutzbar sein.
- Native Keyboard-Avoidance, Safe Areas, Tastatur-Schließen, Fokus-Handling.

## Premium-Details, die das Produkt menschlich machen
1. Individuell gestaltete Datumsleiste statt generischer „TODAY“-Kachel.
2. Der primäre Bildschirm hat **eine** klare Aktion: „Training starten / fortsetzen“.
3. Leere Zustände haben spezifische, nützliche Anleitungen: „Noch keine Sätze. Wähle eine Übung …“ – niemals falsche `0%`-Fortschritte oder Demowerte.
4. Mini-Verläufe hinter Zahlen nur, wenn es wirklich Messdaten gibt.
5. Echte responsive Trenner, präzise Icon-Linienstärken, kohärente Bildzuschnitte.
6. Kompakte Workout-Tabellen statt riesiger Karten pro Satz.
7. Subtiles Ausklappen von Details, nicht jedes Mal ein kompletter Seitenwechsel.
8. Historische Einträge klar mit Datum und Quelle gekennzeichnet.
9. Nützliche Gesten: Long-Press kopiert einen Satz, Swipe markiert als erledigt, Haptic bei PR.
10. Offline-Hinweis nur, wenn gerade eine Netzfunktion betroffen ist; nie roter Alarm für offline gespeicherte Daten.
11. Jeder Screen muss sich in einem **leeren**, **durchschnittlich gefüllten** und **stark gefüllten** Datenzustand gut anfühlen.
12. Jedes Feature bekommt eine eigene visuelle Sprache, dennoch keine inkonsistente Sammlung von Styles.

---

# 2. INFORMATION ARCHITECTURE — KLAR, NICHT ÜBERFÜLLT

Untere Navigation mit fünf Hauptbereichen:
1. **Heute** — Überblick und eine nächste sinnvolle Aktion.
2. **Training** — Start, aktive Session, Vorlagen, 800+-Übungskatalog.
3. **Fortschritt** — Gewicht, Body-Scan, Leistung, Maße, Cardio, Trends.
4. **Journal** — Habits, Erholung, Ernährung, Stimmung/Notizen, Tagesrückblick.
5. **Mehr** — Ziele, Coach, Exporte, Einstellungen, Datenschutz, Easter Eggs, App-Diagnostik.

Während einer aktiven Workout-Session soll eine **minimierte, überall erreichbare Session-Leiste** sichtbar sein: Trainingsname, Dauer, aktuelle Übung, Pausenrest; Antippen öffnet Vollbild. Das verhindert den bisherigen Fehler, bei dem eine Session nach einem Tabwechsel verloren oder unauffindbar wirkt.

Jeder Bereich bekommt seine eigene Screen-Struktur und eigene Performance-Grenzen: schwere Listen mit `FlashList`/`FlatList` virtualisieren, Diagramme lazily rendern, Suchfilter debouncen. Nichts darf 800 Übungen auf einmal als 800 React-Native-Karten mounten.

---

# 3. ONBOARDING — 0 % VORAUSGEFÜLLTE PERSONENDATEN

Erster Start fühlt sich an wie ein neues Apple-Produkt, aber dauert weniger als 60 Sekunden:
- Begrüßung: „Ein Ort für deine Arbeit. Keine Fantasiezahlen.“
- Optionaler Name/Nickname.
- Priorität wählen (Kraft, Ausdauer, Körperzusammensetzung, Athletik oder gemischt) – **keine** verpflichtenden Angaben.
- Maßeinheiten kg/lb, km/mi; später umstellbar mit korrekten Konversionen.
- Optionales Körpergewicht/Ziel, **leer** statt aus Chatkontext übernommen.
- Optional bevorzugte Trainingstage und Erinnerung, opt-in.
- Datenschutz kurz erklären: lokal gespeichert; Export/Import und optionale Health-Berechtigung separat.
- Keine vorher ausgefüllte Übung, kein vorgefertigtes Gewichtsdatum, keine Demotrainingseinheit in der echten Nutzerdatenbank.
- „Überspringen“ muss überall funktionieren. Ein zurückgesetztes Onboarding darf Trainingseinträge nicht löschen.
- Eine optionale Demo-/Tour-Ansicht darf ausschließlich in einer separaten, ausdrücklich aktivierten Sandbox existieren. Beim Verlassen wird Sandbox-Datenbank getrennt gelöscht.

---

# 4. TRAININGSMODUS — DIE WICHTIGSTE FUNKTION DES PRODUKTS

Die App muss im Gym **mit einer Hand und ohne Nachdenken** bedienbar sein. Das ist ein Werkzeug, kein Dateneingabeformular.

## Live-Workout-Screen
- Permanenter Header: Sessionname, Dauer seit Beginn, abgebrochene Session fortsetzen, Beenden mit Bestätigung.
- Persistiere Live-Zustand bei **jeder sinnvollen Änderung**, auch bei App-Wechsel, Crash, Bildschirm-Sperre und Prozess-Neustart.
- Übungen frei hinzufügen, entfernen, ersetzen, sortieren, favorisieren.
- Pro Übung: Name, fokussierte Muskelgruppe, Bild (optional), Instruktion, persönlicher Bestwert, Tabelle der letzten Session.
- Eine **kompakte echte Tabelle**: Satz-Nr. | Typ | Letztes Mal | kg | Wdh. | RIR/RPE | Check.
- Letzte Werte als grauer, deutlich beschrifteter Vorschlag, **nicht unbemerkt als neue echte Messung speichern**.
- Gewicht in 0,5/1/2,5-kg-Schritten anpassbar; benutzerdefinierte Schritte.
- Reps steuern mit Plus/Minus und Tastatur; korrekte Dezimaltrennzeichen für Gewicht.
- Sätze: Warm-up, Arbeit, Drop, Failure, Assisted, Timed, Distance, Bodyweight; Typ bestimmt erlaubte Eingabefelder.
- RIR 0–5, RPE 1–10, optional Tempo, Notiz pro Satz.
- Satz „fertig“ löst Transaktion aus und startet den individuell konfigurierten Rest-Timer.
- „Letzten Satz kopieren“, „Satz korrigieren“, „Undo“ für versehentliche Fertigmarkierung.
- Alle Änderungen müssen undo-/redo-freundlich oder klar bestätigt sein.
- Supersets, Giant Sets, Zirkel, EMOM, AMRAP, Intervallschema und normale Sets als eigene Trainingsblöcke. Die Session muss entsprechend sortiert und pausiert werden.
- Satzhistorie ist nicht an Listenindex, sondern an **stabile Übungs-ID** gebunden.
- Bei frei erstellter Übung stabile IDs; identische Namen dürfen nie versehentlich Daten zusammenwerfen.
- Workouts ohne Gewichte (Push-ups, Planks, Laufdrills) ordentlich erfassen, statt sie als 0-kg-Kraftrekord zu missverstehen.
- Einheiten müssen nachträglich editierbar sein, mit sauberer Historie.
- „Session unterbrechen“ und „Session beenden“ sind getrennt; beim unfreiwilligen App-Ende bleibt sie aktiv.
- Beim Abschluss: kleiner, gestalteter **Session Review** mit Zeit, Volumen, Sätzen, tatsächlichen PRs, Notizen und optionaler Story.

## Vorwerte, Progression und Vorschläge
- Pro Übung die **letzten 3–5 Trainings** anzeigen, um Fortschritt über die Zeit zu sehen.
- Grafische Anzeige, ob gleiche Leistung, mehr Wdh., mehr Gewicht oder Technik-/RIR-Fortschritt.
- Persönliche Empfehlungen dürfen „Vorschlag“ heißen, **nicht** vorgetäuschte Coaching-Gewissheit.
- Deload-Woche optional planen; keine automatische riskante Gewichtssteigerung.
- Geschätzte 1RM nur für passende Übungen und plausible Wiederholungsbereiche; kein 1RM für Laufband, Plank oder Anfänger-Liegestütze.
- Volumen zählen als `kg × reps` bei geeigneten Sätzen; Aufwärmsätze getrennt markieren und in Charts konfigurierbar ausschließen.
- Plateau-Analyse nach mehreren Sessions, niemals nach nur einem schlechten Tag.
- Satzzeiten und Pausen zwischen Sätzen korrekt nach Zeitstempeln berechnen.

## Rest-Timer — verlässlich wie eine Uhr
- Speichere den **absoluten Endzeitpunkt** statt nur einen abwärtszählenden UI-State.
- Presets 30/45/60/90/120/180/240/300 Sek., pro Vorlage und Übung optional überschreibbar.
- +15/+30 Sek., Skip, Stopp, leiser Ton und Haptic; alle optional.
- Screen-Lock/Background: Anzeige bei Rückkehr anhand realer Uhrzeit rekonstruieren. Für Systemnotifications nur mit Erlaubnis und Plattformunterstützung.
- Kein falscher Anspruch, dass beliebige JavaScript-Timer im Hintergrund immer durchlaufen.
- Timer muss auch nach Crash/Neustart korrekte Restzeit anzeigen.
- Keine doppelte Fertigmeldung durch mehrfaches Rendern.

## Vorlagen und Programme
- Drag-and-drop-Reihenfolge, Trainingstage, Sets/Reps/RIR-Ziel, Satzpausen, Warm-ups.
- Varianten A/B/C, Push/Pull/Legs, Full Body, Athletik sowie vollkommen freie Pläne.
- Benutzer kann eigene Pläne bauen, importieren/exportieren, duplizieren, als Standard wählen.
- Planänderungen dürfen alte Sessions nicht rückwirkend verändern.
- Eine Vorlage kann gelöscht werden, ohne Historie zu löschen. Referenzen in Wochenplan aufräumen.
- Übungen im Plan austauschen, ohne bestehende Trainingshistorie zu verlieren.
- Geplante Session **nicht** als Misserfolg markieren, wenn Ruhetag/Terminänderung.

## Weitere echte Gym-Tools
- Plate Calculator für Langhantel: Stangengewicht und Scheiben pro Seite, auch 1,25/2,5/5/10/15/20/25 kg; mathematisch korrekt.
- Warm-up-Rechner für ausgewähltes Arbeitsgewicht, ausschließlich als optionaler Vorschlag.
- Equipment-Filter „In meinem Gym vorhanden“.
- Persönliche Gym-Notizen: Maschinen-Pin, Sitzhöhe, Griffvariante, Stack-Offset (nicht zwischen Studios blind vergleichen).
- Griffkraft/Farmer's Walk mit Distanz/Zeit/Gewicht je Hand.
- Einseitige Übungen mit linkem/rechtem Satz getrennt.
- Timer für Planks und isometrische Holds.
- Pausenstatistik, Trainingsdichte, Zeit in Workout.
- Option „Große Eingabeelemente / Handschuhe-Modus“.
- Keine Pflicht, jeden Satz mit 10 Eingabefeldern zu füllen. Advanced-Felder einklappbar.

---

# 5. ÜBUNGSDATENBANK — ECHT, SCHNELL, AUSBAUBAR

- Nutze `yuhonas/free-exercise-db` als bekannte, offen lizenzierte Quelle; Projekt hat im bisherigen CI 876 Übungen eingebettet. Keine willkürlichen Übungen generieren, um größere Zahlen behaupten zu können.
- Originalname, Muskelgruppen, sekundäre Muskelgruppen, Schwierigkeitsgrad, Equipment, Kategorie, Anleitungen, Bildverweise und ID erhalten.
- Volltextsuche DE/EN mit Synonymen, Akzentnormalisierung, Tippfehler-Toleranz und sinnvollem Ranking; Ergebnisse unter 150 ms auf einem gewöhnlichen iPhone bei 876 Datensätzen.
- Filter: Muskel, Equipment, Schwierigkeitsgrad, Zug-/Drück-/Knie-/Hüft-/Carry-Muster, Körpergewicht, Kabel, Maschine, Langhantel, Kurzhantel.
- „Zuletzt verwendet“, Favoriten, häufige Übungen, benutzerdefinierte Übungen und Studioausstattung.
- Fotos nur, wenn Lizenz/URL stimmen; Offline-Cache nach Einwilligung oder sparsamem Laden. Bild nicht gefunden → schönes lokales Platzhalter-Illustrationssystem, keine kaputten Bildrahmen.
- Übungen unterscheiden nach `stable exercise id`, nicht Anzeigename oder Arrayposition.
- Eigene Übungen vollständig erstellen, bearbeiten, löschen, falls keine referenzielle Sperre; beim Löschen Warnung, wenn in Historie verwendet.
- Übungs-Detailseite mit klaren Schritten, häufigen Technikfehlern ohne medizinische Diagnosen, Muscle Map wenn rechtlich zulässige Assets vorliegen.
- Unterschiedliche Schreibweisen normalisieren (Romanian Deadlift, RDL, rumänisches Kreuzheben).
- Quellen- und Lizenzseite in Einstellungen.
- Imports aus anderen Datenbanken nur nach Lizenzprüfung; kein automatisches Kopieren geschützter Übungen aus kommerziellen Gym-Apps.

---

# 6. FORTSCHRITT — REALISTISCHE CHARTS, NICHT DEKORATION

## Gewichtstracking
- Beliebig viele Messungen mit Datum, optionaler Uhrzeit, Einheit, Notiz, Messquelle.
- Einträge bearbeiten/löschen mit Bestätigung und Undo, lokale Speicherung sofort.
- Ansicht 7 / 30 / 90 / 180 Tage / 1 Jahr / Gesamt.
- Echte zeitbasierte X-Achse. Unregelmäßige Abstände dürfen **nicht** gleich breit wie Tage mit Messungen dargestellt werden.
- Tagesmittelwert und 7-/14-/28-Tage-Durchschnitt; Schwankungen durch Salz/Wasser sachlich kennzeichnen.
- Ausgangs- und Zielgewicht nur, wenn Nutzer sie selbst eingetragen hat.
- Keine erfundene Kalorienverbrauchs-/Zieltermin-Garantie. Forecast immer als unsicherer Trend mit Konfidenz oder Band, bei zu wenig Daten ausblenden.
- „Gewicht stagniert“ nur auf längerem Trend, nicht wegen eines einzelnen Tages.
- Keine Belohnung für besonders schnellen Gewichtsverlust; Performance- und Erholungsindikatoren gleichrangig.

## Kraft-Analytics
- Echte Übungscharts: Gewicht, Top-Satz, Arbeitssätze, Rep-PR, e1RM (geeignete Übungen), Volumen, Sessionfrequenz.
- Wochenvolumen korrekt nach Wochenbeginn/Lokalzeitzone; wo nötig mit ISO-Wochen definieren.
- Heatmap nach trainierten Muskelgruppen nur anhand nachvollziehbarer Zuordnung/Trainingslogik; keine pseudowissenschaftlichen exakten Prozentzahlen.
- Bilaterale/unilaterale Übungen nicht falsch aggregieren.
- Workouts und Charts müssen auch nach Korrektur älterer Einträge sofort aktualisiert werden.

## Athletik und Ausdauer
- 1-km-/3-km-/5-km-Zeiten, Pace, Intervalle, Zone-2-Dauer (nur wenn Puls vorhanden), Sprints mit Distanz, Shuttle Runs, Jump-Höhe (wenn manuell gemessen), Liegestütze, Klimmzüge, Plank, Farmer's Walk.
- Pace = Zeit/Distanz; defensives Rechnen bei 0/fehlender Distanz; km/mi richtig konvertieren.
- Persönliche Bestleistungen mit Datum und Vergleich zu vorher; keine erfundenen „professionellen Benchmarks“.
- Lauf-Geh-Progressionen und Cardio-Logs; Intervalltraining mit einfachen Timer-Presets.

## FITINN-Body-Scan-Center
- Dateiimport PDF/JPEG/PNG/HEIC über nativen iOS-Picker.
- Extraktion mit Apple Vision/PDFKit **lokal**, soweit technisch möglich. Bild und PDF nicht heimlich hochladen.
- Rohtext zeigt die App vor dem Speichern mit klar markierter Unsicherheit; Nutzer bestätigt oder korrigiert jeden wichtigen Wert.
- Gewicht, Körperfettanteil, geschätzte Muskelmasse, viszeraler Fettwert, Umfang, BMR nur dort wo im Bericht wirklich vorhanden. Fehlende Werte bleiben `null`, niemals 0 oder geschätzt.
- Gerätewechsel und Messungen zu unterschiedlichen Bedingungen als Vergleichslimit kennzeichnen; BIA ist eine Schätzung, keine „exakte Körperanalyse“.
- Verlauf pro Metrik und Vergleich zweier Scans nebeneinander, mit prozentualer und absoluter Differenz.
- Keine direkte FITINN-/vicoach-API behaupten, wenn nicht dokumentiert.
- Externe Dateien nur speichern, wenn Nutzer es will; standardmäßig nur bestätigte strukturierte Messwerte + Quelle/Importdatum.

## Körpermaße und Fotos
- Umfangsmessungen mit Datum, Maßbandhinweis, manuelle Daten.
- Optionale private Fortschrittsfotos: niemals automatisch in geteilten Storys, standardmäßig nicht in Cloud, Metadaten/EXIF beim Export entfernen.
- Side-by-side-Vergleich nur mit Einwilligung, neutraler Sprache, keine AI-Veränderung des Körpers.

---

# 7. JOURNAL, RECOVERY, HABITS UND ERNÄHRUNG

## Journal
- Tägliche freie Notizen, optionale Tags (Training, Energie, Schlaf, Stimmung, Alltag), Fotos nur explizit.
- Kalenderansicht mit Einträgen und Schnellfilter.
- Geführter, optionaler Wochenrückblick: „Was lief gut?“, „Was will ich ändern?“, „Worauf bin ich stolz?“.
- Suche über Notizen auf dem Gerät.

## Recovery
- Schlafdauer, Schlafqualität, Energie, Stress, Muskelgefühl, Ruhepuls optional, einzeiliges Check-in.
- Echte Erholungshinweise, wenn mehrere Belastungsindikatoren ungünstig sind; nicht als medizinischer Rat ausgeben.
- Ruhetage positiv darstellen, nicht als verlorene Streak.
- Trainingsempfehlungen sind optional; keine aggressive Aufforderung, trotz Erschöpfung maximal zu trainieren.

## Habits
- Eigene Gewohnheiten erstellen, bearbeiten, pausieren, archivieren, Wochenrhythmus definieren, optional Erinnerungen.
- Positive/negative Habit-Tracking-Formulierung ohne Schuld. Streaks optional, **niemals Alles-oder-nichts**.
- Auslöser → gewählte Ersatzhandlung → Rückblick; „Wenn-dann“-Pläne.
- Wochenansicht mit tatsächlichen Check-ins; Pausentage ohne Strafpunkte.
- Kleine Haptics/Animation nur beim tatsächlichen Abschluss.

## Ernährung und YAZIO
- Manuelle Makros/kcal, Tagesansicht, Wochenmuster, Notizen, editierbare CSV-Importe.
- Keine moralische „gutes/schlechtes Essen“-Klassifikation, keine Bestrafung für Kalorien.
- `YAZIO öffnen` und unterstützte Datenwege dokumentieren, ohne heimliche Kontoverbindung.
- Apple Health nur nach Feature-Check, Einwilligung, unterstützten Health-Datentypen und realer Geräteprüfung anbinden. YAZIO-Apple-Health-Synchronisation **nicht** als direkte YAZIO-API bezeichnen.
- Die Kernapp muss ohne Apple Health und ohne YAZIO vollständig funktionieren.

---

# 8. INTELLIGENTER COACH — NÜTZLICH, NICHT FALSCH

Der Coach sollte sich wie ein sehr guter, etwas frecher Trainingspartner anfühlen, **nicht** wie ein LLM, das völlig frei Fakten erfindet. Baue zuerst **regelbasierte, transparente Insights** aus lokal vorhandenen Daten:
- „In deinen letzten drei Bankdrück-Sessions hast du bei gleichem Gewicht mehr Wiederholungen geschafft.“
- „Dein Durchschnitt über 14 Tage zeigt einen anderen Verlauf als gestern auf der Waage.“
- „Du hast deine letzten vier Trainingseinheiten vollständig protokolliert.“
- „Diese Woche fehlen noch keine Pflichtsessions, weil du deinen freien Tag verschoben hast.“

Jede Aussage bekommt eine klare Datenbasis, z. B. „basierend auf 4 Sessions“, und wird bei zu wenigen Daten **nicht** angezeigt.

## Motivationston wählbar
- **Calm:** ruhig, sachlich.
- **Coach:** direkt, sportlich, respektvoll.
- **Chaos:** trocken, lustig, frech, kurze Sportmetaphern und kleine Roast-Lines, **opt-in**.
- **Off:** keine Motivationssprüche.

Beispiele für Chaos-Modus (kurz, nicht beleidigend, nie Body-Shaming):
- „Der Timer ist nicht dein Personal Trainer. Nächster Satz.“
- „Eine saubere Wiederholung ist mehr wert als zehn Ego-Reps.“
- „PR? Nett. Jetzt Wasser trinken und normal bleiben.“
- „Du hast die App geöffnet. Jetzt mach auch etwas damit.“
- „Keine Ausrede, aber Regeneration ist ebenfalls Trainingsarbeit.“
- „Heute ist nicht dein Highlight-Reel. Trotzdem zählt die Session.“

Kein „Du versagst als Mensch“, keine Schuldzuweisung gegenüber Religion/Körper, keine toxische Diätmotivierung, keine algorithmische Manipulation zur Steigerung der Nutzungszeit.

---

# 9. 20 SUBTILE EASTER EGGS — KLEIN, ORIGINELL UND ECHT

Jedes Easter Egg ist optional, barrierefrei, maximal wenige Sekunden und kann in „Reduce Motion“/Coach Off abgeschaltet werden. Keine Fake-Statistiken oder Fake-PRs.

1. **7-Taps-Logo** öffnet eine kleine „Film Room“-Seite mit echten Meilensteinen und Entwickler-Credits.
2. Nach dem ersten vollständig protokollierten Workout erscheint eine unaufdringliche „First Rep“-Notiz.
3. Bei einem echten persönlichen Bestwert animiert ein einziger dünner Signalstrich einmal über den PR-Wert.
4. Hält man die Monospace-Uhr im Rest-Timer gedrückt, wechselt zwischen mm:ss und Sekunden.
5. Wird nach langer Pause eine Session fortgesetzt, begrüßt ein kleiner Hinweis: „Still here. Good.“
6. Ein erfolgreich gespeichertes Backup zeigt „Safety rep completed“ – nur einmal pro Export.
7. Beim 100. geloggten **echten** Satz: winzige Bleistift-Skizze im Journal, kein Vollbild-Konfetti.
8. Die Wochenansicht hat eine reduzierte „Film Strip“-Animation beim horizontalen Wischen.
9. Ein langer Druck auf ein Diagramm zeigt ein präzises Datum/Wert-Fadenkreuz.
10. Der Pausentimer zeigt bei exakt 0:00 für eine Sekunde „YOUR SET“, anschließend normalen Zustand.
11. Ein geschaffter Consistency-Milestone zeigt eine handgezeichnet wirkende kleine Linie; ohne simulierten Erfolg.
12. `About` enthält einen „Made for the days no one watches“-Easter-Egg-Text.
13. Eine Routine mit dem Namen „Leg Day“ kann einmalig einen unaufdringlichen Treppenwitz anzeigen – nur wenn Chaos-Modus aktiv.
14. Bei drei Wochen sauberen Daten zeigt der Trendscreen eine kleine ehrliche Datenqualität-Badge.
15. Der Export einer Story kann einen winzigen QR/Brand-Stempel **optional** enthalten, nicht aufdringlich.
16. „Long Press to Compare“ auf einem Gewichtsdiagramm aktiviert einen Vorher/Nachher-Messpunktvergleich.
17. Persönliche Bestwerte bekommen eine kleine Sammlung von „Tickets“, die auf echte Daten verweisen.
18. Hidden „Paper Mode“ als reduzierter, fast monochromer Kontrastmodus.
19. Eine dezente Jahresübersicht als analoges Trainingsjournal-Blätterelement.
20. Ein geheimer, aber dokumentierbarer „No-Nonsense Mode“ reduziert Dashboard auf genau drei Elemente: nächste Session, letzte Leistung, heutiger Check-in.

Easter Eggs müssen überprüfbar im Code existieren; keine rein textlichen Feature-Versprechen. Keine langen Sperranimationen, kein Zwang, Hinweise zu teilen.

---
# 10. SOCIAL MEDIA, SHARING UND FREUNDE — FREIWILLIG UND PRIVAT

Eine native Fitness-App muss nicht automatisch ein soziales Netzwerk sein. Baue die Funktionen so, dass sie **ohne Backend** nutzbar bleiben:
- 9:16-Story-Builder mit 5 sorgfältig designten Vorlagen: „Weekly Film“, „PR Ticket“, „Training Receipt“, „Quiet Progress“, „Race Day“.
- Nur Werte exportieren, die der Nutzer explizit ausgewählt hat; Körpergewicht standardmäßig **ausgeblendet**.
- Völlig bearbeitbare Story: Titel, Zeitfenster, welche Kennzahlen sichtbar sind, Hintergrund, Name an/aus, Wasserzeichen an/aus.
- 1080×1920-PNG lokal rendern, keine leeren/falschen Felder; qualitativ scharfe Typografie statt hochskalierter 300-px-Vorschau.
- Native Share Sheet für Instagram, TikTok, iMessage, WhatsApp etc.; direkte Posts nur über offiziell erlaubte APIs und niemals mit erfundenen Berechtigungen.
- Exportvorschau mit Datenschutzcheck (Gewicht, Notizen, Orte, Foto-Metadaten).
- Fortschrittskarten bei echten Bestleistungen; keine erfundenen Vorher-Nachher-Daten.
- Eine Option zum **anonymen** Teilen ohne Name und Gewicht.
- Optionales Freundes-Feature **erst später**, nach explizit freigegebener Synchronisationsarchitektur; keine Cloud-Anmeldung erzwingen.
- Eigene Datenschutz-Testcases: Keine Rohtexte von Body-Scans, Pfade oder EXIF im Share-PNG.

---

# 11. SMARTE GERÄTE UND PLATTFORM-FEATURES

Nur implementieren, wenn iOS-Berechtigungen und kostenlose Sideloadly-Buildkette tatsächlich kompatibel sind. Jedes Feature muss einen neutralen Fallback besitzen:
- System-Share-Sheet für Dateien und Berichte.
- Haptics mit konfigurierbarer Intensität; bei iPad/fehlender Haptic still degradieren.
- Native Notifications für frei gewählte Erinnerungen; Bedingung: Nutzererlaubnis. Keine unnötigen Push-Dienste.
- Apple Health **optional**: relevante Messwerte selektiv importieren, Quelle kennzeichnen, keine stillen Rückschreibungen, sauber auf Berechtigungsentzug reagieren.
- Bei HealthKit signierungsbedingt nicht funktionierender kostenloser IPA: Feature deaktivieren und verständlich erklären, ohne die App zu blockieren.
- Apple Watch nicht als angeblich fertig behaupten, wenn es keine echte Watch-App gibt.
- Widgets/Live Activities nur in separater, überprüfbarer Ausbaustufe; entitlements prüfen.
- Dark Mode später als echter zweiter Token-Satz; Betriebssystemkontrast respektieren.
- Lokale Suche und schnelle Action über iOS Spotlight/Siri Shortcuts optional, ohne Kernfunktionen davon abhängig zu machen.
- Widget-Vorschlag: nächste geplante Session, letzte Workout-Leistung, kein Körpergewicht ohne Opt-in.

---

# 12. DATENBANK-ARCHITEKTUR — „DIE APP MERKT SICH WIRKLICH ALLES“

Die bisherige App nutzt `expo-sqlite/kv-store`, speichert einen JSON-Datensatz unter `athlete-os-v4-data` und eine Recovery-Kopie. Das funktioniert als Ausgangsbasis, wird bei vielen Workouts/Übungen/Scans auf Dauer aber schwer wartbar. Setze eine **lokale SQLite-Datenbank** mit versionierten Migrationen und transaktionalen Writes als robuste Weiterentwicklung um. Bewahre die alten Daten.

## Minimales relationales Modell (vorschlagsweise)
- `meta(schema_version, migration_status, app_version, created_at, updated_at)`
- `profile(id, display_name, units, optional_goal, onboarding_state)`
- `exercise(id, source, source_external_id, name, muscle_json, equipment, instructions_json, ... )`
- `custom_exercise(id, name, muscle_group, equipment, created_at, updated_at)`
- `routine(id, name, sort_index, default_rest_seconds, notes, ...)`
- `routine_block(id, routine_id, type, sort_index, settings_json)`
- `routine_exercise(id, routine_id, exercise_id, sort_index, goal_sets, rep_min, rep_max, ... )`
- `session(id, routine_id_nullable, name_snapshot, start_at, end_at_nullable, status, notes, ...)`
- `session_exercise(id, session_id, exercise_id, name_snapshot, sort_index, settings_snapshot, ...)`
- `set_entry(id, session_exercise_id, kind, weight_value, weight_unit, reps_nullable, duration_ms_nullable, distance_m_nullable, rir_nullable, rpe_nullable, side_nullable, note, completed_at, ...)`
- `live_session_draft(session_id, serialized_editor_drafts, active_exercise_id, rest_ends_at, updated_at)`
- `weight_entry`, `body_scan`, `body_measurement`, `performance_test`, `cardio_session`
- `habit`, `habit_schedule`, `habit_completion`
- `nutrition_entry`, `recovery_entry`, `journal_entry`
- `goal`, `weekly_plan`, `favorite_exercise`, `app_setting`, `event_log` (nur lokal und begrenzt).

## Integrität
- Foreign Keys und sinnvolle Indizes auf Datum, Übungs-ID, Session-ID.
- UUIDs oder robuste lokal generierte IDs, keine Kollisionen bei mehreren Einträgen in derselben Millisekunde.
- Transaktionen für Satzabschluss, Sessionabschluss, Routinen-Löschung, Imports, Datenmigration.
- Deduplikation bei wiederholtem Import über Quelle, Datum, Inhalt und ggf. externem Identifier; keine fehlerhafte Zusammenlegung zweier legitimer identischer Workouts.
- Nie NaN/Infinity, negative unsinnige Einträge oder ungültige ISO-Zeitstempel speichern.
- `null` von `0` unterscheiden; fehlender Scanwert ist keine Nullmessung.
- Speicherung von Sätzen nicht erst beim Beenden der Session, sondern unmittelbar.
- Selbst bei App-Absturz darf maximal die gerade nicht bestätigte UI-Tippeingabe fehlen – möglichst auch diese als Draft wiederherstellen.
- Asynchrone Speicherfehler dürfen nicht durch „Speichern erfolgreich“-Toast versteckt werden.
- Invariant-Test: Nach einer erfolgreichen bestätigten Eingabe bleibt diese nach `force quit` + Neustart erhalten.

## Migration ATHLETE OS 7 → 8 (KRITISCH)
1. Vor der Migration erkennen, ob `athlete-os-v4-data` existiert; JSON nur lesend laden und validieren.
2. Vor jeder Änderung einen vollständigen Snapshot unter eigenem Migration-Backup-Schlüssel sichern.
3. Neue SQLite-Struktur als separate Datenbank mit `schema_version=8` erstellen, alte Daten nicht überschreiben.
4. Nutzerdaten, Trainings, Live-Sessions, Routinen, Ziele, Favoriten, Body-Scans, Gewichte und alle IDs übertragen; Test-Fix­tures mit allen alten Varianten nutzen.
5. Prüfen: Datensatzanzahlen, referenzielle Integrität, plausible Werte, Checksums und mindestens stichprobenartig Vergleich der JSON-Semantik.
6. **Erst nach vollständiger Prüfung** Migration als erfolgreich markieren. Bei Fehler Zurückrollen und weiterhin auf alte Daten zugreifen lassen.
7. Alten KV-Schlüssel und Recovery-Kopie **niemals automatisch löschen**. Erlaubte Bereinigung nur später über explizite, sichere Nutzeraktion.
8. App-Update mit derselben Bundle-ID testen; IPA via Sideloadly über bestehende App installieren, ohne vorherige Deinstallation. Vor Update Backup empfehlen.
9. Alten JSON-Backup-Import weiterhin unterstützen und nach neuem Schema konvertieren. Export mit Schema-Version, Datum, App-Version und Integritätscheck.
10. Retry-Szenarien: Akku leer, Crash während Migration, doppelte Migration, teilweise defekte Daten, fehlende Scanner-Felder, alte Sessions mit doppelten IDs.

## Backup / Restore — darf nie Nutzerdaten zerstören
- Backupexport als JSON mit Version, Zeitstempel, freiwilligem Dateinamen, Exportgrößen-Limit, Schema-Validierung.
- Optional verschlüsselter Export über gut geprüfte, dokumentierte Kryptobibliothek und vom Nutzer verwaltetes Passwort; kein hartcodierter Schlüssel.
- Backupimport: Datei einlesen → isoliert validieren → **Vorschau mit Mengenvergleich** (Sätze, Sessions, Gewichte, Scans etc.) → Nutzer wählt „Zusammenführen“ oder „Ersetzen“ → VOR dem Ersetzen aktuelle Daten sichern → atomar einspielen → prüfen.
- Undo-Option für Restore, sofern technische Ressourcen ausreichen.
- Kaputtes JSON, unvollständiges Schema, zu große Datei, doppelte Importdatei → verständlicher Fehler, **keine** Datenänderung.
- Export über iOS Files/Share; Dateien dürfen in iCloud Drive gespeichert werden, wenn Nutzer dies wünscht. Keine automatische Cloudkopie ohne Zustimmung.
- Backupformat dokumentieren, z. B. mit JSON Schema und anonymisierten Beispielen.
- Hilfsseite „Was passiert mit meinen Daten beim Sideloadly-Refresh?“; Daten dürfen nicht von einer Neuinstallation abhängig sein.

## Sichere Crash-/Logging-Strategie
- Kein Senden von Body-Scan-Rohtext, Gewicht, Ernährung oder Notizen an Remote-Crashdienste ohne Opt-in.
- Diagnoseprotokolle lokal, sensible Daten maskieren, Nutzer kann sie gezielt exportieren.
- In den Einstellungen: Datenbankstatus, Schema-Version, letzter erfolgreicher Speicherzeitpunkt, Backup-Status, importierte Datensätze, App-Version.
- Bei korrupter Datenbank zuerst Recovery-Modus, nicht leeres Onboarding und nicht blind überschreiben.

---

# 13. ERGONOMIE, ACCESSIBILITY, PERFORMANCE UND OFFLINE-BETRIEB

- Screenreader-Namen für alle Buttons, Tabellen, Charts, Timer; beschreibende Grafiken als Textdaten zugänglich.
- Target-Größe mindestens ungefähr 44×44 pt, besonders im Training.
- Dynamic Type und vergrößerte Schrift testen; kein versteckter „Speichern“-Button unter der Tastatur.
- Hoher Kontrast in allen für die Benutzung relevanten Zuständen.
- `Reduce Motion`, `Reduce Transparency`, Low Power Mode und Dunkelmodus-Einstellung beachten.
- Fehlerzustände mit **konkreten Reparaturaktionen** statt „Something went wrong“.
- Ladezustände nur dort, wo wirklich auf I/O gewartet wird. Keine 3-Sekunden-Splash-Animation.
- 800+-Katalog: virtualisierte Liste, Thumbnails sparsam, Suche ohne Frame Drops, Filterstate bleibt erhalten.
- Diagramme: wenige skalierte SVG-Pfade, Memoization, keine künstlichen großen Inline-Arrays bei jedem Render.
- Große Datenbanken: 10.000 Sätze, 2.000 Gewichtsdatensätze, 1.000 Cardioeinträge simulieren. App muss benutzbar bleiben.
- Flugmodus/Offline: vollständig nutzbare Logs, bereits heruntergeladene Übungsdaten, alle Trends und Backups. Bild-Download fehlschlagen lassen ohne Crash.
- iPhone-Klassen testen: kleiner Screen, aktuelles Standard-iPhone, großes iPhone, optional iPad; Insets und Home-Indicator.
- Keine Berechnung von App-Abstürzen, wenn Kamera-/Foto-/Gesundheitsberechtigung verweigert wird.
- Defensiv gegen Zeitzonenwechsel, Sommer-/Winterzeit, Datum über Mitternacht, Schaltjahr und ungültige Eingaben.
- Datumsfelder benutzerfreundlich über native Picker statt verpflichtend ISO-Strings tippen; Datenbank speichert eindeutige Formate.
- Kein direktes `setInterval` als alleinige Quelle für einen Rest-Timer.
- Tests für Hintergrund/AppState-Wechsel, Storage-Writes und abgebrochene Import-Picker.

---

# 14. SICHERHEIT UND DATENSCHUTZ

- Privacy by Default; keine Analytics-/Werbe-SDKs ohne expliziten Wunsch.
- Persönliche Gesundheits- und Fitnessdaten nicht in GitHub, Crashlogs oder `console.log` ausgeben.
- Keine App-API-Keys, Passwörter oder privaten Credentials in Quellcode, Workflow oder Stories.
- Backup- und Share-Dateinamen ohne persönliche Geheimnisse, falls geteilt.
- Fotos standardmäßig nicht extern veröffentlichen.
- Alle Netzwerkverbindungen dokumentieren und auf benötigte Endpunkte reduzieren (Übungskatalog, optional Content; keine heimlichen Tracker).
- PDF-OCR bevorzugt lokal; gespeicherten Rohtext standardmäßig verwerfen oder nur nach Opt-in behalten.
- Importvalidierung inklusive Dateigröße, Content-Type, JSON-Schema, numerischer Grenzen, maximaler Texteingabelänge.
- Schutz gegen Path Traversal/ungültige lokale URI beim Dateizugriff.
- Dateiberechtigungen und iOS-Permission-Texte auf tatsächliche Funktion abstimmen.
- Vor Veröffentlichung Dependency-Lizenzen und Sicherheitswarnungen prüfen, aber keine blinde `npm audit fix --force`-Aktion, die Buildkompatibilität zerstört.
- Gesundheitsbezogene Erkenntnisse klar als Trainings-/Lifestyle-Einordnung kennzeichnen, nicht als Diagnose.

---

# 15. EXAKTE QA-UND-CI-ANFORDERUNGEN — KEINE WEITEREN ENDLOSEN ROTEN BUILDS

Der bisherige Verlauf hatte konkrete CI-Pannen: TS5112 bei separaten TypeScript-Tests, ein fehlendes Swift-Modul durch zu breite `.gitignore`, falsches Mocking von `expo-sqlite/kv-store`, Typecheck-Fehler um `StatusBar.backgroundColor` und falsche `View`-Ref-Typen. Diese Fälle müssen als Regressionstests und als Checkliste bleiben.

## Reihenfolge der Prüfungen
1. **Repository-Audit:** Dateibaum, `package.json`, Versionslock, Expo-Konfig, native Module, Swift-Dateien, `.gitignore`, CI-Workflow, Lizenzen und Importpfade prüfen.
2. **Dependency Audit:** Versionskompatibilität und Engine-Anforderungen verifizieren. Nutze eine reproduzierbare Lockfile-basierte Installation (`npm ci`) in CI, sobald Lockfile konsistent ist. Kein unkontrolliertes `expo install --fix` in jedem Release-Build, das ohne Commit die Dependencies verändert.
3. **Syntax & Lint:** TypeScript, Swift-Struktur, JSON, Workflow-YAML, Imports.
4. **Echter Typecheck:** `tsc --noEmit` unter **demselben Paketstand** wie CI; nicht nur TypeScript transpilen. Typecheck muss vollständig grün sein, bevor Xcode startet.
5. **Unit Tests:** Zahlen, Datum, Timezone, Trends, Workout-Volumen, e1RM, RIR, Supersets, ID-Migration, CSV-Parser, Scan-Parser, Bild-URL, Backup-Validation, Recovery, Timer.
6. **Integration Tests:** UI-Handlungen mit echtem SQLite-/Repository-Layer, Migration von v7-Daten, Satz speichern → Neustart → Satz vorhanden; Backup exportieren → reset test DB → Restore → vollständiger Gleichheitsvergleich.
7. **UI-Komponententests:** Leerer Screen / viele Einträge / Fehlerzustand / Slow Network / kein Netzwerk / große Schrift / Screenreader-Labels.
8. **Native Prebuild:** Expo prebuild, native Module automatisch verlinken, `pod install`, Podfile.lock-Audit, Swift-Compilerprüfung.
9. **Xcode:** tatsächlicher `iphoneos` Release-Build ohne Codesignierung, `main.jsbundle` in `.app`, `Info.plist`, Bundle-ID, IPA-Payload.
10. **Optionaler Simulator-Smoke-Test:** App installieren, öffnen, fünf Haupttabs aufrufen, Satz hinzufügen, Daten speichern, Reopen, Backup, Diagramm. Wenn nicht möglich, offen markieren.
11. **Reales iPhone:** App via Sideloadly signieren/installieren und dieselbe Smoke-Testmatrix prüfen. Nicht ohne Beleg behaupten.

## Konkrete Testfälle (Mindestsatz)
- Erster Start ohne Daten → leeres Onboarding → optionale Felder überspringen → App läuft.
- Altes ATHLETE-OS-7-Backup importieren → alle Einträge unverändert wiederfinden.
- App-Version 7 mit Daten installieren → mit Version 8 **überinstallieren** → Daten bleiben.
- 5 Sätze loggen, davon einen editieren und einen löschen → Volumen/PR passen.
- Workout starten → Tab wechseln → App in Hintergrund → schließen → erneut starten → aktive Session + Drafts vorhanden.
- Timer mit 90 s starten → 40 s Hintergrund → korrekte verbleibende Dauer.
- Zwei Übungen gleicher Namen aber verschiedener IDs → Historien bleiben getrennt.
- Vorlage löschen → historische Sessions bleiben, Wochenplan hat keine verwaisten Referenzen.
- Fehlerhaftes Backup → Nutzer sieht Fehler, bestehende Daten unverändert.
- Schreibfehler während Live-Workout → sichtbarer Fehler, kein „Gespeichert“-Fake.
- Fitnesswerte mit `NaN`, `Infinity`, negativen Distanzen und Dezimalkomma testen.
- Gewichtsdatensätze mit ungleichen Datumsabständen → Chart bleibt zeitlich korrekt.
- Body-Scan ohne Muskelmasse → Feld bleibt leer, keine Nullkurve.
- Scan mit Zahlenerkennungsfehler → manuelle Korrektur zwingend möglich.
- PDF unterbrochen → App stürzt nicht ab.
- Story ohne Gewicht → Export enthält wirklich keine Gewichtszahl.
- Support für Restore nach beschädigter Hauptdatei → Recovery öffnet sich statt leerem Datenreset.
- 10.000 Sets → Such-, Home- und Gym-Views bleiben bedienbar.
- Lange/kurze Übungsnamen, deutsche Umlaute, Synonyme, nur ASCII.
- 1. Januar, Schaltjahr, Sommerzeitwechsel, Zeitzonenwechsel.
- Kein Internet → Kernfunktionen arbeiten; Katalogbilder zeigen Fallback.
- Hintergrund beenden während eines DB-Writes → Transaktionssicherheit.
- TypeScript 6 `TS5112` Regression; vorübergehende Modulmock-Typen für `kv-store`.
- React Native 0.88 StatusBar und `ViewInstance`/CaptureRef-Typen.
- Git getrackte `modules/athlete-ocr/ios/*.swift` und `*.podspec`.
- Wiederholte App-Installation mit identischer Bundle-ID, keine stille Profillöschung.

## CI-Workflow konkret
- `actions/checkout` → `setup-node` → Runtime-Versionen anzeigen.
- `npm ci` mit Commit-Lockfile, so dass Builds reproduzierbar sind.
- Übungen aus bekanntem Source-Tag oder geprüftem Commit übernehmen; Netz-Fallback dokumentieren.
- `preflight`, `eslint`, `tsc --noEmit`, `jest`/vergleichbare Unit- und Integrationstests.
- Nur wenn alles grün: `expo prebuild --clean --no-install`, `pod install`, `xcodebuild`.
- Xcode-Logs IMMER als Artefakt bei Fehler; Fehlermeldungen anhand von `error:` oder `fatal error` zusätzlich kompakt extrahieren.
- IPA nur hochladen, wenn `.app` und `main.jsbundle` vorhanden sind und das ZIP intakt ist.
- Nach erfolgreichem Build `release-manifest.json` mit `commit`, Buildzeit, Versionsnummer, verwendeter Xcode-Version, Bundle-ID, Teststatus und SHA-256 der IPA erzeugen.
- GitHub-Artifact-Namen eindeutig; genaue Anweisung für Sideloadly.
- Workflow darf alte Quellen nicht ohne Review überschreiben. Alle Änderungen als nachvollziehbarer Commit.
- Wenn wegen kostenloser Sideloadly-Signatur bestimmte Entitlements nicht nutzbar sind, deaktivieren/fallbacken statt Appstart blockieren.

## Definition von „fertig“
- Jeder neue Bildschirm existiert mit echtem Hook-up an Persistenz; sichtbare Buttons funktionieren.
- Alle Unit-/Integrationstests grün.
- Vollständiger Typecheck mit exakt installierten Abhängigkeiten grün.
- Unsigned Device-IPA erfolgreich gebaut; keine fehlenden Pods/Assets/JS-Bundle.
- Datenmigration getestet und dokumentiert.
- Keine persönlichen Defaultwerte.
- Echte Screenshots aus **laufender** App, nicht KI-generierte Grafiken.
- Vorhandene Daten nach Update getestet oder, wenn dies noch nicht real getestet ist, **klar als offener Punkt** markiert.

---

# 16. ENTWICKLUNG IN PHASEN — NICHT 150 HALBFERTIGE FEATURES AUF EINMAL

## Phase A — Rescue / Baseline
- Repository vollständig auditieren und die aktuelle iOS-Buildkette stabilisieren.
- Snapshot / Branch für v7 sichern.
- Lockfile reproduzierbar machen und Tests lokal + CI reproduzieren.
- Noch keine visuelle Neuerfindung, solange Datenmigration und Build nicht kontrollierbar sind.
- Outcome: v7 Stand mit grünem Typecheck und grüner iOS-IPA als Ausgangspunkt.

## Phase B — Designsystem und App-Shell
- Neues Brand-/Typografie-/Token-System.
- Navigation, Onboarding, Home, aktive Mini-Workout-Leiste, leere Zustände und Sheets.
- Screens für kleines iPhone, Standard-iPhone, großes iPhone.
- Vorher/Nachher-Designvergleich **mit echten Renderings**.
- Outcome: das Produkt sieht deutlich anders aus und ist funktional.

## Phase C — Gym V2 und Katalog
- Neues Satzmodell, Session-Draft, Timer, Vorwerte, Routine-Builder, Supersets, Übungsansicht.
- Katalogsuche und Listenvirtualisierung, Favoriten, eigene Übungen.
- Crash-/Restart-Tests.
- Outcome: kompletter Gym-Workflow funktioniert in der Praxis.

## Phase D — SQLite/Migration und Datenpflege
- Versionierte Datenbank, v7-Migration, Datenintegrität, Backups, Wiederherstellung, Bearbeiten/Löschen, Diagnosebereich.
- Outcome: nach Upgrade keine verlorenen Einträge, nachvollziehbare Speicherfehler.

## Phase E — Progress, Journal, Health-Import
- Alle datenabhängigen Analytics, Cardio, Body-Scan-Review, Maße, Performance, Journal, Recovery, Habits.
- YAZIO nur über gestützte Wege, HealthKit optional.
- Outcome: keine Fake-Metriken, alle Datenquellen kontrollierbar.

## Phase F — Polish, Easter Eggs, Social
- Dezente haptische Details, 9:16-Story, Coach-Töne, Überraschungen, Accessibility-Review.
- Performance- und Langzeitdatentests.
- Outcome: die App fühlt sich unverwechselbar und stabil an.

## Phase G — Release Candidate
- GitHub-Actions-Device-IPA, Build-Logs, Versionierung, sauberes Update statt Neuinstallation, Sideloadly-Tutorial.
- End-to-End-Abnahme auf iPhone, soweit verfügbar.
- Outcome: echte IPA, nachvollziehbarer Prüfbericht, optionales Rollback-Paket.

---

# 17. AUSGABEN UND PROTOKOLL FÜR DEN CODING-AGENTEN

**A.** Erstelle `PRODUCT_SPEC.md` mit Screens, User-Flows und vollständigem Feature-Katalog. Jede Funktion als `implemented / tested / needs-device-test / planned` kennzeichnen.

**B.** Erstelle `DESIGN_SYSTEM.md`: Farben, Schriften, Typografie, Spacing, Corner Radii, Blur, Haptics, Accessibility, Mikrointeraktionen; konkrete Token-Beispiele.

**C.** Erstelle die vollständige **echte App** (React Native + Expo + iOS-Module), ohne produktionsfremde Mockdaten. Bestehende relevanten Features beibehalten, verbessern oder transparent ersetzen.

**D.** Erstelle `MIGRATION_V7_TO_V8.md`, `DATA_SCHEMA.md`, `BACKUP_FORMAT.md`, `PRIVACY.md`, `EXERCISE_LICENSES.md`.

**E.** Erstelle `TEST_MATRIX.md` mit Pass-/Fail-/Untested-Ergebnissen aus real durchgeführten Tests und ggf. repro Steps. Keine erfundenen Coverage-Werte.

**F.** Erstelle `BUILD_WINDOWS_TO_IPHONE.md`: Windows + GitHub Actions + unsigned IPA + Sideloadly + Update nach 7 Tagen. Zeige, wie Nutzerdaten erhalten werden und wie Backup vor Neuinstallation funktioniert.

**G.** Stelle im Release-Report die konkrete Liste aller geänderten Dateien, Migrationsschritte, kritischen Risiken, blockierten Features und Download-Artefakte bereit. Commit-IDs nennen, wenn vorhanden.

**H.** Screenshots nur aus tatsächlich laufender App (Simulator/Device) erzeugen und als `screenshots/` ablegen. Klare Beschriftung, ob Testdaten oder echte Nutzerdaten verwendet wurden; niemals private Daten öffentlich pushen.

**I.** Bei jedem größeren Feature in der Antwort erst sagen, was geändert wurde, dann welche Tests liefen und was noch offen ist. Nicht alle 15 Minuten pauschal „alles gefixt“ schreiben.

**J.** Bevor eine neue Version oder ein ZIP ausgeliefert wird: Quelle in ein frisches temporäres Verzeichnis auspacken, installierbare Abhängigkeiten installieren soweit möglich, alle Tests ausführen, Projektstruktur und Workflow verifizieren. Falls Xcode nicht verfügbar ist, offen sagen und die CI-Änderungen so dokumentieren, dass der User genau einen neuen Testlauf benötigt.

---

# 18. PRODUKT-ABNAHME: SO MUSS ES SICH ANFÜHLEN

**Beim ersten Start:** Keine falschen 110 kg, 80 kg oder erfundenen Trainingswerte. Die App erklärt mit wenigen ruhigen Worten, was sie kann. In Sekunden bereit.

**Vor dem Workout:** Ich sehe meine geplante Session, starte sie mit einem Tippen und finde sofort meine Übungen.

**Im Workout:** Ich sehe „letztes Mal 60 kg × 8 / heute 62,5 kg × 8“, tippe auf den Haken, die Pause startet, und mein Satz bleibt auch nach App-Neustart gespeichert. Ich verliere nie meine aktuelle Übung, wenn ich die App kurz verlasse.

**Nach dem Workout:** Eine schöne, kompakte Zusammenfassung. Ein echter PR wird gefeiert; nichts wird erfunden. Ich kann einen Fehler editieren und die Diagramme stimmen danach.

**Beim Wiegen:** Ein schnell erfassbarer Wert, eine saubere Trendgrafik und realistische Unsicherheit. Kein Body-Shaming.

**Beim Body-Scan:** Import, erkannte Werte prüfen, korrigieren, erst dann speichern; visuell sauberer Vergleich zum letzten Scan.

**Beim Datenbackup:** Export klappt und ist wieder importierbar. Ein App-Update behält meine Daten. Ein misslungener Import löscht nichts.

**Beim Design:** Es wirkt wie eine gestaltete, eigenständige App, nicht wie eine beliebige generierte `DashboardTemplate.tsx`-Sammlung. „Weniger, aber besser“ gilt für jeden einzelnen Bildschirm.

**Beim Release:** Es gibt eine real gebaute unsigned IPA oder einen **klar als offen gekennzeichneten** Buildstatus. Keine falschen Versprechen.

### Letzter Auftrag

Beginne mit einem präzisen Audit meines vorhandenen Projekts. Erstelle dann den **vollständigen Implementierungsplan nach Risiken priorisiert**, setze die Phasen nacheinander **im Repository** um und führe nach jeder Phase die verfügbaren Tests aus. Ziel ist eine fertig benutzbare iPhone-App, nicht nur ein schönes Konzept. Wenn etwas blockiert, gib mir den **exakten Fehler, die betroffene Datei, deine Reparatur und den fehlenden Verifikationsschritt**. Höre erst bei einem vollständigen, ehrlichen Release-Bericht auf.
