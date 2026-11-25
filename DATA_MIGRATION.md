# Datenmigration und bestätigte Schreibvorgänge

Stand: Second Pass von FORM 15.0.0, nach der unveränderten First-Pass-Referenz `form-15-first-pass` (`05056e2185092d9cc530a9aad5d4935a2de969e0`). Die Phase-A-Bestandsprüfung wurde separat als `form-15-second-pass-audit` (`2e69cf1`) gesichert.

## Identität und Formate bleiben erhalten

| Bestandteil | Weiterverwendeter Wert |
| --- | --- |
| iOS-Bundle-ID | `app.athleteos.personal` |
| Datenbankdatei | `form-v84-clean.db` |
| SQLite-Schema | 9; vorhandene FORM-10-Daten mit Schema 8 verwenden weiterhin den geprüften 8→9-Schritt |
| Datenschema im JSON | 4 |
| Älteres Datenbackup | `ATHLETE-OS-Backup`, außerdem kompatibles rohes Schema-4-JSON |
| Migrationssicherung | `FORM-Migration-Snapshot-v1` |
| Neues portables Medienpaket | `FORM-Portable-Backup-v1` |
| Native verschlüsselte Hülle | `FORM-Encrypted-Backup-v1` |

Der Second Pass benötigt keine neue leere Datenbank und keinen zusätzlichen DDL-Schritt: zusätzliche Collections verwenden die vorhandenen relationalen Tabellen. Die Erweiterung erhält deshalb keinen erfundenen SQLite-Schemawechsel. Eine eigene Versionssicherung mit `sourceKey: 15.0.0-second-pass` unterscheidet den Second Pass vom First Pass.

## Start und bestehende Daten

`src/data/repository.ts` prüft die Datei, den bisherigen Initialisierungsmarker und bei fehlender Datei ausschließlich die Namen bekannter älterer FORM-KV-Schlüssel. Fehlende, leere, beschädigte, teilweise angelegte oder zukünftige Datenbanken werden nicht als Erststart behandelt. Verwaiste ältere KV-Inhalte werden nicht ungefragt importiert. Ein Fehler hält den Schreibpfad an; die App zeigt Laden/Recovery an.

Für echte Schema-8-Daten bleiben die bestehenden Sicherungen erhalten: rohe alte Tabellen und validierte Daten werden vor DDL/Markeränderung sowohl in der Migrationstransaktion als auch über die separate KV-Sicherung gesichert. `PRAGMA quick_check`, Fremdschlüsselprüfung und ein Datenvergleich sind Teil dieses Schritts. Ein Sicherungsfehler oder Transaktionsfehler bricht die Migration ohne Ersatz durch leere Daten ab. Zweimaliges Öffnen führt die Migration nicht erneut aus.

Vor dem ersten bestätigten Second-Pass-Schreibvorgang erzeugt das Repository eine geprüfte lokale Versionssicherung des bis dahin bestätigten Zustands. Ein separater Versionsmarker verhindert, dass nach späterer regulärer Rotation ein bereits veränderter Bestand fälschlich erneut als ursprünglicher Versionsstand gesichert wird. Die bestehende First-Pass-Migrations-KV-Sicherung wird dadurch nicht entfernt.

## Additive Datenfelder

| Daten | Ablage / Erhaltung |
| --- | --- |
| Individuelle Positions-/Satzziele | `Routine.positions`; ursprüngliche Ziele zusätzlich in Session-Snapshot und `form_planned_row` |
| Zusatzfreigaben, Seitenwerte, Drafts, Suggestion-Herkunft | Session-/Satz-/Zeilen-Payloads; keine Rekonstruktion aus dem später aktuellen Plan |
| Planrevisionen | `form_entity`, Collection `planRevisions`; normale Aktionen dürfen vorhandene Revisionen nicht ändern oder entfernen |
| Einzelne verschobene Termine | `form_entity`, Collection `planOccurrences`; ursprüngliches und aktuelles Datum bleiben getrennt |
| Progressionsentscheidungen | `form_entity`, Collection `progressionDecisions` |
| Undo | `form_singleton`, Schlüssel `undoState`; ein begrenzter betroffener Aggregatzustand, keine Kopie der gesamten App |
| Private Medien | `form_entity`, Collection `mediaAssets`; nur Metadaten/relative Referenz, Bildbytes im privaten Verzeichnis |
| Plan-/Geräte-/Texteingabeentwürfe | Eigene Singleton-Felder einschließlich noch nicht fertiger Rohtexte |
| Neue Anzeige-/Gym-/Backupeinstellungen | Bestehender Settings-Singleton; strikte Enums, Zahlenbereiche und Boolean-Typen |
| Health-Quellen-/Syncdaten | Vorhandener `healthNutrition`-Singleton bzw. optionale validierte `healthOrigin` an übernommenen Tageswerten |

