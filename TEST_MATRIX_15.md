# FORM 15.0.0 · Tatsächliche Prüfungen und offene Abnahme

Prüftag: 25.11.2026 (Europe/Berlin). Lokale Umgebung: Linux x86_64, Node v24.22.3, npm 11.19.1. Expo SDK 58, React Native 0.88.1, React 19.3.0, TypeScript 6.0.3. Exakte Werkzeugverfügbarkeit: `docs/qa/15/environment.json`.

**Statusbegriffe:** Implementiert bedeutet vorhandener Code. Lokal geprüft bedeutet tatsächlich ausgeführte Prüfung in der genannten Umgebung. iOS-JavaScript-Export ist kein Swift-Compile. Linux-Prebuild ist kein CocoaPods-/Xcode-Erfolg. In dieser Lieferung gibt es keinen behaupteten CI-, Simulator-, Geräte- oder YAZIO-Roundtrip-Erfolg.

## Baseline

Das innere FORM-10-Archiv wurde vor den Änderungen unverändert als Git-Sicherung `b5f7d88` / `form-10-supplied-baseline` abgelegt. Die Baseline wurde danach in einem getrennten Worktree geprüft. Die erste Prüfung ohne installierte Abhängigkeiten schlug erwartbar fehl; nach Installation liefen die vorhandenen Tests und der vollständige Typecheck erfolgreich.

| Prüfung | Befehl | Ergebnis | Log |
| --- | --- | --- | --- |
| Originale Regression im Baseline-Worktree | `npm run test:all` | PASS, Exit 0 | `baseline-tests-installed.log` |
| Originaler vollständiger Typecheck | `npm run typecheck` | PASS, Exit 0 | `baseline-typecheck-installed.log` |
| Erste Versuche ohne Dependencies | siehe Log | Fehlgeschlagen; dokumentierter Ausgangszustand | `baseline-tests.log`, `baseline-typecheck.log` |

Alle in Tabellen verkürzten Lognamen befinden sich unter `docs/qa/15/`.

## Gemeinsamer finaler Quellcode-Gate

Der maßgebliche Gesamtbefehl ist `npm run check`. Er ruft 26 Test-/Integritätskommandos und danach den vollständigen TypeScript- und ESLint-Check auf. **PASS, Exit 0, 44,07 Sekunden.** Ergebnis und Laufzeit sind in `final-check.log` und `local-validation.json` festgehalten. Ein früherer Integrationsversuch ist getrennt als `pre-final-check-failed.log` erhalten: Der neue CI-Workflow hatte die explizite frühe Quellenprüfung verloren; der Schritt wurde wieder eingebaut, die sinnvolle bestehende Assertion blieb unverändert. Eine weitere alte Wochenplan-Fixture enthielt ausschließlich unzugeordnete freie Platzhalter; für dieselbe unveränderte Kalender-Assertion verwendet sie jetzt eine echte zugewiesene Routine. Der Fehlerlauf bleibt unter `pre-final-adherence-failed.log` erhalten.

| Bereich | Einzelbefehl | Was geprüft wird |
| --- | --- | --- |
| Lieferbare Quellen | `npm run test:preflight` | Erforderliche Dateien und Git-Tracking; kein vergessenes lokales Swift-Modul |
| Imports / Syntax | `npm run test:syntax` | Quelldateien und tatsächliche Importpfade |
| Rechenlogik / Katalog / CSV | `test:logic`, `test:catalog`, `test:csv` | Zahlen, Datum, Suche, Filter, Validatoren und bisherige Importformate |
| Daten / Backups | `test:validation`, `test:storage`, `test:sqlite` | Gültige Formate, alte Daten, SQL-Beziehungen und Fehlerbehandlung |
| Historische Trainingsregression | `test:workout`, `test:advanced`, `test:form`, `test:deep`, `test:form84`, `test:living` | Vorwerte, Timer, Blöcke, Wiederöffnung, Korrekturen und Legacy-Verhalten |
| Installation / UI-Verträge | `test:fresh`, `test:redesign`, `test:native`, `test:compat` | Leere echte Erstinstallation, Quellen-/Build-/Berechtigungsverträge; keine native Bedienprüfung |
| Switch-Speichervertrag | `test:switch-contract` | 9 tatsächliche Callback-Pfade/Adapter mit `Promise<void>` bei unverändertem `Promise<boolean>`-Store |
| Neue Satzengine | `test:plan15` | Planstarts, Zeilen, Freigaben, Replay-Schutz, Momentaufnahmen, Altbestand, echte SQLite-Neustarts und Backups |
| Planverwaltung | `test:plan-management15` | JSON-Import/Export, Konflikte, sichere Kopien, Wochenbezug, geschützte und rohe Entwürfe |
| Ernährung | `test:nutrition15` | 66 Prüfungen mit expliziten Native-Mocks: Quellen, UUID, fehlende Werte, Löschungen, DST und Exportaufträge |
| Migration | `test:migration15` | Tatsächliche Version-10-SQLite-Fixture, Byte-Erhalt alter Payloads, Snapshot, zweiter Start, Crash/Rollback, große Datenmenge |
| Produktives Repository | `test:repository15` | Expo-Adapter auf echter SQLite, Bestands-/Erststartunterscheidung, serieller Commit, Retry und bestätigter Zeitpunkt |
| Fortschritt | `test:progress15` | 16 Prüfungen tatsächlicher Serien nach stabiler ID, Datum, geeigneter Metrik und Korrektur |
| Build-Konfiguration | `test:build15` | 39 Prüfungen zu Version, unveränderter Identität, isolierten Fähigkeiten, Lockfile und Shellsyntax |
| TypeScript / Lint | `npm run typecheck`, `npm run lint` | Vollständiges Projekt; semantische Defekte und doppelte JSX-Eigenschaften, keine Formatierungs-Scheingates |

