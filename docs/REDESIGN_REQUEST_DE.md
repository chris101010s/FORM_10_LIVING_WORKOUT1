# ATHLETE OS – COMPLETE REDESIGN & RESTRUCTURE PROMPT
## Bestehende App überarbeiten · HeyClicky-inspiriertes Design · Native iOS · Gym & Health

### 0. ABSOLUTE HAUPTREGEL: KEIN NEUES PROJEKT!

Du bist ein Senior iOS Product Designer, React-Native-Entwickler, UX-Architekt, Softwaretester und Fitness-App-Spezialist.

Du bekommst mein bereits existierendes Projekt **ATHLETE OS**, entwickelt mit React Native und Expo.

Deine Aufgabe ist eine umfassende Überarbeitung **INNERHALB DES BESTEHENDEN PROJEKTS**.

**ERSTELLE KEIN NEUES PROJEKT. ERSETZE NICHT DIE KOMPLETTE APP DURCH EINE NEUE CODEBASIS.**

Arbeite unmittelbar mit den existierenden Dateien, Komponenten, Services, Datenmodellen, Dependencies und GitHub-Actions-Workflows.

Unbedingt beibehalten:

- Bestehendes Repository und Projektstruktur, soweit technisch sinnvoll.
- Bestehende iOS-Bundle-ID.
- Alle bereits funktionierenden Funktionen, sofern ich sie nicht ausdrücklich entfernen lasse.
- Bestehende gespeicherte Nutzerdaten, Trainingshistorien und Einstellungen.
- Die Möglichkeit eines kostenlosen unsigned IPA-Builds mit GitHub Actions für Sideloadly.
- Die bisherige Übungsdatenbank als Ausgangspunkt.
- Bestehende Backup- und Wiederherstellungsfunktionen.

Erstelle vor jeder größeren Änderung eine Sicherung und eine Bestandsaufnahme der vorhandenen Implementierung.

Arbeite nicht nur konzeptionell: **Schreibe und ändere tatsächlich den Code.** Jeder neue Button muss funktionieren. Jeder neue Bildschirm muss bedienbar sein. Jede relevante Änderung muss persistent gespeichert und getestet werden.

---

# 1. DAS PROBLEM MIT DER JETZIGEN APP

Meine bestehende ATHLETE-OS-App gefällt mir aktuell überhaupt nicht.

Sie hat folgende Probleme:

1. Die Oberfläche ist unübersichtlich.
2. Es werden zu viele Informationen auf einem einzigen Bildschirm angezeigt.
3. Wichtige Funktionen gehen zwischen unwichtigen Statistiken unter.
4. Das Design wirkt generisch und offensichtlich KI-generiert.
5. Viele Bereiche bestehen aus ähnlichen Karten mit Zahlen.
6. Die App sieht nicht wie eine professionell entwickelte iPhone-Fitness-App aus.
7. Ein richtiger Trainingsplan-Editor mit Wochentagen fehlt beziehungsweise ist nicht gut genug.
8. Die Übungsauswahl und die dazugehörigen Bilder müssen deutlich verbessert werden.
9. Die Gesundheitsfunktionen sind nicht sinnvoll genug organisiert.
10. Navigation und Bedienung sind zu umständlich.
11. Es fehlen kleine persönliche Details, die eine App besonders machen.
12. Ich will nicht jedes Mal durch mehrere Bereiche navigieren müssen, um etwas Einfaches zu erledigen.

**Dein Ziel ist es, diese Probleme systematisch zu lösen, nicht sie unter weiteren Funktionen zu verstecken.**

Die App muss sich von Anfang an ruhig, klar, verständlich, schnell und angenehm anfühlen.

---

# 2. NEUE DESIGNRICHTUNG: HEYCLICKY MEETS APPLE FITNESS

## Visuelle Inspiration

Orientiere dich an der visuellen Persönlichkeit von:

https://www.heyclicky.com/

Analysiere die Website, ihre Gestaltung und ihre visuelle Sprache.

Übernimm die allgemeinen Designprinzipien, nicht das urheberrechtlich geschützte Layout, Logo oder die Markenidentität.

Was mir daran gefällt:

- Sehr helle, freundliche Benutzeroberflächen.
- Viel Weißraum.
- Große, schöne und selbstbewusste Typografie.
- Wenige, klar hervorgehobene Aktionen.
- Leicht verspielte Y2K- und Desktop-inspirierte Details.
- Kleine grafische Überraschungen.
- Sympathische, menschliche Texte.
- Modernes, hochwertiges Produktgefühl.
- Gute Animationen und Übergänge.
- Keine überladenen Dashboards.

Kombiniere diese Persönlichkeit mit der Bedienbarkeit hochwertiger nativer iOS-Fitness-Apps.

## Konkrete Designvorgaben

Neue Farbrichtung:

