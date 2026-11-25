# Second Pass · Phase A · Training, Plan und Analytics

Stand: 25.11.2026. Geprüfter Quellstand: **form-15-first-pass / 05056e2185092d9cc530a9aad5d4935a2de969e0**. Der Arbeitsbaum war beim Beginn dieses Audits sauber. Dies ist die Bestandsaufnahme **vor** Second-Pass-Implementierung; es wurden dafür keine Runtime-Dateien geändert.

Gelesen wurden beide vollständigen Master-Prompts, CHANGESET_15.md, TEST_MATRIX_15.md und die unten genannten tatsächlichen Quellen. Umfang dieses Teil-Audits: Second Pass §4, §6 und die dafür weiterhin verbindlichen Plan-/Satz-/Gym-/Performance-Anforderungen des ersten Prompts. Storage, Medien, HealthKit, Illustrationen und Build werden separat auditiert; ihre notwendigen Schnittstellen sind hier benannt.

## 1. Beweislage und Statusbedeutung

**vorhanden und geprüft** bedeutet in diesem Dokument: tatsächlicher Code vorhanden und durch die angegebene lokale Domain-/Persistenzprüfung gedeckt. Es bedeutet keine erfolgte native Bedienprüfung. **teilweise** bezeichnet eine nutzbare bestehende Teilfunktion mit konkret benannter fehlender Abnahme. **vorhanden aber fehlerhaft** wird nur für tatsächlich reproduzierte Fälle verwendet. **fehlt** bedeutet keinen integrierten, erreichbaren Nutzerfluss gefunden. **nativ blockiert** kennzeichnet ausschließlich das fehlende Geräte-/Simulator-Gate. **bewusst entfernt** betrifft unerwünschte alte Startpfade.

### Bestehende Tests

Der gemeinsame First-Pass-Gate ist in docs/qa/15/final-check.log und TEST_MATRIX_15.md dokumentiert: npm run check, Exit 0. Für diesen Audit wurde der Gesamtgate nicht unnötig wiederholt. Die Quelltexte der folgenden Tests wurden gegen die tatsächlichen Behauptungen gelesen:

| Kürzel | Tatsächliche Prüfung | Belegt | Belegt ausdrücklich nicht |
| --- | --- | --- | --- |
| T-P | tests/test-plan-workout15.cjs, 114 Assertions | Plan-only, stabile Zeilen, Rep-Freigaben, Extras, Snapshots, alte Historie, echte SQLite-Neustarts, Backup, Supersets | Individuelle Sollwerte pro Satz, echte Undo-Transaktion, iPhone-Eingabe |
| T-M | tests/test-plan-management15.cjs, 67 Assertions | JSON-Import, Konflikte, Kopie-IDs, Wiederholungszählung, rohe Entwürfe inklusive eigener Übungsnamen | Planrevisionen, Occurrences, Textparser, Batch-Editor |
| T-L | tests/test-living-workout.cjs, 62 Tests | Uhren, Entwurfs-Restart, Replay, Restaktionen, Übungstausch, SQLite-Rollback | Native Hintergrundzustellung und Force-Quit auf iOS |
| T-D | tests/test-form-deep.cjs, 62 Tests | Satztypen, geeignete Kraftkennzahlen, Backup, alte Blöcke, Hinweise, große synthetische Historie | Individuelle Zielzeilen und neues Progressionssystem |
| T-B | tests/test-form84.cjs, 52 Tests | Legacy-Blöcke, Pausenuhren, Backup, tatsächliche SQLite-Datei | Neues Plan-/Revisionsmodell |
| T-A | tests/test-progress15.cjs, 16 Assertions | Stabile Übungs-IDs, Datumsfilter, Korrektur, geeignete e1RM, getrennte Einheiten, keine künstlichen Punkte | Alle Typ-/Zeitzonen-Kombinationen, Kalender, PR-Archiv, Monatsvergleich |
| R-A | docs/qa/second-pass/phase-a-training-repro.json | Vier unten beschriebene aktuelle Verhalten reproduziert; Node v24.22.3, Linux, originaler First-Pass-Code | Native UI, FPS, iPhone-Performance |

Die zusätzlichen Reproduktionen kompilierten die aktuellen TypeScript-Module in ein temporäres Verzeichnis und führten synthetische Fixtures aus. Kein Nutzerdatensatz und keine Produktionsdatenbank wurden geöffnet. Die Reproduktion lief mit Exit 0; die Werte beschreiben bestätigte Lücken und sind kein behaupteter bestandener Feature-Test.

### Bestehender Speicherweg

Alle aktuellen UI-Schreibaktionen laufen über AthleteProvider.update in src/data/context.tsx und saveRepository in src/data/repository.ts. Der SQLite-Namespace bleibt form-v84-clean.db, Datenbankschema derzeit 9; das öffentliche AthleteData-/Backup-Schema bleibt 4. Routinen/Programme liegen in form_entity, Sessionkopf und unveränderliche Routine-Momentaufnahme in form_session, tatsächliche Sätze in form_set, offene/abgeschlossene Sollzeilen in form_planned_row. Einstellungen, Equipment-Notizen und Editorentwürfe werden als Singleton-Payloads bewahrt. Die Zeilentabellen werden inkrementell aktualisiert. In den Tabellen unten bedeutet „Store/SQLite“ genau diesen Weg.

## 2. Bestätigte konkrete Befunde

