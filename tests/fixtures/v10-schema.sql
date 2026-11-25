-- Synthetic schema fixture copied from the supplied FORM 10 relational schema (database version 8).
CREATE TABLE form_meta (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE form_singleton (key TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE form_entity (collection TEXT NOT NULL, id TEXT NOT NULL, ordinal INTEGER NOT NULL, date TEXT, payload TEXT NOT NULL, PRIMARY KEY(collection,id));
CREATE INDEX form_entity_date ON form_entity(collection,date);
CREATE TABLE form_session (scope TEXT NOT NULL CHECK(scope IN ('live','history')), id TEXT NOT NULL, ordinal INTEGER NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, payload TEXT NOT NULL, PRIMARY KEY(scope,id));
CREATE INDEX form_session_date ON form_session(scope,finished_at);
CREATE TABLE form_set (scope TEXT NOT NULL, session_id TEXT NOT NULL, id TEXT NOT NULL, ordinal INTEGER NOT NULL, exercise_id TEXT NOT NULL, completed_at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(scope,session_id,id), FOREIGN KEY(scope,session_id) REFERENCES form_session(scope,id) ON DELETE CASCADE);
CREATE INDEX form_set_exercise ON form_set(exercise_id,completed_at);
