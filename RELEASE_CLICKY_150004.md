# FORM 15.0.0 · Zeichnungen und Bewegung · Build 150004

Diese Weiterentwicklung folgt auf den vollständig erfolgreichen Startfix in [Actions Run 12](https://github.com/chris101010s/FORM_10_LIVING_WORKOUT1/actions/runs/45715856130). Sie verändert weder Speicherformat noch App-Kennung oder bestehende Trainingsdaten.

## Sichtbare Änderungen

- Fünf eigene Papier-/Schreibtischillustrationen mit Notizbuch, Kalender, Hantel, Herz, Stift, Tape und ausgeschnittenen Stickern. Jede Illustration hat einen eigenen Layoutkasten; Text und Eingaben werden nicht überdeckt.
- Kurzer sichtbarer Eintritt für Seiten und Illustrationen, endliche leichte Stickerbewegung, animierte Druckrückmeldung bei Buttons, Auswahlchips und Bereichszeilen. Druckaktionen lösen weiterhin unmittelbar die vorhandene Funktion aus.
- Die vorhandenen handgezeichneten Strichanimationen beginnen jetzt auch nach einem kalten App-Start. Zuvor wurde der Ereignisschlüssel verbraucht, bevor iOS seine Bewegungseinstellung geliefert hatte.
- „Bewegung reduzieren“, die App-Einstellung „Aus“ und Hintergrundwechsel stoppen Bewegung. Bereits verbrauchte Ereignisse werden bei Rückkehr nicht erneut als Erfolg gezeigt. Die optionale Figur und Haptik bleiben an die bisherigen Einstellungen gebunden.
- Die Einrichtung zeigt FORM 15. Der Hinweis zur wiederaufgenommenen Session nutzt im dunklen Design eine lesbare Fläche. Der native Stack erhält die zum Farbschema passende Statusleisten-Einstellung.

Die Bildsprache orientiert sich am gewünschten spielerischen Schreibtischgefühl, verwendet jedoch eigene Vektorzeichnungen aus dem bestehenden FORM-System. Es werden keine erfundenen Trainingswerte oder erreichten Ziele illustriert.

## Prüfungen und Grenzen

`test:motion-clicky` führt die tatsächlichen Provider/Hooks mit kontrollierten React-/AppState-/Accessibility-/Animated-Adaptern aus. Er prüft den asynchronen Kaltstart, die erste native Aktivierung, spätere Einstellungsänderungen, Stoppen im Hintergrund und beim Unmount, kein Erfolgs-Replay und unabhängige Benutzeraktionen. Das ist Lifecycle-Evidenz, keine Messung nativer Bildraten.

Der Standard-Workflow verlangt weiterhin echte Release-Starts für `fresh`, `v10-home` und `v10-live`, jeweils mit konkretem Prozess, Screenshot und anschließendem Lesen der SQLite-Daten. Nur danach wird die iPhone-IPA gebaut. Eine optionale native H.264-Aufnahme des Home-Starts wird gesondert protokolliert; ihr Ausfall kann keinen App-Start oder Daten-PASS ersetzen. Eine vorhandene Videodatei allein beweist auch noch keine sichtbare Animation.

Lokale Prüfungen, native CI-Resultate und visuelle Befunde werden erst nach ihrem tatsächlichen Abschluss als Ergebnis festgehalten. App-Kennung bleibt `app.athleteos.personal`, Scheme `athleteos`, Datenbank `form-v84-clean.db`, SQL-Schema 9 und JSON-Schema 4. Marketingversion bleibt 15.0.0; die höhere Buildnummer ist 150004.

## Abgeschlossene lokale Prüfung

Am 25. November 2026 endete `npm run check` mit Exit 0: vollständige vorhandene Tests, neuer Motion-Test, TypeScript und ESLint. Der neue Test besteht 80 Lifecycle-Prüfungen; die bestehende Motion-/Personality-Suite besteht weiterhin 653. Die negative Kontrollprobe des neuen Kaltstart-Tests mit der alten `MotionCue.tsx` scheitert an der fehlenden ersten Animation. Der bestehende Home-/SQL-Commit-Test erhielt ausschließlich zwei neue dekorative Leaf-Adapter und besteht seine unveränderten 47 Daten-/Navigationsprüfungen.

Die tatsächlichen DeskScene-Komponenten wurden zusätzlich mit kontrollierten nativen Leaf-Adaptern in ihrem statischen Endzustand gerendert und visuell in vier Farbpaletten geprüft. Das ist ein Komponenten-Prüfblatt, kein iPhone-Screenshot. Ein unabhängiger Quellcode-Review fand keinen konkreten neuen Startup-/Hook-/Inputfehler. Unter `src/data`, `src/utils`, `src/features/workout` und `modules/form-health` besteht gegen den erfolgreichen Startfix kein Diff. Die native Darstellung und der neue IPA-Nachweis sind Aufgabe des folgenden Actions-Laufs.

## Erster nativer Lauf der Oberfläche: Run 13

[Run 13](https://github.com/chris101010s/FORM_10_LIVING_WORKOUT1/actions/runs/45721670452) prüfte Commit `d345e65fc40bb29a16da6de7d5605cb3763f9bda`, Build 150004. Vollständige QA, Apple-Kryptografie und die native arm64-Release-Kompilierung waren erfolgreich.

- `fresh`: derselbe App-Prozess blieb 34,081 Sekunden einschließlich Screenshot aktiv; die anschließend geöffnete Datenbank hatte das erwartete Schema 9. Der tatsächlich geprüfte Screenshot zeigt FORM 15, die neue Willkommensillustration, lesbare Felder/Chips und beide Startaktionen.
- `v10-live`: Prozessbeobachtung, Screenshot und Datenprüfung bestanden. Zwei historische Workouts, drei Gewichte, eine laufende Einheit und ihre Satz-/Entwurfsdaten blieben erhalten. Der geprüfte Screenshot zeigt die pausierte Einheit mit 00:00:57, den jetzt gut lesbaren Hinweis und eine helle Statusleiste im dunklen Theme. Kein erfasster App-Crash in den beiden gestarteten Szenarien.
- `v10-home`: Die Installation war nach 4,679 Sekunden erfolgreich. Die nachfolgende `get_app_container ... app`-Abfrage überschritt das bisherige 30-Sekunden-Limit (Exit 124, 30,873 Sekunden). Es gab weder einen App-Launch noch eine Videoaufnahme oder Datenprüfung in diesem Szenario. Der Workflow blieb korrekt rot und erzeugte keine IPA.

Die folgende Korrektur betrifft nur die CI-Wartezeit: Beide Containerabfragen erhalten nun in jedem Szenario höchstens 180 Sekunden. Auch nach einer späteren Neuinstallation kann die Simulatorregistrierung verzögert sein. Es gibt weiterhin keine Wiederholung eines fehlgeschlagenen App-Starts, keine geratenen Containerpfade und keine ausgelassenen Prüfungen; das Gesamtlaufzeitlimit des Startprüfschritts bleibt 20 Minuten. App-Code und Buildnummer bleiben unverändert. Eine vollständige Freigabe erfordert den folgenden Lauf.
