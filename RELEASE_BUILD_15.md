# FORM 15.0.0 · Build und Update der vorhandenen App

Die ZIP enthält den tatsächlich weiterentwickelten bestehenden Quellcode. Eine IPA ist nur dann als gebaut zu behandeln, wenn ein tatsächlicher macOS-/Xcode-Lauf eine Datei und zugehörige Prüflogs erzeugt hat. Die Linux-Prüfungen in `docs/qa/15-second/` ersetzen diesen Nachweis nicht. Die First-Pass-Basis bleibt unter `docs/qa/15/` nachvollziehbar.

## Identität bleibt gleich

| Merkmal | Wert |
| --- | --- |
| Anzeigename / Marketingversion | FORM 15.0.0 / 15.0.0 |
| Paketname | `athlete-os-form` |
| iOS Bundle-ID | `app.athleteos.personal` |
| URL-Scheme | `athleteos` |
| SQLite-Datei | `form-v84-clean.db` |
| Technische Buildnummer | `150001` |
| Expo / React Native | bestehendes SDK 58 / React Native 0.88.1 |

Die Datenbankversion wird separat durch die Datenerhalt-Migration geführt. Eine neue Marketingversion bedeutet keinen neuen Datencontainer. Der bisherige DB-Dateiname mit „clean“ wurde beibehalten und ist kein Resetauftrag.

## Second-Pass-Ergänzungen ohne Identitätswechsel

Build 150001 behält Marketingversion, Bundle-ID, Scheme und Datencontainer. Die vorhandenen Artifact-Dateinamen bleiben stabil; das erzeugte Manifest und `CFBundleVersion` unterscheiden den neuen Build eindeutig vom First Pass 150000.

Neu direkt deklariert sind die zum bestehenden SDK passenden Expo-Pakete `expo-keep-awake ~58.0.4`, `expo-image-manipulator ~58.0.16`, `expo-crypto ~58.0.8` und `expo-constants ~58.0.16`. Sie wurden mit `expo install` aus der vorhandenen SDK-Kompatibilitätszuordnung ausgewählt. Es gibt keinen SDK-/React-Native-Wechsel und keine kostenpflichtige Build-Abhängigkeit. `package-lock.json` enthält die tatsächlich aufgelösten Pakete.

Die neuen Gates `test:health-second`, `test:native-second`, `test:search-second`, `test:training-second`, `test:second-pass-data`, `test:design-second` und `test:analytics-second` sind im gemeinsamen `test:all` enthalten. Vor dem teuren Installieren prüft CI weiterhin mit dem dependency-freien `preflight` auch neue Swift-Quellen, Icon-Plugin und Tests auf tatsächliches Git-Tracking.

### Vier native App-Symbole