Neue optionale Collections werden beim Lesen als leere Listen normalisiert, wenn noch kein Inhalt existiert. Das schreibt keine neuen Vorgaben in historische Trainings. Wird ein gleichnamiges Feld bereits als kompatibler unbekannter Singleton vorgefunden, behält der Writer diese physische Repräsentation bei; er verdeckt den Inhalt nicht durch eine neu initialisierte leere Liste.

Weitere unbekannte JSON-Felder bleiben erhalten. Nicht verlustfrei speicherbare Werte, ungültige bekannte Felder und widersprüchliche IDs werden ausdrücklich abgewiesen. Es gibt kein stilles Kürzen, Nullsetzen oder Wegwerfen. Ergänzte Rollen-/Einheitenprüfung gilt für neue positionsbezogene Sätze; ältere Sessions ohne diese Metadaten bleiben lesbar und erhalten ihre vorhandenen Werte.

## Bestätigter Stand und RAM-Entwürfe

`context.update` berechnet jede Änderung funktional auf dem aktuellsten RAM-Zustand. `saveRepository` nimmt diesen Zustand unveränderlich zum Aufrufzeitpunkt auf und reiht ihn in einen einzigen seriellen Writer ein. Die SQL-Transaktion schreibt nur geänderte Zeilen. Unveränderte eingefrorene Payloads werden nicht bei jeder Eingabe neu serialisiert.

`getRepositoryCommitStatus()` und `useAthlete().confirmedData` liefern ausschließlich den letzten bestätigten Zustand. `lastSaved` wird nach dem Laden aus den gespeicherten Metadaten und nach einem tatsächlichen Commit aktualisiert. Ein fehlgeschlagener Schreibversuch verändert diesen bestätigten Zustand nicht. Der neueste gültige RAM-Entwurf bleibt sichtbar und steht `retrySave` weiter zur Verfügung.

Der boolesche Erfolgswert von `update`/`replace` bedeutet Commit-Erfolg, nicht bloß eine geänderte React-Anzeige. `replace` akzeptiert zusätzlich einen funktionalen Callback, damit ein Zusammenführen nach asynchronem Medien-Staging auf dem dann aktuellen Zustand ausgeführt wird. Gleichzeitige Einträge oder Settings werden dadurch nicht aus einem alten Vorschauzustand zurückgeschrieben.

## Revisionen, Undo und historische Grenzen

Der Store und das Repository prüfen bei normalen Änderungen, dass jede bisherige Planrevision vollständig erhalten bleibt. Neue Revisionen werden bei bewussten finalen Saves hinzugefügt. Explizites Backup-Ersetzen ist eine getrennte bestätigte Wiederherstellungsaktion und darf einen anderen vollständigen Revisionsstand einspielen.

Undo speichert Aktions-ID, Bereich, betroffene ID, Vorherzustand und einen exakten kanonischen Vergleich des erwarteten Nachherzustands. Es ersetzt nur das betroffene Live-Workout, historische Workout oder Vorkommnis. Unabhängige Settings, Gewichtseinträge und Healthwerte werden nicht zurückgedreht. Der technische `lastSavedAt`-Zeitpunkt ist vom Undo-Vergleich ausgenommen. Eine widersprechende spätere Änderung am gleichen Aggregat sperrt die Rücknahme. Ein bewusst auf zwei Millionen Zeichen begrenzter Undo-Datensatz wird bei Überschreitung nicht angeboten; gezielte Korrekturen bleiben der sichere Weg. Der vorhandene Undo-Datensatz übersteht einen bestätigten Commit und Neustart.

Neue Sessionstarts bleiben an einen tatsächlich vorhandenen und vollständig verordneten Plantag gebunden. Die Lade-/Restorepfade akzeptieren bestehende Legacy-Livesessions. Aktive und abgeschlossene Snapshots werden durch Planänderungen oder Revisionsreaktivierung nicht rückwirkend umgeschrieben.

