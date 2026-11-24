# Datenmodell FORM 8
`src/data/schema.ts` definiert den kompatiblen JSON-Datensatz (`schema: 4`); `src/data/validation.ts` validiert alte und neue Daten. Die **physische SQLite-Schemaversion ist 8**, getrennt von der JSON-Version.

`form-v8-fresh.db`: `form_meta` (Version), `form_singleton` (Profil, Settings, Favoriten, Wochenplan, Habit-Checks, Studio-Notizen), `form_entity` (eine Zeile je Gewicht, Scan, Übung, Routine, Cardio, Performance, Habit, Ernährung, Recovery, Maß, Ziel, Journal), `form_session` (live/history, IDs, Zeitpunkte, Session-Payload), `form_set` (FK zu Session, stabile ID, Übung, Zeit, Reihenfolge, Satz-Payload). Indizes auf Datum und Übung. Flexible Eigenschaften als JSON-Payload; nicht alle Zielfelder einzeln normalisiert.

`relational.ts` enthält SQL-Schema und transaktionalen Diff/Restore. `repository.ts` ist der Expo-Adapter mit serieller Schreibqueue; `context.tsx` zeigt Speichern/Fehler. Jede Änderung wird validiert. Live-Drafts und Rest-/Block-Endzeiten werden mit gespeichert. Zeit-/Distanzsätze nutzen 0 als kompatiblen Sentinel in Gewicht/Wdh., werden jedoch nicht als Kraftleistung gewertet. Fehlende Scan-Messwerte bleiben nicht gesetzt (keine Nullmessung). Keine persönlichen Defaultwerte.

## 8.4
Neue Datei `form-v84-clean.db`; `Routine.segments`, `LiveWorkout.segments`, `Workout.segments` sind geordnete Gruppen `{id,kind,exerciseIds,seconds}`. Partition der Übungsreihenfolge, eindeutige IDs pro Routine/Session, Formatgröße und Sekunden validiert. `LiveWorkout.segmentStartedAt` wird mit Sessionpause verschoben; gespeicherter absoluter Zeitpunkt. Bestehendes relationales Schema 8 bleibt; keine Schemaänderung nötig, da Payload-Format optional erweitert wurde.

## FORM 10.0 (optionale Payload-Felder, keine neue SQLite-Schemaversion)

`LiveWorkout.createdAt`, `lastSavedAt`, `status`, `setSequence`, `restPausedMs`. Die vorhandene ID und `startedAt`, `pausedAt`, `pausedMs`, `restUntil` bleiben kanonisch. `Workout.createdAt`, `status` ergänzen die Historie. Bestehende alte Objekte ohne die neuen Felder bleiben lesbar; Satzsequenz fällt bei Altbestand auf die Anzahl der Sätze zurück. Ein vollständiger Satzabschluss erhöht die Sequenz; Löschungen setzen sie nicht zurück. `restPausedMs` und laufendes `restUntil` dürfen nicht gleichzeitig vorhanden sein. `lastSavedAt` dokumentiert die Zeit der geschriebenen Momentaufnahme, nicht eine separate Commit-Quittung.
