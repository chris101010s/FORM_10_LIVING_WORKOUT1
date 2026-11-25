# Second-Pass-Abschluss · Health, native Funktionen, Suche und Build

Stand: 25.11.2026, Marketingversion 15.0.0, technischer Build **150001**. Die Phase-A-Befunde bleiben unverändert in `docs/second-pass-audit-health-native.md`. Diese Datei beschreibt die tatsächlichen Ergänzungen nach GO und dient der gemeinsamen Release-Matrix.

## Umgesetzt und lokal geprüft

| Auditbereich | Tatsächliche Umsetzung |
| --- | --- |
| H03–H08 Autosync, Bestätigung, Historie | Gemeinsamer `NutritionSyncCoordinator`, Focus-/optionaler Foreground-Trigger, 350-ms-Debounce, fünf Minuten Frische, Warteschlange, manueller Refresh, Abbruch und erneutes Foreground. Lesen des ausschließlich bestätigten Repository-Zustands; jeder Chunk und Abschluss bestätigt. UI 1/7/30/90 Tage, native Chunks und sichtbare Seiten mit maximal sieben Tagen. Fehler/Teilabdeckung/letzter Stand in Ernährung und Hub. |
| H09–H12 Quellen, fehlende Werte, Ziele | Bestehende UUID-Reconciliation bleibt erhalten und ist erneut getestet. Pro Datentyp/Fenster Abdeckung; fehlende Werte unbekannt, echte Null erhalten; Quelle ausdrücklich wählbar, manuelle Logs getrennt. Leere freiwillige FORM-Ziele, keine erfundene YAZIO-Ziel-API. |
| H13 Watch-/Tagesherkunft | Neuer `FormHealthDayBridge` mit tatsächlichen UUIDs, sourceRevision und optional Gerätekennung. UI wählt pro Datentyp genau eine Quelle. Gewicht letzte Messung, Puls Sample-Mittel, Schlaf Intervallvereinigung. `healthOrigin` im selben lokalen Datensatz. |
| H14–H17 Exporte, Korrektur, Löschung | Bestätigte lokale Auswahl, persistierter pending-/deletePending-Auftrag vor Native-Aufruf, eigene Quelle + Sync-ID/Version/Fingerprint/UUID. Exportliste paginiert, auch nach lokaler Eintragslöschung erreichbar. Idempotenter Löschbeleg/Tombstone, Neu-Export mit höherer Version; Schreib-/Löschaktionen derselben Identität zentral serialisiert. Keine Ernährungsschreibfunktion, kein Loop importierter Gewichte. |
| N01–N02 Suche | Eigene FlatList, ausschließlich lokale Katalog-/Plan-/Workout-/Einstellungsdaten, tatsächliche Detail-IDs, keine Startaktion. Favoriten, zuletzt verwendet, Geräte-/Muskelfilter, debouncte Suche ohne anklickbare veraltete Treffer. Optionaler lokaler Verlauf max20, Backup-/Validatorintegration. Root verbindet die tatsächlichen Stack-Details. |
| N03–N04 Widgets / Activities | Nächster konkreter offener Pflichttermin; fremde Session erledigt den Termin nicht. Wochenfortschritt aus `weekOverview`/Occurrences, Doppelzählung ausgeschlossen. Native SwiftUI-Zeitdarstellung aus Start-/Pausen-/Rest-Endzeitstempeln; Sessionzuordnung und Ende verwaister/abgeschlossener Instanzen. Ehrliche Capability-/Fehler-/Retryansicht. |
| Notifications | Bestätigte Daten, Session-/Timer-ID, vollständiger Fingerprint, serialisierte Native-Abstimmung. Alte/doppelte Zeitpläne entfernen, Undo/Skip/Pause/Finish berücksichtigen, fremde IDs erhalten. Verlorene Bestätigung, Stornofehler, Rennen und Systemuhr-Rücksprung getestet. Zustellung ist separat nativ offen. |
| KeepAwake | SDK58-kompatibles Modul, ausdrückliches Opt-in, nur aktives/fokussiertes/unpausiertes bestätigtes Training; sofortige Freigabe auch bei lokal angefordertem Finish/Pause. Eigener Tag pro Instanz verhindert Remount-Rennen. Serialisierte Aktivierung/Deaktivierung und Unmount geprüft. |
| Icons | Ink als Hauptsymbol, echtes Asset-Catalog-Plugin für Paper/Blueprint/Retro. Build150001 in Info.plist und App-Target. Native UIKit-Verfügbarkeit, Varianten aus dem installierten Bundle, Callback plus Readback vor lokalem Speichern. Backupwunsch führt nicht zu automatischer OS-Änderung. |
| Privater Speicher | Festes ApplicationSupport/FORMPrivate, Backup-Ausschluss und FileProtection mit Rücklesebericht; kein beliebiger Pfadinput. Die tatsächliche iOS-Schutzwirkung bleibt ein Gerätetest. |

Die Dekorationen `connection`, `waterGlass`, `heart`, `searchNone` und die zugeordneten zentralen Motion-/Copy-Ereignisse sind an wirkliche Zustände gebunden. `connectionConfirmed` wird erst beim ersten bestätigten Import echter Samples gespeichert, nicht durch den Autorisierungsdialog. Alte redundante Hell-/Dunkel-Buttons wurden aus `NativeSettings` entfernt; die zentrale Darstellung bleibt bei `AppearanceSettings`. Historische Einstellungen wurden nicht gelöscht.

## Ausgeführte Gates

