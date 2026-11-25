# FORM 15.0.0 — THE SKETCHBOOK UPDATE
## Plan-first training · Living ink · YAZIO × Apple Health · In-place upgrade

**Entwicklungsauftrag, kein bereits implementierter Release.**

Du bist ein Senior iOS Product Designer, Illustrator, Motion Designer, React-Native-/Expo-Engineer, SQLite-Architekt und QA-Engineer. Arbeite am beigefügten **FORM 10.0 LIVING WORKOUT HOTFIX**. Falls das tatsächliche Repository inzwischen neuere Fixes enthält, ist dessen aktueller Stand maßgeblich. Entwickle die bestehende App zu **FORM 15.0.0** weiter. Kein neues Projekt, kein paralleler Prototyp, kein Fresh Start. Die sichtbare Version und die technische Release-Version sollen 15.0.0 lauten.

## 0. Die fünf nicht verhandelbaren Ziele

1. **Mein bisheriger Fortschritt bleibt vollständig erhalten.** Kein erneutes Onboarding, keine neue leere Datenbank beim Update, keine verlorenen Pläne, Sätze, Gewichte, Ziele oder Einstellungen.
2. **Ich trainiere ausschließlich nach meinem eigenen Plan.** Quick Training, leere Spontan-Workouts und deren konkurrierende Startbuttons verschwinden aus dem aktiven Produkt. Die App versteht meinen heutigen Trainingstag und führt mich durch ihn.
3. **Der Plan bestimmt die Anzahl der Sätze und Wiederholungen.** Keine stillschweigend zusätzlichen Sätze oder Wiederholungen. Mehr ist durch einen bewusst betätigten Zusatzbutton möglich; weniger kann ehrlich protokolliert werden.
4. **YAZIO wird sinnvoll integriert**, ohne erfundene API, ohne doppelte Ernährungstagebücher, ohne erfundene Gesundheitswerte und ohne Abo-Zwang für FORM.
5. **Ein wirklich neues Design:** wie ein handgezeichnetes, lebendiges Trainingsnotizbuch mit HeyClicky-/Paint-inspirierter Persönlichkeit. Nicht bloß eine blaue App mit Standardkarten und einem Stern-Icon.

Alle Änderungen sind realer Code, mit Persistenz, Validierung, nachvollziehbarer QA und Build-Nachweis. Keine Behauptung, dass etwas auf dem iPhone funktioniert, bevor es dort oder in einem geeigneten Simulator geprüft wurde. Keine alten Anforderungen mechanisch wieder hinzufügen, wenn sie dem neuen Plan-first-Ziel widersprechen.

---

## 1. Ausgangscode und Sicherheitsvertrag

Das beigefügte Archiv `FORM_10_LIVING_WORKOUT_HOTFIX.zip` ist die letzte hier verfügbare vollständige Ausgangsbasis. Es enthält den Switch-Callback-Hotfix. Prüfe zusätzlich den aktuellen Stand meines GitHub-Repositories, sofern Zugriff besteht; überschreibe keine neueren Commits blind.

Bekannte Stellen im Ausgangscode (vor Änderungen tatsächlich lesen):

- `app.json`, `app.config.js`, `package.json`, `App.tsx`.
- `src/data/repository.ts`, `relational.ts`, `schema.ts`, `validation.ts`, `context.tsx`, `storage.ts`.
- `src/screens/Home.tsx`, `Plans.tsx`, `Gym.tsx`, `Weight.tsx`, `Health.tsx`, `PerformanceHub.tsx`, `More.tsx`, `AppleHealth.tsx`.
- `src/features/workout/LivingComponents.tsx`, `src/utils/livingWorkout.ts`, bestehende Block-, Satz-, Timer-, Backup- und Katalog-Logik.
- `src/components/Design.tsx`, `NativeFeatures.tsx`, `WidgetSync.tsx`, `InlineSetTable.tsx`, `BackupCenter.tsx`.
- `modules/form-health`, `.github/workflows/ios-unsigned.yml`, `scripts/`, `tests/`, bisherige QA-Berichte.

Die beigefügte Version verwendet die Bundle-ID **`app.athleteos.personal`**, den Scheme `athleteos` und in `src/data/repository.ts` die SQLite-Datei **`form-v84-clean.db`**. Der bisherige Name mit „clean“ ist ein technischer Bestandsname und KEINE Erlaubnis für einen Reset. Behalte diese Datei und ihre vorhandenen Daten bei. Auch vorhandene Schlüssel wie `form-v84-before-restore`, `form-v84-device-auth-lock` und ggf. `athlete-os-v4-data` sowie alte Backup-Formate berücksichtigen. Verifiziere ihre Funktion im tatsächlich bearbeiteten Stand. Keinen automatischen Import längst verworfener Alt-Daten zusätzlich auslösen.

### 1.1 Migration und Backup – P0

