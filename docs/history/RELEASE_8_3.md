# FORM 8.3 — Native Essentials

Weiterentwicklung des gelieferten FORM 8.2, kein neues Projekt. Stand: 24.11.2026. **Entwicklungsrelease, nicht als nativer iOS-Release abgenommen.**

## Was im Quellcode neu ist

| Funktion | Implementierung | Nachweis / offene Prüfung |
|---|---|---|
| Trainingsplan Drag & Drop | PanResponder-Griff, gemessene Zeilenpositionen, bestehende Übungs-IDs und Vorgaben bleiben erhalten; Pfeiltasten als Alternative | Reorder-Logik getestet; Touch, Scroll und VoiceOver auf iOS offen |
| Navigation | React Navigation Native Stack für Profil, Gesundheits- und Fortschrittsdetails mit nativer Rücknavigation und Gesten; fünf vorhandene Haupttabs bleiben als GlassBar | Syntax geprüft; native Gesten und Layout offen; keine vollständige native Tab-Bar-Migration |
| Datumsauswahl | Nativer DateTimePicker in Plan- und Messformularen, optional leere Enddaten | Datumskonvertierung getestet; Picker auf iOS offen |
| Gym | Kompakte Satztabelle, historische Vorwerte als bewusst auswählbare Entwürfe, kg/Wdh./RIR-Eingabe, Plus/Minus, Kontextmenü und Action Sheet, erweiterte Satztypen im Detailformular; große Schrift nutzt Detailformular; Session-Vergleich mit früherer Routine | Engine-Regression grün; native Bedienung und Dynamic Type offen |
| Erscheinungsbild | System/Hell/Dunkel, semantische Palette; bestehende Story-Designs bleiben individuell | Einstellungs- und Backup-Test grün; Kontrast und Layout nicht auf Gerät geprüft |
| Accessibility | Button-Labels, Checkbox-/Tab-Zustände, Pfeiltasten, Reduce Motion bei Stack, Sheets und neuem Meilenstein-Streifen; Haptics respektieren Einstellung in gemeinsamen Buttons | Native VoiceOver-/Dynamic-Type- und Reduce-Motion-Abnahme offen |
| Pausenmeldungen | Lokale iOS-Benachrichtigung nach gespeichertem absoluten Pausenende; stornieren bei Änderungen; optionaler Ton und Berechtigungsabfrage | Planungslogik getestet; reale Zustellung im Hintergrund offen |
| Trainingserinnerung | Lokale Pflichttage bis zu 21 Tage im Voraus zur gewählten Uhrzeit; keine optionale Einheit/Ruhetag als Pflicht; beim Öffnen neu planen | Planung getestet; iOS-Zustellung offen |
| Face ID / Touch ID / Gerätecode | Optionaler App-Zugriffsschutz, gerätebezogene Einstellung, Sperre nach Hintergrundwechsel | Quellcode/Syntax vorhanden; tatsächlicher Authentifizierungsdialog und App-Wechsel offen. Keine Datenbankverschlüsselung und kein garantierter Snapshot-Schutz |
| HealthKit | Lokales Swift-Modul mit optionaler Build-Capability; ausgewählte Tageswerte nach ausdrücklicher Freigabe und Vorschau übernehmen: Schritte, Geh-/Laufdistanz, Ruhepuls, mittlere Herzfrequenz, Aktivitätsenergie, Gewicht, Schlafdauer im Kalendertag. Nur Lesen. Wiederholter Import ersetzt nur denselben Apple-Health-Datensatz. Manuelle Einträge bleiben erhalten | Swift-Syntax und Datenimport getestet; CocoaPods, HealthKit-Autorisierung, reale Messwerte und Signierung nicht geprüft. Kein Workout-Import, kein Schreiben, keine Hintergrundsynchronisation |
| Widget | Nächster Pflichttrainingstag und Anzahl dokumentierter Trainingstage, 8-Tage-Timeline, opt-in | Payload-/Timeline-Logik geprüft, WidgetKit-Rendering und Signierung offen |
| Live Activity | Satzanzahl, Status, Pausenendzeit und Deep Link; Update nach App-Aktion/Öffnen; kein vorgetäuschter kontinuierlicher Countdown | Quellcode vorhanden; ActivityKit nicht kompiliert oder auf Gerät geprüft |
| Persönlichkeit | Subtiler Streifen für erstes Training, echte neue Bestwerte, 100 Sessions und Wochenbestwert; Retro-Archiv im Film Room | Datenbasierte Meilensteine getestet; Animationsdarstellung offen. Nicht jede frühere Easter-Egg-Idee einzeln umgesetzt |
| Daten | Weiterhin form-v8-fresh.db und app.athleteos.personal; zusätzliche Einstellungen und Gesundheitsmetriken; Backup-Roundtrip und Wiederöffnung getestet. Keine persönlichen Werte eingefüllt. Keine neue automatische V7-Übernahme | SQLite-Tests mit Node DatabaseSync; Expo-SQLite-Laufzeit offen |

## Tatsächlich ausgeführte Tests

