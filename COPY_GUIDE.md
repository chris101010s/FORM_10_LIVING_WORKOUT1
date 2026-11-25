# FORM · Copy Guide / Build 150001

## Redaktion und tatsächliche Implementierung

Deutsche Hauptaktionen, kurze klare Sätze, trockene kleine Randnotizen. Die Texte wurden für FORM selbst geschrieben; keine Referenztexte übernommen. Technische Zustände und Fehler stehen sachlich außerhalb der Dekoration. Kein Witz über Datenverlust, kein Druck bei Ruhe/Krankheit, keine Körper- oder Kalorienmoral und keine Aufforderung zu Extras. Gesundheitstexte bleiben auch im verspielten Modus ruhig.

Quelle: `src/copy/copy.de.ts`. Genau 104 eigene Varianten verteilen sich auf 26 typisierte Ereignisse; je zwei ruhige und zwei verspielte Texte. Jeder Text hat Ereignis, Ton, Pose und Bestätigungsregel. `createCopySelector` hält die Wahl je Ereignis-ID/Ton stabil und vermeidet die unmittelbar vorherige Variante desselben Ereignisses. Der Speicher ist auf 512 Wahlen begrenzt; kein Math.random pro Render.

Figur und Texte haben getrennte Opt-ins. Neue Installationen starten mit beiden aus. `tone: off` unterdrückt dekorative Texte, nicht Fehler, Limits oder Speicherstatus. `SketchEvent` zeigt kurze Blasen höchstens 6,5 Sekunden, räumt beim App-Wechsel/Unmount auf und spielt verpasste Blasen beim Foreground nicht nach. Große Schrift kann die Figur ausblenden, ohne den Text zu verlieren.

## Reale Ereignisse und Eingänge

Die Einträge sind tatsächliche Aufrufer, keine reine Beispielsammlung. Erfolgsereignisse bleiben ohne Bestätigung leer. Ein bestätigter Datenzustand ersetzt keine Berechtigungsdiagnose; Health-Leserechte sind durch Apple absichtlich nicht eindeutig abfragbar.

| Ereignis | Aufrufer in src | Bedingung | Bestätigung |
| --- | --- | --- | --- |
| `planReady` | Home.tsx | Ein echter geplanter Tag; Begrüßung höchstens einmal je lokalem Tagesereignis. | tatsächlicher Zustand |
| `restDay` | Home.tsx | Der aktuelle Plan kennzeichnet den Tag als Ruhe. | tatsächlicher Zustand |
| `noPlan` | Home.tsx | Kein geplanter heutiger Eintrag; sachlicher Einrichtungsweg bleibt vorhanden. | tatsächlicher Zustand |
| `workoutStarted` | Gym.tsx | Neue gespeicherte Plan-Session geöffnet, nicht während eines fehlgeschlagenen Writes. | erforderlich |
| `setSaved` | Gym.tsx | Sparsam beim ersten bestätigten Satz der Session. Jeder Satz behält unabhängig davon seinen normalen Check. | erforderlich |
| `rest` | LivingComponents.tsx / RestStrip | Nutzer klappt den tatsächlich laufenden Resttimer auf. | tatsächlicher Zustand |
| `restDone` | LivingComponents.tsx / RestStrip | Ein realer Timer erreicht null, nicht durch Skip; Controls bleiben freiwillig. | tatsächlicher Zustand |
| `extraAllowed` | Gym.tsx / confirmedAction | Bewusste Extra-Satz- oder Extra-Rep-Aktion wurde atomar gespeichert. | erforderlich |
| `exerciseFinished` | Gym.tsx / confirmedAction | Geplante Arbeitssätze der Position wechseln durch Satzabschluss von offen auf vollständig dokumentiert; nicht durch Skip. | erforderlich |
| `workoutFinished` | Gym.tsx / Trainingszettel | Abschluss ist in confirmedData vorhanden. | erforderlich |
| `pr` | Gym.tsx / realRecords | Echter höherer Lastbestwert gegenüber vorherigen abgeschlossenen Sessions. | erforderlich |
| `restored` | Gym.tsx | Vorhandene aktive Session wird wieder geöffnet, kein neu erfundener Start. | tatsächlicher Zustand |
| `searchEmpty` | LocalSearch.tsx | Eine konkrete lokale Suche/Filterkombination hat keine Treffer. | tatsächlicher Zustand |
| `saving` | AppearanceSettings.tsx | Ein ausdrücklich geändertes Setting wird geschrieben. | tatsächlicher Zustand |
| `saved` | AppearanceSettings.tsx | Die zugehörige letzte Setting-Aktion liefert update() === true. | erforderlich |
| `backupSaved` | BackupCenter.tsx | Sicherung wurde geschrieben, zurückgelesen und geprüft. | erforderlich |
| `offline` | PrivacyDiagnostics.tsx | Erklärung der lokalen Arbeitsweise beim Öffnen; keine Behauptung des aktuellen Netzwerkstatus. | tatsächlicher Zustand |
| `syncSaved` | Nutrition.tsx / AppleHealth.tsx | Tatsächliche importierte Werte wurden bestätigt gespeichert. | erforderlich |
| `noMeasurements` | TrainingAnalytics.tsx / More.tsx / Nutrition.tsx | Echter leerer Zeitraum oder fehlende Messdaten. | tatsächlicher Zustand |
| `undo` | Gym.tsx | Atomare Gegenaktion wurde bestätigt; keine Animation bei veralteter Undo-Grundlage. | erforderlich |
| `planSaved` | Plans.tsx / PlanTools.tsx / ProgressionPanel.tsx | Explizite Plan-, Termin- oder Progressionsentscheidung wurde gespeichert. | erforderlich |
| `noteSaved` | EquipmentPanel.tsx | Geräte-/Studionotiz wurde gespeichert. | erforderlich |
| `searchOpen` | LocalSearch.tsx | Lokale Suche geöffnet; Eingabe sofort benutzbar. | tatsächlicher Zustand |
| `copySaved` | PlanTools.tsx | Tag/Woche/Position/Version wurde tatsächlich mit neuen Instanz-IDs kopiert. | erforderlich |
| `repaired` | PrivacyDiagnostics.tsx | Ein vorher fehlgeschlagener Lade-/Schreibversuch wurde tatsächlich bestätigt. | erforderlich |
| `connectionConfirmed` | Nutrition.tsx | Erster persistierter Verbindungshinweis nach realen gelesenen Samples und Commit, nicht nach dem Berechtigungsdialog. | erforderlich |

