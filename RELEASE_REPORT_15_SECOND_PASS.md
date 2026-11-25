# FORM 15.0.0 · Zweiter Durchgang · Release-Bericht

Stand: **25. November 2026**, Build **150001**.

## Ergebnis und Abnahmegrenze

Der erste Durchgang wurde zuerst abgeschlossen, geprüft und als eigene ZIP ausgeliefert. Der zweite Durchgang arbeitet auf genau diesem gesicherten Quellstand weiter. Geliefert wird das vollständige aktualisierte bestehende Repository mit implementierten Funktionen, eigenständigen Assets, Upgrade-Patch, dokumentierter Datenhaltung und tatsächlichen Prüflogs.

**Quellcode, JavaScript-/SQLite-/Adapterprüfungen, generierte iOS-Konfiguration und iOS-Hermes-Export sind bearbeitet. Die native Release-Abnahme ist offen.** Auf diesem Linux-Host stehen weder Xcode, CocoaPods, Swift-Compiler noch ein iPhone-Simulator oder physisches iPhone zur Verfügung. Es wurde keine IPA erzeugt, keine App signiert, keine Überinstallation auf einem Gerät und kein echter YAZIO-Roundtrip ausgeführt. Die Lieferung behauptet deshalb keinen vollständig abgenommenen iPhone-Release.

Die genauen Befehle, Exit-Codes, Wiederholungsgründe und Nachweisgrenzen stehen in `TEST_MATRIX_15_SECOND_PASS.md`. `SECOND_PASS_AUDIT.md` enthält Vorher-/Nachher-Status beider Aufträge; die Detaildokumente zeigen konkrete Einstiegspunkte und Speicherwege.

## Reihenfolge und Identität

| Merkmal | Nachweis / Wert |
| --- | --- |
| Ursprüngliche gelieferte FORM-10-Basis | Git-Tag `form-10-supplied-baseline` |
| Abgeschlossener erster Durchgang | Commit `05056e2185092d9cc530a9aad5d4935a2de969e0`, Tag `form-15-first-pass` |
| Audit vor den Änderungen des zweiten Durchgangs | Commit `2e69cf1`, Tag `form-15-second-pass-audit` |
| Finaler Quellstand | Vollständige Commit-ID und Dateihashes im Paketmanifest |
| Marketingversion / Build | `15.0.0` / `150001` |
| Bestehende Identität | `app.athleteos.personal`, Scheme `athleteos` |
| Datenbank | `form-v84-clean.db`; SQL 9, JSON-Schema 4 |
| Technologie | Bestehendes Expo SDK 58 / React Native 0.88.1; kein SDK-Wechsel |
| Entfernte Repositories | Nur gelesen; kein Push, Merge oder CI-Lauf ausgelöst |

Der erste Durchgang migrierte SQL 8 auf 9 additiv. Die zweite Runde ergänzt optionale Entity-/Singleton-Inhalte innerhalb dieses Schemas und benötigt dafür keinen künstlichen Schemawechsel. Historische Werte oberhalb neuer Eingabelimits werden nicht abgeschnitten. Ein vorhandener Nutzerbestand erhält keinen ungefragten Reset oder erneutes Pflicht-Onboarding.

## 1. Verlässliche Speicherung und Wiederherstellung

Die Oberfläche trennt den aktuellen Arbeitsstand im RAM vom letzten bestätigten Datenbankstand. „Gespeichert“, Erfolgsstempel, Trainingszähler und davon abhängige native Aktionen folgen dem erfolgreichen Commit. Ein Write-Fehler bleibt sichtbar; Retry behält den Arbeitsstand. Funktionale Updates laufen serialisiert, damit schnelle Eingaben und parallel geänderte Einstellungen nicht den vorherigen Snapshot überschreiben.

Planrevisionen und Vorher-Snapshots bleiben erhalten. Automatische lokale Sicherungen verwenden eine konfigurierbare Rotation, standardmäßig sieben tägliche und drei Versions-/Vor-Import-Sicherungen; manuelle Sicherungen werden davon getrennt. Erst ein neu geschriebener, zurückgelesener und integritätsgeprüfter Snapshot erlaubt das Entfernen älterer automatischer Sicherungen. Die automatische Rotation startet nur, wenn der native Adapter den geforderten Backup-Ausschluss tatsächlich meldet.

Private Fotos werden über Asset-IDs und relative Pfade verwaltet. Neue Bilder werden orientiert normalisiert und ohne übernommene EXIF-Metadaten abgelegt. Bestehende Altpfade werden erhalten und nur gezielt migriert. Ein portables Vollbackup enthält und prüft die referenzierten Medien; ein ausdrücklich markiertes Recovery-Backup darf fehlende Medien benennen, ohne eine vollständige Sicherung vorzutäuschen. Importvorschau, Staging, Vorher-Snapshot und Rollback schützen vor beschädigten Dateien.

