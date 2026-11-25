# Second Pass – Design, Motion, Copy und UI: Bestandsaudit

Stand: `form-15-first-pass` / `05056e2185092d9cc530a9aad5d4935a2de969e0`. Audit vor Laufzeitänderungen. Pfade beziehen sich auf tatsächlich gelesenen Quelltext; native Bedienung ist hier nicht ausgeführt.

| Anforderung | Vorher | Datei / Einstieg | Speicher / Test | Offene Abnahme |
|---|---|---|---|---|
| P1 §6 Referenz eigenständig abstrahieren | vorhanden und geprüft | `docs/design`, `DESIGN_SYSTEM_15.md`; reale Browseransicht HeyClicky samt Animation zuvor angesehen | Referenzprotokoll, keine kopierten Assets | Zweite gestalterische Runde am eigenen Code |
| P1 §6.1 / P2 §1.1 Palette, vier lokale Fonts | vorhanden und geprüft | `components/Design.tsx`, `fonts.generated.ts`, `assets/fonts` | OFL-Dateien, gebündelte Fonts im echten iOS-JS-Export; Kontrasttest | Retro ergänzen, visueller Device-Test offen |
| P2 §1.1 Papiertextur, Tape, Clip, Retrodetails | teilweise | `Sketchbook.tsx`: InkRule/NotebookSheet/MarkerSwipe | eigene SVG-Pfade; keine weitere Persistenz | eigene Textur und integrierte Motive, Layout/SE nativ prüfen |
| P2 §1.1 44pt, Dynamic Type und native Safe Areas | teilweise | `Design.tsx`, `App.tsx`, `Overlay.tsx` | Button/Chip min44; Header versteckt Dekoration bei großer Schrift | Home-Wochentage min35 Breite und Modal-Schließen ohne44 explizit verbessern; echtes VoiceOver/SE blockiert |
| P1 §6.2 / P2 §1.2 Pip, 16 unterscheidbare Posen | fehlt | `art/doodles.ts` besitzt nur einen Helper | kein Character-Schalter | eigene16 Posen mit sinnvoller Trigger-Zuordnung, Bible und getrenntem Opt-in |
| P2 §1.3 48 Motive | teilweise | `art/doodles.ts`:12 eigene Motive; Exportskript, tatsächlicher Atlas | Originalpfade, Quellenmanifest; Atlas gerendert | 48 eindeutige integrierte Motive + Manifest/Registry |
| P2 §1.3 zusätzliche Tabicons und Kategorien | fehlt | `App.tsx` Standard-SF-Symbols nativ / einfache SVG-Fallbacks | keine Persistenz | eigene aktive/neutrale Icons in beiden Navigationswegen,8–12 Kategorien |
| P2 §1.4 vier alternative Appicons | fehlt | native Bridge ohne Icon-API | Standardasset vorhanden | eigene4 Varianten; native Verfügbarkeit vor Auswahl, Umschaltung nativ blockiert |
| P2 §1.4 fünf Themes, bestehende Wahl | teilweise | `Design.tsx`, `More.tsx` / Papier,Tinte | settings.appearance + paperMode, Backup bewahrt | explizitesRetro/Light/Dark/Paper/System unter Erhalt alter Wahl |
| P1 §6.3 / P2 §2 zentrale Bewegungsabschaltung | teilweise | `SketchMotionProvider` und ältere `MotionProvider` | settings.motion, AppState/ReduceMotion; keine Loop | einheitliche Off/Subtle/Lively auch für Modal/Navigation; schnelle Navigation/Unmount prüfen |
| P2 §2 36 echte Motion-Flows | teilweise | `Sketchbook.tsx`:InkReveal,PencilCheck,MarkerSwipe,PaperFlip,StickerPop,RestDial,ReceiptPrint,ChartInk | reale Commit-/Zeit-/Diagrammwerte | fehlende integrierte Flows und zentraler Katalog; native FPS/Screenrecordings blockiert |
| P2 §3 100 typisierte Sprüche und Opt-in | fehlt | `utils/coach.ts` enthält datenbasierte Hinweise, kein Ereignistextsystem | settings.coach/tone existiert | originale100, stabile Wahl/Wiederholungsbremse; PR nur bestätigt, Health ruhig; getrenntCharacter/Copy |
| P2 §3 Easter Eggs | teilweise | ältere eggs-Einstellung | lokale Settings | optionaler7-Tap-Retro-Dialog ohne Leistungsdruck, keine Pflicht |
| P1 §2 / P2 §8 reduzierte Hauptnavigation | vorhanden und geprüft | `App.tsx`:Heute/Plan/Training/Fortschritt/Gesundheit; Werkstatt separat | Profil/Archiv alte Daten weiterhin erreichbar; Plan-only-Tests | neue Komfortfunktionen als Unterseiten, keine zweite Hauptaktion |
| P2 §8 Home-Konfiguration | fehlt | `screens/Home.tsx`:feste Wochenübersicht + Hilfstext | heutigerPlan/aktiveSession echte Daten | wenige optionale Kennzahlen/Verknüpfung, zentraleCTA erhalten |
| P2 §8 gruppierte Einstellungen | teilweise | `More.tsx`:Werkstatt | persistente alte Settings | Motion/Character/Copy/Gym/KeepAwake/Icons ergänzen; wahre Capability |
| UI-Aktionen / Dead Ends | teilweise | `More.tsx`, `Home.tsx`, `App.tsx`, `Overlay.tsx` gelesen | echte Handler in gesichteten Buttons; kein reinerShowcase | unbekannte Detailroute fällt aktuell auf Journal/WeekReport zurück; neue Suchrouten explizit behandeln; native komplette Tap-Abnahme offen |
| P1 §6.5 / P2 §9.2 Screenshots/Recordings/SE/FPS | nativ blockiert | Linux-Umgebung ohne Xcode/Simulator | Asset-Sheet ist als Asset-Sheet bezeichnet | reale Geräteabnahme erst auf Mac/iPhone; keine Mockups als Nachweis |

