# FORM 15 · Assets, Herkunft und Lizenzen

Stand: 25.11.2026. Diese Liste beschreibt die tatsächlich mitgelieferten Dateien. Abhängigkeiten behalten ihre jeweiligen Paketlizenzen im per Lockfile reproduzierbaren `node_modules`-Bestand; dieser wird nicht in der Source-ZIP verdoppelt.

## Eigene Vektoren und Icons im zweiten Durchgang

Die aktuelle kanonische Registry enthält 48 eigene Motive: 32 Objekte/Zustände und 16 unterscheidbare Pip-Posen. Zusätzlich sind zehn neutrale Kategorien und zwölf Zustände für sechs eigene Tab-Icons implementiert. Quellen: `src/art/objects.ts`, `pip.ts`, `categories.ts`, `tabs.ts` und `registry.ts`. Exporte: `assets/art/`, `assets/tabs/`; tatsächliche Dateihashes und Pfadgeometrie-Hashes: `assets/art/manifest.json`. Aliasse, Farbvarianten und Dichteexporte werden nicht als neue Motive gezählt.

Alle neuen FORM-Pfade wurden für dieses Produkt selbst erstellt. Registry-Lizenz: „Original FORM artwork · unrestricted use and modification with this app“. Die Lizenz fremder Bestandteile und des bestehenden App-Repositories wird dadurch nicht verändert. Es wurden keine HeyClicky-Figuren, Bilder, Videos, Texte oder Quellcodes übernommen. Die dokumentierte Referenzbeobachtung lieferte allgemeine gestalterische Ideen.

`ASSET_MANIFEST.md` nennt pro Motiv die tatsächliche Produktintegration. `CHARACTER_BIBLE.md`, `MOTION_CATALOG.md` und `COPY_GUIDE.md` beschreiben die realen Zustände und Regeln. Das aus den implementierten Assets gerenderte Sheet `docs/design/FORM_15_SECOND_PASS_ASSET_SHEET.png` wurde visuell geprüft. Es ist kein nativer Screenshot. Der alte Doodle-Atlas und `assets/doodles/` bleiben als Herkunft des ersten Durchgangs erhalten und werden nicht neu gezählt.

Das eigene feste Ink-App-Symbol liegt in `assets/icons/` als SVG sowie deckende PNGs mit 1024/180/120 Pixeln. Das Manifest enthält die drei PNG-Hashes. Die früheren Paper-/Blueprint-/Retro-App-Symbolvarianten und die Umschaltfunktion wurden in Build 150002 auf Nutzerwunsch entfernt; die Darstellungs-Themes bleiben erhalten.

## Tatsächlich gebündelte Schriftdateien

Alle vier Familien stammen aus dem offiziellen [Google-Fonts-Repository](https://github.com/google/fonts/tree/main/ofl). Die dort ausgelieferten Dateien stehen unter SIL Open Font License 1.1. Der zugehörige Copyright- und Lizenztext liegt unverändert neben jeder TTF-Datei. Die internen Dateialiasnamen verändern die Fontdateien nicht.

| Lokale Datei | Familie / Rechtehinweis aus OFL | Quelle | SHA-256 der TTF |
| --- | --- | --- | --- |
| `assets/fonts/FormDisplay.ttf` | Outfit · The Outfit Project Authors | [outfit](https://github.com/google/fonts/tree/main/ofl/outfit) | `fc7287273e66929776e2ba54f144fe699080bec29f61bf649d70d871468aeade` |
| `assets/fonts/FormText.ttf` | DM Sans · The DM Sans Project Authors | [dmsans](https://github.com/google/fonts/tree/main/ofl/dmsans) | `8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d` |
| `assets/fonts/FormMono.ttf` | JetBrains Mono · The JetBrains Mono Project Authors | [jetbrainsmono](https://github.com/google/fonts/tree/main/ofl/jetbrainsmono) | `48715a42ec242c21e9f02692891e147d022299a52e48d5e413e1a942193ffeda` |
| `assets/fonts/FormHand.ttf` | Patrick Hand · Patrick Wagesreiter | [patrickhand](https://github.com/google/fonts/tree/main/ofl/patrickhand) | `0f173b3e6cb6d1af25babf7f0057c5ac4ee11f9992b0469bb817e967ef4ad0fc` |

`scripts/fetch-fonts.mjs` prüft bei einer ausdrücklich ausgeführten Aktualisierung die OFL und die Schriftdatei. Der normale Release-Build lädt die Schriften nicht erneut aus einem veränderlichen Branch, sondern verwendet den gelieferten Bestand. Bei fehlender Schrift bleibt die App mit einer Systemschrift bedienbar.

## Vorhandener Übungskatalog und Fotos

Die externe Originalquelle bleibt [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db). Deren [LICENSE](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE) wurde erneut eingesehen; sie bezeichnet den Bestand als Unlicense. FORM steht in keiner offiziellen Verbindung zu diesem Projekt.

Der tatsächlich gelieferte lokale Bestand enthält 12 Starteinträge in `exercises.generated.json` und 233 eigens kuratierte konventionelle Fallback-Einträge. Das ist kein behaupteter vollständiger Originaldump mit 800+ Übungen. Die App verbindet Einträge über stabile IDs. Aktuell enthält `photos.generated.ts` keine gebündelten Originalfotos. Es werden deshalb neutrale Platzhalter statt falscher Übungsfotos angezeigt.

Eine Katalogaktualisierung ist eine bewusste Wartungs-/Nutzeraktion. Passende Originalbilder werden nur anhand der konkreten Quell-ID und des Originalpfads verwendet und können in der Übungsdetailansicht ausdrücklich offline gespeichert werden. Ein normaler Build löst keinen neuen Bilddownload aus. Neue FORM-15-Doodles ersetzen keine anatomisch korrekten Übungsbilder.

Eigene Nutzerfotos werden über private Asset-IDs und relative Pfade verwaltet. Portable Sicherungen enthalten geprüfte Medienmanifeste; alte Inline-Fotos bleiben erhalten und können bewusst in den privaten Bestand übernommen werden. Orientierung/EXIF-Normalisierung und fehlende Altdateien sind in `BACKUP_AND_RECOVERY.md` beschrieben. Keine realen privaten Fotos oder Trainingsdaten sind Teil dieser Lieferung. `assets/icon.png` bleibt als ursprüngliche Projektdatei erhalten; das neue primäre Symbol ist das eigene `assets/icons/ink.png`.

## Bestandsprüfung

Datei-Hashes stehen zusätzlich in `SOURCE_MANIFEST_15_SECOND_PASS.json` in der Lieferung. Font-/Doodle-Quellen und Lizenzen werden mit dem Quellcode ausgeliefert. Prüfergebnisse zur Asset-Bündelung und zum tatsächlichen iOS-JavaScript-Export stehen in `TEST_MATRIX_15_SECOND_PASS.md`.
