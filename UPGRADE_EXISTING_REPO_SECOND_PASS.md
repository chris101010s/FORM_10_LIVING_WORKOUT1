# Bestehendes FORM-Repository auf den zweiten Durchgang aktualisieren

Stand: 25. November 2026. Ziel: **FORM 15.0.0, Build 150001**. Die erste Runde wurde zuerst abgeschlossen und als eigener Stand gesichert. Dieses Paket enthält anschließend beide Runden auf dieser Basis; es ist kein neues Beispielprojekt.

## 1. Inhalt und geprüfte Ausgangsbasis

Nach dem Entpacken liegt folgender Inhalt unter `FORM_15_0_0_SECOND_PASS/`:

| Pfad | Inhalt |
| --- | --- |
| `source/` | Vollständiger Quellstand einschließlich Lockfile, Assets, nativen Modulquellen, Workflows, Tests und Dokumenten |
| `upgrade/FORM_10_PUBLIC_MAIN_TO_FORM_15_SECOND_PASS.patch` | Binärer Git-Patch von der unten genannten öffentlichen Basis bis zum gelieferten Stand |
| `SOURCE_MANIFEST_15_SECOND_PASS.json` | Exakter Quellcommit und SHA-256 jeder gelieferten Quelldatei |
| `PATCH_VERIFICATION_15_SECOND_PASS.json` | Tatsächlicher Apply-Check und Dateivergleich auf einer isolierten Kopie der Basis |
| `RELEASE_REPORT_15_SECOND_PASS.md` | Ergebnisse und noch offene native Abnahme |

Die gelesene öffentliche Basis ist `chris101010s/FORM_10_LIVING_WORKOUT1`, Commit **`e0066a240400d6c38480b9a0de4e119a8a50e5bb`**. Der Patch enthält die Änderungen beider Durchgänge gegen genau diese Basis. Die dort vorhandene `.gitattributes` bleibt erhalten. Der ältere private Stand wurde nur verglichen und ersetzt diesen neueren Ausgangsstand nicht. Während der Erstellung wurde nichts in ein entferntes Repository gepusht und kein GitHub-Actions-Lauf ausgelöst.

Wenn dein Repository inzwischen weitere Änderungen enthält, sind diese zu berücksichtigen. Ein erfolgreicher Patchtest gegen die bekannte Basis beweist keine konfliktfreie Integration gegen beliebige spätere Commits.

## 2. Vorhandene App und Repository sichern

1. In der noch installierten App ein eigenes Backup exportieren und außerhalb des App-Containers aufbewahren. Das neue Quellenpaket enthält keine persönlichen Trainingsdaten.
2. **Die alte App nicht deinstallieren.** Effektive Bundle-ID und verwendete Signierung für die spätere Überinstallation notieren bzw. beibehalten.
3. Eigene ungespeicherte Repository-Änderungen sichern oder bewusst committen. `git status --short` muss vor dem Patch leer sein; keine fremden Änderungen zurücksetzen.
4. Einen eigenen Upgrade-Branch erstellen. Die persönliche Git-Historie, Secrets und Signierzertifikate bleiben im bestehenden Repository.

Beispiel für eine bereits vorhandene lokale Kopie; die beiden absoluten Pfade an den eigenen Rechner anpassen:

```bash
cd /absoluter/pfad/zu/FORM_10_LIVING_WORKOUT1
git status --short
git fetch origin
git switch -c upgrade/form15-second-pass
FORM15_PACKAGE_DIR=/absoluter/pfad/zu/FORM_15_0_0_SECOND_PASS
git log -1 --format='%H %s'
```

Der neue Branch entsteht auf deinem aktuell ausgecheckten Stand. Wenn du zuerst einen anderen, neueren eigenen Branch verwenden möchtest, wechsle bewusst dorthin, bevor du den Upgrade-Branch anlegst. Die Anleitung verwendet weder `reset --hard` noch eine pauschale Überschreibung.

## 3. Patch prüfen und übernehmen

Auf der genannten öffentlichen Basis wurde genau dieser Weg geprüft:

```bash
git apply --check --index "$FORM15_PACKAGE_DIR/upgrade/FORM_10_PUBLIC_MAIN_TO_FORM_15_SECOND_PASS.patch"
git apply --index "$FORM15_PACKAGE_DIR/upgrade/FORM_10_PUBLIC_MAIN_TO_FORM_15_SECOND_PASS.patch"
git diff --cached --stat
git diff --cached --check -- . ':!assets/fonts/*-OFL.txt' ':!docs/FORM_10_SPECIFICATION.txt' ':!docs/qa/15/p1-typecheck.log'
```

Nur wenn der erste Befehl erfolgreich ist, den zweiten ausführen. Der Patch enthält echte Binärdaten für neue oder geänderte Bilder und Schriften; diese Dateien nicht durch Textkopien ersetzen.

Beim erfolgreichen Anwenden meldet Git nachgestellte Leerzeichen bzw. CRLF aus unverändert übernommenen OFL-Lizenzen, der ursprünglichen FORM-10-Spezifikation und einem alten First-Pass-Log. Diese Originalbelege bleiben bytegetreu erhalten. Der oben verwendete Whitespace-Check nimmt ausschließlich diese dokumentierten Originaldateien aus; der übrige Quellstand wurde damit ohne Whitespacefehler geprüft. Die vollständige Warnung ist im Paket-Prüfmanifest erhalten. Es wurde kein `--whitespace=fix` verwendet, das Lizenz-/Originaldateien unbemerkt verändern würde.

Wenn `--check` wegen eigener späterer Änderungen scheitert, nicht die neueren Dateien löschen oder zurücksetzen. Auf dem gesicherten Upgrade-Branch kann Git anhand der vollständigen Blob-IDs einen Dreiwege-Abgleich versuchen:

```bash
git apply --3way --index "$FORM15_PACKAGE_DIR/upgrade/FORM_10_PUBLIC_MAIN_TO_FORM_15_SECOND_PASS.patch"
git status --short
```

Das kann Konflikte hinterlassen. Jeden Konflikt mit dem eigenen neueren Stand und `source/` vergleichen, danach die bewusst zusammengeführte Datei mit `git add` aufnehmen. Solange Konflikte bestehen, nicht committen oder bauen. Dieser Konfliktpfad wurde nicht gegen unbekannte spätere Änderungen vorweggenommen.

Wer den ersten FORM-15-Durchgang bereits integriert hat, verwendet ebenfalls einen Vergleich bzw. Dreiwege-Abgleich. Der beiliegende Patch ist **kein reiner First-Pass-zu-Second-Pass-Patch** und darf dort nicht blind doppelt angewendet werden. Die erhaltene erste ZIP bleibt ein separater Rückvergleich.

Alternativ kann `source/` für einen manuellen Dateivergleich dienen. Übernimm dann sämtliche tatsächlich nötigen Änderungen einschließlich neuer Dateien und dokumentierter Entfernungen; nur `App.tsx` zu kopieren reicht nicht. Kopiere niemals einen fremden `.git`-Ordner, persönliche Daten, `node_modules` oder generierte Buildverzeichnisse hinein. Das native Quellverzeichnis `modules/form-health/ios/` **gehört** zur Lieferung; es ist nicht mit einem generierten `ios/` am Projektwurzelverzeichnis zu verwechseln.

## 4. Integration prüfen und committen

Mit Node **24.22.3** und npm **11.19.1** wurde das Lockfile hier frisch installiert. Alle benötigten Quelldateien müssen für `preflight` bereits im Git-Index stehen:

```bash
npm ci --no-audit --no-fund
npm run check
npm run doctor
npm exec --no -- expo install --check
git diff --cached --check -- . ':!assets/fonts/*-OFL.txt' ':!docs/FORM_10_SPECIFICATION.txt' ':!docs/qa/15/p1-typecheck.log'
git commit -m "Upgrade FORM to 15.0.0 build 150001"
```