| Befehl / Nachweis | Ergebnis | Protokoll |
| --- | --- | --- |
| `npm run test:health-second` | PASS172, Exit0 | `docs/qa/15-second/health-second.log` |
| `npm run test:native-second` | PASS97, Exit0 | `docs/qa/15-second/native-second.log` |
| `npm run test:search-second` | PASS49, Exit0 | `docs/qa/15-second/search-second.log` |
| `npm run test:second-pass-data` | PASS276 Daten-Assertions und PASS66 separate Export-Assertions, Exit0 | `docs/qa/second-pass/data-persistence.log` |
| `npm run typecheck` | Exit0 | `docs/qa/15-second/health-native-typecheck.log` |
| `npm run lint` | Exit0 | `docs/qa/15-second/health-native-lint.log` |
| Legacy Nutrition / Native / Build / Switch | PASS66 / PASS59 / PASS46 / PASS7 | Tool-Ausführung; vollständiger globaler Check wird zusätzlich von Root protokolliert |
| `npm run doctor` | 20/20, Exit0 | `docs/qa/15-second/expo-doctor.log` |
| Standard-Prebuild und Readback | Exit0; tatsächliches generiertes Projekt | `prebuild-standard.log`, `prebuild-standard-verification.json` |
| Optionaler HealthKit-Prebuild und Readback | Exit0; tatsächliches generiertes Projekt | `prebuild-health.log`, `prebuild-health-verification.json` |
| `expo install --check`, online | Zwei Versuche Exit1 wegen HTTP-Proxy-Timeout | `expo-dependencies.log`, `expo-dependencies-retry.log` |
| `EXPO_OFFLINE=1 expo install --check` | Exit0, ausdrücklich mit Offline-Warnung | `expo-dependencies-offline.log` |
| Direkter SDK58-Kompatibilitätsvergleich | Neue Pakete und unverändertes React/RN erfüllen installierte `expo/bundledNativeModules.json`-Ranges | `sdk-dependency-readback.json` |

Der Offline-Abgleich wird nicht als erfolgreicher Zugriff auf Expos Online-Versionsdienst bezeichnet. Das SDK wurde nicht gewechselt. Root führt eine unabhängige saubere `npm ci`-Installation, den vollständigen gemeinsamen Check und den finalen iOS-Metro-Export nach Runtime-Freeze aus.

Der finale Datenlauf ist in `docs/qa/second-pass/data-persistence.log` mit **276 Daten-Assertions**, **66 zusätzlichen `shareTextExport`-Adapterprüfungen** und **Exit0** belegt. Die gemeinsam verwendete Fixture `tests/fixtures/second-pass-workout.cjs` enthält **22 tatsächliche Fachaktionen**; der Datenlauf führt diese über den echten Provider-/Repository-Code aus und öffnet nach jeder Aktion die SQLite-Datei neu. Vor Undo erfolgt zusätzlich ein vollständiger Repository-/Provider-Neustart. Die 22 Aktionen sind Bestandteil des geprüften Szenarios und keine weitere separat gezählte Assertionsumme.

Die neuen Health-Metadaten werden zusätzlich durch SQL-Fehler, Retry, echten Repository-Neustart und portablen Medien-/JSON-Backup-Roundtrip geprüft; Quellen-, Geräte- und Sample-Identitäten bleiben aus Diagnosen ausgeschlossen. Die separate Export-Suite prüft bestätigtes Schreiben und Rücklesen vor dem Teilen, eindeutige gleichzeitige Dateien sowie Bereinigung und sichtbare Fehler bei Abbruch, Sharing-, Schreib-, Lese- oder Löschfehlern. Die React-/Expo-Adapter sind kontrollierte Testadapter; SQLite-Dateien, Mediendateien und SHA-256 sind echt. Diese Nachweise ersetzen weder einen nativen Systemdialog noch die iOS-Dateischutz-/Kryptoabnahme.

## Native und externe Grenzen

`native-environment.json` dokumentiert Linux und das tatsächliche Fehlen von `xcodebuild`, `xcrun`, `swift` und `pod`. Kein Swift-Compile, keine IPA, kein IPA-SHA, kein iPhone-Screenshot, keine installierte Symbolumschaltung, kein zugestellter Resthinweis und kein YAZIO-Roundtrip werden behauptet.

Standard-Prebuild: **leere Entitlements**, kein HealthKit, keine App Group, keine Widget-Extension, keine Live-Activity-Freigabe. Optional Health: **nur HealthKit**, beide Usage Descriptions, Widgets aus. Die tatsächlichen Icon-Pixel/Kataloge und Debug-/Release-Buildsettings wurden überprüft. Kompilierte Alternate-Icon-Metadaten werden erst im echten Xcode-Lauf durch `scripts/verify-ios-presentation.cjs` geprüft.

Die vorhandenen signierten Scripts unterstützen HealthKit bei `FORM_WIDGETS=0`. Ein getesteter Multi-Target-Widget-Signierpfad mit echten App-/Extension-Profilen bleibt ausdrücklich offen. Hinweise und vollständige Update-Anleitung stehen in `RELEASE_BUILD_15.md`. Vor Überinstallation Backup exportieren; bestehende App nicht deinstallieren und kompatible Identität/Signierung beibehalten.

## Quellen für die gemeinsame Release-Antwort

Offizielle Seiten und die begrenzten tatsächlich belegten Aussagen stehen in `YAZIO_INTEGRATION.md`. Wesentlich sind YAZIOs Apple-Health-Anbieter-/Datentyp-Hilfe, Apples Leserechte-Privatsphäre und eigene Sample-Löschung sowie Apples Xcode-/UIKit-Dokumentation für alternative Icons. Keine Quelle garantiert native Funktion in dieser nicht ausgeführten Signier-/Gerätekombination.