- Vor Änderungen einen Git-Sicherungsstand erstellen. Vor der ersten produktiven Migration einen konsistenten lokalen Snapshot bzw. wiederherstellbares Backup mit Schema-Version und Zeitstempel erstellen. Keine echten Nutzerdaten in GitHub, Logs, Fixtures oder Screenshots übertragen.
- In-place Migration, additive Felder und Tabellen bevorzugen. Transaktion, Datenintegritätsprüfung, stabile IDs, eindeutige Beziehungen, WAL und Fehlerbehandlung. Datenbankversion unabhängig von App-Marketingversion führen.
- Kein `freshData()`, `emptyData()`, `DROP TABLE` oder Löschen einer Datei als Reaktion auf einen Lade-/Migrationsfehler. Eine wirklich neue Installation darf weiterhin leer starten. Fehler unterscheiden von nachgewiesenem Erststart.
- Bestehende Historie, aktive Workouts, unfertige Entwürfe, Plans/Routinen, Gewicht, PRs, Körperdaten, Favoriten, eigene Übungen/Fotos, Journal, Habits, Einstellungen, Ziele, bisherige Ernährungslogs und optionale Integrationseinstellungen erhalten.
- Alt-Backups bleiben importierbar; versteckte oder entfernte Features dürfen ihre Altdaten nicht vernichten. Unbekannte Felder entweder verlustfrei bewahren oder Migration mit nachvollziehbarer Fehlermeldung stoppen.
- Neue Plan- und Satzlimits gelten nur für neue Eingaben, niemals rückwirkend für bereits gespeicherte Werte. Keine alten 12 Wiederholungen auf 8 oder 3 herunterkürzen.
- Fehler beim Schreiben: Daten im RAM erhalten, nicht „Gespeichert“ anzeigen, Retry anbieten. Keine leeren Standardwerte über vorhandene Daten schreiben.
- Kein neues Onboarding bei vorhandener Einrichtung. Bei Bedarf eine einmalige, schließbare kurze Update-Tour ohne Pflichtdaten.
- Vor Installation JSON-Backup aus der alten App empfehlen. Gleiche effektive Bundle-ID und kompatible Signierung verwenden, alte App nicht deinstallieren. Sideloadly kann Signierung/Container beeinflussen; Datenübernahme auf echtem Gerät verifizieren, nicht allein aus der Bundle-ID garantieren.

Abnahme: realistische Version-10-Fixture in echter SQLite-Datei öffnen, vorher/nachher Vergleich für IDs, Werte, Zeitstempel, Zählungen und Beziehungen; Migration zweimal ausführen; Crash-/Rollback-Fall; laufendes Training wiederherstellen; Backup-Import und Re-Export. Zusätzlich Upgrade auf einem echten Gerät, sofern verfügbar. Keine persönlichen Daten vorbefüllen.

---

## 2. Produkt radikal vereinfachen — Plan first

Die bisherigen Probleme sind zu viele konkurrierende Aktionen, dieselben Zahlen auf mehreren Seiten und Funktionen, die ich nicht benutze. Reduziere Komplexität statt alles mit weiteren Optionen zu überdecken.

### 2.1 Hauptnavigation

Fünf klare Tabs: **Heute · Plan · Training · Fortschritt · Gesundheit**. Profil/Einstellungen über einen kleinen Profilzugang, nicht als Dashboard. Während eines laufenden Trainings ein Fokusmodus; außerhalb davon eine Mini-Leiste zum Fortsetzen. Nur eine aktive Session gleichzeitig.

- Heute: Datum, aktiver Plan, heutige Routine oder Ruhetag, genau eine primäre Aktion, kompakte Wochenübersicht, optional ein sinnvoller Hinweis auf echte Daten.
- Plan: Wochenplan und alle Trainingstage, Planverwaltung, Übungen und deren Sollwerte. Kein Duplikat des Gym-Editors.
- Training: wenn aktiv, sofort fortsetzen. Andernfalls heutige Planroutine zeigen; ohne Plan eine eindeutige Aktion „Plan erstellen“. Archiv/Historie als separate Unterseite.
- Fortschritt: Fokus auf echte Leistungsentwicklung und Körperverlauf, keine erfundenen Trends oder redundanten Dashboard-Karten.
- Gesundheit: Gewicht, Schlaf, Aktivität, Erholung, YAZIO-/Ernährungsübersicht als getrennte Detailansichten.

### 2.2 Entfernen, zusammenführen, archivieren

**Verbindlich entfernen:** Quick Training, Quick Workout, spontanes leeres Training, entsprechende CTA auf Heute/Training, überflüssige Quick-Start-Optionen in Menüs. Auch versteckte Navigation, Deep Links und alte Startpfade prüfen. Keine Möglichkeit, aus Versehen ohne ausgewählte Planroutine eine neue Session zu starten. Alte spontane Workouts bleiben in der Historie lesbar; bereits laufende alte spontane Session muss einmalig fortsetzbar/beendbar bleiben.

**Reduzieren:** doppelte Templates/Plan-Editoren in eine konsistente Verwaltung überführen; doppelte Charts und Statistiken, übermäßige Gamification, generische Motivationsbanner, redundante Rechner, selten genutzte Social-/Story-Optionen aus den Hauptscreens entfernen oder bündeln. FITINN/OCR bleibt entfernt. Keine neue Community, kein Cloud-Zwang, keine Account-Pflicht. Keine neue KI-Chatseite ohne konkreten Mehrwert.

**Nicht ungefragt löschen:** Daten zu Journal, Habits, Recovery, Health, Story/Export, Cardio, Zielen, eigenen Übungen, verschlüsselten Backups. Falls sinnvoll, in sekundäre Unterseiten bzw. Archiv verschieben. Native Optionen wie Widgets und HealthKit nur sichtbar, wenn die Funktion in dem Build verfügbar ist. Erstelle eine Tabelle jeder entfernten, zusammengelegten und archivierten Funktion samt Zugriff auf Alt-Daten und Regressionstest.

