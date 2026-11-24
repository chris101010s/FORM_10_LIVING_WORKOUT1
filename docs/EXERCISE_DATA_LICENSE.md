# Übungskatalog: Herkunft, Lizenz und Offline-Verhalten

**Externe Originalquelle:** https://github.com/yuhonas/free-exercise-db

**Lizenz der Originalquelle:** The Unlicense (Public Domain); siehe dortige LICENSE-Datei. ATHLETE OS steht in keiner offiziellen Verbindung zu free-exercise-db.

ATHLETE OS lädt beim Build optional `dist/exercises.json` aus der offenen Originalquelle, prüft die JSON-Struktur sowie mindestens 700 unterschiedliche IDs und erzeugt daraus `src/catalog/exercises.generated.json`. Ist die Quelle während des Builds nicht erreichbar, wird nach drei Versuchen der lokale Katalog beibehalten und der Build läuft weiter. Diese Fallback-Situation erscheint ausdrücklich als Warnung im Build-Protokoll.

**Wichtig: Die Source-ZIP enthält noch NICHT die 800+ Originalübungen.** Sie enthält 12 Startübungen im generierten JSON und **233 eigens kuratierte konventionelle Übungen** in `src/catalog/curated-fallback.json`. Die Zusatzliste ist eine alternative Offline-Auswahl, kein Originaldump und nicht als offizielle freie Übungsdatenbank zu bezeichnen. Die Datenmenge wird zur Laufzeit über stabile Übungs-IDs zusammengeführt.

Nur wenn der Originaldownload erfolgreich ist, enthält die spätere IPA die überprüfte volle Originaldatenbank. Bei Offline-Fallback ist die Suche mit den enthaltenen Startübungen möglich; eine spätere Online-Aktualisierung innerhalb der App ist vorgesehen. Übungsfotos werden nicht offline gebündelt, sondern nur bei bestehender Internetverbindung geladen. Ausführungsanleitungen werden nur gezeigt, wenn die Datenquelle sie liefert; das ist keine professionelle Technikprüfung.

Eigene Trainingslogs referenzieren stabile Übungs-IDs. Änderungen am Online-Katalog sollten diese Historie nicht überschreiben.
