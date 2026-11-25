# Backup und Wiederherstellung

## Vor einem Update

Die vorhandene App zum Aktualisieren nicht deinstallieren. Einen Export im Backupbereich bewusst an einem selbst gewählten Ort ablegen. Bundle-ID und kompatible Signierung müssen bei der Überinstallation erhalten bleiben. Eine erfolgreiche lokale Prüfung ist kein Nachweis, dass ein fremdes Ziel im iOS-Teilen-Dialog eine Datei gespeichert hat.

## Welche Sicherungen vorhanden sind

| Art | Erstellung | Aufbewahrung |
| --- | --- | --- |
| FORM-10→15-Migrationssicherung | Vor dem vorhandenen Schemawechsel 8→9, mit Tabellen-/Versions-/Zeitdaten | Bestehende separate KV-Sicherung bleibt erhalten |
| Second-Pass-Versionssicherung | Vor dem ersten Second-Pass-Schreibvorgang | Gemeinsam mit Vor-Import-Sicherungen, standardmäßig höchstens 3 |
| Täglicher Snapshot | Nach bestätigtem Laden/Speichern bzw. Öffnen/Fortsetzen; pro lokalem Datum ein konsistentes Exemplar | Standardmäßig höchstens 7, in der UI 1/3/7 wählbar; tägliche Erstellung ausschaltbar |
| Vor-Import-Snapshot | Vor bestätigtem Ersetzen/Zusammenführen; Fehler blockiert den Import | Versions-/Importgruppe, 1/2/3 wählbar |
| Manuelles lokales Backup | Nur über „Manuelles lokales Backup erstellen“ | Keine automatische Löschung durch die Rotation |
| Datei-Export | Nur durch bewusste Aktion und iOS-Teilen-Dialog | Das ausgewählte externe Ziel verwaltet seine Kopie |

Lokale Snapshots werden vollständig geschrieben, zurückgelesen, auf Paket-/Medienintegrität geprüft und dann vom temporären Namen auf den endgültigen Namen übernommen. Auch die endgültige Datei wird geprüft. Erst danach dürfen ältere Exemplare derselben automatischen Gruppe gemäß Policy entfernt werden. Ein Fehler beim neuen Schreiben, Hashvergleich oder abschließenden Lesen lässt die bisherigen guten Sicherungen erhalten. Beschädigte Dateien werden gemeldet und nicht automatisch gelöscht. Ein nach Rotation vorhandener Versionsmarker verhindert eine falsche neue „Vorher“-Sicherung bereits veränderter Daten.

Ein täglicher Snapshot ist kein sekundengenauer Verlauf jedes Tastendrucks. Laufende Eingaben bleiben Aufgabe des fortlaufenden SQLite-Autosaves. Manuelle Backups und der Vor-Import-Snapshot ergänzen die tägliche Sicherung.

## Datenschutz und Größen

Die lokale SQLite-Datenbank und lokale Snapshotdateien sind nicht durch ein zusätzliches FORM-Passwort verschlüsselt. Face ID/Touch ID/Gerätecode schützen den Zugang zur App. Das ist getrennt von der Verschlüsselung einer Exportdatei.

Der native iOS-Service erstellt `ApplicationSupport/FORMPrivate`, setzt den Ausschluss von der automatischen Cloud-Gerätesicherung und liest ihn zurück. Er meldet auch die am Verzeichnis beobachtete Dateischutzklasse. Die Diagnose zeigt genau diese gemeldeten Zustände; sie behauptet keine vollständige Geräteprüfung oder Einzeldateiverschlüsselung. Kann der Ausschluss automatischer Cloudkopien nicht bestätigt werden, bleiben lokale Snapshots und neue private Medienübernahmen angehalten. Der vorhandene Bestand wird nicht durch leere Daten ersetzt. Ein bewusstes Datei-Teilen bleibt ein separater Nutzerauftrag.

Die neue portable JSON-Datei enthält Appdaten, eigene Medien und SHA-256-Integrität. Die geprüfte Grenze bleibt **15 MB Plaintext insgesamt**, davon höchstens 10,5 MB rohe Medienbytes; einzelne private JPEGs höchstens **5 MB**. Die Base64-Darstellung vergrößert die Datei. Überschreitungen werden ausdrücklich abgewiesen; es werden keine Medien still ausgelassen. Die native verschlüsselte Hülle hat weiterhin 21 MB Eingabegrenze und verwendet die bestehende CryptoKit-/CommonCrypto-Implementierung.

