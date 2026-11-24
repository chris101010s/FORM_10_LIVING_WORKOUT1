# FORM 8.4 — Fresh Start / Completion Pass

Stand: 24.11.2026. Direkte Weiterentwicklung des gelieferten 8.3-Repositories, kein neues Expo-Projekt. Entwicklungsstand; **kein erfolgreich verifizierter iOS-Release**.

## Neu in diesem Paket

- **Fresh Start:** `form-v84-clean.db`, `form-v84-before-restore`, `form-v84-device-auth-lock`. Bestehende alte SQLite-/KV-Daten werden nicht automatisch gelesen oder gelöscht. Profil, Gewicht, Ziele, Routinen, Gesundheitswerte und Coach-Opt-in beginnen leer. Setup wie in 8.3 mit freiwilligen Angaben. Bundle-ID `app.athleteos.personal` bleibt. Ein späteres Update derselben 8.4-Datenbank übernimmt die dort gespeicherten Werte; Fresh Start ist kein Reset bei jedem App-Start.
- **Backup Center:** Größenprüfung, Vorschau mit sechs Zählern, Merge nach stabilen IDs (identische Einträge dedupliziert; Konflikte abgelehnt), Ersetzen mit vorheriger Rücksicherung, Wiederherstellung der Rücksicherung. Merge behält das bestehende Profil, Einstellungen, Wochenplan und bei Bedarf laufende Session; importierte aktive Programme werden pausiert. Keine stillschweigende Überschreibung abweichender Datensätze. Fotos, die nur als lokale Dateipfade vorliegen, sind nicht portabel. Unverschlüsseltes JSON und bestehende ATHLETE-OS-Backups bleiben einlesbar.
- **Verschlüsselte Backups (iOS):** Apple CryptoKit AES-256-GCM mit zufälligem 16-Byte-Salz, PBKDF2-HMAC-SHA256 (600.000 Runden, 32-Byte-Schlüssel), zufälliger GCM-Nonce, authentifiziertem Formatnamen. Passwort ab 12 Zeichen, nicht gespeichert; verschlüsselte Datei per Share Sheet. Wiederherstellung erst nach Entschlüsselung und JSON-Validierung. Keine HealthKit-Entitlements nötig. Native Implementierung nur syntaktisch geprüft, NICHT kryptografisch auf Apple-Geräten ausgeführt; separater macOS-Kompilierungs-/Interoperabilitätstest ist als CI-Gate eingerichtet. Datenbank selbst nicht verschlüsselt.
- **Mehrere Trainingsblöcke in einer Routine:** Blockeditor im Plan-Tag, geordnete Gruppen teilen/verbinden, pro Gruppe Normal, Superset, Giant Set, Zirkel, EMOM, AMRAP oder Intervall und eigene Zeit. Stabile Gruppen/Übungs-IDs und Validierung. Beim Umordnen bleiben zusammenhängende Blöcke erhalten; aufgetrennte Gruppen werden zu einzelnen normalen Sätzen. Vorschriften pro Übung bleiben erhalten. Live: Wechsel innerhalb gruppierter Formate, Pause nach Runde, expliziter Wechsel zum nächsten Block, Zeitfenster aus tatsächlichen Zeitstempeln, Pause/Fortsetzen, Snapshot der Gruppen im Workout. Keine automatische Satzbuchung oder erzwungene Beendigung eines Zeitformats. Gruppen können auch per Übungsauswahl gewechselt werden. Planimport remappt Gruppen gemeinsam mit Übungen. Logik, Backup und SQLite-Neustart getestet; UI-Gesten/Native Timer nicht auf iPhone getestet.
- **Native iOS-Haupttabs:** fünf native Tabs über React Navigation v7 `@react-navigation/bottom-tabs/unstable` (7.21.0), native Systemicons, Profil/Details/Ziele im bestehenden Stack. Aktives Workout bleibt auf anderen Tabs oben erreichbar. Fallback: bisherige GlassBar auf Android oder beim CI-Workflow-Dispatch mit `custom_tabs=true`. Neue Abhängigkeit konnte hier nicht installiert werden. Native Darstellung, Insets, Tab-Wechsel, Deep Links noch nicht ausgeführt.
- **Persönlichkeit:** echter Paper Mode (Token-Palette), Fokusmodus reduziert Heute auf Training, letzte Leistung, Check-in; Jahresjournal mit dokumentierten Sessions/Sätzen/Trainingstagen, 100-Satz-Markierung, 3-Wochen-Messdatenhinweis (3 Messtage pro 7-Tage-Fenster). Bestehende PR-Tickets, Story-Presets, Film Room, Timer-Modus, Meilensteine bleiben erhalten. Keine künstlichen Daten. Jahresübersicht und Datenqualität getestet.
- **CI:** zusätzlicher Apple-CryptoKit-Test mit Node/Swift-Interoperabilität vor Prebuild; Log als Fehlerartefakt; explizite Fallback-Auswahl für Tab-Bar, Manifest enthält tatsächliche Katalog-, Foto-, Font-Anzahlen. Bestehende unsigned IPA-Pipeline bleibt erhalten. `xcode-27` ist dokumentiertes GitHub Standard-Runner-Label. Die Nutzungskosten hängen vom Repo/Tarif und verfügbaren Minuten ab.

