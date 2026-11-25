# FORM 15.0.0 – Second Pass Audit

## Gesicherte Ausgangsbasis

Geprüfter Stand ist `05056e2185092d9cc530a9aad5d4935a2de969e0` (`form-15-first-pass`). Die erste Lieferung wurde als eigenständige ZIP gesichert. Sie wird für die zweite Runde nicht ersetzt. Originalbasis: `b5f7d88` (`form-10-supplied-baseline`). Öffentliches GitHub-main `e0066a240400d6c38480b9a0de4e119a8a50e5bb` wurde gegen die gelieferte FORM10-Basis verglichen; keine neueren Anwendungskorrekturen zu übernehmen. Privates main ist älter als der mitgelieferte Switch-Fix. Die zweite Runde beginnt auf dem tatsächlich fertiggestellten ersten Stand.

App15.0.0, Bundle `app.athleteos.personal`, Scheme `athleteos`, SQLite `form-v84-clean.db`, Schema9, JSON4. Bestandsdaten haben Vorrang. Neue interne Buildnummer:150001. Kein Reset und keine automatische Wiederbelebung verworfener Altdaten.

## Nachweisstand vor Änderungen

`docs/qa/15/local-validation.json` und `final-check.log`: alle26 lokalen Test-/Integritätsstufen, TypeScript und Lint bestanden. Expo Doctor20/20; echte SQLite-Dateien/Migration/Neustart; iOS-JavaScript-/Hermes-Export bestanden. Kein Swift-/Xcode-Compile, keine IPA, kein iOS-Simulator, kein physisches iPhone, kein echter YAZIO-Roundtrip in dieser Linux-Umgebung. Ein bestandenes Logiktestprogramm ist keine native UI-Abnahme.

## Anforderungsregister aus beiden Aufträgen

Die Detailregister ergänzen diese Datei verbindlich. Sie benennen pro Anforderung Status, konkrete Implementierung/Entrypoint, Speicherweg, bestehende Tests und offene Akzeptanz. Vorherstatus wird nicht nachträglich in einen Erfolg umgeschrieben; Nachherstatus wird anhand tatsächlicher Änderungen und Logs ergänzt.

