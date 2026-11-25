# Pip — Character Bible · FORM 15.0.0 / Build 150001

## Aufgabe

Pip ist eine eigene kleine Papierfigur für kurze Randnotizen. Sie erklärt keine Übungstechnik, diagnostiziert nichts und gibt sich nicht als KI-Coach aus. Speicherhinweise, Satzstatus und Controls funktionieren unabhängig von Figur, Sprüchen und Bewegung.

Die Figur bewertet weder Körper, Essen, Krankheit noch ausgelassene Trainingstage. Die Ruhepose gehört zu einem geplanten Ruhetag. Das Pflaster steht ausschließlich für einen bestätigten erneuten Speicherversuch. Ein Rekordgesicht braucht einen tatsächlichen Rekord aus früheren abgeschlossenen Einheiten.

## Silhouette und Zeichenregeln

- Eigene asymmetrische Papierfläche mit ungleich langen Kanten und einer gefalteten Ecke rechts oben; keine fremde Markenfigur und keine Emoji-Komposition.
- Koordinatenraum `0 0 96 96`; der Körper nimmt ungefähr die mittleren 50 × 60 Einheiten ein. Arme und stumpfe Füße haben pro Pose eigene Geometrie. Schlafen und Ruhen verändern zusätzlich Körperlage und Silhouette.
- Runde Strichenden und Verbindungen. In `Doodle` ist die Hauptkontur 2,5 Einheiten breit, weitere Konturen 1,8 bzw. 2,1, blaue Details 1,7. Kleine Gesichtsdetails tragen keine notwendige Information.
- Zwei kurze Augenstriche oder gebogene geschlossene Augen, sparsame Mundlinie. Ein hinzugefügtes Emoji zählt nicht als neuer Ausdruck.
- Tinte folgt dem tatsächlichen Thema. Eine kleine blaue Linie ist das wiederkehrende Merkmal. Die Papierfläche ist eine zurückhaltende lokale Farbfläche, im dunklen Thema mit eigenem Blauton.
- Normale Größe 66 pt, kompakt 42 pt. Bei Systemschrift über Faktor 1,5 wird die dekorative Figur ausgeblendet. Text und Controls bleiben erhalten.
- Nur die Figur darf leicht winken. Zahlen, Tabellen und der Spruchtext werden nicht gedreht.

## Tatsächliche Posen und Produktzustände

Quelle: `src/art/pip.ts`; Registry: `src/art/registry.ts`; Ereignisse: `src/copy/copy.de.ts`.

| Pose / SVG | Eigenständige Geometrie | Tatsächlicher Einsatz |
| --- | --- | --- |
| Neutral / `pipNeutral.svg` | Stehender Körper, offene Augen, ruhige Arme | Resttimerende, lokale Arbeitsweise, Gerätenotiz |
| Lächelnd / `pipSmile.svg` | Gebogene Augen, offener Mund, andere Arme | Bestätigte Speicherung, Import, Übungsabschluss |
| Winkend / `pipWave.svg` | Gehobener Arm mit gezeichneten Fingern | Einmalige Begrüßung eines geplanten Tages; wiederhergestellte Session |
| Konzentriert / `pipFocused.svg` | Geneigte Brauen, Hände am Körper | Bewusste Extra-Freigabe oder bestätigtes Undo |
| Bereit / `pipReady.svg` | Breitere Fußstellung, angewinkelte Arme | Tatsächlicher heutiger Plan nach der einmaligen Begrüßung |
| Schreibend / `pipWriting.svg` | Tieferer Körper, eigenes Blatt und Stift | Speichervorgang in Einstellungen oder neue Planfassung |
| Hantel haltend / `pipDumbbell.svg` | Zwei unterschiedlich hoch gehaltene Hanteln | Bestätigter Start eines gespeicherten Plantrainings |
| Stoppuhr haltend / `pipStopwatch.svg` | Eigenes Zifferblatt, veränderte rechte Hand | Optional aufgeklappte laufende Pause |
| Daumen hoch / `pipThumbsUp.svg` | Eigenständig gezeichnete Hand mit Daumen | Sparsam nach bestätigtem Satz oder verifizierter Sicherung |
| Ruhend / `pipResting.svg` | Niedriger Körper, ausgestreckte Füße, entspannte Augen | Geplanter Ruhetag; keine traurige Figur bei fehlender Leistung |
| Schlafend / `pipSleeping.svg` | Diagonal liegender Körper, geschlossene Augen | Ruhiger Leerzustand einer freiwilligen Messansicht |
| Nachdenklich / `pipThinking.svg` | Hand am Kinn, seitlicher Blick | Noch kein eingerichteter Plan |
| Überrascht / `pipSurprised.svg` | Hohe Brauen, runder Mund, gehobene Arme | Belegter gespeicherter Bestwert |
| Feiernd / `pipCelebrating.svg` | Beide Arme oben, abgehobene Füße, wenige Striche | Bestätigt gespeicherter Trainingsabschluss |
| Mit Lupe / `pipMagnifier.svg` | Eigene Lupe mit Griff und andere Armhaltung | Lokale Suche oder echter fehlender Treffer |
| Reparatur / `pipRepair.svg` | Gezeichnetes Pflaster auf dem Papierkörper | Tatsächlich bestätigter Speicher-Retry |

## Steuerung und Lebensdauer

`SketchPersonalityProvider` besitzt getrennte Schalter für Figur und Sprüche. Beide sind bei einer neuen Installation aus. `tone: off` deaktiviert dekorative Texte; notwendige Hinweise bleiben normale UI-Texte. Das Zeichenverzeichnis ist eine bewusst aufgerufene Vorschau.

Eine Sprechblase ist höchstens 6,5 Sekunden sichtbar. Sie erhält eine stabile Ereignis-ID, verschwindet beim App-Wechsel und wird beim Unmount abgeräumt. Dasselbe abgelaufene Ereignis wird beim erneuten Rendern nicht wiederholt. Ein Render wählt keinen neuen Text. Der begrenzte Ereignisspeicher gilt für die laufende App-Sitzung und sammelt keine persönliche Verhaltenshistorie.

Aus/Dezent/Lebendig, Reduce Motion und AppState steuern die Dekoration zentral. Eine abgebrochene Animation kann keinen Satz speichern, wiederholen oder verwerfen. Domain-Aktionen hängen nicht an Animations-Endcallbacks.

## Herkunft und Nachweise

Alle 16 Posen bestehen aus eigenen lokalen SVG-Pfaden. Dateien, Geometrie und Hashes werden automatisiert geprüft. Das tatsächliche Asset-Sheet unter `docs/design/FORM_15_SECOND_PASS_ASSET_SHEET.png` wurde aus derselben Registry erzeugt und visuell angesehen; es ist kein Geräte-Screenshot.

`tests/test-design-second.cjs` prüft Posen, Copy und Registry. `tests/test-motion-lifecycle-second.cjs` führt die tatsächlichen React-Hooks mit kontrollierten React-, Animated- und AppState-Adaptern aus. Diese Prüfungen ersetzen keine native Bedienungs-, Screenreader- oder Performanceprüfung; siehe `TEST_MATRIX_15_SECOND_PASS.md`.