| ID | Status | Reproduktion und beobachtetes Ergebnis | Ursache / betroffene Einstiegspunkte | Erforderliche Abnahme nach Änderung |
| --- | --- | --- | --- | --- |
| A-TRAIN-01 | vorhanden aber fehlerhaft | Zeit-Warm-up 60 s plus Arbeitssatz 30 s ergibt im Leistungsverlauf 60 s. Die Sollzeile ist warmup, beide gespeicherten GymSets heißen timed. | plannedSetFromDraft in src/utils/planWorkout.ts erhält die Zieleinheit im Set.kind; exerciseSeries in src/utils/progress15.ts filtert nur Set.kind statt des zugehörigen Zeilen-Zwecks. Fortschritt → Übungsverlauf → längster Satz. | Warm-up-Zweck und Maßeinheit getrennt lesen; Zeit und Distanz sowie Extras/Assistenz separat testen. Historische Payloads erhalten. |
| A-TRAIN-02 | vorhanden aber fehlerhaft | Ein im Körpergewichtsplan erzeugter Warm-up-Satz mit 5 Wdh. und leerem Lastfeld wird mit „Gewicht 0–1000 kg …“ zurückgewiesen. | buildPlannedRows setzt kind=warmup; plannedSetFromDraft/setFromDraft kennen dann die Bodyweight-Semantik des Ursprungssolls nicht. Gym → Warm-up. | Kein erforderliches Lastfeld bei Bodyweight-Warm-ups; keine erfundenen Null-kg-PRs; Übergang alter und neuer Zielzeilen testen. |
| A-TRAIN-03 | vorhanden aber fehlerhaft | 90 kg um 2026-11-21T01:00:00Z, danach 100 kg um 2026-11-20T23:30:00-05:00. Numerisch ist 100 kg später; realRecords liefert keinen Rekord und exerciseSeries ordnet „later, earlier“. | trainingEngine.realRecords und progress15.exerciseSeries sortieren ISO-Texte lexikographisch. Gleiches Muster besteht in Vorwert-/History-Helfern. Zonen-Offsets in Altbeständen dürfen nicht verändert werden. | Für Chronologie Date.parse verwenden; lokale Tagesgruppierung davon trennen. Offset- und DST-Fixtures, Korrektur und Löschung testen. |
| A-TRAIN-04 | teilweise | Aktuell „Satz entfernen“ entfernt den Abschluss, lässt dessen neue Pause aber mit 90 s Restzeit stehen. | removeCompletedRow ist eine Korrektur-/Entfernungsaction, keine vollständige Undo-Gegenoperation. Es existiert kein Undo-Datensatz mit vorherigem Timer/Fokus. | Neues Undo muss die betroffenen Zeilen, Sätze, Fokus, Timer und Benachrichtigungen atomar behandeln. Nicht einfach den bestehenden Button umbenennen. |

Diese Befunde sind vor Implementierung dokumentiert. A-TRAIN-04 ist eine bislang fehlende Second-Pass-Funktion und kein behaupteter Datenverlust des bisherigen Entfernungsbuttons.

## 3. Weitergeltende Anforderungen des ersten Prompts

| Anforderung | Status | Datei / tatsächlicher Einstiegspunkt | Persistenz | Prüfung | Offene Akzeptanz |
| --- | --- | --- | --- | --- | --- |
| Neue Session ausschließlich aus ausgewähltem vorhandenem Plan-Tag | vorhanden und geprüft | Home.tsx, Plans.tsx, Gym.tsx → startPlannedWorkout; planWorkout.validateNewWorkoutTransition im Store | PlanContext + RoutineSnapshot in Session | T-P; Action-Guard | Neue Such-/Kalender-/Occurrence-Routen müssen denselben Guard verwenden. |
| Quick Workout / leere neue Session | bewusst entfernt | makeLive weist fehlende Routine zurück; heutige Startbuttons führen zu echtem Plan | Historie bleibt | T-P; UI-Quellenprüfung | Keine neue Suche oder Komfortfunktion darf den Startschutz umgehen. |
| Alte spontane Session weiterführen/abschließen; alte Werte nicht kürzen | vorhanden und geprüft | Gym legacy branch; livingWorkout.completeSet/finishSession | Bestehende Session-/Set-Payloads ohne plannedRows | T-P, T-L, T-D | Neue Typen/Revisionen dürfen Legacy-Daten nicht nachträglich verschärfen. |
| Genau geplante Zeilen und separat bewusste Extras | vorhanden und geprüft | buildPlannedRows, addExtraRow, PlannedSetTable | Stabile Row-IDs, isExtraSet | T-P | Neue individuelle Zeilen und kopierte Planpositionen müssen die Grenzen erhalten. |
| Rep-Maximum nur pro Zeile erhöhen; weniger ehrlich erlauben | vorhanden und geprüft | validatePlannedDraft, allowExtraRep, direkte Textfelder und Stepper | extraRepAllowance in Row und Set | T-P | Gleiches Verhalten pro Seite bei unilateralem Satz; Copy/Import/Batch mitprüfen. |
| Snapshot unverändert bei späterer Planänderung/Korrektur | vorhanden und geprüft | makeLive, finishSession, correctCompletedSet | routineSnapshot, plannedRows, planContext | T-P, T-M | Revision-/Position-ID ergänzen; Alt-Snapshots unverändert lesen. |
| Unabhängige Entwürfe, Fokus, Uhren, Retry | vorhanden und geprüft | Gym.editRow, context.update, LivingComponents, livingWorkout | Alle geplanten Rows, activeExerciseId, UTC-Start/Rest-Ende | T-P, T-L; Repository-Tests im Gesamtgate | Neue Felder, Undo und Links-/Rechts-Eingaben im echten SQLite-Restart testen. Native Sperre/Force-Quit offen. |
| Satzcheck/Zettel erst nach bestätigtem Save | teilweise | Gym.confirmedAction/saveFinish; PlannedSetTable.confirmed; PencilCheck/ReceiptPrint | Promise<boolean> nach Repository-Commit | Source-Vertrag und Repository-Prüfung | Native Fehler-/Retry-UI prüfen. Nach fehlgeschlagenem Finish bleibt der Abschluss im RAM/Archiv; ein neu gemounteter Gym-Screen zeigt nach Retry nicht automatisch nochmals den lokalen Zettel. |
| Eine Übung im Fokus, expliziter Wechsel, Supersets | vorhanden und geprüft | Gym → aktueller Trainingsbogen; segments.ts | activeExerciseId/Segmente | T-P, T-B, T-L | Neue doppelte Bibliotheksübung als zwei Positionen muss getrennten Fokus haben. |
| Archiv, Korrektur, Datenzugriff | teilweise | Gym mode=history; gemeinsame Archiv-/Korrektur-PageSheet | Sets/Rows werden korrigiert, Snapshot bleibt | T-P und Source-Prüfung | Native Sheet/VoiceOver-Abnahme; Undo für bestätigte Löschung fehlt. |
| Mehrere Pläne, ein aktiver Plan, Zyklus, optionale Tage | vorhanden und geprüft | PlansScreen, plannedDay, saveProgram | Program/ProgramDay | T-M; advanced/form Tests | Occurrences, Deload und Revisionen fehlen. Native Kalenderinteraktion offen. |
| JSON-Planimport mit Vorschau und Konflikten | vorhanden und geprüft | Plans.importPlan/acceptImport, planImport.ts | Bestätigtes applyPlanBundle via Store | T-M | Neue Positionen/Zeilen/Revisionsreferenzen und Textimport ergänzen. |
| Echte geeignete Leistungsserien, neutrale Körperdaten | teilweise | ProgressScreen, PerformanceTrend, WeightScreen | Aus gespeicherten Werten abgeleitet | T-A | Bestätigte A-TRAIN-01/-03 beheben; §6 unten bleibt offen. |
| Kleine Timerkomponenten und begrenzte Listen | teilweise | useWallClock; History FlatList; Explorer 18er-Paginierung; PerformanceTrend | Kein persistenter Animationszustand | Source + Lasttest im First Pass | Katalog ist paginiert, nicht virtualisiert; neue Detailtabellen zugänglich und performant integrieren. Keine FPS-Aussage. |

