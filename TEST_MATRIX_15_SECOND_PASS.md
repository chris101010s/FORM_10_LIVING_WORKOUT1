# FORM 15.0.0 · Zweiter Durchgang · Testmatrix

Prüfdatum: **25. November 2026**. Zielstand: **15.0.0 / Build 150001**. Alle Zeitstempel in den maschinenlesbaren Logs sind UTC. Diese Matrix trennt tatsächlich ausgeführte Quell-/JavaScript-/SQLite-Prüfungen, kontrollierte native Adapter, erzeugte iOS-Projekte und noch nicht ausgeführte Geräteprüfungen.

## 1. Gesamtstatus

| Gate | Tatsächliches Ergebnis | Beleg |
| --- | --- | --- |
| Unabhängige saubere Lockfile-Installation | **PASS, Exit 0**; Node 24.22.3, npm 11.19.1, 13,24 s | `docs/qa/15-second/clean-install.log`, `clean-install-status.json` |
| `npm run check` | **PASS, Exit 0**, 77,82 s; alle 33 Gruppen, danach voller Typecheck und ESLint | `docs/qa/15-second/final-check.log`, `final-check-status.json` |
| `tsc --noEmit` | **PASS** als eigener Abschnitt des erfolgreichen Gesamtgates | `final-check.log` |
| ESLint, `--max-warnings 0` | **PASS**, keine Lintfehler oder Lintwarnungen im finalen Lauf | `final-check.log` |
| `FORM_HEALTHKIT=0 FORM_WIDGETS=0 npm run config:check` | **PASS, Exit 0** | `docs/qa/15-second/expo-config-standard.log` |
| `npm run doctor` | **PASS, 20/20, Exit 0** | `docs/qa/15-second/expo-doctor.log` |
| `expo install --check`, online | **BLOCKIERT / Exit 1**, zwei HTTP-Proxy-Timeouts | `expo-dependencies.log`, `expo-dependencies-retry.log` |
| `EXPO_OFFLINE=1 expo install --check` | **PASS mit ausdrücklicher Offline-Warnung, Exit 0**; kein Nachweis eines erreichbaren Online-Versionsdienstes | `expo-dependencies-offline.log` |
| Lokale SDK-Abhängigkeitszuordnung | **PASS**; tatsächliche installierte Versionen gegen `expo@58.0.26/bundledNativeModules.json` geprüft | `sdk-dependency-readback.json` |
| Standard-iOS-Prebuild | **PASS, Exit 0**; Version15.0.0/Build150001, Entitlements `{}`, Health-/Widgetflags aus | `prebuild-standard.log`, `prebuild-standard-verification.json` |
| Optionaler HealthKit-Prebuild | **PASS, Exit 0**; ausschließlich HealthKit-Entitlement und erforderliche Nutzungstexte, Widgets aus | `prebuild-health.log`, `prebuild-health-verification.json` |
| Finaler iOS-Metro-/Hermes-Export | **PASS, Exit 0**; tatsächliches Bundle, Source Map und referenzierte Assets | `metro-ios-export.log`, `metro-ios-export-status.json`, `metro-export-verification.json` |
| Native Modulregistrierung | Expo-Autolinking erkennt `FormHealth`/`FormHealthModule`; Podspec schließt beide neuen Swift-Helfer ein | `docs/second-pass-health-native-delivery.md`; lokale Modulkonfiguration und Podspec |
| CocoaPods, Swift, Xcode, Simulator, IPA, Signierung | **NICHT AUSGEFÜHRT / nativ blockiert** | `docs/qa/15-second/native-environment.json` |
| Physisches iPhone, reale Überinstallation, YAZIO-Roundtrip, native Motion/FPS | **NICHT AUSGEFÜHRT** | Geräte-Abnahmematrix unten |
| Vollständige Source-ZIP, Patch, CRC, Dateihashes | Separater tatsächlicher Paketcheck nach Quellcommit | `SOURCE_MANIFEST_15_SECOND_PASS.json`, `PATCH_VERIFICATION_15_SECOND_PASS.json` im ZIP-Wurzelordner; ZIP-SHA-256 bei Übergabe |