`npm run check` enthält 33 Test-/Gate-Gruppen sowie den vollständigen TypeScript-Check und ESLint. Die Online-Abhängigkeitsprüfung scheiterte in dieser Arbeitsumgebung zweimal an einem Proxy-Timeout; der ausdrücklich als offline gekennzeichnete CLI-Check und der Abgleich mit dem installierten SDK-Metadatensatz bestanden. Auf dem eigenen Rechner den Online-Check mit funktionierender Verbindung erneut ausführen. Details und originale Logs stehen in `TEST_MATRIX_15_SECOND_PASS.md`.

Erst den geprüften Branch in das eigene Repository übertragen und regulär integrieren. Ein Push ist eine eigene Aktion auf deinem Konto; dieses Paket hat ihn nicht ausgeführt. Der Standard-Workflow reagiert auf passende Änderungen an `main` und lässt sich außerdem manuell starten.

## 5. Standard-IPA im eigenen Repository bauen

Im GitHub-Repository unter **Actions → FORM 15.0.0 · Standard iOS IPA → Run workflow** den integrierten Branch wählen. Der Standardpfad setzt **`FORM_HEALTHKIT=0` und `FORM_WIDGETS=0`**. Der manuelle Lauf kann zusätzlich `simulator_smoke` aktivieren. Der Workflow protokolliert die tatsächlich vorhandene Xcode-Version und setzt keine kostenpflichtigen EAS-Builds voraus. Runner-Verfügbarkeit und kostenlose Kontingente werden nicht garantiert.

Nur nach einem erfolgreichen nativen Lauf die Artefakte verwenden:

- `FORM_15_0_0_unsigned.ipa`
- `FORM_15_0_0_unsigned.manifest.json`
- `FORM_15_0_0_unsigned.sha256`
- Build-/Prüflogs und gegebenenfalls der echte Simulator-Screenshot

Die stabilen Dateinamen enthalten die Marketingversion; `CFBundleVersion` und das Manifest müssen **150001** ausweisen. Ein Linux-Prebuild oder Hermes-Export ist keine IPA. Die konkreten lokalen Mac-Befehle und der separat signierte HealthKit-Pfad stehen in `RELEASE_BUILD_15.md`.

## 6. Über die bisherige Installation installieren

Die tatsächlich gebaute Standard-IPA mit der bisherigen kompatiblen Sideloadly-/Apple-ID-Konfiguration signieren und **über** die vorhandene App installieren. Bundle-ID bleibt `app.athleteos.personal`, Scheme `athleteos`, SQLite-Datei `form-v84-clean.db`. Die gleiche ID allein garantiert beim externen Signieren noch keinen identischen iOS-Datencontainer.

Nach der Installation zuerst alten Plan, Trainingshistorie, Gewichte, Fotos und gegebenenfalls aktive Session gegen das vorherige Backup prüfen. Es darf keine ungefragte Neueinrichtung stattfinden. Danach das in `TEST_MATRIX_15_SECOND_PASS.md` beschriebene kleine Plan-/Undo-/Backup-Szenario durchführen und ein neues Backup exportieren. Das alte Backup bis zum erfolgreichen Gerätetest behalten.

Wenn der Bestand unerwartet leer erscheint, nicht sofort neues Onboarding über die vermeintlich alte Datenbasis schreiben. Effektive App-Identität, Signierung und vorhandenes Backup prüfen. Der Source-Stand behält den Datenpfad; einen extern neu angelegten Container kann er nicht automatisch mit einem alten vereinigen.

## 7. Native Zusatzfunktionen getrennt abnehmen

HealthKit erfordert einen passend signierten optionalen Build und einen echten Test mit vorhandenen Apple-Health-/YAZIO-Daten. Die Standard-IPA behauptet diese Fähigkeit nicht. Der Widget-/Live-Activity-Code ist vorhanden; ein vollständiger signierter Multi-Target-Releasepfad bleibt offen. Für diese Funktionen sowie Icons, KeepAwake, Notifications, Dateischutz, VoiceOver und Motion auf kleinen Geräten enthält die Testmatrix konkrete Geräteabnahmen.