Neue privat übernommene Fotos werden neu gerendert und ohne EXIF-/weitere persönliche Metadatensegmente gespeichert. Vorhandene alte Inlinebilder und unveränderte Revisionskopien bleiben zunächst Originaldaten. Die Aktion zur privaten Übernahme bearbeitet die aktuellen eigenen Übungsfotos; nicht lesbare Dateien werden ausdrücklich erhalten. Es gibt keine automatische Veröffentlichung eigener Fotos.

## Vollständiges Backup erstellen

1. Warten, bis die App den aktuellen Datenbank-Commit bestätigt. Ein Fehlerhinweis ist keine Speicherbestätigung.
2. Für ein auf diesem Gerät aufbewahrtes Exemplar „Manuelles lokales Backup erstellen“ verwenden. Der Erfolgshinweis und die optionale Zeichnung erscheinen erst nach tatsächlich geprüftem Dateischreiben.
3. Für eine externe Datei „JSON-Backup mit Medien exportieren“ wählen. Die Exportdatei wird geschrieben und zurückgelesen, bevor sich der Teilen-Dialog öffnet. Dort selbst einen Speicherort wählen.
4. Optional „Verschlüsseltes Backup exportieren“ verwenden, sofern das native Modul vorhanden ist. Mindestens zwölf Zeichen und die Bestätigung eingeben. Das Passwort wird nicht gespeichert. Ohne Passwort ist die Datei nicht wiederherstellbar.

Die temporäre Exportdatei wird nach dem Teilen-Vorgang entfernt. Die App behauptet deshalb bei einem Export nur, dass die Datei geprüft und der Teilen-Dialog geöffnet wurde. Ob das gewählte Ziel die Datei übernommen hat, liegt beim Systemdialog und dem Ziel.

Der gemeinsame Helfer `shareTextExport` für Recovery- und CSV-Exporte erzeugt einen pro Operation eindeutigen Cache-Dateinamen, akzeptiert nur einen geprüften Basisnamen und vergleicht den vollständig zurückgelesenen Text vor dem Teilen. Sein `finally`-Pfad entfernt die Datei auch nach Abbruch, nicht verfügbarer Freigabe, Schreib- oder Lesefehler. Falls das Betriebssystem das Entfernen tatsächlich verweigert oder die Datei danach weiterhin vorhanden ist, meldet der Helfer ausdrücklich einen Cleanupfehler. Er behauptet dann keine erfolgreiche Bereinigung.

## Backup prüfen und übernehmen

1. „Backup öffnen & prüfen“ auswählen. Ältere kompatible Daten-JSON-Dateien und das neue Medienformat bleiben verwendbar. Eine native verschlüsselte Datei wird zuerst entschlüsselt.
2. Die Vorschau zeigt Datenmengen, Zeitstempel, Schema, Dateigröße und enthaltene Mediendateien. Das neue Format prüft sowohl den Hash des gesamten Inhalts als auch IDs, relative Pfade, Größen, MIME-Typ und Hash jeder Datei.
3. „Zusammenführen“ behält die aktuellen Profil-/Einstellungswerte. Bestehende unterschiedliche Inhalte unter derselben Daten-ID werden nicht still überschrieben; ein Konflikt hält den Import an. Die Zusammenführung wird erst nach dem Medien-Staging auf dem aktuellen RAM-Zustand berechnet, sodass daneben hinzugekommene Einträge erhalten bleiben.
4. „Daten ersetzen“ erfordert eine ausdrückliche Bestätigung. Das Repository sichert vor dem SQL-Write den bis dahin bestätigten aktuellen Bestand.
5. Erst die erfolgreiche Transaktion schließt die Vorschau und bestätigt den Restore. Ein Fehler lässt sie offen und erhält den letzten bestätigten DB-Stand.

Medien werden zuerst im privaten temporären Bereich geschrieben und geprüft. Vorhandene finale Dateien werden nicht ungeprüft überschrieben. Erst nachdem alle benötigten Dateien verifiziert bereitliegen, versucht die App den DB-Commit. Ein Abbruch vor dem DB-Versuch räumt nur neu erzeugte, nicht referenzierte Dateien auf. Nach einem fehlgeschlagenen DB-Versuch bleiben bereits verifizierte finale Dateien erhalten, damit die im RAM gehaltenen Entwürfe und „Erneut versuchen“ weiterhin funktionieren. Alte Datenreferenzen bleiben durch SQL-Rollback erhalten. Ein Prozessabbruch zwischen Dateibereitstellung und DB-Commit kann unverwendete Dateien hinterlassen, aber keine bestätigten alten Referenzen umschreiben.

