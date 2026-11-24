# Migration V7 → V8
1. V7 externes JSON-Backup exportieren, bevor die App überinstalliert wird. Gleiche Apple-ID/Signierung und Bundle-ID `app.athleteos.personal` verwenden; keine Deinstallation.
2. `storage.ts` liest `athlete-os-v4-data`, validiert es und sichert die gültigen Originalbytes unter `athlete-os-v7-original`. Bei ungültiger Hauptdatei wird die alte Recovery-Kopie geprüft. Kein automatisches Überschreiben/Löschen dieser Schlüssel.
3. `repository.ts` öffnet `form-v8.db` mit WAL, FK und serieller Schreibqueue. Liegt ein gültiger V8-Marker vor, wird ausschließlich die V8-Datenbank gelesen. Teilbestand ohne Marker wird als Fehler angezeigt.
4. Ohne Marker wird der validierte V7-Datensatz in einer SQL-Transaktion übertragen; alle Zeilen werden vor dem Commit gelesen und mit dem normalisierten Datensatz verglichen. Bei Fehler Rollback. Marker und Daten werden gemeinsam committed.
5. Weitere Updates ändern nur betroffene Zeilen und sind atomar. Fehler bleiben sichtbar; erneuter Schreibversuch / Notfall-Export möglich. Vor Import-Ersetzen wird der vorige committed Datensatz als KV-Snapshot gespeichert; Wiederherstellung des letzten Import-Snapshots ist in Mehr verfügbar.
6. Altes KV bleibt erhalten. Rückkehr zu V7 bringt dessen alten Datenstand, nicht die V8-Erweiterungen. V8-Backup vor Rollback sichern; alte App versteht nicht zwingend neue Satztypen.

Getestet: Node-Adapter mit echten SQLite-Dateien, Neustart, Vergleich, Rollback, große Migration, alte JSON-Strukturen (synthetische Fixtures, keine echten privaten Backups). Nicht getestet: Expo-Adapter auf iPhone, echte Überinstallation, Prozessabbruch während nativer Migration. Bei Fehler App nicht löschen; Recovery/Originalexport verwenden.
