# FORM 10.0 — THE LIVING WORKOUT

Weiterentwicklung des ATHLETE OS 8.4 HOTFIX, keine zweite App. Bundle-ID `app.athleteos.personal`, SQLite-Datei `form-v84-clean.db`, Schema 8 und Backupformat 4 bleiben bestehen. Bei einer Neuinstallation beginnt FORM leer; bei einem Update bleiben FORM-8.4-Daten erhalten. Ältere isolierte Datenspeicher werden nicht automatisch geladen.

## Start und Build

`npm install` → `npm run check` → `npm start`. Für iOS den vorhandenen Workflow `FORM 10.0 – iOS IPA (unsigned)` auf GitHub verwenden. Das Projekt enthält keinen signierten Build und keine IPA. Siehe `BUILD_WINDOWS_TO_IPHONE.md`, `RELEASE_REPORT.md` und `CHANGESET_10.md`.