## Schreibfehler und Notfallexport

Bei einem Savefehler bleiben die neuesten gültigen Eingaben im Arbeitsspeicher; sie sind noch kein sicherer Neustartbestand. „Erneut versuchen“ verwendet genau diesen neuesten Zustand. Reguläre Backups arbeiten mit dem bestätigten Datenstand. Der separate Notfallexport kann ausdrücklich die ungespeicherten RAM-Eingaben sichern.

Ein fehlendes oder beschädigtes eigenes Foto verhindert ein normales vollständiges Backup. Der ausdrücklich markierte Recoveryexport erhält trotzdem sämtliche JSON-Datensätze und die verfügbaren geprüften Fotos. Fehlende Dateien erhalten `missing: true` im Manifest; das Paket trägt `completeness: missing-media`. Bei einem späteren Import zeigt die Vorschau die Anzahl nicht enthaltener Fotos an. Es werden keine Bildbytes erfunden, und fehlende Fotos zählen nicht als vollständig gesicherte Medien. Eine solche Datei ersetzt keine gute automatische Sicherung.

Bei nicht lesbarer Hauptdatenbank wird kein Onboarding/Fresh-Start über den Bestand geschrieben. „Erneut laden“ versucht denselben Bestand. Die bereits unabhängige Upgrade-Sicherung kann separat exportiert werden. „Vorigen Import rückgängig machen“ und „Sicherung vor FORM 15 prüfen“ öffnen zunächst eine Vorschau; sie ersetzen nichts ohne den normalen Bestätigungspfad.

## Diagnose

„Datenschutz & Diagnose“ zeigt SQLite-Schema, tatsächlichen bestätigten Schreibzeitpunkt, DB-/Journalgröße, Bestandszahlen, Medienstatus, geprüfte lokale Sicherungen, Integritätsprüfung und echte Modul-/Erweiterungsverfügbarkeit. Der lokale Status stammt nicht aus einer vermuteten Internetverbindung. „Integrität prüfen“ führt den strukturellen SQLite- und Datenvergleich lesend durch; es gibt keine automatische Reparatur durch Datenlöschung.

Der eigene Diagnoseexport wird erst nach ausdrücklicher Zustimmung geteilt. Er verwendet eine feste Allowlist für Versionen, Statuscodes, technische Zeitpunkte, anonyme Zähler/Größen und Capabilityzustände. Er enthält keine Namen, Körper-/Ernährungswerte, Notizen, Health-UUIDs, Quellenkennungen, privaten Dateipfade oder Rohfehlerobjekte. Ein vollständiges Backup ist eine andere, personenbezogene Datei.

## Nachgewiesen und noch nativ abzunehmen

Die Tests in `tests/test-second-pass-data.cjs` arbeiten mit tatsächlichem Provider-/Repositorycode, echten SQLite-Dateien, echten Medien-/Snapshotdateien und SHA-256. Sie prüfen unter anderem Schreiben/Readback, beschädigte Pakete, Pfadtraversal, Importstaging, Commitfehler mit Retry, 7/3-Rotation ohne Verlust älterer guter Dateien, erhaltene manuelle Kopien, markierten Recoveryexport, Neustart unmittelbar vor Undo und die Diagnose-Allowlist. Expo-/React-Adapter sind dabei ausdrücklich simuliert.

Der finale Lauf mit 276 Assertions sichert auch die neuen Health-Sync-/Verbindungs-/Löschbelege und die Quellenprovenance über SQLite-Neustart und ein vollständiges portables Medienbackup. Ein solches Backup enthält absichtlich diese persönlichen Daten; der getrennte Diagnoseexport enthält die dafür eingesetzten Quellen-, Geräte- und UUID-Sentinels ausdrücklich nicht.

Zusätzlich führt dasselbe Daten-Gate `tests/test-share-text-export.cjs` mit 66 Adapterprüfungen aus: temporäre Dateien, konkurrierende gleichnamige Exporte, awaited Write/Readback, Systemabbruch, Freigabe-/Dateifehler, Pfadablehnung und gemeldeter physischer Löschfehler.

Ein signierter iPhone-Build muss Dateischutz und Cloud-Backup-Ausschluss, verschlüsselten Export/Import, tatsächliche Unterbrechung/Prozessneustart, Systemuhrwechsel und Überinstallation auf einem vorhandenen Bestand noch nativ nachweisen. Quellcode, Prebuild oder ein JavaScript-Bundle ersetzen diese Abnahme nicht.
