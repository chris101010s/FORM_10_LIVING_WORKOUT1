# FORM · tatsächlicher Motion-Katalog / Build 150001

## Laufzeitvertrag

Quelle der 40 Varianten: `src/motion/spec.ts`. Zentraler Lebenszyklus: `src/components/MotionCue.tsx`; konkrete gezeichnete Pfade: `Sketchbook.tsx` sowie die Datenpfade der Charts. Jede Tabellenzeile benennt einen tatsächlichen Produktaufrufer. Der Restbogen ist ein zeitstempelbasierter Ablauf mit Dauer 0; er ist keine Dekorationsschleife.

Alle zeitgesteuerten Varianten verwenden `Easing.out(Easing.cubic)`, in Dezent 78 % der Katalogdauer und kleinere Distanzen/Rotationen, in Lebendig die volle Dauer. Aus, systemweites Reduce Motion und inaktiver AppState führen zum sofort lesbaren Endzustand. Bei unbekannter Reduce-Motion-Einstellung ist Bewegung zunächst aus. Alte Ereignisse werden beim Wechsel zurück nicht nachgespielt.

Neue Ereignisse stoppen die vorherige Animation; unmount entfernt sie. Keine Animations-Endfunktion speichert oder wiederholt eine Domain-Aktion. Normaler Zahlen-/Controlinhalt wird nicht dekorativ gedreht; dafür gibt es einen expliziten dekorativen Pfad für die Figur bzw. eine Zeichnung. Ein abgeschalteter Effekt beeinflusst keinen Tastendruck, keine Eingabegrenze und keinen Timer.

SVG-Striche verwenden strokeDasharray/strokeDashoffset, keine bloß eingeblendete fertige Grafik. Farbe und SVG-Attribute verwenden den JS-Treiber (useNativeDriver: false). Es gibt keine gemessene native FPS-/CPU-Aussage. Der Restbogen aktualisiert sich ausschließlich aus realen Zeitpunkten in einer kleinen Timerkomponente; Zahlen werden nicht getweent.

## Alle integrierten Abläufe

Der Fallback „statisch“ bedeutet Endzustand ohne Bewegung. Bei Erfolgsmarken fehlt zusätzlich die Marke vollständig, solange die Aktion nicht bestätigt ist; notwendiger normaler Text und Controls bleiben sichtbar.