- Haupt-Hintergrund: warmes Weiß, beispielsweise `#FAFAF8`.
- Primäre Textfarbe: fast Schwarz, beispielsweise `#191B1E`.
- Sekundärer Text: ruhiges Grau.
- Haupt-Akzentfarbe: klares, angenehmes Himmelblau.
- Weitere Akzente: sehr dezentes Gelb, Grün und Koralle.
- Trennlinien: extrem subtil.
- Keine dauerhaften Neon-Gradienten.
- Keine riesigen dunklen Karten.
- Keine willkürlichen Farbverläufe in jedem Element.

Die Oberfläche soll überwiegend flach, sauber und hell sein. Verwende Schatten und Glass-Effekte nur dort, wo sie tatsächlich einen Zweck erfüllen.

## Neue Schriftarten

Ersetze die bisherige visuelle Typografie durch ein konsistentes System.

Vorgeschlagene Schriften:

- **Plus Jakarta Sans** für Überschriften und Navigation.
- **DM Sans** für Fließtext und Buttons.
- **IBM Plex Mono** für Trainingsgewichte, Satznummern, Zeiten und andere Messdaten.

Verwende ausschließlich korrekt lizenzierte Schriftarten und integriere sie technisch sauber über Expo Font.

Achte auf dynamische Schriftgrößen und Barrierefreiheit.

## Striktes Anti-KI-Design

Vermeide unbedingt:

- Zwanzig gleich aussehende Dashboard-Karten.
- Überall abgerundete Kästchen mit Icons.
- Riesige Gradienten.
- Künstlich wirkende Motivationsbanner.
- Zu viele Emojis.
- Beliebige Glaseffekte.
- Zu viele Informationen gleichzeitig.
- Übertriebene Gamification.
- Große leere Flächen ohne Orientierung.
- Unnötige Animationen.
- Endlose vertikale Seiten.

Jede Seite braucht eine klar erkennbare Hauptaufgabe.

---

# 3. NAVIGATION KOMPLETT ÜBERARBEITEN

Baue eine neue native iOS-Navigation mit **fünf klaren Hauptbereichen**:

1. Heute
2. Pläne
3. Training
4. Fortschritt
5. Gesundheit

Verwende verständliche Icons und kurze Beschriftungen.

Einstellungen sind über einen Profilbutton erreichbar, nicht als zusätzlicher voller Hauptbereich.

Nutze native Navigation, korrekte Safe Areas, Gesten, Keyboard-Verhalten und iOS-konforme Übergänge.

Wenn die installierte iOS-Version echtes Liquid Glass unterstützt, verwende es sinnvoll für Navigation und ausgewählte Systembedienelemente. Auf älteren Geräten muss ein klarer, hochwertiger Fallback existieren.

**Eine Bildschirmseite darf nicht fünf unterschiedliche Hauptfunktionen gleichzeitig erfüllen.**

## Heute

Die Startseite soll nur die wichtigsten Informationen zeigen:

- Freundliche, kurze Begrüßung.
- Aktuelles Datum.
- Heutiger Trainingstag.
- Eine klare Hauptaktion: „Training starten“.
- Falls kein Training geplant ist: „Heute ist dein Ruhetag“.
- Eine kleine Fortschrittsübersicht der Woche.
- Ein kompakter Hinweis auf ein relevantes persönliches Ziel.

Keine komplette Gewichtsstatistik, Ernährungsanalyse, Schlafanalyse, Übungsliste und Gesundheitsübersicht gleichzeitig.

Beispiel für die Informationshierarchie:

**Guten Morgen.**

Heute ist Donnerstag.

**Lower Body**

6 Übungen · 18 geplante Sätze

[Training starten]

Darunter dezent:

Diese Woche: 2 von 3 Trainingseinheiten abgeschlossen.

Weitere Informationen müssen auf separaten Detailseiten erreichbar sein.

---

# 4. TRAININGSPLAN-EDITOR ALS ZENTRALE FUNKTION

Das ist eine meiner wichtigsten Anforderungen.

Ich möchte meine Trainingspläne selbst erstellen, bearbeiten und organisieren können.

Nicht nur einzelne Workout-Vorlagen, sondern vollständige Trainingspläne mit unterschiedlichen Tagen.

## 4.1 Trainingspläne erstellen

Im Bereich „Pläne“ gibt es eine gut sichtbare Aktion:

**Neuen Trainingsplan erstellen**

Beim Erstellen kann ich eingeben:

- Name des Trainingsplans.
- Optionale Beschreibung.
- Farbe oder schlichtes Symbol.
- Startdatum.
- Optionales Enddatum.
- Wiederholung jede Woche oder als mehrwöchiger Zyklus.
- Trainingstage.
- Optional geplante Ruhetage.

Beispiel:

**Mein Athletikplan**

Montag: Ruhetag  
Dienstag: Upper Body  
Mittwoch: Ruhetag  
Donnerstag: Leg Day  
Freitag: Ruhetag  
Samstag: Athletic Performance  
Sonntag: Optional Cardio