Die Paketprüfung steht bewusst außerhalb des Quellcommits: Sie prüft dessen endgültige Bytes und erzeugt keinen selbstreferenziellen Hash. Die ZIP enthält keine erfundene IPA oder IPA-Prüfsumme.

## 2. Reproduzierbare Befehle und Umgebung

Die erste Installation wurde in einem unabhängigen lokalen Checkout durchgeführt. Vor der finalen Installation wurden sämtliche getrackten Quellen synchronisiert, einschließlich **`modules/form-health/ios/`**. Nur generierte native Verzeichnisse am Projektwurzelverzeichnis, `.git` und `node_modules` werden nicht als kopierte Quellen behandelt. Der Sync ist in `clean-source-sync.json` festgehalten.

```bash
npm ci --no-audit --no-fund
npm run check
FORM_HEALTHKIT=0 FORM_WIDGETS=0 npm run config:check
npm run doctor
npm exec --no -- expo install --check
EXPO_OFFLINE=1 npm exec --no -- expo install --check
FORM_HEALTHKIT=0 FORM_WIDGETS=0 npm exec --no -- expo prebuild --platform ios --clean --no-install
FORM_HEALTHKIT=1 FORM_WIDGETS=0 npm exec --no -- expo prebuild --platform ios --clean --no-install
FORM_HEALTHKIT=0 FORM_WIDGETS=0 npm exec --no -- expo export --platform ios --output-dir artifacts/second-ios-export --clear --source-maps
```

Die Prebuilds liefen nacheinander in einem isolierten Arbeitsverzeichnis; die Standardkonfiguration wurde vor dem folgenden HealthKit-Prebuild separat zurückgelesen. `--clean` betrifft dabei das erzeugte native Projekt, keine installierte App und keinen persönlichen Datencontainer. Der Hermes-Export erfolgte nach der sauberen Lockfile-Installation. Sein Verifikationsmanifest vergleicht die tatsächlich exportierten Runtime-Quelldateien mit dem gelieferten Stand und hält Bundle-/Source-Map-/Asset-Hashes fest.

Der komplette Check lief nach dem letzten funktionalen Runtime- und Testfix. Danach wurden ausschließlich zwei nachgestellte Leerzeichen in JSX entfernt und Dokumente/Prüfbelege vervollständigt; der endgültige Hermes-Export wurde auch nach dieser Formatbereinigung nochmals erzeugt. Es gibt keinen späteren funktionalen Quellpatch außerhalb des dokumentierten Prüflaufs.

## 3. Die 33 Gruppen des vollständigen Checks

Alle folgenden Gruppen wurden im selben erfolgreichen `npm run check` ausgeführt. „33“ bezeichnet Top-Level-Skripte, nicht 33 Assertions. Einige Skripte rufen zusätzliche Untertests auf; ihre Ergebnisse werden nicht nochmals als eigenständige Top-Level-Gruppen gezählt. Der Original-Gesamtlog ist maßgeblich.