## 4. Second Pass §4.1 · Individuelle Sollwerte

| Punkt | Status | Tatsächliche Datei / UI | Speicherweg | Bestehender Test | Offene Akzeptanz |
| --- | --- | --- | --- | --- | --- |
| 12/10/8 oder beliebige gültige Ziele je Satz | fehlt | PrescriptionEditor zeigt „SOLL PRO ÜBUNG“; buildPlannedRows wiederholt einen Prescription-Eintrag | Nur ein Prescription je exerciseId | T-P prüft einheitliche Ziele | Pro Zielzeile editieren, Rohtext speichern, je Zeile validieren und starten. |
| Zielgewicht 40/42,5/45 klar von Ist/Vorwert getrennt | fehlt | Prescription besitzt kein Zielgewicht | Kein Zielgewicht-Payload | Kein Test | Zielgewicht optional, Vorschlagsbeschriftung; keine automatisch verbuchte Leistung. |
| RIR/RPE/Pause/Typ/Zeit/Distanz/Notiz/Tempo je Zeile | teilweise | PrescriptionEditor hat vieles pro Übung; Tempo nur Ist-Satz im SetEditor | Globale Prescription, Ist-Draft | T-P, T-D | Eigene Row-Ziele und Notiz/Tempo; individueller Rest wirklich vom abgeschlossenen Satz abgeleitet. |
| Gemeinsame Bearbeitung und Einzelabweichung | fehlt | Editor bearbeitet nur einheitlichen Übungsblock | Entwürfe bereits persistent | T-M | Batch-Vorschau, Auswahl, ausdrückliches Übernehmen, unabhängige Ziel-IDs. |
| Körpergewicht/Zeit/Distanz/AMRAP semantisch passend | teilweise | SetEditor und plannedSetFromDraft; Warm-up-Fehler A-TRAIN-01/-02 | Vorhandene SetKind-/targetMode-Felder | T-P, T-D; R-A | Satzrolle und Zieleinheit entkoppeln, gemischte Zielzeilen vollständig testen. |
| Alte einheitliche Pläne verlustfrei abbilden | teilweise | buildPlannedRows bildet alte Prescription bereits auf Live-Zeilen ab | Alte Routine bleibt erhalten | T-P | Zusätzlich in den neuen Editor adaptieren; nicht bei Load auf neue IDs/Revisionen umschreiben. |
| Immutable Session, explizite Extra-Zeile, ehrliche niedrigere Istwerte | vorhanden und geprüft | makeLive, addExtraRow, allowExtraRep, rowProgress | Snapshot und Rows | T-P | Extra-Vorlage bei individuellen Zielen muss konkrete Position/letzte passende Zielstruktur verwenden. |

## 5. Second Pass §4.2 · Vorwerte und Progression

