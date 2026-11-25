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