## Fotos und Backups

Neue Fotos werden nativ als JPEG neu gerendert; damit wird die Bildorientierung angewendet. Danach werden Metadatensegmente entfernt. Die App verwendet inhaltsbasierte Asset-IDs (`m_` plus SHA-256), relative Pfade unter `assets/`, begrenzte Dateigrößen und einen tatsächlichen Hash-/Readback-Vergleich. Dateipfade aus Backups dürfen keine freien absoluten Pfade, `..`, Prozentkodierungen oder fremden Verzeichnisziele bestimmen.

Die vorhandenen Inline-JPEGs bleiben zunächst lesbar und in alten Backups erhalten. „Alte Fotos privat übernehmen“ sichert vor der Umstellung den bisherigen Versionsstand. Erst nach erfolgreichem Assetwrite wird die Übungsreferenz bestätigt geändert. Nicht lesbare Originale werden behalten und gemeldet. Historische Revisionssnapshots werden bei dieser Aktion nicht umgeschrieben. Alte unveränderte Inlinebilder können deshalb weiterhin ihre ursprünglichen Metadaten enthalten; die Entfernungsgarantie gilt für neu privat übernommene Dateien.

Ein gewöhnliches portables Backup enthält alle registrierten eigenen Mediendateien und deren Manifest. Fehlt eine Datei, meldet die normale Sicherung einen Fehler; sie ersetzt keine gute ältere Sicherung. Ein ausdrücklich gewählter Notfallexport erhält sämtliche JSON-Daten und verfügbare Dateien, markiert aber jede fehlende Datei im Manifest. Er wird bei der Vorschau als unvollständiger Medien-Recoverystand angezeigt. Er zählt nicht als vollständiger automatischer Snapshot.

## Verifikation

Die maßgeblichen ausgeführten Protokolle liegen unter `docs/qa/second-pass/`:

- `data-persistence.log`: tatsächlicher Provider-/Repositorypfad mit transparenten Hook-/Native-Adaptern, echte SQLite-Dateien, echte Mediendateien und SHA-256; parallele Eingaben, Commitfehler/RAM/Retry, Revisionenschutz, Pflichtszenario und echter Repository-/Provider-Neustart unmittelbar vor Undo, Medienpakete, Fehlpfade, Rotation und Diagnose-Allowlist.
- `repository-regression.log`: ursprüngliche 65 Repositoryprüfungen bleiben erhalten; der gemeinsame Harness führt jetzt zusätzlich echte private Snapshotdateien aus.
- `migration-regression.log`: ursprüngliche 81 Migrationstests, unveränderte alte Tabellenpayloads, zweimalige Migration, Fehlpunkte/Rollback, Import/Export und großer Bestand.
- `sqlite-regression.log` und `living-regression.log`: bestehende relationale und Live-Workout-Regressionen.

Das Pflichtszenario verwendet zwei alte Trainings und drei alte Gewichte. Jede der 22 fachlichen Aktionen wird über den echten Provider gespeichert, über eine neue SQLite-Verbindung gelesen und mit dem bestätigten Zustand verglichen. Die alten Trainings/Gewichte bleiben gleich. Ein vollständiger Repository-/Provider-Neustart erfolgt nach dem ersten Satz; das folgende Undo arbeitet auf dem neu geladenen Zustand. Am Ende werden historische Originalziele, optionale Terminart, drei Planrevisionen und portabler Backup-Roundtrip geprüft.

Der finale Datenlauf umfasst 276 Assertions. Er prüft außerdem Health-Coverage, Syncpräferenzen, Versuch-/Verbindungsbeleg, lokale Ziele und Exportlöschbelege sowie die Quellen-/Geräte-/Sample-Provenance von Gewicht, Schlaf und Tageswerten über einen absichtlichen SQL-Fehler, Retry, vollständigen Repository-Neustart und portablen Medienbackup. Ein fehlgeschlagener Health-Write verändert den bestätigten Stand nicht. Dieselben privaten Kennungen sind im getrennten Diagnoseexport ausgeschlossen.

Diese Prüfungen ersetzen keinen iPhone-Prozessabbruch, native Krypto-Ausführung, Dateischutztest oder signierten Installations-/Überinstallationstest. Das native private Verzeichnis und dessen gemeldete Schutzattribute werden separat implementiert; die tatsächliche iOS-Abnahme bleibt ein Device-Gate.