| Punkt | Status | Tatsächlicher Einstieg / Datei | Persistenz | Test | Offene Akzeptanz |
| --- | --- | --- | --- | --- | --- |
| Sichtbarer unbestätigter letzter vergleichbarer Satz | teilweise | Gym.previous → PlannedSetTable.suggestion; bisher manuell antippbar, nach Ordinalposition | Übernommener Text wird normaler Row-Draft | T-P schützt höheres Rep-Limit; test-workout Vorwerthelfer | Automatische, abschaltbare Vorschläge; Vergleich über Position/Typ/Ziel; Zielgewicht und tatsächlichen Vorwert getrennt zeigen. |
| Keine still gekürzten Vorwerte | vorhanden und geprüft | validatePlannedDraft vor Übernahme | Row-Allowance bleibt separat | T-P | Auch in neuem Vorschlags-/Batch-/Seitenfluss erhalten. |
| Mindestens zwei passende Sessions; kontrollierter RIR; Extras nicht als Erfolg | fehlt | localInsights in coach.ts hat nur einen Hinweis aus drei Topsätzen; kein Vorschlags-/Annahmefluss | Kein Vorschlagsentscheid | Kein passender Progressionstest; der alte Testname allein genügt nicht | Strenge vergleichbare Arbeitssätze, gleiche IDs/Ziele, Datenmangel und Recovery/Pain/Überlastungsgates. |
| Erklärte optionale Steigerung, Halten oder weniger Reps; explizit annehmen/ablehnen | fehlt | Kein Plan-Änderungsdialog aus Performance | Gewichtsschritt existiert als settings.weightStep | Kein Test | Begründung mit konkreten Sessions; Annahme schafft neue Revision, Ablehnung ändert keinen Plan. |
| Geräteschritt/Rundung, Bodyweight/Ausdauer-Regeln | teilweise | Gewichtsschritt in More → Profil; Last-Stepper | settings.weightStep | T-D/Settings-Validierung | Ausrüstung berücksichtigen; Einheitenspezifische Empfehlungen, nie Last für Bodyweight erfinden. |
| Plateau mindestens vier Sessions über Wochen; Lücken/Deload/Wechsel ausschließen | fehlt | Kein Plateau-Modell oder UI | Keine Daten | Kein Test | Dokumentierte Schwellen; keine Aussage bei unzureichender Vergleichbarkeit. |

## 6. Second Pass §4.3 · Gym-Komfort

| Punkt | Status | Tatsächlicher Einstieg / Datei | Persistenz | Test | Offene Akzeptanz |
| --- | --- | --- | --- | --- | --- |
| Undo Abschluss, Extra-Freigabe, Verschiebung, Löschen, Tausch | fehlt | Es gibt Korrektur/Entfernen, aber kein Undo-Angebot/-Journal | Kein undoState | R-A zeigt A-TRAIN-04 | Atomare sichere Gegenoperation nach Commit; Wiederholung, Restart, Konkurrierende Drafts, Timer/PR/Notifications. |
| Ganze Übung auslassen/deaktivieren, optionaler Grund | teilweise | Pro Row „Auslassen/Wieder aufnehmen“; kein positionsweiser Status/Grund | Row.status='skipped' | T-P | Sessionweite Übungsaktion; keine Planlöschung; richtige Sollzählung, wiederaufnehmen. |
| Vorzeitiges Finish und neutrale fehlende Sollsätze | vorhanden und geprüft | Gym.finish/saveFinish, finishSession | Unfertige Rows werden skipped; Ist-Sätze erhalten | T-P, T-L | Mit individuellen Zielen, Pausenevents und Revision vergleichen. |
| Einzelnen Termin verschieben ohne Serie zu ändern | fehlt | Plans „TAG TAUSCHEN MIT“ ändert Serienplan; freies Plan-Datum beim Start ist keine Occurrence | Keine Occurrence-ID/Override | T-M nur Zyklusdatum | Eigene Termin-ID, Konfliktauswahl, optional bleibt optional, alte Workouts unangetastet, keine Doppelzählung. |
| Keyboard Next/Done und optionale Fokusführung | teilweise | TextInput decimal-pad/number-pad, persistente Drafts; keine Ref-/Next-Kette | Text über Store | T-P für Daten, kein nativer Keyboardtest | Gewicht→Reps→RIR nach Wunsch; Done darf keinen Satz abschließen; iOS Zahlenkeyboard testen. |
| Links/rechts getrennte Last/Reps; Last pro Hand/Gesamt | teilweise | SetEditor bietet nur Kennzeichen beide/links/rechts bei einem einzigen Wertpaar | GymSet.side | T-D schließt einseitige e1RM aus | Zwei eigenständige Ist-/Draft-Seiten, explizite Lastbasis, passende Aggregation ohne Verdopplung. |
| Studio/Maschinen-/Übungsnotizen direkt erreichbar | teilweise | Workout-Menü → Geräte- und Studio-Notiz | equipmentNotes[exerciseId] | Roundtrip in T-D | Bei der Übung erreichbar; strukturierte optionale Sitz-/Pin-/Griff-/Rack-/Studio-/Offsetangaben. |
| Scheibenbestand/Stangengewicht, optionale Warm-up-Hilfe | fehlt | form.platePlan und trainingEngine.warmupPlan sind reine alte Helfer; kein aktiver Gym-Fluss; platePlan nimmt feste Scheibengrößen an | Keine konfigurierte Ausrüstung | T-D testet Warm-up-Helfer, nicht UI | Ausrüstung freiwillig eingeben, Vorschau unverbindlich; kein persönliches Default erfinden. |
| Geschätzte Dauer aus Zielen und freiwilliger Satzdauer | fehlt | Kein entsprechender Plan-/Startwert | Keine freiwillige Basis | Kein Test | Schätzung als solche; fehlende Basis zeigen; Blockzeiten/Pauses nicht doppelt addieren. |
| Finish-Vergleich mit letzter vergleichbarer Einheit | teilweise | Receipt zeigt nur aktuelle Dauer, Rows, Extras, Volumen und Lastrekorde | Aktuelles Workout gespeichert | T-P; Source-Check | Vergleichbare letzte Revision/Position, ehrliche Einschränkungen, Pause nur aus tatsächlichen Ereignissen. |
| KeepAwake nur aktive fokussierte Session + Einstellung | fehlt | Kein Modul-/Gym-Hook eingebunden | Keine Einstellung | Kein Test | Health-/Native-Agent liefert Adapter; Tabwechsel/Pause/Finish/Unmount testen, Akkuhinweis. |
| Gym-Schriftgröße / Links-/Rechtshänder | fehlt | SystemfontScale erzeugt schon größere Zeilenansicht; keine Gym-Präferenz | Keine Präferenz | Source-Prüfung | System-Dynamic-Type erhalten, große Eingaben, Check/Schnellaktionen nach Handwahl, SE-Test. |
| Mehrere Extras bewusst einzeln, kein Doppeltipp | vorhanden und geprüft | confirmedAction Busy/400-ms-Guard + expectedCount/expectedAllowance | Stabile ID, spezifische Row | T-P | Undo und Row-Motion dürfen weder Queue noch doppelte Aktion erzeugen. |