Diese Werte sind lediglich ein Beispiel für die Funktionsprüfung. Sie dürfen nicht als persönliche Daten vorausgefüllt werden.

## 4.2 Wochenkalender

Entwickle eine klare Wochenansicht mit Montag bis Sonntag.

Jeder Tag ist separat anklickbar.

Beim Tippen auf einen Tag kann ich:

- Training hinzufügen.
- Vorhandene Routine auswählen.
- Neue Routine erstellen.
- Ruhetag festlegen.
- Optionalen Trainingstag bestimmen.
- Eine Routine duplizieren.
- Übungen umsortieren.
- Einen Trainingstag verschieben.
- Einen Tag vollständig löschen.

Optional markierte Trainingstage dürfen nicht als verpasste Pflichttrainings erscheinen.

## 4.3 Übungen einem Tag hinzufügen

Beim Öffnen beispielsweise von „Donnerstag – Leg Day“ sehe ich ausschließlich die Übungen dieses Tages.

Eine Übung enthält:

- Eindeutigen Namen.
- Passendes reales Übungsbild.
- Hauptmuskelgruppe.
- Trainingsgerät.
- Geplante Sätze.
- Wiederholungsbereich.
- Pausendauer.
- Optional RIR oder RPE.
- Optionale Trainingsnotiz.

Ich kann jede Übung bearbeiten, entfernen und per Drag-and-drop verschieben.

Es muss möglich sein, zwei Übungen zu einem Superset zu verbinden.

## 4.4 Trainingsplan-Verwaltung

Unterstütze mehrere vollständige Trainingspläne.

Ich möchte einen Plan:

- Aktivieren.
- Pausieren.
- Duplizieren.
- Umbenennen.
- Archivieren.
- Bearbeiten.
- Löschen, mit Bestätigung.
- Als JSON exportieren.
- Aus einem Backup wiederherstellen.

Vorhandene absolvierte Workouts dürfen nicht verschwinden, wenn ein Trainingsplan später bearbeitet oder archiviert wird.

---

# 5. ÜBUNGSDATENBANK MIT ECHTEN BILDERN

Die bestehende App verwendet bereits eine Übungsdatenbank. Erhalte und verbessere sie.

## 5.1 Übungskatalog

Nutze die bereits integrierte Quelle `free-exercise-db`, sofern verfügbar, und prüfe den Umfang und die Lizenz.

Die Übungsbibliothek soll Folgendes bieten:

- Über 800 reale Übungen, wenn der vorhandene Datensatz vollständig verfügbar ist.
- Deutsche und englische Übungsnamen.
- Synonyme.
- Primäre Muskelgruppen.
- Sekundäre Muskelgruppen.
- Trainingsgeräte.
- Schwierigkeitsgrade.
- Schrittweise Ausführungsanleitungen.
- Bewegungsvarianten.
- Favoriten.
- Eigene Übungen.

Die Datenbank soll offline verfügbar sein.

## 5.2 Echte Übungsbilder

Eine der wichtigsten Designverbesserungen!

Jede Übung soll nach Möglichkeit ein **tatsächlich passendes Bild der korrekten Bewegung** enthalten.

Beispiele:

- Bankdrücken: wirklich Langhantel-Bankdrücken.
- Rudern: tatsächlich die richtige Rudervariante.
- Beinpresse: Beinpresse, nicht Kniebeuge.
- Rumänisches Kreuzheben: echte RDL-Ausführung.

Nutze zunächst vorhandene, korrekt lizenzierte Bilder aus der Übungsdatenbank.

Du darfst Google Bilder zur Recherche geeigneter Bilder und ihrer Originalquellen verwenden. **Scrape jedoch nicht Google-Bilder und übernimm nicht ungeprüft urheberrechtlich geschützte Bilder.**

Wenn weitere Bilder verwendet werden, müssen Lizenz, Quelle und gegebenenfalls Attribution dokumentiert sein.

Für eigene Übungen soll ich optional ein Bild aus meiner iPhone-Fotomediathek hinzufügen können.

Falls ein Bild fehlt:

- Hochwertiger neutraler Platzhalter.
- Keine falsche Bildzuordnung.
- Kein Layout-Sprung.
- Keine kaputte Bildanzeige.

Bilder sollen zwischengespeichert werden. Der Gym-Modus muss ohne aktive Internetverbindung bedienbar bleiben.

## 5.3 Übungssuche

Baue einen wirklich guten Übungsbrowser.

Mit:

- Sofortsuche.
- Muskelgruppenfilter.
- Gerätefilter.
- Freihantel/Maschine/Körpergewicht.
- Favoriten.
- Zuletzt verwendet.
- Häufig trainiert.
- Eigene Übungen.

Die Suche muss auch bei vielen Hundert Übungen flüssig bleiben.

## 5.4 Übungsdetailseite

