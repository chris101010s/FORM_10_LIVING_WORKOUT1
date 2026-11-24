FORM Fresh liest alte Daten beim Start nicht automatisch. Neue Daten befinden sich in einer getrennten SQLite-Datei; alte Dateien werden durch diesen Start nicht gelöscht.

# Datenschutz
Persönliche Daten bleiben in der App-Sandbox in SQLite und alten lokalen KV-Snapshots; kein Account, keine hinzugefügten Analyse-/Werbe-SDKs. Kein Health-/YAZIO-Kontozugriff. Katalogabruf und optionale Katalogbilder verwenden die dokumentierte öffentliche GitHub-Quelle, keine Fitnesswerte werden dafür benötigt. OCR verwendet das native Vision-/PDFKit-Modul, Rohtextprüfung im UI; neu erfasster Rohtext nicht standardmäßig gespeichert. Originale V7-Backups bleiben unverändert. JSON-Backup ist unverschlüsselt und enthält private Informationen. Share/Export nur nach Nutzeraktion; Story-Gewicht und Name standardmäßig nicht ausgewählt. Native Permission-/Share-Flows noch zu prüfen. Keine echten Nutzerdaten in Testfixtures/Quellpaket.

## 8.4
Fresh Start hat einen getrennten Datenspeicher und übernimmt keine alten persönlichen Werte. Das optionale native verschlüsselte Backup nutzt das vom Nutzer eingegebene Passwort und AES-GCM; Passwort wird nicht gespeichert. Native Kryptografie noch nicht laufzeitgeprüft. Datenbank selbst nicht verschlüsselt. Der unverschlüsselte Export bleibt verfügbar; Datei nur bewusst weitergeben. Rücksicherung und alte App-Daten bleiben lokal.