| Nr. | Script | Ergebnis / Prüfumfang |
| --- | --- | --- |
| 1 | `test:preflight` | Kernquellen und tatsächliches Git-Tracking vorhanden |
| 2 | `test:syntax` | 126 TS/TSX-Quelldateien, 826 Importpfade, 0 Fehler |
| 3 | `test:logic` | 17 Prüfungen: Zahlen, Datum, Trends, Parser, Vorwerte, Cardio |
| 4 | `test:catalog` | Tatsächliche Katalogsuche, Synonyme, Filter, Validator, Startbestand |
| 5 | `test:csv` | Quotes, Zeilenumbrüche, BOM, Dezimalwerte, Datum, ungültige Header |
| 6 | `test:validation` | 22 Backup-/Schema-/Migrations-/Sicherheitsprüfungen |
| 7 | `test:workout` | 12 Vorwert-/Progressions-/Wochenstatistikprüfungen |
| 8 | `test:compat` | 14 native Build-/Storage-Verträge auf Quellenebene |
| 9 | `test:storage` | 10 Speicher-/Recovery-Fälle einschließlich simuliertem Schreibfehler |
| 10 | `test:advanced` | 32 Prüfungen: Recovery, Messwerte, Ziele, Wochenplan, PR, Altstrukturen |
| 11 | `test:form` | 17 Migration-/Journal-/Einstellungs-/Scheiben-/Timerprüfungen |
| 12 | `test:deep` | 62 Engine-/Backup-/Habit-/Coach-/Share-/Lastprüfungen |
| 13 | `test:sqlite` | 22 echte SQLite-Prüfungen: Migration, Neustart, Rollback, inkrementelle Speicherung |
| 14 | `test:fresh` | 41 Setup-/Validierungs-/Backup-/Namespace-/SQLite-Neustartprüfungen |
| 15 | `test:redesign` | 54 Zyklen-/Optionaltag-/Validierungs-/Health-/JSON-/SQLite-Prüfungen |
| 16 | `test:native` | 59 Logikprüfungen nativer Integrationsdaten und optionaler Konfiguration |
| 17 | `test:form84` | 52 Namespace-/Merge-/Block-/Sessionuhr-/Backup-/SQLite-Prüfungen |
| 18 | `test:living` | 62 Uhr-/Entwurf-/Replay-/Pause-/Tausch-/Historien-/Rollbackprüfungen |
| 19 | `test:switch-contract` | 7 tatsächliche Switch-Callbacks typgeprüft; `Promise<boolean>` für Persistenz bleibt erhalten |
| 20 | `test:plan15` | 114 Plan-only-/Sollzeilen-/Extra-/Snapshot-/Legacy-/SQLite-/Backup-Assertions |
| 21 | `test:nutrition15` | 66 HealthKit-Ernährungs-/Export-Adapterprüfungen |
| 22 | `test:migration15` | 81 FORM10→15-/Idempotenz-/Crash-Rollback-/Extension-/Neustartprüfungen |
| 23 | `test:repository15` | 65 Prüfungen am echten Repository mit SQLite-Dateien und kontrolliertem Native-Adapter |
| 24 | `test:plan-management15` | 67 Import-/Konflikt-/ID-/Entwurfs-/Kalender-/Wiederholungsprüfungen |
| 25 | `test:build15` | 46 Identitäts-/Capability-/Lockfile-/Shellsyntaxprüfungen |
| 26 | `test:progress15` | 16 Datums-/Korrektur-/e1RM-/Einheiten-/fehlende-Daten-Assertions |
| 27 | `test:design-second` | 913 Design-/Asset-/Copy-Assertions; zusätzlich 653 Hook-Lebenszyklusprüfungen und 56 Kontrastpaare |
| 28 | `test:analytics-second` | 84 Analytics-Assertions; zusätzlich 47 tatsächliche Home-/App-/Analytics-Renderprüfungen mit kontrollierten Blättern |
| 29 | `test:second-pass-data` | 276 Daten-Assertions; zusätzlich 66 Text-Export-Adapterprüfungen |
| 30 | `test:health-second` | 172 Health-Assertions: dauerhafte Queue, Historie/DST, Abbruch, Quellen, unbekannte Werte, eigene Exporte |
| 31 | `test:native-second` | 97 Adapter-Assertions: KeepAwake-Races, Notifications, konkrete Widgettermine, Timerpayloads, Readback |
| 32 | `test:search-second` | 49 Such-Assertions mit echtem mitgeliefertem Katalog und begrenzten Ergebnissen |
| 33 | `test:training-second` | 197 Trainings-Assertions: tatsächlicher Lebenszyklus, Sollzeilen, Undo, Termine, Seitenwerte, Entwürfe, Parser, Equipment |