Beim Tippen auf eine Übung öffnet sich eine eigenständige Detailansicht.

Sie enthält:

- Großes Übungsbild.
- Übungsname.
- Zielmuskeln.
- Ausführungsbeschreibung.
- Technische Hinweise.
- Typische Fehler.
- Optional alternative Übungen.
- Persönliche Trainingshistorie.
- Persönliche Bestleistung.

Nicht alle Informationen müssen sofort sichtbar sein. Verwende sinnvolle Unterbereiche.

---

# 6. ECHTER LIVE-GYM-MODUS

Der Gym-Modus muss der beste und am zuverlässigsten nutzbare Bereich der gesamten App werden.

## 6.1 Training starten

Wenn ich auf „Training starten“ drücke, wird die ausgewählte Routine geladen.

Jede Übung besitzt eine gut lesbare Satzliste.

Beispiel:

**BANKDRÜCKEN**

Letztes Training: 12. November

| Satz | Letztes Mal | Gewicht | Wiederholungen |
|---|---|---|---|
| 1 | 40 × 8 | Eingabe | Eingabe |
| 2 | 40 × 8 | Eingabe | Eingabe |
| 3 | 42,5 × 7 | Eingabe | Eingabe |

Die letzten Werte dürfen als Vorschlag übernommen werden, aber ein Vorschlag zählt niemals als tatsächlich absolvierter Satz.

## 6.2 Satzverwaltung

Unterstütze:

- Normale Arbeitssätze.
- Aufwärmsätze.
- Dropsätze.
- Supersets.
- Wiederholungen.
- Gewicht in Kilogramm.
- Körpergewichtsübungen.
- Zeitbasierte Übungen.
- Distanzbasierte Übungen.
- RIR und RPE.
- Satznotizen.

Ich muss Sätze hinzufügen, bearbeiten und entfernen können.

Ein vollständig gespeicherter Satz soll visuell klar als abgeschlossen erkennbar sein.

## 6.3 Pausentimer

Implementiere einen hochwertigen Pausentimer:

- Automatischer Start nach einem Satz.
- Eigene Pausenzeit pro Übung.
- Zeit verlängern.
- Zeit reduzieren.
- Überspringen.
- Ton optional.
- Haptisches Feedback optional.
- Korrekte Zeit nach App-Wechsel.
- Native lokale Benachrichtigung, wenn von iOS erlaubt.
- Keine unbegrenzten oder störenden Alarme.

## 6.4 Training im Hintergrund

Wenn ich während des Trainings:

- das iPhone sperre,
- WhatsApp öffne,
- einen Anruf bekomme,
- zwischen App-Tabs wechsle,
- die App kurz schließe,

dürfen meine bereits gespeicherten Daten nicht verloren gehen.

Auch unvollständige Satzeingaben sollen als Entwurf wiederhergestellt werden können.

## 6.5 Training beenden

Am Ende erscheint eine eigene Zusammenfassung.

Mit:

- Trainingsdauer.
- Absolvierten Übungen.
- Absolvierten Sätzen.
- Trainingsvolumen.
- Persönlichen Rekorden.
- Vergleich zum letzten Training.
- Optionaler Trainingsnotiz.

Zusätzlich eine klare Aktion:

**Training abschließen**

Keine zehn Pop-ups oder übertriebene Konfetti-Animationen.

---

# 7. GESUNDHEITSBEREICH NEU AUFBAUEN

Erweitere den Gesundheitsbereich, ohne ihn in ein unübersichtliches Dashboard zu verwandeln.

Entferne die bisherige FITINN-spezifische Integration vollständig aus der sichtbaren App.

## 7.1 FITINN entfernen

Entferne:

- FITINN-Branding.
- FITINN-spezifische Screens.
- FITINN-Importbuttons.
- Hinweise auf vicoach.
- FITINN-spezifische OCR-Workflows.
- Nicht mehr verwendete native FITINN-Abhängigkeiten.

Dabei dürfen bestehende allgemeine Körpermesswerte nicht versehentlich gelöscht werden.

Prüfe, ob vorhandene Körperzusammensetzungsdaten in die neue allgemeine Gesundheitsdatenstruktur übernommen werden können.

Bestehende Backups müssen weiterhin wiederherstellbar bleiben.

## 7.2 Gesundheitshauptseite

Baue einen ruhigen, klar gegliederten Bereich mit Unterseiten:

**Körper**

- Gewicht.
- Zielgewicht.
- Körperfettanteil, falls manuell eingegeben.
- Muskelmasse, falls manuell eingegeben.
- Körperumfänge.
- Veränderung im Zeitverlauf.

**Schlaf**

- Schlafdauer.
- Schlafqualität.
- Schlafenszeit.
- Aufwachzeit.
- Schlafverlauf.

**Aktivität**

- Schritte.
- Gehstrecken.
- Laufstrecken.
- Cardio-Einheiten.
- Ausdauerentwicklung.