### 2.3 Mein Plan ist die Quelle der Wahrheit

- Mehrere Pläne verwalten, genau einen aktivieren, Wochenzyklen, Start-/Enddatum, Pflicht-, optionale und Ruhetage beibehalten. Feiertags-/Terminverschiebungen optional und bewusst; keine automatische Bestrafung bei Pause.
- Pro Tag geordnete Übungen mit Soll-Satzanzahl, exakten Wdh. oder Wdh.-Bereich, Pause, optional RIR/RPE, Satztyp, Superset-/Blockzuordnung und Notiz.
- Bei Start eine stabile Momentaufnahme der Routine und ihres Solls erzeugen. Planänderungen danach dürfen laufende Sessions und alte Historie nicht verändern. Bestehende Plan-IDs und Übungen weiterverwenden.
- Training an einem anderen Tag erlaubt nur über ausdrückliche Auswahl eines vorhandenen Plan-Tages, nicht über Quick Workout. Keine unbeabsichtigte Doppelzählung der geplanten Einheit. Optionaltage nicht als verpasst markieren.
- Plan als JSON importieren/exportieren; kompatibel mit Altformaten. Importvorschau, IDs und Validierung. Kein erfundener persönlicher Plan.

---

## 3. Satz- und Wiederholungsregeln — zentrale neue Trainingslogik

Die UI und die zugrunde liegende Domain-Validierung müssen übereinstimmen. Ein freies Zahlenfeld ohne Grenze ist nicht die gewünschte Lösung. Unterscheide ausdrücklich Satzanzahl und Wiederholungen, damit beide Fälle funktionieren.

### 3.1 Feste Soll-Sätze

Beispiel: Bankdrücken **3 × 8**. Beim Start werden genau drei geplante Satzzeilen sichtbar, noch ohne gespeicherte Leistungen. Kein automatisch erzeugter vierter Satz nach dem letzten Check. Der Fortschritt zeigt 0/3, 1/3, 2/3, 3/3. Nach dem dritten Satz erscheint „Nächste Übung“ und eine sekundäre Aktion **„+ Satz“**. Nur bewusstes Tippen fügt genau eine zusätzliche Zeile mit stabiler ID hinzu. Markierung „Extra“, keine automatische Änderung des Plans. Extra-Sätze zählen separat, z. B. „3/3 geplant · +1 extra“. Warm-ups sind separat geplante oder bewusst hinzugefügte Warm-ups, keine versteckten Arbeitssätze. Entfernen nur bei Entwürfen direkt; bei abgeschlossenen Sätzen bewusst bestätigen und korrigieren. Doppeltippen darf nie zwei zusätzliche Sätze oder Abschlüsse erzeugen.

### 3.2 Feste Soll-Wiederholungen

Beispiel: **3 Wdh.** Der Eingabewert ist standardmäßig auf maximal 3 begrenzt. 0/unvollständig ist ein Entwurf, 1–3 sind zulässige echte Eingaben; für Satzabschluss muss ein gültiger Wert vorliegen. Wenn ich tatsächlich 4 schaffe, betätige ich **„+ Wdh.“** (oder „Limit +1“). Erst dadurch wird der erlaubte Maximalwert für genau diese Satzzeile um eins erhöht. Der eingegebene Wert darf danach 4 sein. Zeige Soll 3, erlaubtes Extra +1, tatsächliche Wdh. 4 getrennt. Button darf alternativ in einem klar beschrifteten kleinen Control stecken, aber keine zusätzlichen Menüs benötigen. Das neue Limit darf keine anderen Zeilen oder den Plan verändern.

- Bei direkter Eingabe von 4 ohne Freigabe: Wert nicht als tatsächlichen Satz speichern; verständlicher Hinweis „Geplant: 3 · + Wdh. erlaubt mehr“. Nicht stillschweigend auf 3 kürzen und dadurch falsche Daten protokollieren. Prüfe auch Einfügen, Tastatur, Steppers, Import und interne Actions.
- Bei Wdh.-Bereich 8–12 ist 12 das Standardmaximum, die tatsächliche Leistung darf unter 8 liegen. Erhöhe nur die Zeilengrenze ausdrücklich. Bei zeit-/distanzbasierten Übungen eigene passende Sollwerte; nicht fälschlich Rep-Limits anwenden. Bei bewusst geplanten AMRAP-/Failure-Sätzen gilt die ausgewiesene offene Zieldefinition statt eines erfundenen festen Limits.
- Historische Vorwerte über dem neuen Limit dürfen als Vorwerte sichtbar bleiben, aber nur nach expliziter Freigabe übernommen werden. Vorschläge sind keine absolvierten Sätze. Der Plan bleibt unverändert.
- Korrekturen nach dem Workout erhalten die ursprüngliche Soll-Momentaufnahme; tatsächliche Zusatzleistung darf nachvollziehbar korrigiert werden. Eingabeschutz darf das ehrliche Dokumentieren nicht verhindern.

### 3.3 Persistente Zeilen und Zustände

Pro Satz mindestens `id`, `exerciseInstanceId`, `plannedIndex`, `kind`, `plannedRepsMin/Max` (falls zutreffend), `extraRepAllowance`, `isExtraSet`, `draftWeight`, `draftReps`, optionale RIR/RPE/Zeit/Distanz/Notiz, Status, Completion-Zeit. Namen an vorhandenes Schema anpassen statt parallel zu speichern. Eine eindeutige Satz-ID und atomare, idempotente Abschluss-Action. Entwürfe und explizite Zusatzfreigaben über App-Wechsel, Neustart, Backup und Restore erhalten. Nicht nur den jeweils ersten Entwurf speichern. Fortschritt auf realen abgeschlossenen Sätzen berechnen, nicht auf der Anzahl sichtbarer Zeilen. Bei Planänderungen während Session unveränderte Sollwerte.