Anschließend liefen `tsc --noEmit` und `eslint App.tsx src app.config.js plugins scripts tests --max-warnings 0` erfolgreich. Diese beiden Gates sind nicht in die Zahl 33 hineingezählt.

## 4. Gemeinsames Pflichtszenario mit 22 Fachaktionen

Die Fixture `tests/fixtures/second-pass-workout.cjs` verwendet einen bereits eingerichteten synthetischen Nutzer, einen alten Plan, zwei alte Workouts und drei alte Gewichte. Der Daten-Test führt jede Fachaktion durch den tatsächlichen Provider und das tatsächliche Repository, liest über eine neue SQLite-Verbindung zurück und kontrolliert unveränderten Altbestand. Vor Undo nach Satzabschluss erfolgt zusätzlich ein vollständiger Repository-/Provider-Neustart.

| Schritt | Tatsächlich ausgeführte Fachaktion |
| --- | --- |
| 1 | Geplante Einheit mit konkretem Termin starten; erste Übung mit 12/10/8 Soll-Wiederholungen |
| 2 | Unvollständigkeitsfähigen Komma-Entwurf und Notiz speichern |
| 3 | Ersten Satz samt Resttimer und Undo-Beleg abschließen |
| 4 | Abschluss einschließlich Timer rückgängig machen; Entwurf bleibt |
| 5 | Ersten Satz erneut abschließen |
| 6 | Eine zusätzliche Wiederholung nur für die zweite Zielzeile freigeben |
| 7 | Zweite Zielzeile mit 42,5 kg und 11 Wiederholungen vorbereiten |
| 8 | Zweite Zielzeile abschließen |
| 9 | Dritte Zielzeile mit 45 kg und 8 Wiederholungen vorbereiten |
| 10 | Dritte geplante Zielzeile vor dem Extra-Satz abschließen |
| 11 | Extra-Satz ausdrücklich hinzufügen; Ziele der passenden Position übernehmen |
| 12 | Extra-Satz wieder rückgängig machen |
| 13 | Linke und rechte Seite unabhängig als Entwurf speichern |
| 14 | Unilaterale Zeile mit unterschiedlichen Seitenwerten abschließen |
| 15 | Andere Übung mit Grund überspringen |
| 16 | Überspringen rückgängig machen |
| 17 | Übung vorübergehend ersetzen; ursprünglicher Routinen-Snapshot bleibt |
| 18 | Ersetzung rückgängig machen |
| 19 | Teilweise absolviertes Training beenden; Original-Sollzeilen im Abschluss erhalten |
| 20 | Einen optionalen anderen Termin verschieben; ursprüngliches Datum und Terminart bleiben |
| 21 | Künftige Ziele als neue Planrevision ändern; beendetes Training bleibt unverändert |
| 22 | Alte Planrevision als neue Revision wiederherstellen, mit unabhängigen Positions-IDs |

Die begleitenden Regressionen prüfen zudem Soll3→4 nur nach Extra-Freigabe, unveränderte alte 12er-Werte, schnelle Folgeaktionen, SQL-Write-Fehler, Retry, Lesefehler ohne Reset, konkurrierende Updates, Medienbackup/-Restore, manipulierte Hashes/Pfade, unbekannte Felder und Rotation ohne Verlust nach fehlgeschlagener neuer Sicherung. Health-Werte und private Provenienz werden auch im Datenbank-Neustart- und Backup-Pfad geprüft. Das synthetische Szenario ist kein Nachweis von Sperrbildschirm, Touchgesten, tatsächlichem iOS-Prozessabbruch oder persönlichem Altbestand.

## 5. Tatsächliche Komponenten- und Lifecycle-Prüfungen

