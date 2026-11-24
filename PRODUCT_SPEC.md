> Historischer Stand DEEP 8.0 oder V7. Aktuelle Änderungen und Prüfungen für 8.1 Fresh stehen in `RELEASE_REPORT.md`; die automatische Migration ist in Fresh deaktiviert.

# Funktionsstatus FORM 8
`implemented` = Code/UI vorhanden; `tested` = betroffene reine Logik/SQL geprüft, nicht native UI; `needs-device-test` = native End-to-End-Abnahme offen; `planned` = nicht vollständig enthalten.

| Master-Prompt-Bereich | Stand |
|---|---|
| 0–3 Marke, Shell, Tabs, Onboarding | implemented / needs-device-test; Systemschrift, kg/km, keine vollständigen Unit-/Theme-/Font-Optionen |
| 4 Gym V2 | implemented / tested: typed sets, RPE/RIR, Seiten, Notizen, Drafts, Vorwerte, Gewichtssteps, Pausen, History, Review, PR, Warm-up/Scheiben, Gruppenschema, Vorlagen-Vorgaben. Mehrere Blöcke je Routine, automatische AMRAP-/EMOM-Auswertung und vollwertige Intervallprogramme planned |
| 5 Katalog | implemented / tested: DE/EN-Aliase, Filter, Tippfehler-Ranking, Seiten, opt-in Bilder; vollständiger gepinnter Offline-Vollkatalog, native Virtualisierung, Muscle Maps, vollständige Custom-CRUD/Equipmentprofile planned/teilweise |
| 6 Fortschritt | implemented / tested: Gewichtsverlauf/Zeiträume, Zeitachse, Mittelwerte, Kraft-Analytics, lokale Body-Scan-OCR-Prüfung, Korrektur/Vergleich, Cardio/Performance/Maße. Vollständige individuelle Trendbänder, Zone-2-Import, private Fotos planned |
| 7 Journal | implemented / tested: Datum/Tags/Suche/Reflexion, Habit-Rhythmus/Pause/Archiv, If-then, Recovery und manuelle Ernährung; Kalender-/native Reminder- und Fotoausbau planned |
| 8 Coach | implemented / tested: lokale belegbare Regeln, vier Töne; kein erfundener KI-/Cloud-Dienst; zusätzliche Insights planned |
| 9 Easter Eggs | teilweise implemented: Film Room, echte Tickets, erste Session, Timerformat, Meilensteine, Fokus/Papierdetails; nicht alle 20, native Animationen offen |
| 10 Zusatzfunktionen | teilweise implemented: Gym-Tools, Planung, Maße/Performance/Ernährung aus V7, neue Studio-Notizen; native Health/Watch/Widgets/Live Activities, vollständige Import-/Erinnerungsfeatures planned |
| 11 Sharing | implemented / tested: fünf Vorlagen, Privacy-Auswahl, reale Metriken; needs-device-test: capture/share, native Auflösung; kein vollwertiger Story-Designer |
| 12 Migration | implemented / tested: relationaler Kern, Legacy-Snapshot, atomarer SQL-Write/Restore, sichtbare Fehler, Undo-Import-Snapshot; needs-device-test: Expo-Migration. Vollnormalisierung, verschlüsseltes Backup und universelles Merge planned |
| 13–14 Bedienbarkeit/Sicherheit | implemented: lokale Daten, optionale Bilder, Basis-Accessibility, reduzierte Bewegung, Validierung, keine Tracker hinzugefügt; Geräte-/Dependency-Audit und vollständige Accessibility/Privacy-Abnahme offen |
| 15–18 QA/Release | tested: 13 Suiten, 208 gezählte Einzelprüfungen; native CI/IPA und Screenshots nicht ausgeführt; Dokumentation vorhanden |

## Hauptabläufe
Heute → geplante Session direkt starten oder Training auswählen → Übung hinzufügen → Satztyp und Werte eingeben → Satz bestätigen → Pause/Gruppe → Session beenden → Review. Laufende Session bleibt im globalen Mini-Balken und in der Datenbank. Training → Vorlagen → Übungsreihenfolge/Sollwerte → starten. Fortschritt → Gewicht oder Analyse → messen, korrigieren, Vergleich. Journal → Datum, Text, Tag, Rückblick oder Habit-Check. Mehr → Einstellungen, Coach, Story, Export, Backupimport, Recovery. Keine dieser nativen UI-Strecken wurde im Simulator bedient; Status bedeutet implementierter Code, keine Gerätefreigabe.

## 8.4 Ergänzung
Fresh Start und getrennte Datenbank: implemented / tested (Node). Backup-Center mit Merge und Restore: implemented / tested (Logik); native Krypto: implemented / needs-device-test, macOS-CI-Test vorgesehen. Mehrblock-Editor und Live-Zeitführung: implemented / tested (Logik), UI needs-device-test. Native Bottom Tabs: implemented / needs-device-test. Paper/Fokus/Jahresjournal/Datenqualität: implemented / tests siehe Release-Report. Die dortige offene Liste ist maßgeblich; ältere Spezifikationen sind historische Ziele.
