# FORM 15.0.0 · Änderungen am vorhandenen Projekt

Stand: 25.11.2026. Ausgangspunkt ist das tatsächlich beigefügte FORM-10-Archiv, Git-Sicherung `b5f7d88` / `form-10-supplied-baseline`. SHA-256 des inneren Ausgangsarchivs: `b3258bd7079ccbcae5788af38879d13360257d34adf9802228813714cfce3e53`.

Es wurde kein neues App-Projekt angelegt. Der abschließende GitHub-Abgleich von `chris101010s/FORM_10_LIVING_WORKOUT1` (main, `e0066a240400d6c38480b9a0de4e119a8a50e5bb`) ergab identische App-, Test- und Buildquellen zur Hotfix-Basis. Ein zweites älteres Repository enthält den Switch-Hotfix noch nicht. Es wurden keine Remote-Dateien verändert; Details im Release-Bericht. Der genaue Release- und Teststatus steht in `RELEASE_REPORT_15.md` und `TEST_MATRIX_15.md`.

## 1. Identität und Datenerhalt

| Dateien | Änderung und Verhalten |
| --- | --- |
| `app.json`, `package.json`, `app.config.js` | Sichtbare und technische Version 15.0.0; Build 150000. Bundle-ID `app.athleteos.personal` und Scheme `athleteos` unverändert. |
| `src/data/repository.ts`, `relational.ts` | Bestehende Datei `form-v84-clean.db`; additive Migration von Datenbankschema 8 auf 9. Konsistenter Snapshot vor Migration, Transaktion, Integritätsprüfung, wiederholbare Migration, Fehler ohne automatischen Reset. |
| `src/data/validation.ts`, `schema.ts` | Neue optionale Planzeilen, ursprüngliche Sollwerte, Plan-Kontext, Entwürfe und Health-Nährstoffdaten. Erweiterungsfelder werden erhalten; unvertretbare Strukturen erzeugen Fehler. Historische Leistungen werden nicht nach neuen Limits gekürzt. |
| `src/data/context.tsx` | Unveränderliche funktionale Updates, geprüfter Session-Startübergang, bestätigter SQLite-Speicherzeitpunkt. `update` behält `Promise<boolean>`; `replace` liefert jetzt ebenfalls eine Speicherbestätigung als `Promise<boolean>`. RAM bleibt bei Schreibfehlern erhalten; erneutes Laden und Speichern getrennt. |
| `src/utils/backup.ts`, `BackupCenter.tsx`, `App.tsx` | Backupformat 4 und ältere Importe erhalten. Upgrade-Sicherung sichtbar/exportierbar. Ersetzen und Zusammenführen schließen die Vorschau erst nach bestätigtem Speichern. Ladefehler blockieren eine leere Neueinrichtung. |
| `tests/fixtures/v10-existing.json`, `v10-schema.sql`, Migration-/Repository-Tests | Synthetischer Bestandsnutzer; echte SQLite-Dateien, Fehler-/Rollback-Prüfung, Wiederholung, Restart, Backup-Roundtrip und große Datenmengen. Keine persönlichen Nutzerdaten. |

Die alten Speicherschlüssel bleiben berücksichtigt. Der frühere `athlete-os-v4-data`-Speicher wird nicht ungefragt als zusätzliche Quelle geladen. Die neuen Felder sind kein Anlass für neues Onboarding. Details: `MIGRATION_10_TO_15.md`.

## 2. Plan als Ausgangspunkt