Pflichttests: 3 geplante Sätze; 4. ohne Button unmöglich; zusätzlicher Satz einmalig; Rep-Limit 3; 4 per Tastatur abgewiesen; + Wdh., 4 möglich; 5 erneut abgewiesen; separate zweite Zeile unverändert; 2 Wdh. als ehrlich absolviert akzeptiert; Wdh.-Bereich; AMRAP; vergangene höhere Werte intakt; Neustart von zwei verschiedenen Entwürfen; konkurrierende Abschlussaktionen; Wiederherstellung; Superset- und Blocknavigation; Backups.

---

## 4. Active Workout — ein Werkzeug, kein Formular

Die verlässliche Living-Workout-Engine aus Version 10 beibehalten und verbessern, nicht ersetzen durch einen lokalen Demo-Timer.

- Fester Kopf mit Routinenamen, „LIVE“/„PAUSE“, laufender Dauer in HH:MM:SS, tatsächlicher Startuhrzeit und bestätigtem Speicherstatus. Uhr und Pause unabhängig, timestamp-basiert, kein Vertrauen auf Hintergrund-JS.
- Eine Übung im Fokus. Klarer Zähler 02/06, echtes korrektes Übungsbild (oder neutraler lokaler Platzhalter), Soll „3 × 8“, Vorwerte pro Satz, letzte Session und persönlicher Bestwert. Restliche Übungen als kompakte Liste, direkter Wechsel. Keine sechs voll geöffneten Tabellen.
- Tabelle: Satz | zuletzt | kg | Wdh. | Check. Entwürfe visuell von bestätigten Sätzen unterscheiden. Große numerische Touchflächen, Dezimalkomma, RIR/RPE in optionalem Detail. Bedienelemente + Satz / + Wdh. sichtbar genau dort, wo sie gebraucht werden. Gewichtsschritte konfigurierbar.
- Schnellwiederholung und Vorwerte nur als Eingabevorschlag. Kein versteckter Satzabschluss. Übungstausch nur als bewusste Abweichung im Plan-Workout; Originalbezug und abgeschlossene Sätze erhalten, kein Startpfad für freie Workouts.
- Nach letztem geplanten Satz „Nächste Übung“, nicht zwangsweise automatischer Sprung; Supersets korrekt führen. Bei allen Übungen fertig „Training überprüfen“. Fehlende Sätze neutral anzeigen, Abschluss nicht erzwingen. Zeitbasierte Blöcke nicht fälschlich als fertig speichern.
- Pausentimer: Endzeit, verbleibende Zeit, −15/+15 Sek., Skip, Pause/Fortsetzen, optionale haptische/akustische Benachrichtigung. Restliche UI während Pause bedienbar. Ausstehende Benachrichtigungen beim Finish/Discard sauber abbrechen.
- Autosave jeder wichtigen Änderung mit Transaktionsbestätigung, Entwürfe beim Tippen sichern. Re-Entry und lange vergessene Sessions wie in Version 10 wiederherstellen. Uhrzeitänderungen nachvollziehbar behandeln. App darf nur dann „Gespeichert“ zeigen, wenn SQLite bestätigt hat.
- Abschlussbildschirm mit tatsächlicher Dauer, erledigten Soll-Sätzen, Extras, ausgelassenen Sätzen, gültigem Volumen, echten PRs und Notiz. Keine erfundenen Rekorde; keine Belohnung für Überlastung. Optional teilen, ohne Gesundheitswerte automatisch offenzulegen.

---

## 5. YAZIO wirklich integrieren — Ernährung ohne doppelte Arbeit

**Ziel:** YAZIO bleibt der Ort für Mahlzeiten und Lebensmittel. FORM zeigt die relevanten Ernährungswerte neben dem Training, ohne dass ich alles zweimal eingeben muss. Keine neue Konkurrenz-Lebensmitteldatenbank in FORM.

### 5.1 Unterstützter Datenweg und Grenzen

Offizieller Weg auf iOS: **YAZIO ↔ Apple Health (HealthKit) ↔ FORM**. Die Richtung hängt vom Datentyp und der Berechtigung ab. Die YAZIO-Hilfe dokumentiert Nährstoff-/Körperwerte aus YAZIO an Health sowie Aktivität/Workouts und bestimmte Körperwerte aus Health an YAZIO. Die Hilfe nennt Apple Health als auch ohne YAZIO-Pro verfügbaren Anbieter. Ein normaler integrierter YAZIO-Dateiexport ist laut Hilfe derzeit nicht verfügbar. Prüfe diese Aussagen erneut vor Implementierung. Quellen (abgerufen 25.11.2026):

- https://help.yazio.com/hc/de/articles/360018833998-Yazio-und-Apple-Health
- https://help.yazio.com/hc/en-us/articles/360004140898-Which-apps-devices-can-connect-with-Yazio
- https://help.yazio.com/hc/en-us/articles/52664956728337-Can-I-export-my-data-from-Yazio
- Apple HealthKit: https://developer.apple.com/documentation/healthkit

