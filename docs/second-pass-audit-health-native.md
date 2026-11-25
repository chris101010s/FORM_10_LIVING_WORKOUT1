# SECOND PASS · Phase A · Health, Suche und native Funktionen

Stand: 25.11.2026. Geprüfte Basis: `form-15-first-pass`, Commit `05056e2185092d9cc530a9aad5d4935a2de969e0`. Marketingversion 15.0.0, derzeit Build **150000**. Für die zweite Runde ist **150001** vorgesehen. Bundle-ID `app.athleteos.personal`, Scheme `athleteos` und Datenbank `form-v84-clean.db` bleiben erhalten.

Dies ist ein **Audit vor Änderungen**. Gelesen wurden beide vollständigen Master-Prompts, `CHANGESET_15.md`, die Implementierungen und die zugehörigen Tests. In dieser Phase wurden weder Laufzeitcode noch Konfiguration oder Abhängigkeiten geändert. Die nachfolgenden APIs und Arbeitsschritte sind Vorschläge für die von Root freizugebende Umsetzungsphase. Ein lokaler Logiktest belegt keine iPhone-Funktion.

## 1. Geprüfte Grundlage und aktuelle Nachweise

| Prüfung im Audit | Ergebnis | Aussagegrenze |
| --- | --- | --- |
| `node tests/test-nutrition15.cjs` | Exit 0, **66 PASS** | Nährstoffabgleich, Quellen, Zeitzonen, Exportaufträge und gemockter Native-Adapter. Kein Swift-Compile. |
| `npm run test:native` | Exit 0, **57 PASS** | Bestehende Datums-/Notification-/Health-Import-/Widget-Logik, JSON und echte SQLite-Datei. Keine ausgelieferten iOS-Mitteilungen oder Widgets. |
| `node tests/test-build15.cjs` | Exit 0, **39 PASS** | Bestehende Version/Identität, Capability-Isolation, Lockfile und Shellsyntax. Noch Build 150000. |
| Synthetische Widget-Reproduktion mit tatsächlichen `widgetData`-/`weekOverview`-Funktionen | Fehler reproduziert, siehe Abschnitt 4 | Läuft unter Node nach TypeScript-Compile, kein Widget-Screenshot. |
| Umgebung | Linux x86_64; `xcodebuild` und `swift` nicht im PATH | Pods/Xcode/Simulator/physisches iPhone sowie tatsächliche Icon-Umschaltung sind hier nativ blockiert. |

Die vollständigen grünen First-Pass-Gates und der iOS-Metro-Export sind separat unter `docs/qa/15/` dokumentiert. Sie werden nicht als Tests noch fehlender Second-Pass-Funktionen ausgegeben.

## 2. §7 · YAZIO und Gesundheit

Statusbezeichnungen entsprechen dem Auftrag. Bei vorhandener und lokal geprüfter Logik bleibt die native Abnahme ausdrücklich separat offen.