| Dateien | Änderung und Verhalten |
| --- | --- |
| `App.tsx` | Fünf Tabs: Heute, Plan, Training, Fortschritt, Gesundheit. Kleine Profilverknüpfung. Planroutine als native Detailseite. Fokusmodus und Mini-Leiste für bestehende Sessions. |
| `Home.tsx` | Tagesnotiz mit einem primären Start-/Fortsetzen-/Plan-Button und kompakter Woche. Ruhetage bleiben neutral. |
| `Plans.tsx`, `PlanRoutineEditor.tsx`, `PrescriptionEditor.tsx` | Gemeinsamer Plan- und Tageseditor, Wochenzyklen, optional/Pflicht/Ruhe, pausieren/archivieren/aktivieren, explizite Datumswahl. Neue Starts benötigen vollständige Sollwerte. |
| `planEditorInput.ts` | Teilweise eingegebene Zahlen wie `1,` bleiben als Text im Entwurf erhalten. Der endgültige Plan wird erst mit gültigen aktiven Feldern übernommen. RIR ganzzahlig; vollständige Wiederholungsbereiche erforderlich. |
| `planOverview.ts`, `plans.ts` | Tagessicht und Wochenzählung anhand des ausgewählten Programms und seines Zyklus. Wiederholte Einheiten verdoppeln keine geplante Tageserfüllung. |
| `planImport.ts` | JSON-Importvorschau, kompatible alte Formate, Erhalt gleicher IDs und explizite Kopie bei Konflikten. Kollisionssichere neue IDs für Kopien. |

Offene Entwürfe werden vor dem Wechsel geschützt. Eine an mehreren Planstellen verwendete Routine wird entweder ausdrücklich für alle Stellen bearbeitet oder nur für diesen Tag kopiert. Bereits gestartete Sessions behalten ihre eigene Soll-Momentaufnahme.

## 3. Satzengine und laufendes Training

`plannedTargets.ts` enthält die reinen Sollwertfunktionen. `planWorkout.ts` setzt Planstarts, Zeilen, Freigaben, Abschluss, Korrektur und die Integritätsgrenzen um. `trainingEngine.ts`, `livingWorkout.ts` und die vorhandene Blocklogik bleiben die Grundlage.

- Ein Plan `3 × 3` erzeugt drei offene Zeilen und noch keinen absolvierten Satz.
- `4` Wiederholungen bleiben ohne Freigabe ein ungültiger Entwurf. `+ Wdh.` erhöht ausschließlich diese Zeilengrenze. Die Eingabe wird nicht still auf `3` gekürzt.
- Ein vierter Satz entsteht ausschließlich durch `+ Satz`. Wiederholte identische Abschluss-/Extra-Aktionen sind idempotent bzw. werden anhand des erwarteten Zustands zurückgewiesen.
- Soll, erlaubte Extras, tatsächliche Leistung, Warm-ups und ausgelassene Zeilen werden getrennt geführt. Bereiche, AMRAP, Zeit und Distanz behalten ihre passende Zieldefinition.
- Entwürfe mehrerer Zeilen, Extras, RIR/RPE und Notizen überstehen SQLite-Neustart und Backup. Historische höhere Werte bleiben erhalten.
- Neue interne Session-Übergänge erfordern einen vorhandenen Plankontext. Bereits laufende ältere freie Workouts dürfen fortgesetzt und abgeschlossen werden.

`Gym.tsx`, `InlineSetTable.tsx`, `SetEditor.tsx` und `LivingComponents.tsx` zeigen eine Übung im Fokus, feste Zeilen, Vorwerte als Vorschlag, sichtbare Zusatzaktionen und einen eigenen Review. Das Häkchen und der Trainingszettel werden erst nach bestätigtem Speichern als Erfolg gezeigt. Der Zettel verwendet tatsächliche Zeit, Arbeitssätze, Extras, fehlende Sätze, geeignetes Volumen und echte Bestwerte. Der freiwillige Share-Text enthält keine automatisch übernommenen Körper-/Ernährungswerte.

Uhren bleiben zeitstempelbasiert und laufen in kleinen Komponenten. Hintergrundwechsel stoppen die UI-Ticks; beim Rückkehr wird aus Zeitpunkten gerechnet. Restzeit lässt sich verändern, pausieren, fortsetzen und überspringen. Übungstausch ist eine bewusste Abweichung mit erhaltenem Ursprung. Das Archiv ist eine eigene Ansicht mit `FlatList`.

## 4. Ernährung und optionale native Integration