**Erholung**

- Energie.
- Muskelermüdung.
- Optional Ruhepuls.
- Optional subjektive Trainingsbereitschaft.

**Ernährung**

- Frei eingegebene Kalorien.
- Protein.
- Kohlenhydrate.
- Fett.
- Wasseraufnahme.

Die Werte sind freiwillig. Es dürfen keine persönlichen Daten erfunden oder automatisch vorausgefüllt werden.

## 7.3 Apple Health

Prüfe die Integration von Apple HealthKit für unterstützte iPhones.

Mögliche Daten:

- Schritte.
- Herzfrequenz.
- Ruhepuls.
- Schlaf.
- Körpergewicht.
- Aktivitätsenergie.
- Workouts.

Die Verbindung muss optional sein und ausdrückliche Berechtigungen verwenden.

Keine Gesundheitsdaten ohne Einwilligung lesen oder übertragen.

Falls der verfügbare Build- oder Signierungsweg eine HealthKit-Funktion nicht unterstützt, dokumentiere das und stelle einen funktionierenden manuellen Eingabeweg bereit.

## 7.4 Gesundheitsstatistiken

Zeige Trends, statt einfach sämtliche Messwerte auf einem Bildschirm zu stapeln.

Jeder Bereich erhält eigene sinnvolle Diagramme.

Nutze klare Achsen, Maßeinheiten, Zeiträume und Beschriftungen.

Keine medizinischen Diagnosen. Keine unbegründeten Gesundheitsbewertungen.

---

# 8. GEWICHTSTRACKING ÜBERARBEITEN

Behalte das bisherige Gewichtstracking, verbessere aber die Bedienung und Visualisierung.

Die Gewichtshauptansicht zeigt nur:

- Aktuelles zuletzt eingetragenes Gewicht.
- Veränderung gegenüber dem letzten vergleichbaren Zeitraum.
- Ein schönes großes Gewichtsdiagramm.
- Button „Gewicht eintragen“.

Weitere Details auf separater Analyseansicht.

Unterstütze:

- Tageswerte.
- 7-Tage-Durchschnitt.
- 30-Tage-Trend.
- 90-Tage-Verlauf.
- Gesamten Verlauf.
- Zielgewicht.
- Veränderung pro Woche.
- Korrektur und Löschung fehlerhafter Messungen.

Keine übertrieben genauen Gewichtsprognosen. Wenn eine Prognose angezeigt wird, muss die Unsicherheit klar erkennbar sein.

---

# 9. FORTSCHRITT UND ANALYTICS

Der Fortschrittsbereich soll leistungsorientiert sein.

Eigene Unterbereiche:

**Kraft**

- Trainingsgewichte.
- Persönliche Rekorde.
- Trainingsvolumen.
- Kraftentwicklung nach Übung.

**Körper**

- Gewicht.
- Körpermaße.
- Körperzusammensetzung, falls verfügbar.

**Ausdauer**

- Laufen.
- Radfahren.
- Cardio-Minuten.
- Tempo und Distanz.
- Persönliche Bestzeiten.

**Körpergewicht**

- Liegestütze.
- Klimmzüge.
- Plank.
- Andere selbst angelegte Leistungstests.

**Regelmäßigkeit**

- Abgeschlossene Trainingseinheiten.
- Trainingshäufigkeit.
- Wochenplanung.
- Langfristige Entwicklung.

Verwende aussagekräftige Diagramme und sinnvolle Vergleiche.

Vermeide belanglose Kennzahlen, die nur Platz beanspruchen.

---

# 10. MEHR NATIVES iOS-GEFÜHL

ATHLETE OS soll sich nicht wie eine Website in einer App anfühlen.

Baue native iOS-Muster ein:

- Systemkonforme Tab-Navigation.
- Native Modals und Sheets.
- Swipe-to-go-back.
- Passende Date-Picker.
- Native Kontextmenüs.
- Sanfte Haptics.
- Standardmäßige iOS-Tastaturinteraktionen.
- Automatische Berücksichtigung der Safe Areas.
- Dynamic Type.
- VoiceOver-Beschriftungen.
- Reduce Motion.
- Hell-/Dunkelmodus.
- Korrektes Verhalten bei eingehenden Anrufen.
- Vernünftige Ladezustände.

Füge sinnvolle iOS-Funktionen hinzu, wenn technisch verfügbar:

- Widgets für nächstes Training und Wochenfortschritt.
- Lokale Trainingserinnerungen.
- Apple-Health-Verbindung.
- Teilen über das iOS Share Sheet.
- Export in Dateien.
- Optional Face ID zum Schutz privater Daten.

Funktionen, die zusätzliche Berechtigungen oder native Konfiguration verlangen, müssen korrekt integriert und getestet werden.

---

# 11. WENIGER KLICKS, BESSERE BEDIENUNG