## 7. Second Pass §4.4 · Plan-Editor 2.0

| Punkt | Status | Tatsächlicher Einstieg / Datei | Persistenz | Test | Offene Akzeptanz |
| --- | --- | --- | --- | --- | --- |
| Unterschiedliche Zykluswochen, korrekte Woche | vorhanden und geprüft | Plans Wochenreiter, plannedDay, planDateForSlot | Program.weeks/days/start/end | T-M | Occurrences ergänzen ohne Zyklus umzuschreiben. |
| Optionale Deload-Woche, explizite geplante Steigerung | fehlt | Kein Deload-/Steigerungsmodell | Keine Felder | Kein Test | Freiwillige Konfiguration/Vorschau; keine automatisch erfundenen Lasten. |
| Trainingstag/Plan kopieren | teilweise | Plans edit(copy), duplicateProgram, Importkopie | Neue Routine-/Program-ID; Bibliotheks-IDs bleiben | T-M schützt Import-IDs | Eigene Positions-/Ziel-IDs; neuer Bestätigungs-/Revisionsfluss; laufende Session unverändert. |
| Einzelne Übung kopieren/zwischen Tagen verschieben | fehlt | Editor verhindert gleiche exerciseId zweimal; keine Planposition | Nur exerciseIds[] | Kein Test | Eigene Instanz-ID bei stabiler Bibliotheks-ID; kein Bezug auf historische Set-ID. |
| Batch-Editor mit Auswahl und Vorschau | fehlt | Keine Batch-Aktion | Kein Batch-Draft | Kein Test | Zielsätze/Übungen auswählen, Vorschau, raw Draft, ein bestätigter Save. |
| Append-only Revision/Kommentar/Vergleich/alte Version aktivieren | fehlt | saveProgram und Tages-Save ersetzen aktuelle Definition | Keine Revisionsliste | Snapshottests schützen nur Sessions | Neue Revision nur beim bewussten Save; Restore einer Version erzeugt weitere Revision; unbekannte Daten erhalten. |
| Vorübergehend deaktivierte Position/Ersatzliste | fehlt | Gym kann bewusst irgendeine Bibliotheksübung tauschen; Originalbezug bereits vorhanden | originalExerciseId in Live-Row | T-L, T-P für Tausch | Ersatzliste pro Position, deaktivierte Ziele sichtbar; kein dauerhafter Planwechsel im Gym. |
| Individuelle Satzpause und Superset-Verhalten | teilweise | Pause bisher pro Übung; Gruppenverhalten in logTrainingSet | Prescription.restSeconds, Segment | T-P, T-B | Rest vom konkreten beendeten Ziel; Superset-Innenschritt weiterhin ohne Pause, letzte Position individuell. |
| Textimport lokal, Mehrdeutigkeit bestätigen | fehlt | UI akzeptiert Dateityp text/plain, parsePlanBundle parst trotzdem JSON | Nur bestätigter JSON-Import | T-M | Echter Parser mit Entwurf/Vorschau; Montag/Übung/Einheit/Typ/ID explizit zuordnen; unbekannte Namen nicht raten. |
| Bestehende JSON-Formate kompatibel | vorhanden und geprüft | planImport v1/v2/legacy | Bestätigter Bundle-Import | T-M | Neue Positions-/Revisiondaten erweitern, alte Inhalte verlustfrei. |
| Geplante Arbeitssätze nach Muskelgruppe, primär/sekundär und optional getrennt | fehlt | Katalog besitzt primaryMuscles/secondaryMuscles; keine Wochen-Sollauswertung | Katalogquelle; Custom Exercises nur group | test-catalog prüft Felder | Sollableitung getrennt von Ist; unbekannte Zuordnung offen zeigen; keine Prozentgewichtung. |

## 8. Second Pass §6 · Analytics