## Tatsächliche lokale Prüfungen

- Separat entpacktes ZIP: alle 17 Testsuiten erneut erfolgreich, Exit 0 (`docs/qa/84-fresh-zip.log`). Danach wurden nur Dokumentation und das Testprotokoll ergänzt; Quellcode unverändert.

- Baseline 8.3: 16/16 Testsuiten, `docs/qa/84-baseline.log`.
- Zwischenstand Backup/Blöcke: 16/16 Regressionen, `docs/qa/84-phase2.log`.
- Finaler Quellstand: 17/17 Testsuiten inklusive 52 neuer Prüfungen in `tests/test-form84.cjs`. `docs/qa/84-final.log`. Pure TypeScript-Logik wird mit tsc im strikten Modus kompiliert; echte SQLite-Datei unter Node DatabaseSync geöffnet, geschrieben, geschlossen, wieder geöffnet, Fremdschlüssel und vollständiger Inhalt geprüft. Das testet NICHT den Expo-SQLite-Nativadapter.
- `swiftc -frontend -parse modules/form-health/ios/*.swift`: Exit 0 auf Linux. Nur Syntax. `bash -n` für Crypto- und Build-Skript; Workflow-YAML geparst. Apple-Krypto-Ausführung muss in CI erfolgen.
- Offline-Installation: Exit 1, `ENOTCACHED` für `@expo/ui`. Online-Installation: Exit 1, `EAI_AGAIN registry.npmjs.org` (`docs/qa/84-install-online.log`). Vollständiger `tsc --noEmit`: Exit 2, Expo-tsconfig und React-/Expo-/Navigationstypen fehlen (`docs/qa/84-typecheck.log`). Keine vollständige Typprüfung möglich. Weitere Typfehler nicht ausgeschlossen. Kein Xcode/Simulator auf Linux.
- GitHub Actions, iOS Prebuild, CocoaPods, native Kompilierung, IPA-Erstellung und Gerätetest wurden hier NICHT ausgeführt. Keine IPA oder echten iPhone-Screenshots vorhanden.

## Abgleich mit beiden Prompts / noch nicht fertig