Optimierung für tatsächliche Verwendung im Fitnessstudio.

Wichtige Aktionen sollen schnell erreichbar sein:

- Training starten.
- Satz speichern.
- Gewicht verändern.
- Wiederholungen ändern.
- Pausentimer sehen.
- Nächste Übung öffnen.
- Training beenden.

Große Touchflächen und gut lesbare Zahlen.

Keine unnötigen Bestätigungsdialoge für harmlose Aktionen.

Bestätigung nur bei wichtigen oder destruktiven Aktionen.

Kein versehentliches Löschen durch unklare Gesten.

Lege besonderen Wert auf Bedienbarkeit mit einer Hand.

---

# 12. KLEINE EASTER EGGS UND PERSÖNLICHKEIT

Die App soll menschlicher, sympathischer und etwas verspielter werden.

Die Easter Eggs müssen dezent bleiben und dürfen die Funktionalität nicht beeinträchtigen.

Ideen:

1. Kleine versteckte Animation beim ersten persönlichen Rekord.
2. Eine gelegentliche freundliche Nachricht nach einem abgeschlossenen Workout.
3. Subtile Typografie-Animation bei einem neuen Wochenbestwert.
4. Mini-Spruch, wenn eine besonders lange Pause beendet wird.
5. Ein verstecktes Design-Detail beim mehrfachen Tippen auf das Logo.
6. Saisonale kleine Akzente, die nicht aufdringlich sind.
7. Eine besondere Animation nach 100 abgeschlossenen Trainingseinheiten.
8. Kleine humorvolle Texte im Trainingsarchiv.
9. Ein sehr seltenes verstecktes Retro-Interface.
10. Eine unaufdringliche Belohnung nach einer persönlich erreichten Leistung.

Keine künstlichen Belohnungen für ungesund schnelles Abnehmen.

## Motivationsmodi

Behalte oder verbessere die bestehenden Coach-Modi:

- Calm.
- Coach.
- Chaos.
- Aus.

Chaos darf humorvoll und frech sein, aber nicht beleidigend, demütigend oder körperbeschämend.

Alle Motivationsfunktionen sind optional.

---

# 13. ONBOARDING VERBESSERN

Beim ersten Start soll die App nicht leer und verwirrend wirken.

Baue ein kurzes, sympathisches Onboarding.

Maximal wenige klare Schritte:

1. Willkommen bei ATHLETE OS.
2. Was möchtest du tracken?
3. Optionales Ziel erstellen.
4. Ersten Trainingsplan erstellen oder überspringen.

Keine persönlichen Daten vorausfüllen.

Keine verpflichtende Eingabe von Gewicht, Körpergröße oder Kalorien.

Ein Nutzer muss die App verwenden können, ohne alle Funktionen sofort einzurichten.

Danach zeigen leere Seiten hilfreiche Aktionen.

Beispiel:

**Noch kein Trainingsplan.**

Erstelle deinen ersten Trainingstag und füge Übungen hinzu.

[Trainingsplan erstellen]

Nicht:

`No data available`

und auch nicht 15 leere Statistik-Karten.

---

# 14. DATENBANK, SPEICHERUNG UND MIGRATION

Das bestehende Projekt muss erhalten bleiben.

Analysiere zunächst den vorhandenen Datenspeicher, die Datenschemas und alle Backupfunktionen.

Ändere Speicherstrukturen nur mit einer sicheren Migration.

Unbedingt sicherstellen:

- Workout-Sätze werden dauerhaft gespeichert.
- Trainingspläne überstehen App-Neustarts.
- Gewichtsverläufe bleiben erhalten.
- Gesundheitseinträge bleiben erhalten.
- Einstellungen bleiben erhalten.
- Favoriten bleiben erhalten.
- Benutzerdefinierte Übungen bleiben erhalten.
- Alte Trainingsdaten bleiben verfügbar.
- Unterbrochene Trainingseinheiten werden wiederhergestellt.

Falls die bisherige JSON-basierte Speicherung für die neuen Funktionen nicht mehr ausreicht, darf sie schrittweise auf SQLite migriert werden.

Dabei gelten folgende Regeln:

1. Bestehende Daten vorher sichern.
2. Neue Datenbankstruktur versionieren.
3. Migration testen.
4. Vorhandene Daten automatisch übernehmen.
5. Nach Migration Datenintegrität prüfen.
6. Bei einem Fehler keine alten Daten löschen.
7. Wiederherstellung anbieten.
8. Migration wiederholbar und idempotent gestalten.

Verwende eindeutige stabile IDs und sichere Datenbanktransaktionen.

Das Entfernen der FITINN-Oberfläche darf keine anderen historischen Daten zerstören.

---

# 15. BESTEHENDE BUGS UND POTENZIELLE FEHLER SYSTEMATISCH REPARIEREN

Die bisherige Entwicklung hatte wiederholt GitHub-Actions- und TypeScript-Fehler.

