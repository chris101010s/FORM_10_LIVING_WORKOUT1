# Second Pass · Ergebnis für Plan und Training

Stand: 25.11.2026. Dieses Dokument beschreibt den implementierten Second-Pass-Umfang nach dem Audit-GO. Die historische Bestandsaufnahme in `docs/second-pass-audit-training.md` bleibt unverändert: Sie beschreibt ausdrücklich den First-Pass-Stand vor der Umsetzung.

**Abnahmestatus:** Die unten beschriebenen Aktionen sind in erreichbare App-Oberflächen integriert und verwenden die vorhandene Schreibpipeline. Die neue Domain-Suite besteht mit **197 Assertions**, der vollständige TypeScript-Check mit Exit 0. Native Bedienung, Sperrbildschirm, Force-Quit, VoiceOver und echte Bildschirmaufnahmen wurden auf dieser Linux-Umgebung nicht ausgeführt. Sie sind keine behaupteten bestandenen Tests.

## 1. Tatsächlich integrierte Flüsse

| Bereich | Erreichbarer Einstieg | Umsetzung und persistierter Zustand |
| --- | --- | --- |
| Individuelle Satzvorgaben | Plan → Trainingstag bearbeiten → Satzvorgaben → Einzeln bearbeiten | `Routine.positions` enthält stabile Planpositionen und einzelne `PlannedSetTarget`-IDs. Last, Wiederholungsbereich, Satzart, RIR/RPE, Pause, Tempo, Zeit/Distanz, Notiz und freiwillige Satzdauer gehören zum jeweiligen Ziel. `SetTargetEditor` und `BatchTargetEditor` bearbeiten echte Ziele. |
| Unfertige Eingaben | Planeditor, Geräteangaben, Textimport, laufendes Training | Rohe Zahlen wie `42,` bleiben im jeweiligen Entwurf erhalten. Der gespeicherte gültige Zielwert wird nicht still auf 42 geändert. Finales Übernehmen blockiert ungültige aktive Eingabefelder. Alte gemeinsame Editorentwürfe werden erst nach ausdrücklicher gültiger Übernahme auf Einzelziele abgebildet. |
| Bestätigter Entwurfstatus | Plan → Planname, Zeitraum und Zyklus | Die Meldung „lokal gespeichert“ setzt einen kanonisch gleichen `confirmedData.programEditorDraft` voraus. Zwischen lokaler Eingabe und Commit zeigt die Oberfläche weiterhin Speichern an. |
| Geplanter Start | Home, Training und ausgewählter Plantermin | `startPlannedWorkout` und der zentrale Übergangsschutz verlangen einen tatsächlichen zugeordneten Plan-Tag. Programm, Zykluswoche, Wochentag, Termin-ID und Datum bleiben eindeutig. Suche öffnet Details. Sie schafft keinen freien Startpfad. |
| Feste Sollzeilen und Extras | Training → aktuelle Planposition | `PlannedSetTable` zeigt die vorhandenen Zielzeilen. Ein eigener Entwurf gehört zu jeder Zeile. Mehr Wiederholungen brauchen die Freigabe genau dieser Zeile; zusätzliche Sätze brauchen eine eigene Action. Ein Extra erbt Zielstruktur, Lastbasis und Seitenform, enthält aber keine bestätigte Leistung. |
| Unveränderliche Vorgaben | Start → Training → Abschluss / Archivkorrektur | Die Session hält die Routine-Momentaufnahme und ihre Position-/Zielbezüge. Spätere Planrevisionen ändern weder laufende noch abgeschlossene Sollwerte. Korrekturen aktualisieren Istwerte und ausdrücklich benötigte Freigaben, nicht die ursprüngliche Vorgabe. |
| Vorwerte | Aktuelle Satzzeile, optional über Gym-Einstellungen abschaltbar | Der letzte vergleichbare tatsächliche Satz wird als unbestätigter Vorschlag markiert. Ein höherer alter Rep-Wert bleibt sichtbar und wird nicht gekürzt; zum Check ist die passende Freigabe nötig. Zielgewicht und Vorwert haben verschiedene Beschriftungen. |
| Progressionsentscheidung | Planposition → Entwicklung & nächste Vorgabe; Übungsverlauf → gleiche Planposition | Regelbasierte Vorschläge zeigen die verwendeten Sessions und die neuen Zielgewichte. Explizite Annahme erzeugt eine Planrevision. Ablehnen speichert nur die Entscheidung. Extras gelten nicht als absolvierte geplante Arbeit. |
| Rückgängig | Training, Archiv und einzelner verschobener Termin | `liveAction`, `historyAction` und Occurrence-Actions speichern den vorherigen betroffenen Zustand zusammen mit dem neuen Zustand. `undoLastAction` führt eine echte Gegenoperation aus. Fremde Einstellungen und andere Aggregate werden nicht zurückgesetzt. |
| Auslassen und Ersatz | Trainingsmenü / aktuelle Übung | Eine gesamte Position kann mit optionalem Grund ausgelassen werden. Sollzeilen bleiben vorhanden. Ein Ersatz verändert nur offene Zeilen dieser Session und hält den ursprünglichen Übungsbezug; vorhandene Ist-Sätze behalten ihre tatsächliche Übungs-ID. Geplante Ersatzübungen sind direkt auswählbar. |
| Einzeltermin verschieben | Plan → konkreter Plan-Termin | Eine `PlanOccurrence` hält ursprüngliches und neues Datum unter derselben ID. Optionale Termine bleiben optional. Ein Konflikt braucht eine ausdrückliche Auswahl, statt einen fremden Termin zu überschreiben. Abgeschlossene oder laufende Termine werden nicht umdatiert. |
| Links/rechts und Lastbasis | Satzeditor, Planvorgabe und Übungsverlauf | Linke und rechte Last/Reps/RIR bleiben getrennt. Das Volumen addiert beide tatsächlichen Seiten genau einmal. „Je Hand“ bei einem beidseitigen Satz zählt zwei Hände, Gesamtlast einmal. Der Verlauf bietet für Seitenwerte „Höchster Seitenwert“, „Nur links“ und „Nur rechts“. |
| Geräteangaben | Neben der aktuellen Übung → Gerät & Studio | Studio, Maschine, Sitz, Pin, Griff, Rack, Notiz, freiwilliges Leergewicht/Offset, Stangengewicht und Scheibenbestand sind echte lokale Angaben. Rohentwürfe bleiben gespeichert. Der Rechner verwendet diese Angaben; vorgeschlagene Warm-ups erzeugen nur offene Extraentwürfe. |
| Geschätzte Dauer | Planeditor oberhalb der Positionen | Die Schätzung verwendet vorhandene Zielzeiten, freiwillige Satzdauern, individuelle Pausen und Blockfenster. Unbekannte Satzdauern werden gezählt und sichtbar als fehlende Grundlage bezeichnet. EMOM/Intervall zählt ein Fenster je Ziel, AMRAP ein Blockfenster; Pausen werden dabei nicht zusätzlich als Blockzeit gezählt. |
| Tatsächliche Pausen | Restanzeige, Abschlusszettel und Analytics | `restEvents` hält echte laufende Timerintervalle, Pausieren/Fortsetzen und Stopgründe. Neue Satzpausen schließen alte Beobachtungen und löschen einen alten `restPausedMs`-Zustand. Ohne Beobachtung wird keine Istpause erfunden. |
| Trainingsabschluss | Training → Überprüfen → Speichern & abschließen | Der Zettel erscheint erst nach Commit. Ein fehlgeschlagener Abschluss bleibt im RAM und kann über die vorhandene Retry-Pipeline bestätigt werden. Die Oberfläche zeigt geplante/erledigte/zusätzliche Sätze, aktive Dauer, geeignetes Volumen, beobachtete Pausen und einen aufklappbaren Last-/Reps-Vergleich zu eindeutigen früheren Zielzeilen. |
| Zyklus, Kopie und Versionen | Plan verwalten → Wochen / Trainingstage / Versionen | Wochen, ganze Trainingstage und einzelne Positionen können ausdrücklich kopiert oder verschoben werden. Neue Instanz-/Ziel-/Block-IDs referenzieren weiterhin dieselben Bibliotheksübungen. Wochenanpassungen und Deload sind bewusst konfiguriert. Eine bestätigte Änderung hängt eine Revision an; Entwurfstastendrücke nicht. |
| Revisionsvergleich | Plan verwalten → Versionen ansehen | `comparePlanRevisions` zeigt tatsächliche Vorher-/Nachher-Werte: Tage, Übungen, Reihenfolge, Ziele, Pausen, Tempo, Notizen und Blockangaben. Neue Kopie-IDs allein erzeugen keine vermeintliche Inhaltsänderung. Wiederaktivierung erzeugt eine neue Revision. |
| Text- und JSON-Import | Planübersicht → Text einfügen / Datei importieren | Der Textparser arbeitet lokal und deterministisch. Vorschau verlangt ausdrücklich bestätigte Übungs-ID, Tag, Satztyp/Einheit, Lastart und Lastbasis. Unklare Zeilen werden blockiert. Bestehende JSON-Formate und der Konflikt-/Kopierweg bleiben vorhanden. |
| Katalog | Training → Bibliothek oder Planeditor → Übung auswählen | Tatsächliche horizontale `FlatList` mit 18 Einträgen pro Seite, einem Startfenster und begrenztem Renderfenster; Swipe und Seitentasten bedienen dieselbe Liste. Sie liegt quer zur vertikalen Hauptseite. Suche, Muskel-/Gerätefilter, konkrete lizenzierte Bilder und die eigene Übungs-ID bleiben erhalten. |