`tests/test-home-commit-second.cjs` lädt den tatsächlichen Home-Code, den Main-Funktionskörper und den Provider/Repository-Weg. Kontrolliert werden React-Hooks, Native-Blattelemente und Navigationseingaben. Ein fehlgeschlagener echter SQLite-Satzinsert belässt Home auf **0 bestätigt**, obwohl der RAM-Entwurf bereits einen Satz enthält. Erst ein erfolgreicher Retry erhöht den Wert. Ein fehlgeschlagener Finish-Insert erzeugt keinen bestätigten Wochenabschluss oder Tageshaken. Ein allein geänderter Plantermin invalidiert die reale Memoisierung. Wiederholte Custom-Tab-Routeparameter funktionieren nach manuellem Tabwechsel.

`tests/test-motion-lifecycle-second.cjs` lädt die tatsächlichen Hooks und Komponenten mit kontrolliertem Animated/AppState/Accessibility-Adapter. Die 653 Prüfungen decken die zeitgesteuerten Varianten, Ersatz laufender Effekte, Off/Reduce Motion/Inaktivität, Unmount, fehlende Commit-Bestätigung, eigenständige Opt-ins, timestampbasierten Restdial und kurzlebige Sprechblasen ab. Es läuft kein echter iOS-Animationstreiber. Die Quellenprüfungen des Design-Gates ergänzen reale SVG-/PNG-Bytes, Opazität, Maße, unterschiedliche Geometrien und angebundene Ereignisse; sie ersetzen keine visuelle Geräteprüfung.

`scripts/check-design-contrast.cjs` liest die tatsächlich verwendeten TypeScript-Paletten und prüft 56 Text-/Hintergrundpaare. Die mindestens 4,5:1 beziehen sich auf diese opaken Farbpaare. Transparenz, tatsächliche native Schriftzeichnung und Bildschirmdarstellung bleiben separat zu prüfen.

## 6. Export-, Konfigurations- und Asset-Nachweise

Der letzte Metro-Export erzeugt ein echtes `.hbc`-Bundle, eine Source Map und `metadata.json`. `metro-export-verification.json` prüft jeden referenzierten Assetpfad, die vier eingebetteten eigenen Schriftdateien und alle 36 Tab-PNGs bytebezogen sowie den Abgleich der exportierten Runtime-Quellen. Das native Modul-Quellverzeichnis wird in diesem Vergleich ausdrücklich eingeschlossen. Ein erfolgreiches Hermes-Bundle besagt nichts über erfolgreiche Swift-Kompilierung oder iPhone-Installation.

Der Standard-Prebuild wurde tatsächlich ausgelesen: Version und Build stimmen, Entitlements sind leer, HealthKit-Nutzungstexte und Widgets/Live Activities fehlen, die Primäricon-Pixel entsprechen Ink. Alle drei Alternate-Icon-Quelldateien wurden gegen die erzeugten Kataloge verglichen; die App-Target-Einstellungen existieren in Debug und Release. Ob Xcode daraus die erwarteten kompilierten Icon-Einträge erzeugt, prüft erst `scripts/verify-ios-presentation.cjs` nach einem echten nativen Build.

Der getrennte HealthKit-Prebuild enthält nur die vorgesehenen HealthKit-Berechtigungen und Nutzungstexte, ebenfalls Build150001 und keine Widget-Aktivierung. Die vorbereiteten Standard-/HealthKit-Releasepfade setzen Widgets aus; ein korrekter signierter Multi-Target-Widgetpfad ist nicht allein durch den vorhandenen Config-Schalter belegt.

## 7. Fehlgeschlagene Versuche und nachvollziehbare Wiederholungen

