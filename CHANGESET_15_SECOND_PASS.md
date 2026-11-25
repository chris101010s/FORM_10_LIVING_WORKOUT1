# FORM 15.0.0 · Änderungen des zweiten Durchgangs

## Ausgangspunkt und Reihenfolge

Die zweite Runde basiert auf dem fertiggestellten First Pass `05056e2185092d9cc530a9aad5d4935a2de969e0` / `form-15-first-pass`. Das erste Paket wurde separat gesichert. Der unveränderte Bestandsaudit wurde vor Laufzeitänderungen in `2e69cf1` / `form-15-second-pass-audit` festgehalten. Die ursprüngliche FORM-10-Hotfix-Basis und beide Aufträge bleiben dokumentiert.

Marketingversion bleibt 15.0.0; neuer interner Build ist **150001**. Bundle-ID `app.athleteos.personal`, Scheme `athleteos`, SQLite `form-v84-clean.db`, SQL-Schema 9 und JSON-Schema 4 bleiben bestehen. Keine neue App, kein Reset, keine Pflicht-Neueinrichtung und kein neuer Quick-Workout-Pfad.

## 1. Daten und Wiederherstellung

| Dateien | Änderung / resultierendes Verhalten |
| --- | --- |
| `src/data/context.tsx`, `repository.ts`, `relational.ts` | Serialisierte funktionale Änderungen; `confirmedData` und `lastSaved` werden erst durch tatsächlich bestätigte Writes veröffentlicht. Schreibfehler behalten Eingaben im RAM; Retry und Load-Recovery sind getrennt. Funktionaler Restore-Merge arbeitet nach Dateistaging auf dem aktuellen Bestand. |
| `schema.ts`, `persistenceTypes.ts`, `secondPassValidation.ts`, `validation.ts` | Additive, strikt validierte Daten für individuelle Vorgaben, Positionen, Revisionen, Termine, Undo, beobachtete Pausen, Seitenwerte, Geräte, Medien und native Einstellungen. Unbekannte Erweiterungsfelder und höhere historische Istwerte bleiben erhalten. |
| `localSnapshots.ts`, `AutoBackupSync.tsx` | Geprüfte tägliche/Versions-/Vor-Import-Snapshots mit konfigurierbarer Rotation. Erst ein erfolgreich geschriebener und zurückgelesener neuer Snapshot erlaubt das Entfernen alter automatischer Sicherungen; manuelle Sicherungen bleiben getrennt. |
| `privateFiles.ts`, `mediaAssets.ts`, `PrivatePhoto.tsx` | Private Asset-ID/relative Pfade, Integritätsprüfung, explizite fehlende Medien, vorbereitete EXIF-/Orientierungsnormalisierung und sichere Übernahme bestehender Inline-Fotos. |
| `portableBackup.ts`, `portableCodec.ts`, `BackupCenter.tsx` | Portable Medienmanifeste, Hashprüfung und Importstaging vor Commit. Normale Sicherungen verlangen vollständige Medien. Der ausdrücklich markierte Notfallexport erhält lesbare Daten auch bei fehlenden Fotos. Vorschau, Vorher-Snapshot und Rollback bleiben erforderlich. |
| `diagnostics.ts`, `PrivacyDiagnostics.tsx` | Bestätigter DB-Stand, Dateigrößen, Anzahl lokaler Daten/Medien, Integritätsprüfung, Backupstatus und tatsächliche Capabilities. Diagnoseexport mit Zustimmung und standardmäßig ohne persönliche Werte/Notizen. |
| `shareTextExport.ts`, `App.tsx`, `TrainingAnalytics.tsx` | Explizite Recovery-/CSV-Exporte erhalten einen eigenen temporären Dateinamen, Write/Readback-Prüfung und Cleanup nach Freigabe, Abbruch oder Fehler. Ein tatsächlicher Cleanupfehler wird nicht verschwiegen. |

