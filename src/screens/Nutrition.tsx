import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Alert,Linking,Pressable,Switch,Text,View} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useAthlete} from '../data/context';
import type {Nutrition} from '../data/schema';
import {Button,Card,Chip,Field,Label,Muted,Section,usePalette} from '../components/Design';
import {Doodle,NotebookHeader} from '../components/Sketchbook';
import {MotionCue} from '../components/MotionCue';
import {SketchEvent} from '../components/Personality';
import {useHealthSync} from '../components/HealthSync';
import {DateField} from '../components/DateField';
import {Overlay} from '../components/Overlay';
import {dateKey,numberInput,validateDate} from '../utils/metrics';
import {healthBridge} from '../utils/healthBridge';
import {newHealthNutrition,nutritionCoverageForDay,nutritionDates,nutritionForDay,nutritionHistoryWindow,nutritionLabels,nutritionMetrics,nutritionSources,validateFormGoals} from '../utils/nutritionSync';
import type {NutritionMetric} from '../utils/nutritionTypes';

const HELP='https://help.yazio.com/hc/de/articles/360018833998-Yazio-und-Apple-Health';
const manualMetrics=['kcal','protein','carbs','fat'] as const;
const formatValue=(value:number|undefined)=>value===undefined?'—':value.toLocaleString('de-AT',{maximumFractionDigits:1});
const uid=()=>`nutrition-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;

export function NutritionScreen(){
 const color=usePalette(),{data,confirmedData,update,saving}=useAthlete(),focused=useIsFocused();
 const bridge=useMemo(healthBridge,[]),state=confirmedData?.healthNutrition,{coordinator,view}=useHealthSync();
 const [date,setDate]=useState(dateKey()),[period,setPeriod]=useState<1|7|30|90>(1),[page,setPage]=useState(0),[pane,setPane]=useState<'health'|'manual'>('health');
 const [setup,setSetup]=useState(false),[connecting,setConnecting]=useState(false),busyRef=useRef(false),[message,setMessage]=useState('');
 const busy=connecting||view.phase==='waiting'||view.phase==='running';
 const [types,setTypes]=useState<NutritionMetric[]>(state?.requestedMetrics||['kcal','protein','carbs','fat']);
 const [editing,setEditing]=useState<string|null>(null),[isNew,setIsNew]=useState(false),[entryDate,setEntryDate]=useState(dateKey()),manualBusy=useRef(false);
 const [fields,setFields]=useState<Record<typeof manualMetrics[number],string>>({kcal:'',protein:'',carbs:'',fat:''}),[water,setWater]=useState('');
 const [goalsOpen,setGoalsOpen]=useState(false),[goalFields,setGoalFields]=useState<Partial<Record<NutritionMetric,string>>>({});
 const bounds=useMemo(()=>nutritionHistoryWindow(validateDate(date)?date:dateKey(),period),[date,period]);
 const sources=useMemo(()=>nutritionSources(state,bounds),[state,bounds]);
 const sourceBundle=state?.selectedSourceBundle||(sources.length===1?sources[0].bundleIdentifier:undefined);
 const days=useMemo(()=>nutritionDates(bounds).reverse(),[bounds]),visibleDays=days.slice(page*7,page*7+7);
 const visibleManual=data.nutrition.filter(n=>visibleDays.includes(n.date)).sort((a,b)=>b.date.localeCompare(a.date));
 const confirmedEvent=state?.lastAttempt?.id===view.id&&(view.phase==='success'||view.phase==='partial');
 const connectionEvent=confirmedEvent&&state?.connectionEventId===view.id&&view.samplesRead>0;
 useEffect(()=>{setPage(0);},[date,period]);
 useEffect(()=>{if(focused&&pane==='health'&&validateDate(date))void coordinator.request(bounds,'open');},[coordinator,focused,pane,date,bounds]);
 useEffect(()=>{setMessage('');},[view.id]);
 const read=async(connect=false)=>{
  if(!bridge||busyRef.current)return;
  if(!validateDate(date)){setMessage('Wähle zuerst ein gültiges Datum.');return;}
  if(!connect&&!state?.authorizationRequested){setSetup(true);return;}
  if(connect&&!types.length){setMessage('Wähle mindestens einen Datentyp.');return;}
  busyRef.current=true;setConnecting(connect);setMessage('');
  try{
   if(connect){
    if(!await bridge.authorizeNutrition(types))throw Error('Der Berechtigungsdialog wurde nicht abgeschlossen.');
    if(!await update(d=>({...d,healthNutrition:{...(d.healthNutrition||newHealthNutrition()),authorizationRequested:true,requestedMetrics:[...types]}})))throw Error('Die Verbindungseinstellung ist noch nicht lokal bestätigt. Speichern erneut versuchen.');
   }
   const outcome=await coordinator.request(bounds,period>7?'history':'manual');
   if(outcome.skipped==='setup')setSetup(true);
   else if(outcome.phase==='success'||outcome.phase==='partial'){
    setSetup(false);
    setMessage(outcome.samplesRead?`Abfrage lokal gespeichert.${outcome.phase==='partial'?' Einige Typen konnten nicht gelesen werden. Ältere bestätigte Werte bleiben gekennzeichnet erhalten.':''}`:'Keine lesbaren Werte in diesem Zeitraum. Apple unterscheidet nicht zwischen fehlenden Daten und verweigerten Leserechten.');
   }
  }catch(error){setMessage(error instanceof Error?error.message:'Die Verbindung konnte nicht hergestellt werden.');}
  finally{busyRef.current=false;setConnecting(false);}
 };
 const changeSync=(key:'onOpen'|'onForeground',value:boolean)=>{if(!value&&view.trigger===(key==='onOpen'?'open':'foreground'))coordinator.cancel();void update(d=>({...d,healthNutrition:{...(d.healthNutrition||newHealthNutrition()),syncPreferences:{...d.healthNutrition?.syncPreferences,[key]:value}}}));};
 const pauseSync=async()=>{coordinator.cancel();await update(d=>({...d,healthNutrition:{...(d.healthNutrition||newHealthNutrition()),authorizationRequested:false}}));};
 const beginManual=(entry?:Nutrition)=>{setEntryDate(entry?.date||date);setFields({kcal:entry?.kcal===undefined?'':String(entry.kcal),protein:entry?.protein===undefined?'':String(entry.protein),carbs:entry?.carbs===undefined?'':String(entry.carbs),fat:entry?.fat===undefined?'':String(entry.fat)});setIsNew(!entry);setEditing(entry?.id||uid());};
 const saveManual=async()=>{
  if(!editing||saving||manualBusy.current)return;
  if(!validateDate(entryDate)||entryDate>dateKey())return Alert.alert('Datum prüfen','Wähle einen gültigen Tag bis heute.');
  const values:Partial<Record<typeof manualMetrics[number],number>>={};
  for(const metric of manualMetrics){if(!fields[metric].trim())continue;const value=numberInput(fields[metric]);if(value===null||value<0||value>15000)return Alert.alert('Wert prüfen',`${nutritionLabels[metric].label}: eine Zahl zwischen 0 und 15.000 eingeben.`);values[metric]=value;}
  if(!Object.keys(values).length)return Alert.alert('Noch kein Wert','Mindestens einen tatsächlichen Wert eingeben.');
  const editId=editing;manualBusy.current=true;
  try{if(await update(d=>{const previous=d.nutrition.find(n=>n.id===editId);const entry:Nutrition={...previous,id:editId,date:entryDate,source:previous?.source||'Manuell',kcal:values.kcal,protein:values.protein,carbs:values.carbs,fat:values.fat};return {...d,nutrition:previous?d.nutrition.map(n=>n.id===editId?entry:n):[...d.nutrition,entry]};}))setEditing(null);}finally{manualBusy.current=false;}
 };
 const saveWater=async()=>{if(manualBusy.current||saving)return;const value=numberInput(water);if(!validateDate(date)||date>dateKey()||value===null||!Number.isInteger(value)||value<0||value>15000)return Alert.alert('Wasser prüfen','Eine ganze Zahl zwischen 0 und 15.000 ml an einem Tag bis heute eingeben.');manualBusy.current=true;try{if(await update(d=>({...d,healthEntries:[...(d.healthEntries||[]),{id:uid(),date,metric:'waterMl',value,note:'Manuell'}]})))setWater('');}finally{manualBusy.current=false;}};
 const openGoals=()=>{setGoalFields(Object.fromEntries(nutritionMetrics.map(metric=>[metric,state?.formGoals?.[metric]===undefined?'':String(state.formGoals[metric])])));setGoalsOpen(true);};
 const saveGoals=async()=>{try{const values:Partial<Record<NutritionMetric,number>>={};for(const metric of nutritionMetrics){const raw=goalFields[metric]?.trim();if(!raw)continue;const value=numberInput(raw);if(value===null)throw Error(`${nutritionLabels[metric].label}: Zahl prüfen.`);values[metric]=value;}const formGoals=validateFormGoals(values);if(await update(d=>({...d,healthNutrition:{...(d.healthNutrition||newHealthNutrition()),formGoals}})))setGoalsOpen(false);}catch(error){Alert.alert('FORM-Ziele prüfen',error instanceof Error?error.message:'Eingabe ungültig.');}};
 const renderDay=(day:string)=>{
  const summary=nutritionForDay(state,day,sourceBundle),requested=state?.requestedMetrics||[],coverage=nutritionCoverageForDay(state,day),covered=requested.filter(metric=>coverage[metric]);
  return <View key={day} style={{borderBottomWidth:1,borderColor:color.line,paddingVertical:16}}>
   <Label>{new Date(day+'T12:00:00').toLocaleDateString('de-AT',{weekday:'long',day:'numeric',month:'short'})}</Label>
   <Muted>{summary.source?`${summary.source.name} · Apple Health`:'Apple Health · keine gewählte Quelle mit lesbaren Werten'}</Muted>
   {(requested.includes('waterMl')?nutritionMetrics:manualMetrics).map(metric=><View key={metric} style={{flexDirection:'row',alignItems:'baseline',flexWrap:'wrap',justifyContent:'space-between',gap:8,paddingVertical:7}}><Text style={{color:color.ink,fontSize:16,flexShrink:1}}>{nutritionLabels[metric].label}</Text><Text style={{color:color.ink,fontSize:period===1?25:18,fontVariant:['tabular-nums'],fontWeight:'600'}}>{formatValue(summary.values[metric])} <Text style={{fontSize:13,color:color.muted}}>{summary.values[metric]===undefined?'unbekannt':nutritionLabels[metric].unit}</Text></Text></View>)}
   <Muted>{requested.length?`${covered.length}/${requested.length} gewählte Datentypen mit bestätigtem Abfragefenster.`:'Noch keine Datentypen verbunden.'} {covered.length?`Älteste dieser Abfragen: ${new Date(Math.min(...covered.map(m=>Date.parse(coverage[m]!)))).toLocaleString('de-AT')}.`:''}</Muted>
  </View>;
 };
 return <View>
  <NotebookHeader eyebrow="GESUNDHEIT / ERNÄHRUNG" title="Ernährung mit YAZIO" subtitle="Mahlzeiten in YAZIO. Verfügbare Werte hier im Trainingsheft." doodle="meal"/>
  <View style={{borderLeftWidth:3,borderColor:color.blue,paddingLeft:14,marginBottom:18}}><Label>YAZIO → Apple Health → FORM</Label><Muted>FORM liest freigegebene Nährstoffwerte. Welche Daten YAZIO liefert, bestimmen YAZIO und deine Berechtigungen.</Muted></View>
  <View style={{flexDirection:'row',flexWrap:'wrap'}}><Chip text="Apple Health" active={pane==='health'} onPress={()=>setPane('health')}/><Chip text="Eigene Einträge" active={pane==='manual'} onPress={()=>setPane('manual')}/></View>
  <DateField label="Zeitraum bis einschließlich" value={date} maximumDate={new Date()} onChangeText={setDate}/>
  <View style={{flexDirection:'row',flexWrap:'wrap'}}>{([1,7,30,90] as const).map(days=><Chip key={days} text={days===1?'Tag':`${days} Tage`} active={period===days} onPress={()=>setPeriod(days)}/>)}</View>
  {pane==='health'?<>
   {!bridge?<Card><Label>In diesem Build nicht verfügbar</Label><Muted>Dieser Build hat keinen aktiven HealthKit-Zugriff. Vorhandene Daten bleiben lesbar. Du kannst deine Werte manuell pflegen.</Muted><View style={{marginTop:12}}><Button secondary title="Manuell eintragen" onPress={()=>{setPane('manual');beginManual();}}/></View></Card>:<View style={{gap:9,marginVertical:12}}>{state?.authorizationRequested?<Button title={busy?'Apple Health wird abgefragt …':'Jetzt aktualisieren'} disabled={busy||saving} onPress={()=>void read()}/>:<Button title="Apple Health verbinden" disabled={busy} onPress={()=>setSetup(true)}/>}<Button secondary title="Verbindung verwalten" disabled={connecting} onPress={()=>{setTypes(state?.requestedMetrics||manualMetrics.slice());setSetup(v=>!v);}}/></View>}
   {busy&&!connecting&&<View accessibilityLiveRegion="polite" style={{gap:10,marginVertical:12}}><Muted>{view.phase==='waiting'?'Aktualisierung wird vorbereitet …':`${view.completedChunks}/${view.totalChunks} Zeitabschnitte bestätigt. Höchstens sieben Kalendertage je Abfrage.`}</Muted><Button small secondary title="Abfrage abbrechen" onPress={()=>coordinator.cancel()}/></View>}
   {setup&&bridge&&<Card><Label>Verbindung einrichten</Label><Muted>1. In YAZIO: Profil → Automatische Erfassung → Apple Health. Gewünschte Schreibrechte aktivieren.</Muted><Muted>2. Hier Datentypen auswählen und den iOS-Dialog öffnen.</Muted><View style={{flexDirection:'row',flexWrap:'wrap',marginVertical:12}}>{nutritionMetrics.map(metric=><Chip key={metric} text={nutritionLabels[metric].label} active={types.includes(metric)} onPress={()=>setTypes(v=>v.includes(metric)?v.filter(x=>x!==metric):[...v,metric])}/>)}</View><Button title="Ausgewählte Leserechte anfragen" disabled={busy||!types.length} onPress={()=>void read(true)}/><Muted style={{marginTop:12}}>Rechte verwaltest du in iOS unter Einstellungen → Apps → Health → Datenzugriff → FORM. Ein abgeschlossener Dialog bestätigt keine konkreten Leserechte.</Muted>{state?.authorizationRequested&&<><View style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:54}}><Text style={{flex:1,color:color.ink}}>Beim Öffnen aktualisieren</Text><Switch value={state.syncPreferences?.onOpen!==false} onValueChange={value=>{changeSync('onOpen',value);}}/></View><View style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:54}}><Text style={{flex:1,color:color.ink}}>Auch bei Rückkehr zu FORM</Text><Switch value={state.syncPreferences?.onForeground===true} onValueChange={value=>{changeSync('onForeground',value);}}/></View><Muted>Automatische Abfragen werden gebündelt und frühestens nach fünf Minuten wiederholt. Kein permanentes Polling; manuelles Aktualisieren ist unabhängig davon möglich.</Muted><View style={{marginTop:10}}><Button secondary title="Weitere Abfragen in FORM pausieren" onPress={()=>void pauseSync()}/></View><Muted>Gespeicherte Werte bleiben erhalten. iOS-Rechte widerrufst du in Health.</Muted></>}</Card>}
   {(view.phase==='failed'?view.message:message||view.message)?<Text accessibilityLiveRegion="polite" style={{color:color.ink,lineHeight:21,marginVertical:12}}>{view.phase==='failed'?view.message:message||view.message}</Text>:null}
   {state?.lastSync?<Muted>Letzte bestätigte lokale Abfrage: {new Date(state.lastSync.queriedAt).toLocaleString('de-AT')} · {state.lastSync.timeZone}. Letzter Abschnitt: {new Date(state.lastSync.from).toLocaleDateString('de-AT')} bis {new Date(Date.parse(state.lastSync.to)-1).toLocaleDateString('de-AT')}.</Muted>:<Muted>Noch keine lokal bestätigte HealthKit-Abfrage.</Muted>}
   {state?.lastAttempt?.status==='running'&&!busy&&<Muted>Die letzte Abfrage wurde unterbrochen. Bereits bestätigte Abschnitte sind erhalten; du kannst erneut aktualisieren.</Muted>}
   {state?.lastAttempt?.status==='failed'&&!busy&&<Muted>Letzter Versuch: {state.lastAttempt.message||'nicht vollständig abgeschlossen'}. Die Anzeige enthält den letzten bestätigten Stand.</Muted>}
   {confirmedEvent&&<MotionCue variant="syncTick" eventKey={view.id!} confirmed mark color={color.blue}/>}
   {confirmedEvent&&view.samplesRead>0&&(connectionEvent?<><Doodle name="connection" size={40}/><MotionCue variant="connectionSketch" eventKey={view.id!} confirmed mark color={color.blue}/><SketchEvent event="connectionConfirmed" eventId={view.id!} confirmed compact/></>:<SketchEvent event="syncSaved" eventId={view.id!} confirmed compact/>)}
   {confirmedEvent&&view.samplesRead===0&&<SketchEvent event="noMeasurements" eventId={view.id!} compact/>}
   {sources.length>0&&<View style={{marginTop:18}}><Label>Eine Datenquelle für diese Ansicht</Label><Muted>Verschiedene Apps werden nicht automatisch zusammengerechnet.</Muted>{sources.map(source=><Pressable key={source.bundleIdentifier} accessibilityRole="radio" accessibilityState={{checked:sourceBundle===source.bundleIdentifier}} accessibilityLabel={`${source.name} auswählen`} onPress={()=>void update(d=>({...d,healthNutrition:{...(d.healthNutrition||newHealthNutrition()),selectedSourceBundle:source.bundleIdentifier}}))} style={{minHeight:50,borderBottomWidth:1,borderColor:color.line,paddingVertical:10}}><Text style={{color:sourceBundle===source.bundleIdentifier?color.blue:color.ink,fontSize:17,fontWeight:'600'}}>{sourceBundle===source.bundleIdentifier?'✓ ':''}{source.name}</Text><Muted>{source.bundleIdentifier}</Muted></Pressable>)}</View>}
   {sources.length>1&&!sourceBundle?<Card><Muted>Wähle eine Quelle. So zählt dieselbe Mahlzeit nicht durch mehrere Anbieter doppelt.</Muted></Card>:visibleDays.map(renderDay)}
   <Muted style={{marginTop:14}}>Abgefragte Typen bedeuten nicht, dass alle Mahlzeiten erfasst wurden. Fehlende Werte bleiben unbekannt; echte Null bleibt 0. Tagesgrenzen folgen der Gerätezeitzone.</Muted>
   <View style={{marginTop:14,gap:10}}><Button secondary title="Eigene FORM-Ziele · optional" onPress={openGoals}/>{Object.entries(state?.formGoals||{}).filter(([metric])=>nutritionMetrics.includes(metric as NutritionMetric)).map(([metric,value])=><Muted key={metric}>FORM-Ziel {nutritionLabels[metric as NutritionMetric].label}: {value} {nutritionLabels[metric as NutritionMetric].unit} pro Tag</Muted>)}<Muted>Diese Ziele sind selbst eingegeben und werden nicht aus YAZIO übernommen. Keine automatische Empfehlung.</Muted><Button secondary title="Offizielle YAZIO-Verbindungsanleitung ↗" onPress={()=>void Linking.openURL(HELP).catch(()=>Alert.alert('Link nicht geöffnet','Bitte die YAZIO-Hilfe im Browser öffnen.'))}/></View>
  </>:<>
   <Muted>Vorhandene und manuelle Einträge bleiben getrennt von Apple Health. Sie werden nicht zusätzlich auf importierte Tageswerte addiert.</Muted><View style={{marginTop:12}}><Button title="+ Ernährungswerte eintragen" onPress={()=>beginManual()}/></View><Section title="Eigene Einträge · aktuelle Seite"/>
   {visibleManual.length?visibleManual.map(entry=><View key={entry.id} style={{paddingVertical:14,borderBottomWidth:1,borderColor:color.line}}><Label>{entry.date}</Label><Muted>Quelle: {entry.source||'Manuell'}</Muted><Text style={{color:color.ink,fontSize:17,lineHeight:25}}>{manualMetrics.filter(m=>entry[m]!==undefined).map(m=>`${nutritionLabels[m].label}: ${formatValue(entry[m])} ${nutritionLabels[m].unit}`).join(' · ')}</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:10}}><Button small secondary title="Bearbeiten" onPress={()=>beginManual(entry)}/><Button small secondary danger title="Löschen" onPress={()=>Alert.alert('Eintrag löschen?',`${entry.date} · ${entry.source||'Manuell'}`,[{text:'Abbrechen',style:'cancel'},{text:'Löschen',style:'destructive',onPress:()=>void update(d=>({...d,nutrition:d.nutrition.filter(n=>n.id!==entry.id)}))}])}/></View></View>):<Muted style={{marginVertical:16}}>Auf dieser Seite sind keine eigenen Ernährungswerte gespeichert.</Muted>}
   <Section title="Wasser manuell"/><Doodle name="waterGlass" size={32}/><Field label={`Wasser am ${date} in ml`} value={water} onChangeText={setWater} keyboardType="number-pad"/><Button secondary title="Wassermenge speichern" disabled={saving||!water.trim()} onPress={()=>void saveWater()}/>
   {(data.healthEntries||[]).filter(e=>e.metric==='waterMl'&&visibleDays.includes(e.date)).map(entry=><View key={entry.id} style={{paddingVertical:12,borderBottomWidth:1,borderColor:color.line}}><Text style={{color:color.ink}}>{entry.date} · {entry.value} ml · {entry.note||'Manuell'}</Text><Button secondary small danger title="Wassereintrag löschen" onPress={()=>Alert.alert('Wassereintrag löschen?',`${entry.value} ml`,[{text:'Abbrechen',style:'cancel'},{text:'Löschen',style:'destructive',onPress:()=>void update(d=>({...d,healthEntries:(d.healthEntries||[]).filter(e=>e.id!==entry.id)}))}])}/></View>)}
  </>}
  {days.length>7&&<View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:10,marginVertical:18}}><Button secondary small title="‹ Neuere Tage" disabled={page===0} onPress={()=>setPage(value=>value-1)}/><Muted>Seite {page+1} / {Math.ceil(days.length/7)}</Muted><Button secondary small title="Ältere Tage ›" disabled={(page+1)*7>=days.length} onPress={()=>setPage(value=>value+1)}/></View>}
  <Overlay visible={editing!==null} title={isNew?'Ernährungswerte erfassen':'Eintrag bearbeiten'} onClose={()=>setEditing(null)}><DateField label="Datum" value={entryDate} maximumDate={new Date()} onChangeText={setEntryDate}/>{manualMetrics.map(metric=><Field key={metric} label={`${nutritionLabels[metric].label} (${nutritionLabels[metric].unit}) · optional`} value={fields[metric]} onChangeText={value=>setFields(f=>({...f,[metric]:value}))} keyboardType="decimal-pad"/>)}<Button title={saving?'Speichert …':'Eintrag speichern'} disabled={saving} onPress={()=>void saveManual()}/></Overlay>
  <Overlay visible={goalsOpen} title="Eigene FORM-Ziele" onClose={()=>setGoalsOpen(false)}><Muted>Optional und unabhängig von YAZIO. Ein leeres Feld entfernt dein bisheriges FORM-Ziel.</Muted>{nutritionMetrics.map(metric=><Field key={metric} label={`${nutritionLabels[metric].label} pro Tag (${nutritionLabels[metric].unit})`} value={goalFields[metric]||''} onChangeText={value=>setGoalFields(fields=>({...fields,[metric]:value}))} keyboardType="decimal-pad"/>)}<Button title="FORM-Ziele speichern" disabled={saving} onPress={()=>void saveGoals()}/></Overlay>
 </View>;
}