| Punkt | Status | Tatsächliche Datei / UI | Datenweg | Test | Offene Akzeptanz |
| --- | --- | --- | --- | --- | --- |
| Ruhige Details, wenige freiwillige Favoriten | teilweise | Fortschritt hat einen kompakten Verlauf plus Detailrouten; Heute ruhig | Keine Kennzahlenfavoriten | Source-Prüfung | Optional max. wenige Favoriten; Standard nicht erweitern. |
| Trainingskalender mit echtem Einheit-Tap und allen Terminstatus | teilweise | Health.WeekReport nur aktuelle Woche; Zeilen sind nicht anklickbar | weekOverview aus aktuellem Serienplan + Workout-Kontext | T-M | Monats-/Datumsauswahl, Sessions öffnen, Occurrences/ausgelassen/optional/Ruhe korrekt, lokale Tagesgrenzen. |
| Monatsvergleich/Jahresverlauf, gleich lange Fenster | teilweise | YearReview im Werkstatt-Archiv zählt Einheiten/Sätze/Trainingstage pro Monat | Ableitung aus Workouts | T-B | Soll/Ist/Extras/Dauer/geeignetes Volumen, Teilmonate kennzeichnen, Monatsvergleich mit gleiche Zeitbasis. |
| PR-Archiv mit Last/Reps bei Last/e1RM/BW/Zeit/Distanz | teilweise | realRecords nur Last mit Datum/Set; personalRecords nur Zusammenfassung; kein eigener PR-Archivfluss | On-demand aus aktuellen Sets | T-D; R-A | Vollständige passende PR-Typen, klare Rolle/Einheit, Korrektur/Löschung neu rechnen, A-TRAIN-01/-03. |
| Verlauf bei gleicher Last, Top-/Arbeitssätze, RIR-Kontext | teilweise | PerformanceTrend zeigt Load/Reps/Volumen/e1RM/Zeit/Distanz + Sätze/RIR | Stabile Übungs-ID; keine echte Vergleichbarkeitsgruppe | T-A | Lastfilter, Position/Revision, keine vermischten Assistenz-/BW-/Zeitwerte, Progressionsbasis verlinken. |
| Wochenvolumen/Sätze pro Muskelgruppe | fehlt | Katalog liefert Zuordnungen, keine Ist-Auswertung | Keine gespeicherten Aggregate nötig | Kein Test | Primär/sekundär getrennt; Warm-up optional, Last/BW/Zeit/Distanz getrennt; Herkunft/Unbekannt zeigen. |
| Soll/Ist pro Routine und Satz, Revision unterscheiden | teilweise | Workoutarchiv und PerformanceTrend zeigen nur Soll-/Ist-Anzahlen und Rep-Max einzelner Sätze | Snapshot und Rows vorhanden, keine Revision-ID | T-P, T-A | Zeilenvergleich mit individuellen Zielen, alte Revisionen sauber anzeigen, ehrliche Minderleistung neutral. |
| Durchschnittsdauer; bewusste Pause separat | teilweise | sessionReview/elapsedMs ziehen pausedMs ab; aktuell kein eigener Durchschnittsdetailfluss | startedAt/finishedAt/pausedMs | T-L, T-B | Abgeschlossene Sessions mitteln, Zeitraum und pausierte Dauer separat, Altbasis kennzeichnen. |
| Tatsächliche Pausen mit beobachteter Anzahl | fehlt | Nur aktueller restUntil/restPausedMs; finishSession speichert keine Restereignisse | Kein Ereignisverlauf | Kein Test | Gemessene Timersegmente, Anzahl/Basis offen anzeigen; Planpause niemals als tatsächliche Pause ausgeben. |
| Zeitbasierter interaktiver Chart und Tabelle | teilweise | TrendChart reale X-Abstände, Cursor über Pfeile, Datum/Wert/Einheit, Vergleich | Ableitung, kein Persistenzbedarf | T-A für Daten; Source für Chart | Direktes Antippen/Fadenkreuz, echte zugängliche tabellarische Alternative, native Bedienprüfung. |
| 7/30/90/180/Jahr/gesamt, Wechselanimation, Export | teilweise | PerformanceTrend 30/90/365/alle; ChartInk keyed by Daten; Story-Export separat | Keine Favoriten/Chart-Exportoption | T-A; Motion Source | 7/180 ergänzen wo sinnvoll; keine Animation pro Timer-Tick, optionaler Datenexport mit Vorschau. |
| Schlaf/Erholung neben Training mit genügender gemeinsamer Basis | fehlt | Recovery-Logs und lokale Hinweise existieren, keine gepaarte Analyse | recovery/healthEntries + workouts vorhanden | T-D nur Hinweisregeln | Gleiche lokale Tage, Mindestanzahl Paare, fehlend nicht null, Quelle und keine Kausalitäts-/Diagnosebehauptung. |
| Neutrale Körper-/Ernährungsansichten | vorhanden und geprüft | WeightScreen, HealthScreen, NutritionScreen | Tatsächliche getrennte Quellen/Logs | T-A; Nutritiontests separat | Neue Analytics dürfen keine Gewichts-/Kalorien-Wettbewerbe einführen; native Sichtprüfung offen. |

## 9. UI-Aktionsinventar und echte Integration

| Vorhandene Aktion | Tatsächliche Wirkung / Grenze | Konsequenz für Second Pass |
| --- | --- | --- |
| Heute/Training/Plan → Start | Domain-Guard, echte Routine, vollständige Ziele; Plan navigiert erst nach erfolgreichem Update | Alle neuen Einstiege ausschließlich auf dieselbe Action routen. |
| Plan-Datum wählen | Ändert den nächsten Sessionkontext, verschiebt keinen Kalendereintrag | Durch klare Occurrence-Auswahl/-Verschiebung ergänzen; nicht als fertige Terminverschiebung bewerben. |
| TAG TAUSCHEN MIT | Ändert Serienwochentage, ggf. Tausch mit belegtem Tag | Als Serienplanoperation weiter klar benennen; separate Einzelterminaktion. |
| Trainingstag übernehmen | Gültige Draftwerte werden in aktuellen Plan geschrieben; nur erfolgreich schließen | Revision erst hier appendieren, niemals beim Autosave. |
| + Wdh. / + Satz / + Warm-up | Explizite Action, eigener Zustand, keine implizite Leistung | Commitgebundene Motion/Undo erst nach wahrer Bestätigung. |
| Auslassen / Wieder aufnehmen | Nur einzelne Sollzeile, Ist bleibt unberührt | Ganze Position und optionalen Grund hinzufügen. |
| Korrigieren / Entfernen | Tatsächliche Datensätze bearbeiten; Archiv und Korrektur teilen eine PageSheet | Undo-Angebot mit Scope und Datenprüfung, keine zweite parallele Sheet. |
| Trainingszettel teilen | Expliziter Share mit echtem Namen, Satzanzahl, Dauer | Vergleich ergänzen, Datenexport freiwillig; keine Körper-/Gesundheitsdaten automatisch ergänzen. |
| Übungsbibliothek / Favorit / Foto | Echte lokale Suche, Filter, gespeicherte Favoriten, spezifische Lizenzbilder | Neue globale Suche darf nur Detail öffnen; nicht heimlich starten. |
| Fortschritt-Routen | Alle aktuellen Routen rendern reale Unterseiten; Kalenderwoche und Chartpunkte haben noch keinen Einheit-Deep-Link | Neue Detailrouten mit tatsächlichen Workout-/Exercise-/Revision-IDs. |