Primär ist `assets/icons/ink.png`. `plugins/withAlternateIcons.js` kopiert die tatsächlichen opaken 1024-Pixel-Assets für Paper, Blueprint und Retro in eigenständige `.appiconset`-Kataloge. Der Config-Plugin setzt `ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES` am App-Target für Debug und Release; er überschreibt keine von Xcode generierten `CFBundleIcons`. Die technische Buildnummer wird auch als `CURRENT_PROJECT_VERSION=150001` gesetzt. [Apple: alternative Icons konfigurieren](https://developer.apple.com/documentation/xcode/configuring-your-app-to-use-alternate-app-icons)

Das lokale Standard-Prebuild wurde tatsächlich erzeugt: Haupticon-Pixel wurden gegen Ink verglichen, alle drei alternativen PNGs bytegleich verifiziert, Katalogdateien und beide Build-Konfigurationen kontrolliert. Das ist ein **Quell-/Projekt-Nachweis**, kein erfolgreicher Asset-Catalog-Compile. Nach einem echten Xcode-Build rufen beide IPA-Skripte zusätzlich `scripts/verify-ios-presentation.cjs` auf. Der Prüfer verlangt Build150001 und tatsächlich generierte Alternate-Icon-Einträge mit Icon-Dateien im kompilierten App-Info.plist.

Zur Laufzeit liest `FormPresentationBridge` `supportsAlternateIcons`, die tatsächlich im installierten Bundle enthaltenen Varianten und `alternateIconName`. Eine Einstellung wird erst nach erfolgreichem UIKit-Callback und identischem Readback gespeichert. Ein aus einem Backup eingelesener Wunsch ändert kein Symbol heimlich. Bei fehlender Unterstützung bleiben Vorschauen und ehrlicher Status sichtbar. Die native Umschaltung selbst ist hier nicht geräteverifiziert. [Apple: Symbol ändern](https://developer.apple.com/documentation/uikit/uiapplication/setalternateiconname(_:completionhandler:))

### Native Komfortfunktionen und ihre Grenzen

KeepAwake ist ausdrücklich optional und standardmäßig aus. Es verwendet einen pro Komponenteninstanz eigenen Tag, nur bei aktivem, fokussiertem, nicht pausiertem und bestätigt gespeichertem Gym-Training. Hintergrund, Tabwechsel, Pause, Finish und Unmount geben den Tag frei; asynchrone Aktivierung/Deaktivierung ist serialisiert. Adaptertests prüfen auch spätes Aktivieren nach Unmount. [Expo KeepAwake](https://docs.expo.dev/versions/latest/sdk/keep-awake/)

Lokale Notifications werden aus **bestätigten** Daten erzeugt, über Session-/Timer-ID und vollständigen Inhaltsfingerprint abgeglichen und nach Skip, Undo, Änderung, Pause oder Finish entfernt/ersetzt. Auch doppelte Adaptereinträge und verlorene Bestätigungen sind getestet. Erfolgreiche Planung ist kein Zustellnachweis. HealthKit-, Widget- oder APNs-Entitlements werden dafür nicht hinzugefügt.

Widget-Zeilen verwenden konkrete Plantermine und zählen Wiederholungen nicht doppelt. Eine andere absolvierte Einheit erledigt den heutigen Plantermin nicht mehr. Live Activities erhalten absolute Start-, Pausen- und Rest-Endzeitstempel für SwiftUI-Timer sowie eine lokal verwaltete Sessionzuordnung. Verwaiste oder fremde Sessioninstanzen werden beendet; Finish/Discard endet die zugehörige Activity. Native Verfügbarkeit verlangt konfigurierte Funktion, tatsächlich eingebettete Extension, zugängliche App Group und vorhandenes Native-Modul; für Activities zusätzlich Systemfreigabe. Der ungetestete Multi-Target-Signierungsweg bleibt unten ausdrücklich offen.

`preparePrivateStorage` stellt im bestehenden Standard-Native-Modul einen festen Application-Support-Unterordner bereit, setzt Backup-Ausschluss und iOS-Dateischutz und gibt beobachtete Eigenschaften zurück. Das ist keine Behauptung von Datenbankverschlüsselung oder eine auf diesem Linux-Host überprüfte Schutzgarantie. Die Daten-/Backup-Dokumente führen die native Abnahme separat.

## Vor der Überinstallation

1. In der noch installierten alten App ein eigenes JSON-Backup oder ein geprüftes verschlüsseltes Backup exportieren. Die Datei außerhalb der App aufbewahren. Persönliche Backups gehören nicht ins Repository oder in Build-Artefakte.
2. Bestehende App nicht deinstallieren. Die gleiche effektive Bundle-ID und eine zum bisherigen Container kompatible Signierung verwenden.
3. Den aktuellen Repository-Stand sichern, zum Beispiel auf einem Upgrade-Branch mit einem eigenen Sicherungstag. Die gelieferten Änderungen gegen eventuell neuere eigene Commits vergleichen; keine neueren Fehlerkorrekturen durch einen vollständigen alten Repository-Stand ersetzen.
4. Quellcode und neue Dateien einschließlich `package-lock.json`, lokalem Modul, Assets, Tests und Workflows übernehmen. Eigene `.git`-Historie, Secrets und persönliche Konfiguration nicht durch Dateien aus einem anderen Projekt ersetzen. Generierte `ios/`, `node_modules/` und Build-Artefakte werden neu erzeugt und nicht als App-Daten übertragen.

Eine gleiche Bundle-ID allein garantiert bei Sideloading keine Datenübernahme. Signierung und effektive App-Identität müssen ebenfalls passen; die reale Überinstallation bleibt ein Gerätetest.

## Reproduzierbare lokale Prüfungen

Die Workflows verwenden Node 24.22.3. Die vorhandene Engine-Anforderung bleibt `>=22.13.0`; die SQLite-Tests benötigen eine Node-Version mit `node:sqlite`.

```bash
npm ci --no-audit --no-fund
npm run check
npm run doctor
npm exec --no -- expo install --check
```

`check` führt die vorhandenen und neuen Tests, den vollständigen TypeScript-Check und die semantische ESLint-Prüfung aus. `qa:release` führt diese Gates sowie Expo-Konfigurations-/Abhängigkeitsprüfungen aus und schreibt für jedes Kommando Exit-Code, Laufzeit und Log nach `artifacts/`. Das Manifest behauptet nicht automatisch bestandene Tests, wenn es ohne diesen Gate-Lauf erstellt wurde.

ESLint und TypeScript-Parser sind auf konkrete Versionen fixiert. Die Lint-Regeln prüfen unter anderem widersprüchliche Bedingungen, unerreichbaren Code, doppelte Zweige, doppelte JSX-Eigenschaften und ungültige Promise-Executors. Eine bloße Umformatierung der alten App ist kein Release-Gate.

Der Build lädt keine neuen Übungskataloge, Fotos oder Schriften ungefragt nach. Er verwendet die mitgelieferten, überprüfbaren Quellen und Offline-Assets. Die getrennten Fetch-Skripte bleiben explizite Wartungsaktionen.

## Standard-IPA ohne HealthKit oder Widgets

GitHub Actions: **FORM 15.0.0 · Standard iOS IPA**. Manuell auslösen oder nach Integration auf `main` starten lassen. Der Workflow benötigt keine Apple-Zertifikate und erzwingt:

```text
FORM_HEALTHKIT=0
FORM_WIDGETS=0
```

Der Runner `xcode-27` wurde am 25.11.2026 in der offiziellen Runner-Images-Dokumentation nachgeschlagen. Er enthält Xcode 27; Expo SDK 58 ist für die entsprechenden Apple-SDKs vorgesehen. Die tatsächliche Xcode-Version wird bei jedem Lauf protokolliert. Runner-Verfügbarkeit oder kostenlose Kontingente werden dadurch nicht garantiert. [GitHub Runner-Image](https://github.com/actions/runner-images/blob/main/images/macos/xcode-27-arm64-Readme.md) · [Expo SDK 58](https://expo.dev/changelog/sdk-58)

Der Workflow installiert mit `npm ci`, führt die Release-Prüfungen aus, testet die Apple-Backup-Kryptografie, erzeugt native Dateien, installiert CocoaPods und kompiliert eine echte `iphoneos`-Release-App. Das Build-Skript prüft Bundle-ID, App-Version, vorhandenes Release-JavaScript, unerwünschte HealthKit-/App-Group-Entitlements und ZIP-Integrität.

Nach einem erfolgreichen Lauf entstehen:

- `FORM_15_0_0_unsigned.ipa`
- `FORM_15_0_0_unsigned.manifest.json`
- `FORM_15_0_0_unsigned.sha256`
- tatsächliche Logs, Gate-Status und `.xcresult`-Dateien

Die IPA ist noch unsigniert. „Kompiliert“ ist weder ein Installationsnachweis noch ein Test der Datenübernahme.

Auf einem eigenen Mac entspricht der Kernablauf:

```bash
FORM_HEALTHKIT=0 FORM_WIDGETS=0 npm run qa:release
FORM_HEALTHKIT=0 FORM_WIDGETS=0 npx --no-install expo prebuild --platform ios --clean --no-install
cd ios
pod install
cd ..
FORM_HEALTHKIT=0 FORM_WIDGETS=0 npm run build:ios:unsigned
```

`--clean` bezieht sich hier auf das generierte native Projekt, nicht auf die SQLite-Datei in deiner installierten App.

## Simulator-Starttest

Der manuelle Standard-Workflow bietet `simulator_smoke`. Er baut zusätzlich für `iphonesimulator`, wählt einen tatsächlich verfügbaren iPhone-Simulator (kleines SE-Modell bevorzugt), installiert und startet die App und erzeugt einen echten Screenshot.

Das Ergebnis heißt bewusst `fresh-install-smoke`. Es prüft keinen Altbestand, keine komplette Trainingseinheit und keinen YAZIO-Roundtrip. Die erzeugte Aufnahme muss visuell geprüft werden. Die in der Spezifikation geforderte vollständige Upgrade-/UI-Abnahme bleibt zusätzlich nötig und ist in `TEST_MATRIX_15_SECOND_PASS.md` getrennt ausgewiesen.

## Optionaler signierter HealthKit-Build

GitHub Actions: **FORM 15.0.0 · HealthKit signiert**. Dieser Workflow läuft nur manuell. Er verwendet `FORM_HEALTHKIT=1`, `FORM_WIDGETS=0` und ein eigenes, tatsächlich passendes Apple-Provisioning-Profil. Es gibt keine EAS-Pflicht und keine Umgehung von Apples Signierrechten.

Dafür werden im eigenen Repository folgende Secrets benötigt:

| Secret | Inhalt |
| --- | --- |
| `FORM_APPLE_TEAM_ID` | Team-ID der bisherigen bzw. kompatiblen Signierung |
| `FORM_CERTIFICATE_P12_BASE64` | Eigenes exportiertes Signierzertifikat einschließlich privatem Schlüssel als Base64 |
| `FORM_CERTIFICATE_PASSWORD` | Passwort dieses Zertifikats |
| `FORM_PROFILE_BASE64` | Profil für exakt `app.athleteos.personal`, mit HealthKit und zugelassenen Geräten |
| `FORM_KEYCHAIN_PASSWORD` | Zufälliges Passwort für den temporären Runner-Keychain |

Die Dateien werden nur im temporären Runner eingerichtet und in einem `always()`-Schritt wieder entfernt. Weder Zertifikate noch private Schlüssel oder eigenständige Provisioning-Dateien werden als Build-Artefakte hochgeladen. Das Vorgehen orientiert sich an der offiziellen GitHub-Anleitung. [GitHub: Apple-Zertifikate in macOS-Runnern](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications)

`debugging` verlangt ein Development-Profil; `release-testing` ein passendes Ad-hoc-Profil. Beide sind Exporte für registrierte Geräte; der Workflow lädt nichts in App Store Connect hoch. Apple beschreibt diese Verteilungswege für eigene Testgeräte. [Apple: Verteilung auf Entwicklungsgeräte](https://developer.apple.com/documentation/xcode/distributing-apps-to-your-development-devices)

Das Skript kontrolliert Team-ID, genaue App-ID, Profilablauf, HealthKit-Berechtigung und Exportmethode vor dem Archivieren. Signierwerte werden nur am eigentlichen App-Target gesetzt, nicht pauschal an CocoaPods-Targets. Nach dem Export werden Codesign-Signatur, Bundle-ID, Marketingversion, HealthKit-Entitlement und IPA-ZIP geprüft.

Erwartete Datei nach erfolgreichem Lauf: `FORM_15_0_0_HealthKit_signed.ipa`, zugehöriges Manifest und SHA-256. Die Quellen sind vorbereitet; ohne echte Signierdaten und Xcode-Lauf gibt es keine verifizierte signierte IPA.

## Separater Widget-Buildpfad bleibt offen

Die bestehenden Widget-/Live-Activity-Quellen und der optionale Config-Schalter `FORM_WIDGETS=1` bleiben im Projekt erhalten. Die beiden mitgelieferten Release-Buildpfade setzen jedoch `FORM_WIDGETS=0`; das signierte Skript lehnt `FORM_WIDGETS=1` ausdrücklich ab. Der signierte Workflow unterstützt damit ausschließlich den HealthKit-App-Build. Er behauptet keine funktionierende Signierung zusätzlicher Widget-Targets.

Ein eigener Widget-Build benötigt eine überprüfte Zuordnung von Bundle-IDs, App Groups, Entitlements und Provisioning-Profilen für die App und jede Extension sowie einen tatsächlichen Xcode-Archiv-/Exportlauf. Diese Zuordnung wurde hier nicht mit echten Profilen eingerichtet oder nativ getestet. Der in der Spezifikation zusätzlich gewünschte signierte Widget-Pfad ist deshalb ein offener Build-Baustein; den Schalter allein zu aktivieren vervollständigt ihn nicht.

## Upgrade mit Sideloadly

Die Standard-IPA in [Sideloadly](https://sideloadly.io/) laden (z. B. per Drag-and-drop) und mit derselben Sideloadly-/Apple-ID-Konfiguration wie die bisherige App signieren und über die vorhandene Installation installieren. Keine andere Bundle-ID vergeben und die alte App vorher nicht entfernen. Die bisher verwendeten Optionen für die App-Identität beibehalten; Änderungen an Signierung oder Identität können einen anderen Container ergeben.

Nach der Überinstallation zuerst prüfen:

1. Bestehendes Profil erscheint ohne erneutes Onboarding.
2. Alte Trainings, Gewichte und Pläne stimmen mit dem Backup überein.
3. Ein vorher laufendes Training kann fortgesetzt werden; Timer, Entwürfe und Satzwerte sind vorhanden.
4. Ein neuer Test im eigenen Plan verwendet die vorgesehenen Satzzeilen und expliziten Extra-Freigaben.
5. Ein neues Backup lässt sich exportieren; altes Backup bis zum erfolgreichen Gerätetest behalten.

Falls die App unerwartet leer erscheint, keine neue Einrichtung über die vermeintlich alte Datenbasis schreiben. Zuerst effektive Bundle-ID/Signierung und das vorhandene Backup prüfen. Der Quellcode behält den bestehenden Datenpfad, kann einen durch externes Signieren neu angelegten iOS-Container aber nicht automatisch mit dem alten zusammenführen.

## Nachweisgrenzen dieser Lieferung

Die tatsächlichen Second-Pass-Ergebnisse stehen in `TEST_MATRIX_15_SECOND_PASS.md` und `docs/qa/15-second/`. Expo-Prebuild auf Linux erzeugt ein Projekt; CocoaPods, Xcode, Signierung, Simulator und physisches iPhone sind separate Nachweise. Ein erfolgreicher synthetischer SQLite-Upgrade-Test ersetzt keine Überinstallation auf dem persönlichen Gerät. Die YAZIO-Integration ist in `YAZIO_INTEGRATION.md` einschließlich der noch offenen nativen Tests beschrieben.