Die §6-Detailseiten, der Kalender, Monats-/Jahresvergleiche, PR-Archiv, Muskelgruppen, Schlafbezug und das interaktive Diagramm wurden im gemeinsamen Projekt von Root übernommen. Sie verwenden dieselben Workout-, Ziel-, Termin- und Pausenmodelle. `PerformanceHub` und `progress15.ts` bleiben die integrierten Übungsverläufe; die neue Hauptnavigation öffnet die jeweiligen tatsächlichen Detail-IDs.

## 2. Behobene nachgewiesene Fehler

Die drei ersten Audit-Reproduktionen sind Regressionen in `tests/test-training-second.cjs`:

1. Ein Zeit-Warm-up mit 60 Sekunden wird nicht mehr als bester 60-Sekunden-Arbeitssatz ausgewertet, wenn der tatsächliche Arbeitssatz 30 Sekunden beträgt. Satzrolle und Maßeinheit werden unabhängig behandelt. Historische Zeilenbezüge werden beim Lesen berücksichtigt.
2. Ein Körpergewichts-Warm-up verlangt kein erfundenes Lastfeld. Seine tatsächlich dokumentierten Wiederholungen bleiben erhalten und erzeugen keinen Null-Kilogramm-Kraftrekord.
3. Reihenfolge und Rekorde verwenden numerische Zeitpunkte statt lexikographisch sortierter ISO-Texte. Die Regression enthält verschiedene explizite Zeitzonen-Offsets.