Automatische private Snapshots warten auf einen tatsächlich gemeldeten nativen Backup-Ausschluss. Lokale Dateien und SQLite werden nicht als mit einem FORM-Passwort verschlüsselt ausgegeben. Ein nativer Dateischutzstatus ist kein Ersatz für einen Geräte-/Kryptografienachweis. Details: `DATA_MIGRATION.md`, `BACKUP_AND_RECOVERY.md`.

## 2. Plan und Gym

| Dateien | Änderung / resultierendes Verhalten |
| --- | --- |
| `secondPassTypes.ts`, `plannedTargets.ts`, `planWorkout.ts` | Eigene stabile Planpositionen und individuelle Zielzeilen für Reps, Last, RIR/RPE, Tempo, Pause, Zeit/Distanz, Lastbasis und Seiten. Bestehende einheitliche Vorgaben werden verlustfrei abgebildet; laufende Sessions behalten ihre Momentaufnahme. |
| `SetTargetEditor.tsx`, `PlanRoutineEditor.tsx`, `planEditorInput.ts` | Einzel- und Batch-Bearbeitung mit rohen Texteingaben, Vorschau und explizitem Übernehmen. Satztyp und Maßeinheit sind unabhängig. Ausgeschaltete Positionen bleiben dokumentiert. |
| `planOperations.ts`, `planRevisionDiff.ts`, `PlanTools.tsx` | Append-only Planrevisionen, nachvollziehbare Unterschiede, alte Version ansehen/kopieren/als neue Revision übernehmen; Tage/Wochen/Positionen kopieren und verschieben mit neuen Instanz-IDs. Explizite Deload-/Last-/Rep-Anpassung. |
| `planTextImport.ts`, `PlanTextImport.tsx`, `planImport.ts` | Deterministischer lokaler Textimport und kompatibler JSON-Import. Vorschau bestätigt Übungs-ID, Einheit, Tag und unklare Zuordnung; kein Netz-/API-Schlüsselzwang. |
| `planOperations.ts`, `planOverview.ts`, `Plans.tsx` | Einzelne Termine verschieben/auslassen/rückgängig, ursprünglichen Termin behalten, Konflikte ausdrücklich behandeln und pro konkretem Termin zählen. Wiederholte oder fremde Sessions erledigen keinen falschen Termin. |
| `progression.ts`, `ProgressionPanel.tsx` | Nachvollziehbare, freiwillige Vorschläge aus vergleichbaren vollständigen Einheiten; nötige RIR, Lastbasis und Datenmenge sichtbar. Änderungen an Tempo, Block, Zielen, Deload oder größeren Lücken unterbrechen die Folge. Annahme erzeugt eine neue Planrevision, keine rückwirkende Änderung. |
| `Gym.tsx`, `InlineSetTable.tsx`, `SetEditor.tsx` | Tatsächliche Vorwerte als unbestätigte, korrekt zugeordnete Vorschläge; ehrliche geringere Reps; strikte neue Limits; Extras nur ausdrücklich. Unilaterale Werte, Handwahl, Schriftgröße, optionaler Fokus, Ersatzübung mit Originalbezug und explizites vorzeitiges Finish. |
| `workoutTiming.ts`, `livingWorkout.ts`, `LivingComponents.tsx` | Explizite Pausen, UTC-Zeitpunkte, beobachtete Restintervalle und nachvollziehbare Uhrsprunggrenzen. Atomisches Undo rekonstruiert Satz-/Timerzustand. Keine automatische Beendigung langer Sessions. |
| `EquipmentPanel.tsx`, `equipment.ts` | Lokale Studio-/Geräteangaben, Sitz/Pin/Griff, Stange/Offset und tatsächlicher Scheibenbestand. Vorschläge sind Entwürfe; nicht darstellbare Lasten werden nicht still erhöht. |
| `Gym.tsx`, `workoutAnalytics.ts` | Bestätigter Trainingszettel mit direkten Soll-/Ist- und Last-/Reps-Vergleichen, beobachteten Pausen, geeigneten Einheiten, tatsächlicher Dauer und belegten Rekorden. |

Ausführliche Regeln, Schwellen und Legacygrenzen stehen in `docs/second-pass-training-result.md`. Die gemeinsame synthetische Pflicht-Fixture umfasst 22 echte Aktionen einschließlich Abschluss von Satz 3 vor dem Extra-Satz. Der Daten-Gate führt sie über tatsächlichen Provider, Repository und echte SQLite-Dateien mit Neustarts aus.

