# FORM 8.0 — DEEP / Entwicklungsstand

**Status: lokal geprüfter Quellcode, keine native Release-Abnahme.** Dieses Paket erweitert die vorige FORM-Entwicklung auf Basis des gelieferten ATHLETE OS 7. Es ist weder eine simulierte IPA noch eine separate Demo. Bundle-ID `app.athleteos.personal`, Versionsnummer 8.0.0. Keine echten Nutzerdaten im Paket. Der vollständige Master-Prompt liegt in `docs/MASTER_PROMPT_DE.md`.

## Änderungen und tatsächlich geprüfte Phasen

| Phase | Ergebnis | Prüfung |
|---|---|---|
| A – Baseline | V7-Speicherschlüssel, OCR-Modul und vorhandene Buildkette beibehalten; Original-Backup | Baseline / Preflight / Compatibility / Storage |
| B – Design | FORM-Shell, Icon, Papier/Ink/Koralle, Home mit Wochenstreifen, Navigation, Mini-Session, optionales Onboarding | Syntax/Importe, FORM-Tests; visuelle Geräteabnahme offen |
| C – Gym | Acht Satztypen, sieben Trainingsformate, Satzvorgaben pro Übung, RIR/RPE, Seite, Tempo, Notizen, Drafts, Sessionpause, Resttimer, historische Bearbeitung, PRs, Scheiben/Warm-up, Suchranking | Workout, Deep, Catalog, Validation |
| D – Persistenz | Separate SQLite-Datenbank mit relationalen Session-/Satzzeilen, Indizes, Transaktionen, verifiziertem V7-Transfer und Import-Snapshot | Echte SQLite-Datei mit Node-Adapter: 22 Prüfungen; Expo-Adapter auf Gerät offen |
| E – Analytics/Journal | Zeitbasierte Charts, Scan-Rohtextprüfung, Scan-Korrektur und Vergleich, Habit-Wochentage/Archiv/Pause, Journal-Suche, Wochenreflexion, Offline-Insights | Logic, Advanced, FORM, Deep |
| F – Polish | Fünf Story-Presets, auswählbare Metriken, Gewicht/Name opt-in, Film Room, echte PR-Tickets, opt-in Extras, Fokusmodus | Deep, FORM; native Share-/Haptic-/Accessibility-Prüfung offen |
| G – CI | Expo-Konfigurationsprüfung, Tests, Typecheck, Prebuild, Pods, OCR-Check, unsigned Device-Build, Manifest/IPA-Integritätsprüfung | YAML parse, Shell-Syntax und statischer Contract-Test; GitHub/Xcode nicht ausgeführt |

## Testresultat aus frisch entpacktem Paket

`npm run test:all`: **13/13 Suiten bestanden**. 208 explizit gezählte Prüfungen (plus Katalog-, CSV- und Strukturprüfungen ohne Einzelzählung). Darunter 62 Deep-Prüfungen und 22 echte SQLite-Integrationstests. 30 TS/TSX-Quelldateien und 174 lokale Importpfade fehlerfrei syntaktisch geprüft. Testbestand 10.000 Sätze + 2.000 Gewichte + 1.000 Cardio-Einträge: JSON-Roundtrip erfolgreich; gesonderter SQLite-Migrationstest mit 10.000 Sätzen, Commit/Neustart/Rollback erfolgreich. Desktop-Zeitmessungen im Log, keine iPhone-Benchmarks. Die SQLite-Integration verwendet `node:sqlite` mit der identischen SQL-Engine, nicht den nativen Expo-Adapter.

Logs: `docs/qa/fresh-package-tests.log`, `docs/qa/install-offline.log`, `docs/qa/typecheck-blocked.log`. Frühere Logs sind historische Entwicklungsphasen und nicht der finale Teststand.

## Blocker / Risiken