| ID / Anforderung | Vorher-Status | Datei / Einstiegspunkt | Speicherweg | Test und offene Akzeptanz |
| --- | --- | --- | --- | --- |
| H01 Offizieller Weg YAZIO ↔ Health ↔ FORM | **vorhanden und geprüft** als Quellen-/Codeprüfung | `YAZIO_INTEGRATION.md`; `Nutrition.tsx` → Verbindungsanleitung | Kein YAZIO-Konto, kein Token, kein Passwort | Offizielle Seiten erneut geöffnet; siehe Quellen. Kein direktes API- oder Roundtrip-Versprechen. |
| H02 Echte Nährstofftypen und Quelle/UUID | **vorhanden und geprüft** auf Logikebene; **nativ blockiert** | `FormNutritionBridge.read`; `healthBridge.readNutrition`; `validateNutritionSample` | `healthNutrition.samples` mit kcal/Protein/Carbs/Fett/Wasser, UUID, ISO-Zeiten, `sourceRevision` | 66 Nutrition-Prüfungen. Swift-Abfrage auf Gerät offen. Wasser nur bei tatsächlichem Sample; kein Versprechen, dass YAZIO jeden angefragten Typ liefert. |
| H03 Automatische Abfrage beim Öffnen Gesundheit/Ernährung | **fehlt** | `NutritionScreen` besitzt nur ausdrücklich aufgerufene `read()`; kein Focus-/Mount-Sync | Kein entsprechendes Setting | Nach Freigabe: nur mit vorhandener Einwilligung und verfügbarem Modul; keine Dialoge beim bloßen Öffnen. |
| H04 Optionaler Foreground-Sync, Debounce, Aktualitätsgrenze, gemeinsame Sperre | **fehlt** | Kein Health-Sync-Koordinator; `busyRef` schützt nur eine `NutritionScreen`-Instanz | Keine Sync-Policy, keine Fensterabdeckung | Tests für gleichzeitige Trigger, schnelle Navigation, Rückkehr, Zeitzone, veraltete Ergebnisse und Abbruch nötig. Kein Polling ergänzen. |
| H05 Manueller Refresh und laufender Status | **vorhanden und geprüft** auf Logikebene | `Nutrition.tsx`: „Jetzt aktualisieren“, `busyRef`, `message` | Erfolgreicher Snapshot über `update` in `healthNutrition`; Meldung nur im Screenzustand | Fehlende Rechte/keine Samples werden ehrlich zusammengefasst. Keine zentrale Sperre zwischen mehreren geöffneten Seiten. |
| H06 Letzter erfolgreicher Sync nach bestätigtem Commit | **vorhanden aber fehlerhaft** | `Nutrition.read()` → `reconcileNutrition` → optimistisches `update`; Anzeige aus `data.healthNutrition.lastSync` | `lastSync` liegt schon vor Commit im RAM-Kandidaten | Bei `update() === false` erscheint eine korrekte Fehlermeldung, gleichzeitig aber die neue Zeit als „lokal gespeicherte Abfrage“. Autosync darf diesen RAM-Wert nicht als bestätigte Frische verwenden. Siehe Abschnitt 4. |
| H07 Fehler, letzter bekannter Stand und nachvollziehbare Aktualität | **teilweise** | `Nutrition.tsx`; `reconcileNutrition` | Alte Samples bleiben bei Fehlern/erfolglosen Typen erhalten. Nur ein globales `lastSync`; Fehlertext flüchtig | Kein pro Fenster/Typ bestätigter Stand, keine persistente letzte Fehl-/Abbruchabfrage. Abdeckungs-/Fehleranzeige ergänzen. |
| H08 Historie 7/30/90 Tage mit Seiten/Chunks | **teilweise** | `nutritionWindow` kann Tag oder Kalenderwoche; UI Tag/Woche; Swift `HKSampleQueryNoLimit` pro Typ | Bereits gelesene Fenster bleiben im Cache | Woche vorhanden; 30/90-Tage-Auswahl, fortsetzbare begrenzte Abfragechunks und paginierte Historie fehlen. Native/TS-Zeitfenster sind derzeit auf höchstens 32 × 24h begrenzt; nicht einfach 90 Tage übergeben. |
| H09 Deduplikation, Korrekturen, gelöschte Samples | **vorhanden und geprüft** auf Logikebene | `validateNutritionSnapshot`, `reconcileNutrition` | UUIDs; komplette erfolgreiche Fenster ersetzen nur ihre erfolgreichen Typen | Doppelte UUID, echte Null, Löschung, Korrektur, Quellenwechsel und Nachbartag getestet. Änderungen außerhalb erneut gelesener Fenster bleiben offen, keine Anchored-Query-Hintergrundgarantie. |
| H10 Quellfilter und manuelle Daten getrennt | **vorhanden und geprüft** auf Logikebene | `nutritionSources`, `nutritionForDay`; Quellenradio in `Nutrition.tsx` | `selectedSourceBundle`; separate `nutrition[]`/`healthEntries[]` | Mehrere Anbieter werden ohne Auswahl nicht addiert. Die Auswahl ist global; historische Ansichten benötigen verständliche Leerzustände bei nicht vorhandener gewählter Quelle. |
| H11 Wochenübersicht mit Vollständigkeit | **teilweise** | Sieben echte Tageszeilen in `Nutrition.tsx` | Samples plus ein `lastSync` | Fehlende Werte bleiben unbekannt. Keine belastbare Angabe „x von 7 Tagen / x Datentypen abgefragt“; nicht aus bloßer Sample-Anzahl vollständige Ernährung ableiten. |
| H12 Nährstoffziele aus YAZIO oder eigene FORM-Ziele | **fehlt**; kein bestätigter Ziel-Importweg | Keine Zieleingabe in `Nutrition.tsx`; allgemeine `goals` sind Leistungsziele | Keine eigenen Nährstoffziele | In den geprüften offiziellen Quellen kein nutzbarer Ziel-Exportvertrag nachgewiesen. Deshalb ausschließlich optionale leere manuelle **FORM-Ziele** vorsehen; keine YAZIO-Ziele erfinden. |
| H13 Apple-Watch-/Health-Tageswerte, Herkunft und Mehrquellen | **teilweise** | `FormHealthModule.readDay`, `healthPreview`, `mergeHealthPreview`, `AppleHealth.tsx` | Tages-IDs `apple-health:<Datum>:<Metrik>` in Gewichten/Erholung/Health-Einträgen | Schritt-/Distanz-/Energie-Statistiken, Puls, Schlaf, Gewicht vorhanden. Tagesimport verliert konkrete Quellenrevision/UUIDs zugunsten generischem „Apple Health“. Keine Quellenwahl für Aktivität; Mehrquellenverhalten dieses nativen Pfads nicht gerätegeprüft. Keine pauschale Watch-Erkennung behaupten. |
| H14 Bewusster Export abgeschlossener Workouts/Gewichte | **vorhanden und geprüft** auf Logikebene; **nativ blockiert** | `AppleHealth.exportSelected`, `prepareHealthExport`, `sendHealthExport`, `saveOwned` | Vor dem Native-Aufruf pending-Auftrag in `healthNutrition.exports`, danach Receipt | Stabile Sync-ID/Version/Fingerprint, eigene Quelle, tatsächliche UUID, Crash-/Retry-Modell geprüft. Keine Kalorienschätzung. Gewicht ohne Uhrzeit verlangt tatsächliche Eingabe. |
| H15 Explizite Exportkorrektur | **vorhanden und geprüft** auf Logikebene; **nativ blockiert** | Erneut ausgewählter eigener Eintrag → neue Sync-Version bei geändertem Inhalt | Gleicher Exportdatensatz, neue Version | Kein automatisches Zurückschreiben nach lokaler Korrektur. Eine lokale Änderung wird erst nach erneuter bestätigter Exportaktion übertragen. Native Ersetzung offen. |
| H16 Eigene Exporte löschen und wiederholen | **fehlt** | Keine native `delete`-Methode, kein Delete-Auftrag, keine UI-Aktion | Exportstatus bisher nur `pending` / `confirmed` | Nur eigene Quelle + Sync-ID + passende UUID/Version adressieren; vor Native-Löschung persistenter Auftrag; Abbruch/Retry/fehlendes bereits gelöschtes Objekt testen. Fremde Samples niemals löschen. |
| H17 Import-/Export-Schleifen verhindern | **vorhanden und geprüft** auf Logikebene | Native Gewichtsvorschau schließt `HKSource.default()` aus; Export verbietet `apple-health:`-IDs; Nährstoffabgleich entfernt eigene Samples | IDs und Herkunftsmarkierungen | Bei neuem provenancefähigem Tagesimport erhalten; Native-Roundtrip bleibt offen. |
| H18 YAZIO öffnen / regulärer Fallback | **vorhanden und geprüft** als URL-/Codeprüfung | Offizielle HTTPS-Hilfe in `Nutrition.tsx` | Kein URL-Scheme/Token gespeichert | Kein erfundenes `yazio://`. Die geprüfte offizielle Hilfe ist der vorhandene Fallback. Kein behaupteter App-Start. |
| H19 Standard offline und ohne HealthKit nutzbar | **vorhanden und geprüft** auf Config-/Logikebene | `healthBridge()` prüft iOS, echtes Modul, native `available()`; `HealthScreen` verbirgt AppleHealth-Route; Nutrition zeigt manuellen Weg | Bestehende lokale Daten bleiben verfügbar | Build15 und gemockte fehlende Capability getestet. Tatsächliche Standard-IPA weiterhin nativ blockiert. |
| H20 YAZIO → Health → FORM und Rückweg auf Gerät | **nativ blockiert** | Optionaler HealthKit-Build/Signierworkflow vorbereitet | Kein Produktivdatensatz verwendet | Passendes Profil, Mac/Xcode, echtes Gerät und eigenes YAZIO nötig. Keine neue Verifikation seit First Pass. |

