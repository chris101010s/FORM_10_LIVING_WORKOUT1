# FORM 10 → FORM 15.0.0: Datenerhalt und Upgrade

## Identität und Versionsnummern

| Bestandteil | Wert in diesem Update |
|---|---|
| App-/Release-Version | `15.0.0` |
| iOS-Bundle-ID | `app.athleteos.personal` |
| URL-Scheme | `athleteos` |
| Bestehende SQLite-Datei | `form-v84-clean.db` |
| Bisherige Datenbankversion im mitgelieferten FORM 10 | `8` |
| Neue Datenbankversion | `9` |
| JSON-Nutzdatenformat | `schema: 4`, weiterhin abwärtskompatibler Import alter Sicherungen |
| Normaler JSON-Backup-Umschlag | `ATHLETE-OS-Backup`, jetzt mit `appVersion: 15.0.0` und `databaseSchema: 9` |

Der technische Dateiname mit `clean` ist unverändert. Er bedeutet keinen Reset. Neue Installation und bestehender Datenbestand sind getrennte, überprüfte Fälle. Die Marketingversion bestimmt weder Datenbankdatei noch Schema-Version.

## Was beim ersten Öffnen tatsächlich geschieht

`src/data/repository.ts` prüft die vorhandene Datenbankdatei und den gerätebezogenen Initialisierungsmarker. Fehlt die Datei, werden zusätzlich ausschließlich die Namen vorhandener FORM-KV-Schlüssel geprüft, ohne alte Daten zu lesen oder zu importieren. Damit wird auch ein v10-Bestand ohne neuen Initialisierungsmarker erkannt, wenn dessen Hauptdatei fehlt. Eine vorhandene Datei mit null Bytes, eine verschwundene bereits initialisierte Datei, ein unvollständiges Schema, Daten ohne Migrationsmarker, beschädigte Beziehungen und unbekannte zukünftige Schemaversionen werden als Fehler behandelt. Es gibt dabei keinen Rückfall auf `freshData()` und keine Löschung der Datei.

Die Verbindung bleibt auf der bisherigen Datei. WAL, Fremdschlüssel und ein Busy-Timeout sind aktiv. Alle Repository-Schreiboperationen laufen seriell über eine private Verbindung. `BEGIN IMMEDIATE` nimmt den Schreibzugriff am Transaktionsbeginn; bei einem Fehler folgt ein Rollback. Andere App-Komponenten erhalten diese Verbindung nicht.

Für Schema 8 läuft die additive Migration in folgender Reihenfolge:

1. SQLite-Integrität und Fremdschlüssel prüfen; bestehenden Bestand vollständig lesen und validieren.
2. Einen konsistenten Snapshot mit ursprünglicher Schema-Version, Zielversion und ISO-Zeitstempel erstellen. Er enthält die vollständigen Nutzdaten sowie die ursprünglichen Zeilen aller fünf bestehenden FORM-Tabellen. Eigene Fotos im Datenbestand, Entwürfe und unbekannte JSON-Erweiterungen sind enthalten.
3. Diesen Snapshot vor den Schemaänderungen zusätzlich in der getrennten SQLite-KV-Ablage unter `form-v15-before-migration-8-to-9` sichern. Scheitert das, wird die Migration abgebrochen. Die erste gültige Sicherung wird durch einen Wiederholungsversuch nicht überschrieben.
4. `form_planned_row` und `form_migration_snapshot` ergänzen. Bestehende Tabellen, IDs und Payloads bleiben bestehen. In der neuen Snapshot-Tabelle wird ebenfalls die Migrationssicherung abgelegt.
5. Den Schema-Marker auf `9` setzen, Integrität und den vollständigen Nutzdatenvergleich erneut prüfen und erst danach committen.

Die gespeicherten alten Datenzeilen werden bei dieser Migration nicht neu geschrieben. Die Regression vergleicht ihre ursprünglichen SQL-Payloads vor und nach der Migration. Ein zweiter Start führt keine zweite Migration aus. Die JSON-Validierung kann fehlende optionale Altformat-Felder im Arbeitsspeicher ergänzen; unbekannte JSON-Felder bleiben erhalten. Ungültige oder nicht verlustfrei speicherbare Werte erzeugen einen Fehler anstelle stillen Datenverlusts.

