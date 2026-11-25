# FORM 15.0.0 — SECOND PASS: THE LIVING SKETCHBOOK
## Deep polish · Intelligent training · Hand-drawn personality · Real motion · Zero data loss

**Ergänzender Entwicklungsauftrag für die zweite Runde nach dem FORM-15.0.0-Master-Prompt. Kein neues Projekt, kein Fresh Start, kein Ersatz der vorhandenen Implementierung durch eine Demo.**

Du bist ein Senior iOS Product Designer, Illustrator, Motion Designer, UX Writer, React-Native-/Expo-Engineer, SQLite-Architekt und QA-Engineer. Der erste FORM-15.0.0-Master-Prompt wurde bereits bearbeitet oder sollte bearbeitet worden sein. Jetzt erhältst du den aktuellen Quellstand und diesen zweiten Auftrag. Arbeite an der tatsächlich zuletzt vorhandenen Version, nicht an einem älteren ZIP, wenn neuere Änderungen existieren. Lies zuerst den ursprünglichen Master-Prompt, diesen Ergänzungsauftrag, die bisherigen Changesets und den tatsächlichen Code. Gehe nicht davon aus, dass ein Punkt umgesetzt ist, nur weil er in einem früheren Bericht steht.

## 0. Auftrag und unveränderliche Regeln

- Der erste Master-Prompt bleibt verbindlich. Dieser Auftrag ergänzt die fehlenden und nur teilweise beschriebenen Punkte und konkretisiert die Designqualität. Bei Überschneidungen vorhandenen Code verbessern, nicht duplizieren.
- Sichtbarer Produktname FORM 15.0.0. Für die zweite Runde eine nachvollziehbare interne Buildnummer verwenden. Keine andere App-Identität erzwingen.
- Bundle-ID `app.athleteos.personal`, tatsächlichen bestehenden SQLite-Speicher (im Ausgangsstand `form-v84-clean.db`), Einstellungen, Profile, Ziele, historische Leistungen, aktive Workouts, Entwürfe, Plan-IDs, Favoriten und persönliche Fotos erhalten. Den tatsächlichen aktuellen Namespace vor Änderungen verifizieren. Kein Reset, kein neues Pflicht-Onboarding, keine automatische Wiederbelebung bewusst verworfener Altdaten.
- Ausschließlich Training aus meinem Plan; kein Quick Training, kein spontanes leeres Workout, auch nicht in versteckten Startpfaden. Historische spontane Einheiten bleiben lesbar, eine bereits aktive Alt-Session darf beendet werden.
- Die geplante Satzanzahl und die geplante maximale Wiederholungszahl sind echte Eingabegrenzen. Extra-Sätze und Extra-Wiederholungen nur durch ausdrückliche Aktion pro Übung bzw. Satzzeile. Tatsächlich weniger geleistete Wiederholungen dürfen ehrlich protokolliert werden. Nie alte Werte abschneiden. Kein automatisches Überschreiben des Plans durch Extras.
- YAZIO als primärer Ernährungsworkflow über tatsächlich unterstützten Apple-Health-Datenaustausch, keine erfundene API, kein Scraping, keine Passwörter. Ohne verfügbare HealthKit-Rechte funktioniert FORM einschließlich Gym weiterhin offline. Keine irreführenden Schalter für nicht verfügbare Integrationen.
- Qualität vor Feature-Anzahl. Alle neuen Komfortfunktionen müssen einen konkreten Nutzerfluss verbessern. Optionale Details in passende Unterseiten legen, nicht wieder ein überladenes Dashboard bauen.
- Keine persönlichen Angaben vorbefüllen, keine erfundenen Statistiken, keine Schuldzuweisung für Essen, Körper, Krankheit oder Ruhetage. Keine aggressiven Aufforderungen zu mehr Training oder weniger Essen.
- Keine falschen Build-, Test- oder Screenshot-Nachweise. Keine externen Uploads persönlicher Daten. Keine unlizenzierte Übernahme von HeyClicky-Grafiken, Texten, Fonts oder Code.

### 0.1 Zweite Qualitätsrunde statt blindem Feature-Ausbau

Erstelle zunächst `SECOND_PASS_AUDIT.md`: je Anforderung aus beiden Prompts Status **vorhanden und geprüft / vorhanden aber fehlerhaft / teilweise / fehlt / nativ blockiert / bewusst entfernt**; konkrete Datei, Einstiegspunkt, Speicherweg, Test und offene Akzeptanz. Prüfe sämtliche UI-Aktionen auf funktionslose Buttons, Duplikate, Dead Ends und irreführende Texte. Reproduziere bekannte Fehler, sichere den aktuellen Git-Stand. Erst danach ändern. Nach jeder Phase Regressionstests. Ein realer neuer Screen muss die vorhandenen Daten verwenden; kein statischer Showcase. Nichts als fertig markieren, bevor die jeweilige Abnahme erfolgt ist.

---

## 1. Der wichtigste neue Schwerpunkt: Eine echte illustrierte Produktwelt

Die App soll wirken wie ein persönliches, liebevoll gestaltetes Trainingsheft, das lebendig geworden ist. Referenz für die allgemeine visuelle Persönlichkeit: https://www.heyclicky.com/. Analysiere im Browser die tatsächlichen Interaktionen, typografische Hierarchie, handgezeichneten Details, Desktop-Nostalgie, Figuren, trockenen Humor und Leerräume, soweit verfügbar. Notiere, was du gesehen hast und was du daraus abstrakt ableitest. Kopiere keine konkreten Figuren, Illustrationen, Texte, Screens oder Markenidentität. Entwickle eine eigenständige FORM-Welt. Kein gewöhnliches Fitness-Dashboard, das nur ein paar Sterne erhalten hat.

### 1.1 Art Direction

