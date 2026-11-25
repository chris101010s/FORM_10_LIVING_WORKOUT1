# FORM 15 · Entfernt, zusammengeführt und archiviert

Entfernung betrifft aktive Produktpfade, nicht ungefragtes Löschen bestehender Nutzerdaten. Die Angaben beschreiben den gelieferten Code. Native Navigation/VoiceOver sind zusätzlich auf einem iPhone abzunehmen.

| Bisherige Funktion / Redundanz | FORM 15 | Zugang zu bestehenden Daten | Regressionsnachweis |
| --- | --- | --- | --- |
| Quick Training / Quick Workout / neuer leerer Start | Aus Heute, Training, Menüs und neuen Domain-Starts entfernt | Alte spontane Workouts im Trainingsarchiv | `test:plan15`, `test:living`, `test:deep` |
| Bereits laufendes freies Workout aus älterer Version | Als Legacy-Session fortsetzbar; kein Start einer weiteren freien Session | Training und Mini-Leiste; abschließen oder bewusst verwerfen | `test:plan15`, `test:migration15` |
| `athleteos://training` | Öffnet ausschließlich den Trainingstab; startet keine Session | Laufendes Training oder Planauswahl | Source-Review `App.tsx`, Startübergang-Tests |
| Paralleler Routine-/Template-Editor im Gym und freie Wochenzuordnung in Einstellungen | Ein gemeinsamer Plan-Editor | Plan; vorhandene Routinen zuweisen bzw. bisherigen Wochenplan ausdrücklich übernehmen | `test:plan-management15`, `test:migration15` |
| Mehrere unklare Startbuttons für Routinen anderer Tage | Explizit den gespeicherten Plan-Tag in Plan auswählen | Plan mit Programm/Woche/Wochentag und geplantem Datum | `test:plan15`, `test:plan-management15` |
| Offene Formulare, die beim Wechsel überschrieben werden | Persistente Plan- und Tagesentwürfe; Fortsetzen oder bewusst verwerfen | Plan > Entwurf fortsetzen | `test:plan-management15`, `test:repository15` |
| Große Sammlung von Karten auf Heute | Eine Tagesnotiz, ein Hauptbutton, Kalenderwoche | Historische Leistungen in Training/Fortschritt | Wochen-/Tages-Tests, Design-Code-Review |
| Mehrfach gleichzeitig offene Übungstabellen | Eine fokussierte Übung und kompakte Übungsliste | Dieselbe Session; direkte Übungsauswahl | `test:plan15`, `test:living` |
| Automatisches Nachladen weiterer Satzzeilen | Feste Sollzeilen und ausdrückliche `+ Satz`-Aktion | Bestehende Sätze unverändert | `test:plan15` |
| Unbegrenztes neues Rep-Feld bei festen Sollwerten | Geprüfte Zeilengrenze und `+ Wdh.` | Höhere Altwerte sichtbar; Übernahme/Korrektur bewusst | `test:plan15`, `test:migration15` |
| Doppelte Charts und pauschale Gewichts-Zieldatum-Prognose | Eine auswählbare tatsächliche Serie; keine Zieldatum-Prognose | Gewichtshistorie und selbst gesetztes Ziel erhalten | `test:progress15`, vorhandene Metriktests |
| Generische Motivations-/Gamification-Flächen im Hauptablauf | Entfernt; kurzer Sticker nur bei echtem Gewichtbestwert nach bestätigtem Save | Leistungsdaten und Ziele bleiben erhalten | `test:living`, Datenerhalt-Tests; native Motion offen |
| Journal | Sekundäre Gesundheitsseite | Gesundheit > Journal | Migration-/Backup-Tests |
| Habits und alte Gewohnheitseinträge | Sekundäre Gesundheitsseite / Werkstatt-Archiv | Gesundheit > Gewohnheiten | Migration-/Backup-Tests |
| Recovery und Schlafnotizen | Eigene Detailansichten, bearbeitbare Historie | Gesundheit > Erholung / Schlaf | Migration-/Backup-Tests; native Edit-UI offen |
| Cardio, Aktivität, Körpermaße und Leistungstests | Thematische Detailansichten | Gesundheit bzw. Fortschritt | `test:advanced`, `test:deep`, Migration-Tests |
| Ziele | Freiwillige Detailseite | Fortschritt > Eigene Ziele | Vorhandene Zieltests und Migration |
| Story-/Jahresrückblick und lokaler Coach | Aus Hauptscreens in sekundäres Archiv verschoben | Werkstatt > Archiv & Extras | Datenerhalt-Tests; Source-Review `More.tsx` |
| Übungskatalog und Favoriten | Sekundäre Bibliothek | Training > Übungsbibliothek & eigene Übungen | Katalogtests und Migration |
| Eigene Übungen und Fotos | Erhalten; im Tageseditor auswählbar und in Bibliothek bearbeitbar | Training > Übungsbibliothek & eigene Übungen | Migration-/Backup-Roundtrip mit synthetischem Foto |
| Alte manuelle Ernährungseinträge | Separater Bereich neben importierten Health-Werten | Gesundheit > Ernährung > manuell | `test:nutrition15`, Migration-/Backup-Tests |
| Alter CSV-Import | Sekundärer Import, kein behaupteter offizieller YAZIO-Export | Werkstatt > Archiv & Extras | `test:csv`; neue YAZIO-Hilfe dokumentiert Grenzen |
| HealthKit-Schalter in einem Build ohne Berechtigung | Nur bei tatsächlich verfügbaren nativen Fähigkeiten sichtbar | Manueller Ernährungs-/Gesundheitsbereich bleibt nutzbar | `test:nutrition15`, `test:build15`, Standard-Prebuild |
| Widgets und Live Activity ohne passenden Build | Im Standardmodus ausgeblendet und ohne Entitlement | Einstellungen/Daten bleiben erhalten; bestehender optionaler Buildcode bleibt | `test:build15`, `test:native` |
| FITINN/OCR / neue Community / Accountpflicht / neue KI-Chatseite | Nicht wieder eingeführt | Kein Bestandsdaten-Reset daraus abgeleitet | `test:compat`, Quellprüfung |
| Verschlüsselte und JSON-Backups | Erhalten, um Upgrade-Snapshot ergänzt | Werkstatt > Backup & Wiederherstellung | Backup-/Repository-Tests; Apple-Kryptografie-Compile nur auf Mac |