## Erhaltene Daten und Ausnahmen

Historische spontane Workouts, vorhandene Pläne und Routinen, stabile Übungs- und Satz-IDs, Gewichte, Ziele, Körperdaten, Favoriten, eigene Übungen und Fotos, Journal, Habits, Ernährungslogs, Einstellungen und optionale Integrationen bleiben erhalten. Eine bestehende laufende spontane Session bleibt als Legacy-Session fortsetzbar. Sie erhält keine rückwirkend erfundenen Planzeilen oder Wiederholungslimits.

Neue geplante Sessions speichern ihre Routine-Momentaufnahme, ihren Plankontext, sämtliche Satzzeilen, Zusatzfreigaben und Entwürfe. Die relationalen Satzzeilen sind von absolvierten Leistungen getrennt. Die Validierung prüft bei v15-Planzeilen deren ursprüngliche Momentaufnahme, Satzanzahl, Zeilenbezüge und explizite Wiederholungsfreigaben. Alte historische Leistungen ohne dieses neue Format werden nicht an heutige Planlimits angepasst. Die Fixture enthält bewusst alte 12 Wiederholungen neben einem neuen 3-Wiederholungs-Plan.

Unfertige Plan- und Programmentwürfe sind eigene optionale Felder. Leere Namen, noch leere Übungslisten und unvollständige numerische Texte wie `4.` bleiben als Entwurf erhalten. Die finale Planfreigabe prüft strengere Regeln. Persistierte `rawInputs` sind auf 202 Gruppen mit je 20 Textfeldern und 100 Zeichen je Wert begrenzt; ausschließlich der reservierte eigene Übungsname `$picker.customName` erlaubt 130 Zeichen. Unbekannte Erweiterungen werden in JSON und SQLite erhalten; beim Zusammenführen widersprüchlicher unbekannter Daten wird explizit ein Konflikt gemeldet.

Die HealthKit-Ernährungscaches liegen getrennt von manuellen Ernährungslogs. UUID, tatsächliche Source-Metadaten, Abfragefenster, gewählte Quelle und ausstehende Exportbelege überstehen Speichern, Neustart und Backup. Die SQLite-Tests prüfen das ohne echte Gesundheitsdaten.

## Alte Schlüssel und Rücksicherungen

| Schlüssel | Verhalten |
|---|---|
| `form-v84-before-restore` | Weiterhin lesbar; vor einer ausdrücklich gewählten Ersetzung wird der zuletzt bestätigte Datenbestand gesichert. |
| `form-v15-before-restore-info` | Schema-Version und Zeitstempel der Rücksicherung. |
| `form-v15-before-migration-8-to-9` | Erste gültige vollständige Sicherung vor der v15-Migration, getrennt von der App-Datenbank. |
| `form-v15-database-initialized` | Belegt eine erfolgreich initialisierte Datenbank; verhindert einen vermeintlichen Erststart bei später fehlender Datei. |
| `form-v84-device-auth-lock` | Bestehende gerätebezogene Sperre bleibt erhalten; keine Aufnahme in ein teilbares Trainingsbackup. |
| `athlete-os-v4-data` | Alte Ablage bleibt erhalten. Das neue Repository liest oder importiert ihren Inhalt nicht automatisch. Nur bei fehlender Hauptdatenbank zählt der vorhandene Schlüsselname als Hinweis auf einen älteren Bestand. |
| `athlete-os-v7-original`, `athlete-os-recovery-v1` | Bestehende Legacy-Sicherungen bleiben über die alte Speicherlogik erhalten. Kein zusätzlicher automatischer Import. |

`previousMigrationSnapshot()` liefert die validierten Daten der lokalen Migrationssicherung. `migrationSnapshotInfo()` liefert Schema-Versionen und Zeitpunkt. `previousRestoreSnapshot()` liest weiterhin Rücksicherungen unter dem bestehenden Schlüssel. Ein Migrationssnapshot lässt sich auch als explizit ausgewählte Datei über den Backup-Parser lesen. Normale und verschlüsselte Backup-Formate behalten ihre bisherigen Formatkennungen.

