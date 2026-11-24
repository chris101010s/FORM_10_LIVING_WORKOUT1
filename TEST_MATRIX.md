# FORM 8.4 Testmatrix

| Prüfung | Status |
|---|---|
| 8.3 Baseline / bestehende Regressionen | PASS, 16 Suiten |
| 8.4 finaler Quellstand | PASS, 17 Suiten, 52 neue Einzelprüfungen |
| Fresh-Namespace, leere Eingaben, kein Legacy-Import | PASS, reine Logik/Repository-Quellvertrag |
| Backup-Merge/Deduplikation/Konflikt, Gruppenvalidierung, Gruppenwechsel, Timerpause, Jahresreview | PASS, strict TS + Node |
| JSON-Roundtrip und SQLite-Schließen/Wiederöffnen, Foreign Key Check | PASS, Node DatabaseSync |
| Swift-Syntax / Shell-Syntax / Workflow-YAML | PASS, Parser |
| Native Kryptografie, Node/Swift Interoperabilität | NOT RUN, CI-Schritt vorhanden |
| npm install / full Expo typecheck | BLOCKED, ENOTCACHED / fehlende Pakete |
| Vollständiger Originalkatalog / Bilder / Fonts | BLOCKED, Upstream-Download nicht verfügbar |
| Native Navigation, Touch, FaceID, HealthKit, Widget, Benachrichtigungen, Performance/Accessibility | NOT RUN, iPhone nötig |
| Xcode, IPA, Sideloadly, Gerätetest | NOT RUN |

Ausgaben in `docs/qa/84-*.log`. Tests prüfen keine echte Benutzeroberfläche. Keine Coverage-Schätzung.

## FORM 10.0

62 zusätzliche Logik-/SQLite-Prüfungen: `npm run test:living`. Alle 18 Suites lokal grün. Native Abnahme, UI und vollständiger Typecheck offen. Detaillierter Geräte-Testplan in RELEASE_REPORT.md.