| Originalauftrag / Ergänzung | Vorherstatus | Detailregister / Nachweise | Offene zweite Abnahme |
|---|---|---|---|
| P1§0/1.1 Datenerhalt, Identität, Snapshot, unbekannte Felder | vorhanden und geprüft | Datenregister, `repository.ts`, `validation.ts`; Migration81/Repository65 | zusätzliche Revisionen/Undo/Medien/Rotation, echte Geräteüberinstallation offen |
| P1§1 aktuelle GitHub-Basis/Sicherungscommit | vorhanden und geprüft | `docs/qa/15/github-public-comparison.json`, privater Vergleich, oben genannte Commits | kein Remote wird ungeprüft überschrieben |
| P1§2.1 Navigation/Miniplayer | vorhanden und geprüft | Designregister, `App.tsx` | neue Detailseiten dürfen keinen alternativen Quick-Start erzeugen |
| P1§2.2 Quick Training/FITINN/OCR | bewusst entfernt | `REMOVED_FEATURES.md`, Startguard-Tests | Alt-Historie/Alt-Live weiter erhalten |
| P1§2.2 Archiv, Journal, Habits, Story, Health | vorhanden und geprüft | `More.tsx`, `Health.tsx`, Archivpfade | Doppelungen reduzieren, Daten nicht löschen |
| P1§2.3 Planaktivierung/Zyklus/Import/Snapshot | vorhanden und geprüft | Trainingsregister, `planWorkout.ts`, `planImport.ts`, Planmanagement67 | Revisionen, Occurrences, individuelle Sollzeilen |
| P1§3 Limits und persistente unabhängige Satzzeilen | vorhanden und geprüft | Trainings-/Datenregister, Plan114 + echteSQLite | individuelle Sollzeilen, Undo, unilaterale Daten |
| P1§4 Gym, Timer, Vorwerte, Finish | teilweise | Trainingsregister und `Gym.tsx`/`LivingComponents.tsx` | Komfortdetails, Commit-sicheres Undo und Vergleich |
| P1§5 YAZIO/HealthKit / P2§7 | teilweise | Health-/Native-Register, Nutrition66 | Auto-Refresh,90Tage, tatsächlicheExportkorrektur; Roundtrip nativ blockiert |
| P1§6 / P2§1 Illustration/Design | teilweise | Designregister, echte12SVG-Motive + Assetatlas |48Motive,16Pip-Posen, eigeneTabs/Kategorien/Icons, echteDeviceQA |
| P1§6.3 / P2§2 Motion | teilweise | Designregister, `Sketchbook.tsx` |36+ echte integrierte Abläufe, globaleModes; nativePerformance offen |
| P2§3 Copy | fehlt | Designregister | typisierte100+Varianten mit realen sparsamen Triggern/Opt-in |
| P1§7 / P2§6 Analytics | teilweise | Trainingsregister, `progress15.ts`, Progress16 | Kalender/PR/Monate/Revisionen/Pausen, zugänglicheTabelle |
| P2§4.1 individuelleSatzvorgaben | fehlt | Trainingsregister |12/10/8Last/RIR/RPE/Tempo, altesSoll verlustfrei |
| P2§4.2 Progression/Plateau | fehlt | Trainingsregister | transparenteDatenschwellen, expliziteÜbernahme, keinZwang |
| P2§4.3 Undo/Shift/Skip/Unilateral/Komfort | teilweise | Trainings-/Daten-/Nativregister | atomareGegenaktionen und Neuberechnung, Tests |
| P2§4.4 Revisionen/Batch/Textimport/Deload | teilweise | Trainings-/Datenregister | konkretePreview/CommitPfad und Referenzschutz |
| P2§5 Schreibpipeline/Drafts/Recovery | vorhanden und geprüft | Datenregister, `context.tsx`, `repository.ts` | neueDatentypen mitRennen/Retry/Restartprüfen |
| P2§5 Backuprotation/privateMedien/Diagnose | fehlt | Datenregister | verifizierteSnapshots, privateDateien, portableManifeste, keinefalscheVerschlüsselung |
| P2§5 Notifications | teilweise | NativeRegister, `NativeFeatures.tsx` | Cancel/Undo/Restartkorrektur; nativeAusführungoffen |
| P2§8 globaleSuche | fehlt | NativeRegister | echteDetails/keineQuickStarts, lokaleFavoriten/Filter |
| P2§8 Home-Einstellungen | fehlt | Designregister | wenigeoptionaleInfos/eineHauptaktion |
| P2§8 Widgets/LiveActivity | nativ blockiert | NativeRegister, vorhandeneWidgetquellen | Standardbuild ohneWidget; realerSignierungs-/Extensionnachweisoffen |
| P1§8 / P2§9 lokaleQualitätsgates | vorhanden und geprüft | ersteLogs + Switch9/LinkingNullable | neueTests und gesamteRegression erneut |
| P1§8 / P2§9 nativeCompile/IPA/SE/VoiceOver | nativ blockiert | `RELEASE_REPORT_15.md` | Mac/Xcode und signiertesGerät erforderlich |
| P1§9/10 / P2§10 vollständigeAuslieferung | teilweise | ersteSourceZIP undDokumente vollständig | zweiteSourceZIP, AuditVorher/Nachher, neueLogs/Dokumente |

## Detailregister

- `docs/second-pass-audit-data.md`: Persistence, Migration, Backup, private Medien, Diagnose und neue Datentypen.
- `docs/second-pass-audit-training.md`: Plan, Gym, individuelle Sollwerte, Progression, Versionierung, Undo und Analytics.
- `docs/second-pass-audit-health-native.md`: Ernährung, HealthKit, Widgets, Icons, Suche, Notifications und Buildfähigkeit.
- `docs/second-pass-audit-design.md`: Gestaltung, Motion, Copy, Navigation, Touchziele und gesichtete UI-Aktionen.

## Konkrete vorab gefundene Fehler

