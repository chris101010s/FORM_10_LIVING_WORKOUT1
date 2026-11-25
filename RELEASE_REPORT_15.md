# FORM 15.0.0 · Abschlussbericht zum ersten Auftrag

Stand: **25.11.2026**, Build **150000**. Dies ist der abgeschlossene Quellcode-Stand des ursprünglichen FORM-15-Master-Prompts, vor der zusätzlich beauftragten zweiten Runde. Der Second Pass wird auf diesem gesicherten Stand aufgebaut.

## Ergebnis und Freigabegrenze

Die bestehende FORM-10-App wurde tatsächlich weiterentwickelt. Planstarts, feste Sollzeilen, ausdrückliche Zusatzfreigaben, persistente Entwürfe, additive Migration, reduzierter Aufbau, eigene Illustrationen und die optionale echte HealthKit-Schnittstelle sind im Quellcode implementiert. Der vollständige lokale Gesamtgate ist erfolgreich: **26 Test-/Integritätskommandos, TypeScript und ESLint, Exit 0**.

Ein echter iOS-Metro-/Hermes-Export, beide Expo-Prebuild-Konfigurationen und das native Autolinking wurden ausgeführt. **Eine installierbare IPA, ein Swift-/Xcode-Compile, native App-Screenshots und ein echter YAZIO-Roundtrip liegen nicht vor.** Die Source-Lieferung ist deshalb kein als gerätegeprüft ausgegebener App-Release. Die unten genannten nativen Gates bleiben offen.

## Unveränderte technische Identität

| Merkmal | Wert |
| --- | --- |
| App-Version | 15.0.0 |
| Interne Buildnummer | 150000 |
| Bundle-ID | `app.athleteos.personal` |
| Scheme | `athleteos` |
| SQLite-Datei | `form-v84-clean.db` |
| Datenbankmigration | additiv 8 → 9 |
| JSON-Nutzdaten-/Backupformat | weiterhin 4 mit ergänzenden Release-Metadaten |
| Expo / React Native / React | 58 / 0.88.1 / 19.3.0 |

Kein neues Projekt, keine automatische Alt-Daten-Wiederbelebung und kein Reset bei Ladefehlern. Ein Bestandsnutzer bleibt eingerichtet. Die reale Überinstallation hängt zusätzlich von passender effektiver Signierung und dem Gerätecontainer ab; gleiche Bundle-ID allein ist kein Übernahmebeweis.

## GitHub und gesicherte Basis

Das gelieferte innere FORM-10-Hotfix-Archiv wurde vor Änderungen als `b5f7d88` / `form-10-supplied-baseline` gesichert. Während des Abschlusses wurde GitHub-Zugriff verfügbar und der ursprüngliche Auftrag zum Repository-Abgleich nachgeholt.

