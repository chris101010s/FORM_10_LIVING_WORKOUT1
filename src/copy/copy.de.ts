import type {PipPose} from '../art/types';
export type CopyTone='quiet'|'playful';
export const copyEvents=['planReady','restDay','noPlan','workoutStarted','setSaved','rest','restDone','extraAllowed','exerciseFinished','workoutFinished','pr','restored','searchEmpty','saving','saved','backupSaved','offline','syncSaved','noMeasurements','undo','planSaved','noteSaved','searchOpen','copySaved','repaired','connectionConfirmed'] as const;
export type CopyEvent=typeof copyEvents[number];
export type CopyVariant={id:string;event:CopyEvent;tone:CopyTone;text:string;pose:PipPose;requiresConfirmation:boolean};
/** Four original variants per event (104 total). Facts and errors remain separate normal UI text. */
const words:Record<CopyEvent,{pose:PipPose;confirmed?:boolean;text:[string,string,string,string]}>= {
 planReady:{pose:'ready',text:['Deine nächste Seite liegt bereit.','Dein Plan hat einen Platz für heute.','Das Heft ist aufgeschlagen. Kein Papierkram nötig.','Der Bleistift kennt den Weg. Du bestimmst das Tempo.']},
 restDay:{pose:'resting',text:['Ein freier Tag gehört dazu.','Heute ist Raum für Ruhe.','Auch ein leeres Kästchen kann nach Plan sein.','Pip hat die Hanteln ordentlich weggeräumt.']},
 noPlan:{pose:'thinking',text:['Dein Heft wartet auf einen Plan.','Hier kannst du deine Trainingstage ordnen.','Noch kein Inhaltsverzeichnis. Das lässt sich ändern.','Blankes Papier. Sehr aufnahmefähig.']},
 workoutStarted:{pose:'dumbbell',confirmed:true,text:['Dein geplanter Trainingsbogen ist geöffnet.','Die erste Zeile wartet auf deinen Eintrag.','Pip übernimmt heute die Randnotizen.','Ab jetzt schreibt dein Training seine eigene Geschichte.']},
 setSaved:{pose:'thumbsUp',confirmed:true,text:['Dein Satz ist eingetragen.','Diese Zeile ist sicher notiert.','Ein Haken. Kein großes Theater.','Tinte drauf. Handtuch daneben.']},
 rest:{pose:'stopwatch',text:['Deine Pause läuft.','Zeit zum Durchatmen.','Die Stoppuhr macht kurz ihren Job.','Pip hält solange den Platz frei.']},
 restDone:{pose:'neutral',text:['Die eingestellte Pause ist abgelaufen.','Du entscheidest, wann es weitergeht.','Der Timer ist fertig. Du musst es nicht sein.','Eine leise Randnotiz: Die Zeit ist um.']},
 extraAllowed:{pose:'focused',confirmed:true,text:['Die zusätzliche Zeile ist freigegeben.','Deine bewusste Ergänzung ist vermerkt.','Ein bisschen mehr Rand im Heft.','Zusatz notiert. Der ursprüngliche Plan bleibt lesbar.']},
 exerciseFinished:{pose:'smile',confirmed:true,text:['Die geplanten Zeilen dieser Übung sind dokumentiert.','Diese Übungsseite ist ausgefüllt.','Ein Kapitel hat seinen Haken.','Pip setzt ein kleines Lesezeichen.']},
 workoutFinished:{pose:'celebrating',confirmed:true,text:['Dein Trainingsprotokoll ist gespeichert.','Deine Einträge sind abgeheftet.','Der Trainingszettel hat Feierabend.','Das Heft klappt zu. Die Daten bleiben da.']},
 pr:{pose:'surprised',confirmed:true,text:['Ein neuer belegter Bestwert steht im Heft.','Dieser Wert ist in deinem Verlauf neu.','Ein Stern mit Datengrundlage. Seltene Gattung.','Die Randnotiz bekommt heute einen Stern.']},
 restored:{pose:'wave',text:['Dein bisheriger Trainingsbogen ist wieder da.','Du kannst an deinem letzten Stand anknüpfen.','Das Lesezeichen hat seinen Job gemacht.','Pip hat die Seite nicht umgeblättert.']},
 searchEmpty:{pose:'magnifier',text:['Für diese Suche gibt es noch keinen Treffer.','Eine andere Schreibweise kann helfen.','Die Lupe meldet: noch keine Spur.','Pip sucht Wörter, keine versteckten Trainingspflichten.']},
 saving:{pose:'writing',text:['Dein Eintrag wird lokal gesichert.','Die Speicherung ist noch nicht bestätigt.','Der Stift ist noch auf dem Papier.','Diese Zeile trocknet noch.']},
 saved:{pose:'smile',confirmed:true,text:['Lokal gespeichert.','Der Schreibvorgang ist bestätigt.','Der Punkt sitzt.','Abgelegt. Ohne Büroklammerverlust.']},
 backupSaved:{pose:'thumbsUp',confirmed:true,text:['Die Sicherung wurde erstellt und geprüft.','Eine geprüfte Kopie ist bereit.','Dein Heft hat jetzt ein zweites Exemplar.','Ordentlich abgeheftet. Pip nickt.']},
 offline:{pose:'neutral',text:['Lokale Einträge brauchen keine Verbindung.','Dein Plan und deine Einträge bleiben vor Ort verfügbar.','Für lokale Notizen braucht Pip kein WLAN-Passwort.','Dein Heft kann auch ohne Cloud weiterschreiben.']},
 syncSaved:{pose:'smile',confirmed:true,text:['Die abgefragten Werte sind lokal gespeichert.','Die Aktualisierung wurde gesichert.','Neue Einträge sind im Heft angekommen.','Ein kurzer Datentransport, sauber notiert.']},
 noMeasurements:{pose:'sleeping',text:['Für diesen Zeitraum liegen keine Messwerte vor.','Du entscheidest, welche Werte du festhalten möchtest.','Diese Seite darf auch leer bleiben.','Noch keine Zahlen. Keine Eile.']},
 undo:{pose:'focused',confirmed:true,text:['Die letzte Änderung wurde zurückgenommen.','Der vorherige Zustand ist wieder gespeichert.','Der Radiergummi war präzise.','Eine Zeile zurück. Alles nachvollziehbar.']},
 planSaved:{pose:'writing',confirmed:true,text:['Deine Planänderung ist gespeichert.','Die neue Planfassung ist bestätigt.','Das Inhaltsverzeichnis hat ein Update.','Neue Fassung. Alte Trainings bleiben unangetastet.']},
 noteSaved:{pose:'neutral',confirmed:true,text:['Deine Gerätenotiz ist gespeichert.','Die Notiz steht bei deiner Übung.','Sitzhöhe notiert. Gedächtnis entlastet.','Eine kleine Notiz spart später Sucherei.']},
 searchOpen:{pose:'magnifier',text:['Suche in deinen lokalen Einträgen.','Übungen, Pläne, Trainings und Einstellungen.','Pip packt die Lupe aus.','Ein Wort reicht für den Anfang.']},
 copySaved:{pose:'smile',confirmed:true,text:['Die neue Kopie ist gespeichert.','Die Kopie hat eigene Planpositionen.','Kopiert. Die Geschichte wurde nicht mitverdoppelt.','Ein zweites Blatt mit eigenen Zeilen.']},
 repaired:{pose:'repair',confirmed:true,text:['Der erneute Schreibversuch wurde bestätigt.','Deine Einträge sind jetzt lokal gespeichert.','Der Speicherstatus ist wieder bestätigt.','Die Sicherung deiner aktuellen Eingaben ist abgeschlossen.']},
 connectionConfirmed:{pose:'neutral',confirmed:true,text:['Die verfügbare Verbindung ist eingerichtet.','Die Abfragequelle ist bestätigt.','Der Datenweg steht. Werte erscheinen nur, wenn sie vorliegen.','Das Kabel im Heft ist symbolisch. Die Quelle ist echt.']},
};
export const copyDe:CopyVariant[]=copyEvents.flatMap(event=>words[event].text.map((text,index)=>({id:`de.${event}.${index+1}`,event,tone:index<2?'quiet' as const:'playful' as const,text,pose:words[event].pose,requiresConfirmation:!!words[event].confirmed})));
export const eventPose:Record<CopyEvent,PipPose>=Object.fromEntries(copyEvents.map(e=>[e,words[e].pose])) as Record<CopyEvent,PipPose>;
export const confirmationEvents=new Set<CopyEvent>(copyEvents.filter(e=>words[e].confirmed));
export function eventEligible(event:CopyEvent,confirmed:boolean){return !confirmationEvents.has(event)||confirmed;}
export function copyHash(value:string){let h=2166136261;for(const c of value){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0;}
/** A selector lives for one app session. Same event ID is stable on re-render; last variant per event is avoided. */
export function createCopySelector(){const selections=new Map<string,CopyVariant>(),last=new Map<string,string>();return (event:CopyEvent,eventId:string,tone:CopyTone,confirmed:boolean):CopyVariant|null=>{if(!eventEligible(event,confirmed)||!eventId)return null;const key=`${event}:${eventId}:${tone}`,known=selections.get(key);if(known)return known;const pool=copyDe.filter(x=>x.event===event&&x.tone===tone),previous=last.get(`${event}:${tone}`);let index=copyHash(key)%pool.length;if(pool[index].id===previous)index=(index+1)%pool.length;const choice=pool[index];selections.set(key,choice);last.set(`${event}:${tone}`,choice.id);if(selections.size>512)selections.delete(selections.keys().next().value!);return choice;};}