### Tatsächlicher Health-Speicherweg

`AthleteData.healthNutrition` wird durch den bestehenden `validateHealthNutritionState` geprüft und als **`form_singleton` mit Schlüssel `healthNutrition`** in derselben SQLite-Datei gespeichert. Der Singleton enthält Samples, Quellenwahl, letzte Abfrage und Exportaufträge. Beim Sync wird dieser Integrations-Singleton ersetzt; dies ist keine pro Sample normalisierte SQL-Tabelle. Manuelle Ernährung liegt dagegen in `form_entity`/Collection `nutrition`, manuelles Wasser in `healthEntries`. Backup und echte SQLite-Neustarts mit Health-UUID/pending-Export sind in `test-migration15.cjs` enthalten. Neue Historiengröße braucht begrenzte Abfragen und nachvollziehbare Speicher-/Importtests.

## 3. §8, §1.4 und native Komfortfunktionen

| ID / Anforderung | Vorher-Status | Datei / Einstiegspunkt | Speicherweg | Test und offene Akzeptanz |
| --- | --- | --- | --- | --- |
| N01 Globale lokale Suche: Übungen, Pläne, Einheiten, Einstellungen | **fehlt** | Kein Search-Stack/Screen in `App.tsx`; nur `Explorer` in `Gym.tsx` | Kein Index/Verlauf | Reine lokale typisierte Suche + tatsächliche Detail-ID-Ziele ergänzen. Suche darf keinen neuen Trainingsstart auslösen. |
| N02 Suchverlauf optional, lokal | **fehlt** | Kein Setting/Verlauf | Vorgeschlagen: `settings.searchHistory`, `recentSearches` | Standard aus, max. 20 Einträge, bewusste Löschaktion; keine Suchbegriffe in Diagnoselogs. |
| N03 Übungsfavoriten, letzte Nutzung, Geräte-/Muskelgruppenfilter | **teilweise** | `Gym.Explorer`, `filterCatalog`, Favoritenumschalter | `favoriteExerciseIds` in `form_singleton`; Nutzung aus echten Workouts ableitbar | Favoriten und Geräte/Muskel/Level sowie 180ms Debounce vorhanden. Explizite „zuletzt verwendet“-Ansicht fehlt. |
| N04 Virtualisierter Katalog / richtige Bilder | **teilweise** | `Explorer` rendert `slice(page*18,...)` mit `.map`; `ExerciseDetail` und Katalogfotozuordnung | Bestehender lizenzierter Katalog / eigene Fotos | 18er-Seiten begrenzen DOM, sind aber keine virtualisierte Liste. Richtige Fotoquelle beibehalten; globale Ergebnisse virtualisieren, keine gleiche-Achse-FlatList in äußerem ScrollView. |
| N05 Ruhige freiwillig konfigurierbare Startseite | **teilweise**, Umsetzung bei Root | `Home.tsx` mit Plan/Fortsetzen als primärer Aktion | Keine `homeOverview`-Auswahl | Ruhiger First-Pass-Default vorhanden; optionale wenige Kennzahlen/Links fehlen. Keine zweite Hauptnavigation. |
| N06 Homescreen-Widget: nächster Plan und Wochenfortschritt | **vorhanden aber fehlerhaft**, native Darstellung zusätzlich blockiert | `widgetData`, `widgetTimeline`, `TrainingWidget` | Abgeleitete minimale Daten in Expo-Widget-Speicher/App Group; Einstellungen in SQLite | Andere Routine am selben Datum verdrängt heutigen Plan, reproduziert. Aus bestehender gemeinsamer Plan-/Occurrence-Logik ableiten. |
| N07 Live Activity: Sessiondauer/Rest aus Zeitstempeln | **teilweise** | `TrainingActivity.tsx`, `WidgetSync` | Props enthalten nur Satzanzahl, Status und formatierte `restEnd`-Uhrzeit | Keine Sessiondauer, kein systemseitig laufender Resttimer. Installiertes `@expo/ui` unterstützt `Text.timerInterval`, `countsDown`, `pauseTime`; daraus echte Zeitdarstellung ableitbar. Native Anzeige offen. |
| N08 Widget/Activity-Updates, Ende, Deep Link | **teilweise** | `WidgetSync` reagiert nach Save/Foreground, beendet Instanzen ohne Live/Setting; `athleteos://training` in `App.tsx` öffnet Training | Settings persistent; Instanzverwaltung Expo | Eigene Aktualisierungsqueue vorhanden. Sessionidentität nicht in Activity-Props; keine Lifecycle-Adaptertests. Deep Link startet kein Workout. Für neue Undo-/Timer-Events erweitern und Fehler sichtbar machen. |
| N09 Tatsächlicher Widget-/Live-Activity-Status | **teilweise** | Native `widgetsEnabled()` prüft nur `FORMWidgetsEnabled` im Info.plist | Kein belastbarer Runtime-Report | Config-Flag ist keine Prüfung von eingebetteter Extension, App-Group-Zugriff oder `ActivityAuthorizationInfo`. Diese Zustände getrennt ausweisen; nicht als funktionierende Signierung darstellen. |
| N10 Standard-Fallback ohne Widgets | **vorhanden und geprüft** auf Config-/Logikebene | `app.config.js`, Buildskripte; `WorkoutMiniPlayer` außerhalb Gym | Kein neuer Container; bestehende Session | Standard entitlements leer; Widget-Settings nur bei Flag sichtbar. Mini-Leiste bleibt. Echte kleine-iPhone-Abnahme offen. |
| N11 KeepAwake während fokussiertem aktivem Gym | **fehlt** | Keine Implementierung/Dependency | Kein Setting | SDK58 nennt `expo-keep-awake ~58.0.4` sowohl lokal als auch offiziell. Nach GO gezielt ergänzbar; Aktivieren nur opt-in + Fokus + aktive Session + AppState aktiv, Deaktivieren bei Tabwechsel/Finish/Pause/Unmount; asynchrone Rennen testen. |
| N12 Gruppierte Komforteinstellungen | **teilweise**, UI bei Root | `More.tsx`, `NativeSettings`, `schema.ts` | `settings` in `form_singleton`, Backup-kompatibel | Ton/Haptik, boolsche Motion, System/Hell/Dunkel und Paper-Schalter vorhanden. Motion-Level, Gym-Skala, Händigkeit, Charakter, Sprüche, KeepAwake, App-Icons fehlen. Theme beim Update erhalten. |
| N13 Haptik nach Einwilligung | **vorhanden aber fehlerhaft** für neue/fehlende Einstellung | `validation.ts`, `More.tsx`, `Gym.tsx`, `Design.tsx`: `haptics !== false` | Fehlender Wert wird als an behandelt | Bestehende explizite Einstellung erhalten. Neuinstallation/fehlende Einwilligung darf keine Haptik implizieren. Root/Data koordinieren Default. |
| N14 Vier App-Icon-Varianten und Umschaltung | **fehlt**, Umschaltabnahme **nativ blockiert** | `app.json` hat nur `assets/icon.png`; keine alternativen Asset-Sets, keine native API | Noch kein `appIcon` | Root erzeugt echte lokale Icons. Native API muss `supportsAlternateIcons`, konfigurierte Varianten, aktuellen OS-Wert, Fehler und erfolgreiche Rücklesung verwenden. Keine Scheinauswahl oder Erfolg vor Callback. |
| N15 Native Icon-Konfiguration | **fehlt** | Keine Alternate-App-Icon-Buildsettings im Projekt/Plugin | iOS-Asset-Katalog statt Gesundheitsdaten | Eigener Expo-Config-Plugin soll echte `.appiconset`-Assets und `ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES` erzeugen. Apples aktuelle Anleitung verlangt Buildsettings statt manueller CFBundleIcons-Manipulation. Kein zusätzliches npm-Icon-Paket nötig. |
| N16 Sekundäres Archiv/Export statt neuer Haupt-Features | **vorhanden und geprüft** als Codeprüfung | `More` → Archiv/Story/Jahr/Ernährung; `Gym` → Historie | Bestehende Collections unverändert | Keine Quick-Training-Aktion in Suche ergänzen. Root auditierte Share-/Copy-/Designdetails separat. |
| N17 Doppelte manuelle Wasserpflege | **vorhanden aber fehlerhaft** | `Nutrition.tsx` enthält Wasserpflege; `HealthScreen` hängt zusätzlich `MetricLog(['waterMl'])` unter Nutrition | Beide schreiben dieselbe `healthEntries`-Collection | Redundante Oberflächen für denselben Weg. Root übernimmt Entfernung des zusätzlich angehängten Panels; Altbestand erhalten. |
| N18 Notification-Reconciliation nach Undo/Skip/Finish/Discard (§5) | **teilweise** | `notificationPlan` und `NativeNotificationSync` | Native geplante Mitteilungen; Settings/Session in SQLite | Rest-ID enthält Session-ID und Endzeit; bestehende Queue cancelt veraltete IDs nach bestätigtem Save. Bisher nur Planlogiktests, keine gemockten nativen Cancel-/Schedule-Rennfälle, keine neuen `restTimerId`-/Undo-Ereignisse. Vollständigen Desired-State-Abgleich mit Adaptertests ergänzen. |

