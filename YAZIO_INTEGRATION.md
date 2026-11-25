# FORM 15.0.0 · YAZIO, Apple Health und lokale Synchronisierung

**Second Pass, Build 150001. Quellenstand: 25.11.2026.** Die Implementierung verwendet echte native HealthKit-Abfragen. Die hier ausgeführten Tests prüfen TypeScript, persistierbare Daten und ausdrücklich simulierte Native-Antworten. Diese Linux-Umgebung hat weder HealthKit noch ein iPhone oder ein angemeldetes YAZIO-Konto. Swift-Compile, Signierung, Berechtigungsdialog und tatsächlicher YAZIO-Roundtrip bleiben separat offen.

## 1. Offizieller Datenweg

YAZIO bleibt das Ernährungstagebuch. FORM liest freigegebene Daten über Apple Health und benötigt dafür weder YAZIO-Zugangsdaten noch Cookies, einen privaten API-Endpunkt oder einen erfundenen Export.

Die erneut geprüften offiziellen YAZIO-Seiten beschreiben:

- **Apple Health als kostenlosen Verbindungsanbieter**, unabhängig von YAZIO Pro. Die Einrichtung erfolgt über Profil → Automatische Erfassung → Anbieter → Verbinden. [YAZIO: unterstützte Anbieter](https://help.yazio.com/hc/en-us/articles/360004140898-Which-apps-devices-can-connect-with-Yazio)
- **Makro-/Mikronährstoffe und Körperdaten von YAZIO zu Apple Health**; in Gegenrichtung unter anderem Aktivitäten/Workouts und Körpergewicht. Daraus folgt keine Garantie, dass jeder angefragte Wert im konkreten Health-Datensatz liegt. Insbesondere Wasser bleibt ein optionaler angefragter HealthKit-Typ. [YAZIO und Apple Health](https://help.yazio.com/hc/de/articles/360018833998-Yazio-und-Apple-Health)
- **Keinen regulären integrierten Datenexport** nach dem Stand der geprüften Hilfeseite. FORM setzt deshalb kein vermeintliches YAZIO-Exportformat voraus. [YAZIO: Datenexport](https://help.yazio.com/hc/en-us/articles/52664956728337-Can-I-export-my-data-from-Yazio)

Für einen Import von YAZIO-Nährstoffzielen wurde in diesen Quellen kein tatsächlich nutzbarer dokumentierter Datenweg festgestellt. FORM bietet ausschließlich freiwillige, anfangs leere **FORM-Ziele** an. Sie werden vom Nutzer eingegeben, im Backup erhalten und nicht als YAZIO-Ziele oder Ernährungsempfehlung bezeichnet.

Der Button in FORM öffnet die geprüfte **HTTPS-Verbindungsanleitung**. Es gibt keinen behaupteten direkten App-Start und kein erfundenes `yazio://`-Scheme.

## 2. Tatsächlich implementierte Datentypen

| Daten | HealthKit-Typ / Einheit | Verhalten |
| --- | --- | --- |
| Nahrungsenergie | `dietaryEnergyConsumed`, kcal | Lesen |
| Protein | `dietaryProtein`, g | Lesen |
| Kohlenhydrate | `dietaryCarbohydrates`, g | Lesen |
| Fett | `dietaryFatTotal`, g | Lesen |
| Wasser | `dietaryWater`, ml | Optional lesen |
| Schritte | `stepCount`, Anzahl | Tagesimport mit Quellen-/Gerätewahl |
| Geh-/Laufdistanz | `distanceWalkingRunning`, km | Tagesimport mit Quellen-/Gerätewahl |
| Ruhepuls / Herzfrequenz | `restingHeartRate` / `heartRate`, bpm | Mittel der tatsächlich gelesenen Messungen einer gewählten Quelle |
| Aktivitätsenergie | `activeEnergyBurned`, kcal | Tagesimport einer gewählten Quelle |
| Schlaf | `sleepAnalysis`, Stunden | Vereinigung überlappender Schlafintervalle einer Quelle, am lokalen Kalendertag abgeschnitten |
| Gewicht | `bodyMass`, kg | Tagesimport der letzten Messung einer Quelle; eigener Export nur nach expliziter Auswahl |
| Abgeschlossenes Krafttraining | `workoutType`, `traditionalStrengthTraining` | Eigener Export mit tatsächlichen Start-/Endzeiten und aktiver Dauer |

Das lokale Modul setzt mindestens iOS 16.4 voraus. Die Energie-, Masse- und Volumeneinheiten folgen Apples dokumentierten Datentypen. [Energie](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/dietaryenergyconsumed) · [Protein](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/dietaryprotein) · [Kohlenhydrate](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/dietarycarbohydrates) · [Fett](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/dietaryfattotal) · [Wasser](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/dietarywater)

Es gibt **keine Nährstoff-Schreibfunktion**, keine geschätzten Trainingskalorien, keinen Import erfundener Watch-Daten und keinen automatischen Workout-Export. Die UI zeigt einen Geräte-/Quellnamen nur, wenn er von einem tatsächlichen Sample stammt. Ein manuelles Gewicht mit bloßem Datum verlangt für den Export zusätzlich die tatsächliche Messzeit.

## 3. Einrichtung, Autosync und letzter bestätigter Stand

`HealthSyncProvider` stellt allen Gesundheitsseiten einen gemeinsamen `NutritionSyncCoordinator` bereit. Root montiert den Provider innerhalb des App-Zugriffsschutzes. Ein Berechtigungsdialog wird ausschließlich durch die ausdrückliche Einrichtungsaktion geöffnet.

Nach dieser Einrichtung kann FORM beim Öffnen des Gesundheits- oder Ernährungsbereichs aktualisieren. Dieser Schalter ist im eingerichteten Zustand standardmäßig an und lässt sich abschalten. Die zusätzliche Aktualisierung bei Rückkehr in die aktive App ist **standardmäßig aus**. Sie liest die letzten sieben lokalen Kalendertage. Es gibt kein Hintergrundabonnement und kein periodisches Polling.

Automatische Anfragen werden um 350 ms gebündelt. Bereits bestätigte Abdeckung aller gewünschten Datentypen gilt für fünf Minuten als frisch. Ein manueller Refresh überspringt diese Frischeprüfung und kann eine wartende automatische Abfrage sofort freigeben. Ein gemeinsamer Job verhindert parallele native Abfragen. Ein neu gewählter Zeitraum wird dahinter vorgemerkt. Bei Hintergrundwechsel oder ausdrücklich betätigtem Abbruch werden keine später eintreffenden Ergebnisse dieses Jobs mehr übernommen; zuvor bestätigte Abschnitte bleiben bestehen. Eine erneute Foreground-Anfrage nach einem Abbruch wird korrekt hinter dem noch auslaufenden Native-Aufruf eingeordnet.

Der Koordinator liest für Frische und Status ausschließlich `getRepositoryCommitStatus().data`. Die Anzeige importierter Daten verwendet `confirmedData`. Ein noch nicht gespeicherter RAM-Kandidat darf keine neue erfolgreiche Abfragezeit oder Erfolgsmeldung erzeugen. Vor Beginn wird der Versuch gespeichert; jeder Abschnitt und der Abschluss werden über dieselbe serialisierte Store-Pipeline bestätigt. Schreibfehler behalten den letzten bestätigten Cache sichtbar. Retry steht im vorhandenen Speicherstatus beziehungsweise als neue Abfrage bereit.

Gesundheitshub und Ernährung zeigen laufenden Abgleich beziehungsweise Fehler und den letzten bestätigten Stand. `lastAttempt` hält Trigger, Zeitraum, Start/Ende, Status und bestätigte Abschnittszahl fest. Nach einem Prozessabbruch ist ein stehengebliebener `running`-Versuch erkennbar; der Nutzer kann neu abfragen. Bereits bestätigte Abschnitte werden beim Wiederholen idempotent abgeglichen.

Der optionale Text `connectionConfirmed` und das gezeichnete Verbindungsmotiv erscheinen erst nach dem **ersten bestätigten Import tatsächlich lesbarer Samples**. Das Ereignis erhält eine gespeicherte ID; spätere Abfragen verwenden das normale Sync-Ereignis. Ein abgeschlossener Berechtigungsdialog oder ein leerer Datenbestand löst kein Verbindungs-Erfolgssignal aus.

## 4. Historie, Reconciliation und Quellen

Die Oberfläche bietet **1, 7, 30 und 90 Tage**, jeweils bis einschließlich des gewählten lokalen Datums. Die Darstellung ist in Seiten zu sieben Tagen aufgeteilt. Native Abfragen verwenden höchstens sieben lokale Kalendertage pro Abschnitt. Ein 90-Tage-Lauf hat daher 13 Abschnitte. Kalenderarithmetik erhält 23-/25-Stunden-Tage bei Zeitumstellung; gespeicherte ISO-Zeitstempel werden nicht nachträglich umgeschrieben.

`FormNutritionBridge.swift` liefert echte `HKQuantitySample`-UUIDs, Datentyp, Einheit, Wert, Beginn/Ende und `sourceRevision` mit Name, Bundle-ID und optional Version/Produkttyp. Pro Typ gilt ein natives Abfragelimit: Werden 40.001 Samples erreicht, wird der Typ als nicht vollständig abfragbar behandelt und **nicht** mit einer abgeschnittenen Ergebnisliste ersetzt. Der TS-Adapter validiert Grenzen, Typen, Einheiten, eindeutige UUIDs und den tatsächlichen Abfragebereich.

Ein vollständig erfolgreicher Typ ersetzt nur seine Samples im inklusiven Start-/exklusiven Endfenster. Dadurch verschwinden gelöschte UUIDs und korrigierte Werte werden übernommen. Andere Zeiträume und fehlgeschlagene Typen bleiben erhalten. Ein erfolgreicher leerer Typ enthält anschließend keine lesbaren Werte; das ist kein gemessener Nullwert. Eine fehlgeschlagene Gesamtabfrage verändert den bisherigen Cache nicht.

`coverage` bewahrt bis zu 730 bestätigte Fenster/Typ-Abdeckungen. Für jede Tageszeile werden die Anzahl abgefragter Typen und die älteste zugehörige Abfragezeit gezeigt. **Abgefragt bedeutet nicht vollständig gegessen oder vollständig geloggt.** Die App behauptet keine Kenntnis fehlender Mahlzeiten. Fehlende Werte erscheinen als „unbekannt“, echte Null-Samples als `0`.

Die Ernährung wählt genau eine tatsächliche Bundle-Quelle. Unterschiedliche Anbieter werden nicht addiert. Innerhalb dieser Quelle werden ihre Nährstoffsamples summiert. Doppelt oder kumulativ falsch modellierte Einträge mit verschiedenen UUIDs kann FORM ohne eine entsprechende Mahlzeitenidentität nicht sicher erkennen; eine Korrektur muss beim Anbieter erfolgen. Änderungen außerhalb erneut gelesener Fenster werden erst beim nächsten Abgleich dieses Zeitraums sichtbar.

Manuelle/alte Ernährung bleibt in `nutrition[]`, manuelles Wasser in `healthEntries[]`; die Health-Kopie liegt getrennt in `healthNutrition`. Diese Bereiche werden nicht zu einer gemeinsamen Tageszahl addiert. Bestehende Einträge bleiben über „Eigene Einträge“ erreichbar, bearbeitbar und löschbar. Gesundheit besitzt keine zweite parallele Wasser-Erfassung mehr.

## 5. Tageswerte mit realer Herkunft

`FormHealthDayBridge.swift` liefert Tages-Samples einschließlich tatsächlicher Quelle sowie, soweit von HealthKit vorhanden, Gerätebezeichnung und lokale Geräte-ID. Die Quellenidentität kombiniert Bundle, Produkttyp und Geräte-ID/-Name. Zwei Geräte desselben Anbieters werden dadurch bei vorhandener Geräteinformation getrennt auswählbar. Bei mehreren Quellen wird **kein** Tageswert ohne Auswahl gebildet.

Die Vorschau zeigt Quelle, Bundle-ID, Sample-Anzahl, Abfragezeit und Werte. Sie ist noch kein gespeicherter Import. Erst „Ausgewählte Werte übernehmen“ speichert die Auswahl. `healthOrigin` enthält die tatsächlich verwendeten UUIDs, Quelle, Geräteinformation, Fenster, Zeitzone und Abfragezeit. Wiederholungen ersetzen nur die bestehenden `apple-health:<Datum>:<Metrik>`-Tageswerte; manuelle Einträge bleiben erhalten. Der native Tagespfad begrenzt sich auf 25.000 Samples je Typ; ein erreichter Grenzwert wird als unvollständige Abfrage behandelt.

Schlafintervalle verschiedener Quellen werden nicht zusammengezogen. Das Puls-Mittel ist ein Mittel gelesener Messungen, kein behaupteter zeitgewichteter Tagesdurchschnitt. Eigene von FORM exportierte Gewichte werden beim Tagesimport ausgeschlossen.

## 6. Bewusste Exporte, Korrekturen und Löschung

Ein Export entsteht nur aus einem lokal bestätigten manuell erfassten Gewicht oder einem bestätigten abgeschlossenen Workout. Vor dem Native-Aufruf wird ein `pending`-Auftrag gespeichert. Er enthält `FORM:<Typ>:<Eintrag-ID>`, Version und Payload-Fingerprint. Retry verwendet bei identischem Inhalt dieselbe Identität/Version. Geänderte Werte erhalten eine neue Version. Die tatsächliche HealthKit-UUID wird erst nach nativer Bestätigung gespeichert. [Apple: Sync-Identifier](https://developer.apple.com/documentation/healthkit/hkmetadatakeysyncidentifier) · [Sync-Version](https://developer.apple.com/documentation/healthkit/hkmetadatakeysyncversion)

Die neue Aktion „Eigenen Export aus Health löschen“ speichert zuerst `deletePending`. Die native Auswahl verlangt **eigene HKSource + exakte Sync-ID**; unbekannte/neue Versionen, abweichende Fingerprints und eine abweichende bestätigte UUID werden zurückgewiesen. Die Aktion entfernt ausschließlich eigene Samples zu diesem Auftrag. Fremde Anbieter werden nicht adressiert. Auch wenn das Objekt bereits fehlt, wird ein überprüfbarer Abwesenheitsbeleg zurückgegeben. Der bestätigte Zustand `deleted` bleibt als Tombstone erhalten; ein später ausdrücklich gewünschter Neu-Export erhält eine höhere Version. [Apple: eigene HealthKit-Objekte löschen](https://developer.apple.com/documentation/healthkit/hkhealthstore/delete(_:withcompletion:))

Native Schreib- und Löschaktionen derselben Exportidentität werden auch über mehrere Detailseiten hinweg serialisiert. Eine Löschung wartet auf einen zuvor begonnenen Export; dadurch kann ein verspäteter Schreibabschluss nicht hinter einem bereits bestätigten Löschauftrag erscheinen.

Eine lokale Korrektur oder Löschung verändert Health nicht heimlich. Die paginierte Exportliste bleibt unabhängig davon erreichbar, ob der ursprüngliche lokale Eintrag noch existiert. Offene Exporte und Löschungen können nach Fehler/Neustart wiederholt werden. Ein bereits nativ ausgeführter Vorgang mit fehlender lokaler Bestätigung wird nicht als lokal gespeichert dargestellt.

FORM schreibt weder Ernährung zurück noch exportiert es importierte Health-Gewichte. Damit entsteht kein automatischer Import-/Exportkreislauf. Ob YAZIO eigene FORM-Workouts oder Gewichte übernimmt, entscheidet YAZIO und muss separat auf dem Gerät geprüft werden.

## 7. Rechte, Standard-Build und Datenschutz

Apple verbirgt absichtlich den konkreten Status verweigerter **Leserechte**. Ein erfolgreicher Autorisierungsdialog belegt deshalb keinen Lesezugriff. Eine leere Abfrage kann fehlende Daten oder nicht freigegebene Daten bedeuten. FORM zeigt diesen Unterschied nicht als vermeintlich bekannte Diagnose an. Schreibrechte werden für den ausdrücklich gewählten Exporttyp separat angefragt und überprüft. [Apple: Schutz der Nutzerprivatsphäre](https://developer.apple.com/documentation/healthkit/protecting-user-privacy)

Der Standard-Build setzt `FORM_HEALTHKIT=0` und `FORM_WIDGETS=0`. Sein tatsächlich erzeugtes natives Projekt besitzt in der Second-Pass-Prüfung leere Entitlements und keine Health-Usage-Descriptions, App Group oder Live-Activity-Freigabe. Bereits lokal vorhandene Daten bleiben lesbar; manuelle Eingaben sind nutzbar. Das echte Modul prüft Buildkonfiguration und `HKHealthStore.isHealthDataAvailable()`, nicht nur die Plattformbezeichnung iOS.

Der optionale HealthKit-Build benötigt ein passendes Profil und eine entsprechende Signierung. Funktion auf kostenlos signierten Geräten wird nicht zugesichert. Der getrennte signierte Release-Workflow unterstützt **HealthKit mit Widgets aus**. Ein Multi-Target-Widget-Signierungspfad bleibt offen; der vorhandene Config-Schalter allein ist kein Nachweis eines funktionierenden Widget-Builds. Siehe `RELEASE_BUILD_15.md`.

Health-Daten, Quellenkennungen und Abfragestatus werden lokal in derselben SQLite-Datenbasis gespeichert. Backups enthalten diese Daten nur im ausdrücklich gewählten Backup-Weg. Diagnoseexporte sollen entsprechend der zentralen Diagnose-Allowlist keine Messwerte, Quellen-UUIDs oder Notizen enthalten. Es gibt keinen YAZIO-Serveraufruf und keine Health-Daten in CI-Fixtures oder Testlogs.

## 8. Nachweise und noch erforderlicher Gerätetest

Lokale Befehle: `npm run test:nutrition15`, `npm run test:health-second`, `npm run test:native-second`, `npm run test:search-second`, `npm run typecheck`, `npm run lint`. Tatsächliche Second-Pass-Protokolle liegen unter `docs/qa/15-second/`; die Gesamtmatrix führt Root in `TEST_MATRIX_15_SECOND_PASS.md`.

Die Health-Tests decken unter anderem 90-Tage-Abschnitte, DST, Quellenwechsel, reale Null gegenüber unbekannt, geänderte/gelöschte UUIDs, Teilfehler, Commitfehler, Debounce, gleiche/verschiedene gleichzeitige Trigger, Abbruch und erneutes Foreground, Importherkunft, Ziele und eigene Löschaufträge ab. Native-Adapterantworten sind ausdrücklich simuliert.

Auf einem entsprechend signierten iPhone bleiben auszuführen: tatsächliche YAZIO-Samples erzeugen → in Health Quelle/Einheit prüfen → explizite Einrichtung in FORM → Erstimport und automatisches Wiederöffnen → wiederholter Import ohne Duplikat → Korrektur/Löschung in YAZIO/Health → erneut gewähltes Fenster → fehlende/entzogene Leserechte → optional eigener Gewichts-/Workout-Export samt Korrektur und eigener Löschung → gegebenenfalls YAZIO-Rückübernahme. Dafür werden ein Mac/Xcode, ein passendes Profil, Gerät und ein eigenes YAZIO-Konto benötigt. Ein synthetischer Test ersetzt keinen dieser nativen Nachweise.
