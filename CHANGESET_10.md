# FORM 10.0 – Änderungen gegenüber ATHLETE OS 8.4 HOTFIX

## Anwendung und UI
- `App.tsx`: Wiederherstellung, Gym außerhalb des allgemeinen ScrollViews, Mini-Player, Speicherfehlerbehandlung, MotionProvider.
- `src/screens/Gym.tsx`: fokussierter aktiver Modus, Menü, Zeit-/Satzspeicherung, Quick Repeat, Swap, Timer, Abschluss und Review.
- `src/components/InlineSetTable.tsx`: fünf Spalten, lesbarere Eingaben, RIR in Details, Satzanimation.
- `src/features/workout/LivingComponents.tsx` (neu): WorkoutHeader, RestStrip, WorkoutMiniPlayer, MotionProvider, SVG-Stern und native-driver Animation.
- `src/components/Design.tsx`: gemeinsame Farbtokens und reduzierte Radien.
- `src/screens/Home.tsx`, `Setup.tsx`, `More.tsx`: sichtbares FORM-10.0-Branding und Text.

## Engine und Daten
- `src/utils/livingWorkout.ts` (neu): elapsedMs, clockText, recoveryReason, nextDraft, completeSet, changeRest, pauseSessionClock, swapExercise, finishSession.
- `src/utils/trainingEngine.ts`: Sessionmetadaten, monotone Satzsequenz und Status bei Pause/Fortsetzung.
- `src/data/schema.ts`, `validation.ts`: optionale neue Felder und Schutz der Datenintegrität, kompatibel mit vorhandenen Backups.
- `src/data/context.tsx`: bestätigte Speicherergebnisse, neuester Zustand bleibt bei Fehlern im Speicher, Retry.
- `tests/test-living-workout.cjs` (neu): 62 Prüfungen, einschließlich tatsächlicher SQLite-Datei.

## Build und Dokumentation
- `app.json`, `package.json`: Name/Version, Testskript; keine neuen npm-Abhängigkeiten.
- `.github/workflows/ios-unsigned.yml`: Workflow-Name, bisheriger CI-Pfad erhalten.
- `scripts/preflight.cjs`, `scripts/fetch-fonts.mjs`: neue Quellen prüfen, Font-Quellen anpassen.
- `README.md`, `README_DE.md`, `DESIGN_SYSTEM.md`, `BUILD_WINDOWS_TO_IPHONE.md`, `RELEASE_REPORT.md`, `CHANGESET_10.md`, `TEST_MATRIX.md`, `DATA_SCHEMA.md`, `.gitignore`: aktuelle Dokumentation und Logs.
- `docs/FORM_10_SPECIFICATION.txt`, `docs/RELEASE_REPORT_8_4_HOTFIX.md`, `docs/qa/10-*`: Spezifikation, archivierter Report, neue Prüfprotokolle.

Keine Anwendungskomponenten oder Datenbanktabellen entfernt. Der frühere Live-UI-Block in Gym wurde ersetzt; bestehende Detailfunktionen sind in das Workout-Menü verschoben. Keine Fontdateien oder persönliche Daten beigelegt.