Im geprüften Trainingsumfang wurden keine bewusst funktionslosen Erfolgsbuttons gefunden. Fehlende neue Abläufe sind oben als fehlend/teilweise ausgewiesen. Sourceprüfung ersetzt keine echte Tap-/Keyboard-Abnahme.

## 10. Vorschlag für additives Datenmodell und Zuständigkeiten

Noch **kein implementierter Vertrag**. Root-GO und finale Typenabstimmung gehen vor Runtime-Änderungen. Nach letzter Root-Abstimmung editiert der Workout-Agent schema.ts; der Daten-Agent besitzt Validierung und Persistenz. Workout-spezifische additive Typen können in src/features/workout/secondPassTypes.ts liegen, ausschließlich mit type-Imports auf bestehende Typen; schema.ts bindet sie an den vereinbarten Stellen ein.

### 10.1 Planpositionen und Satz-Ziele

- Routine.positions?: RoutinePosition[] wird für neue/editierte Routinen der kanonische geordnete Inhalt. RoutinePosition enthält eine eigene stabile id, die Bibliotheks-exerciseId, enabled, optional replacementExerciseIds, optional deload/Belastungsnotiz und targetRows.
- PlannedSetTarget enthält id, Satzrolle/Typ, targetMode, repsMin/repsMax oder offene Definition, optional weightKg, RIR/RPE, restSeconds, Tempo, Zeit/Distanz, Notiz und freiwillig geschätzte Satzdauer. Warm-up-Zweck bleibt von Bodyweight-/Zeit-/Distanz-Maßeinheit unterscheidbar.
- Alte exerciseIds/prescriptions werden weiter gelesen. Ein reiner Adapter expandiert sie deterministisch in Positionen/Ziele. Kein Load schreibt neue IDs/Revisionen in Altbestände. Bei explizitem Speichern wird die kompatible exerciseIds-Projektion erzeugt; sie darf nicht die Positionen zum zweiten konkurrierenden Soll machen.
- RoutineSegment bekommt optional positionIds. Alte Segmente mit exerciseIds bleiben gültig. Live-Fokus benötigt optional activePositionId; eine Bibliotheksübung kann zweimal im Plan stehen, ohne Draft/Timer/Zeilen zu teilen.
- PlannedSetRow ergänzt optional planPositionId, targetId, targetWeightKg, targetRestSeconds, targetRir/targetRpe/targetTempo/targetNote und eine passende Last-/Seitenbasis. Existierende Row-IDs, Felder und Snapshots bleiben lesbar. Neue Rows verweisen auf genau einen Zielpunkt des Snapshots.

### 10.2 Revisionen und Termine

- AthleteData.planRevisions?: PlanRevision[]; append-only Datensätze mit id, programId, createdAt, optional comment/parentId/source und vollständiger Program-/Routine-Momentaufnahme. Aktueller Program.revisionId und PlanContext.revisionId zeigen auf die akzeptierte Revision.
- Eine bestätigte Änderung hängt genau eine Revision an; Draft-Autosave hängt keine an. Wiederaktivierung einer alten Version erzeugt eine neue Revision. Bei gemeinsam genutzten Routinen wird der betroffene Scope ausdrücklich angezeigt.
- AthleteData.planOccurrences?: PlanOccurrence[] enthält nur datierte Abweichungen. Stabile id, programId, routineId/Position des Tages, originalDate, scheduledDate, training/optional, optional skipReason/status/updatedAt. Die ID bleibt bei erneutem Verschieben gleich. Keine Kopie der gesamten Terminserie.
- PlanContext ergänzt occurrenceId und originalScheduledDate. Start/WeekReport/Home/Kalender zählen dieselbe Occurrence höchstens einmal, während ausdrücklich wiederholte tatsächliche Sessions in der Historie sichtbar bleiben. Abgeschlossene Sessions werden nicht nachträglich umdatiert.
- Daten-Agent speichert Revisions-/Occurrence-Listen in form_entity und prüft append-only Änderungen am interaktiven Store-/Repository-Übergang; explizites Backup-Restore bleibt ein getrennter validierter Pfad.

### 10.3 Sicheres Undo und beobachtete Pausen

- AthleteData.undoState?: UndoRecord|null ist ein begrenzter einzelner letzter Undo-Schritt. Discriminated Scope für live/workout/occurrence; id, action, entityId, createdAt, vorheriges betroffenes Aggregat und Fingerprint des erwarteten Zustands nach der Action.
- Gegenoperation vergleicht nur das betroffene Aggregat und ersetzt nur dieses. Profil, Settings und fremde Drafts werden niemals durch einen kompletten AthleteData-Snapshot zurückgesetzt. lastSavedAt ist kein fachliches Vergleichsmerkmal. Bei später geänderten betroffenen Daten wird Undo sicher verweigert und die Grenze erklärt.
- Undo wird als Teil derselben bestätigten Datenaktion gespeichert, idempotent verbraucht und über Neustart validiert. Nachfolgeaktionen ersetzen/verwerfen den vorherigen Schritt nach dokumentierter Regel. Vollständige Sessionkopie nur für seltene bewusste Actions, nicht pro Tastendruck.
- Optionale restTimerId/restEvents erhalten echte gestartete/gestoppte Timersegmente, tatsächliche Zeitpunkte, bewusste Pause und Stopgrund. Alte Sessions ohne Beobachtung liefern „nicht gemessen“, keine geschätzte Ist-Pause.
- Notification-Owner ist der Health-/Native-Agent. Desired notification IDs beziehen Session, Timer-ID und Endzeit ein. Erfolgreiches Undo stellt Timerzustand wieder her; native Reconciliation läuft nach Commit. Keine direkte Notification-Nebenwirkung im reinen Domain-Helfer.

### 10.4 Unilateral, Ausrüstung und Einstellungen