Der gemeinsame Text-Exporthelfer prüft Dateinamen, verwendet eindeutige Cachedateien, verifiziert den zurückgelesenen Inhalt und bereinigt nach dem Systemdialog auch Abbruch-/Fehlerpfade. Ein nicht löschbarer Rest wird als Fehler gemeldet. Der Systemdialog bestätigt nicht, dass ein externes Ziel eine Datei gespeichert hat.

**Belegt:** 276 Daten-Assertions mit echtem Provider/Repository und Node-SQLite, 66 Export-Adapterprüfungen sowie die bestehenden Migrations- und Repository-Regressionen. Das gemeinsame synthetische Szenario enthält 22 echte Fachaktionen mit Datenbank-Readback und Neustart. Native Dateischutz-, Prozessabbruch-, Share- und Kryptografieabnahme bleiben separat offen.

Details: `DATA_MIGRATION.md`, `BACKUP_AND_RECOVERY.md`, `docs/second-pass-audit-data.md`.

## 2. Plan und Training

Jede Satzzeile hat eigene Sollwerte statt einer einzigen Vorgabe für alle Sätze: Wiederholungen, Gewicht, RIR/RPE, Tempo, Pause, Einheit, Seiten-/Lastbezug und Notizen. Unvollständige Texteingaben bleiben als Entwurf erhalten. Batch-Änderungen und Textimporte haben eine Vorschau; mehrdeutige Übungen müssen zugeordnet werden.

Neue Trainings starten aus einem gespeicherten Plan. Historische freie Trainings und eine bereits aktive alte Session bleiben zugänglich. Zusätzliche Wiederholungen und Sätze benötigen ihre eigene bewusste Freigabe. Der dritte geplante Satz bleibt ein geplanter Satz; ein Extra-Satz wird anschließend separat angelegt. Undo stellt Satz- und Timerzustand atomisch wieder her.

Planversionen lassen sich vergleichen, kopieren und gezielt wieder aktivieren; Deloads sind sichtbare Änderungen. Verschobene oder ausgelassene Termine behalten ihre Identität. Zwei tatsächlich geplante Einheiten an einem Datum werden als solche behandelt; Wiederholungen erzeugen keine doppelte Erledigung.

Vorwerte passen zur tatsächlichen Zeilen-/Übungsidentität und bleiben unbestätigte Vorschläge. Progression berücksichtigt nur hinreichend vergleichbare, vollständige Daten und zeigt die Begründung. Geänderte Blöcke, Tempo, Lastbasis, Lücken, Deload oder Teilabbrüche werden nicht stillschweigend in eine Erfolgsserie umgedeutet. Vorschläge werden nicht automatisch angenommen; erreichbare Hantel-/Scheibenabstufungen sind sichtbar.

Gym-Komfort umfasst opt-in Fokusmodus, Links-/Rechtshand-Anordnung, Schriftstufen, private Gerätefotos und Geräteeinstellungen sowie optionales KeepAwake. Der Katalog verwendet eine tatsächlich begrenzte horizontale Listenvirtualisierung.

**Belegt:** 197 neue Trainings-Assertions, bestehende Plan-/Living-Workout-/Planmanagement-Regressionen und reale SQLite-Neustarts. Der zusätzliche Home-/Navigationstest prüft mit 47 Assertions die tatsächlich gerenderten Komponenten und Speicherübergänge; darunter fehlgeschlagener Satz-/Finish-Commit, Retry, allein geänderter Plantermin und wiederholte Detailnavigation im Custom-Tab-Pfad. Das ist kein iPhone-Touchtest.

Details: `docs/second-pass-training-result.md`, `CHANGESET_15_SECOND_PASS.md`.

## 3. Eigenständige Gestaltung, Motion und Sprache

Die eigene Assetbibliothek enthält **48 kanonische Motive insgesamt**, davon 32 Objektmotive und 16 unterschiedliche Pip-Posen. Hinzu kommen zehn neutrale Katalogkategorien, zwölf Tab-Zustände, 36 daraus exportierte Tab-PNGs und vier eigene App-Icon-Familien mit SVG sowie opaken PNGs in 1024/180/120 Pixeln. Die 70 SVGs der Motiv-/Kategorie-/Tab-Registry werden aus den tatsächlich implementierten Geometrien exportiert. Aliasse zählen nicht als neue Illustrationen.