Weitere konkrete Integrationskorrekturen:

- Ein neuer Satz nach pausierter Restzeit entfernt den alten Pausenrest und startet nur den zur neuen Zeile gehörenden Timer.
- Das Wiederöffnen eines Zeit-/Distanz-Warm-ups stellt dessen vorgeschriebene Satzrolle wieder her.
- Ein teilweise dokumentiertes früheres Training verschiebt keine Vorwerte: Ist nur Ziel 3 abgeschlossen, bleiben die Vorschläge für Ziel 1 und 2 leer. Der frühere dritte Istwert wird anhand Ziel-/Zeilenbezug zugeordnet. Bei mehrdeutigen kopierten Positionen wird kein beliebiger Ersatzwert gewählt.
- Ein dazwischenliegender Deload, eine unvollständige Zielposition, geänderte Vorgaben oder eine größere Trainingslücke wird nicht aus einer Progressionsfolge herausgefiltert, sondern beendet diese Folge.
- Mehr Wiederholungen bei niedrigerer Last werden nicht durch eine zusammengefasste e1RM-Summe als „keine Verbesserung“ verschluckt. Plateauhinweise prüfen passende einzelne Messgrößen und getrennte Seiten.
- Bei 0 kg links und positiver Last rechts zählt die tatsächlich geleistete rechte Arbeit weiterhin zum Volumen. Der linke Wert ist nur das alte skalare Kompatibilitätsfeld; er ersetzt nicht das Seitenpaar.
- Ein fehlgeschlagener Delete/Save schließt den Korrekturdialog nicht vorschnell. Archiv und Korrektursheet sind in der Sichtbarkeit gegenseitig ausgeschlossen; der tatsächliche iOS-Übergang bleibt ein natives Gate.

