# Backupformat FORM 8.4

Unverschlüsselt: `{format:"ATHLETE-OS-Backup",createdAt:<ISO>,appVersion:"8.4.0",data:<Schema 4>}`. Alte nackte Schema-4-Datensätze oder frühere Backupwrapper werden weiter validiert. Max. 15 MB UTF-8 beim Export. Merge behält Profil/Einstellungen/Wochenplan, dedupliziert identische IDs, lehnt unterschiedliche Inhalte mit gleicher ID ab; neue aktive Programme werden pausiert. Der vollständige Bestand wird vor Ersetzen als Rücksicherung unter `form-v84-before-restore` gespeichert.

Verschlüsselt (iOS): JSON `{format:"FORM-Encrypted-Backup-v1",salt:<base64>,box:<base64>}`. Salt 16 kryptografisch zufällige Bytes, PBKDF2-HMAC-SHA256 über UTF-8-Passwort, 600000 Runden, 32 Bytes Schlüssel; AES-256-GCM, 12-Byte Nonce, Ciphertext, 16-Byte Tag in `box`, Formatname als AAD. Kein Passwort im Backup. Falsches Passwort/Manipulation führt zu Fehler vor JSON-Import. Max. 21 MB äußere Datei. Native CryptoKit/CommonCrypto-Implementierung, separate macOS-Testpipeline; noch nicht nativ ausgeführt. Keine Datenbankverschlüsselung.

Lokale Bild-Dateipfade in Altbackups können nach einer Neuinstallation ungültig sein; keine vollständige portable Foto-Sicherung. JSON-Backup ist eine sensible Datei; niemals öffentlich in GitHub hochladen. Nur explizit teilen, nach Möglichkeit verschlüsselt und nach erfolgreicher Geräteprüfung der Kryptofunktion.
