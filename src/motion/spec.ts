export type MotionLevel='off'|'subtle'|'lively';
export type MotionShape='trace'|'slide'|'scale'|'stamp'|'pin'|'wipe'|'expand'|'cursor'|'wave'|'window';
export type MotionSpec={duration:number;shape:MotionShape;distance?:number;rotation?:number;scale?:number;success?:boolean;path?:string;length?:number;trigger:string;screen:string};
/** Values are visual only. Actions and commits never run from an animation callback. */
export const motionSpecs={
 inkReveal:{duration:580,shape:'trace',path:'M2 18Q20 1 42 15T78 11',length:100,trigger:'Passendes erstmaliges Öffnen einer eigenen Zeichnung',screen:'Hauptseiten'},
 pencilCheck:{duration:220,shape:'trace',path:'M8 18 17 26 34 6',length:45,success:true,trigger:'Bestätigter Satzabschluss',screen:'Gym'},
 eraserUndo:{duration:240,shape:'wipe',distance:22,path:'M8 20 18 10 30 20 20 30Z',length:60,success:true,trigger:'Atomar gespeichertes Undo',screen:'Gym / Plan'},
 markerSwipe:{duration:260,shape:'expand',distance:0,trigger:'Tatsächlicher heutiger Termin',screen:'Heute / Plan'},
 paperFlip:{duration:220,shape:'slide',distance:12,rotation:-.5,trigger:'Expliziter Übungswechsel',screen:'Gym'},
 notebookTab:{duration:160,shape:'slide',distance:-3,path:'M2 28Q22 25 42 28',length:42,trigger:'Wochentag auswählen',screen:'Plan'},
 stickerPop:{duration:240,shape:'scale',scale:.86,success:true,trigger:'Nach Commit belegter neuer PR',screen:'Gym'},
 stampPress:{duration:250,shape:'stamp',scale:1.14,rotation:-4,path:'M5 6 40 7 39 35 6 34ZM13 21 21 28 33 13',length:160,success:true,trigger:'Gespeicherter Trainingsabschluss',screen:'Archiv / Kalender'},
 restDial:{duration:0,shape:'trace',trigger:'Realer verbleibender Zeitstempel, keine erfundene Tween-Zahl',screen:'Gym / Resttimer'},
 restDone:{duration:280,shape:'trace',path:'M4 24Q22 9 42 23M23 7 24 1',length:55,trigger:'Einmaliger Übergang reale Pause zu null',screen:'Gym'},
 stopwatchClick:{duration:180,shape:'pin',rotation:-5,scale:.96,trigger:'Bestätigter Workoutstart',screen:'Gym'},
 pausePin:{duration:180,shape:'pin',rotation:8,distance:-5,success:true,trigger:'Bestätigte ausdrückliche Pause',screen:'Gym'},
 resumeUnpin:{duration:170,shape:'pin',rotation:-8,distance:5,success:true,trigger:'Bestätigtes Fortsetzen',screen:'Gym'},
 extraRow:{duration:210,shape:'expand',distance:9,path:'M3 9 43 9 42 32 4 32ZM5 20 24 20M32 14 32 27M26 21 39 21',length:160,success:true,trigger:'Einzeln freigegebener zusätzlicher Satz',screen:'Gym'},
 extraRep:{duration:180,shape:'trace',path:'M4 27 37 25M20 3 20 17M13 10 27 10',length:63,success:true,trigger:'Explizite gespeicherte Rep-Freigabe',screen:'Gym'},
 fieldFocus:{duration:140,shape:'trace',path:'M1 3Q48 1 96 3',length:96,trigger:'Tatsächlicher TextInput-Fokus',screen:'Eingabefelder'},
 savedDot:{duration:160,shape:'scale',scale:.55,success:true,path:'M18 8C31 8 31 28 18 28C5 28 5 8 18 8Z',length:63,trigger:'Neuer bestätigter Commit-Zeitstempel',screen:'Speicherstatus'},
 retryRepair:{duration:250,shape:'pin',rotation:7,path:'M8 25 27 7 34 14 15 32ZM17 20 24 20',length:70,trigger:'Bewusst gestarteter Retry, kein Erfolgssymbol',screen:'Fehlergate / Diagnose'},
 receiptPrint:{duration:340,shape:'slide',distance:-12,success:true,trigger:'Bestätigter Workoutabschluss',screen:'Gym'},
 chartDraw:{duration:350,shape:'trace',trigger:'Echte Serie / Zeitraum geändert',screen:'Verlauf'},
 chartCursor:{duration:150,shape:'cursor',distance:4,trigger:'Echten Datenpunkt ausgewählt',screen:'Verlauf'},
 prStarDraw:{duration:480,shape:'trace',path:'M22 1 27 15 42 16 30 26 34 41 22 33 9 41 13 26 2 16 17 15Z',length:145,success:true,trigger:'Belegter PR nach Commit / PR-Archivdatum',screen:'Gym / Rekorde'},
 calendarSlide:{duration:220,shape:'slide',distance:16,trigger:'Angezeigte Woche oder Monat geändert',screen:'Plan / Kalender'},
 planReorder:{duration:190,shape:'slide',distance:-9,path:'M7 10 30 10M7 20 30 20M7 30 30 30M38 5 38 34M33 10 38 5 43 10M33 29 38 34 43 29',length:120,success:true,trigger:'Bestätigte Umsortierung',screen:'Planeditor'},
 copyPaper:{duration:240,shape:'slide',distance:9,rotation:1.5,path:'M6 27 3 4 29 3 30 9M13 12 40 10 43 37 15 39ZM20 20 34 19M21 27 36 26',length:170,success:true,trigger:'Bestätigte Kopie mit neuer Instanz-ID',screen:'Planeditor'},
 folderOpen:{duration:260,shape:'expand',distance:8,trigger:'Archiv oder Planliste geöffnet',screen:'Plan / Werkstatt'},
 tapePeel:{duration:220,shape:'wipe',distance:20,rotation:8,trigger:'Optionale Notiz bewusst geschlossen',screen:'Heute'},
 clipAttach:{duration:200,shape:'pin',distance:-7,rotation:-6,path:'M17 31 33 14C40 5 28 -1 23 7L10 26C3 37 17 45 24 35L36 18M20 14 13 25C10 31 17 35 21 29L30 16',length:120,success:true,trigger:'Studionotiz bestätigt gespeichert',screen:'Gym'},
 mascotWave:{duration:620,shape:'wave',rotation:3,trigger:'Eine Begrüßung pro lokalem Tag bei Opt-in',screen:'Heute'},
 mascotExpression:{duration:240,shape:'scale',scale:.97,trigger:'Tatsächlicher Ereignis-/Posenwechsel',screen:'Sparsame Ereignisnotiz'},
 searchPeek:{duration:240,shape:'slide',distance:-10,rotation:-3,path:'M6 16C6 1 28 1 29 16C30 31 7 32 6 16ZM26 27 41 40',length:100,trigger:'Lokale Suche geöffnet',screen:'Suche'},
 emptyDoodle:{duration:480,shape:'trace',path:'M3 25Q4 5 23 8Q43 10 35 29Q22 44 7 29M33 31 42 40',length:120,trigger:'Echter Leerzustand',screen:'Suche / Listen'},
 connectionSketch:{duration:500,shape:'trace',path:'M2 8 12 8 12 25 2 25ZM36 8 46 8 46 25 36 25ZM12 16Q24 32 36 16',length:110,success:true,trigger:'Bestätigter vorhandener Verbindungsstatus',screen:'Ernährung'},
 syncTick:{duration:230,shape:'trace',path:'M4 19 13 27 34 5M38 25 42 25',length:50,success:true,trigger:'Erfolgreicher Import + SQLite-Commit',screen:'Ernährung'},
 backupEnvelope:{duration:320,shape:'expand',path:'M3 8 42 8 42 31 3 31ZM3 8 22 24 42 8',length:155,success:true,trigger:'Backup tatsächlich geschrieben und geprüft',screen:'Datensicherung'},
 launchInk:{duration:400,shape:'trace',path:'M2 24 4 3 22 3M3 13 19 13M27 24 29 4 36 16 43 4 45 24',length:115,trigger:'Optionaler nichtblockierender Logo-Strich',screen:'Start / Logo'},
 filmStrip:{duration:280,shape:'slide',distance:20,trigger:'Monats-/Jahresauswahl mit echten Daten',screen:'Rückblick'},
 themeTransition:{duration:180,shape:'scale',scale:.995,trigger:'Angezeigte Farbmodusauswahl; Speicherbestätigung separat',screen:'Werkstatt / Themen'},
 widgetReturn:{duration:240,shape:'cursor',distance:6,trigger:'Unterstützter echter athleteos://training-Link',screen:'Training'},
 retroWindow:{duration:250,shape:'window',scale:.94,distance:8,trigger:'Optionalen Retro-Dialog geöffnet',screen:'Werkstatt'},
} satisfies Record<string,MotionSpec>;
export type MotionName=keyof typeof motionSpecs;
export function motionAllowed(level:MotionLevel,reduced:boolean,active:boolean,successRequired=false,confirmed=false){return level!=='off'&&!reduced&&active&&(!successRequired||confirmed);}
export function motionDuration(name:MotionName,level:MotionLevel){return level==='off'?0:Math.round(motionSpecs[name].duration*(level==='subtle'?.78:1));}
