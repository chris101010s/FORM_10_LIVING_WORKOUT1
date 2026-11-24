> Historischer Stand DEEP 8.0 oder V7. Aktuelle Änderungen und Prüfungen für 8.1 Fresh stehen in `RELEASE_REPORT.md`; die automatische Migration ist in Fresh deaktiviert.

> Historischer V7 / früherer FORM-Entwicklungsstand. Für dieses Paket gelten RELEASE_REPORT.md, PRODUCT_SPEC.md, TEST_MATRIX.md und BUILD_WINDOWS_TO_IPHONE.md.

# ATHLETE OS 7.0 – Was ist neu gegenüber 6.0?

## Gym
- 233 neue Offline-Fallback-Übungen; beim Cloud-Build optional über 800 Originalübungen von free-exercise-db.
- Übungs-Level filtern, verwandte Übungen und mehrere Bilder anzeigen (sofern in Originalquelle).
- Eigene Übungen erstellen, bearbeiten, löschen – mit Schutz historischer Referenzen.
- Aufwärm-, Arbeits- und Dropsätze unterscheiden; bestehende Sätze nachträglich bearbeiten.
- Trainingsnotizen und Session-Historie.
- Vorlagen duplizieren, verschieben und Wochenplan erstellen.
- Persönliche Kraftrekorde, Satzstatistik und Übungen über Zeit vergleichen.

## Athletik und Gesundheitstracking
- Freie Leistungsziele statt vorausgefüllter Zahlen.
- Körperumfänge und Diagramme, Recovery-/Schlafjournal.
- 28-Tage-Athletik-Report, Wochenübersicht und Kraft-/Ausdaueranalyse.
- Cardio- und Leistungseinträge nachträglich ändern oder sicher löschen.

## Robustheit
- Alte V6-Backups kompatibel; neue Felder starten leer.
- Strengere Validierung, Speicher- und Recovery-Tests.
- Deutlicher Hinweis bei Offline-Katalog statt impliziter Vollständigkeitsbehauptung.
- GitHub Actions mit xcode-27 und automatischer Prüfung als kostenloser, aber noch praktisch zu bestätigender IPA-Build-Weg.
- 20 TypeScript-/TSX-Dateien syntaktisch geprüft plus ausführbare Regressionstests.

## Noch nicht zugesichert
- Kein fertig gebautes iOS-Release und keine von Xcode verifizierte IPA.
- Keine automatische Anmeldung bei YAZIO/FITINN.
- Kein praktischer Test des iPhone-Hintergrundtimers oder Apple-OCR-Moduls.

Vollständige Informationen: `README_DE.md`, `QA_REPORT_DE.md` und `docs/EXERCISE_DATA_LICENSE.md`.
