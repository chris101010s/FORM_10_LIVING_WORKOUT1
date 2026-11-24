> Historischer Stand DEEP 8.0 oder V7. Aktuelle Änderungen und Prüfungen für 8.1 Fresh stehen in `RELEASE_REPORT.md`; die automatische Migration ist in Fresh deaktiviert.

> Historischer V7 / früherer FORM-Entwicklungsstand. Für dieses Paket gelten RELEASE_REPORT.md, PRODUCT_SPEC.md, TEST_MATRIX.md und BUILD_WINDOWS_TO_IPHONE.md.

# ATHLETE OS 7 – Projekt-Audit und Bugfix (24.11.2026)

## Nachgewiesener Buildfehler
`modules/athlete-ocr/ios/AthleteOcrModule.swift` ist im Quell-ZIP enthalten, aber die ursprüngliche `.gitignore`-Regel `ios/` ignorierte das gleichnamige Unterverzeichnis eines lokalen Expo-Moduls. Die Korrektur `/ios/` ignoriert nur das generierte iOS-Projekt im Repository-Stamm. Dasselbe gilt für `/android/`.

## Weitere korrigierte/abgesicherte Stellen
- Beide TypeScript-Einzeltests (`scripts/check-logic.cjs` und `tests/test-workout.cjs`) verwenden einen temporären Arbeitsordner (TS5112).
- `scripts/preflight.cjs` prüft ab jetzt bereits VOR `npm install`, ob Swift, Podspec, App-Quellen und ihr Git-Tracking existieren.
- Test `test-compat.cjs` schlägt fehl, falls `ios/` wieder unabsichtlich unankert wird.
- GitHub Actions verwendet moderne Node-24-basierte Action-Versionen und erkennt Änderungen an allen Skripten.
- Nach `pod install` wird `AthleteOcr` in `ios/Podfile.lock` geprüft; Xcode-Fehler werden als Log-Artefakt hochgeladen.
- TypeScript und `@types/react` sind auf die von Expo SDK 58 im tatsächlichen GitHub-Log verlangten Versionen gestellt.

## Nicht bewiesen
Die vollständige Installation der npm-Pakete, `expo prebuild`, `pod install`, Xcode-Kompilierung, Sideloadly-Installation, iOS-Laufzeit und native OCR-Ergebnisse müssen noch auf GitHub/iPhone geprüft werden. Kein Audit kann pauschal alle zukünftigen Fehler ausschließen.

## Einspielen
Alle Dateien aus `PATCH_NUR_AENDERUNGEN.zip` ins *bestehende* Repository kopieren (mit Unterordnern und verstecktem `.github`). GitHub Desktop: Commit `Fix iOS module gitignore and build preflight` → Push origin. Kontrolliere danach auf GitHub unter `modules/athlete-ocr/ios/` das Vorhandensein von `AthleteOcrModule.swift` und `AthleteOcr.podspec`.