- Optionale typisierte getrennte linke/rechte Istwerte und Rohentwürfe; explizite loadBasis für Gesamt-/pro-Hand-/pro-Seite-Angabe. Der endgültige Typ muss mit allen Set-Validatoren, describeSet, Volumen, PR, Export und Health-Export zusammen abgestimmt werden, bevor er eingebaut wird. Kein stiller neuer Multiplikator auf alten side-Werten.
- Optionale Equipment-Konfiguration enthält nur Nutzerangaben (Stangengewicht, Scheibeninventar/Anzahl, Gerät/Studio, Stack-Offset); freie bisherige equipmentNotes bleiben verfügbar.
- Optionale settings für Vorschläge, Fokusführung, Gym-Schriftgröße, Handlayout, KeepAwake und Progressionsschritte; Defaults verändern keine Historie und erzeugen keine persönlichen Trainingswerte.
- Health-/Native-Agent bietet WorkoutKeepAwake mit active-Prop. Gym mountet es nur für den tatsächlich fokussierten aktiven Workoutscreen; Native Tab focus und Unmount müssen in der Integration berücksichtigt werden.

## 11. Vorgeschlagene Implementierungsaufteilung nach GO

| Owner | Konkrete Zuständigkeit | Verbindliche Integration |
| --- | --- | --- |
| Workout-Agent | schema.ts und additive Workout-Typdefinitionen nach Absprache; pure Plan-/Ziel-/Occurrence-/Revision-/Undo-Actions; Gym/Planeditor/InlineSetTable/SetEditor; Progression; Analytics-Datenmodelle und echte Detailseiten | Bestehende Screens und Store-Actions erweitern. Keine unbenutzten API-Stubs als Erfüllung. |
| Daten-Agent | validation.ts, relationale Einordnung, Übergangsregeln, Backup/Restore/Unknown-Field-Erhalt, Transaktionen | Neue Entities/Undo/Row-Ziele tatsächlich im SQLite-Restart und Backup prüfen. |
| Health-/Native-Agent | Notification-Reconciliation, KeepAwake-Adapter, native Fähigkeitsprüfung; globale Suche | Suchergebnisse öffnen echte Detail-IDs; keine neue Startaction. |
| Root | Navigation/Home-Verknüpfung, Motion-/Copy-/Charakter-/Art-API, Einstellungen, Dokumentaggregation | Workout verwendet vorhandene Motion bis gemeinsame API verfügbar; Erfolgsevents nur nach Commit. |

Root hat MotionCue mit variant/eventKey/confirmed und SketchEvent mit typisiertem Ereignis/eventId/confirmed angekündigt. Diese APIs sind hier Planungsgrundlage, noch kein Nachweis ihrer Implementierung. Gym muss fachliche Actions unabhängig von Effekten halten.

## 12. Konkrete nächste Abnahme-Gates

1. **Additive Datenbasis:** alte v10/v15-Fixtures unverändert laden; gleiche IDs/Werte/Zeiten; neue Position-/Ziel-/Revision-/Occurrence-/Undo-Felder im echten SQLite-Restart und Backup; unbekannte Felder erhalten. Jeder neue Datenweg mit existierendem Store verbunden.
2. **Plan/Gym:** 12/10/8 mit 40/42,5/45 kg starten; zwei unterschiedliche Entwürfe; überhöhte Rep ohne/mit Zeilenfreigabe; bewusster Extra-Satz; Satz-Undo und Re-Check; Row-Pause und Superset; unilaterale Werte; Skip/Finish; Kopie-/Batch-/Revision-/Occurrence-Konflikt.
3. **Progression:** zwei passende Sessions reichen für begründeten optionalen Vorschlag, eine nicht; fehlender RIR/Schmerz/Überlastung/Deload/uneinheitliches Soll unterdrückt; Extras zählen nicht als erreichte geplante Arbeit; vier ausreichend verteilte Sessions für Plateau; explizite Annahme erzeugt Revision.
4. **Analytics:** bestätigte A-TRAIN-01/-03 als Regressionen; Tagesgrenzen und Offset/DST; Wochenmuskelgruppen ohne Doppelprozentrechnung; PR-Typen, Korrektur/Löschung, echte Monatsfenster, Soll/Ist-Revisionsbezug, gemessene Pausen mit Anzahl; fehlende Gesundheitswerte nicht null.
5. **Native offene Abnahme:** iPhone SE und größeres Gerät, VoiceOver, große Schrift, Tastatur, Handlayout, Resttimer/Notifications mit Skip/Undo/Finish/Discard, KeepAwake-Fokus, App-Wechsel/Sperren/Force-Quit nach Commit; tatsächliche Screenshots/Clips nur aus echter Ausführung.

Das Pflicht-E2E des zweiten Prompts ist mit dem First-Pass-Code **noch nicht erfüllt**: individuelle Zielzeilen, Occurrence-Verschiebung, echtes Undo und abschließender Vergleich fehlen. Die bestehenden Plan-only-/Zeilen-/Snapshot-/Persistenz-Fundamente sind wiederzuverwenden.

## Nachherstand nach der Umsetzung

Das Audit oben dokumentiert unverändert den vor den Runtime-Änderungen gesicherten Ausgangsstand. Der konkrete nachher geprüfte Trainingsstand ist in `docs/second-pass-training-result.md` beschrieben. Das vollständige Vorher-/Nachherregister beider Aufträge steht in `SECOND_PASS_AUDIT.md`; Analytics, Komponentenregressionen, finale Befehle und offene native Akzeptanz sind in `CHANGESET_15_SECOND_PASS.md` und `TEST_MATRIX_15_SECOND_PASS.md` belegt. Die finale gemeinsame Prüfung besteht aus 197 neuen Trainings-Assertions, 84 Analytics-Assertions und 47 Home-/App-Komponentenprüfungen sowie den erhaltenen Altregressionen. Diese lokale Prüfebene ersetzt keine iPhone-Bedienabnahme.