- `NODE_PATH=$(npm root -g) npm run test:all` nach den einzelnen Phasen und am Ende: **16/16 Testsuiten erfolgreich**. Ausgabe: `docs/qa/83-final.log`.
- 57 neue Einzelprüfungen in `tests/test-native-features.cjs`: Drag/Date, Benachrichtigungsplanung, Health-Import, Widget-/Timeline-Daten, Meilensteine, Backup, echte SQLite-Datei nach Neustart, optionale Build-Konfiguration.
- 50 TS/TSX-Dateien und 304 Importpfade geprüft (vor den finalen kleinen UI-Ergänzungen; finalen exakten Wert siehe Log).
- `swiftc -frontend -parse modules/form-health/ios/FormHealthModule.swift`: Exit 0. Das ist ein Parserlauf auf Linux, kein iOS-Compilerlauf.
- `npm install --offline --ignore-scripts --no-audit --no-fund`: Exit 1, `ENOTCACHED` für @expo/ui. Der Netzwerkzugriff auf registry.npmjs.org war nicht verfügbar. Vollständiger `npm run typecheck` versucht: Exit 2, u. a. fehlende React-, Expo- und Navigationsmodule und fehlende Expo-tsconfig-Basis. Eventuelle zusätzliche Typfehler mit vollständig installierten Paketen sind nicht ausgeschlossen.
- Expo prebuild, CocoaPods, Xcode, GitHub Actions, IPA, Simulator, iPhone: nicht ausgeführt. Keine IPA liegt vor.
- 245 lokale Fallback-Katalogeinträge. Vollständige Originaldatenbank, Bilder und Fonts werden durch unveränderte CI-Asset-Skripte beschafft; hier nicht verfügbar oder komplett verifiziert. Kein ungeprüftes Google-Bildmaterial übernommen.

## Signierung und Installation (Standard)

1. Falls du inzwischen Daten gespeichert hast: JSON-Backup aus 8.2 exportieren.
2. ZIP entpacken. Inhalt in den vorhandenen Repo-Hauptordner kopieren, einschließlich `.github`, `.gitignore`, `app.config.js` und `modules/form-health`.
3. Falls noch `modules/athlete-ocr` aus Version 7 oder 8.1 existiert, löschen. Der neue Ordner `modules/form-health` muss erhalten bleiben. Keine privaten Backups in Git aufnehmen.
4. Falls eine alte `package-lock.json` existiert: `npm install --package-lock-only` mit Internet ausführen und das aktualisierte Lockfile committen. Ist das nicht möglich, altes Lockfile entfernen; CI benutzt dann `npm install`.
5. Commit & Push. Workflow **FORM 8.3 – iOS IPA (unsigned)** ansehen. `npm run check` muss bestanden sein, danach Prebuild, CocoaPods und Xcode. Fehlerlog wird bei Fehlschlag hochgeladen. Bei Grün: `ATHLETE_OS_unsigned_IPA-<run>` herunterladen, IPA mit Sideloadly und derselben Signierung installieren. Vor Deinstallation Backup sichern.
6. Standard-CI lässt HealthKit und Widget-App-Group absichtlich aus. Manuelle Gesundheitsdaten, Training, Pläne, Erinnerungen, App-Zugriffsschutz und Darstellung sollen unabhängig davon verfügbar sein (native Prüfung steht aus). Kosten hängen von GitHub-Konto, Runner und verfügbaren CI-Minuten ab; kein garantierter kostenloser Build.

## Optionaler nativer Capability-Build (macOS/Xcode)

`FORM_HEALTHKIT=1 FORM_WIDGETS=1 npx expo prebuild -p ios --clean`

Einzeln aktivierbar. Anschließend `cd ios && pod install`, Workspace öffnen, für die App und ggf. Widget-Extension passende Apple-Developer-Signierungsprofile und App Groups konfigurieren, auf einem Gerät bauen. Die Konfiguration nutzt `group.app.athleteos.personal` und `app.athleteos.personal.widgets`. Die kostenlose Personal-Team-/Sideloadly-Signierung unterstützt nicht zwangsläufig die benötigten Entitlements; normale unsigned IPA enthält die Zusatzfunktionen daher nicht aktiviert. Keine HealthKit-Berechtigung ohne explizite Nutzeraktion. Widgets und Live Activities können Trainingsinformationen außerhalb der App zeigen, auch wenn die App biometrisch gesperrt ist. Beide standardmäßig deaktiviert.

Technische Referenzen: https://docs.expo.dev/versions/v58.0.0/sdk/widgets/ ; https://docs.expo.dev/versions/v58.0.0/sdk/ui/drop-in-replacements/menu/ ; https://docs.expo.dev/versions/v58.0.0/sdk/notifications/ ; https://docs.expo.dev/versions/v58.0.0/sdk/local-authentication/ .

## Noch offen / Abnahmeblocker

Vollständige Dependency-Installation, Typecheck, Expo-Prebuild, CocoaPods, Xcode, tatsächlicher iPhone-Release, echte Bilder/Fonts, vollständige VoiceOver-/Dark-Mode-/Drag-/Timer-/Face-ID-/HealthKit-/Widget-Gerätetests. Native Tab-Bar- und vollständige Detail-Stack-Migration, zusätzliche HealthKit-Datentypen (Workouts), alle früher vorgeschlagenen Easter Eggs, verschlüsselte Backups und eigenständige Watch-App sind nicht abgeschlossen. Keine dieser Funktionen wird als auf iPhone getestet dargestellt.
