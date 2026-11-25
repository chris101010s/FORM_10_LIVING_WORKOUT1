import {AppearanceSettings,GymPreferences,SearchPreferences,IconPreview} from '../components/AppearanceSettings';
import {AlternateIconSettings} from '../components/AlternateIconSettings';
import {PrivacyDiagnostics} from '../components/PrivacyDiagnostics';
import {MotionCue} from '../components/MotionCue';
import {SketchEvent} from '../components/Personality';
import React,{useMemo,useState} from 'react';
import {Alert,Pressable,Switch,Text,View} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {File} from 'expo-file-system';
import {useAthlete} from '../data/context';
import type {RecoveryEntry} from '../data/schema';
import {Button,Chip,Field,Label,Muted,Section,usePalette} from '../components/Design';
import {Doodle,InkRule,NotebookHeader,NotebookSheet} from '../components/Sketchbook';
import {BackupCenter} from '../components/BackupCenter';
import {NativeSettings} from '../components/NativeFeatures';
import {WidgetSettings,widgetsAvailable} from '../components/WidgetSync';
import {DateField} from '../components/DateField';
import {Overlay} from '../components/Overlay';
import {TrendChart} from '../components/TrendChart';
import {YearReview} from '../components/YearReview';
import {Habits} from './Habits';
import {Story} from './Story';
import {NutritionScreen} from './Nutrition';
import {AppleHealth} from './AppleHealth';
import {dateKey,numberInput,validateDate} from '../utils/metrics';
import {newId} from '../utils/plans';
import {localInsights} from '../utils/coach';
import {parseNutritionCSV} from '../utils/csv';
import {healthBridge} from '../utils/healthBridge';

function SettingRow({title,detail,onPress}:{title:string;detail:string;onPress:()=>void}){const p=usePalette();return <Pressable accessibilityRole="button" onPress={onPress} style={{paddingVertical:18,borderBottomWidth:1,borderColor:p.line,flexDirection:'row',alignItems:'center',gap:15,minHeight:72}}><View style={{flex:1}}><Text style={{fontSize:19,fontWeight:'600',color:p.ink}}>{title}</Text><Muted>{detail}</Muted></View><Text style={{fontSize:24,color:p.blue}}>›</Text></Pressable>}
function Toggle({title,value,onChange}:{title:string;value:boolean;onChange:(v:boolean)=>void}){const p=usePalette();return <View style={{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:13}}><Text style={{flex:1,fontSize:16,color:p.ink}}>{title}</Text><Switch accessibilityLabel={title} value={value} onValueChange={onChange}/></View>}