1. Ernährung wird zusätzlich von einem zweiten manuellen Wasser-Editor umgeben (`Health.tsx`). Ein Einstieg pro Datentyp genügt.
2. Nutrition aktualisiert `lastSync` im optimistischen RAM; die Beschriftung „lokal gespeichert“ kann vor Commit erscheinen. Auto-Refresh darf seine Freshness nur aus bestätigtem Zustand ableiten.
3. Widget-Wochenfortschritt zählt Workout-Daten ohne sauberen Routine-/Occurrence-Abgleich; andere Routine am selben Tag kann einen Plantag verdrängen.
4. Alte Haptikvorgabe ist implizit an. Neue Installation benötigt Opt-in; bestehende Wahl erhalten.
5. Home-Wochentage unterschreiten in der Breite44pt. Modal-Schließen braucht ebenfalls ein explizites44pt-Ziel.
6. Einige unbekannte Detailroute-Fallbacks zeigen eine andere Seite (Journal/Woche). Neue Suche muss konkrete Ziele öffnen.
7. Zeit-Warm-ups werden in der bisherigen Dauer-Leistungsserie als Arbeitssatz berücksichtigt. Bodyweight-Warm-ups verlangen fälschlich ein Lastfeld.
8. Lexikographische Sortierung von ISO-Zeiten mit unterschiedlichen UTC-Offsets kann einen echten späteren Rekord übersehen.
9. Der bisherige Entfernungsbutton rekonstruiert keinen früheren Timer und ist deshalb kein vollständiges Undo.

Die Trainingsbefunde sind mit synthetischen Daten im unveränderten First-Pass-Code reproduziert: `docs/qa/second-pass/phase-a-training-repro.json`.

## Reihenfolge und Grenzen

Audit + Sicherungscommit vor Runtime-Änderungen. Danach Daten-/Versions-/Undo-Vertrag, Plan-/Gymlogik, Health-/Native-Komfort, eigene Gestaltung/Motion/Copy und Analytics/Suche. Unabhängige UI-/Domainarbeit wird parallel vorbereitet; Integration und Speicherung bleiben geprüfte Sequenzen. Kein Erfolg durch bloß vorhandeneDateien oder Namen. Nachherstatus nennt die erreichte Prüfebene und offen gebliebeneNative-Abnahme.

## Nachherstand · Build 150001

Der Vorherstand oben bleibt unverändert. Der folgende Status bezieht sich auf den implementierten zweiten Durchgang und die tatsächlich ausgeführten Prüfungen. „Vorhanden und geprüft“ bezeichnet jeweils die ausdrücklich genannte lokale Prüfebene; es ist kein pauschaler nativer Release-Pass. Der abschließende Gesamtgate und exakte Befehle/Exitcodes stehen in `TEST_MATRIX_15_SECOND_PASS.md` und `RELEASE_REPORT_15_SECOND_PASS.md`. Finaler Quellcommit, Dateihashes und tatsächlicher Paketstatus stehen in den beiliegenden Paketmanifesten.