Keine öffentliche direkte YAZIO-API voraussetzen. Keine privaten Endpoints reverse-engineeren, Login-Cookies, Passwörter, Scraping, unautorisierte Hintergrundzugriffe oder gefälschten Sync-Button. Wenn künftig ein offizieller direkter API-Zugang nachweisbar ist, separat prüfen und dokumentieren.

### 5.2 FORM-Oberfläche

In Gesundheit > Ernährung eine klare Seite „Ernährung mit YAZIO“. Zeige nur tatsächlich verfügbare Werte: Nahrungsenergie (kcal), Protein, Kohlenhydrate, Fett, optional weitere explizit unterstützte Daten. Tages-/Wochenansicht, Zeitstempel der letzten erfolgreichen Abfrage, Datumsfilter, Herkunft (YAZIO, Apple Health, manuell), fehlende Werte als unbekannt, nicht als 0. Optional tatsächlicher Wasserwert, falls entsprechender Datentyp vorliegt. Keine Kalorienzielwerte ausdenken. Keine doppelte Buchung von manuellen und importierten Daten.

Aktionen: „Apple Health verbinden“, „Jetzt aktualisieren“, „Verbindung verwalten“, „YAZIO öffnen“ nur mit nachgewiesenem Deep Link; sonst offizielle App-Store-/Hilfe-Verknüpfung und Anleitung. Zeige im Setup konkrete Schritte in YAZIO unter Profil > Automatische Erfassung > Apple Health, danach in FORM die unterstützten Typen freigeben. Kein Zugriff vor Einwilligung. Alte manuelle Ernährungslogs bleiben lesbar und editierbar; manueller Fallback bei fehlender Integration.

### 5.3 Technische Implementierung

- Vorhandenes optionales Swift-/Expo-Modul `modules/form-health` analysieren, kompatible HealthKit-Typen und Verfügbarkeit auf Ziel-iOS prüfen. Nicht nur die alte Tagesvorschau umbenennen, sondern tatsächlich Nährstoffabfragen und bei Freigabe unterstützte Schreibvorgänge implementieren.
- Lesezugriff getrennt für dietaryEnergyConsumed, dietaryProtein, dietaryCarbohydrates, dietaryFatTotal und gewünschte weitere tatsächlich verfügbare Typen; Einheiten validieren (kcal, g). Optional Körpergewicht und Aktivität. Schreibzugriff getrennt für unterstützte Gewichtseinträge/abgeschlossene Workouts, nur auf Wunsch, nie automatisch Gesundheitsdaten zurückschreiben. Keine geschätzten Trainingskalorien erfinden.
- Quelle und HealthKit-UUID persistieren, idempotente Importe bzw. Anchored Query mit Löschungen; Quellzuordnung aus tatsächlicher SourceRevision, nicht anhand erfundener Namen. Bei Aggregaten eindeutige Quellstrategie (bei überlappenden Quellen nicht blind addieren). Lokale Tagesgrenzen, Zeitzonen, Sommerzeit und neue/gelöschte Samples korrekt behandeln. Manuelle Einträge getrennt halten. Eigene exportierte Samples erkennen und Schleifen vermeiden; Wiederholungsversuche und Absturz nach Export berücksichtigen. Exportkorrekturen nur für eigene Samples und mit Benutzerkontrolle.
- Apple Health ist der Vermittler; FORM kann keine tatsächliche YAZIO-Synchronisierung garantieren, solange nicht ein realer Roundtrip verifiziert wurde. Keine Echtzeit-/Hintergrundgarantie. Berechtigungsverweigerung und leere Abfrage unterscheiden, soweit Apple das erlaubt; bei Lesezugriff keine fälschlich eindeutige Berechtigungsdiagnose behaupten.
- Berechtigungen im iOS-Build, Usage Descriptions, Entitlements und Signierung prüfen. **Standard-Sideloadly-IPA darf weiterhin kostenlos baubar und ohne HealthKit vollständig nutzbar sein.** Falls kostenlose Signierung HealthKit nicht unterstützt, einen separaten korrekt signierbaren Build-Modus anbieten, im Standard-Build keine Scheinfunktion anzeigen. Keine Umgehung von Apple-Signierungsrechten.
- Teste Mock-Abfragen (keine Daten, fehlende Felder, doppelter Import, geänderte Quelle, gelöschter Sample, Zeitzonenwechsel, verweigerte Rechte), native Compile und echten Austausch YAZIO → Health → FORM sowie FORM → Health → YAZIO für unterstützte Datentypen, wenn verfügbar. Trenne Teststatus klar.

---

## 6. ART DIRECTION — FORM soll wie von einem Illustrator gestaltet wirken

**„A training notebook that came to life.“** Kein generisches Fitness-Dashboard. Der bisherige FORM-10-Look ist nicht ausreichend. Referenz: https://www.heyclicky.com/ (vor Designbeginn im Browser visuell analysieren, inklusive Videos/Interaktionen, sofern verfügbar). Dort sind u. a. alte Desktop-Fenster, Ordner, Sticker-/Notiz-Ästhetik, kleine Textgesichter und Zeichnungs-Demos Teil der Produktsprache. Übernimm die Prinzipien – nicht das Logo, die Grafiken, den Quellcode oder das exakte Layout. Erstelle eine eigene FORM-Illustrationssprache.

### 6.1 Designsystem: Sketchbook / Living Ink