`modules/form-health/ios/FormNutritionBridge.swift`, `FormHealthModule.swift`, `nutritionTypes.ts`, `nutritionSync.ts`, `healthBridge.ts`, `Nutrition.tsx` und `AppleHealth.tsx` implementieren den tatsächlichen optionalen HealthKit-Datenweg. Er umfasst Nahrungsenergie, Protein, Kohlenhydrate, Fett und wahlweise Wasser; Datum/Zeitzone, Sample-UUID und tatsächliche Herkunft bleiben erhalten. Vollständige erfolgreiche Abfragefenster gleichen auch gelöschte Samples ab. Mehrere Anbieter werden nicht blind addiert.

Ausdrücklich gewählte Gewichts-/Workout-Exporte erhalten zuerst einen persistenten Auftrag und danach die native Bestätigung. Wiederholungsversuche verwenden dieselbe Sync-Identität und Version. Fremde Samples werden nicht korrigiert, Trainingskalorien nicht erfunden. Alte manuelle Ernährungsdaten sind separat lesbar und editierbar. Der Standardbuild hat keine HealthKit-Oberfläche mit vorgetäuschter Verfügbarkeit.

Die Swift-Dateien sind realer Quellcode, aber kein Nachweis eines nativen Compiles oder eines YAZIO-Roundtrips. Quellen, genaue Datentypen und Grenzen: `YAZIO_INTEGRATION.md`.

## 5. Gestaltung, Fortschritt und Aufräumen

- `src/art/doodles.ts`: zwölf neue eigene SVG-Zeichnungen; einzeln und als Atlas unter `assets/doodles/` exportiert.
- `Sketchbook.tsx`: Ink Reveal, gezeichneter Marker, Pencil Check, Paper Flip, Sticker Pop bei tatsächlichem Bestwert, Rest Dial, Chart Draw und Receipt Print. System-Reduce-Motion, persönliche Motion-Einstellung und AppState begrenzen Bewegung.
- `Design.tsx`: semantische Papier-/Tintenfarben, lesbarer Dunkelmodus, flache Notizflächen, sichtbare Touchflächen und umbruchsichere Abschnittsüberschriften.
- Vier lokale, lizenzierte Schriften samt OFL-Dateien; Fallback zeigt die App sofort mit Systemschrift.
- `Health.tsx`, `PerformanceHub.tsx`, `Weight.tsx`, `progress15.ts`, `TrendChart.tsx`: ausgewählte echte Übungsserie, reale Datumsabstände, sinnvolle Metriken und neutraler Körperverlauf. Keine erfundene Zieltermin-Prognose.
- `More.tsx`: Werkstatt mit gruppierten Einstellungen und sekundärem Archiv. Recovery-Historie bleibt bearbeitbar, alte CSV-Nutzung bleibt im Archiv.

Die detaillierte Aufräumtabelle steht in `REMOVED_FEATURES.md`; Designentscheidungen und noch offene native Sichtprüfung in `DESIGN_SYSTEM_15.md`.

## 6. Build und Regression

`package-lock.json` wurde erzeugt und mit sauberem `npm ci` geprüft. Expo 58, RN 0.88.1 und React 19.3.0 wurden nicht auf eine andere SDK-Generation gehoben. `expo-system-ui` ergänzt die bestehende Hintergrundfarb-Konfiguration. Das öffentliche Expo-API ersetzt den unnötigen direkten `expo-modules-core`-Eintrag. Lokale Mitteilungen benötigen keinen Push-Entitlement.

Die Workflows erzeugen einen Standardmodus ohne HealthKit/Widgets und einen getrennten signierten HealthKit-Modus. Skripte prüfen Identität, Fähigkeiten, tatsächliche Builddateien, Signierung soweit zutreffend, ZIP und SHA-256. Ein optionaler Simulator-Starttest ist als solcher benannt; er behauptet keine komplette Upgrade-Abnahme.

Neue Tests decken Planzeilen, Planverwaltung, Ernährung, Migration, Repository, Fortschritt und Build-Konfiguration ab. Die sinnvollen Baseline-Assertions bleiben erhalten. Drei alte Workout-Fixtures wurden ausdrücklich als Legacy-Sessions gekennzeichnet, damit sie weiterhin das alte Verhalten prüfen; der Switch-Test prüft nun auch den zentralen Toggle-Adapter. Der endgültige gemeinsame Prüflauf und seine Grenzen stehen in `TEST_MATRIX_15.md`.
