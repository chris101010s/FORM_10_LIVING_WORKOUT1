<div align="center">

# FORM · The Living Sketchbook

**A personal training companion, built with intention.**

iOS · React Native · Expo · Training · Progress · Personal data

[![Project](https://img.shields.io/badge/PROJECT-FORM_15-18181b?style=for-the-badge)](https://github.com/chris101010s/FORM_10_LIVING_WORKOUT1)
![Status](https://img.shields.io/badge/STATUS-Development-f59e0b?style=for-the-badge)
![Platform](https://img.shields.io/badge/PLATFORM-iOS-2563eb?style=for-the-badge)

</div>

---

> [!IMPORTANT]
> **Current FORM development line.** The source code is available here, but a verified, installable iPhone release has **not** been confirmed. See the release report and test matrix for the actual build status.

### Explore FORM

| Area | What you'll find |
| :--- | :--- |
| **Today** | Daily overview and planning |
| **Plan** | Structured workouts and plan versions |
| **Training** | Workout experience and controls |
| **Progress** | Training history and analysis |
| **Health** | Personal health-related views |

**Documentation:** [Release report](RELEASE_REPORT_15_SECOND_PASS.md) · [Test matrix](TEST_MATRIX_15_SECOND_PASS.md) · [Build guide](RELEASE_BUILD_15.md)

**Earlier public milestones:** [FORM 8.4](https://github.com/chris101010s/ATHLETE_OS_8_4_FORM_FRESH_START) · [FORM 8.1](https://github.com/chris101010s/ATHLETE_OS_8_1_FORM_FRESH)

<details>
<summary><strong>Full technical documentation and release notes</strong></summary>

# FORM 15.0.0 · The Living Sketchbook

Zweiter Durchgang auf dem vollständig erhaltenen ersten FORM-15-Stand, **Build 150004**. Weiterentwicklung der vorhandenen FORM-10-App, kein neues Beispielprojekt. Fünf Tabs: **Heute · Plan · Training · Fortschritt · Gesundheit**.

Der Quellcode enthält individuelle Sollzeilen, Planversionen, bewusst erlaubte Extras, atomisches Undo, private Medien und geprüfte Sicherungen. Die eigene Produktwelt umfasst 48 kanonische Motive, 16 Pip-Posen, zehn neutrale Kategorien, eigene Tabs, ein festes Ink-App-Symbol und ein ereignisgebundenes Motion-/Textsystem. Neue Analyse- und Suchansichten verwenden vorhandene Daten.

**Lieferstatus und genaue Nachweise:** `RELEASE_REPORT_15_SECOND_PASS.md` und `TEST_MATRIX_15_SECOND_PASS.md`. Es wird keine verifizierte IPA behauptet. CocoaPods/Xcode, echtes iPhone-Upgrade, native Bedienung und YAZIO-Roundtrip sind getrennte offene Gates. Die originalen Berichte des ersten Durchgangs bleiben als historische Belege erhalten.

## Build 150004: Zeichnungen und sichtbare Bewegung

Fünf eigene Schreibtisch-/Papierillustrationen ergänzen Heute, Plan, Training, Gesundheit und Einrichtung. Kleine Sticker bewegen sich beim Erscheinen kurz; Buttons, Auswahlchips und Bereichszeilen reagieren beim Drücken. Szenen gleiten sichtbar ein. Die vorhandene optionale Figur bleibt an ihre Einstellung gebunden. Bewegung wird bei „Aus“, systemweitem „Bewegung reduzieren“ und im Hintergrund unterbunden; keine Endlosschleife und keine Leistungsbestätigung aus einer Animation.

Der bisherige Erststartfehler der Animationen ist behoben: Die erste Szene verbraucht ihren Abspielzustand nicht mehr, solange die iOS-Bewegungseinstellung noch unbekannt ist. Ein eigener Lifecycle-Test weist die Regression, das Abbrechen und den ausbleibenden Erfolgs-Replay nach. Die Startabsturzkorrektur und die drei verpflichtenden Start-/Datenprüfungen bleiben erhalten. Der native Home-Start kann zusätzlich als optionales Video im Startcheck-Artifact geprüft werden.

## Reparatur Build 150003: Startabsturz

Der Release-Starttest hat den unmittelbaren Abbruch beim Vorbereiten privater Dateien reproduziert: `import('react-native')` wertete auch den optionalen `PushNotificationIOS`-Export aus und löste `NativeEventEmitter(null)` aus. Der Dateiadapter lädt jetzt nur die benötigten Modulzugriffe, weiterhin erst bei Bedarf. Die bestehenden Datenpfade, Datenbank, Migration und Backup-Inhalte werden dafür nicht verändert.

Der Regressionstest verwendet Metros tatsächliche Import-Laufzeit und prüft den fehlerhaften bisherigen Import gegen die Korrektur. Vor einer Standard-IPA sind drei echte Release-Starts mit frischen Daten sowie zwei synthetischen FORM10-Beständen erforderlich. Der Startnachweis wird vor dem iPhone-Build hochgeladen. Die Simulatorwahl verwendet ein tatsächlich vorhandenes nummeriertes iPhone mit allgemeiner iOS-Runtime. Einzelheiten und Grenzen stehen in `REPAIR_STARTUP_150003.md`.

## Reparatur Build 150002: festes App-Symbol

Die App-Icon-Wechselfunktion wurde auf ausdrücklichen Nutzerwunsch vollständig entfernt: keine Auswahl, Suchroute, native Setter oder alternativen Asset-Kataloge. Ink bleibt das feste App-Symbol. `plugins/withBuildVersion.js` erhält die korrekte native Buildnummer; der IPA-Prüfer kontrolliert weiterhin Identität, primäres Icon und reale Bundle-Assets. Die bestehenden Theme-Einstellungen bleiben verfügbar. Historische `settings.appIcon`-Werte bleiben ausschließlich zur verlustfreien Backup-Kompatibilität erhalten und lösen keine Aktion aus.

Die Python/Pillow-Einrichtung des bestehenden Standard-Workflows bleibt erhalten und ist auch im optionalen HealthKit-Workflow vorhanden. Die Second-Pass-Berichte zu Build 150001 dokumentieren den vorherigen Stand; die gezielte Reparatur steht in `REPAIR_FIXED_ICON_150002.md`.

## Bestehende App und Daten behalten

- Bundle-ID `app.athleteos.personal`, Scheme `athleteos` und SQLite `form-v84-clean.db` bleiben gleich.
- SQL-Schema bleibt in dieser Runde 9; JSON-Datenschema bleibt 4. Die erste Runde migrierte Version 10 additiv von SQL 8 auf 9. Neue optionale Daten passen in die vorhandenen Entity-/Singleton-Strukturen.
- Bestehende Pläne, höhere historische Satzwerte, Gewichte, Fotos, aktive Session und Entwürfe werden nicht automatisch zurückgesetzt. Keine neue Pflicht-Einrichtung für eingerichtete Bestände.
- Neue Trainings starten ausschließlich aus einem gespeicherten Plan. Eine bereits aktive alte freie Session und historische spontane Einheiten bleiben zugänglich.
- Vor Überinstallation ein eigenes Backup aus der alten App exportieren. Alte App **nicht deinstallieren**. Effektive Bundle-ID und Signierung müssen zum vorhandenen Container passen; die ID allein garantiert keine Datenübernahme.

## Reproduzierbare Entwicklung

Node 24.22.3 und npm 11.19.1 wurden verwendet. Expo SDK 58 / React Native 0.88.1 bleiben erhalten. Neue Expo-Pakete sind an diese SDK-Zuordnung gebunden; Lockfile mitliefern.

```bash
npm ci --no-audit --no-fund
npm run check
npm run doctor
npm exec --no -- expo install --check
npm start
```

Die vorhandenen und neuen Tests laufen über `test:all`, danach vollständiger TypeScript-Check und ESLint. Das Repository enthält vorbereitete Standard- und getrennte HealthKit-Buildpfade ohne EAS-Pflicht. Ein IPA-Erfolg ist erst mit einer tatsächlich erzeugten und geprüften Datei belegt.

## Unterlagen des zweiten Durchgangs

| Dokument | Inhalt |
| --- | --- |
| `SECOND_PASS_AUDIT.md` | Gesicherter Vorherstand und Nachherregister beider Aufträge |
| `CHANGESET_15_SECOND_PASS.md` | Konkrete Dateien und resultierendes Verhalten |
| `DATA_MIGRATION.md` / `BACKUP_AND_RECOVERY.md` | Commitpipeline, Migration, private Medien, Rotation und Grenzen |
| `DESIGN_SYSTEM_15.md` / `CHARACTER_BIBLE.md` | Implementierte Gestaltung und 16 eigene Posen |
| `ASSET_MANIFEST.md` / `ASSET_LICENSES_15.md` | Echte Assets, Integration, Hashes, Herkunft und OFL |
| `MOTION_CATALOG.md` / `COPY_GUIDE.md` | Reale Auslöser, Lebenszyklus und vollständiger Textbestand |
| `YAZIO_INTEGRATION.md` | Tatsächliche Health-Datenwege, Quellen und Signierung |
| `REMOVED_FEATURES.md` | Reduzierte UI und weiter erreichbarer Altbestand |
| `TEST_MATRIX_15_SECOND_PASS.md` | Befehle, Ergebnisse, Logs und Prüfebene |
| `RELEASE_REPORT_15_SECOND_PASS.md` | Abnahmestand und offene native Gates |
| `RELEASE_BUILD_15.md` | Bestehendes GitHub-Repo aktualisieren, CI und Überinstallation |
| `UPGRADE_EXISTING_REPO_SECOND_PASS.md` | Geprüfter Patch gegen bekannte öffentliche Basis; keine blinde Überschreibung |
| `docs/FORM_15_SPECIFICATION.md` / `docs/FORM_15_SECOND_PASS_SPECIFICATION.md` | Beide verbindlichen Aufträge |

Neue echte Logs liegen in `docs/qa/15-second/` und `docs/qa/second-pass/`. `docs/qa/15/` belegt den ersten Durchgang. Die gerenderte Assetübersicht in `docs/design/` ist kein iPhone-Screenshot. Persönliche Backups, Signierzertifikate, node_modules und generierte native Buildverzeichnisse gehören nicht in diese Source-ZIP.


</details>
