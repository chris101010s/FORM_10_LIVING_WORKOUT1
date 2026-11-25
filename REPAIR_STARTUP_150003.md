# FORM 15.0.0 · Startabsturz · Build 150003

## Reproduzierter Fehler

GitHub Actions Run 8 am 25. November 2026 hat den Release-Build erfolgreich kompiliert und anschließend zwei App-Abstürze protokolliert:

- Run: https://github.com/chris101010s/FORM_10_LIVING_WORKOUT1/actions/runs/45645784663
- Getesteter Commit: `7c67c91dcb384c97210b96cbca4d30cc516bb21c`, Build 150002.
- Native Umgebung: arm64, iPhone Duo, gerätespezifische iOS-27.2-Runtime.
- `v10-home` und `v10-live`: App-Prozess gestartet, dann `EXC_CRASH / SIGABRT`.
- Fehlermeldung: `new NativeEventEmitter() requires a non-null argument`.
- Kausalkette: `privateFiles → asyncRequire → metroImportAll → get PushNotificationIOS → NativeEventEmitter`.
- `fresh`: Installation mit Timeout 124 beendet; kein belegter App-Start in diesem Szenario.

Der automatische Snapshot-Pfad ruft nach dem Laden des Datenbestands den privaten Dateiadapter auf. Dessen dynamischer Import des gesamten React-Native-Namespace liest in Metro auch die verzögerten Exporte. Dabei wird ein optionales Push-Modul ausgewertet, das für diese Dateioperation nicht benötigt wird. Sein iOS-Emitter erhält zur Laufzeit kein natives Modul. Metros Behandlung von Modulfehlern kann den nativen Fatal-Abbruch auslösen, bevor ein nachgelagerter Promise-Catch helfen kann.

Die Symptome entsprechen dem gemeldeten unmittelbaren Schließen. Ein identischer Crash auf dem persönlichen iPhone ist ohne dessen eigenen Bericht oder erneuten Gerätetest nicht separat belegt.

## Änderung

- Der Dateiadapter verwendet gezielte Modulzugriffe innerhalb seiner vorhandenen verzögerten Initialisierung. Der reine Pfadprüfer bleibt ohne Auswertung nativer Module importierbar.
- Promise-Memoisierung und Rücksetzen nach einem Fehler bleiben erhalten.
- App-Identität bleibt `app.athleteos.personal`, Scheme `athleteos`, Datenbank `form-v84-clean.db`, SQL-Schema 9 und JSON-Schema 4.
- Keine neue Datenmigration und kein automatischer Reset. Bestehende private Dateien und Sicherungsformate werden weiterverwendet.
- Buildnummer 150003 kennzeichnet die Korrektur; Marketingversion bleibt 15.0.0.

## Regressions- und Startnachweise

`npm run test:private-files-startup` verwendet die installierte Metro-Laufzeit und einen optionalen React-Native-Getter, der beim Zugriff denselben Fehlertyp auslöst. Der bisherige Namespace-Import muss scheitern, während die korrigierte Dateiadapter-Initialisierung ohne diesen Zugriff funktioniert.

`npm run test:simulator-selection` reproduziert zusätzlich die unerwünschte Auswahl der Duo-Sonderruntime. Die korrigierte Auswahl benutzt nur tatsächlich vorhandene, verfügbare Paare aus einem nummerierten Standard-iPhone und einer allgemeinen iOS-Runtime; sie erfindet keine Gerätekombination.

Der Standard-Workflow verlangt vor der iPhone-Kompilierung drei Release-Starts: frische Installation, synthetischer FORM10-Home-Bestand und synthetischer FORM10-Live-Bestand. Jeder Test beobachtet den konkreten gestarteten Prozess, erfasst einen Screenshot und prüft anschließend die SQLite-Daten. Ein erfolgreicher Startbefehl allein genügt nicht. Die Resultate werden im separaten `Startcheck`-Artifact schon vor dem iPhone-Build gesichert.

Dieser Bericht dokumentiert den Defekt und die Korrektur im Quellcode. Ob der neue Commit nativ kompiliert, die drei Starts besteht und eine IPA erzeugt, ist erst durch seinen tatsächlichen Actions-Lauf belegt. Die Screenshots benötigen visuelle Prüfung. Sideloadly-Signierung und der Erhalt persönlicher Gerätedaten sind keine durch einen Simulatorlauf bewiesenen Ergebnisse.

## Erster nativer Lauf der Korrektur: Run 9

Run https://github.com/chris101010s/FORM_10_LIVING_WORKOUT1/actions/runs/45702669690 hat Commit `d8f405233ba6fe92de1984fa184cdfdd6b8a13f9` als Build 150003 geprüft. QA, TypeScript, ESLint, Expo-Konfiguration, Doctor, Apple-Kryptografie und der native arm64-Release-Simulatorbuild waren erfolgreich. Die Umgebung war ein iPhone 18 Pro Max mit der allgemeinen iOS-27.2-Runtime.