- Papierweiß `#FAF9F3`, Tinte `#1D2025`, sattes Tuscheblau `#2655D9`, Pastellgelb `#FFE48A`, weiches Mint `#CFE8D5`, dezentes Rosa `#F4D0C8` als Ausgangspunkt. Semantische Tokens und Kontrast prüfen, Dark Mode mit lesbarer heller Tinte. Kein erzwungenes Thema bei bestehenden Nutzern; neue Defaults für Neuinstallation dokumentieren.
- Editoriale Komposition statt Kartenraster: große Überschrift, dünne organische Trennstriche, gemischte Größen, echte Leerstellen, ein zentrales Motiv je Seite, kleine asymmetrische Sticker außerhalb von Bedienelementen. Datenflächen klar und gerade; keine Textrotation bei Zahlen.
- Typografie mit lizenzierter Headline-Familie (z. B. Outfit), gut lesbarer UI-Schrift (DM Sans), Monospace (JetBrains Mono) für Gewichte/Timer, sparsame Handschrift (Patrick Hand oder eigene vektorisierte Notizen). Font-Loading, Offline-Assets, Fallback, Lizenz und Dynamic Type prüfen. Schriften nur aus rechtmäßigen Quellen. Keine schwarze/weiße Leerseite bei fehlender Schrift.
- Native iOS-Navigation, sichere Touchzonen, klare Sheets, Haptik, VoiceOver, Reduce Motion, Keyboard-Verhalten. Auf einem kleinen iPhone SE keine horizontale Überläufe. Visuals dürfen keine Klickziele verdecken.

### 6.2 Echte handgezeichnete Illustrationen, keine Emoji-Sammlung

Erstelle mindestens zwölf eigene vektorbasierte Doodle-Assets als SVG-Pfade (oder eigene Canvas-Illustrationen), in einem kohärenten Stil. Leicht unregelmäßige Konturen, natürliche Strichenden, kleine Überzeichnungen, variable Linienstärke, unperfekte Pfeile, wenige Flächen. Kein bloßes Standard-Icon mit Rotation. Alle Assets lokal, offline, mit Quelle/Urheberschaft dokumentieren. Keine Fotos oder geschützten Referenzgrafiken kopieren.

Verbindliches Asset-Set: Notizbuch, Hantel, Gewichtsplatte, Stoppuhr, handgezeichneter Stern, Schuh, Schlafmond, Wasserflasche, Teller, Kalender, Fortschrittspfeil, kleiner neutraler FORM-Helfer. Optional Tape, Büroklammer, Radiergummi, Pinselstrich, kleines Fenster. Der Helfer ist eine eigene abstrakte Figur (keine Kopie von HeyClicky), dekorativ und niemals ein falscher KI-Chatbot.

### 6.3 Bewegung mit Bedeutung (Animationsbibliothek)

Implementiere wiederverwendbare Motion-Komponenten mit React Native Animated, Reanimated sofern kompatibel, SVG und/oder nativen Animationen. Keine zusätzliche schwere Engine ohne Bedarf. Zeitspannen meist 140–350 ms, längere Doodle-Zeichnungen bis etwa 700 ms nur bei passenden Ereignissen. Reduce Motion respektieren, Animationen pausieren bei Inaktivität, keine Endlosschleifen. Kein Rerender der gesamten App jede Sekunde für Timer.

- Ink Reveal: Pfad zeichnet sich sichtbar entlang der Linie auf, nicht bloß Fade-in eines fertigen Bildes.
- Marker Swipe: handgezeichneter Marker hebt den heutigen Plan-Tag hervor.
- Pencil Check: Häkchen wird bei bestätigtem Satz in einem kurzen Strich gezeichnet; bei Speicherfehler kein Erfolgssignal.
- Paper Flip: kontrollierter Seitenwechsel zwischen Übungen.
- Sticker Pop: ein eigener Sticker bei echten Meilensteinen, kurz und optional.
- Rest Dial: skizzierte Stoppuhr bzw. kreisförmiger Fortschritt, Zahlen stabil.
- Plan Reorder: flüssige, zugängliche Umsortierung; alternative Pfeiltasten.
- Chart Draw: echte Datenlinie zeichnet sich beim Wechsel des Zeitraums kurz ein, keine irreführenden Achsenanimationen.
- Receipt Print: Abschluss als kleiner animierter Trainingszettel, nur nach erfolgreicher Speicherung.
- Optionaler Pointer-/Helfer-Doodle zeigt einmalig auf die neue + Wdh.-Aktion, dann ausblendbar.

### 6.4 Seiten jeweils eigenständig gestalten

**Heute – Tagesnotiz:** großes Datum, eine farbige handgezeichnete Markierung auf dem heutigen Training, Wochenleiste wie ein Papierkalender. Kleiner Doodle passend zum Zustand (Training/Ruhe), Hauptbutton „Heutiges Training starten“ oder Fortsetzen. Ruhetag ist kein Misserfolg. Keine fünf Datenkarten.

**Plan – Wochenheft:** Wochentage wie Kapitelreiter; offene Tagesseite mit klarer Übungsliste, Sollangaben und kleinen skizzierten Trennstrichen. Plan-Editor als fokussierte native Detailseite, kein endloses Modal. Visuelle Blöcke/Supersets, keine unnötige Dekoration zwischen Eingabefeldern.

**Training – Live sheet:** oben riesiger Timer mit gezeichneter Stoppuhr, aktueller Planabschnitt, klarer Trainingsbogen, kompakte Tabelle, markierte Extra-Zeilen. Pausenstreifen mit Ink-Fortschritt. Keine dekorative Animation während Zahleneingaben. Nach dem Satz optional ein kurzer Stiftstrich.