- Öffentlicher aktueller Stand: [FORM_10_LIVING_WORKOUT1](https://github.com/chris101010s/FORM_10_LIVING_WORKOUT1), `main`, Commit `e0066a240400d6c38480b9a0de4e119a8a50e5bb`, „Update1“ vom 24.11.2026. Sämtliche App-, Test- und Buildquellen stimmen mit der gelieferten Hotfix-Basis überein. Unterschiede betreffen `.gitattributes`, Zeilenenden des alten Auftrags und einen ergänzenden Berichtabschnitt.
- Das ebenfalls zugängliche Repository `FORM_10_LIVING_WORKOUT` hat noch die früheren Switch-Callbacks und keinen `test-switch-contract.cjs`. Seine Daten-/Enginequellen enthalten keine zusätzlich gefundenen neueren Fixes. Die gelieferte Hotfix-Basis ist für diese Korrektur weiter.
- Es wurden keine entfernten Dateien überschrieben, keine Branches gepusht und keine PRs erstellt. Der aktuelle Code liegt als überprüfbares vollständiges Paket und Upgrade-Patch vor.

Details: `docs/qa/15/github-public-comparison.json` und `github-private-comparison.json`. Ein bestehendes eigenes Repository sollte einschließlich seiner Historie erhalten und auf einem Upgrade-Branch aktualisiert werden.

## Wesentliche geprüfte Verhaltensänderungen

**Datenerhalt:** Schema-8-Bestand in echter SQLite geöffnet; alte Roh-Payloads, IDs, Werte, Beziehungen und unbekannte Erweiterungen erhalten. Vor Migration konsistente Sicherung im Bestand und getrennten KV-Speicher. Wiederholung, Crash-Rollback, beschädigte/missing Datenbank, Wiederöffnung und Backup-Roundtrip sind geprüft. Einzelne Entwürfe lösen inkrementelle SQL-Writes aus.

**Plan und Sätze:** Neue Session nur aus zugewiesenem Plan-Tag mit gültigem Soll. Start erzeugt die geplante Zeilenanzahl, keine Leistung. Das geforderte 3×3-Szenario akzeptiert 3 und 2 Wiederholungen, weist 4 vor Freigabe ab und akzeptiert sie nach `+ Wdh.`. Ein Extrasatz entsteht bewusst; Doppelaktionen erzeugen keine Duplikate. Momentaufnahme, unterschiedliche Entwürfe, Extras und alte höhere Werte bleiben erhalten.

**Laufendes Training:** Eine Übung im Fokus, zeitstempelbasierte Uhren, tatsächlicher Speicherstatus, bewusste Pause/Weiter/Skip und Review mit fehlenden Sätzen. Erfolgshaken und Abschlusszettel kommen nach Speicherbestätigung. Neue Regressionen sichern Satzabschluss nach pausiertem Resttimer und erneuten Abschluss eines Zeit-/Distanz-Warm-ups.

**Ernährung:** Tatsächliche Swift-Abfragen für Energie, Protein, Kohlenhydrate, Fett und optional Wasser; UUID und Originalquelle, kontrollierter Fensterabgleich, keine doppelte Quellenaddition. Expliziter Export von Gewicht/Workouts mit persistentem Auftrag und Sync-Version. 66 Mock-/Domainprüfungen bestanden; native Ausführung ist separat offen.

**Gestaltung:** Fünf neu aufgebaute Hauptbereiche, eine Werkstatt mit Unterseiten, zwölf eigene SVG-Motive, vier lokale OFL-Schriften und wiederverwendbare bedeutungsbezogene Bewegung. Der gerenderte Doodle-Atlas wurde visuell geprüft. Er ist ausdrücklich keine Aufnahme der laufenden App.

## Tatsächliche Prüfbelege

| Gate | Ergebnis |
| --- | --- |
| Vollständiges `npm run check` | **PASS**, Exit 0, 44,07 s; 26 Test-/Integritätskommandos plus TypeScript und Lint |
| Neue Plan-/Satzengine | **114** Assertions bestanden |
| Neue Planverwaltung | **67** Prüfungen bestanden |
| Migration | **81** Assertions bestanden |
| Repository über echte SQLite-Dateien | **65** Assertions bestanden; Expo-Adapter simuliert |
| Ernährung / kontrollierter Export | **66** Prüfungen bestanden; Native-Adapter simuliert |
| Fortschritt | **16** Prüfungen bestanden |
| Build-/Capability-Verträge | **39** Prüfungen bestanden |
| Switch-Callbacks | **9** tatsächliche Callback-/Adapterprüfungen bestanden |
| Sauberes `npm ci` | **PASS**, 589 Pakete in unabhängigem Installationsordner |
| Expo Doctor | **20/20 PASS** |
| Expo-Abhängigkeiten | **PASS**, passend zum vorhandenen SDK |
| Standard-Prebuild | **PASS**, generierte Entitlements exakt `{}` |
| HealthKit-Prebuild | **PASS**, ausschließlich HealthKit-Entitlement, passende Usage Descriptions |
| iOS-Metro-/Hermes-Export | **PASS**, 1.308 Module, 20 Assets einschließlich aller vier Fonts, ca. 3,4 MB Bundle |
| Asset-/Paletteprüfung | Zwölf eigene SVGs gerendert; zehn geprüfte Text-Farbpaare mindestens 4,5:1 |

Die 107 erfassten Runtime-/Asset-/Config-Dateien des endgültigen Metro-Snapshots stimmten mit den gelieferten Laufzeitquellen überein. Spätere Änderungen betrafen Test-Harness, Bericht und Buildscript-Sicherheitsprüfungen. Die tatsächlichen Logs und deren Grenzen stehen in `TEST_MATRIX_15.md`.

Der finale SQLite-Lastlauf mit **10.000 Sätzen und 2.000 Gewichten** maß **864 ms** Bulk und **7,06 ms** für eine einzelne Entwurfsänderung, mit **zwei SQL-Schreiboperationen und drei Payload-Serialisierungen**. Das ist Desktop-Node/SQLite, keine iPhone-FPS-Messung.

## Offene native Gates

1. **CocoaPods und Xcode:** In der Linux-Umgebung fehlen `pod`, `swift`, `xcodebuild` und `xcrun`. Die neuen macOS-Workflows wurden noch nicht mit den FORM-15-Quellen ausgeführt. Deshalb existiert keine geprüfte IPA.
2. **iPhone/Simulator:** Keine native Vorher-/Nachher-Aufnahme, kein tatsächliches Screenrecording, keine Geräteabnahme von kleiner Schriftfläche, VoiceOver, Dynamic Type, Tastatur, Reduce Motion, Sperre oder Force Quit. Diese Tests sind konkret in der Matrix beschrieben.
3. **YAZIO:** Kein realer Datenaustausch auf passend signiertem Gerät. Die Umsetzung darf erst danach als geräteverifiziert bezeichnet werden.
4. **Widgets:** Bestehende Widget-/Live-Activity-Quellen und optionaler Config-Schalter sind erhalten. Die gelieferten Releasepfade verwenden `FORM_WIDGETS=0`. Ein eigener Multi-Target-Signierpfad für Widgets/App Groups ist offen und wird nicht als unterstützt ausgegeben; die In-App-Minileiste funktioniert unabhängig davon.

## Lieferung und Upgrade

Die ZIP enthält den tatsächlichen Projektquellcode, Tests, Lockfile, lokale Assets/Lizenzen, Migrations- und Releaseunterlagen sowie echte Logs. `SOURCE_MANIFEST_15.json` erfasst die Dateiintegrität. Der Patch ist ein Hilfsmittel für den abgeglichenen öffentlichen FORM-10-Stand; das vollständige Projekt bleibt die vollständige Lieferung.

Vor Überinstallation aus der bisherigen App ein extern aufbewahrtes Backup exportieren. Alte App nicht deinstallieren. Eigene Git-Historie behalten, Upgrade-Branch verwenden, Änderungen prüfen, `npm ci` und `npm run check` ausführen und den gewünschten macOS-Build starten. Gleiche effektive Bundle-ID und kompatible Signierung verwenden. Danach zuerst alte Trainings, Gewichte, Plan und bestehende aktive Session vergleichen. Die genaue Anleitung steht in `RELEASE_BUILD_15.md`.

Der zusätzlich eingegangene Second-Pass-Auftrag ist eine nachfolgende Entwicklungsrunde. Seine erweiterten Anforderungen werden nicht rückwirkend als bereits in diesem Build umgesetzt behauptet.