Die neuen Tests verwenden synthetische Daten. Ältere sinnvolle Assertions wurden nicht entfernt. Eine Deep-Test-Compile-Liste nennt das nach Zyklusbereinigung nicht mehr transitiv ausgegebene Modul jetzt ausdrücklich (`pre-final-test-harness-failed.log`). Legacy-Workout-Fixtures wurden ausdrücklich als Legacy modelliert; andernfalls würden Tests des alten Verhaltens versehentlich neue Planregeln testen.

## Gefordertes End-to-end-Datenszenario

`tests/test-plan-workout15.cjs` prüft mit einer tatsächlichen SQLite-Datei:

1. Zwei bestehende Trainings und drei Gewichte bleiben unverändert; vorhandenes Onboarding bleibt abgeschlossen.
2. Ein eigener Plan erzeugt für eine Übung genau drei offene Zeilen mit Soll 3 Wiederholungen.
3. 3 und 2 Wiederholungen sind gültige tatsächliche Leistungen.
4. 4 Wiederholungen werden ohne Freigabe abgewiesen. Nach `+ Wdh.` sind 4 gültig, 5 weiter ungültig. Eine andere Zeile bleibt unverändert.
5. Ein vierter Satz entsteht ausdrücklich und doppelte Aktionen erzeugen keinen fünften Satz.
6. Zwei unterschiedliche Zeilenentwürfe und eine Zusatzfreigabe überstehen Schließen/Öffnen der SQLite-Datei und Backup-Roundtrip.
7. Abschluss speichert 3 geplante und 1 zusätzlichen Satz; der ursprüngliche Plan bleibt 3 × 3. Änderungen am gespeicherten Plan verändern keine bestehende Momentaufnahme.
8. Historische spontane Einheiten und höhere alte Wiederholungen bleiben erhalten; eine alte aktive Session lässt sich abschließen.
9. Bereiche, AMRAP, Zeit, Distanz, Warm-ups, Supersets, ausgelassene Sätze und Korrekturen verwenden ihre eigenen Regeln.
10. Ein neuer Satz nach pausierter Restzeit und das erneute Abschließen eines entfernten Zeit-/Distanz-Warm-up-Abschlusses sind als Regressionen enthalten.

`test:migration15` ergänzt den Start mit einem echten Schema-8-Bestand und dem originalen SQL-Schema. Repository-Tests prüfen die produktiven Aufrufe über einen SQLite-basierten Expo-Testadapter. **Das ist ein Domain-/Persistenz-Szenario, kein als ausgeführt ausgegebener iOS-Tap-/Sperrbildschirmtest.**

## Installation, Expo und tatsächliche Artefakterzeugung