Ein Snapshot in derselben App ersetzt kein außerhalb der App gespeichertes Backup. Eine Deinstallation oder ein anderer signierter Container kann auch lokale Rücksicherungen entfernen. Vor dem Upgrade deshalb ein JSON-Backup aus FORM 10 außerhalb der App ablegen.

## Bestätigte Speicherung, Fehler und Wiederholung

`update()` behält `Promise<boolean>`; `replace()` liefert jetzt ebenfalls eine Speicherbestätigung als `Promise<boolean>`. Erfolgreiche Rückgabe erfolgt erst nach Repository-Bestätigung. Das Repository liefert zusätzlich intern `{savedAt, changed}`; die UI verwendet den bestätigten Zeitpunkt. Ein Wiederholungsversuch ohne Änderung erfindet keinen neueren Schreibzeitpunkt.

Bei einem Schreibfehler bleibt die neueste validierte Eingabe im RAM. Die SQLite-Datei bleibt auf dem letzten vollständig bestätigten Stand. Die UI meldet den Fehler, bietet Wiederholung an und darf keinen erfolgreichen Satzabschluss signalisieren. Eine fehlgeschlagene Ersetzung behält ihren Rücksicherungstoken. Wiederholungen und nachfolgende Eingaben überschreiben die ursprüngliche Rücksicherung desselben Ersetzungsversuchs nicht.

Ein Ladefehler ist ein anderer Fall: Interaktive Änderungen und Ersetzung sind gesperrt, solange die bestehende Datenbank nicht sicher lesbar ist. „Erneut laden“ kann vorübergehende Fehler beheben. Bei tatsächlicher Beschädigung müssen die vorhandene Datei und die Rücksicherung zuerst gerettet werden; der Code ersetzt eine beschädigte Datei nicht automatisch durch eine leere. Die Migrationssicherung in der getrennten KV-Ablage kann, solange diese noch lesbar ist, unabhängig vom defekten Hauptbestand ausgelesen und extern exportiert werden.

Neue aktive Sessions werden außerdem direkt an der Store-Action-Grenze geprüft: gespeicherte, zugewiesene Planroutine, vollständige Vorgaben, konsistente Momentaufnahme, keine zweite aktive Session und keine bereits als absolviert eingeschleusten Startzeilen. Laden und ausdrücklich ausgewähltes Wiederherstellen alter Sessions verwenden diese Neueingabe-Regel nicht.

## Schreibaufwand bei großen Beständen

Validierte App-Zustände sind unveränderlich. Unveränderte Teilbäume und serialisierte Payloads werden anhand ihrer stabilen Objektidentität wiederverwendet. Ein einzelner Satzentwurf führt deshalb nicht zur erneuten Serialisierung der gesamten Trainingshistorie. SQLite erhält nur geänderte Zeilen; Planzeilen liegen in `form_planned_row` mit Fremdschlüssel zur Session. Eine Änderung des Entwurfs schreibt normalerweise die betroffene Planzeile und den bestätigten Metadatensatz, gegebenenfalls zusätzlich veränderte Session-Metadaten.

`tests/test-migration15.cjs` erzeugt reproduzierbar eine echte Datenbank mit 10.000 Sätzen und 2.000 Gewichten. Das Testlog nennt die gemessene Dauer und zählt SQL-Schreiboperationen sowie Payload-Serialisierungen. Das ist eine Messung auf Desktop-Node/SQLite und keine Aussage über iPhone-Framerate, native Energieverwendung oder eine allgemeine 60-FPS-Garantie.

## Upgrade des bestehenden Repositories

Die mitgelieferte Ausgangsbasis wurde vor Änderungen als Git-Commit `b5f7d88` und Tag `form-10-supplied-baseline` gesichert. Beim Abschluss wurde GitHub zugänglich. Der vollständige Abgleich des öffentlichen `FORM_10_LIVING_WORKOUT1/main` bei `e0066a240400d6c38480b9a0de4e119a8a50e5bb` ergab identische App-, Test- und Buildquellen zur gelieferten Hotfix-Basis. Das zweite private FORM-10-Repository enthält noch den älteren Stand vor dem Switch-Hotfix. Es wurde nichts entfernt überschrieben; siehe `RELEASE_REPORT_15.md`.