## 3. Dokumentierte Regeln und sichere Grenzen

### Progression und Plateau

Eine Progressionsgrundlage benötigt mindestens zwei aufeinanderfolgende vollständige vergleichbare Zielpositionen in abgeschlossenen Sessions. Es werden höchstens 90 Tage betrachtet; die jüngste Grundlage darf höchstens 21 Tage alt sein. Lücken über 21 Tage sowie Deload, andere Zielstruktur oder unvollständige Position unterbrechen die Folge. Verglichen werden Satzart, Einheit, Lastbasis, Seitenform, Zielwerte, RIR/RPE, Pause, Tempo sowie tatsächliches Blockformat und geordnete Gruppenpartner.

Für Kraftvorschläge müssen die oberen Rep-Ziele in beiden Sessions erreicht und mindestens RIR 1 dokumentiert sein. Fehlende RIR liefern keine Kraftempfehlung. Schmerz-/Überlastungs- oder ungünstige aktuelle Erholungsvermerke liefern keine Steigerung; der angezeigte neutrale Hinweis erklärt die fehlende Steigerung. Assistenzlasten werden nicht als gehobene Last gesteigert. Körpergewicht verwendet Wiederholungen; Zeit und Distanz haben getrennte Regeln.

Die vorgeschlagenen Zielgewichte werden vor der Annahme angezeigt und auf den eingestellten Gewichtsschritt gerundet. Ist ein tatsächliches Stangen-/Scheibeninventar für Gesamtlast vorhanden, wird der minimale Paar-Schritt verwendet und die vorgeschlagene Kombination gegen dieses Inventar geprüft. Kann die Kombination nicht dargestellt werden, erscheint keine Laststeigerung. Die Scheibenberechnung zeigt eine konkrete Zusammenstellung und Restlast; sie behauptet keine mathematisch optimale Lösung für jedes beliebige Inventar.

Ein Plateauhinweis braucht mindestens vier vollständige vergleichbare Sessions über mindestens 21 Tage, ohne dazwischenliegende Unterbrechung. Keine passende einzelne Messgröße darf in diesem Fenster ansteigen. Sicherheits-/Deloadvermerke und unzureichende relevante Angaben unterdrücken den Hinweis. Das ist ein offengelegtes Regelmodell, keine Diagnose und keine automatische Planänderung.

### Undo

Es gibt einen einzelnen gespeicherten letzten Undo-Schritt. Der Datensatz enthält nur das betroffene Live-Workout, historische Workout oder den konkreten Termin und den erwarteten Zustand nach der Action. Ein kanonischer Vergleich verhindert, dass später veränderte Eingaben überschrieben werden. Eine andere Einstellung darf parallel verändert werden und verhindert das fachlich sichere Undo nicht.

Die Gegenoperation wird genau wie jede andere Action gespeichert. Sie ist idempotent und über einen tatsächlichen Repository-/Provider-Neustart geprüft. Weitere Änderungen am selben Aggregat können die Grenze erreichen; die Oberfläche benennt dann die nicht mehr sichere Rücknahme und verweist auf gezielte Korrektur. Für einen Undo-Datensatz über 2 MB wird kein Undo angeboten. Frühere Historie und Einstellungen werden nicht durch einen vollständigen AthleteData-Snapshot zurückgedreht.