### Tatsächliche Widget-/Signing-Grenze

Die beiden bestehenden Releasepfade setzen `FORM_WIDGETS=0`. Das signierte Skript unterstützt HealthKit mit passendem Profil, weist Widgets1/Extension-Targets ab und prüft unerwartete App Groups/Push. Die ursprünglichen Widgetquellen und der opt-in Config-Plugin sind erhalten; ein eingerichteter, nativ geprüfter Multi-Target-Widget-Signierpfad existiert nicht. Ein solches Ergebnis darf auch im Second Pass ohne reale Profile/Xcode nicht behauptet werden. Standard-IPA und In-App-Minileiste müssen unabhängig davon funktionieren.

## 4. Konkrete Fehler und Reproduktionen

### 4.1 Widget verdrängt einen weiterhin offenen Plantag

Synthetische Ausgangslage: Montag 23.11.2026, aktive Planroutine `planned`; weitere Routine `other`. `widgetData(data, now, true)` zeigt vor einem Workout `Heute`. Danach wurde eine abgeschlossene Einheit derselben Kalenderdatumsgrenze mit **Routine `other`** eingefügt.

Tatsächliches Ergebnis der kompilierten Funktionen:

```text
widgetBefore.headline = Heute
widgetAfterUnrelatedRoutine.headline = Mo., 30. Nov.
widgetAfterUnrelatedRoutine.weekCount = 1
weekOverview(...).today.routineId = planned
weekOverview(...).today.completed = false
```