Untersuche deshalb das gesamte Projekt systematisch.

Besonders berücksichtigen:

- TypeScript-6-Kompatibilität.
- Expo-SDK-Kompatibilität.
- React-Native-API-Änderungen.
- Ungültige StatusBar-Props.
- Fehlerhafte React-Refs.
- Falsch simulierte native Speicher-Module.
- Gitignore-Regeln für native Dateien.
- Fehlende Swift-Dateien.
- CocoaPods-Konfiguration.
- Nicht deklarierte Dependencies.
- Falsche Imports.
- Fehlerhafte Build-Skripte.
- Fehlgeschlagene Datenmigration.
- Doppelte Einträge.
- Leere oder beschädigte Backups.
- Fehlerhafte Datumskonvertierung.
- Dezimalzahlen mit Komma.
- Ungültige Trainingsgewichte.
- Mehrfaches Antippen eines Speichern-Buttons.
- Navigieren während eines Speichervorgangs.
- App-Absturz während eines Workouts.
- Bilder ohne Internet.
- Unterbrochene Berechtigungsdialoge.
- Nicht erreichbare externe Datenquellen.

Behandle Netzwerk-, Speicher- und Betriebssystemfehler explizit.

Keine stillschweigende Datenlöschung.

Keine Funktionen, die nur beim ersten Öffnen funktionieren.

Keine Buttons ohne echte Aktion.

Keine Fehler durch mehrfaches Tippen.

---

# 16. KONKRETE UX-TESTS

Teste die App anhand realistischer Szenarien.

## Trainingsplan

- Nutzer erstellt einen Plan.
- Fügt Montag, Mittwoch und Freitag hinzu.
- Wechselt die Tage.
- Fügt Übungen hinzu.
- Sortiert Übungen um.
- Ändert die Pausen.
- Speichert den Plan.
- Schließt die App.
- Öffnet sie erneut.
- Alles ist weiterhin korrekt gespeichert.

## Live-Training

- Nutzer startet ein Workout.
- Gibt drei Sätze ein.
- Sperrt das iPhone.
- Wechselt zu einer anderen App.
- Kehrt zurück.
- Bearbeitet einen Satz.
- Fügt einen neuen Satz hinzu.
- Beendet das Workout.
- Öffnet anschließend die Workout-Historie.

Nichts darf verloren gehen.

## Bilder

- Übung mit lokalem Bild öffnen.
- Übung ohne Bild öffnen.
- App offline starten.
- Nach einem Übungsnamen suchen.
- Zwischen Übungen wechseln.
- Eigene Übung mit Foto erstellen.

Kein Bild darf einer falschen Übung zugeordnet sein.

## Gesundheit

- Gewicht eingeben.
- Eintrag bearbeiten.
- Diagramm aktualisieren.
- Schlaf protokollieren.
- HealthKit-Berechtigung ablehnen.
- App weiterhin normal verwenden.

## Backups

- Backup exportieren.
- Backup importieren.
- Defektes Backup importieren.
- Altes ATHLETE-OS-Backup importieren.
- App nach Migration neu starten.

---

# 17. BUILD UND IOS-KOMPATIBILITÄT

Verändere nicht grundlos die bestehende Bundle-ID oder GitHub-Actions-Pipeline.

Der kostenlose Workflow soll weiterhin eine unsignierte IPA für Sideloadly erzeugen können.

Prüfe die tatsächlich eingesetzten Expo- und React-Native-Versionen und verwende dazu passende Abhängigkeiten.

Führe aus, soweit in der Umgebung verfügbar:

- Dependency-Installation.
- TypeScript-Typecheck.
- Lint.
- Unit Tests.
- Integrationstests.
- Expo Prebuild.
- CocoaPods-Installation.
- Native iOS-Kompilierung.
- IPA-Erstellung.
- Prüfung des erzeugten IPA-Artefakts.

Wenn Tests nicht ausführbar sind, dokumentiere präzise, warum.

Ein erfolgreicher Syntaxcheck ist kein Ersatz für einen tatsächlichen Xcode-Build.

Behaupte niemals, dass die iPhone-App vollständig funktioniert, bevor sie kompiliert und auf einem Gerät oder geeigneten Simulator getestet wurde.

---

# 18. ARBEITSREIHENFOLGE

Arbeite in folgenden Phasen:

**Phase 1: Projekt analysieren**

Lies sämtliche vorhandenen Dateien, überprüfe die Architektur und dokumentiere den Ist-Zustand.

**Phase 2: Stabilität sichern**

Erstelle Datensicherungen, überprüfe die Migrationen und behebe bekannte Build-Fehler.

**Phase 3: Designsystem umbauen**

Führe die neue HeyClicky-inspirierte visuelle Sprache, Typografie, Komponenten und Navigation ein.

**Phase 4: Trainingsplan-Editor entwickeln**