Im eigenen Repository zuerst die bisherigen Änderungen committen oder anderweitig sichern und einen Upgrade-Branch erstellen. Die neuen Dateien mit dem bestehenden Stand vergleichen und lokale neuere Änderungen bewusst zusammenführen. Keine Dateien mit persönlichen Backups committen. Anschließend `npm ci`, `npm run check` und die dokumentierten nativen Build-Prüfungen ausführen. Nicht eigenmächtig die Bundle-ID, das Scheme oder `DATABASE_NAME` ändern.

Für die Überinstallation auf dem iPhone die bisherige App behalten. Dieselbe effektive Bundle-ID und eine kompatible Signierung verwenden. Signierungswerkzeug, Team und Provisionierung können die wirksame Identität beziehungsweise den Datencontainer beeinflussen; der unveränderte Quellcodewert allein garantiert keine Datenübernahme. Vor der Installation muss das externe FORM-10-Backup vorhanden sein. Erst nach geprüftem Datenbestand die Rücksicherung als erfolgreich betrachten.

## Reproduzierbare Prüfungen und Grenzen

| Befehl | Tatsächlich geprüfter Umfang |
|---|---|
| `npm run test:migration15` | Echte Schema-8-Fixture, beide Snapshots, bytegleiche alte SQL-Payloads, zweite Migration, simuliertes Crash-Rollback, beschädigte Marker/Beziehungen, zukünftige Schema-Version, Wiederanlauf, Backup-Restore, Erweiterungen, Gesundheitscache, zwei Satzentwürfe, rohe Editor-Eingaben und inkrementeller Lasttest. |
| `npm run test:repository15` | Produktives Repository über simulierte Expo-Adapter auf echten SQLite-Dateien: Dateiname, Erststartnachweis, Migration vor Schreibfreigabe, schreibgeschützte Fehlerfälle, serielles Speichern, Snapshot bei Ersetzung, Schreibfehler und Wiederholung, bestätigte Zeitstempel, Wiederöffnen und kein Legacy-Autoimport. |
| `npm run test:plan15` | Spec-Szenario mit zwei historischen Workouts, drei Gewichten, eigenem 3×3-Plan, 3/2/4 Wiederholungen nach Freigabe, explizitem Extrasatz, stabiler Momentaufnahme, unveränderten Altdaten, echtem SQLite-Neustart und Backup. Außerdem neue Session-Grenzprüfung, AMRAP, Zeit/Distanz, Warm-ups und Blöcke. |
| `npm run test:sqlite`, `npm run test:living`, `npm run test:storage`, `npm run test:validation`, `npm run test:form84`, `npm run test:native` | Beibehaltene Bestandsregressionen zu SQL, Wiederanlauf, Legacy-Backups, Fehlerbehandlung, Timern und nativen Funktionsverträgen. |
| `npm run typecheck` | Vollständiger TypeScript-Check, einschließlich `Promise<boolean>`-Speichervertrag. |

Die Fixture-Dateien unter `tests/fixtures/` enthalten ausschließlich synthetische Testwerte. Sie sind nicht an die produktive Einrichtung angebunden. Die tatsächlichen Logs liegen unter `docs/qa/15/`.

In dieser Linux-Umgebung wurde kein iPhone-Upgrade, kein Force-Quit-/Sperrbildschirmtest in iOS und keine Sideloadly-Signierung ausgeführt. Auch die gesonderte KV-Snapshotdatei wurde hier über einen realen SQLite-Testadapter geprüft, nicht über Apples nativen Container. Die abschließende Geräteabnahme muss nach der Überinstallation ausdrücklich kontrollieren: vorhandene Einrichtung, zwei alte Historien, drei Gewichte, aktiver Plan, laufende alte Session beziehungsweise zwei neue Satzentwürfe, Extras, Timer, Gerätesperre und Backup-Roundtrip. Den offenen nativen Build- und Gerätestatus dokumentiert der Release-Bericht.