Ursache: `widgetData` verwendet nur eine Menge abgeschlossener Kalenderdaten; `weekOverview` prüft Routine/Plan-Kontext. Ein vorhandener allgemeiner Trainingstag darf als beobachteter Trainingstag zählen, aber nicht den fremden Plan-Termin erfüllen. Nach GO gemeinsame Occurrence-/Planlogik verwenden und Regressionstest ergänzen.

### 4.2 Sync-Erfolg in RAM ist noch kein gespeicherter Sync

Statisch bestätigter Pfad: `Nutrition.read()` erzeugt `healthNutrition.lastSync` durch `reconcileNutrition`. `AthleteProvider.update` veröffentlicht `next` im React-State **vor** `saveRepository`. Bei Schreibfehler bleibt `next` absichtlich im RAM; Rückgabe ist `false`. Die Meldung sagt dann korrekt, dass die lokale Speicherung fehlt. Die daneben gerenderte `state.lastSync.queriedAt` wird trotzdem als „lokal gespeicherte Abfrage“ beschriftet. Die neue Autosync-Policy muss aus dem bestätigten Datenstand lesen, sonst kann sie einen gescheiterten Sync für frisch halten.

Dasselbe Prinzip betrifft die Bezeichnung „Exportauftrag gesichert“ für einen im RAM verbliebenen pending-Auftrag. Der tatsächliche Native-Export ist bereits korrekt durch `saved === true` geschützt. Keine unbestätigte Side Effect wird für den Audit behauptet.