**Fortschritt – Film/Graph paper:** editorialer Leistungsbericht, echter Verlauf auf dezentem Papiergitter, handgeschriebene Annotation nur auf tatsächlichem Ereignis, Zeiträume und Datenquellen klar. Übungen und PRs anklickbar, keine gefälschten Statistiken. Körperdaten neutral und ohne Bewertung.

**Gesundheit – Health notebook:** YAZIO-Synchronisierung als kleine Verbindungsskizze (nur bestätigt, wenn real), separate Seiten, Ernährung und Erholung als gleichwertige Informationen. Keine moralische Bewertung von Essen, Körper oder Kalorien. Manuelle Dateneingabe einfach und barrierefrei.

**Einstellungen – Werkstatt:** ruhige gruppierte native Liste, Designwahl, Motion, optionaler Ton/Haptik, Datenschutz, Verbindungen, Backup, Debug/Buildstatus. Keine gigantische Scrollsammlung. Alt-Funktionen, die erhalten bleiben, nur sinnvoll verlinken.

### 6.5 Designabnahme, keine Ausreden mit Mockups

Vor und nach dem Umbau tatsächliche Screenshots (Simulator oder Gerät) von Heute, Plan, laufender Satzzeile, Pause, Workout-Abschluss, Fortschritt, YAZIO und Einstellungen. Für jede Hauptseite schriftlich prüfen: Was ist die Hauptaktion? Welche alte visuelle Redundanz wurde entfernt? Welches eigene Doodle erfüllt welchen Zweck? Wie verhält sich die Seite mit großen Schriften, leeren und gefüllten Daten? Zeige einen kurzen tatsächlichen Screenrecording-Clip der Animationen, wenn die Umgebung es erlaubt. Falls nicht: genau dokumentieren, was ungetestet ist. Konzeptbilder ausdrücklich als solche kennzeichnen, niemals als native Screenshots verkaufen. Nicht nur Farbwerte austauschen.

---

## 7. Fortschritt, Trainingsqualität und Performance

- Pro Übung echte Vorwerte, Top-Sätze, Reps, Volumen, e1RM nur bei geeigneten Übungen, zeitbasierte Diagramme. Geplante/erledigte/zusätzliche Sätze getrennt. Keine Belohnung für möglichst viele Extras. Vorwerte und Trends nach Korrektur alter Sätze neu berechnen.
- Wochenansicht mit erledigten Pflichttrainings, optionalen Tagen und Ruhetagen; keine Fake-Streaks. Leistungsentwicklung aus denselben stabilen Übungs-IDs, nicht aus Anzeigenamen. Keine medizinischen Diagnosen oder garantierten Gewichtsprognosen.
- Bilder exakt zur Übung aus vorhandenen lizenzierten Daten beziehen, offline Cache, neutraler Platzhalter. Keine falschen Übungsbilder oder unüberprüften Copyright-Assets. Alte eigene Fotos in Backup/Migration berücksichtigen.
- Große Listen virtualisieren, Suche debouncen, Berechnungen memoizen, Timer auf kleine Subkomponenten begrenzen. SQLite inkrementell aktualisieren, keine Vollserialisierung pro Tastendruck. Testdaten mit 10.000 Sätzen und 2.000 Gewichten; Benchmarks reproduzierbar nennen. Keine pauschale 60-FPS-Behauptung ohne Messung.

---

## 8. Build und Qualitätssicherung — die alten Fehler nicht wiederholen

Die beigefügte Version enthält den Fix für sieben TS2322-Switch-Callback-Fehler. `update()` liefert absichtlich `Promise<boolean>` als Bestätigung einer Speicherung. Eventhandler für Schalter müssen bei Bedarf `Promise<void>` zurückgeben, ohne den Speichererfolg im Domain-Layer zu verlieren. Erhalte `test:switch-contract`. Auch den TS2345-Fix für die Linking-URL (`string | null | undefined`) erhalten. Keine `any`-/`ts-ignore`-Flut als Reparatur.

1. Baseline installieren, tatsächliche Expo-/RN-Versionen und Ziel-iOS prüfen; SDK nicht wahllos upgraden. Abhängigkeiten in passenden Versionen und Lockfile reproduzierbar halten. `npm ci` verwenden, wenn ein gültiges Lockfile vorliegt.
2. Nach jeder Phase vorhandene Tests ausführen und neue Unit-/Integrationstests ergänzen. Testfehler nicht einfach durch Löschen/Abschwächen eines sinnvollen Tests beseitigen. Test-Fixtures dürfen Beispieldaten enthalten, Produktion niemals.
3. Vollständiger `tsc --noEmit`, Lint, `expo-doctor`/Konfigurationsprüfung, Expo Prebuild, CocoaPods, Xcode-Compile, unsigned IPA, ZIP-Integrität. Einen kompatiblen macOS-/Xcode-GitHub-Runner wählen und tatsächlich verfügbare Labels prüfen. Kein kostenpflichtiger EAS-Zwang. GitHub-Freikontingente nicht garantieren.
4. Normaler IPA-Build ohne nicht erfüllbare HealthKit-/Widget-Entitlements; separat klar benannter optionaler signierter Build für diese Features. IPA und Build-Logs als CI-Artefakte, SHA-256. Keine Geheimnisse oder persönliche Backups in Artifacts. Wenn CI nicht zugänglich ist, exakte Schritte und offenen Status angeben.
5. Upgrade-UI-Tests auf altem Datenbestand (idealerweise iPhone SE 2020 bzw. kleiner Simulator und aktuelles Gerät): vorhandener Plan, alter Fortschritt, aktive Session, App-Sperre, App-Wechsel, Force Quit nach bestätigtem Save, mehrfacher Satz-Check, limitierte Eingaben, Extra-Freigaben, Airplane Mode, fehlende HealthKit-Rechte, fehlerhafte Backups, Dark Mode, VoiceOver, Dynamic Type, Reduce Motion.
6. Dokumentiere je Test: Umgebung, Befehl, Ergebnis, Exit-Code, Log, was der Test beweist und was nicht. Trenne „implementiert“, „lokal geprüft“, „CI kompiliert“, „Simulator getestet“, „physisches iPhone getestet“ und „blockiert“. Screenshots, native Signierung und YAZIO-Roundtrip nicht erfinden.