| Nr. | Variante | Tatsächlicher Trigger / Aufrufer | Dauer Dezent / Lebendig | Fallback |
| --- | --- | --- | --- | --- |
| 01 | `inkReveal` | Passendes erstmaliges Öffnen einer eigenen Zeichnung; Sketchbook.tsx → Doodle/NotebookHeader: tatsächliche lokale SVG-Pfade | 452 / 580 ms | Statischer Endzustand |
| 02 | `pencilCheck` | Bestätigter Satzabschluss; InlineSetTable.tsx → PencilCheck nach bestätigter Zeile | 172 / 220 ms | Statisch nur bei bestätigtem Erfolg |
| 03 | `eraserUndo` | Atomar gespeichertes Undo; Gym.tsx → bestätigtes Undo-Feedback mit Radiermotiv | 187 / 240 ms | Statisch nur bei bestätigtem Erfolg |
| 04 | `markerSwipe` | Tatsächlicher heutiger Termin; Home.tsx / Plans.tsx → tatsächlicher heutiger Plan-/Tagesname | 203 / 260 ms | Statischer Endzustand |
| 05 | `paperFlip` | Expliziter Übungswechsel; LivingComponents.tsx → FocusTransition um reale Übungsinhalte | 172 / 220 ms | Statischer Endzustand |
| 06 | `notebookTab` | Wochentag auswählen; Plans.tsx → Beschriftung des gewählten Tagesreiters | 125 / 160 ms | Statischer Endzustand |
| 07 | `stickerPop` | Nach Commit belegter neuer PR; Gym.tsx → realRecords im bestätigten Trainingszettel | 187 / 240 ms | Statisch nur bei bestätigtem Erfolg |
| 08 | `stampPress` | Gespeicherter Trainingsabschluss; Gym.tsx / TrainingAnalytics.tsx → bestätigter Abschluss bzw. archivierter Eintrag | 195 / 250 ms | Statisch nur bei bestätigtem Erfolg |
| 09 | `restDial` | Realer verbleibender Zeitstempel, keine erfundene Tween-Zahl; LivingComponents.tsx → RestStrip; Sketchbook.tsx → RestDial | 0 / 0 ms | Realer Bogen bleibt funktional |
| 10 | `restDone` | Einmaliger Übergang reale Pause zu null; LivingComponents.tsx → einmaliger Übergang der realen Restzeit zu null | 218 / 280 ms | Statischer Endzustand |
| 11 | `stopwatchClick` | Bestätigter Workoutstart; LivingComponents.tsx → WorkoutHeader mit tatsächlicher Startuhr | 140 / 180 ms | Statischer Endzustand |
| 12 | `pausePin` | Bestätigte ausdrückliche Pause; LivingComponents.tsx → bestätigte explizite Workoutpause | 140 / 180 ms | Statisch nur bei bestätigtem Erfolg |
| 13 | `resumeUnpin` | Bestätigtes Fortsetzen; LivingComponents.tsx → bestätigtes Fortsetzen | 133 / 170 ms | Statisch nur bei bestätigtem Erfolg |
| 14 | `extraRow` | Einzeln freigegebener zusätzlicher Satz; Gym.tsx → neue bestätigte row.id; InlineSetTable.tsx → genau diese Zeile | 164 / 210 ms | Statisch nur bei bestätigtem Erfolg |
| 15 | `extraRep` | Explizite gespeicherte Rep-Freigabe; Gym.tsx → confirmedAction(extraRep) nach update() === true | 140 / 180 ms | Statisch nur bei bestätigtem Erfolg |
| 16 | `fieldFocus` | Tatsächlicher TextInput-Fokus; Design.tsx → TextInput onFocus / onBlur | 109 / 140 ms | Statischer Endzustand |
| 17 | `savedDot` | Neuer bestätigter Commit-Zeitstempel; SaveInkStatus.tsx / WorkoutHeader → lastSaved nach Commit | 125 / 160 ms | Statisch nur bei bestätigtem Erfolg |
| 18 | `retryRepair` | Bewusst gestarteter Retry, kein Erfolgssymbol; App.tsx / LivingComponents.tsx / PrivacyDiagnostics.tsx → Fehler/ausdrücklicher Retry | 195 / 250 ms | Statischer Endzustand |
| 19 | `receiptPrint` | Bestätigter Workoutabschluss; Gym.tsx → gespeicherter Review; Sketchbook.tsx → ReceiptPrint | 265 / 340 ms | Statisch nur bei bestätigtem Erfolg |
| 20 | `chartDraw` | Echte Serie / Zeitraum geändert; TrendChart.tsx → ChartInk mit echtem Datenpfad und Serien-/Zeitraumschlüssel | 273 / 350 ms | Statischer Endzustand |
| 21 | `chartCursor` | Echten Datenpunkt ausgewählt; TrendChart.tsx → tatsächlich gewählter Punkt per Tap oder zugänglicher Schrittaktion | 117 / 150 ms | Statischer Endzustand |
| 22 | `prStarDraw` | Belegter PR nach Commit / PR-Archivdatum; TrainingAnalytics.tsx → berechneter PR aus bestätigtem Bestand | 374 / 480 ms | Statisch nur bei bestätigtem Erfolg |
| 23 | `calendarSlide` | Angezeigte Woche oder Monat geändert; TrainingAnalytics.tsx → reale Monatszellen; Planwochen behalten feste Tageslabels | 172 / 220 ms | Statischer Endzustand |
| 24 | `planReorder` | Bestätigte Umsortierung; PlanRoutineEditor.tsx → tatsächliche Positionsliste nach bestätigtem Entwurfswrite | 148 / 190 ms | Statisch nur bei bestätigtem Erfolg |
| 25 | `copyPaper` | Bestätigte Kopie mit neuer Instanz-ID; PlanTools.tsx → bestätigte Kopie, eigene gezeichnete Doppelseite | 187 / 240 ms | Statisch nur bei bestätigtem Erfolg |
| 26 | `folderOpen` | Archiv oder Planliste geöffnet; More.tsx / AppearanceSettings.tsx → tatsächlich geöffnetes Archiv/Zeichenverzeichnis | 203 / 260 ms | Statischer Endzustand |
| 27 | `tapePeel` | Optionale Notiz bewusst geschlossen; PaperDetails.tsx → bewusst geschlossenes optionales MarginNote | 172 / 220 ms | Statischer Endzustand |
| 28 | `clipAttach` | Studionotiz bestätigt gespeichert; EquipmentPanel.tsx → gespeicherte Gerätenotiz, eigener Klammerpfad | 156 / 200 ms | Statisch nur bei bestätigtem Erfolg |
| 29 | `mascotWave` | Eine Begrüßung pro lokalem Tag bei Opt-in; Personality.tsx → Pip allein bei einmaliger Begrüßung | 484 / 620 ms | Statischer Endzustand |
| 30 | `mascotExpression` | Tatsächlicher Ereignis-/Posenwechsel; Personality.tsx → echte Ereignis-/Posenänderung mit Figur-Opt-in | 187 / 240 ms | Statischer Endzustand |
| 31 | `searchPeek` | Lokale Suche geöffnet; LocalSearch.tsx → eigene Lupe beim tatsächlichen Öffnen | 187 / 240 ms | Statischer Endzustand |
| 32 | `emptyDoodle` | Echter Leerzustand; LocalSearch.tsx → echter leerer Suchzustand | 374 / 480 ms | Statischer Endzustand |
| 33 | `connectionSketch` | Bestätigter vorhandener Verbindungsstatus; Nutrition.tsx → erstes persistiertes Verbindungsereignis mit realen Samples | 390 / 500 ms | Statisch nur bei bestätigtem Erfolg |
| 34 | `syncTick` | Erfolgreicher Import + SQLite-Commit; Nutrition.tsx / AppleHealth.tsx → bestätigter Datenimport | 179 / 230 ms | Statisch nur bei bestätigtem Erfolg |
| 35 | `backupEnvelope` | Backup tatsächlich geschrieben und geprüft; BackupCenter.tsx → verifiziertes neues Backup | 250 / 320 ms | Statisch nur bei bestätigtem Erfolg |
| 36 | `launchInk` | Optionaler nichtblockierender Logo-Strich; App.tsx → optionaler nicht blockierender Logo-Strich | 312 / 400 ms | Statischer Endzustand |
| 37 | `filmStrip` | Monats-/Jahresauswahl mit echten Daten; TrainingAnalytics.tsx → horizontaler Film echter Monatsdaten beim Jahreswechsel | 218 / 280 ms | Statischer Endzustand |
| 38 | `themeTransition` | Angezeigte Farbmodusauswahl; Speicherbestätigung separat; AppearanceSettings.tsx → ThemePreview mit tatsächlicher Farbinterpolation | 140 / 180 ms | Statischer Endzustand |
| 39 | `widgetReturn` | Unterstützter echter athleteos://training-Link; App.tsx → unterstützter tatsächlich empfangener athleteos://training-Link | 187 / 240 ms | Statischer Endzustand |
| 40 | `retroWindow` | Optionalen Retro-Dialog geöffnet; AppearanceSettings.tsx → ausdrücklich geöffnetes Sieben-Tap-Retrofenster | 195 / 250 ms | Statischer Endzustand |

