import React,{useMemo,useRef,useState} from 'react';
import {View,Text,Alert} from 'react-native';
import {useAthlete} from '../data/context';
import {Button,Chip,Field,Muted,Card,Label,Section,usePalette} from '../components/Design';
import {NotebookHeader} from '../components/Sketchbook';
import {MotionCue} from '../components/MotionCue';
import {SketchEvent} from '../components/Personality';
import {DateField} from '../components/DateField';
import {dateKey,validateDate} from '../utils/metrics';
import {pickerDate} from '../utils/nativePreferences';
import {healthDailyMetrics,healthDaySources,healthDayValues,healthSourceLabel,mergeHealthDayValues,validateHealthDaySnapshot} from '../utils/healthImport';
import {healthSpecs} from '../utils/health';
import {healthBridge,sendHealthExport,deleteHealthExport} from '../utils/healthBridge';
import {confirmHealthExport,prepareHealthExport,prepareHealthDelete,confirmHealthDelete} from '../utils/nutritionSync';
import type {HealthExportRequest,HealthExportRecord} from '../utils/nutritionTypes';
import type {HealthDailyMetric,HealthDaySnapshot} from '../utils/healthDayTypes';
const metricSpec=(metric:HealthDailyMetric)=>metric==='weight'?{label:'Gewicht',unit:'kg'}:metric==='sleepHours'?{label:'Schlaf im Kalendertag',unit:'h'}:healthSpecs[metric];