export function MoreScreen({initialArea='Habits',isolated=false}:{initialArea?:string;isolated?:boolean}={}){
 const p=usePalette(),{data,update,saving,lastSaved,fault}=useAthlete(),[area,setArea]=useState(initialArea),[name,setName]=useState(data.profile.name),[rest,setRest]=useState(String(data.settings.restSeconds)),[csvBusy,setCsvBusy]=useState(false);
 const patch=(changes:Partial<typeof data.settings>)=>update(d=>({...d,settings:{...d.settings,...changes}}));
 const saveProfile=async()=>{const n=numberInput(rest);if(n===null||!Number.isInteger(n)||n<15||n>600){Alert.alert('Pause prüfen','Erlaubt sind 15–600 ganze Sekunden.');return}await update(d=>({...d,profile:{...d.profile,name:name.trim().slice(0,120)},settings:{...d.settings,restSeconds:n}}))};
 const importCsv=async()=>{if(csvBusy)return;setCsvBusy(true);try{const result=await DocumentPicker.getDocumentAsync({type:['text/csv','text/plain','application/csv','application/vnd.ms-excel'],copyToCacheDirectory:true});if(result.canceled)return;if((result.assets[0].size??0)>4_000_000)throw Error('CSV ist zu groß (maximal 4 MB).');const entries=parseNutritionCSV(await new File(result.assets[0].uri).text());Alert.alert('CSV importieren?',entries.length+' kompatible Ernährungszeilen. Bereits vorhandene IDs werden übersprungen. Keine direkte YAZIO-Datei-Anbindung.',[{text:'Abbrechen',style:'cancel'},{text:'Importieren',onPress:()=>void update(d=>({...d,nutrition:[...d.nutrition,...entries.filter(e=>!d.nutrition.some(x=>x.id===e.id))]}))}])}catch(e){Alert.alert('CSV prüfen',String((e as Error).message))}finally{setCsvBusy(false)}};
 if(isolated&&area==='Recovery')return <RecoveryPane/>;
 if(isolated&&area==='Ernährung')return <NutritionScreen/>;
 return <View>{area==='Einstellungen'?<>
  <NotebookHeader eyebrow="FORM 15.0.0 / WERKSTATT" title="Dein Heft." subtitle="Ein ruhiger Platz für deine Einstellungen." doodle="notebook"/>
  <SettingRow title="Profil & Training" detail="Name, Pausen und Gewichtsschritte" onPress={()=>setArea('Profil')}/>
  <SettingRow title="App-Symbol" detail="Ink, Paper, Blueprint und Retro; nur bei Systemunterstützung wechselbar" onPress={()=>setArea('Icons')}/><SettingRow title="Lokale Suche" detail="Optionaler Verlauf und dessen Löschung" onPress={()=>setArea('Search')}/><SettingRow title="Papier, Tinte & Bewegung" detail="Darstellung, Animationen und Haptik" onPress={()=>setArea('Design')}/>
  <SettingRow title="Geräteschutz & Mitteilungen" detail="Gerätesperre und Erinnerungen" onPress={()=>setArea('Nativ')}/>
  <SettingRow title="Datensicherung" detail="JSON, verschlüsselte Backups und Rücksicherung" onPress={()=>setArea('Backup')}/>
  {healthBridge()&&<SettingRow title="Apple Health" detail="Freigaben, Übernahme und bewusster Export" onPress={()=>setArea('Apple')}/>}
  {widgetsAvailable()&&<SettingRow title="Widgets & Live Activities" detail="Optionale Anzeige außerhalb der App" onPress={()=>setArea('Widgets')}/>}
  <SettingRow title="Archiv & Extras" detail="Gewohnheiten, Rückblicke, Teilen und CSV" onPress={()=>setArea('Archiv')}/>
  <SettingRow title="Datenschutz & Buildstatus" detail="Lokale Speicherung und verfügbare Funktionen" onPress={()=>setArea('Info')}/>
 </>:<>
  {!isolated&&<View style={{marginBottom:15}}><Button secondary small title="‹ Werkstatt" onPress={()=>setArea('Einstellungen')}/></View>}
  {area==='Recovery'?<RecoveryPane/>:area==='Ernährung'?<NutritionScreen/>:area==='Habits'?<Habits/>:area==='Story'?<Story/>:area==='Apple'?<AppleHealth/>:area==='Widgets'?<WidgetSettings/>:area==='Nativ'?<><NotebookHeader eyebrow="GERÄT / EINSTELLUNGEN" title="In deiner Hand." doodle="window"/><NativeSettings/></>:area==='Backup'?<><NotebookHeader eyebrow="LOKAL / DATENSICHERUNG" title="Gut aufgehoben." doodle="floppy"/><Muted>{fault?'Es gibt einen Speicherfehler. Aktuelle Eingaben bleiben im Arbeitsspeicher.':saving?'Schreibvorgang läuft …':lastSaved?'Letzte Bestätigung: '+new Date(lastSaved).toLocaleString('de-AT'):'Deine bisherigen Daten sind geladen.'}</Muted><Muted>Vor einem App-Update ein eigenes Backup exportieren. Die App zum Aktualisieren nicht deinstallieren.</Muted><View style={{marginTop:20}}><BackupCenter/></View></>:area==='Design'?<AppearanceSettings/>:area==='Search'?<SearchPreferences/>:area==='Icons'?<><NotebookHeader eyebrow="DEIN APP-SYMBOL" title="Ein Zeichen auf Papier." doodle="window"/><IconPreview/><View style={{marginTop:20}}><AlternateIconSettings/></View></>:area==='Profil'?<>
   <NotebookHeader eyebrow="PROFIL / TRAINING" title="Deine Vorgaben." doodle="plate"/><Field label="Name (optional)" value={name} onChangeText={setName}/><Field label="Standardpause in Sekunden" value={rest} onChangeText={setRest} keyboardType="number-pad"/><Button title="Profil speichern" disabled={saving} onPress={()=>void saveProfile()}/><Section title="Gewichtsschritt"/><View style={{flexDirection:'row',flexWrap:'wrap'}}>{[.5,1,1.25,2.5,5].map(n=><Chip key={n} text={n+' kg'} active={(data.settings.weightStep??2.5)===n} onPress={()=>void patch({weightStep:n})}/>)}</View><Section title="Optionale Trainingspriorität"/><View style={{flexDirection:'row',flexWrap:'wrap'}}>{([['strength','Kraft'],['endurance','Ausdauer'],['composition','Körperverlauf'],['athletic','Athletik'],['mixed','Gemischt']] as const).map(([priority,text])=><Chip key={priority} text={text} active={data.profile.priority===priority} onPress={()=>void update(d=>({...d,profile:{...d.profile,priority:d.profile.priority===priority?undefined:priority}}))}/>)}</View><GymPreferences/><Toggle title="Körpergewicht beim bewussten Teilen zeigen" value={data.settings.showWeightOnShare} onChange={showWeightOnShare=>{void patch({showWeightOnShare})}}/>
  </>:area==='Archiv'?<>
   <MotionCue variant="folderOpen" eventKey="workshop-archive"><NotebookHeader eyebrow="ARCHIV / EXTRAS" title="Die Nebenfächer." doodle="folder"/></MotionCue><SettingRow title="Gewohnheiten" detail="Deine bisherigen Habits und Häkchen" onPress={()=>setArea('Habits')}/><SettingRow title="Training teilen" detail="Eine Vorschau selbst auswählen und teilen" onPress={()=>setArea('Story')}/><SettingRow title="Jahresrückblick" detail="Aus deinen gespeicherten Einträgen" onPress={()=>setArea('Jahr')}/><SettingRow title="Lokale Hinweise" detail="Nur mit ausreichender Datengrundlage" onPress={()=>setArea('Coach')}/><SettingRow title="Ernährungsarchiv" detail="Vorhandene manuelle und importierte Einträge" onPress={()=>setArea('Ernährung')}/><View style={{marginTop:16}}><Button secondary title="Kompatible Ernährungs-CSV importieren" disabled={csvBusy} onPress={()=>void importCsv()}/></View>
  </>:area==='Jahr'?<YearReview/>:area==='Coach'?<>
   <NotebookHeader eyebrow="ARCHIV / LOKALE HINWEISE" title="Ein Blick zurück." doodle="progress"/><View style={{flexDirection:'row',flexWrap:'wrap'}}>{(['calm','coach','chaos','off'] as const).map(tone=><Chip key={tone} text={{calm:'Ruhig',coach:'Coach',chaos:'Direkt',off:'Aus'}[tone]} active={(data.settings.tone??'off')===tone} onPress={()=>void patch({tone,coach:tone!=='off'})}/>)}</View>{localInsights(data).map(x=><NotebookSheet key={x.title} style={{marginTop:12}}><Label>{x.title}</Label><Text style={{color:p.ink,fontSize:19}}>{x.detail}</Text><Muted>{x.basis}</Muted></NotebookSheet>)}{!localInsights(data).length&&<Muted>Keine belastbaren Hinweise aus den vorhandenen Daten oder Funktion ausgeschaltet.</Muted>}
  </>:area==='Info'?<PrivacyDiagnostics/>:<><Muted>Dieser Bereich ist nicht verfügbar.</Muted><Button secondary title="Zur Werkstatt" onPress={()=>setArea('Einstellungen')}/>

  </>}
 </>}</View>;
}