## Tests und Bedeutung

`tests/test-motion-lifecycle-second.cjs` führt den tatsächlichen useMotionValue-Hook für jede zeitgesteuerte Variante aus. Geprüft werden fünf schnelle neue Ereignisse, Abbruch des Vorgängers, gleiche Ereignis-ID ohne Replay, Aus/Reduce Motion/inaktiv, Rückkehr ohne Queue, unmount und Unterdrückung unbestätigter Erfolgsmarken. Die tatsächliche Provider-Implementierung wird gegen kontrollierte AccessibilityInfo-/AppState-Ereignisse ausgeführt. Controls bleiben auch ohne Erfolgsmarke direkt auslösbar. Der reale RestDial berechnet Halb-/Endbogen aus Rest-/Gesamtzeit.

Die Personality-Hooks werden mit kontrollierten Timern auf kurze Lebensdauer, Hintergrund-Abbruch, getrennte Opt-ins und fehlenden falschen PR geprüft. `tests/test-design-second.cjs` prüft zusätzlich die Policy und Assetpfade. Domain-/SQLite-Tests prüfen getrennt, dass ein fehlerhafter Write keinen bestätigten Satz/Finish/Backupstatus produziert. Ein JS-Adapterlauf ist keine native Renderprüfung.

Offen: echtes kleines und großes iPhone, VoiceOver, schnelle Navigation mit Tastatur, Reduce Motion auf dem Gerät, App-Sperre/Force Quit, fünf wichtige Motion-Screenrecordings (Start, Check, Extras, Übungswechsel, Finish), native FPS/CPU mit 100+ Historieneinträgen. In dieser Linux-Umgebung werden keine Mockups als Gerätebeweis geliefert.