Die Motive sind an echte Produktzustände angeschlossen, etwa Undo, Geräteeinstellungen, bestätigte lokale Speicherung, Kalender, Suchzustände und vorhandene Ernährungsdaten. Die Assetübersicht wurde aus dieser Registry gerendert und visuell geprüft. Sie ist eine Designübersicht, kein vorgetäuschter Device-Screenshot. Herkunft, Hashes, Schriftlizenzen und die Grenzen der bestehenden Übungsbilddaten sind dokumentiert.

Das Motion-System enthält 40 Varianten mit tatsächlichen Auslösern, zentralen Dauern, Reduce-Motion-/Aus-Fallback und Aufräumen bei Hintergrund, Unmount oder ersetztem Ereignis. Aktionen hängen nicht vom Ende einer Animation ab. Messzahlen werden nicht als Dekoration verdreht. Timer verwenden absolute Zeit bzw. reale Restwerte; Diagramme animieren echte Kurven und Trefferpunkte. Bestätigungszeichen entstehen erst nach erfolgreichem Speichern.

Das Textsystem enthält 104 eigene Texte für 26 Ereignisse in zwei Tonlagen. Ereignis-IDs und Wiederholungsbremse verhindern zufälligen Wechsel bei jedem Render. Figur, Texte, Haptik, Motion und Komfortfunktionen sind unabhängig steuerbar. Funktionshinweise und Fehler bleiben auch ohne Figur oder Sprüche sichtbar. Texte behaupten keinen PR, Sync oder Speichervorgang ohne passende Daten und beschämen weder Essen noch Körper oder Erholung.

**Belegt:** 913 Design-/Asset-/Copy-Assertions, 653 Prüfungen der tatsächlichen Motion-/Personality-Hooks mit kontrollierten React-/Native-Adaptern, 56 geprüfte reale Text-/Hintergrundpaare mit mindestens 4,5:1 Kontrast. Die hier geprüften Hook-Lebenszyklen ersetzen keine native Framerate-, VoiceOver- oder Animationsansicht.

Details: `DESIGN_SYSTEM_15.md`, `CHARACTER_BIBLE.md`, `ASSET_MANIFEST.md`, `ASSET_LICENSES_15.md`, `MOTION_CATALOG.md`, `COPY_GUIDE.md` und `docs/design/FORM_15_SECOND_PASS_ASSET_SHEET.png`.

## 4. Aussagekräftige Analysen und reduzierte Navigation

Die fünf Haupttabs bleiben Heute, Plan, Training, Fortschritt und Gesundheit. Home verwendet bestätigte Daten und höchstens eine gewählte Zusatzübersicht. Globale Suche führt über stabile IDs in echte Übungen, Pläne, Routinen, Trainings und Einstellungen. Historien-Suche ist optional; große Ergebnisse werden begrenzt. Erneute Navigation in denselben Detailbereich funktioniert auch nach einem manuellen Wechsel der Custom-Tab-Leiste.

Die neue Analyseansicht verwendet vorhandene Trainingsdaten für Zeitraum, Kalender, Verlauf, Rekorde, Soll-/Ist-Vergleich, Muskelverteilung und klar beschriftete Zusammenhänge. Monat/Jahr beziehen sich auf Kalenderdaten und gleich lange Vergleichsfenster. Geänderte Routinen werden über den jeweiligen Trainingssnapshot bewertet; fehlende Planhistorie wird nicht erfunden.

Warm-up, Bodyweight, Assisted, unilaterale Seiten und Lastbezüge werden getrennt behandelt. Volumen und e1RM erhalten passende Einheiten und Einschränkungen. Korrigierte oder gelöschte Workouts ändern die abgeleiteten Rekorde; das erste beobachtete Gewicht wird nicht automatisch als gebrochener Rekord gefeiert. Erholungszusammenhänge erfordern ausreichende verschiedene Tage und Streuung und werden als Beschreibung, nicht als Kausalität bezeichnet. CSV-Export braucht eine bewusste Freigabe und schützt Textzellen gegen Formelinterpretation.

**Belegt:** 84 neue Analytics-Assertions, die oben genannten 47 Komponenten-/Navigationsprüfungen, 49 Such-Assertions sowie die bestehenden Fortschrittstests. Synthetische Host-Laufzeiten sind keine iPhone-Performancewerte.

Details: `CHANGESET_15_SECOND_PASS.md`, `TEST_MATRIX_15_SECOND_PASS.md`.

## 5. Health und native Fähigkeiten

Der gemeinsame Health-Sync-Provider liegt hinter der Privacy-Sperre und verbindet Öffnen/Fokus sowie einen optionalen Vordergrund-Abgleich. Aktualitätsfenster, Debounce, Warteschlange und Abbruch vermeiden parallele oder unnötige Abfragen. Historische Ernährung wird in begrenzten Zeitfenstern importiert. Quellen, Geräte und Sample-IDs bleiben für Reconciliation erhalten; fehlende Daten bleiben unbekannt statt null Kalorien. Manuelle Eingaben bleiben getrennt.