- `v10-home`: derselbe Release-Prozess blieb 24,606 Sekunden aktiv; SQLite-Schema 9 und die vorbereiteten historischen IDs/Anzahlen wurden erfolgreich gelesen. Der Screenshot zeigt den Heute-Bildschirm mit dem vorhandenen eigenen Plan.
- `v10-live`: derselbe Release-Prozess blieb 22,070 Sekunden aktiv; die vorbereitete laufende Einheit, historischen Daten und Entwürfe bestanden die Datenprüfung. Der Screenshot zeigt die pausierte bestehende Einheit mit 00:00:57 und einem gespeicherten Satz.
- Beide Szenarien enthalten keinen erfassten App-Crash und keinen ursprünglichen NativeEventEmitter-Fatalfehler. Die Screenshots wurden visuell geprüft.
- `fresh`: `simctl install` überschritt das bisherige Limit von 120 Sekunden. Es gab in diesem Szenario keinen App-Start. Der gesamte Lauf blieb deshalb korrekt rot, und der iPhone-IPA-Schritt wurde nicht ausgeführt.

Dieser Teilnachweis bestätigt die Korrektur in den zwei Legacy-Starts. Er ist noch kein Nachweis für drei erfolgreiche Starts oder eine neue IPA. Die nachfolgende Anpassung betrifft nur den CI-Simulator: Die erste Installation erhält höchstens 360 statt 120 Sekunden, spätere Installationen bleiben bei 120 Sekunden. Der Startprüfschritt hat 20 Minuten Gesamtlimit, damit die zusätzlichen vier Minuten sowie Diagnose und Bereinigung Platz haben. Es gibt keinen automatischen App-Neustart und keine Freigabe nach einem Installationsfehler. Die App-Dateien, Datenbank und Versionsidentität bleiben unverändert.

## Zweiter nativer Lauf: Run 10

Run https://github.com/chris101010s/FORM_10_LIVING_WORKOUT1/actions/runs/45707769501 prüfte Commit `11a7b94aab0006a22daabef09ce77eeba1641e45`, weiterhin App-Build 150003. Codeprüfungen, Apple-Kryptografie und der arm64-Release-Simulatorbuild waren erfolgreich.

Die erste Installation gelang nach 184,052 Sekunden innerhalb des neuen 360-Sekunden-Limits. Die frische App erreichte `Running main`; 19 erfolgreiche Prozessprüfungen bestätigten dieselbe PID und denselben App-Pfad über das vorgesehene 20-Sekunden-Fenster. Der verpflichtende Screenshot-Aufruf überschritt danach sein bisheriges Limit von 15 Sekunden. Deshalb brach dieser Fall vor der Datenbankprüfung ab. Ein späterer Diagnose-Screenshot gelang und wurde visuell geprüft: Er zeigt die erwartete Einrichtung mit „Dein Kapitel eins.“. Die vorhandene Beschriftung „FORM.10.0“ ist ein alter Setup-Text; die kompilierte Buildidentität ist 150003.

Beide Legacy-Fälle bestanden erneut ihre Prozess- und Datenprüfungen. Es gab in den drei Szenarien keinen erfassten App-Crash oder ursprünglichen NativeEventEmitter-Fatalfehler. Der Gesamtworkflow blieb wegen der nicht abgeschlossenen Fresh-Prüfung korrekt rot und erzeugte keine IPA. Die gemeldete Fresh-Monitordauer von 35,896 Sekunden enthält die Screenshotwartezeit; der letzte gespeicherte Prozesscheck lag rund 20,38 Sekunden nach Monitorstart.

Die anschließende Korrektur gibt ausschließlich dem verpflichtenden Screenshot-Aufruf 60 statt 15 Sekunden. Erfolgreiche Aufnahme, vorhandene nicht leere PNG-Datei und derselbe lebende App-Prozess nach der Aufnahme bleiben erforderlich. Die App und ihre Datenformate werden nicht verändert. Ein vollständiger Fresh-PASS und eine neue IPA müssen weiterhin im folgenden Lauf nachgewiesen werden.

## Dritter nativer Lauf: Run 11

Run https://github.com/chris101010s/FORM_10_LIVING_WORKOUT1/actions/runs/45711753596 prüfte Commit `5eef4c88e59cbf71d442941cce3d69dafe582f83`. Native Kompilierung und beide Legacy-Starts mit Datenprüfung bestanden erneut. Die erste Installation war laut eigenem Befehlsstatus erfolgreich (33,714 Sekunden, Exit 0). Der Fresh-Fall brach anschließend noch vor dem Launch mit Exit 124 ab; die bisherige grobe Phasenbezeichnung blieb dabei „install“. Zwischen der bestätigten Installation und dem nächsten Phasenwechsel liegen die beiden bislang auf 30 Sekunden begrenzten `get_app_container`-Abfragen. In diesem Fall gab es noch keinen App-Prozess und keine Fresh-Datenprüfung. Es wurde keine IPA freigegeben.

Die anschließende CI-Korrektur kennzeichnet beide Container-Abfragen einzeln, erfasst ihre Zeitbudgets und Exitcodes und gibt beiden ausschließlich beim ersten kalten Szenario jeweils 180 statt 30 Sekunden. Spätere Container-Abfragen behalten 30 Sekunden. Die Timing-Ausgabe wird auf stderr geschrieben, damit stdout nur den echten Containerpfad enthält. Das gesamte Startskript wird zusätzlich in `simulator-smoke.log` mitgeschnitten und bereits vor dem iPhone-Build hochgeladen. Fehlgeschlagene Abfragen, Starts oder Datenprüfungen bleiben Fehler. Die App-Dateien und Datenformate bleiben identisch zum getesteten Startfix.