Timer-/Notification-Seiteneffekte liegen außerhalb der reinen Gegenoperation. Der Native-Abgleich arbeitet mit bestätigten Session-/Timer-IDs und Endzeit. Die Zustandstests sind belegt; iOS-Hintergrundzustellung und tatsächliche Gerätesperre sind separat offen.

### Legacy und Parser

`routinePositions` ist für alte einheitliche Pläne ein reiner Lesadapter mit deterministischen Positionen/Zielen. Load allein erzeugt keine neue Planrevision und ändert keine alte Leistung. Ein alter freier Live-Workout bleibt fortsetzbar; neue freie Starts bleiben ausgeschlossen. Alte Sessions ohne Sollzeilen erhalten keine nachträglich erfundenen Sollwerte oder gemessenen Pausen.

Der Textparser unterstützt beispielsweise Tagesüberschriften wie `Montag – Upper`, `Bankdrücken 3x8, 90s`, `12/10/8 @40/42,5/45kg`, Zeit-/Distanzangaben und AMRAP. Er ist kein allgemeines Sprachmodell. Nicht eindeutig erkennbare Zeilen bleiben sichtbar und blockieren den Import. Die aktuelle Bestätigungsvorschau und ihre Zuordnungen sind lokal gespeichert; erst der ausdrückliche Import schreibt einen neuen pausierten Plan.

## 4. Prüfungen und Belege

| Prüfung | Beobachtetes Ergebnis | Was tatsächlich ausgeführt wurde |
| --- | --- | --- |
| `npm run test:training-second` | **197 Assertions PASS** | Tatsächliche TypeScript-Domainmodule kompiliert; neue Vorgaben, Live-Actions, Undo, Occurrences, Revisionen, Import, Batch, Seiten, Vorwerte, Geräte und Progression ausgeführt. `docs/qa/second-pass/training-domain.log`. |
| `npm run typecheck` | **Exit 0** | Vollständiges gemeinsames Projekt nach den letzten Plan-/Gym-Änderungen. `docs/qa/second-pass/training-typecheck.log`. |
| `npm run test:deep` | **62 PASS** | Bestehende Engine-, Backup-, Habit-, Coach-, Sharing- und Lastfälle im Second-Pass-Arbeitsbaum. |
| `npm run test:form84` | **52 PASS** | Bestehender Namespace, Merge, Blockvalidierung, Sessionuhr, Backup und SQLite. |
| `npm run test:progress15` | **16 PASS** | Bestehende Übungs-ID-/Datums-/Korrektur-/e1RM-/Einheitenfälle. Neue Seitenfälle stehen zusätzlich in training-second. |
| `npm run test:living` | **62 PASS** | Uhren, Draft-Restart, Replay, Rest, Tausch, Historie und echtes SQLite-Rollback. Siehe gemeinsames `living-regression.log`. |
| `npm run test:plan15` | **114 PASS** | Bestehender Plan-only-/Zeilen-/Freigabe-/Snapshot-Vertrag im laufenden Second Pass. |
| `npm run test:plan-management15` | **67 PASS** | Bestehender Import-, Copy-ID-, Draft- und Planmanagement-Vertrag im laufenden Second Pass. |
| Daten-/Repository-Integration | Separater aktueller Gate des Daten-Owners | `tests/test-second-pass-data.cjs` und `docs/qa/second-pass/data-persistence.log` führen dieselbe gemeinsame Fixture über tatsächlichen `context.update`, Repository und reale SQLite-Datei aus. Der übergreifende finale Gate hält den abschließenden Zähler und Quellstand fest. |

### Gemeinsames Pflicht-Szenario

`tests/fixtures/second-pass-workout.cjs` enthält **22 tatsächliche Aktionen** und wird unverändert von der Domain-Suite und der realen Repository-Suite geladen. Es enthält zwei alte abgeschlossene Workouts und drei alte Gewichtseinträge, individuelle 12/10/8-Ziele mit 40/42,5/45 kg, eine zweite Position derselben Bibliotheksübung mit unabhängigen Seitenwerten und getrennte Zeit-Warm-up-/Arbeitsziele.