Optionale FORM-Workout-Exports brauchen ausdrückliche Auswahl und bestätigten Abschluss. Stabile Exportidentität, Fingerprint, Version, ausstehende Operation und Tombstone schützen Korrektur-/Löschpfade und verhindern Import-/Exportschleifen. Nur eigene Samples werden geändert. Es wird kein direkter YAZIO-Login, erfundenes YAZIO-Ziel oder universell verfügbarer Rückweg behauptet.

Native Fähigkeiten werden tatsächlich abgefragt. App-Icon-Auswahl wird erst nach UIKit-Callback und Readback gespeichert. KeepAwake und Notifications leiten sich aus bestätigten Daten ab; die Tests berücksichtigen späte Aktivierung, Unmount, doppelte Benachrichtigungen, Undo und Finish. Widgetdaten beziehen sich auf konkrete Plantermine; Activity-Quellen behandeln Start, Pause, Rest und Beenden. Standardbuild und optionaler HealthKit-Build sind getrennt.

**Belegt:** 172 neue Health- und 97 native Adapter-/Contract-Assertions, echte Expo-Autolinking-Auflösung und generierte Standard-/HealthKit-Projekte mit Build150001. Standard-Entitlements sind leer; der optionale HealthKit-Modus enthält ausschließlich das HealthKit-Entitlement und die dazugehörigen Texte. Widgets sind in beiden Releasepfaden aus.

**Offen:** Kompilierung der Swift-Bridges und der Asset Catalogs, tatsächlicher Iconwechsel, KeepAwake-/Notification-Wirkung, iOS-Dateischutz und Backup-Ausschluss sowie echter Apple-Health-/YAZIO-Import bzw. unterstützter Export auf einem korrekt signierten Gerät. Ein vollständiger signierter Widget-Multi-Target-Buildpfad ist noch nicht eingerichtet und bleibt ein eigenständiger offener Build-Baustein.

Details: `YAZIO_INTEGRATION.md`, `RELEASE_BUILD_15.md`, `docs/second-pass-health-native-delivery.md`.

## 6. Gesamtprüfungen und verbleibende Gates

Der finale Prüflauf umfasst die 33 in `test:all` verdrahteten Gruppen, vollständiges `tsc --noEmit` und ESLint mit null erlaubten Warnungen. Das Lockfile wurde in einem unabhängigen Arbeitsverzeichnis frisch installiert. Expo Doctor, tatsächliche Prebuilds beider Releasekonfigurationen und ein iOS-JavaScript-/Hermes-Export wurden ausgeführt. Ergebnisse und Originalprotokolle sind in der Testmatrix verlinkt; der frühere einzelne Test-Lint-Fehler und die Online-Proxyfehler werden dort nicht verschwiegen.

Für die native Releasefreigabe fehlen noch:

1. CocoaPods, Xcode-/Swift-Kompilierung, Asset-Catalog-Prüfung und eine tatsächlich erzeugte, integritätsgeprüfte unsigned IPA; optional separat passende HealthKit-Signierung.
2. Reale Überinstallation mit dem eigenen vorhandenen Datencontainer, unverändertem Altbestand, aktiver Session und geprüftem Backup-Restore.
3. Bedienung auf kleinem und größerem iPhone: Tastatur, große Schrift, Links-/Rechtshand, VoiceOver, Reduce Motion, schnelle Navigation, Hintergrund/Sperren sowie echte Screenshots und Screenrecordings.
4. Tatsächliche HealthKit-/YAZIO- und native Komfortprüfung; für Widgets zusätzlich der noch offene Multi-Target-Signierungsweg.

Es gibt daher keinen erfundenen IPA-Hash und keine aus Mockdaten erzeugten Geräteaufnahmen. Im Paket liegen stattdessen der volle Quellstand, überprüfbare Tests, konkrete Mac-/GitHub-Buildpfade und eine genaue Upgrade-Anleitung. Vor Überinstallation Backup exportieren und die alte App nicht deinstallieren.

## Einstieg in die Lieferung

Zuerst `UPGRADE_EXISTING_REPO_SECOND_PASS.md` lesen. Der mitgelieferte binäre Patch ist gegen den bekannten öffentlichen Ausgangscommit geprüft; das Paketmanifest nennt den finalen Quellcommit und die Dateihashes. Neuere eigene Repository-Änderungen müssen beim Merge erhalten bleiben. Die vollständigen Quellen befinden sich in `source/`; der erste Durchgang bleibt zusätzlich als eigene unveränderte ZIP verfügbar.