| Anforderung aus beiden Prompts | Nachherstatus / Ebene | Konkreter Einstieg und Speicherweg | Nachweis / offene Akzeptanz |
| --- | --- | --- | --- |
| P1§0/1, P2§0 Identität, keine neue App/Reset | vorhanden und geprüft · Config/SQLite | app.json, repository.ts; unveränderte Bundle-ID/DB, Build150001 | Migration/Repository/Build-Gates; echte Überinstallation nativ blockiert |
| P1§1 Git-Basis und Sicherung | vorhanden und geprüft | First-Pass- und Audit-Tags; bekannte öffentliche/private Basis gelesen | Kein ungeprüfter Remote-Write; Patch gegen verifizierte öffentliche Basis separat geprüft |
| P1§1.1, P2§5 aktive Session, höhere Altwerte, unbekannte Felder | vorhanden und geprüft · echte SQLite | context/schema/validation/relational, form-v84-clean.db | Upgrade-Fixtures, 22-Aktionen-E2E, Neustart und Medienbackup; kein persönlicher Datenbestand verwendet |
| P1§2/3, P2§0 Plan-only und echte Grenzen | vorhanden und geprüft; Quick Training bewusst entfernt | planWorkout/plannedTargets, Home/Plans/Gym | Alte12 bleiben12; neue4beiSoll3 erst nachFreigabe; vierteZeile bewusst; Alt-Live darf enden |
| P2§4.1 individuelle Zielzeilen | vorhanden und geprüft · Domain/SQLite | SetTargetEditor/PlanRoutineEditor, positions.targets | Separate Last/Reps/RIR/RPE/Tempo/Pause/Unit; Snapshot bleibt unverändert |
| P2§4.2 Progression/Plateau | vorhanden und geprüft · Domain | progression/ProgressionPanel, progressionDecisions + neue Revision | Datenmangel, RIR, Last-/Seitenbasis, Deload/Block/Tempo/Gaps; keine automatische Annahme |
| P2§4.3 Undo, Skip, Verschieben | vorhanden und geprüft · Domain/Provider/SQLite | planOperations/workoutTiming; undoState/planOccurrences/restEvents | Fünf Taps, veraltete Undo-Grundlage, Timer/Restart; echte Notificationzustellung nativ blockiert |
| P2§4.3 Vorwerte/Unilateral/Geräte | vorhanden und geprüft · Domain/Adapter | Gym/InlineSetTable/EquipmentPanel; unabhängige Drafts und private Medien | Teilweise Vorwerte behalten Zielzuordnung; 0links/positiveRechts korrekt; native Tastatur offen |
| P2§4.3 Dauer und Abschlussvergleich | vorhanden und geprüft · Domain | Trainingszettel/compareWorkout/measuredRest | Tatsächliche Last/Reps, gleiche Vorgaben, beobachtete Pausen; keine Sollpause als Ist erfunden |
| P2§4.4 Zyklen/Deload/Kopie/Batch | vorhanden und geprüft · Domain | PlanTools/PlanRoutineEditor/planOperations | Neue Instanz-IDs, Bibliotheks-ID stabil, Vorschau/Bestätigung, keine rückwirkende Historyänderung |
| P2§4.4 append-only Revisionen | vorhanden und geprüft · SQLite | planRevisions, planRevisionDiff, PlanTools | Ausgangsversion, Vergleich, Kopie/Reaktivierung als neue Revision, Entwurf separat |
| P2§4.4 Text- und JSON-Import | vorhanden und geprüft · Parser/Domain | PlanTextImport/planTextImport/planImport | Mehrdeutigkeit/Einheit/Übungs-ID in Vorschau, lokale Ausführung, Legacyformate erhalten |
| P2§4.4 Muskel-Soll | vorhanden und geprüft · Domain | plannedMuscleSummary, PlanTools/Analytics | Primär/sekundär und optionale Tage getrennt, keine Prozentschätzung |
| P2§5 Commitpipeline/Autosave/Retry | vorhanden und geprüft · echte SQLite | context confirmedData/lastSaved, repository | Konkurrierende Settings/Drafts, SQL-/Diskfehler, Retry, Lesefehler ohneReset |
| P2§5 Backuprotation/Restore | vorhanden und geprüft · Dateiadapter/SQLite | localSnapshots/BackupCenter/AutoBackupSync | Erst verifiziertes neues Backup erlaubt Rotation; Vorimport/Rollback; nativer Schutz separat |
| P2§5 private Fotos/portable Medien | vorhanden und geprüft · reale Testdateien | mediaAssets/privateFiles/portableBackup | Hash, EXIF-Orientierung, Traversal/fehlendeMedien/Staging; Größenlimits dokumentiert |
| P2§5 Diagnose/Export | vorhanden und geprüft · Adapter | PrivacyDiagnostics/diagnostics/shareTextExport | Redaktions-Allowlist, ausdrückliche Freigabe, Readback+Cleanup; OS-Ziel nicht als gesichert behauptet |
| P2§5 native Notifications | vorhanden und geprüft · Adapter; nativ blockiert | NativeFeatures/nativeReconciliation | IDs/Fingerprints, Change/Skip/Undo/Pause/Finish/Restart; Zustellung auf Gerät offen |
| P1§6/P2§1.1 Illustration, Farben, Fonts | vorhanden und geprüft · Bytes/Token/Quellcode | art/Design/fonts, lokales Papierkorn | 56 tatsächliche Tokenpaare, OFL, kein Startdownload; echte Screenlesbarkeit offen |
| P2§1.2 Pip16 und getrenntes Opt-in | vorhanden und geprüft · Geometrie/Hook | pip.ts/Personality, settings.character/copyEnabled | Alle16Posen, reale Events, kurzeLebensdauer, Character-Off; native Darstellung offen |
| P2§1.3 48Motive, Kategorien, eigeneTabs | vorhanden und geprüft · Registry/Bytes/Integration | 48kanonisch +10Kategorien +12Tabzustände | EigeneSVGs/36Tab-PNGs, Hashes, tatsächlichesAssetSheet; keineMockscreens |
| P2§1.4 vierAppicons/fünfThemes | vorhanden und geprüft · Asset/Prebuild/Adapter; Umschaltung nativ blockiert | Appearance/AlternateIconSettings, nativePresentation | Opaque1024/180/120, Katalog/Buildsettings, Readback; tatsächlichesIconwechselgate offen |
| P2§2 Motion36+ | vorhanden und geprüft · tatsächlicheHookadapter | MotionCue/Sketchbook + realeAufrufer | 40Abläufe, sichtbareInhalte/Pfade, Off/Reduce/inaktiv/Unmount/keineQueue; FPS/Recordings nativ blockiert |
| P2§3 Copy100+ | vorhanden und geprüft · Selector/Hook/Integration | copy.de.ts/Personality, 104Varianten/26Events | EchteTrigger, stabileWahl, keinefalschenPRs, wichtigeHinweise unabhängig vonOpt-in |
| P1§7/P2§6 Kalender/Monate/Jahr | vorhanden und geprüft · Domain | TrainingAnalytics/calendarMonth/compareMonths | LokaleTage/DST, konkreteTermine, gleicheFenster, aktuellerMonat markiert, Originaleinheiten verlinkt |
| P2§6 PR/gleicheLast/Einheiten | vorhanden und geprüft · Domain | recordArchive/PerformanceTrend/sameLoadSeries | Korrektur/Löschung, keinBasis-PR, Warm-up/Assist/Seite getrennt, e1RM begrenzt |
| P2§6 Soll/Ist/Revision/Pauses | vorhanden und geprüft · Domain | rowComparison/compareWorkout/periodSummary | UrsprünglicherSnapshot, Block/Tempo, aktiveZeit und beobachtetePause mitMessbasis |
| P2§6 Charts/Tabelle/Favoriten/Export | vorhanden und geprüft · Quellcode/Helper/Adapter | TrendChart/TrainingAnalytics, analyticsFavorites | EchteX-Abstände, Tap/Schrittaktion/Tabelle, begrenzteFavoriten, CSVbereinigung; nativeInteraktion offen |
| P2§6 Schlaf/Training | vorhanden und geprüft · Domain | recoveryPairs/recoveryAssociation | Mindestens7verschiedenegemeinsameTage, Konflikte/fehlend nichtnull, Quellen, keineKausalitätsbehauptung |
| P1§5/P2§7 YAZIO-/Health-Datenweg | vorhanden und geprüft · Quellen/Mock/SQLite; nativ blockiert | Nutrition/HealthSync/nutritionCoordinator/FormNutritionBridge | OffizielleDokumentation, tatsächlicheSamples/Quellen,90Tage-Seiten, Cancellation/Retry; realerRoundtrip offen |
| P2§7 Ziele/manuell/Quellen/Korrektur | vorhanden und geprüft · Mock/SQLite | Nutrition + HealthNutritionState | KeineerfundeneYAZIO-ZielAPI, manuellgetrennt, fehlend≠0, UUIDs undLöschabgleich |
| P2§7 eigeneHealth-Exporte | vorhanden und geprüft · Adapter/Quellenvertrag; nativ blockiert | AppleHealth/FormHealthDayBridge/healthBridge | Nur eigeneSamples, bewussteKorrektur/Löschung, Nachweisebleibenauffindbar; tatsächlicherGeräteaustausch offen |
| P2§8 globaleSuche/Katalog | vorhanden und geprüft · Suchlogik/Navigationvertrag | LocalSearch/ExerciseDetail/ProgramDetail, lokaleSuchhistorie | EchteIDs, Filter/Favoriten, FlatListWindowing; keinStartfreierWorkouts |
| P2§8 ruhigesHome/gruppierteSettings | vorhanden und geprüft · Quellcode/Hook | Home/More/Appearance/GymPreferences | EineHauptaktion, optionaleEinzelnotiz, bestätigteZählung, Termineaktuell, persistenteSettings |
| P2§8 KeepAwake/Haptik/Ton | vorhanden und geprüft · Adapter; nativ blockiert | WorkoutKeepAwake/NativeSettings/Design | GetrennteOpt-ins, Fokus/AppState/Unmount, verspäteteAktivierungaufgeräumt; Hardwarewirkung offen |
| P2§8 Widgets/LiveActivity | teilweise; nativ blockiert | widgetData/WidgetSync/SwiftUI-Zeitstempel | KonkreteTerminzählung, CapabilityFallback/Ende; eigener Multi-Target-Signierungsweg undGeräteabnahme offen |
| P1§2/P2§8 Aufräumen/Altbestand | bewusst entfernt bzw. vorhanden und geprüft | REMOVED_FEATURES/Archiv/Health | DoppelteWasser-/Settingsflächen entfernt; Journal/Habits/Story/CSV/History zugänglich |
| P1§8/P2§9 TS/Switch/Linking/Lockfile/Regression | vorhanden und geprüft · lokaleGates | package-lock/test:all/typecheck/lint | TatsächlicheGesamtlogs; kein any-/ts-ignore-Ausweichen |
| P1§8/P2§9 Prebuild/Entitlements | vorhanden und geprüft · erzeugteNativeProjekte | Standard150001 + optionalHealth150001 | Standard{}, optionalnurHealthKit, Iconreadback/Autolinking; keinSwift-Compilebeweis |
| P1§8/P2§9 Pods/Xcode/IPA | nativ blockiert | RELEASE_BUILD_15, vorhandeneWorkflows/Skripte | LinuxohneXcode/Pods/Signierung; exakterCI-/Mac-Weg, keinebehaupteteIPA |
| P1§8/P2§9 SE/VoiceOver/Recordings/FPS | nativ blockiert | TEST_MATRIX_15_SECOND_PASS | KeineverfügbarenGeräte/Simulatoren; Asset-Sheet ausdrücklichkeinGerätebeweis |
| P1§10/P2§10 Auslieferung | vorhanden und geprüft · Quellen/Dokumente; finaler Paketstatus im beiliegenden Prüfmanifest | vollständige Source-ZIP + Dokumente/Logs/Patch | Erstes Paket bleibt separat; Paketfreigabe erst nach erfolgreichem Patch-, ZIP-CRC-, Manifest- und Hashcheck; konkrete Ergebnisse in den Paketmanifesten |

## Zusätzliche Befunde in der zweiten Schlusskontrolle

Diese Fehler wurden während des tatsächlichen Reviews gefunden und korrigiert: unsichtbare leere Motion-Wrapper bei Reorder/Extras/Kopie, falsche Vorwert-Zuordnung nach ausgelassenem Satz, Vergleich trotz geändertem Tempo/Block, ignorierte positive rechte Last bei linker Null, Home-Memo ohne Terminänderung, optimistische Home-Bestätigungszahlen, unbeachtete Main-Zielroute im Custom-Tab-Fallback, opt-in-abhängiger sachlicher Leerzustand, Klartextexporte ohne abschließende Cachebereinigung und ein Galerie-Text, dessen Figur-Opt-in nicht konsequent war. Die jeweiligen Domain-/Hook-/Exporttests und tatsächlichen Aufrufer sind in den Ergebnisdokumenten verknüpft.

Keine ausstehende native Abnahme wurde durch einen Testadapter, einen Prebuild oder ein gerendertes Asset-Sheet in „bestanden“ umbenannt.