Der Data-Agent hat ein read-only `getRepositoryCommitStatus(): {savedAt: string|null; data: AthleteData|null}` beziehungsweise `confirmedData` im Store vorgeschlagen. Dessen Integration ist nach GO vorzuziehen. Kein zweiter paralleler Datenstore als Umgehung.

### 4.3 Capability und Betriebserlaubnis sind verschiedene Befunde

`healthBridge()` prüft tatsächlich vorhandenes Native-Modul, Konfiguration und `HKHealthStore.isHealthDataAvailable()`. Es behauptet keine konkreten Leserechte; das ist korrekt. `widgetsEnabled()` prüft dagegen nur ein Buildflag. Der Second Pass muss für Widgets/App-Icons zwischen „konfiguriert“, „im Bundle vorhanden“, „System erlaubt“, „letzte Operation erfolgreich“ und „auf Gerät geprüft“ unterscheiden.

## 5. Vereinbarte Schnittstellen für die spätere Umsetzung

Keine dieser Erweiterungen ist in Phase A implementiert.

### 5.1 Health-Sync und persistente Erweiterungen

- Existierendes optionales `healthNutrition` weiterverwenden; alte Felder und Version-1-Backups erhalten.
- Additiv `syncPreferences?: {onOpen?: boolean; onForeground?: boolean}`; automatisch beim Öffnen erst nach vorhandener Verbindung, Foreground ausdrücklich optional. Frische-/Debounce-Konstanten mit Tests, keine Dauerabfrage.
- Begrenzte `coverage`-Einträge pro bestätigtem Zeitfenster/Datentyp, damit 7/30/90-Tage-Abdeckung, Teilfehler und historische Aktualität ausdrückbar sind.
- Optionaler `lastAttempt` mit Zeit, Anlass, Status und sachlichem Fehlercode. Kein Erfolg vor Commit; kein falscher Status „Leserecht verweigert“ bei leerer Antwort.
- Optionale `formGoals` aus ausdrücklich eingegebenen Werten, leerer Default und klare Bezeichnung FORM. Keine Übernahme aus unbestätigter YAZIO-Quelle.
- Eigener Export-Löschauftrag mit `deletePending` / `deleted`, bestätigter Löschzeit und stabiler Identität. Native Scope ausschließlich eigene Quelle + Sync-Identifier/Version/UUID; Löschung muss nach Crash wiederholbar sein. Erneuter Export nach Löschung verlangt neue ausdrückliche Aktion.
- Tagesimporte für Aktivität/Watch um tatsächliche Herkunft erweitern; bestehende manuellen Daten und Tagesimport-IDs erhalten. Mehrquellenregel vor Summe festlegen und testen.

### 5.2 Root-/Data-/Workout-Koordination

