# FORM 15 · Reparatur der IPA-Auslieferung · Build 150002

## Anlass und Umfang

Der GitHub-Lauf [Nr. 4](https://github.com/chris101010s/FORM_10_LIVING_WORKOUT1/actions/runs/45596899615) auf Commit `d2e4c01cfe254fdf36785d6ba6856ec168997041` bestand Tests, CocoaPods und laut Xcode-Log die native Kompilierung. Danach scheiterte der zusätzliche Präsentationsprüfer an `iPhone FORMPaper has no generated icon files`. Das Buildskript brach dadurch vor IPA-Verpackung und -Upload ab; das QA-Artefakt enthielt folgerichtig keine IPA.

Auf ausdrücklichen Nutzerwunsch wird die App-Icon-Wechselfunktion vollständig entfernt. Das feste bestehende Ink-Icon bleibt erhalten. Die Reparatur basiert auf dem aktuellen GitHub-Stand einschließlich des bereits erfolgreichen Python-/Pillow-Fixes, nicht auf einer älteren Source-ZIP.

## Änderungen

- Icon-Menü, Suchziel, Auswahlseite und Varianten-Vorschau entfernt.
- JavaScript- und Swift-Setter sowie Icon-Capability entfernt; es gibt keinen verbliebenen Aufruf zur nativen Icon-Umschaltung.
- Alternate-Icon-Plugin und die ungenutzten Paper-/Blueprint-/Retro-Icon-Assets entfernt. Das Ink-SVG und seine drei PNGs bleiben bytegleich zum vorherigen Stand.
- Das kleine `plugins/withBuildVersion.js` erhält die zuvor ebenfalls im Icon-Plugin enthaltene notwendige Zuordnung von `CURRENT_PROJECT_VERSION`. Beide App-Konfigurationen verwenden jetzt Build **150002**.
- Der Präsentationsprüfer bleibt aktiv: korrekte Bundle-ID, Marketingversion, Buildnummer, Scheme, primäres Icon und reale Bundle-Bilddaten werden geprüft. Alternativ-Icon-Einträge sind nicht mehr erlaubt. Reguläre Asset-Catalog-Darstellung wird unterstützt, ohne fehlende Icons einfach durchzuwinken.
- Der vorhandene Python-/Pillow-Fix des Standard-Workflows bleibt erhalten; der optionale HealthKit-Workflow erhält dieselbe benötigte Python-Einrichtung für seine gemeinsamen Tests.

## Daten und Identität

Marketingversion `15.0.0`, Bundle-ID `app.athleteos.personal`, Scheme `athleteos` und SQLite-Datei `form-v84-clean.db` bleiben erhalten. Es gibt keine Datenbankmigration oder Änderung an den Speicher-/Backupdateien. Historische `settings.appIcon`-Werte bleiben ausschließlich zur verlustfreien Daten-/Backup-Kompatibilität erhalten und lösen keine Funktion mehr aus. Die Darstellungs-Themes sind vom App-Icon unabhängig und bleiben verfügbar.

## Lokal tatsächlich geprüft

| Prüfung | Ergebnis |
| --- | --- |
| Frisches `npm ci --no-audit --no-fund` | Exit 0 |
| Vollständiges `npm run check` | Exit 0; alle 33 Testgruppen, TypeScript und ESLint; 68,35 s |
| Build-/Präsentationsregression | 81 Prüfungen bestanden |
| Design/Assets | 903 Prüfungen; enthaltene 653 Lifecycle-Prüfungen und 56 Kontrastpaare bestanden |
| Native Adapter | 132 Prüfungen bestanden, 15 verbleibende Swift-Methoden konsistent |
| Suche | 50 Prüfungen bestanden, keine Icon-Route; Themes und alter Backupwert erhalten |
| Tatsächliches Standard-Prebuild | Exit 0; genau ein `AppIcon.appiconset`, keine alternativen Icon-Buildsettings, beide App-Konfigurationen150002, leere Entitlements |
| Generiertes Haupticon | Pixelgleich mit dem bestehenden 1024-Pixel-Ink-Icon |
| Vergleich der vorgebauten Runtime-Quellen | Keine Abweichungen zum reparierten Quellstand |

Die Tests entfernen keine notwendigen IPA-Gates: Release-JavaScript, erlaubte Entitlements, App-Identität, echte ZIP-Integrität und SHA-256 bleiben vor Upload zu prüfen. Ein reines Linux-Prebuild belegt keinen neuen Xcode-Erfolg; hierfür ist der neue tatsächliche GitHub-Actions-Lauf maßgeblich.

## Die richtige Datei herunterladen

Nach erfolgreichem neuen Lauf von **FORM 15.0.0 · Standard iOS IPA** liegt die Installationsdatei im Artefakt **`FORM_15_0_0_unsigned_IPA-<Laufnummer>`**. Nach Entpacken muss darin **`FORM_15_0_0_unsigned.ipa`** zusammen mit Manifest und SHA-256 liegen. Das getrennte Artefakt `Standard_QA` enthält Prüfprotokolle und ist kein Installationspaket.

Die IPA ist für die anschließende eigene Sideloadly-Signierung bestimmt. Vor Überinstallation ein Backup aus FORM 10 sichern, FORM 10 nicht deinstallieren und dieselbe Apple-ID sowie bisherige effektive App-Kennung verwenden. Geräteinstallation, tatsächlicher Datenerhalt auf dem persönlichen iPhone und HealthKit/YAZIO sind separate Abnahmen; der Build allein bestätigt sie nicht.