## 3. Eigene Gestaltung, Motion und Texte

| Dateien | Änderung / resultierendes Verhalten |
| --- | --- |
| `src/art/*`, `assets/art/*` | 48 kanonische eigene Motive inklusive 16 unterschiedlicher Pip-Posen; zusätzlich zehn Kategorien und zwölf eigene Tabzustände. Registry mit Herkunft, Lizenz und Dateihashes. |
| `assets/tabs/*`, `App.tsx`, `PaperDetails.tsx` | Eigene aktive/neutrale Tab- und Profilsymbole in nativer Navigation sowie Fallback. Lokales Papierkorn, echte schließbare Randnotiz und optionales Retrofenster. |
| `assets/icons/*`, `plugins/withAlternateIcons.js` | Vier eigene deckende App-Symbole in tatsächlichen iOS-Größen; Primary/Alternate-Kataloge und Buildsettings. Native Auswahl nur mit bestätigter Fähigkeit und Readback. |
| `Design.tsx`, `AppearanceSettings.tsx`, `themes.ts` | System/Hell/Dunkel/Papier/Retro unter Erhalt alter Wahl, tatsächlicher Farbwechsel, lesbare Fehlerpalette, mindestens 44-pt-Grundcontrols und große-Schrift-Fallbacks. Vier lokale OFL-Schriften bleiben gebündelt. |
| `motion/spec.ts`, `MotionCue.tsx`, `Sketchbook.tsx` | 40 konkret integrierte Varianten/Abläufe; echte Pfadzeichnung, zentrale Abschaltung, Abbruch bei Hintergrund/Unmount, kein Replay und keine Domain-Aktionen in Animationcallbacks. Extra Row und Reorder bewegen echte Inhalte. |
| `copy/copy.de.ts`, `Personality.tsx` | 104 eigene typisierte Varianten über 26 echte Ereignisse, stabile Ereigniswahl, Wiederholungsbremse, höchstens 6,5 Sekunden Anzeige. Figur/Text getrennt aus; keine Beschämung, keine falschen PRs oder Speichererfolge. |
| `scripts/export-art15.cjs`, `export-icons15.py`, `check-design-contrast.cjs` | Echte Registry-Exporte und Asset-Sheet; tatsächliche Größen/Deckkraft; 56 berechnete Texttoken-Kontraste. Keine erfundenen App-Screenshots. |

Dokumente: `DESIGN_SYSTEM_15.md`, `CHARACTER_BIBLE.md`, `ASSET_MANIFEST.md`, `ASSET_LICENSES_15.md`, `MOTION_CATALOG.md`, `COPY_GUIDE.md`.

## 4. Analytics und Navigation

`workoutAnalytics.ts` und `analyticsSecond.ts` trennen Warm-ups, assistierte Sätze, Gesamt-/Hand-/Seitenlast, Körpergewichtsreps, Zeit und Distanz. Rekorde werden nach Korrektur/Löschung neu aus abgeschlossenen Sessions berechnet; ein erster Basiswert ist kein erfundener PR. Chronologie verwendet Zeitwerte statt lexikographischer ISO-Sortierung. Geänderte Vorgaben/Tempo/Blockstruktur werden nicht als gleichwertig behandelt.

`TrainingAnalytics.tsx` bietet echte Kalendertermine, Monatsfenster gleicher Länge, Jahresfilm, PR-Archiv, gleiche Last, Muskelbeteiligung, ursprüngliche Sollzeilen/Revisionen, aktive Dauer und beobachtete Pausen. Schlaf-/Trainingspaare benötigen genügend gemeinsam vorhandene Tage; fehlend ist nicht null, ein Zusammenhang keine Ursache. Favoriten bleiben begrenzt. CSV-Export erfolgt ausdrücklich, schützt Formelpräfixe und löscht die temporäre Freigabedatei.