- Warmes Papier, kräftige Tintenfarben, klare große Headlines, echte Leerflächen, bewusst unperfekte organische Konturen. Ausgangstokens aus dem ersten Prompt nutzen (Paper #FAF9F3, Ink #1D2025, Blue #2655D9, Sticker #FFE48A, Mint #CFE8D5, Rose #F4D0C8); Kontraste prüfen. Dark und Paper Mode mit eigener sinnvoller Tinte, keine simple Invertierung.
- Editoriale, abwechslungsreiche Layouts: Startseite wie ein Tagesblatt, Plan wie ein aufgeschlagenes Heft, Training wie ein Arbeitsblatt, Fortschritt wie ein persönlicher Filmstreifen, Gesundheit wie ein Beobachtungsbuch. Einstellungen als ruhige Werkstatt, nicht als Sammlung von Bannern.
- Eigene kleine Papiertexturen, dezentes Korn, Klebestreifen, Büroklammern, leichte unregelmäßige Unterstreichungen, freie Kritzeleien, Pfeile, Stempel, Fenster-Titelleisten, Notizbuch-Reiter und Randnotizen. Texturen lokal und selbst erzeugt, keine lauten Vollflächen. Hintergrunddetails müssen die Lesbarkeit erhalten. Datenfelder, Timer und Tabellen bleiben präzise ausgerichtet; niemals Zahlentext absichtlich schief stellen.
- Durchgehendes Raster, Touchziele von mindestens 44 × 44 pt, klare visuelle Hierarchie, echte native Safe Areas. Auf kleinem iPhone SE testen. Keine überladenen Kartenraster und keine Pflichtanimation, bevor ein Nutzer einen Satz eingeben kann.
- Eigenständige Typografie: lizenzierte Display-, UI-, Mono- und Handschriftfamilien (z. B. Outfit, DM Sans, JetBrains Mono, Patrick Hand), tatsächlich integrierte lokale Assets und OFL/Lizenzen. Handschrift nur für Charaktertexte, Randnotizen und Akzente, niemals für kritische Eingabewerte. Font-Fallback und Dynamic Type prüfen. Keine neue Netzwerkpflicht beim App-Start.

### 1.2 Eigener FORM-Charakter (keine Kopie von HeyClicky)

Entwickle eine eigene kleine Tintenfigur, Arbeitstitel **Pip** (Name frei änderbar). Zum Beispiel eine asymmetrische Papierfigur mit zwei Punkten als Augen, kleinen Armen und einem charakteristischen blauen Strich; entwirf eigenständig. Erstelle eine Character Bible mit Silhouette, Strichstärke, Proportionen, Farbregeln, erlaubten Posen und Expressions. Die Figur ist Helfer und dekorative Persönlichkeit, kein vorgetäuschter KI-Coach. Niemals Nutzer beschämen oder Körper bewerten.

Mindestens 16 tatsächlich unterscheidbare Expressions/Posen: neutral, lächelnd, winkend, konzentriert, bereit, schreibend, Hantel haltend, Stoppuhr haltend, Daumen hoch, erschöpft im positiven Ruhetag-Kontext, schlafend, nachdenklich, überrascht, feiernd, mit Lupe, mit Pflaster als rein symbolischer Speicher-Reparaturhinweis. Posen müssen eigenständig gezeichnet sein, nicht nur identische Figur plus Emoji. Nur bei passenden Zuständen sichtbar. Keine traurige Figur bei einem ausgelassenen Training, keine Belohnung für Kaloriendefizite oder Überlastung. Der Nutzer kann die Figur und ihre Sprüche separat abschalten. Reduce Motion respektieren.

### 1.3 Verbindlicher Illustrationskatalog

Erstelle **mindestens 48 eigenständige lokale Illustrationsmotive insgesamt** (inklusive Charakterposen, aber ohne Farbvarianten als neue Motive zu zählen). Setze sie als echte SVG-Pfade oder lizenzierte eigene Rastergrafiken um, nicht als Unicode-/Emoji-Sammlung. Ziele:

- 16 Charakterposen wie oben.
- 8 Fitnessmotive: Langhantel, Kurzhantel, Kettlebell, Scheiben, Rack, Schuh, Trainingsbank, Stoppuhr.
- 8 Notizbuch-/Desktopmotive: aufgeklapptes Heft, Bleistift, Radiergummi, Tape, Büroklammer, Ordner, Diskette, Retro-Fenster.
- 6 Gesundheitsmotive: Schlafmond, Wasserglas, Teller, Herz, Schritte, ruhende Figur/Erholung.
- 5 Fortschrittsmotive: Stern, Pfeil, Kalenderstempel, Filmstreifen, Trainingsreceipt.
- 5 Zustandsmotive: Lupe ohne Suchtreffer, Wolke offline, lokales Speichern, verbundenes Datenkabel, reparierbarer Speicherfehler.

Zeichne zusätzlich eigene handgezeichnete Tab-Icons für Heute, Plan, Training, Fortschritt, Gesundheit und Profil, je mit ausgewähltem und neutralem Zustand. Wichtige Symbole wie Löschen oder Zurück bleiben verständlich und barrierefrei. Erstelle 8–12 neutrale Bewegungs-/Geräte-Doodles für Katalog-Kategorien (nicht als falsche Anleitung für eine konkrete Übung ausgeben); korrekte lizenzierte Übungsfotos bleiben der Standard für technische Ausführung. Eigene Doodles mit Quellen-/Urheberschaftsmanifest und Asset-Registry. Alle Assets müssen offline verfügbar sein. Erstelle ein tatsächliches Asset-Sheet aus den implementierten Assets, nicht ein separat erfundenes Designbild.

### 1.4 Individuelle App-Icons und visuelle Einstellungen

Entwirf mindestens vier eigene Icon-Varianten: Ink, Paper, Blueprint, Retro. Erzeuge die benötigten iOS-Assets in korrekter Größe, dokumentiere Alternate-App-Icon-Konfiguration, prüfe native Build-Kompatibilität und tatsächliche Umschaltung. Wenn Alternate Icons im unsigned Build nicht funktionieren, die Variante nicht als auswählbar darstellen; keine falsche Erfolgsanzeige. Themes Light, Dark, Paper und ein dezentes Retro-Thema; Systemmodus bleibt vorhanden. Bereits gewähltes Theme beim Update erhalten.

---

## 2. Motion-System — sehr viele echte, aber sinnvolle Animationen

Entwickle eine zentrale Motion-Bibliothek, keine verstreuten zufälligen `setTimeout`-Effekte. Verwende kompatible React-Native-Animated-/Reanimated-/SVG-Lösungen. Prüfe die vorhandene Expo-Version, bevor du native Dependencies ergänzt. Leichte Haptik nur nach Einwilligung; Reduce Motion und eine zusätzliche Einstellung **Aus / Dezent / Lebendig**. Selbst im lebendigen Modus keine dauernde Dekoration im Gym und kein blockierendes Intro.

### 2.1 Mindestens 36 eigenständige Animationsabläufe

Implementiere folgende Abläufe als wiederverwendbare Komponenten/Varianten mit realen Triggern. Liste zu jedem Ablauf Trigger, Dauer, Easing, Fallback, betroffene Screens und Test in `MOTION_CATALOG.md`.

| Nr. | Animation | Tatsächlicher Trigger / Verhalten |
|---|---|---|
| 01 | Ink Reveal | SVG-Pfad zeichnet sich beim ersten passenden Öffnen entlang der Linie |
| 02 | Pencil Check | Nach bestätigtem SQLite-Satzabschluss gezeichnetes Häkchen |
| 03 | Eraser Undo | Erfolgreiches Rückgängigmachen entfernt den Haken wie ein Radiergummi |
| 04 | Marker Swipe | Heute-Markierung zieht sich unter dem realen Trainingstag entlang |
| 05 | Paper Flip | Übungswechsel mit kurzem Papier-/Slide-Effekt |
| 06 | Notebook Tab | Aktiver Wochentag bewegt seinen Reiter dezent |
| 07 | Sticker Pop | Echter neuer PR erscheint als kleiner Sticker |
| 08 | Stamp Press | Abgeschlossene Trainingseinheit erhält einen Stempel |
| 09 | Rest Dial | Gezeichneter Pausenbogen aktualisiert sich aus realem Zeitstempel |
| 10 | Rest Done | Ein einzelner Strich zeigt abgelaufene Pause an |
| 11 | Stopwatch Click | Workoutstart aktiviert kleine Stoppuhrzeichnung |
| 12 | Pause Pin | Bei ausdrücklicher Workout-Pause hält eine Klammer den Timer optisch fest |
| 13 | Resume Unpin | Beim Fortsetzen kurze Gegenanimation |
| 14 | Extra Row | Bewusst hinzugefügter Satz klappt als markierte Zusatzzeile auf |
| 15 | Extra Rep | Explizite + Wdh.-Freigabe erhält eine kleine Tintenmarkierung |
| 16 | Field Focus | Aktives Eingabefeld erhält einen ruhigen Fokusstrich |
| 17 | Saved Dot | Speicherstatus wechselt erst nach bestätigtem Commit |
| 18 | Retry Repair | Speicherfehler/Retry hat eigene kurze Illustration, kein Erfolgsvortäuschen |
| 19 | Receipt Print | Gespeichertes Workout erscheint als kurzer Trainingszettel |
| 20 | Chart Draw | Echte Chartlinie zeichnet sich einmalig beim Zeitraumwechsel ein |
| 21 | Chart Cursor | Beim Antippen erscheint präzise der echte Wert am Datum |
| 22 | PR Star Draw | Einmalig gezeichneter Stern bei belegtem Rekord |
| 23 | Calendar Slide | Wochenwechsel ohne springende Tagesbeschriftung |
| 24 | Plan Reorder | Zugängliche Umsortierung mit kurzer Bewegung |
| 25 | Copy Paper | Duplizierter Trainingstag erscheint als zweite Papierseite |
| 26 | Folder Open | Aufklappen des Archivs oder einer Planliste |
| 27 | Tape Peel | Bewusstes Schließen einer optionalen Notiz |
| 28 | Clip Attach | Speichern einer Studio-/Übungsnotiz |
| 29 | Mascot Wave | Einmalige Begrüßung, jederzeit überspringbar |
| 30 | Mascot Expression | Zustandsabhängiger kurzer Gesichts-/Posenwechsel |
| 31 | Search Peek | Lupe beim Öffnen der Suche, ohne Eingabeverzögerung |
| 32 | Empty Doodle | Einmalige kleine Zeichnung bei echtem Leerzustand |
| 33 | Connection Sketch | YAZIO-/Health-Verbindung nur bei bestätigtem Status |
| 34 | Sync Tick | Erfolgreicher Import mit Zeitstempel, keine Animation bei Fehler |
| 35 | Backup Envelope | Backup-Erfolg erst nach tatsächlichem Schreiben |
| 36 | Launch Ink | Optionaler nicht blockierender kurzer Logo-Strich beim Laden |
| 37 | Film Strip | Horizontale Monats-/Jahresrückblick-Übersicht |
| 38 | Theme Transition | Ruhiger Farbwechsel, kein Flackern oder Neustart |
| 39 | Widget Return | Bei Rückkehr aus unterstütztem Deep Link kurze Orientierung |
| 40 | Retro Window | Öffnen/Schließen eines optionalen Desktop-Dialogs |

### 2.2 Umsetzung und Grenzen

- Für echtes Strichzeichnen `strokeDasharray`/`strokeDashoffset` bzw. kompatible Pfadtechniken verwenden; nicht bloß eine fertige Illustration einblenden. Wenn native Treiber für bestimmte SVG-Attribute nicht verfügbar sind, die konkrete Implementierung und Performance prüfen.
- Meist 120–350 ms für Aktionen, 350–700 ms für passende Illustrationen; kein erzwungenes Warten. Start- und Abschlusszeichnungen dürfen neben sofort benutzbaren Controls laufen. Kein zehnsekündiges Konfetti. Timerwerte stabil, niemals animierte unrichtige Zahlen.
- Deko stoppt bei AppState inaktiv, bei unmount und Reduce Motion. Keine unendlichen Animationen im Hintergrund; Timer-Updates nur in kleinen Komponenten. Keine Animationsqueue, die bei schnellem Tippen Aktionen wiederholt. Keine blockierende Splashscreen-Animation oder jedes Mal wiederholte Tour.
- UI-Zustand muss unabhängig von der Animation korrekt sein. Ein abgebrochener Effekt darf keine Aktion verlieren. Screenreader bekommt sinnvoll beschriftete, nicht dekorative Elemente. Die Animation ist kein einziger Feedbackkanal.
- Native Leistungsprüfung auf kleinem iPhone, mit 100+ Historieneinträgen und Eingabefokus. FPS/CPU nur nennen, wenn tatsächlich gemessen. Tatsächliche kurze Screenrecordings des Workoutstarts, Satzabschlusses, Extras, Übungswechsels und Finish liefern, sofern Umgebung erlaubt. Keine Mockups als Beweis.

---

## 3. UX Writing — trocken, verspielt, persönlich, nicht generisch

Erstelle eine kleine FORM-Redaktionssprache, inspiriert von der freundlichen, leicht absurden Desktop-Persönlichkeit der Referenz, jedoch mit selbst geschriebenen Formulierungen. Kurze Sätze, gelegentliche englische Nebenbemerkungen, deutsche Hauptaktionen. Keine 0815-Poster wie „No pain no gain“. Keine ständige Motivationspredigt. Die Texte sollen zu tatsächlichen Situationen passen.

### 3.1 Textsystem und Regeln

Erstelle `copy.de.ts` und gegebenenfalls `copy.en.ts` mit typisierten Ereignissen, mindestens 100 eigenständigen kurzen Varianten verteilt über Zustände; jeder Text einem Trigger, Tonmodus und optionalem Charakter zugeordnet. Keine zufällige Wahl bei jedem Render: Variante pro Ereignis stabil, Wiederholungsbremse, opt-in, keine persönliche Zahl erfinden. Coach-Off deaktiviert dekorative Sprüche, nicht notwendige Fehlermeldungen. Technische Fehler zuerst sachlich und handlungsorientiert; Humor nur ergänzend. Kein Witz über Datenverlust. Keine Beschämung, keine Kalorienmoral, kein Druck bei Pause/Verletzung, keine Aufforderung zu Extras. Ruhiger Ton bei Gesundheit. Sprüche über Rekorde ausschließlich bei wirklich bestätigtem Rekord.

Beispielhafte Originaltexte als Startpunkt, nicht aus HeyClicky kopieren:

| Situation | Mögliche Texte |
|---|---|
| Startseite / geplanter Tag | „Dein Plan liegt bereit.“ · „Eine neue Seite.“ · „Today's page is yours.“ |
| Ruhetag | „Heute hat auch dein Bleistift frei.“ · „Ruhe gehört zum Plan.“ · „Rest is part of the plot.“ |
| Kein Plan | „Hier fehlt nur dein Plan.“ · „Ein leeres Heft. Gute Voraussetzungen.“ |
| Workoutstart | „Das Heft ist offen.“ · „Okay, wir sind live.“ · „Let's put ink on paper.“ |
| Satz gespeichert | „Tinte trocken.“ · „In den Büchern.“ · „One more line.“ |
| Pause | „Kurz durchatmen.“ · „Die Hantel läuft nicht weg.“ · „A tiny intermission.“ |
| Pause abgelaufen | „Bereit, wenn du es bist.“ · „Nächste Zeile?“ |
| Extra freigegeben | „Zusatzzeile freigegeben.“ · „Am Rand notiert.“ |
| Übung beendet | „Kapitel erledigt.“ · „Diese Seite ist voll.“ |
| Training beendet | „Gut dokumentiert.“ · „That's a wrap.“ · „Deine Arbeit, schwarz auf weiß.“ |
| Tatsächlicher PR | „Das verdient einen Stern.“ · „A little historical moment.“ |
| Wiederhergestellte Session | „Wir waren noch nicht fertig.“ · „Dein Platz ist noch frei.“ |
| Suche ohne Treffer | „Meine Lupe war nicht erfolgreich.“ · „Andere Schreibweise probieren?“ |
| Speichern | „Wird gespeichert …“ · nach Erfolg „Gespeichert. Punkt.“ |
| Backup erfolgreich | „Ein zweites Exemplar.“ · „Gut abgeheftet.“ |
| Offline | „Offline? Das Heft funktioniert trotzdem.“ |
| YAZIO-Import erfolgreich | „Die Daten sind angekommen.“ · „Frisch synchronisiert.“ |
| Keine Messdaten | „Noch nichts eingetragen. Alles zu seiner Zeit.“ |

Für die Figur zusätzlich kurze optionale Sprechblasen, nicht dauerhaft am Bildschirm. Sprüche und Zeichnungen bei Satzabschluss sparsam dosieren (z. B. erster Satz des Tages, echter Rekord oder Workout-Finish), bei schnellen Satzaktionen kein Lärm. Keine Motivationspflicht. Easter Eggs optional: sieben Logo-Taps, Retro-Fenster, versteckter Archivsticker, seltene alternative Randkritzelei, echte 100-Workout-Marke, Kalenderstempel für tatsächliche Abschlüsse. Jede Entdeckung unabhängig von gesunden Verhaltensweisen, keine Belohnung für riskante Trainingsbelastung.

---

## 4. Intelligenter Plan und Gym — alle bisher fehlenden Komfortdetails

### 4.1 Individuelle Sollwerte für jeden Satz

Plan-Editor mit unterschiedlichen Sollwerten je Satz: z. B. 12/10/8 Wdh., optionales Zielgewicht 40/42,5/45 kg, RIR/RPE, Satztyp, Pausenzeit, Tempo, Zeit/Distanz und Notiz. Optional gemeinsam bearbeiten oder einzelne Zeilen ändern. Für Körpergewichts-/Timed-/Distance-/AMRAP-Sätze semantisch passende Eingaben. Alte Pläne mit einheitlichem Soll verlustfrei auf Zeilen abbilden. Keine falschen Null-Kilogramm-Rekorde. Laufende Sessions verwenden immutable Plan-Momentaufnahme. Extra-Satz erbt sinnvolle Vorschlagsstruktur, wird klar separat markiert. Limits pro Zeile validieren. Zielwerte sind Vorschläge, tatsächliche Leistungen dürfen niedriger sein.

### 4.2 Vorwerte und Progressive Overload

- Gewicht und Wdh. des letzten vergleichbaren Satzes automatisch als **sichtbarer, noch unbestätigter Vorschlag** einsetzen, optional deaktivierbar. Kein Ghost-Value als tatsächliche Leistung. Vorschlag über Rep-Limit nicht unbemerkt kürzen; Originalvorwert anzeigen, explizite Freigabe notwendig. Zielgewicht und letzter Wert klar unterscheiden.
- Regelbasierte Progressionsvorschläge, kein angeblich allwissender KI-Coach. Mindestens zwei vergleichbare abgeschlossene Sessions mit passenden Arbeitssätzen, eindeutiger Übungs-ID und brauchbaren Angaben. Wenn obere Sollgrenze bei kontrolliertem RIR in mehreren Sessions erreicht wurde, optional eine kleine konfigurierbare Steigerung des Zielgewichts vorschlagen. Ansonsten Halten, weniger Reps oder keine Empfehlung; bei fehlenden Daten keine Empfehlung. Keine automatische Planänderung, keine Zwangssteigerung. Erholung und RIR beachten, keine Empfehlung bei Schmerzangaben/ausdrücklicher Überlastung. Trainingserfolg nicht mit Extras verwechseln.
- Vorschlag mit Grundlage: „In 2 vergleichbaren Sessions alle geplanten Arbeitssätze erreicht; Vorschlag +2,5 kg.“ Annahme oder Ablehnung explizit, Planänderung versionieren. Konfigurierbare Gewichtsschritte und Rundung entsprechend Studioausrüstung. Für Bodyweight Leistung anhand Wdh./Zeit statt Last, für Ausdauer eigene Logik. Deload ist freiwillig, keine Diagnose.
- Plateau erst bei mehreren ausreichend vergleichbaren Sessions erkennen (z. B. mindestens vier über mehrere Wochen; Schwellen dokumentieren), wenn weder Last, Reps noch andere passende Leistungskennzahlen steigen. Bei Datenlücken, Übungswechsel, Deload oder stark wechselnden Sollwerten unterdrücken. Kein „du stagnierst“ nach einem einzelnen Training.

### 4.3 Bedienung im Gym

- Undo für versehentlichen Satzabschluss, Extra-Freigabe, Verschiebung, Löschen und Übungstausch soweit sicher. Nach Commit atomare Gegenoperation, nicht nur UI-Haken ändern; Timer und Benachrichtigung passend abbrechen/rekonstruieren, PR/Analytics neu berechnen. Undo darf nach Neustart entweder verfügbar sein oder mit dokumentierter sicherer Grenze enden. Destruktive Historienänderungen mit Bestätigung.
- Übung überspringen oder vorübergehend deaktivieren, ohne sie aus Plan oder Historie zu entfernen. Status und Grund optional, kein Druck. Geplante Sätze zählen weiterhin korrekt, ausgelassene nicht als erledigt. Vorzeitiges Finish mit bereits gespeicherten Sätzen und neutraler Übersicht fehlender Sollsätze.
- Einzelne geplante Termine verschieben, z. B. Donnerstag auf Freitag, ohne Serienplan oder abgeschlossene Workouts zu verändern. Separate Occurrence-ID, keine Doppelzählung. Optionaler Tag bleibt optional. Bei Konflikten Auswahl statt heimlicher Überschreibung.
- Tastatur Next/Done: Gewicht → Wdh. → optional RIR, automatische Fokusführung nur auf Wunsch, Dezimalkomma/Punkt korrekt. Kein Häkchen durch Keyboard-Submit ohne ausdrückliche Nutzeraktion. Eingaben bei Tabwechsel, Tastatur schließen und App-Wechsel behalten.
- Unilaterale Sätze mit links/rechts getrennten tatsächlichen Lasten und Reps; deutlich markieren, wie Volumen aggregiert wird. Gewichte pro Hand vs. Gesamtgewicht eindeutig. Keine doppelte Zählung einer bilateralen Übung.
- Studio- und Maschinennotizen direkt neben Übung erreichbar: Sitzhöhe, Pin, Griff, Rack-Höhe, Gerät/Studio, Stack-Offset optional. Konfigurierbarer Scheibenbestand und Stangengewicht, keine Annahmen über Geräte als persönliche Daten. Vorschläge für Warm-up optional.
- Geschätzte Trainingsdauer aus Soll-Sätzen, Pausen, freiwillig geschätzter Satzdauer und ggf. Blockzeit berechnen, nicht erfunden als exakte Zeit anzeigen. Unsicherheit/fehlende Basis klar markieren. Pausen und Zeitblöcke nicht doppelt rechnen.
- Nach Abschluss tatsächlicher Vergleich mit letzter vergleichbarer Einheit: geplante/erledigte/zusätzliche Sätze, Last/Reps, geeigneter Volumenvergleich, Dauer, tatsächliche Pausen soweit messbar. Bei geänderter Routine Vergleichslimit erklären. Keine fiktive Rangliste.
- Optional Bildschirm während aktivem Training eingeschaltet halten (z. B. kompatibles KeepAwake-Modul); nur solange aktiv und Einstellung an, sauber beim Tabwechsel/Finish/Unmount deaktivieren. Akkuhinweis. Keine unerlaubte Hintergrundausführung.
- Einstellbare Gym-Schriftgröße, große Eingaben, Links-/Rechtshänder-Layout für Check und Schnellaktionen; System-Dynamic-Type nicht überschreiben. Mehrere Extras nacheinander einzeln erlauben, ohne Modal-Kette. Keine Doppeltipp-Duplikate. Quick Training bleibt entfernt.

### 4.4 Plan-Editor 2.0

- Mehrwöchige Zyklen mit unterschiedlichen Wochen und optionalen Deload-Wochen; geplante Last-/Reps-Steigerungen nur explizit konfiguriert. Keine automatisch generierten persönlichen Werte. Kalender zeigt aktuelle Zykluswoche korrekt.
- Einzelne Übungen und ganze Trainingstage kopieren/duplizieren, zwischen Tagen verschieben; neue Instanz-IDs, stabile Bibliotheks-Übungs-ID, keine Referenz auf alte abgeschlossene Sätze. Batch-Editor für ausgewählte Übungen/Sätze (Pause, RIR, Soll, Last); Vorschau und eindeutiges Speichern.
- Planversionierung: append-only Revision bei bestätigter Änderung, Zeitpunkt, optionaler Kommentar, nachvollziehbarer Vergleich, alte Version ansehen/duplizieren/wieder aktivieren durch neue Revision. Keine rückwirkende Änderung abgeschlossener oder laufender Workouts. Keine unendliche Duplikat-Inflation bei jedem Tastendruck; Entwurf separat.
- Übung vorübergehend deaktivieren, optionale Ersatzübung(en) je Planposition festlegen; im Gym Wechsel auf Ersatz dokumentieren, Originalbezug bleibt. Individuelle Satzpausen, korrektes Superset-Verhalten, normaler Plan bleibt unverändert.
- Import aus geschriebenem Text UND bestehendem JSON. Lokaler deterministischer Parser für Zeilen wie `Montag – Upper`, `Bankdrücken 3x8, 90s` und optional Zeilen je Satz. Nutzer bestätigt Zuordnung, Wochentag, Satztyp, Einheit und Übungs-ID in Vorschau; Unklarheiten nicht still raten. Kein API-Key oder Internetzwang. Nichts importieren, bevor Vorschau bestätigt. Alte JSON-Formate kompatibel halten.
- Wochenübersicht der geplanten Arbeitssätze pro Muskelgruppe, primäre/sekundäre Muskeln getrennt und nachvollziehbar; keine pseudowissenschaftlichen Prozente. Optionale Tage getrennt. Tatsächliche Leistung gehört in Analytics, nicht in geplantes Soll.

---

## 5. Datenintegrität, Autosave und Wiederherstellung verbessern

- Zentrale serialisierte Schreibpipeline und atomare idempotente Aktionen für Start, Satzabschluss, Extra-Freigabe, Undo, Finish und Sync. Schutz vor verlorenen Updates bei gleichzeitigen Draft-/Settings-Schreibvorgängen. Stabile IDs und Unique Constraints passend zum vorhandenen SQLite-Modell. `Saved` erst nach Commit. Schreibfehler behalten Eingaben im RAM, Retry und verständliche Meldung. Kein Reset bei DB-Lesefehler. Schreibjournal/Recovery nur wenn sinnvoll, keine großen JSON-Vollwrites pro Tastendruck.
- Jede geplante und zusätzliche Satzzeile hat unabhängigen gespeicherten Draft inklusive Gewicht, Reps, RIR/RPE, Satztyp, Extra-Rep-Allowance, Notizen, Zeit/Distanz. Persistenter aktueller Übungsfokus, Uhr, Resttimer und Session-Momentaufnahme. Timer mit UTC-Start/Endzeit, expliziten Pausen und nachvollziehbarer Behandlung von Systemuhr-Sprüngen. Keine versteckten Auto-Abschlüsse langer Sessions.
- Automatische lokale Backup-Rotation: konfigurierbar und standardmäßig datensparsam, z. B. maximal 7 tägliche konsistente Snapshots und 3 Versions-/Vor-Import-Snapshots, erst nach verifiziertem neuen Snapshot ältere nach Policy löschen. Manuelle Backups separat behandeln, nicht automatisch löschen. Atomare Erstellung, Integritätscheck und Anzeige Datum, Größe, Schema, Quelle. Keine unbeabsichtigte Cloud-Kopie. Auf Wunsch verschlüsselter Export mit bestehender geprüfter Kryptografie; automatische lokale Snapshots klar als geschützt oder unverschlüsselt kennzeichnen, keine Sicherheitsgarantie vortäuschen. Wiederherstellung mit Vorschau und Bestätigung, Vorher-Snapshot, Rollback, kein Überschreiben durch beschädigte Datei.
- Eigene Fotos in privatem App-Speicher mit Asset-ID und relativem Pfad ablegen, portable Backup-Dateien inklusive Medienmanifest/Integrität, EXIF entfernen soweit beim Export erforderlich. Import in temporären Bereich, erst nach Validierung übernehmen, keine Pfad-Traversal-Lücken. Alte Referenzen migrieren oder fehlende Datei klar melden. Keine automatische Freigabe von Fortschrittsfotos.
- Datenschutz-/Diagnoseansicht mit Schema-Version, letzter erfolgreicher DB-Write, letztem Backup, Größe/Anzahl lokaler Daten und Medien, Integritätsprüfung, Buildversion, tatsächlichem HealthKit-/Widget-Funktionsstatus und Retry. Diagnoseexport nur nach Zustimmung und standardmäßig ohne persönliche Werte, Notizen oder identifizierende Daten.
- Native Benachrichtigungen an Session-/Timer-ID koppeln, beim Ändern/Skip/Undo/Finish/Discard alte Notifications zuverlässig stornieren. Wiederherstellung doppelter Timer vermeiden. Standard-Build ohne zusätzliche Berechtigungen bleibt funktionsfähig.

---

## 6. Analytics, die wirklich helfen (keine Statistikflut)

Separat erreichbare Detailseiten, Startseite zeigt höchstens einen freiwillig gewählten relevanten Überblick. Nutzer kann wenige Kennzahlen favorisieren; keine neue unübersichtliche Dashboard-Sammlung.

- Trainingskalender mit tatsächlichen Sessions, verschobenen Terminen, geplanten/erledigten/ausgelassenen/optionalen Tagen und Ruhetagen. Kalender nutzt lokale Tagesgrenzen, historische Zeitstempel bleiben unverändert. Tap öffnet echte Einheit.
- Monatsvergleiche und Jahresverlauf: absolvierte Einheiten, geplante/erledigte Arbeitssätze, Extras separat, Trainingsdauer, geeignetes Volumen; vergleiche gleich lange Zeitfenster oder kennzeichne unvollständige Perioden. Monatlicher und jährlicher Rückblick mit echten Daten, keine fictiven Top-Prozent-Werte.
- PR-Archiv mit Übung, Datum, Satzdetails und PR-Typ (Last, Reps bei gleicher Last, geeigneter e1RM, Bodyweight-Reps, Zeit/Distanz). Warm-ups, assistierte/Timed-Sätze nur in passenden Metriken. Korrekturen/Löschungen berechnen PRs neu. Keine rekordverdächtige Animation vor Commit.
- Leistungsentwicklung bei gleichem Gewicht, Top-Sätze, Arbeitssätze, RIR-Kontext, Plateau-Regeln aus Abschnitt 4.2. Wochenvolumen und Satzanzahl pro Muskelgruppe mit primären/sekundären Zuordnungen, Warm-ups optional getrennt, Bodyweight und Zeit-/Distanzleistungen separat. Keine Addition inkompatibler Maßeinheiten.
- Geplante vs. tatsächliche Leistung pro Routine und Satz; Planrevisionen sauber unterscheiden. Keine Strafe für optionale Tage oder ehrliche weniger geleistete Wiederholungen.
- Durchschnittliche Trainingsdauer aus abgeschlossenen Sessions; bewusst pausierte Zeit separat. Tatsächliche Pausen anhand gemessener Timer-/Satzereignisse, nicht pauschal aus geplanten Werten. Bei unvollständiger Messbasis anzeigen, wie viele Pausen beobachtet wurden.
- Interaktive zeitbasierte Charts mit richtigen X-Abständen, Tooltip/Fadenkreuz, Datum, Wert, Einheit, zugänglicher tabellarischer Alternative, 7/30/90/180 Tage/Jahr/gesamt wo sinnvoll. Animation nur bei Wechsel, kein Neuzeichnen bei jedem Tick. Optionale Favoriten und Export.
- Schlaf/Erholung und Training als explorative Gegenüberstellung, nur genügend gemeinsam verfügbare Daten, keine Kausalitätsbehauptung oder medizinische Diagnose. Fehlende Werte nicht als null messen. Datenquellen zeigen. Neutrale Körper- und Ernährungsansichten, keine Gewichtsabnahme-Wettbewerbe.

---

## 7. YAZIO und Gesundheit — zweiter Integrationscheck

Der erste Prompt beschreibt den offiziellen HealthKit-Weg. Verifiziere im aktuellen Build, ob er tatsächlich implementiert ist und welche Datentypen YAZIO derzeit unterstützt. Offizielle YAZIO-/Apple-Dokumentation konsultieren; keine Vermutung als API-Vertrag behandeln. Signierungsgrenzen des Sideloadly-Builds ehrlich berücksichtigen.

- Automatische Aktualisierung beim Öffnen des Gesundheits-/Ernährungsbereichs und optional beim Foreground, mit Debounce, Aktualitätsgrenze, laufender Sync-Sperre und sichtbarem Status. Manueller Refresh jederzeit möglich; kein permanentes Polling. Anzeige letzter erfolgreicher Sync, Fehlermeldung und letzter bekannter Datenstand. Wenn Berechtigungen fehlen, klare Einrichtung oder manueller Fallback, keine erfundene Erfolgsmeldung.
- Historische Ernährungseinträge in auswählbarem Zeitraum importieren (z. B. 7/30/90 Tage), paginieren, Quelle und Zeitstempel bewahren. Kalorien/Protein/Kohlenhydrate/Fett nur aus tatsächlich verfügbaren HealthKit-Samples. Quellfilter und Reconciliation für geänderte/gelöschte Samples; dieselben Daten nicht mehrfach zählen. Manuell eingegebene Werte getrennt, kein automatisches Vermischen. Keine Kalorien automatisch als 0 anzeigen, wenn Daten fehlen.
- Nährstoffziele aus YAZIO ausschließlich übernehmen, wenn ein aktuell dokumentierter, tatsächlich verfügbarer Datenweg existiert. Andernfalls eigene optionale Ziele manuell eingeben und klar als FORM-Ziele bezeichnen. Keine erfundene API. Wochenübersicht mit echten Daten, Vollständigkeitskennzeichnung.
- Apple-Watch-Daten über Apple Health nur bei tatsächlicher Verfügbarkeit/Einwilligung und unterstützten Datentypen. Herkunft anzeigen; doppelte Schritte/Workouts nicht durch mehrere Quellen summieren. Optional FORM-Workouts an HealthKit schreiben, nur nach Einwilligung und bestätigtem Abschluss; stabile IDs, Korrektur/Exportlöschung nur eigener Samples, Import-Export-Schleifen verhindern.
- YAZIO öffnen ausschließlich mit verifiziertem unterstützten Deep Link oder regulärem App-Store-/Website-Fallback, nicht mit erfundenem URL-Scheme. Kein zweites vollständiges Ernährungstagebuch als Hauptworkflow; manueller Weg diskret erreichbar, alte Logs erhalten.
- Realer YAZIO → Apple Health → FORM-Test auf entsprechend signiertem Gerät und optionaler unterstützter Rückweg. Mock-Abfragen für Duplikate, leere Daten, fehlende Felder, Zeitzonen, geänderte Quellen, Abbruch. Standard-Sideloadly-IPA muss unabhängig davon weiter baubar sein. Optionalen HealthKit-Build nicht als sicher funktionierend auf kostenlos signiertem Gerät ausgeben.

---

## 8. Komfort und reduzierte Navigation

- Globale lokale Suche mit Ergebnistypen (Übungen, Pläne, absolvierte Einheiten, Einstellungen), Deep Link zum tatsächlichen Detail, Suchverlauf optional und lokal. Kein Quick-Workout-Startpfad durch Suche. Favoriten/zuletzt verwendete Übungen, Geräte-/Muskelgruppenfilter. Katalog virtualisieren und nur passende lizenzierte Originalbilder zeigen.
- Startseite freiwillig konfigurieren: heutiger Plan und Fortsetzen sind immer die zentrale Aktion, zusätzlich maximal wenige optionale Kennzahlen/Schnellzugriffe. Standard bewusst ruhig, keine beliebig große Widget-Sammlung innerhalb der App. Häufig genutzte Funktionen nur als optionale Verknüpfungen, nicht als zusätzliche Hauptnavigation.
- Homescreen-Widget für nächstes Training, tatsächlichen Wochenfortschritt, optional Mini-Figur. Live Activity mit Sessiondauer und Resttimer aus Zeitstempeln; bestehende native Targets/Entitlements/Deep Links prüfen, Aktualisierung nach Änderung, Ende nach Finish/Discard. Private Informationen minimal. Nicht unterstützte Signierung → sauberer Fallback mit In-App-Minileiste; keine leeren Widgets und keine neue ungeprüfte native Abhängigkeit.
- Haptik/Ton separat konfigurierbar, Motion-Level, Schriftgröße, Links-/Rechtshänder-Modus, KeepAwake, Charakter und Sprüche, Themen und App-Icons in sinnvoll gruppierten Einstellungen. Einstellungen persistent, Backup-kompatibel, bei Wechsel keine Historie verändern.
- Redundante Story-/Share-Generatoren nur als optionaler Export aus Archiv, künstliche Scores entfernen, keine doppelte Templates-Verwaltung, keine neuen Quick-Training-Wege, keine motivierenden Vollbildbanner. Vorhandene Daten und sinnvolle bestehende Exportfunktionen erhalten. Versteckte oder archivierte Bereiche nachvollziehbar zugänglich machen.

---

## 9. Zweite QA-Runde — Fehler gezielt finden und nicht nur abhaken

### 9.1 Entwicklungsreihenfolge

1. Baseline-Audit, Git-Sicherung, Original-Master-Prompt prüfen, bereits vorhandene Umsetzung nicht duplizieren.
2. Datenerhalt, Storage-Regression, Versionierung, Undo, Backup-Rotation und Medien.
3. Plan-Editor, pro Satz individuelle Sollwerte, Limits, Progression, Gym-Komfort.
4. YAZIO/Health-Sync und native Capability-Prüfung.
5. Designsystem, eigene Asset-Bibliothek, Character Bible, Motion, alle Hauptscreens und Copy-System.
6. Analytics, Suche, optionale Komfortfunktionen und Aufräumen.
7. Gesamte Regression, echte UI-/Performance-Prüfung, native Build-Pipeline, Release-Bericht.

### 9.2 Verbindliche neue Tests

- Upgrade von bestehender 10-/15-Daten-Fixture mit aktiver Session, Gewichtsverlauf, Planrevisionen, Fotos und Einstellungen; keinerlei ungefragter Reset. Alte 12 Wdh. bleiben 12, neuer Satz mit Soll 3 erlaubt 4 erst nach + Wdh.; 4. Satz erst nach + Satz. Unabhängige Zeilen und Wiederherstellung nach SQLite-Neustart. Import/Export/Rollback mit Medien und unbekannten Feldern.
- Undo nach Satzabschluss mit Resttimer/PR, fünf schnelle Taps, konkurrierende Speichervorgänge, Disk-full-/Transaktionsfehler, Retry, DB-Lesefehler, doppelte Notification, Force Quit nach Commit, Systemuhrwechsel. Rotation bei fehlerhaftem neuem Snapshot löscht keine alte gültige Sicherung.
- Planrevisionen, Kopieren/Batch-Edit, Deload, Training verschieben ohne Doppelzählung, ausgelassene Übung, Vorzeitiges Finish, unilaterale Daten, individuelle Pausen und Sollwerte, Textimport mit mehrdeutigen Übungen, Progressionsvorschläge und Datenmangel/Plateau-Grenzfälle.
- Analytics bei Zeitumstellung, fehlenden Daten, geänderter Routine, Warm-up/Bodyweight/Assisted, nachträglicher Korrektur und verschiedenen Datenquellen. Keine erfundenen Werte.
- YAZIO-Sync erfolgreich/fehlend/verweigert, doppelte Quellen, Import korrigierter und gelöschter Samples, manuelle Einträge bleiben, Offline-Fallback, Aktualitätsanzeige. Native Integration nur als verifiziert markieren, wenn real ausgeführt.
- Sämtliche Animationstrigger mit Reduce Motion, Motion-Off, schneller Navigation, mehrfachen Taps und unmount; fehlerhafte Speicherung triggert keinen Erfolgsstempel. Copy-System ohne nervige Wiederholung, ohne falschen PR, Coach-Off/Charakter-Off. Asset-Registry prüft lokale Existenz, Eindeutigkeit und Lizenzmanifest; nicht nur Dateizahl zählen.
- UI auf kleinem iPhone SE/Simulator und größerem Gerät: Timer, Tastatur, Satzlimits, Links-/Rechtshänder, große Schrift, VoiceOver, Dark/Paper, keine horizontalen Überläufe. Echte Screenrecordings der wichtigsten Motion-Flows und vor/nach Screenshots, wenn Umgebung verfügbar. Keine erfundenen Device-Screenshots.

### 9.3 Build-Gates

Erhalte den bisherigen TS2322-Switch-Vertrag (`update()` liefert Promise<boolean>; native Callback-Verträge separat korrekt auf void/Promise<void> adaptieren), den TS2345-Linking-Fix und die Regressionstests. Keine `any`-/`ts-ignore`-Kaschierung. Lockfile und Expo-kompatible Abhängigkeiten prüfen. `npm ci` bei gültigem Lockfile, vollständiges `tsc --noEmit`, Lint, vorhandene und neue Tests, Expo-Config/Doctor, Prebuild, Pods, Xcode, unsigned IPA. GitHub-Actions-Runner und verfügbare Xcode-Version tatsächlich prüfen; kostenlose Kontingente nicht garantieren. Kein kostenpflichtiger EAS-Zwang. Native optionale Entitlements separat. IPA-Integrität und Hash nur bei tatsächlich erzeugter IPA. Logs/Exitcodes dokumentieren; lokale Logiktests sind keine iPhone-UI-Tests. Keine persönliche Daten in CI-Artefakten.

---

## 10. Abnahme und Auslieferung

Liefere das aktualisierte bestehende Repository als vollständiges ZIP, nicht einen separaten Beispielscreen. Dokumente:

- `SECOND_PASS_AUDIT.md` mit Vorher-/Nachher-Status jedes offenen Punktes aus beiden Prompts.
- `CHANGESET_15_SECOND_PASS.md` mit konkreten Dateien und Änderungen, `REMOVED_FEATURES.md` mit Datenzugriff auf Altbestand.
- `DESIGN_SYSTEM_15.md`, `CHARACTER_BIBLE.md`, `ASSET_MANIFEST.md`, `MOTION_CATALOG.md`, `COPY_GUIDE.md` mit echten implementierten Assets, Triggern, Sprüchen, Lizenzen, Screens und Fallbacks.
- `DATA_MIGRATION.md`, `BACKUP_AND_RECOVERY.md`, `YAZIO_INTEGRATION.md` mit tatsächlichen Datenwegen, Berechtigungen und Einschränkungen.
- `TEST_MATRIX_15_SECOND_PASS.md`, tatsächliche Logs, `RELEASE_REPORT_15_SECOND_PASS.md`, echte Screenshots/Screenrecordings sofern möglich, verifizierte IPA sofern erfolgreich gebaut.
- Exakte Anleitung zum Aktualisieren des bestehenden GitHub-Repos und Überinstallation mit kompatibler Signierung. Vorher Backup exportieren, alte App nicht deinstallieren. Kein Fresh Start.

### Pflicht-End-to-End-Szenario

Ein bestehender Nutzer öffnet die aktualisierte App, sieht seinen alten Plan, alte Gewichte und Trainingshistorie ohne Onboarding. Er öffnet seinen heutigen Plan, verschiebt einen anderen Tag, startet die aktuelle Routine. Eine Übung hat 3 geplante Sätze mit individuellen Zielwerten. Die echten Vorwerte sind als Vorschläge sichtbar. Er speichert Satz 1, macht den Abschluss rückgängig, speichert erneut, erlaubt im zweiten Satz eine zusätzliche Wiederholung und fügt nach dem dritten bewusst einen Extra-Satz hinzu. Er verlässt die App, sperrt das Gerät, kehrt zurück: Eingaben, Timer, Limits, Plan und Fortschritt stimmen. Der Satzabschluss zeigt ein gezeichnetes Häkchen erst nach bestätigter Speicherung; die Figur und Sprüche reagieren nur angemessen, bei Reduce Motion bleiben alle Controls nutzbar. Er beendet das Workout, sieht einen echten Vergleich und einen animierten Trainingszettel. Alte Workouts bleiben unverändert. Die Ernährung zeigt real importierte YAZIO-Werte oder einen ehrlichen Fallback. Backup erstellen, wiederherstellen, Daten vergleichen. Das Szenario mit synthetischen Testdaten ausführen und native Ausführung separat dokumentieren.

**WICHTIG: Die zweite Runde ist nicht bestanden, wenn lediglich 48 Bilder irgendwo im Asset-Ordner liegen, 40 Animationsnamen in einer Markdown-Datei stehen oder 100 Sprüche nie angezeigt werden. Motive, Bewegungen und Texte müssen im tatsächlichen Produkt sinnvoll integriert und überprüfbar sein. Gleichzeitig darf keine Dekoration den Gym-Workflow verschlechtern.**

**FORM soll wie ein persönliches, eigenständig illustriertes iPhone-Produkt aussehen, das meinen Plan kennt und sich zuverlässig an meine Arbeit erinnert. Kein KI-Dashboard. Keine neuen Pflichtfunktionen. Keine verlorenen Daten. Kein Quick Training. Keine erfundenen Testergebnisse.**