## Vollständiger Textbestand

Diese Tabelle wurde aus den implementierten Daten erzeugt. Sie ist kein zusätzlicher, im Produkt ungenutzter Textekatalog.

| ID | Ton | Pose | Text |
| --- | --- | --- | --- |
| `de.planReady.1` | ruhig | ready | Deine nächste Seite liegt bereit. |
| `de.planReady.2` | ruhig | ready | Dein Plan hat einen Platz für heute. |
| `de.planReady.3` | verspielt | ready | Das Heft ist aufgeschlagen. Kein Papierkram nötig. |
| `de.planReady.4` | verspielt | ready | Der Bleistift kennt den Weg. Du bestimmst das Tempo. |
| `de.restDay.1` | ruhig | resting | Ein freier Tag gehört dazu. |
| `de.restDay.2` | ruhig | resting | Heute ist Raum für Ruhe. |
| `de.restDay.3` | verspielt | resting | Auch ein leeres Kästchen kann nach Plan sein. |
| `de.restDay.4` | verspielt | resting | Pip hat die Hanteln ordentlich weggeräumt. |
| `de.noPlan.1` | ruhig | thinking | Dein Heft wartet auf einen Plan. |
| `de.noPlan.2` | ruhig | thinking | Hier kannst du deine Trainingstage ordnen. |
| `de.noPlan.3` | verspielt | thinking | Noch kein Inhaltsverzeichnis. Das lässt sich ändern. |
| `de.noPlan.4` | verspielt | thinking | Blankes Papier. Sehr aufnahmefähig. |
| `de.workoutStarted.1` | ruhig | dumbbell | Dein geplanter Trainingsbogen ist geöffnet. |
| `de.workoutStarted.2` | ruhig | dumbbell | Die erste Zeile wartet auf deinen Eintrag. |
| `de.workoutStarted.3` | verspielt | dumbbell | Pip übernimmt heute die Randnotizen. |
| `de.workoutStarted.4` | verspielt | dumbbell | Ab jetzt schreibt dein Training seine eigene Geschichte. |
| `de.setSaved.1` | ruhig | thumbsUp | Dein Satz ist eingetragen. |
| `de.setSaved.2` | ruhig | thumbsUp | Diese Zeile ist sicher notiert. |
| `de.setSaved.3` | verspielt | thumbsUp | Ein Haken. Kein großes Theater. |
| `de.setSaved.4` | verspielt | thumbsUp | Tinte drauf. Handtuch daneben. |
| `de.rest.1` | ruhig | stopwatch | Deine Pause läuft. |
| `de.rest.2` | ruhig | stopwatch | Zeit zum Durchatmen. |
| `de.rest.3` | verspielt | stopwatch | Die Stoppuhr macht kurz ihren Job. |
| `de.rest.4` | verspielt | stopwatch | Pip hält solange den Platz frei. |
| `de.restDone.1` | ruhig | neutral | Die eingestellte Pause ist abgelaufen. |
| `de.restDone.2` | ruhig | neutral | Du entscheidest, wann es weitergeht. |
| `de.restDone.3` | verspielt | neutral | Der Timer ist fertig. Du musst es nicht sein. |
| `de.restDone.4` | verspielt | neutral | Eine leise Randnotiz: Die Zeit ist um. |
| `de.extraAllowed.1` | ruhig | focused | Die zusätzliche Zeile ist freigegeben. |
| `de.extraAllowed.2` | ruhig | focused | Deine bewusste Ergänzung ist vermerkt. |
| `de.extraAllowed.3` | verspielt | focused | Ein bisschen mehr Rand im Heft. |
| `de.extraAllowed.4` | verspielt | focused | Zusatz notiert. Der ursprüngliche Plan bleibt lesbar. |
| `de.exerciseFinished.1` | ruhig | smile | Die geplanten Zeilen dieser Übung sind dokumentiert. |
| `de.exerciseFinished.2` | ruhig | smile | Diese Übungsseite ist ausgefüllt. |
| `de.exerciseFinished.3` | verspielt | smile | Ein Kapitel hat seinen Haken. |
| `de.exerciseFinished.4` | verspielt | smile | Pip setzt ein kleines Lesezeichen. |
| `de.workoutFinished.1` | ruhig | celebrating | Dein Trainingsprotokoll ist gespeichert. |
| `de.workoutFinished.2` | ruhig | celebrating | Deine Einträge sind abgeheftet. |
| `de.workoutFinished.3` | verspielt | celebrating | Der Trainingszettel hat Feierabend. |
| `de.workoutFinished.4` | verspielt | celebrating | Das Heft klappt zu. Die Daten bleiben da. |
| `de.pr.1` | ruhig | surprised | Ein neuer belegter Bestwert steht im Heft. |
| `de.pr.2` | ruhig | surprised | Dieser Wert ist in deinem Verlauf neu. |
| `de.pr.3` | verspielt | surprised | Ein Stern mit Datengrundlage. Seltene Gattung. |
| `de.pr.4` | verspielt | surprised | Die Randnotiz bekommt heute einen Stern. |
| `de.restored.1` | ruhig | wave | Dein bisheriger Trainingsbogen ist wieder da. |
| `de.restored.2` | ruhig | wave | Du kannst an deinem letzten Stand anknüpfen. |
| `de.restored.3` | verspielt | wave | Das Lesezeichen hat seinen Job gemacht. |
| `de.restored.4` | verspielt | wave | Pip hat die Seite nicht umgeblättert. |
| `de.searchEmpty.1` | ruhig | magnifier | Für diese Suche gibt es noch keinen Treffer. |
| `de.searchEmpty.2` | ruhig | magnifier | Eine andere Schreibweise kann helfen. |
| `de.searchEmpty.3` | verspielt | magnifier | Die Lupe meldet: noch keine Spur. |
| `de.searchEmpty.4` | verspielt | magnifier | Pip sucht Wörter, keine versteckten Trainingspflichten. |
| `de.saving.1` | ruhig | writing | Dein Eintrag wird lokal gesichert. |
| `de.saving.2` | ruhig | writing | Die Speicherung ist noch nicht bestätigt. |
| `de.saving.3` | verspielt | writing | Der Stift ist noch auf dem Papier. |
| `de.saving.4` | verspielt | writing | Diese Zeile trocknet noch. |
| `de.saved.1` | ruhig | smile | Lokal gespeichert. |
| `de.saved.2` | ruhig | smile | Der Schreibvorgang ist bestätigt. |
| `de.saved.3` | verspielt | smile | Der Punkt sitzt. |
| `de.saved.4` | verspielt | smile | Abgelegt. Ohne Büroklammerverlust. |
| `de.backupSaved.1` | ruhig | thumbsUp | Die Sicherung wurde erstellt und geprüft. |
| `de.backupSaved.2` | ruhig | thumbsUp | Eine geprüfte Kopie ist bereit. |
| `de.backupSaved.3` | verspielt | thumbsUp | Dein Heft hat jetzt ein zweites Exemplar. |
| `de.backupSaved.4` | verspielt | thumbsUp | Ordentlich abgeheftet. Pip nickt. |
| `de.offline.1` | ruhig | neutral | Lokale Einträge brauchen keine Verbindung. |
| `de.offline.2` | ruhig | neutral | Dein Plan und deine Einträge bleiben vor Ort verfügbar. |
| `de.offline.3` | verspielt | neutral | Für lokale Notizen braucht Pip kein WLAN-Passwort. |
| `de.offline.4` | verspielt | neutral | Dein Heft kann auch ohne Cloud weiterschreiben. |
| `de.syncSaved.1` | ruhig | smile | Die abgefragten Werte sind lokal gespeichert. |
| `de.syncSaved.2` | ruhig | smile | Die Aktualisierung wurde gesichert. |
| `de.syncSaved.3` | verspielt | smile | Neue Einträge sind im Heft angekommen. |
| `de.syncSaved.4` | verspielt | smile | Ein kurzer Datentransport, sauber notiert. |
| `de.noMeasurements.1` | ruhig | sleeping | Für diesen Zeitraum liegen keine Messwerte vor. |
| `de.noMeasurements.2` | ruhig | sleeping | Du entscheidest, welche Werte du festhalten möchtest. |
| `de.noMeasurements.3` | verspielt | sleeping | Diese Seite darf auch leer bleiben. |
| `de.noMeasurements.4` | verspielt | sleeping | Noch keine Zahlen. Keine Eile. |
| `de.undo.1` | ruhig | focused | Die letzte Änderung wurde zurückgenommen. |
| `de.undo.2` | ruhig | focused | Der vorherige Zustand ist wieder gespeichert. |
| `de.undo.3` | verspielt | focused | Der Radiergummi war präzise. |
| `de.undo.4` | verspielt | focused | Eine Zeile zurück. Alles nachvollziehbar. |
| `de.planSaved.1` | ruhig | writing | Deine Planänderung ist gespeichert. |
| `de.planSaved.2` | ruhig | writing | Die neue Planfassung ist bestätigt. |
| `de.planSaved.3` | verspielt | writing | Das Inhaltsverzeichnis hat ein Update. |
| `de.planSaved.4` | verspielt | writing | Neue Fassung. Alte Trainings bleiben unangetastet. |
| `de.noteSaved.1` | ruhig | neutral | Deine Gerätenotiz ist gespeichert. |
| `de.noteSaved.2` | ruhig | neutral | Die Notiz steht bei deiner Übung. |
| `de.noteSaved.3` | verspielt | neutral | Sitzhöhe notiert. Gedächtnis entlastet. |
| `de.noteSaved.4` | verspielt | neutral | Eine kleine Notiz spart später Sucherei. |
| `de.searchOpen.1` | ruhig | magnifier | Suche in deinen lokalen Einträgen. |
| `de.searchOpen.2` | ruhig | magnifier | Übungen, Pläne, Trainings und Einstellungen. |
| `de.searchOpen.3` | verspielt | magnifier | Pip packt die Lupe aus. |
| `de.searchOpen.4` | verspielt | magnifier | Ein Wort reicht für den Anfang. |
| `de.copySaved.1` | ruhig | smile | Die neue Kopie ist gespeichert. |
| `de.copySaved.2` | ruhig | smile | Die Kopie hat eigene Planpositionen. |
| `de.copySaved.3` | verspielt | smile | Kopiert. Die Geschichte wurde nicht mitverdoppelt. |
| `de.copySaved.4` | verspielt | smile | Ein zweites Blatt mit eigenen Zeilen. |
| `de.repaired.1` | ruhig | repair | Der erneute Schreibversuch wurde bestätigt. |
| `de.repaired.2` | ruhig | repair | Deine Einträge sind jetzt lokal gespeichert. |
| `de.repaired.3` | verspielt | repair | Der Speicherstatus ist wieder bestätigt. |
| `de.repaired.4` | verspielt | repair | Die Sicherung deiner aktuellen Eingaben ist abgeschlossen. |
| `de.connectionConfirmed.1` | ruhig | neutral | Die verfügbare Verbindung ist eingerichtet. |
| `de.connectionConfirmed.2` | ruhig | neutral | Die Abfragequelle ist bestätigt. |
| `de.connectionConfirmed.3` | verspielt | neutral | Der Datenweg steht. Werte erscheinen nur, wenn sie vorliegen. |
| `de.connectionConfirmed.4` | verspielt | neutral | Das Kabel im Heft ist symbolisch. Die Quelle ist echt. |

## Nachweise und Grenze

`tests/test-design-second.cjs` prüft Eindeutigkeit, typisierte Zuordnung, stabile Auswahl, Wiederholungsbremse, getrennte Tonvarianten und Unterdrückung falscher Erfolge/PRs. `tests/test-motion-lifecycle-second.cjs` führt die tatsächlichen Personality-Hooks mit kontrolliertem AppState und Timer aus: Ablauf, Unmount, Hintergrund, kein Replay, Figur-aus/Text-an und Text-aus/Figur-an. Die Tests sind JS-Adaptertests; Screenreader-Ausgabe und subjektive Häufigkeit auf einem echten iPhone bleiben native Abnahme.