- **Einzelner Test-Lintfehler:** Der erste finale Gesamtlauf bestand alle Funktionstests und den Typecheck, scheiterte dann an `no-promise-executor-return` im neu ergänzten Home-Test. Der Promise-Executor wurde mit einem Block ohne Return korrigiert. `final-check-lint-failed.log` und `.json` bewahren den fehlgeschlagenen Lauf; `final-check.log` belegt anschließend das vollständige erfolgreiche Gate.
- **Online-Proxyfehler:** Beide Online-Expo-Abhängigkeitschecks endeten mit Timeout/Exit1. Sie werden nicht als PASS gewertet. Der getrennte Offline-Check trägt seine Warnung und wird durch den lokalen SDK-Metadatenvergleich ergänzt. Die frische Lockfile-Installation und Expo Doctor bestanden unabhängig davon.
- **Zwei frühere direkte Testaufrufe:** In `docs/qa/second-pass/` bleiben `living-regression-direct-invocation-failed.log` und `sqlite-regression-direct-invocation-failed.log` erhalten. Beim direkten Node-Aufruf fehlte der von npm gesetzte lokale Compilerpfad. Die korrekten npm-Aufrufe und später das finale Gesamtgate bestanden. Das waren Aufrufumgebungsfehler, keine verschwiegenen App-Datenfehler.
- **Saubere Quellenkopie:** Ein zunächst bereits erfolgreicher JS-Export wurde nach vollständigem Abgleich auch der nativen Modulquellen durch eine neue saubere Installation und einen neuen Export ersetzt. `clean-install-previous.log` und `metro-ios-export-previous.log` bewahren die vorherigen Erfolge. Anschließend wurde der finale Export nach den zwei beschriebenen reinen Leerzeichenkorrekturen wiederholt; `metro-ios-export-before-whitespace.*` hält den vorigen Stand fest.
- **Nicht fehlschlagende Umgebungswarnungen:** npm meldet die vom Host gesetzte `http-proxy`-Konfiguration; Metro meldet teils `NO_COLOR`/`FORCE_COLOR`. Diese Warnungen werden im Originalprotokoll erhalten. Sie sind keine ESLint-Warnungen und führten nicht zum Fehlschlagen der genannten erfolgreichen Gates.
- **Patch-Whitespace aus Originalbelegen:** Der vollständige Upgrade-Patch enthält bytegetreu übernommene OFL-Lizenzen, die originale FORM-10-Spezifikation und ein altes First-Pass-Typecheck-Log mit Leerzeichen/CRLF. `git apply` meldet diese, endet aber erfolgreich. Beide Git-Bäume und alle Dateihashes stimmen überein. Der in der Upgrade-Anleitung angegebene Whitespace-Check nimmt nur diese unverändert erhaltenen Originaldateien aus und besteht; Runtime-, Build-, Test- und neue Dokumentationsdateien werden nicht pauschal ausgenommen.

## 8. Noch offene native Abnahme