Die Folge prüft Start, gespeicherten Dezimalkomma-Entwurf, ersten Satzabschluss, Undo einschließlich Timer, erneuten Abschluss, zusätzliche Wiederholungsfreigabe nur für Satz 2, Satz 2 und Satz 3, anschließend den bewussten Extra-Satz, Extra-Undo, Seitenwerte, Auslassen/Undo, Ersatz/Undo, vorzeitiges Finish, Verschieben eines optionalen Termins und Revisionsänderung/-Wiederaktivierung. Nach jedem Schritt bleiben die zwei alten Workouts und die drei Gewichte gleich. Der Daten-Gate öffnet jeweils eine neue SQLite-Leseverbindung und startet nach dem ersten Satz den tatsächlichen Provider-/Repository-Lebenszyklus neu, bevor Undo ausgeführt wird. Portable Backup und Rücklesen gehören zum Daten-Gate.

Das ist ein synthetischer integrierter Speicher-/Domain-Test. Es ist keine Behauptung, dass dabei auf einem realen iPhone getippt, das Gerät gesperrt oder die App durch iOS beendet wurde.

## 5. Tatsächliche Motion- und Komfortintegration

- `extraRow` umschließt die konkrete neu bestätigte Satzzeile. Die Erkennung basiert auf `confirmedData`; vorhandene Extras werden beim Laden nicht als neu erfunden. Ein Fokuswechsel beendet die Hervorhebung.
- `planReorder` umschließt die tatsächliche Positionsliste. Sein Ereignis wird erst gesetzt, wenn die gespeicherte Entwurfsreihenfolge der angefragten Reihenfolge entspricht.
- `calendarSlide` umschließt die echten Tagesinhalte und wird durch Programm-/Wochenwechsel ausgelöst. Die bedienbaren Tageslabels bleiben außerhalb. `notebookTab` bewegt das ausgewählte tatsächliche Tageslabel.
- `extraRep`, Undo, Copy/Plan Save, Satzcheck, erster Satz, Übungsabschluss und Trainingszettel verwenden die gemeinsamen Motion-/Copy-Komponenten. Erfolgsereignisse hängen am Commit; Animationen führen keine Domainaction aus.
- Ein Übungsabschlussereignis entsteht nur beim dokumentierten letzten geplanten Arbeitssatz einer Position, nicht durch Auslassen. `copySaved` unterscheidet tatsächliches Kopieren von Verschieben oder anderem Speichern. PR-Copy hängt an einem belegten neuen Ist-Rekord.
- `WorkoutKeepAwake` ist im tatsächlichen Live-Trainingsscreen gemountet. Navigation, AppState, Pause und ausdrückliches Opt-in werden in der gemeinsamen Komponente geprüft. Die native Funktion selbst bleibt auf einem Gerät abzunehmen.
- Satzfelder und Check/Schnellaktionen berücksichtigen Handlayout und freiwillige Gym-Schriftgröße. Systemschriftskalierung bleibt aktiv. Die Plantage haben mindestens 44 Punkte Breite und bei kleiner Breite bzw. großer Schrift einen bewussten Vier-Spalten-Umbruch.
- Eigene Übungsfotos verwenden `preparePrivatePhoto` und `usePrivatePhoto` mit privatem Assetpfad. Fehlende Fotos werden erkennbar angezeigt; die Übung bleibt verfügbar. Portable Medienintegrität und EXIF-Tests gehören zum separaten Daten-Gate.

## 6. Offene native Abnahme