| Bereich | Stand / verbleibender Umfang |
|---|---|
| Fresh Start | Implementiert; Nutzerentscheidung ersetzt alte Pflicht zur automatischen Migration. Manuelle Backup-Wiederherstellung bleibt. |
| Design und native Tabs | Design/Farben/Light/Dark/Paper und native Tabs im Code, native Abnahme offen. Plus Jakarta Sans, DM Sans, IBM Plex Mono nur CI-Abruf + Systemfallback. Vollständige Accessibility-/Kontrast-/Reduce-Transparency-Gerätetests offen. |
| Training | Mehrblock-Editor, Satztypen, Vorwerte, Drafts, Pausen, Historie, Wochenpläne, Drag-and-drop vorhanden. Automatische Blockabschluss-/Rundenvorgaben, echte Hold-Stoppuhr, beliebige Wiederholungsbereiche, Deload-Plan und vollständiges Undo/Redo noch nicht vollständig. |
| Katalog | 245 lokale Start-/Fallback-Einträge; vollständiger Upstream-Datensatz, Fotos und Fonts sollen per CI beschafft werden. Direktdownload scheiterte. Kein ungeprüftes Google-Bildmaterial. Keine verifizierte 800+-Offline-Bibliothek, vollständige DE-Übersetzung, Muscle Map oder gerätespezifische Suchperformance. |
| Fortschritt | Bestehende Charts, Gewicht, Kraft, Leistung, Cardio, Jahresübersicht vorhanden. Vollständige Heatmap, Zonen-/Intervall- und Plateau-Analyse, durchgängige kg/lb + km/mi-Konversion und private Fortschrittsfotos mit portabler Sicherung fehlen. |
| Gesundheit | Manuelle Gesundheit, Journal, Habits, Recovery und Ernährung bleiben. FITINN/OCR bewusst entfernt (späterer Redesign-Prompt). Allgemeine Messwerte werden bei explizitem Backupimport erhalten. Apple Health nur optional (8.3), Workout-/Schreib-/Hintergrundintegration nicht vollständig. |
| Easter Eggs | Mehrere der 20 Ideen vorhanden, u.a. 7-Tap-Film Room, First Rep, PR, Timerformat, 100 Sätze, Jahresübersicht, Paper/Fokus, Datendichte, PR-Tickets. Nicht alle Originalanimationen, Einmal-Hinweise, Filmstrip-Gesten und saisonalen Akzente exakt umgesetzt. |
| Sharing | Fünf Story-Presets, Kennzahlenwahl, anonymes Teilen; native PNG-Ausgabe nicht getestet, kein garantierter nativer 1080×1920-Render. Kein Backend/Freundes-Netzwerk. |
| Native Extras | Face ID/Touch ID, lokale Benachrichtigungen, HealthKit und Widgets/Live Activities wie 8.3; HealthKit/Widgets/Live Activities brauchen passenden Capability-Build. Keine eigenständige Apple-Watch-App oder Siri/Spotlight-Anbindung. |
| Backup | Preview, Merge, Replace, Rücksicherung und iOS-Krypto-Code vorhanden. Native Crypto-Laufzeit, Foto-Portabilität, separate DB-Verschlüsselung, vollständige DB-Normalisierung noch offen. |
| Release | Lokale Tests grün; vollständiger Dependency-Install/Typecheck, CI-Build, native IPA und Gerätetests offen. Kein reproduzierbares neues npm-Lockfile ohne Registry. |

## Installation

Siehe `BUILD_WINDOWS_TO_IPHONE.md`. In das bisherige GitHub-Repo kopieren, ggf. den alten OCR-Ordner entfernen, neues Lockfile mit Internet erzeugen und committen (oder altes Lockfile entfernen, damit CI npm install nutzt), Commit/Push, Workflow **FORM 8.4 – iOS IPA (unsigned)**. Erst bei grünem Build das IPA-Artefakt in Sideloadly installieren. Du brauchst keine Deinstallation für Fresh Start, denn die neue Datenbank ist unabhängig. Wenn Sideloadly wegen Signierung/Containerkonflikt eine Deinstallation verlangt, ist das deine Entscheidung; sie löscht alte lokale Appdaten. Kein garantiert kostenloser CI-Lauf oder signierter Build.

## Quellen zur neuen nativen Integration

- https://reactnavigation.org/docs/native-bottom-tab-navigator/ (v7 native Bottom Tabs, SF-Symbols, Xcode/Liquid Glass)
- https://www.npmjs.com/package/@react-navigation/bottom-tabs (7.21.0)
- https://developer.apple.com/documentation/cryptokit/aes/gcm (authentifizierte AES-GCM-Primitive)
- https://docs.github.com/en/actions/reference/runners/github-hosted-runners (Runner-Labels)

## CI-Hotfix
GitHub Actions Initial commit #1: laut übermitteltem Log alle Tests erfolgreich, Typecheck TS2345 in App.tsx: Linking.getInitialURL kann undefined liefern. Callback akzeptiert jetzt string | null | undefined. Alle 17 lokalen Testsuiten erneut bestanden; isolierter strikter Typecheck mit der gemeldeten Promise-Signatur bestanden. Vollständiger Expo-Typecheck und Xcode-Build noch nicht erneut in CI ausgeführt. Keine Änderungen an Version, Bundle-ID oder Datenspeicher.
