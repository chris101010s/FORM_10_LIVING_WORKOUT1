# Fresh Start 8.4 — bewusst keine automatische Migration

Der Nutzer hat ausdrücklich einen leeren Neustart statt Alt-Datenmigration verlangt. FORM 8.4 öffnet ausschließlich `form-v84-clean.db`. Schema 8 bleibt; die neuen Blockfelder liegen in validierten JSON-Payloads der bestehenden relationalen Tabellen. Der alte Schlüssel `athlete-os-v4-data`, die bisherige `form-v8-fresh.db` und alte Recovery-Daten werden nicht gelöscht. Das erstmalige Schreiben eines leeren Profils geschieht transaktional. Bei späteren App-Starts wird die 8.4-Datei erneut gelesen, nicht erneut geleert. Geräteschutz und Import-Rücksicherung verwenden eigene 8.4-KV-Schlüssel. Bundle-ID unverändert.

Manuelle Wiederherstellung bleibt über Backup Center verfügbar: Vorschau, Merge/Ersetzen, Rücksicherung. Gerätedaten erst nach explizitem Import übernehmen. Neue Datei und alte Backups im realen SQLite-Logiktest überprüft; Expo-/iPhone-Gerätetest noch ausstehend.
