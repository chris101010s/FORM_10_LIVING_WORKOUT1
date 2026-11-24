> Historischer Stand DEEP 8.0 oder V7. Aktuelle Änderungen und Prüfungen für 8.1 Fresh stehen in `RELEASE_REPORT.md`; die automatische Migration ist in Fresh deaktiviert.

> Historischer V7 / früherer FORM-Entwicklungsstand. Für dieses Paket gelten RELEASE_REPORT.md, PRODUCT_SPEC.md, TEST_MATRIX.md und BUILD_WINDOWS_TO_IPHONE.md.

# ATHLETE OS 7 – Build-Audit und Reparaturpaket
**Stand:** 24. November 2026

## 1. Ursache des Fehlers in „Fix TypeScript tests #3“

Der Build lief bereits erfolgreich bis `npm run test:compat`. Die Fehlermeldung war:

```
ENOENT: no such file or directory,
modules/athlete-ocr/ios/AthleteOcrModule.swift
```

**Ursache aus der ursprünglichen Projektdatei:** In `.gitignore` stand `ios/`. Git ignoriert dadurch **jedes** Verzeichnis mit dem Namen `ios`, auch das lokale Expo-Modul `modules/athlete-ocr/ios`. Das Original-ZIP enthielt die Swift-Datei bereits, aber sie konnte durch diese Ignore-Regel beim `git add` ausgelassen werden.

**Reparatur:** `ios/` → `/ios/` und `android/` → `/android/`. Jetzt werden nur die generierten Plattformordner im Repository-Stamm ignoriert. Der lokale Swift-Code wird ins Git-Repository aufgenommen.

## 2. Weitere geprüfte und korrigierte Fehlerquellen

- **TypeScript TS5112:** Beide Testskripte `scripts/check-logic.cjs` und `tests/test-workout.cjs` sind repariert und verwenden eine vom Hauptprojekt isolierte Kompilierung.
- **Fehlende Git-Quelldateien:** Neues `scripts/preflight.cjs` prüft vor der npm-Installation alle kritischen Dateien sowie nach `git checkout` deren tatsächliches Tracking.
- **Git-Ignore-Regression:** `tests/test-compat.cjs` prüft, dass `/ios/` nicht wieder zu `ios/` wird.
- **Importfehler:** `scripts/check-project.mjs` prüft neben TypeScript-Syntax auch interne Importpfade und deklarierte direkte Pakete.
- **Fehlende CocoaPods-Verknüpfung:** Nach `pod install` kontrolliert der Workflow `ios/Podfile.lock` auf `AthleteOcr`.
- **Build-Diagnose:** Der Xcode-Build schreibt `artifacts/xcodebuild.log`; bei Xcode-Fehlern wird das Log als GitHub-Artefakt bereitgestellt.
- **Veraltete Actions:** Wechsel auf `actions/checkout@v5`, `actions/setup-node@v5` und `actions/upload-artifact@v6` (Node-24-basierte Action-Versionen).
- **Expo-Warnung:** `@types/react` und `typescript` sind auf die im GitHub-Build von Expo SDK 58 verlangten Bereiche `~19.3.0` und `~6.0.3` eingestellt.
- **Workflow-Trigger:** Änderungen an beliebigen `scripts/**`-Dateien lösen den Workflow aus.

## 3. Tatsächlich ausgeführte lokale Prüfungen

| Prüfung | Ergebnis |
|---|---|
| Projekt-Preflight ohne npm | bestanden |
| Echte `git add`-/`git ls-files`-Prüfung | beide Swift-/Podspec-Dateien im Staging enthalten |
| `git check-ignore -v` gegen generierten `/ios/`-Ordner | erwartungsgemäß ignoriert |
| TypeScript-/TSX-Syntax | 20 Dateien, 0 Fehler |
| Relative und direkte Importpfade | 112 geprüft, 0 Fehler |
| Logiktest | 17 Fälle bestanden |
| Workouttest | 12 Fälle bestanden |
| Datenvalidierung und Migration | 22 Fälle bestanden |
| Kompatibilität | 14 Prüfungen bestanden |
| Simulierte Speicher- und Recovery-Fehler | 8 Fälle bestanden |
| Erweiterte Analyse- und Planungslogik | 32 Fälle bestanden |
| Katalogtest und CSV-Test | bestanden |
| Swift-Parser (`swiftc -frontend -parse`) | bestanden, **kein** iOS-Build |
| CocoaPods-Podspec-Syntax (`ruby -c`) | bestanden |
| Bash-Buildskript (`bash -n`) | bestanden |
| GitHub Workflow-YAML | syntaktisch geprüft |

## 4. Noch NICHT geprüft – wichtig

In dieser Laufzeit stehen keine installierten Expo-/React-Native-Abhängigkeiten und kein macOS/Xcode zur Verfügung. Ein vollständiger TypeScript-Typecheck mit den installierten Typdefinitionen, `expo prebuild`, `pod install`, Xcode, echte iOS-Laufzeit, FITINN-OCR auf dem Gerät und Sideloadly-Installation wurden **nicht** durchgeführt. Im GitHub-Log wurden außerdem **3 moderate npm-Sicherheitswarnungen** angezeigt; ohne `npm audit`-Details lassen sie sich nicht seriös als behoben bezeichnen. Bitte nicht blind `npm audit fix --force` ausführen, weil dadurch Expo-Abhängigkeiten beschädigt werden könnten.

**Eine Garantie für null verbleibende Fehler wäre unzutreffend.** Dieses Paket behebt den aktuellen Fehler und testet die bereits bekannten Schwachstellen umfassender; der nächste GitHub-Build muss die restliche native Kette durchlaufen.

## 5. So wird der Patch eingebaut

1. `ATHLETE_OS_7_KOMPLETTER_BUILD_FIX_PATCH.zip` herunterladen und entpacken.
2. GitHub Desktop öffnen → Repository `ATHLETE_OS_7_PRO` → **Repository → Show in Explorer**.
3. **Alle Dateien und Ordner aus dem Patch in diesen Repository-Hauptordner kopieren**, vorhandene Dateien ersetzen. Auch die versteckte `.gitignore` und `.github` mitnehmen. Nicht den Patchordner als zusätzlichen Unterordner hineinkopieren.
4. GitHub Desktop → **Changes**: unter anderem `.gitignore`, `package.json`, `.github/workflows/ios-unsigned.yml`, `scripts/preflight.cjs` und `modules/athlete-ocr/ios/AthleteOcrModule.swift` müssen zu sehen sein. Das Swift-Modul wurde vorher ignoriert und sollte deshalb **neu** erscheinen.
5. Zusammen committen: `Fix ignored Swift module and CI preflight` → **Commit to main** → **Push origin**.
6. Auf GitHub → Code → `modules/athlete-ocr/ios/` prüfen, dass `AthleteOcrModule.swift` und `AthleteOcr.podspec` sichtbar sind.
7. Auf GitHub → Actions den **neuen** Lauf öffnen (nicht `Initial commit #1` oder `Fix TypeScript tests #3`).
8. Wenn erfolgreich: Unter **Artifacts** `ATHLETE_OS_unsigned_IPA` herunterladen. Bei Fehler: den **ersten rot markierten Schritt** senden; falls Xcode fehlgeschlagen ist, das neue Artefakt `ATHLETE_OS_Xcode_Fehlerlog` herunterladen.

**Datenschutz:** Keine persönlichen Backups, Gesundheitsdaten oder FITINN-PDFs in das öffentliche GitHub-Repository kopieren. Die Patch-ZIP enthält keine persönlichen Trainingsdaten.