export function AppleHealth(){
 const color=usePalette(),{confirmedData,update,saving}=useAthlete(),bridge=useMemo(healthBridge,[]);
 const [date,setDate]=useState(dateKey()),[snapshot,setSnapshot]=useState<HealthDaySnapshot|null>(null),[sources,setSources]=useState<Partial<Record<HealthDailyMetric,string>>>({}),[selection,setSelection]=useState<HealthDailyMetric[]>([]);
 const [busy,setBusy]=useState(false),busyRef=useRef(false),[message,setMessage]=useState(''),[loadedDate,setLoadedDate]=useState(''),[savedImport,setSavedImport]=useState('');
 const [pane,setPane]=useState<'read'|'export'>('read'),[kind,setKind]=useState<'weight'|'workout'>('weight'),[selectedId,setSelectedId]=useState(''),[weightTime,setWeightTime]=useState(''),[exportLimit,setExportLimit]=useState(20);
 const weights=(confirmedData?.weights||[]).filter(w=>w.date===date&&!w.id.startsWith('apple-health:')&&!w.healthOrigin);
 const workouts=(confirmedData?.workouts||[]).filter(w=>dateKey(new Date(w.finishedAt))===date),exports=confirmedData?.healthNutrition?.exports||[];
 const rows=useMemo(()=>snapshot?healthDayValues(snapshot,sources):[],[snapshot,sources]);
 const read=async()=>{
  if(!bridge||busyRef.current||!validateDate(date)||date>dateKey())return;
  busyRef.current=true;setBusy(true);setSnapshot(null);setSources({});setSelection([]);setLoadedDate('');setMessage('');
  try{
   if(!await bridge.authorize())throw Error('Berechtigungsdialog nicht abgeschlossen.');
   if(typeof bridge.readDaySources!=='function')throw Error('Dieser installierte Build unterstützt die Herkunftsanzeige noch nicht. Aktualisiere FORM oder verwende die manuelle Erfassung.');
   const from=pickerDate(date);from.setHours(0,0,0,0);const to=new Date(from);to.setDate(to.getDate()+1);
   const result=validateHealthDaySnapshot(await bridge.readDaySources(from.getTime(),to.getTime()));
   if(Date.parse(result.from)!==from.getTime()||Date.parse(result.to)!==to.getTime())throw Error('Die Health-Antwort gehört nicht zum angefragten Kalendertag.');
   setSnapshot(result);setSelection(healthDayValues(result).map(x=>x.metric));setLoadedDate(date);
   setMessage(result.samples.length?`Wähle je Datentyp genau eine Quelle und die Werte zur Übernahme.${result.unavailable.length?' Einige Datentypen konnten nicht abgefragt werden.':''}`:'Keine lesbaren Werte. Apple unterscheidet hier nicht zwischen verweigerten Leserechten und fehlenden Daten.');
  }catch(e){setMessage((e as Error).message||String(e));}finally{busyRef.current=false;setBusy(false);}
 };
 const importSelected=async()=>{
  if(date!==loadedDate||saving||busyRef.current||!snapshot)return;busyRef.current=true;setBusy(true);
  try{const values=rows.filter(r=>selection.includes(r.metric));if(!values.length)return;
   if(await update(d=>mergeHealthDayValues(d,date,values))){setSavedImport(snapshot.queriedAt);setMessage('Ausgewählte Werte und ihre Herkunft sind gespeichert. Manuelle Messungen bleiben erhalten.');}
   else setMessage('Die Übernahme ist noch nicht bestätigt. Deine Auswahl bleibt für einen erneuten Versuch erhalten.');
  }catch(e){setMessage((e as Error).message||String(e));}finally{busyRef.current=false;setBusy(false);}
 };
 const exportSelected=async(request:HealthExportRequest)=>{
  if(!bridge||busyRef.current)return;busyRef.current=true;setBusy(true);setMessage('');
  try{
   let pending:HealthExportRecord|undefined;
   const saved=await update(d=>{const prepared=prepareHealthExport(d.healthNutrition,request,new Date().toISOString());pending=prepared.record;return {...d,healthNutrition:prepared.state};});
   if(!saved||!pending)throw Error('Der Exportauftrag konnte nicht lokal gesichert werden. Es wurden keine Daten an Apple Health geschrieben.');
   const receipt=await sendHealthExport(bridge,pending),id=pending.id;
   const confirmed=await update(d=>{if(!d.healthNutrition)throw Error('Lokaler Exportauftrag fehlt.');return {...d,healthNutrition:confirmHealthExport(d.healthNutrition,id,receipt,new Date().toISOString())};});
   setMessage(confirmed?'Apple Health hat den Eintrag bestätigt. Die Bestätigung ist lokal gespeichert. Ob YAZIO ihn übernimmt, wird von YAZIO bestimmt.':'Apple Health hat den Eintrag gespeichert. Die lokale Bestätigung fehlt noch: Speichern erneut versuchen. Ein erneuter Export verwendet dieselbe Identität.');
  }catch(e){setMessage((e as Error).message||String(e));}finally{busyRef.current=false;setBusy(false);}
 };
 const deleteExport=async(id:string)=>{
  if(!bridge||busyRef.current)return;busyRef.current=true;setBusy(true);setMessage('');
  try{
   let pending:HealthExportRecord|undefined;
   const saved=await update(d=>{const prepared=prepareHealthDelete(d.healthNutrition,id,new Date().toISOString());pending=prepared.record;return {...d,healthNutrition:prepared.state};});
   if(!saved||!pending)throw Error('Der Löschauftrag konnte nicht lokal gesichert werden. Apple Health wurde nicht verändert.');
   if(pending.status==='deleted'){setMessage('Dieser FORM-Export ist bereits als gelöscht bestätigt.');return;}
   const receipt=await deleteHealthExport(bridge,pending);
   const confirmed=await update(d=>{if(!d.healthNutrition)throw Error('Lokaler Löschauftrag fehlt.');return {...d,healthNutrition:confirmHealthDelete(d.healthNutrition,id,receipt,new Date().toISOString())};});
   setMessage(confirmed?(receipt.alreadyAbsent?'Apple Health enthält diesen FORM-Export nicht mehr. Die Bestätigung ist gespeichert.':'Der eigene FORM-Export wurde in Apple Health gelöscht. Der Eintrag in FORM bleibt erhalten.'):'Apple Health hat die Löschung bestätigt; die lokale Bestätigung steht noch aus. Speichern erneut versuchen. Der Löschauftrag kann sicher wiederholt werden.');
  }catch(e){setMessage((e as Error).message||String(e));}finally{busyRef.current=false;setBusy(false);}
 };
 const confirmSelected=()=>{
  let request:HealthExportRequest;
  if(kind==='weight'){
   const entry=weights.find(w=>w.id===selectedId);if(!entry)return Alert.alert('Gewicht auswählen');
   if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(weightTime))return Alert.alert('Messzeit ergänzen','Der vorhandene Gewichtseintrag enthält nur ein Datum. Gib die Uhrzeit für den Health-Export als HH:MM ein.');
   const at=new Date(`${entry.date}T${weightTime}:00`);if(!Number.isFinite(at.getTime())||at.getTime()>Date.now())return Alert.alert('Uhrzeit prüfen','Die Messzeit muss bereits vergangen sein.');
   request={kind:'weight',entryId:entry.id,kg:entry.kg,at:at.toISOString()};
  }else{
   const entry=workouts.find(w=>w.id===selectedId);if(!entry)return Alert.alert('Abgeschlossenes Training auswählen');
   const durationSeconds=((Date.parse(entry.finishedAt)-Date.parse(entry.startedAt))-(entry.pausedMs||0))/1000;
   if(durationSeconds<=0)return Alert.alert('Dauer prüfen','Dieses Training besitzt keine positive aktive Dauer und kann so nicht exportiert werden.');
   request={kind:'workout',entryId:entry.id,startedAt:entry.startedAt,finishedAt:entry.finishedAt,durationSeconds};
  }
  const previous=exports.find(e=>e.id===`${request.kind}:${request.entryId}`);
  if(previous?.status==='deletePending')return Alert.alert('Löschauftrag offen','Schließe zuerst den gesicherten Löschauftrag in der Exportliste ab.');
  Alert.alert(previous?'Eigenen Health-Eintrag abgleichen?':'An Apple Health senden?',`${kind==='weight'?'Nur das ausgewählte Gewicht':'Nur das ausgewählte abgeschlossene Krafttraining ohne geschätzte Kalorien'} wird übertragen.${previous?' Geänderte Werte ersetzen nur den vorherigen FORM-Export dieses Eintrags. Ein bereits gelöschter Export wird als neue Version angelegt.':''}`,[{text:'Abbrechen',style:'cancel'},{text:'Übertragen',onPress:()=>void exportSelected(request)}]);
 };
 return <View>
  <NotebookHeader eyebrow="GESUNDHEIT / VERBINDUNG" title="Apple Health" subtitle="Ausgewählte Daten lesen oder bewusst übertragen." doodle="heart"/>
  {!bridge?<Card><Muted>Dieser Build bzw. dieses Gerät unterstützt die HealthKit-Anbindung nicht. Gewicht, Ernährung und Training bleiben manuell nutzbar. Die optionale Verbindung benötigt einen Build mit passender HealthKit-Signierung.</Muted></Card>:<>
   <View style={{flexDirection:'row',flexWrap:'wrap'}}><Chip text="Tageswerte lesen" active={pane==='read'} onPress={()=>setPane('read')}/><Chip text="Ausgewählt exportieren" active={pane==='export'} onPress={()=>setPane('export')}/></View>
   <DateField label="Datum" value={date} maximumDate={new Date()} onChangeText={value=>{setDate(value);setSnapshot(null);setSelection([]);setSources({});setLoadedDate('');setSelectedId('');setSavedImport('');}}/>
   {pane==='read'?<>
    <Button title={busy?'Werte werden gelesen …':'Leserechte anfragen & Tageswerte lesen'} disabled={busy||saving} onPress={()=>void read()}/>
    {snapshot&&<Muted>Abfrage: {new Date(snapshot.queriedAt).toLocaleString('de-AT')} · {snapshot.timeZone}. Daten für {loadedDate}.</Muted>}
    {snapshot&&healthDailyMetrics.map(metric=>{const options=healthDaySources(snapshot,metric),row=rows.find(r=>r.metric===metric),spec=metricSpec(metric);return <View key={metric} style={{borderBottomWidth:1,borderColor:color.line,paddingVertical:14,gap:7}}>
     <Label>{spec.label}</Label>
     {!options.length?<Muted>{snapshot.unavailable.includes(metric)?'Abfrage nicht verfügbar.':'Keine lesbaren Samples; kein Nullwert.'}</Muted>:<>
      <Muted>{options.length>1?'Mehrere Quellen: Wähle eine. Ihre Werte werden nicht addiert.':'Tatsächlich gelesene Quelle:'}</Muted>
      <View style={{flexDirection:'row',flexWrap:'wrap'}}>{options.map(option=><Chip key={option.key} text={`${healthSourceLabel(option.source)} · ${option.sampleCount}`} active={(sources[metric]||options.length===1&&options[0].key)===option.key} onPress={()=>{setSources(s=>({...s,[metric]:option.key}));setSelection(s=>s.includes(metric)?s:[...s,metric]);}}/>)}</View>
      {row?<><Text style={{fontSize:20,color:color.ink}}>{row.value} {spec.unit}</Text><Muted>{row.origin.source.bundleIdentifier}{row.origin.source.version?` · Version ${row.origin.source.version}`:''} · {row.origin.sampleUUIDs.length} Samples</Muted><Chip text={selection.includes(metric)?'Ausgewählt':'Nicht ausgewählt'} active={selection.includes(metric)} onPress={()=>setSelection(s=>s.includes(metric)?s.filter(m=>m!==metric):[...s,metric])}/></>:<Muted>Für diese Auswahl ist noch kein gültiger Tageswert verfügbar.</Muted>}
     </>}
    </View>;})}
    {!!rows.length&&<Button title="Ausgewählte Werte übernehmen" disabled={saving||busy||!selection.length||date!==loadedDate} onPress={()=>void importSelected()}/>}
    {!!savedImport&&<><MotionCue variant="syncTick" eventKey={`health:${savedImport}`} confirmed mark color={color.blue}/><SketchEvent event="syncSaved" eventId={`health:${savedImport}`} confirmed compact/></>}
    <Muted style={{marginTop:14}}>Schlafintervalle derselben Quelle werden im Kalendertag zusammengeführt. Puls ist der Mittelwert der gelesenen Messungen, Gewicht die letzte Messung. Schritte, Distanz und Energie stammen jeweils nur aus der gewählten Quelle. Wiederholte Übernahme ersetzt nur den Apple-Health-Tageswert. Eigene exportierte Gewichte werden nicht erneut importiert. Nährstoffe findest du unter Ernährung.</Muted>
   </>:<>
    <Muted>Jeder Export braucht deinen gewählten Eintrag und Schreibzugriff. Es gibt keine automatische Rückübertragung. In FORM korrigierte Einträge kannst du bewusst erneut senden. Löschen in FORM löscht einen früheren Export nicht automatisch; dafür bleibt die Liste unten erreichbar.</Muted>
    <View style={{flexDirection:'row',flexWrap:'wrap',marginTop:14}}><Chip text="Gewicht" active={kind==='weight'} onPress={()=>{setKind('weight');setSelectedId('');}}/><Chip text="Training" active={kind==='workout'} onPress={()=>{setKind('workout');setSelectedId('');}}/></View>
    <Section title="Eintrag auswählen"/>
    {kind==='weight'?<>{weights.length?weights.map(entry=><Chip key={entry.id} text={`${entry.kg} kg${entry.note?` · ${entry.note}`:''}`} active={selectedId===entry.id} onPress={()=>setSelectedId(entry.id)}/>):<Muted>Keine gespeicherten manuellen Gewichte an diesem Tag. Aus Health importierte Gewichte werden nicht zurückgeschrieben.</Muted>}<Field label="Messzeit für den Export (HH:MM)" placeholder="Uhrzeit des Gewichts" value={weightTime} onChangeText={setWeightTime} keyboardType="numbers-and-punctuation"/></>:workouts.length?workouts.map(entry=><Chip key={entry.id} text={`${entry.name} · ${new Date(entry.startedAt).toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'})}`} active={selectedId===entry.id} onPress={()=>setSelectedId(entry.id)}/>):<Muted>Kein gespeichertes abgeschlossenes Training an diesem Tag.</Muted>}
    <Button title={busy?'Übertragung läuft …':'Ausgewählten Eintrag übertragen'} disabled={busy||saving||!selectedId} onPress={confirmSelected}/>
    <Section title="Bisherige FORM-Exporte"/>
    {exports.length?exports.slice().reverse().slice(0,exportLimit).map(entry=><View key={entry.id} style={{paddingVertical:12,borderBottomWidth:1,borderColor:color.line,gap:6}}>
     <Label>{entry.request.kind==='weight'?'Gewicht':'Training'} · Version {entry.syncVersion}</Label>
     <Muted>{new Date(entry.request.kind==='weight'?entry.request.at:entry.request.startedAt).toLocaleString('de-AT')}</Muted>
     <Muted>{entry.status==='deleted'?`Löschung bestätigt: ${new Date(entry.deletedAt!).toLocaleString('de-AT')}`:entry.status==='deletePending'?'Eigener Löschauftrag gesichert; Bestätigung steht aus.':entry.status==='confirmed'?`Von Apple Health bestätigt: ${new Date(entry.confirmedAt!).toLocaleString('de-AT')}`:'Exportauftrag gesichert; Bestätigung steht aus.'}</Muted>
     {entry.status==='pending'&&<Button small secondary title="Diesen Export erneut versuchen" disabled={busy||saving} onPress={()=>Alert.alert('Gesicherten Auftrag erneut senden?','Es wird der bereits gesicherte Inhalt mit derselben Exportidentität abgeglichen.',[{text:'Abbrechen',style:'cancel'},{text:'Erneut senden',onPress:()=>void exportSelected(entry.request)}])}/>}
     {entry.status!=='deleted'&&<Button small secondary title={entry.status==='deletePending'?'Löschung erneut versuchen':'Eigenen Export aus Health löschen'} disabled={busy||saving} onPress={()=>Alert.alert('Eigenen FORM-Export löschen?','Nur die von FORM mit dieser Exportidentität geschriebenen Samples werden in Apple Health entfernt. Fremde Quellen und dein lokaler Eintrag bleiben erhalten.',[{text:'Abbrechen',style:'cancel'},{text:'Export löschen',style:'destructive',onPress:()=>void deleteExport(entry.id)}])}/>}
    </View>):<Muted>Noch kein Exportauftrag.</Muted>}
    {exports.length>exportLimit&&<Button secondary title="Ältere Exporte anzeigen" onPress={()=>setExportLimit(n=>n+20)}/>}
   </>}
   {message?<Text accessibilityLiveRegion="polite" style={{color:color.ink,lineHeight:22,marginVertical:16}}>{message}</Text>:null}
   <Muted style={{marginTop:14}}>Zugriff verwalten: iOS-Einstellungen → Apps → Health → Datenzugriff → FORM. Der Abschluss eines Lesedialogs bestätigt keine konkreten Leserechte. Eine leere Abfrage kann auch durch fehlende Daten entstehen.</Muted>
  </>}
 </View>;
}