1. iPhone SE und größeres iPhone: tatsächliche Scroll-/Tastaturgeometrie, Satzfelder, Seitenwerte, große Schrift, beide Handlayouts, Dark/Paper/Retro und VoiceOver. Quellmaße und TypeScript ersetzen keine Sicht-/Bedienprüfung.
2. Gewicht → Reps → RIR → Done mit realer iOS-Tastatur und InputAccessoryView. Kein Keyboard-Submit darf Leistung bestätigen. Tabwechsel und App-Wechsel während eines Entwurfs prüfen.
3. Check, absichtlicher Speicherfehler, Retry, Undo und Finish mit echten UI-Zuständen; Sheet-Übergang Archiv ↔ Korrektur auf iOS. Receipt-Recovery nach erneuter Bildschirmmontage bleibt zusätzlich zu prüfen; das gespeicherte Workout ist über das Archiv erreichbar.
4. Resttimer, bewusste Sessionpause, Skip, Undo, neue Pause, Ende/Verwerfen und Notification-Abgleich bei Gerätesperre/AppState-Wechsel/Force-Quit. Keine automatisch bestätigten Sätze bei Zeitablauf.
5. KeepAwake aktiviert nur im optierten aktiven fokussierten Trainingsscreen; Freigabe bei Pause, Navigation, Finish und Unmount auf echter Hardware prüfen.
6. Tatsächliche Katalogvirtualisierung, Scrollverhalten und VoiceOver-Reihenfolge bei vielen Treffern. Es gibt keinen behaupteten nativen FPS- oder Speicherbenchmark.
7. Echte Screenrecordings der benannten Bewegungen und Vergleichsbilder nach Layout-/Dark-/Reduce-Motion-Abnahme. Diese Umgebung erzeugte keine erfundenen Geräte-Screenshots.

Runtime-Freeze dieses Teilumfangs: keine weiteren optionalen Refactors vor dem gemeinsamen finalen Gate. Root übernimmt die abschließende Gesamtprüfung, Dokumentaggregation und Artefaktbereitstellung.

## 7. Gezieltes Integrationsnachspiel nach Root-Korrekturen

`tests/test-home-commit-second.cjs` besteht mit **47 Assertions**; Beleg: `docs/qa/second-pass/home-commit-render.log`. Dafür wurden keine Runtime-Dateien geändert.

Der Test führt den tatsächlichen `HomeScreen` mit einem Hook-/JSX-Adapter aus. Die Daten stammen aus dem tatsächlichen `AthleteProvider` und Repository-Harness mit realer SQLite-Datei. Eine echte Fehlerinjektion beim Satz-Insert lässt einen Satz im RAM, aber null bestätigte Sätze in SQLite: Home zeigt weiterhin null bestätigt und eine getrennte Fehlermeldung. Erst der erfolgreiche Retry erhöht die Anzeige. Ein fehlgeschlagener Session-Insert beim Finish erzeugt ebenso weder Wochenabschluss noch Tageshaken; der letzte bestätigte Eintrag bleibt der vorherige gespeicherte Workout. Nach Retry steigt die Woche genau einmal.

Für die Memo-Regression verändert der Test ausschließlich `planOccurrences`. Programme, Routinen, Wochenplan und bestätigte Workouts bleiben referenzgleich. Der ursprüngliche optionale Donnerstag verschwindet und erscheint am tatsächlichen neuen Samstag. Dadurch kann eine versehentlich fehlende Occurrence-Abhängigkeit nicht durch andere neue Array-Referenzen verdeckt werden.

Der unveränderte private `Main`-Funktionskörper wird zusätzlich aus dem tatsächlichen `App.tsx`-AST ausgeführt. Nach einem manuellen Tabwechsel werden neue Route-Params mit demselben `screen` erneut verarbeitet; geprüft sind Plan und Gym einschließlich des tatsächlichen Minimize-Callbacks. Gewöhnliches erneutes Rendern derselben Route erzwingt dagegen keinen alten Tab. Analytics-Vergleich und Rekordarchiv besitzen ihre funktionalen Leertexte außerhalb der optionalen Personality-Komponente.

Die React-/Native-Blattkomponenten und Navigationseingaben sind kontrollierte Adapter. Belegt sind die JavaScript-Hooks, erzeugten Inhalte und tatsächlichen Speicherübergänge, keine native Layout- oder Navigation-Ausführung.