- Node 22.16.0 und globales TypeScript 5.8.3 verfügbar; npm-Abhängigkeiten fehlen. Offline-Installation scheitert mit `ENOTCACHED` (unter anderem `@types/react`), Registry-DNS war nicht erreichbar. `npm run typecheck` endet mit Fehlern wegen fehlender React-/Expo-Module und `expo/tsconfig.base`. Vollständiger TS6-/Expo-Typecheck nicht bestanden/verifiziert, nicht als grün ausgeben.
- Kein Xcode, kein iOS-Simulator, kein iPhone und kein authentifizierter GitHub-Repository-Zugriff in dieser Umgebung. Keine IPA, keine Gerätescreenshots und kein erfolgreicher Update-/Sideloadly-Test. Der aus V7 übernommene Runner `xcode-27` und die konkreten Expo-SDK-Abhängigkeiten sind erst im echten CI verifizierbar. Kein npm-Lockfile erzeugbar, daher CI nutzt npm install wenn keines vorliegt. Nach erfolgreicher Installation Lockfile prüfen und committen. Kein Dependency-Audit mit installiertem Baum möglich.
- SQLite: relationale Session-/Satzstruktur und transaktionale Speicherung implementiert; übrige Entitäten je Datensatz mit JSON-Payload, nicht das komplette fein-normalisierte Zielmodell. Migration normalisiert Altbestandsfelder; V7-Rohdaten bleiben unverändert. Bei physischer DB-Korruption Recovery/Export statt automatischem Reset. Native Migration und tatsächliche Prozessabbrüche am Gerät offen.
- Gym: ein Trainingsformat pro Routine, Gruppenwechsel bei Superset/Giant/Zirkel; EMOM/AMRAP/Intervalle mit Zeitführung und manueller Protokollierung, **kein vollständiger Multi-Block-/Intervall-Programmiereditor**. Kein automatisches Scoring/Work-Rest-Programm, keine Drag-and-drop-Reihenfolge (Pfeiltasten).
- Keine vollständige Maßeinheiten-Konversion, keine eingebetteten Wunschfonts (Systemfallback), keine vollständige Bild-/Katalogvirtualisierung (begrenzte Seiten), keine vollständige Dark-/Paper-Theme-Implementierung. Der lokale Katalog enthält einen kuratierten Startbestand plus kleinen Quell-Snapshot; offizieller Vollkatalog wird bei CI/optionalem Sync geladen; 876 nicht als lokal enthalten behauptet.
- Kein HealthKit-/Watch-/Widget-/Live-Activity-Support, keine direkten YAZIO-Kontozugriffe, keine privaten Fortschrittsfotos, kein kompletter Erinnerungsdienst. Keine vollständigen 20 Easter Eggs. Story-Designs nutzen gemeinsame Layoutbasis; Story-Auswahl temporär; native PNG-Ausgabe ungetestet. Kein verschlüsselter Backup-Export, kein allgemeines Backup-Merge. Kein claim für vollständige Screenreader-/Dynamic-Type-Abnahme.
- Alte V7-App liest keine neuen V8-SQLite-Einträge. Beim Rollback auf V7 könnten neue Daten fehlen; vorher V8-Backup exportieren. Niemals die alte App vor dem Testupdate löschen. Gleiches Bundle allein garantiert nicht dieselbe App-Sandbox; Signierung und Gerätekonfiguration beachten.

## Nächster realer Release-Schritt

Siehe `BUILD_WINDOWS_TO_IPHONE.md`. Der Workflow ist enthalten, aber nicht gestartet. Vor Installation: externes V7-Backup und erfolgreicher CI-Lauf mit Manifest. Native Testmatrix danach ausführen; bei Speicher-/Migrationsfehler nicht blind neu installieren. Keine GitHub-Commit-ID, da in diesem Paket kein Remote-Commit erstellt wurde.

Die exakte Dateidifferenz zum Original befindet sich in `docs/CHANGED_FILES.md`. Die Funktionsstatusmatrix in `PRODUCT_SPEC.md` beschreibt ausdrücklich auch offene Teile.