---

## 9. Arbeitsphasen und Abnahmematrix

| Phase | Pflicht-Ergebnis vor Fortsetzung |
|---|---|
| P0 Bestandsaufnahme | Git-Sicherung, konkrete Datei-/Feature-Liste, Baseline-Teststatus |
| P1 Datenerhalt | Migration, Snapshot, Upgrade-/Rollback-/Backup-Tests, gleiche Bundle-ID/DB |
| P2 Plan-only | Alle neuen Startpfade validieren, alte Quick-Historie erhalten |
| P3 Satzengine | Sollzeilen, explizite Extras, stabile IDs, echte SQLite-Neustarttests |
| P4 Live Workout | Timer, Autosave, einzelne Übung, Mini-Leiste, Abschluss, UI-Tests |
| P5 YAZIO | Native HealthKit-Funktion, Fallback, Berechtigungs-/Duplikat-/Quelltests |
| P6 Illustration & Motion | Eigene Assets, neue Layouts aller Tabs, Motion/Accessibility-Tests |
| P7 Aufräumen | Gezielte Entfernung doppelter UI/Abhängigkeiten, keine Datenlöschung |
| P8 Release | Vollständige Regression, Typecheck, CI-Build, Upgrade-Abnahme |

Wenn native Ausführung blockiert ist, mache die maximal sinnvolle reale Implementierung und dokumentiere den Blocker. Nicht die halbe App als fertig ausgeben. Keine Rückfragen zu Entscheidungen, die sicher aus diesem Auftrag ableitbar sind. Kleine, überprüfbare Commits bzw. nachvollziehbare Changesets.

### End-to-end-Pflichtszenario

Ein bestehender Nutzer mit zwei historischen Workouts, drei Gewichten und einem eigenen Plan aktualisiert auf 15.0.0. Ohne erneutes Onboarding sieht er alle alten Werte. Heute zeigt seine Routine. Eine Übung mit 3 geplanten Sätzen und 3 Wiederholungen erscheint mit genau drei Zeilen. Er loggt 3 Wdh., dann 2 Wdh.; in der dritten Zeile möchte er 4 protokollieren. Vor Freigabe wird 4 zurückgewiesen, nach „+ Wdh.“ ist 4 gültig. Er fügt ausdrücklich einen vierten Satz hinzu. Ein Tabwechsel, Sperren und Wiederöffnen erhalten alle Zeilen, Freigaben, Werte und Timer. Nach Abschluss zeigt das Archiv 3 geplante und 1 zusätzlichen Satz, und der Plan bleibt 3 × 3. Die bisherigen Workouts sind unverändert. Die Ernährungsseite zeigt tatsächlich importierte Werte oder eine ehrliche Nicht-verfügbar-Anzeige. Ohne HealthKit läuft das Training weiterhin. Alle Daten sind exportierbar und wiederherstellbar. Die Oberfläche zeigt eigene handgezeichnete Motive und funktionale Animationen statt generischer Karten. Dieses Szenario mit synthetischen Fixtures testen; keine Demo-Werte in der produktiven App.

## 10. Auslieferung

Liefere den **tatsächlich geänderten bestehenden Quellcode als ZIP**, `CHANGESET_15.md` mit Datei- und Funktionsänderungen, `MIGRATION_10_TO_15.md`, `REMOVED_FEATURES.md`, `YAZIO_INTEGRATION.md` mit bestätigten Datentypen und Signierungsgrenzen, `DESIGN_SYSTEM_15.md`, Asset-/Lizenzliste, `TEST_MATRIX_15.md`, tatsächliche Logs, `RELEASE_REPORT_15.md`, ggf. echte Screenshots/Screenrecording und die verifizierte IPA oder den präzisen offenen Buildstatus. Aktualisiere Anzeigename, `package.json`, Expo-Version, konsistente Build-/Artifact-Namen auf FORM 15.0.0. Behalte technische Identität und Datencontainer. Liefere eine Anleitung für das Upgrade meines bestehenden Repositories und die Überinstallation mit Sideloadly, nicht für einen Fresh Start.

**Schlussregel: Meine Trainingshistorie ist wichtiger als jede neue Animation. Mein Plan ist wichtiger als ein Quick-Workout-Button. Die neue Gestaltung muss aber tatsächlich lebendig, handgezeichnet, eigenständig und sichtbar anders sein. Keine KI-Demo. Keine falsche Fertigmeldung.**
