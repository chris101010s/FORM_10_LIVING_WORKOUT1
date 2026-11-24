> Historischer Stand DEEP 8.0 oder V7. Aktuelle Änderungen und Prüfungen für 8.1 Fresh stehen in `RELEASE_REPORT.md`; die automatische Migration ist in Fresh deaktiviert.

> Historischer V7 / früherer FORM-Entwicklungsstand. Für dieses Paket gelten RELEASE_REPORT.md, PRODUCT_SPEC.md, TEST_MATRIX.md und BUILD_WINDOWS_TO_IPHONE.md.

# ATHLETE OS 7 — letzter reparierter Quellstand

Dieses Paket basiert auf der zuletzt bereitgestellten ATHLETE-OS-7-Vollversion mit folgenden eingearbeiteten Reparaturen:

1. TypeScript-6-kompatible Einzeldatei-Tests (TS5112).
2. Wiederherstellung der getrackten OCR-Swiftdatei und Podspec durch passende `.gitignore`-Regel.
3. Korrektur der Speicher-/Recovery-Testumgebung für `expo-sqlite/kv-store`.
4. Korrektur der `StatusBar`-Eigenschaften in `App.tsx`.
5. Korrektur des `ViewInstance`-/`captureRef`-Typs in `src/screens/More.tsx`.
6. Enthält alle bisherigen Gym-, Gewichts-, FITINN-, Backup- und Fortschrittsfunktionen von ATHLETE OS 7.

## Lokale Prüfung am 24.11.2026

- `test:preflight`: erfolgreich.
- `test:syntax`: erfolgreich, 20 TypeScript-/TSX-Dateien und 113 lokale Importpfade geprüft.
- `test:logic`: 17 Prüfschritte erfolgreich.
- `test:catalog`: erfolgreich.
- `test:csv`: erfolgreich.
- `test:validation`: 22 Prüfungen erfolgreich.
- `test:workout`: 12 Prüfungen erfolgreich.
- `test:compat`: 14 Prüfungen erfolgreich.
- `test:storage`: 8 Prüfungen erfolgreich.
- `test:advanced`: 32 Prüfungen erfolgreich.
- ZIP-Integrität: geprüft.

**Nicht durch uns ausgeführt:** `npm install`, vollständiger Expo-Typecheck mit installierten Abhängigkeiten, CocoaPods-/Xcode-Release-Build und Sideloadly-Installation. Die lokale Umgebung erreicht die npm-Registry nicht. Deshalb wird keine garantiert funktionierende IPA behauptet. Im GitHub-Build zeigt `npm run check`, ob der Typecheck wirklich besteht. Die tatsächliche IPA kann nur aus einem erfolgreichen CI-Build kommen.

## Update auf GitHub

1. Vorhandene Version sichern, insbesondere **JSON-Backup aus der App exportieren**.
2. In GitHub Desktop den Repository-Hauptordner öffnen.
3. **Inhalt** der ZIP direkt in den Repo-Hauptordner kopieren (nicht den ganzen entpackten Ordner als Unterordner). Vorhandene Dateien ersetzen.
4. Nur Code und Dokumente committen. Keine persönlichen Messdaten/Scans oder JSON-Backups hochladen.
5. `Commit to main` → `Push origin` → GitHub `Actions`.
6. Neuen Workflow-Lauf ansehen (nicht einen alten „Initial commit“-Run). Bei Fehler den **ersten fehlschlagenden Schritt** mit Log prüfen.
7. Bei grünem Build unter `Artifacts` die unsigned IPA herunterladen und mit Sideloadly signieren. Nicht die bestehende App deinstallieren; gleiche Bundle-ID beibehalten.

## Was der separat beigefügte Master-Prompt ist

`ATHLETE_OS_8_ULTRA_MASTER_PROMPT_DE.md` ist eine **Entwicklungs-Spezifikation für eine künftige Version 8**, kein bereits fertig implementiertes Redesign. Er fordert unter anderem ein vollkommen anderes helles Design, andere Fonts, deutlich mehr Gym-Funktionen, Easter Eggs und robuste Datenmigration. Die Umsetzung dieses Prompts ist **nicht** in dieser Version-7-ZIP enthalten.