`TrendChart.tsx` verwendet tatsächliche Zeitabstände, direkt anwählbare Datenpunkte, Datum/Wert/Einheit, zugängliche Schrittaktionen und eine paginierte Tabellenalternative. Es entstehen keine künstlichen Datenpunkte.

`LocalSearch.tsx` / `localSearch.ts` suchen lokal in Übungen, Plänen, abgeschlossenen Einheiten und Einstellungen, mit echten ID-basierten Detailrouten, optionalem lokalen Verlauf sowie Favoriten-/Geräte-/Muskelgruppenfiltern. Listen werden virtualisiert. Der bestehende Übungskatalog besitzt echtes FlatList-Windowing über horizontal blätterbare Seiten; der Katalog startet kein freies Workout.

Home liest Bestätigungszahlen aus `confirmedData`, aktualisiert Termine auch bei isolierter Occurrence-Änderung und zeigt offene Writes getrennt. Der Custom-Tab-Fallback verarbeitet dieselben Zielrouten wie die native Navigation. Unbekannte Gesundheits-/Fortschrittsrouten öffnen keinen beliebigen Ersatzscreen. Leere Auswertungen besitzen sachliche Hinweise auch bei ausgeschalteter Persönlichkeit.

## 5. Health und native Komfortfunktionen

Ein gemeinsamer Nutrition-Coordinator bündelt tatsächliche Abfragen beim Öffnen und optionalen Foreground. Er verwendet Lock, Debounce, bestätigte Freshness und 7-Tage-Seiten für bis zu 90 Tage. Unterbrochene/fehlgeschlagene Abfragen behalten bestätigte Abschnitte; Quelle, Sample-UUID, Zeit und Coverage bleiben erhalten. Quellen werden nicht blind addiert. Eigene manuelle Ziele werden nicht als aus YAZIO gelesene Ziele bezeichnet.

`FormHealthDayBridge.swift` und die bestehenden Brücken liefern tatsächlich unterstützte Tages-/Ernährungsdaten mit Herkunft. Bewusste FORM-Exporte verwenden stabile IDs; Korrektur/Löschung betreffen nur eigene Samples. Ein geschlossener Leserechte-Dialog wird nicht als bestätigte Leseberechtigung dargestellt. Die YAZIO-Integration bleibt der offizielle Apple-Health-Weg ohne erfundene API oder Login.

KeepAwake ist optional, fokus-/AppState-/Commit-gebunden und räumt auch asynchrone Aktivierungsrennen auf. Notifications werden an konkrete Session-/Timer-IDs und bestätigte Daten gebunden und nach Skip/Undo/Pause/Finish ersetzt oder entfernt. Widgets zählen konkrete Termine; Live Activities verwenden echte Zeitstempel und beenden verwaiste Sessions. Standardbuild ohne HealthKit/Widgets bleibt nutzbar. Die tatsächliche Geräteausführung und separate Widget-Signierung bleiben offen.

Details: `YAZIO_INTEGRATION.md`, `RELEASE_BUILD_15.md`, `docs/second-pass-health-native-delivery.md`.

## 6. Nachweise und Liefergrenze

Alle bestehenden Gates bleiben erhalten, einschließlich Switch-Callback- und nullable-Linking-Vertrag. Neue Tests ergänzen SQLite-/Medien-/Undo-/Parallelwrite-/Recovery-, Trainings-, Health-, Native-Adapter-, Such-, Analytics-, Art-/Copy- und tatsächliche Hook-Lebenszyklusprüfungen. Das abschließende Gesamtresultat, sauberer Lockfile-Installationslauf, Expo-/Prebuild-/Metro-Nachweise, Exitcodes und konkrete Grenzen stehen in `TEST_MATRIX_15_SECOND_PASS.md`.

Quellcode und lokale Prüfungen sind von CocoaPods/Xcode, einer tatsächlichen IPA, Simulator/physischem iPhone, VoiceOver/FPS/Screenrecordings und echtem YAZIO-Roundtrip getrennt. Diese offenen Gates werden nicht als bestanden dargestellt. Persönliche Daten wurden nicht in die Lieferung oder in externe Buildartefakte aufgenommen.