| Bereich | Erforderlicher realer Nachweis | Status / Grund |
| --- | --- | --- |
| Native Kompilierung | Pods installieren; Swift-/Objective-C-/C++-Quellen und Asset Catalogs mit passendem Xcode kompilieren | Offen: Linux ohne `pod`, `swift`, `xcodebuild`, `xcrun` |
| Unsigned IPA | Tatsächliche iphoneos-App, Releasebundle, korrekte Identität/Build, erlaubte Entitlements, ZIP-Integrität und SHA-256 | Offen; keine IPA erzeugt |
| HealthKit-Signierung | Passendes Profil/Team/Entitlement, Archiv und Export, tatsächliche Codesign-Prüfung | Offen; keine passenden Signierdaten oder macOS-Ausführung |
| Widget-Signierung | App und Extension mit tatsächlich passenden App-Group-/Profil-/Bundle-ID-Zuordnungen archivieren/exportieren | Offener Build-Baustein; vorhandene Releasepfade deaktivieren Widgets |
| Bestehende Installation | Altes Backup, kompatible Überinstallation ohne Deinstallation; alte Gewichte/Pläne/Trainings/Fotos/aktive Session vergleichen | Offen; synthetische Migration ersetzt das Gerät nicht |
| Vollständiger Trainingsfluss | Plan öffnen, anderen Tag verschieben, 3 Zielzeilen, Vorwerte, Undo, Extra-Wdh./Satz, Sperren/Hintergrund, Resume, Finish/Receipt, Backup/Restore | Domain-/Storage-Szenario bestanden; native Bedienabnahme offen |
| Kleines und großes iPhone | Tastatur, min. Touchflächen, große Schrift, Links-/Rechtshand, Dark/Paper, Überläufe | Quellen-/Layoutregeln geprüft; reale Darstellung offen |
| VoiceOver | Fokusfolge, Labels, Werte, Navigation, Diagrammalternative, funktionale Meldungen ohne Dekoration | Offen; keine echte VoiceOver-Sitzung |
| Motion | Hauptflows filmen, schnelle Navigation, mehrfache Taps, Reduce Motion/Off, Hintergrund/Unmount und Framerate auf Gerät | Adapter-Lifecycle bestanden; native Sicht-/Leistungsprüfung offen |
| App-Icons | Kompilierte Alternates, tatsächlicher UIKit-Wechsel, Fehler/Abbruch und Readback | Generierte Kataloge/Adapter geprüft; Gerät offen |
| KeepAwake/Notifications | Sperrverhalten und Freigabe bei Pause/Tabwechsel/Finish; reale Zustellung, Cancel, Undo, Duplikate | Adapter/Races geprüft; Systemwirkung offen |
| Private Medien/Backups | Tatsächliche Backup-Exclusion, Dateischutz bei Gerätesperre, Image-Manipulator-/EXIF-Wirkung, System-Share-Cleanup | Quell-/Datei-/Adapterprüfungen bestanden; native Wirkung offen |
| Verschlüsselter Export | Apple-Kryptografie kompilieren; Passwortfehler, Manipulation, Export und Restore auf Gerät | Vorhandene geprüfte Konstruktion/Contracts; Apple-Testskript hier nicht ausführbar |
| YAZIO → Health → FORM | Tatsächlich vorhandene Samples, Berechtigung/verweigert/leer, Herkunft, Korrektur/Löschung, 7/30/90-Tage-Zeitraum und Zeitzone | JS-/Adapter-/SQLite-Pfade bestanden; echter Roundtrip offen |
| Eigene Health-Exporte | Ausdrücklich gewähltes abgeschlossenes Workout, genau eigener Samplebezug, Korrektur/Löschung ohne Schleifen | Adapter/dauerhafte Queue geprüft; native Wirkung offen |

Die vorbereitete Simulator-Smoke-Action erstellt, wenn sie erfolgreich läuft, einen tatsächlichen Fresh-Install-Starttest und Screenshot. Sie ist nicht mit der hier noch offenen Überinstallation des persönlichen Altbestands oder dem vollständigen Trainingsszenario gleichzusetzen.

## 9. Lieferschritt

Die vollständige ZIP enthält die Quellen, ursprünglichen Aufträge, Änderungs- und Datenberichte, Asset-Sheet, Lizenzen, diese Matrix und die echten Logs. Der binäre Upgrade-Patch wird auf einer isolierten Kopie des bekannten öffentlichen Commits angewendet und gegen jede finale getrackte Quelldatei verglichen. Ein gesonderter CRC-/Manifest-/SHA-256-Check prüft die fertige ZIP. Die konkreten Ergebnisse liegen in den Paketmanifesten; die SHA-256 der ZIP wird bei der Übergabe genannt.

Vor echter Überinstallation: eigenes Backup exportieren, alte App nicht deinstallieren, effektive Bundle-ID und kompatible Signierung beibehalten. Die Schrittfolge steht in `UPGRADE_EXISTING_REPO_SECOND_PASS.md` und `RELEASE_BUILD_15.md`.