## Grenzen der Nachweise

Automatisierte Tests belegen Domain-, Persistenz- und Datenverhalten. Ein Quellpfad-Review beweist keine Bedienbarkeit auf einem kleinen iPhone. Die offenen Tests zu VoiceOver, Dynamic Type, Fokusmodus, Wiederöffnung nach Force Quit und dem echten Geräteupgrade sind in `TEST_MATRIX_15.md` ausdrücklich aufgeführt.

## Zweiter Durchgang · Build 150001

| Änderung | Aktueller Zugang / Datenerhalt | Nachweis |
| --- | --- | --- |
| Doppelter Wasser-Editor auf der Gesundheitsübersicht entfernt | Ein manueller Wasserbereich unter Ernährung → Manuell; vorhandene Einträge unverändert | `Nutrition.tsx`, Health-/Native-Gates |
| Stille Auswahl einer beliebigen Ersatz-Detailseite entfernt | Lokale Suche öffnet konkrete Übung/Plan/Einheit/Einstellung; unbekannte Route erklärt den Fehler | `App.tsx`, `Health.tsx`, Search-Gate |
| Vorherige pauschale Standard-Haptik | Neue Installation aus, vorhandene Wahl bleibt; Ton separat | Schema/Validation, Native-Gate |
| Einfache Satzentfernung als vermeintliches Undo ersetzt | Explizites Undo stellt den gültigen vorigen Zustand inklusive Timerbasis wieder her | Training-/SQLite-Gates |
| Inline-Fotos nicht länger der neue Standardspeicher | Bestehende Inline-Daten bleiben lesbar; bewusste private Übernahme und portable Medienbackups | Daten-Gate, `BACKUP_AND_RECOVERY.md` |
| Wiederholte Karten-/Einstellungsflächen zusammengeführt | Themen zentral; Health/Ernährung mit einem gemeinsamen Sync; Details separat | Design-/Health-Integration |
| Vorzeitige Erfolgsanzeigen korrigiert | Haken, Home-Zählung, Importstatus, Planentwurf und Receipt lesen bestätigte Daten | Provider-/UI-Hook-/Domain-Gates |
| Einfache unstrukturierte PR-/Jahresübersicht ergänzt | Rekordarchiv, Kalender, Monats-/Jahresfenster, alte Archiv-/Sharefunktionen bleiben | Analytics-Gate |

Es wurden keine Quick-Starts, FITINN-/OCR-Pflicht, neue Accounts, Community oder KI-Chatseite hinzugefügt. Figur, Sprüche, Home-Zusatznotiz, KeepAwake und Suchverlauf sind freiwillig. Native Widgets bleiben im Standardbuild aus; die vorhandenen Daten dazu bleiben erhalten.

## Build 150002 · App-Icon-Wechsel auf Nutzerwunsch entfernt

Entfernt wurden die Profil-/Suchroute „App-Symbol“, die Variantenwahl und Vorschaugalerie, `AlternateIconSettings`, die JS-/Swift-Icon-Setter, der Alternate-Icon-Config-Plugin sowie die Paper-/Blueprint-/Retro-App-Icon-Assets. Ink bleibt festes App-Symbol. Die Darstellungs-Themes bleiben unabhängig davon erhalten. Der vorhandene Datencontainer, die Datenbank und alle Trainingsdaten bleiben unverändert; ältere `settings.appIcon`-Werte werden für verlustfreien Backupimport inert mitgeführt. Der native Präsentationsprüfer wurde auf das tatsächlich ausgelieferte feste Icon umgestellt und bleibt vor IPA-Verpackung aktiv.