Implementiere die vollständige Wochenplanung mit editierbaren Trainingstagen, Übungen, Routinen und optionalen Tagen.

**Phase 5: Übungsbibliothek verbessern**

Überarbeite Katalog, Suche, echte Übungsbilder, Favoriten und Übungsdetailseiten.

**Phase 6: Live-Gym optimieren**

Verbessere Satztracking, Vorwerte, Timer, Trainingshistorie und Wiederherstellung.

**Phase 7: Gesundheit umbauen**

Entferne FITINN, strukturiere die Gesundheitsdaten neu und prüfe Apple HealthKit.

**Phase 8: Analytics verfeinern**

Baue die Statistikbereiche zu übersichtlichen und verlässlichen Ansichten um.

**Phase 9: Persönlichkeit ergänzen**

Implementiere kleine Easter Eggs, hochwertige Animationen und freiwillige Motivation.

**Phase 10: Qualitätssicherung**

Teste sämtliche bestehenden und neuen Abläufe, prüfe Datenmigrationen und führe den tatsächlichen iOS-Build aus, falls möglich.

Nach jeder Phase müssen die relevanten Tests durchgeführt und Fehler behoben werden.

---

# 19. WANN IST DIE ÜBERARBEITUNG ERFOLGREICH?

Das Ergebnis muss folgende Bedingungen erfüllen:

- [ ] Es wurde das bestehende ATHLETE-OS-Projekt bearbeitet.
- [ ] Kein neues separates Projekt wurde erstellt.
- [ ] Das Design ist sichtbar anders und wesentlich übersichtlicher.
- [ ] Die App wirkt wie ein echtes iOS-Produkt.
- [ ] Jede Hauptseite hat eine klare Aufgabe.
- [ ] Trainingspläne mit Wochentagen können erstellt werden.
- [ ] Trainingstage können vollständig bearbeitet werden.
- [ ] Übungen können hinzugefügt, verschoben und entfernt werden.
- [ ] Die Übungsbibliothek zeigt passende reale Bilder, sofern lizenziert verfügbar.
- [ ] Workouts können mit Satztabellen und Vorwerten durchgeführt werden.
- [ ] Der Pausentimer funktioniert.
- [ ] Der Trainingszustand übersteht App-Unterbrechungen.
- [ ] Gewicht und Gesundheit sind übersichtlich getrennt.
- [ ] FITINN ist aus der sichtbaren App vollständig entfernt.
- [ ] Alte Daten bleiben erhalten.
- [ ] Alle neuen Daten werden persistent gespeichert.
- [ ] Backups können exportiert und wiederhergestellt werden.
- [ ] Das Design enthält kleine persönliche, liebevoll gestaltete Details.
- [ ] Keine erfundenen persönlichen Nutzerdaten sind eingetragen.
- [ ] TypeScript-Prüfungen bestehen.
- [ ] Alle ausführbaren automatisierten Tests bestehen.
- [ ] Die iOS-Buildfähigkeit wurde überprüft und der tatsächliche Status dokumentiert.

---

# 20. ABSCHLIESSENDER AUFTRAG

**Ich will keine weitere Ansammlung neuer Features auf den bisherigen unübersichtlichen Screens.**

Ich will, dass du die bereits vorhandene ATHLETE-OS-App in ein durchdachtes, eigenständiges, wunderschönes und sehr gut bedienbares iPhone-Produkt verwandelst.

Das Design soll von HeyClickys menschlicher, verspielter und klarer Produktsprache inspiriert sein, ohne die Marke zu kopieren.

Der Gym-Modus soll sich an der praktischen Bedienbarkeit echter Trainingsapps orientieren.

Die Gesundheitsfunktionen sollen ruhig, vertrauenswürdig und sinnvoll organisiert sein.

Die App soll sich persönlich anfühlen, aber niemals meine Daten erfinden.

Der Trainingsplan-Editor, die Übungsbilder, die native iOS-Bedienung und die klare Navigation haben absolute Priorität.

**ÄNDERE DIE BESTEHENDE APP. ERSTELLE KEINE NEUE.**

Liefere mir anschließend:

1. Den tatsächlich geänderten bestehenden Quellcode.
2. Eine genaue Liste der geänderten Dateien.
3. Eine Übersicht aller implementierten Funktionen.
4. Eine Liste der entfernten FITINN-Komponenten.
5. Einen ehrlichen Test- und Fehlerbericht.
6. Die geprüfte Anleitung zum Aktualisieren meines bestehenden GitHub-Repositories.
7. Nach Möglichkeit einen erfolgreichen iOS-Build beziehungsweise eine unsignierte IPA für Sideloadly.

Keine erfundenen Testergebnisse, keine leeren Versprechen, keine bloßen Designvorschläge.

**Das Ziel: ATHLETE OS soll eine App werden, die ich bei jedem Training gerne öffne, weil sie schön, schnell, verständlich und zuverlässig ist.**