| Prüfung | Befehl / Umgebung | Beobachtetes Ergebnis | Log / Grenze |
| --- | --- | --- | --- |
| Saubere Lockfile-Installation | `npm ci --no-audit --no-fund`, neuer isolierter Ordner | PASS, Exit 0; 589 Pakete | `npm-ci-clean.log`; kein Wiederverwenden der ersten `node_modules` |
| Expo-Abhängigkeiten | `npm exec --no -- expo install --check` | PASS, Exit 0 | `expo-dependencies-final.log` |
| Expo Doctor | `npm run doctor` | PASS, 20/20, Exit 0 | `expo-doctor-final.log` |
| Öffentliche Expo-Konfiguration | `expo config --type public` | Standard-/optionale Konfigurationen ausgewertet | In Prebuild-/Build-Testlogs; genaue effektive Plists zusätzlich geprüft |
| Standard-Prebuild | `FORM_HEALTHKIT=0 FORM_WIDGETS=0 expo prebuild --platform ios --clean --no-install`, isolierte Kopie | PASS, Exit 0; generierte Entitlements exakt `{}` | `expo-prebuild-standard-final.log`; keine Pods/Xcode |
| HealthKit-Prebuild | `FORM_HEALTHKIT=1 FORM_WIDGETS=0 expo prebuild --platform ios --clean --no-install` | PASS, Exit 0; ausschließlich `com.apple.developer.healthkit: true` | `expo-prebuild-healthkit-final.log`; Usage Descriptions vorhanden, keine Widgets/App Groups |
| Lokales natives Modul | Expo-Autolinking für iOS | PASS; `form-health`/`FormHealthModule` aufgelöst | `native-autolinking.log`; Auflösung ist kein Swift-Compile |
| Tatsächlicher iOS-JavaScript-Export | `expo export --platform ios`, eigene sauber installierte Kopie | Metro-/Hermes-Bundle und lokale Assets erzeugt | `ios-metro-export-final.log`; keine lauffähige IPA daraus behauptet |
| Eigene SVGs | `node scripts/export-doodles.cjs`, Inkscape-Rendering | 12 Pfad-Assets und Atlas gerendert und angesehen | Assetatlas; kein nativer App-Screenshot |
| Farbkontrast | sRGB-Luminanzrechnung für 10 tatsächliche Tokenpaare | 10/10 mindestens 4,5:1 | `palette-contrast.json`; keine vollständige native Accessibility-Abnahme |
| Quellen-ZIP | ZIP-CRC, Dateihashes und Paketprüfung | Im abschließenden `package-verification.json` | Keine `node_modules`, persönlichen Backups oder Signierschlüssel |

## Reproduzierbarer Lasttest

`test:migration15` erzeugt 10.000 Sätze und 2.000 Gewichte. In `migration15.log` sind die jeweilige Bulkzeit, Dauer einer einzelnen Zeilenänderung, SQL-Schreibanzahl und Payload-Serialisierungen protokolliert. Der fokussierte Lauf maß 714 ms Bulk und 6,64 ms für einen Entwurf bei 2 SQL-Schreiboperationen und 3 Payload-Serialisierungen. Wiederholungen können andere Zeiten ergeben; der finale Gesamtlog enthält seinen eigenen Messwert. Kein Wert ist eine iPhone- oder FPS-Messung.

## Noch nicht ausgeführt / durch Umgebung blockiert

| Gate | Warum offen | Konkrete Abnahme |
| --- | --- | --- |
| CI-Lauf der neuen Quellen | Repo-Abgleich erfolgt; neue Quellen wurden nicht in entfernte Repositories geschrieben und kein FORM-15-CI-Lauf ausgeführt | Gelieferten Upgrade-Stand im gewünschten Repository integrieren und macOS-Workflow ausführen |
| CocoaPods, Apple-Backup-Kryptografie, Xcode-Compile | Linux; kein `pod`, `swift`, `xcodebuild` oder `xcrun` | Gelieferten macOS-Workflow ausführen; echte Logs/IPA/Hash aufbewahren |
| Signierte HealthKit-IPA | Kein Apple-Profil/Zertifikat und kein macOS | Passendes Profil für bestehende Identität, tatsächliche Signatur und Installation prüfen |
| Optionaler Widget-Build | Keine native Widget-/App-Group-Signierung ausgeführt | Zusätzliches Extension-/App-Group-Profil und gesonderte native Abnahme erforderlich |
| Screenshots vorher/nachher und Animationsclip | Kein iOS-Simulator oder iPhone verfügbar | Heute, Plan, Satzzeile, Pause, Abschluss, Fortschritt, Ernährung, Werkstatt aufnehmen |
| Kleines/aktuelles iPhone | Kein Gerät verfügbar | SE-Größe, Dynamic Type, Dark Mode, VoiceOver, Keyboard, Reduce Motion, Touchflächen |
| Echter Upgrade-/Restart-Test | Kein bestehender Gerätecontainer verfügbar | Gleiche effektive Identität; Altdaten, aktive Session, bestätigter Save, Force Quit, Sperre, Airplane Mode |
| Lokale Timerbenachrichtigungen | Native Zustellung nicht auf Linux ausführbar | Pausieren, ±15 s, Skip, Finish/Discard, Hintergrund und Berechtigungsverweigerung |
| YAZIO → Health → FORM | Kein echtes YAZIO-/Health-Gerät verfügbar | Tatsächliche Werte je Typ, Quelle, UUID, Datum, Rechte und Löschungen |
| FORM → Health → YAZIO | Kein signiertes Gerät verfügbar | Explizites Gewicht/Workout, aktive Dauer, Retry nach Exportabsturz, Korrekturen, keine Duplikate |

Die Source-Lieferung ist anhand dieser klar getrennten Status zu beurteilen. Weder ein grüner Unit-Test noch ein erzeugtes natives Projekt ersetzt die offenen Build- und Geräte-Gates.