| Oberfläche/API | Eigentümer und Vertrag |
| --- | --- |
| `LocalSearchScreen` | Health/native liefert Komponente mit typisiertem `onOpen(result)`; Root verdrahtet echten Stack. Ergebnistypen Übung/Plan/Workout/Einstellung mit stabiler ID, keine Startfunktion. Gym benötigt tatsächliche `initialWorkoutId`/`initialExerciseId`-Detailpfade. |
| Suchverlauf | Vereinbartes Setting `settings.searchHistory` (boolean, Default aus), zusätzlich optional `recentSearches: {query: string; lastUsedAt: string}[]`, maximal 20, Query maximal 150 Zeichen. Data validiert/backup-kompatibel; Schema beim Workout-Agent. |
| `WorkoutKeepAwake` | Wiederverwendbare Komponente; nur montieren/aktivieren für fokussierten aktiven Gym + opt-in. Root/Gym übergeben tatsächlichen Fokus. `settings.keepAwake` Default aus. Pausen-/Tabwechsel/Unmount/Foreground-Rennen testen. |
| `AlternateIconSettings` | Health/native liefert tatsächliche Capability-/Umschaltkomponente; Root integriert in More. `settings.appIcon?: 'ink'|'paper'|'blueprint'|'retro'` erst nach erfolgreicher nativer Rücklesung speichern. Restore darf tatsächlichen OS-Icon-Status nicht als bereits angewendet ausgeben. |
| Icon-Dateien | Root erzeugt `assets/icons/{ink,paper,blueprint,retro}.png`, je 1024 × 1024 opak, zusätzlich `-120.png`, `-180.png` und eigene SVG-Quellen. Ink als Primärsymbol, weitere echte Asset-Sets mit eindeutigem Native-Namen. |
| Native Capability-Bericht | Health/native liefert Laufzeitstatus getrennt nach HealthKit, Widgets/Live Activities und App-Icons. Health-Leserecht bleibt grundsätzlich nicht eindeutig diagnostizierbar. Root zeigt Werte in Werkstatt/Diagnose. |
| Notification-Sync | Health/native übernimmt bestehenden `NativeNotificationSync` und reinen Abgleich. Workout plant optional `restTimerId` + reale Restereignisse; bestehende `restUntil`/`restPausedMs` bleiben. Desired IDs aus Session/Timer/Endzeit, Abgleich aus bestätigtem Store. |
| Settings/UI/Motion | Root besitzt `App.tsx`, `More.tsx`, `Health.tsx`, Design/Motion/Copy. Data validiert vereinbarte Settings. Neue Health-/Search-Oberflächen nutzen Root-Motion/Copy-APIs nach Bekanntgabe; keine eigene verstreute Effektbibliothek. |

### 5.3 Abhängigkeiten

Einziger aktuell konkret begründeter zusätzlicher Native-Baustein: `expo-keep-awake ~58.0.4`. Die Version stimmt zwischen `node_modules/expo/bundledNativeModules.json` und offizieller SDK58-Dokumentation überein. Erst nach GO via SDK-kompatibler Installation und Lockfile aktualisieren. Alternative Icons können das vorhandene lokale Expo-Modul mit UIKit verwenden; kein unbekanntes Icon-Paket nötig. `expo-widgets` und SwiftUI-Text-Timer sind bereits installiert. Kein SDK-Wechsel.

## 6. Build 150001 und noch nötige Gates

| Punkt | Vorher-Status | Umsetzung / Abnahme nach GO |
| --- | --- | --- |
| Interne Buildnummer | **fehlt** für Second Pass; derzeit 150000 | `app.json` iOS/Android auf 150001; Prüfungen in beiden Buildskripten, Test und Manifest konsistent. Marketingversion unverändert. Historische Logs nicht umschreiben. |
| Standardcapabilities | **vorhanden und geprüft** auf Config-/Prebuild-Ebene | Erneut prüfen: kein HealthKit, App Group, Push, Widget-/Live-Activity-Flag; Icon-/KeepAwake-Funktion benötigt keine daraus abgeleitete Gesundheitsberechtigung. |
| Optionales HealthKit | **vorhanden**, native Ausführung **blockiert** | Native Ergänzungen wirklich kompilieren, sobald Mac/Signierung verfügbar. Lokaler Prebuild ist kein Ersatz. |
| Alternate-Icon-Katalog | **fehlt**, Umschaltung **nativ blockiert** | Asset-Größen/Opazität/Registry; erzeugte `.appiconset` und Xcode-Buildsettings prüfen; später `supportsAlternateIcons` und tatsächliche Umschaltung mit Callback/Readback. |
| Neue Logik-/Adaptertests | **fehlt** | Autosync-Sperre/Debounce/Freshness/Fehler/Abbruch; 90-Tage-Chunks und Teilerfolg; exportierte eigene Löschung/Retry; Herkunft; Suchrouten/Verlauf; KeepAwake-Lifecycle; Notification-Cancel/Reschedule/Undo; Widget-Timer/Occurrence; fehlende Native-Capabilities. |
| Vollständiger Releasegate | First Pass geprüft; Second Pass **offen** | `npm ci`, alle bestehenden/neuen Tests, `tsc --noEmit`, Lint, Doctor/Config, isolierter iOS-Metro-Export, Standard/optional Prebuild. Native Pods/Xcode/IPA/Simulator/Gerät nur als bestanden melden, wenn tatsächlich ausgeführt. |