function RecoveryPane(){
 const p=usePalette(),{data,update,saving}=useAthlete(),[entry,setEntry]=useState<RecoveryEntry|null>(null),[sleep,setSleep]=useState(''),[energy,setEnergy]=useState(''),[soreness,setSoreness]=useState(''),[limit,setLimit]=useState(30);
 const ordered=useMemo(()=>[...data.recovery].sort((a,b)=>b.date.localeCompare(a.date)),[data.recovery]);
 const edit=(r?:RecoveryEntry)=>{setEntry(r??{id:newId(),date:dateKey()});setSleep(r?.sleepHours===undefined?'':String(r.sleepHours));setEnergy(r?.energy===undefined?'':String(r.energy));setSoreness(r?.soreness===undefined?'':String(r.soreness))};
 const save=async()=>{if(!entry)return;const values=[sleep,energy,soreness].map(s=>s.trim()?numberInput(s):undefined);if(!validateDate(entry.date)||entry.date>dateKey()||values.some(v=>v===null)||values.every(v=>v===undefined)||values[0]!==undefined&&(values[0]!<0||values[0]!>24)||values.slice(1).some(v=>v!==undefined&&(!Number.isInteger(v)||v!<1||v!>5))){Alert.alert('Eintrag prüfen','Datum, Schlaf 0–24 Stunden, Energie und Muskelgefühl 1–5 prüfen.');return}const next={...entry,sleepHours:values[0]??undefined,energy:values[1]??undefined,soreness:values[2]??undefined};if(await update(d=>({...d,recovery:[...d.recovery.filter(r=>r.id!==entry.id),next]})))setEntry(null)};
 return <View><NotebookHeader eyebrow="GESUNDHEIT / ERHOLUNG" title="Zeit zum Auftanken." doodle="recovery"/><Button title="Erholung eintragen" onPress={()=>edit()}/><TrendChart unit="Stunden Schlaf" points={[...ordered].reverse().filter(r=>r.sleepHours!==undefined).map(r=>({date:r.date,value:r.sleepHours!}))}/><Section title="Deine Einträge"/>{ordered.slice(0,limit).map(r=><View key={r.id} style={{paddingVertical:15,borderBottomWidth:1,borderColor:p.line}}><Label>{r.date}</Label><Muted>{[r.sleepHours!==undefined?r.sleepHours+' h Schlaf':'',r.energy!==undefined?'Energie '+r.energy+'/5':'',r.soreness!==undefined?'Muskelgefühl '+r.soreness+'/5':''].filter(Boolean).join(' · ')}</Muted>{r.note&&<Muted>{r.note}</Muted>}<View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:9}}><Button secondary small title="Bearbeiten" onPress={()=>edit(r)}/><Button secondary small danger title="Löschen" onPress={()=>Alert.alert('Eintrag löschen?',r.date,[{text:'Abbrechen',style:'cancel'},{text:'Löschen',style:'destructive',onPress:()=>void update(d=>({...d,recovery:d.recovery.filter(x=>x.id!==r.id)}))}])}/></View></View>)}{!ordered.length&&<><Muted>Du entscheidest, welche Erholungswerte du festhalten möchtest.</Muted><SketchEvent event="noMeasurements" eventId="recovery-empty"/></>}{ordered.length>limit&&<Button secondary title="Weitere Einträge" onPress={()=>setLimit(n=>n+30)}/>}<Overlay visible={!!entry} title="Erholung erfassen" onClose={()=>setEntry(null)}>{entry&&<><DateField label="Datum" value={entry.date} onChangeText={date=>setEntry({...entry,date})}/><Field label="Schlaf in Stunden (optional)" value={sleep} onChangeText={setSleep} keyboardType="decimal-pad"/><Field label="Energie 1–5 (optional)" value={energy} onChangeText={setEnergy} keyboardType="number-pad"/><Field label="Muskelgefühl 1–5 (optional)" value={soreness} onChangeText={setSoreness} keyboardType="number-pad"/><Field label="Notiz (optional)" value={entry.note??''} onChangeText={note=>setEntry({...entry,note:note.slice(0,500)})} multiline/><Button title="Eintrag speichern" disabled={saving} onPress={()=>void save()}/></>}</Overlay></View>;
}