Der Audit enthält keine Behauptung, dass die zweite Runde bereits bestanden sei. Nachherstatus wird erst mit tatsächlicher Implementierung und reproduzierbaren Prüfungen aktualisiert.

## Nachherstatus · Build 150001

Die zuvor fehlenden Quellbausteine sind umgesetzt: 48 kanonische Motive, 16 vollständige Pip-Posen, zehn Kategorien, eigene Tabzustände und vier App-Symbole; fünf Themen unter Erhalt alter Wahl; zentrale 40 Motion-Abläufe mit tatsächlichen Inhalten/Pfaden und 104 Textvarianten über reale Ereignisse. Dateien, Aufrufer, Hashes, Trigger und Fallbacks stehen in ASSET_MANIFEST, CHARACTER_BIBLE, MOTION_CATALOG und COPY_GUIDE. Das echte Asset-Sheet sowie Ink/Retro wurden visuell angesehen.

Quellmaße für Kerncontrols sind auf mindestens44×44 verbessert; Plan-/Home-Tage umbrechen, große Schrift blendet Dekoration aus, Datencontainer werden nicht dekorativ rotiert. Vier lokale OFL-Fonts bleiben ohne Startdownload nutzbar. Der neue tatsächliche Palette-Test bestätigt56Textpaare≥4,5:1, ohne daraus eine vollständige native WCAG-Abnahme abzuleiten.

Die tatsächlichen Motion-/Personality-Hooks laufen in kontrollierten JS-Adaptern mit Off/Reduce/inaktiv/Unmount/raschemErsetzen, fehlendemReplay und unabhängigenControls. Erfolgsmarken bleiben ohneCommit aus. Pflichttext bleibt auch bei ausgeschalteterCopy sichtbar. Die Galerie respektiert Character-Off. Falsche Home-Bestätigungszahlen und eine veraltete Termin-Memoisierung sind korrigiert; Custom-Tab-Detailnavigation verarbeitet echte Routeparameter.

Status für diese Bausteine: **vorhanden und geprüft auf der dokumentierten Quell-/Asset-/Hook-Ebene**. AlternatesnativeUmschaltung, SE/großesGerät, VoiceOver/Tastatur, echteScreenshots/Screenrecordings und FPS bleiben **nativ blockiert**. `TEST_MATRIX_15_SECOND_PASS.md` liefert die vollständigen abschließendenGate-Ergebnisse. Der Vorheraudit oben wurde nicht umgeschrieben.