## 7. Erneut konsultierte Primärquellen

Alle folgenden Quellen wurden am 25.11.2026 im Audit tatsächlich geöffnet beziehungsweise über die offizielle Dokumentationssuche gelesen. Die Aussagen sind bewusst auf das beschränkt, was die Quelle trägt.

1. [YAZIO und Apple Health](https://help.yazio.com/hc/de/articles/360018833998-Yazio-und-Apple-Health): dokumentierte Richtungen für Nährstoffe/Körperwerte und Aktivität/Workouts; Hinweise zu Überschneidungen und Quellenpriorität. Kein Vertrag, dass jede konkrete Nutrition-Sample-Art immer vorliegt.
2. [YAZIO: unterstützte Anbieter](https://help.yazio.com/hc/en-us/articles/360004140898-Which-apps-devices-can-connect-with-Yazio): Apple Health kostenlos verfügbar, Verbindung über Profil/Automatische Erfassung. Das ist keine Aussage über kostenlose Apple-Signierrechte für FORM.
3. [YAZIO: Datenexport](https://help.yazio.com/hc/en-us/articles/52664956728337-Can-I-export-my-data-from-Yazio): derzeit kein regulärer In-App-Export. Kein erfundener Datei-/Ziel-API-Weg.
4. [Apple: Schutz der Health-Daten](https://developer.apple.com/documentation/healthkit/protecting-user-privacy): separate Einwilligung pro Typ; verweigerter Lesezugriff ist der App absichtlich nicht eindeutig erkennbar; gesperrtes Gerät kann Lesezugriff verhindern.
5. [Apple: Löschen eigener Health-Objekte](https://developer.apple.com/documentation/healthkit/hkhealthstore/delete(_:withcompletion:)): App darf nur selbst gespeicherte Objekte löschen; Schreibrechte bleiben erforderlich. Daraus folgt eine eigene, streng begrenzte Löschaktion statt allgemeinem Health-Löschen.
6. [Expo SDK58 KeepAwake](https://docs.expo.dev/versions/latest/sdk/keep-awake/): empfohlene Version ~58.0.4; tagbezogene Aktivierung/Deaktivierung und Verfügbarkeit. In der installierten Expo-Versionsliste unabhängig abgeglichen.
7. [Apple: Alternate App Icons konfigurieren](https://developer.apple.com/documentation/xcode/configuring-your-app-to-use-alternate-app-icons): zusätzliche Iconsets über Xcode-Buildsettings; generierte CFBundleIcon-Einträge nicht manuell überschreiben.
8. [Apple: Icon-Asset-Katalog](https://developer.apple.com/documentation/xcode/configuring-your-app-icon): 1024 × 1024 als Basis für automatisch erzeugte Größen, zusätzliche Sets müssen im Build eingeschlossen sein.
9. [Apple: `supportsAlternateIcons`](https://developer.apple.com/documentation/uikit/uiapplication/supportsalternateicons) und [`setAlternateIconName`](https://developer.apple.com/documentation/uikit/uiapplication/setalternateiconname(_:completionhandler:)): tatsächliche Systemverfügbarkeit prüfen; bei Fehler bleibt der vorherige Icon-Name; UI-Erfolg erst nach tatsächlichem Callback und Rücklesung.

**Phase-A-Ergebnis:** Die vorhandene HealthKit-Domäne ist eine nutzbare Grundlage. Die neuen Sync-/Historien-/Lösch-/Such-/KeepAwake-/Icon-Funktionen sind keine bereits abgenommenen First-Pass-Funktionen. Native Compile-, Signierungs-, Simulator- und Gerätetests bleiben ausdrücklich offen. Umsetzungsbeginn erst nach Root-GO für die zusammengeführte Auditbasis.

## Nachherstand nach der Umsetzung

Die obenstehenden Befunde bleiben als vor den Änderungen gesichertes Audit erhalten. Tatsächliche Implementierung, Speicherwege und nachher erreichte Prüfebene sind in `docs/second-pass-health-native-delivery.md`, `YAZIO_INTEGRATION.md`, `RELEASE_BUILD_15.md` und im Nachherregister von `SECOND_PASS_AUDIT.md` dokumentiert. `TEST_MATRIX_15_SECOND_PASS.md` verknüpft die tatsächlichen Logs: Health172, Native97, Search49, Standard-/HealthKit-Prebuild und Doctor20/20. Swift-/Xcode-/IPA-/Geräteabnahme und ein vollständiger signierter Widget-Multi-Target-Build bleiben ausdrücklich offen.
