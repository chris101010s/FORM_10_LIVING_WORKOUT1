import {ProgressionPanel} from '../components/ProgressionPanel';
import {routinePositions} from '../utils/plannedTargets';
import {describeSet} from '../utils/trainingEngine';
import type {LoadBasis} from '../features/workout/secondPassTypes';
import {NotebookHeader,InkRule,MarkerSwipe} from '../components/Sketchbook';
import {availablePerformanceMetrics,performanceLoadBases,exerciseSeries,performanceExerciseIds,performanceMetricLabels,PerformanceMetric} from '../utils/progress15';
import {DateField} from '../components/DateField';
import React,{useMemo,useState} from 'react';
import {View,Text,Alert,ScrollView,Pressable,FlatList} from 'react-native';
import {useAthlete} from '../data/context';
import type {AthleteGoalMetric,MeasurementType,Workout} from '../data/schema';
import {dateKey,numberInput,validateDate} from '../utils/metrics';
import {balanceSummary,goalProgress,measurementLabel,measurementsFor,personalRecords,exerciseHistory,weeklyTrainingMinutes} from '../utils/advanced';
import {Title,Card,Section,Button,Field,Label,Muted,Chip,Metric,Empty,color,usePalette,surfaceTint} from '../components/Design';
import {TrendChart} from '../components/TrendChart';
import {Overlay} from '../components/Overlay';
import {starterCatalog} from '../catalog/catalog';
const uid=()=>`${Date.now()}_${Math.random().toString(36).slice(2,11)}`;
const goalTitles:Record<AthleteGoalMetric,string>={pushups:'Liegestütze',pullups:'Klimmzüge',plank:'Plank',workouts:'Gym-Einheiten pro Woche',weight:'Körpergewicht',run5k:'5-km-Lauf',lift:'Kraftleistung einer Übung'};
const goalUnits:Record<AthleteGoalMetric,string>={pushups:'Wiederholungen',pullups:'Wiederholungen',plank:'Sekunden',workouts:'Einheiten',weight:'kg',run5k:'Minuten',lift:'kg'};
const muscles=['waist','chest','hips','upperArm','thigh','neck'] as MeasurementType[];
export function PerformanceHub({initialPane='goals',isolated=true}:{initialPane?:'goals'|'measure'|'records';isolated?:boolean}={}){const color=usePalette();
 const {data,update,saving}=useAthlete();
 const [pane,setPane]=useState<'goals'|'measure'|'records'>(initialPane);
 const [showGoal,setShowGoal]=useState(false),[showMeasure,setShowMeasure]=useState(false);
 const [metric,setMetric]=useState<AthleteGoalMetric>('pushups'),[target,setTarget]=useState(''),[exerciseId,setExerciseId]=useState('');
 const [measurementType,setMeasurementType]=useState<MeasurementType>('waist'),[cm,setCm]=useState(''),[date,setDate]=useState(dateKey()),[note,setNote]=useState('');
 const [tracked,setTracked]=useState('');
 const records=useMemo(()=>personalRecords(data),[data.workouts]);
 const recent=balanceSummary(data);const selectedId=tracked||records[0]?.exerciseId||'';
 const selected=exerciseHistory(data.workouts,selectedId);
 const exName=(id:string)=>data.exercises.find(x=>x.id===id)?.name||starterCatalog.find(x=>x.id===id)?.name||id.replace(/^fedb:/,'').replace(/_/g,' ');
 const addGoal=async()=>{const value=numberInput(target);if(value===null||value<=0||value>100000||metric==='workouts'&&(!Number.isInteger(value)||value>14)||metric==='lift'&&!exerciseId.trim())return Alert.alert('Ziel prüfen','Bitte einen gültigen Zielwert eingeben. Für ein Kraftziel benötigst du eine Übungs-ID aus deinen bisherigen Trainings.');
  const ok=await update(d=>({...d,goals:[...d.goals,{id:uid(),metric,target:value,...(metric==='lift'?{exerciseId:exerciseId.trim(),label:exName(exerciseId.trim())}:{})}]}));if(ok){setTarget('');setShowGoal(false);}
 };
 const addMeasurement=async()=>{const value=numberInput(cm);if(value===null||value<=1||value>350||!validateDate(date)||date>dateKey())return Alert.alert('Messung prüfen','Bitte einen Wert zwischen 1 und 350 cm und ein gültiges Datum eingeben.');
  const ok=await update(d=>({...d,measurements:[...d.measurements,{id:uid(),date,metric:measurementType,cm:value,note:note.trim()}]}));if(ok){setCm('');setNote('');setShowMeasure(false);}
 };
 const m=measurementsFor(data,measurementType),last=m[m.length-1];
 return <View>
  <NotebookHeader eyebrow={pane==='goals'?'DEINE EIGENEN ZIELE':pane==='measure'?'KÖRPERNOTIZEN':'DEIN LEISTUNGSVERLAUF'} title={pane==='goals'?'Was du dir vornimmst.':pane==='measure'?'Deine Maße.':'Satz für Satz.'} doodle={pane==='goals'?'star':pane==='measure'?'notebook':'dumbbell'}/>
  {!isolated&&<ScrollView horizontal showsHorizontalScrollIndicator={false}>{[['goals','Meine Ziele'],['measure','Körperumfänge'],['records','Übungsverlauf']].map(([id,label])=><Chip key={id} text={label} active={pane===id} onPress={()=>setPane(id as typeof pane)}/>)}</ScrollView>}
  {pane==='goals'?<>
   <Section title="Deine Leistungsziele" action={<Button title="+ Ziel" small onPress={()=>setShowGoal(true)}/>}/>
   {data.goals.length?data.goals.map(g=>{const prog=goalProgress(data,g);return <Card key={g.id} style={{marginBottom:9}}><View style={{flexDirection:'row',alignItems:'flex-start',gap:8}}><View style={{flex:1}}><Text style={{fontWeight:'800',fontSize:17,color:color.ink}}>{g.label||goalTitles[g.metric]}</Text><Text style={{fontSize:16,fontWeight:'800',marginTop:8,color:prog.reached?color.olive:color.blue}}>{prog.current===null?'Noch kein Ausgangswert':`${Number(prog.current.toFixed(1))} ${prog.unit}`} → {g.target} {prog.unit}</Text><Muted>{prog.reached?'Ziel erreicht. Du kannst dein nächstes Ziel setzen.':'Der Wert wird aus deinen eigenen Einträgen berechnet.'}</Muted></View><Pressable accessibilityRole="button" style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}} accessibilityLabel="Ziel löschen" onPress={()=>Alert.alert('Ziel löschen?',g.label||goalTitles[g.metric],[{text:'Abbrechen',style:'cancel'},{text:'Löschen',style:'destructive',onPress:()=>update(d=>({...d,goals:d.goals.filter(x=>x.id!==g.id)}))}])}><Text style={{color:color.error,fontSize:18}}>✕</Text></Pressable></View></Card>}):<Card><Empty title="Noch keine Ziele" text="Lege freiwillige Leistungsziele an. Kein Ziel und kein Körpergewicht wird automatisch gesetzt."/></Card>}
  </>:pane==='measure'?<>
   <Section title="Umfänge" action={<Button title="+ Messung" small onPress={()=>setShowMeasure(true)}/>}/>
   <ScrollView horizontal showsHorizontalScrollIndicator={false}>{muscles.map(x=><Chip key={x} text={measurementLabel[x]} active={measurementType===x} onPress={()=>setMeasurementType(x)}/>)}</ScrollView>
   <Card><Label>{measurementLabel[measurementType]} · cm</Label><Text style={{fontSize:28,color:color.ink,fontWeight:'800'}}>{last?last.cm.toFixed(1)+' cm':'–'}</Text><TrendChart points={m.map(x=>({date:x.date,value:x.cm}))} unit="cm" height={160}/><Muted>Mess immer an derselben Stelle und unter ähnlichen Bedingungen.</Muted></Card>
   <Section title="Messhistorie"/>{m.length?[...m].reverse().map(x=><Card key={x.id} style={{marginBottom:8}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View style={{flex:1}}><Text style={{fontWeight:'800',color:color.ink}}>{x.cm.toFixed(1)} cm</Text><Muted>{x.date} {x.note?'· '+x.note:''}</Muted></View><Button small secondary danger title="Löschen" onPress={()=>Alert.alert('Messung löschen?',`${x.cm} cm`,[{text:'Abbrechen',style:'cancel'},{text:'Löschen',style:'destructive',onPress:()=>update(d=>({...d,measurements:d.measurements.filter(v=>v.id!==x.id)}))}])}/></View></Card>):<Card><Empty title="Noch keine Messungen" text="Du bestimmst selbst, was du erfassen möchtest."/></Card>}
  </>:<>
   <PerformanceTrend/>
  </>}
  <Overlay title="Neues Leistungsziel" visible={showGoal} onClose={()=>setShowGoal(false)}>
   <Muted>Wähle ein messbares Ziel. Dein aktueller Wert wird aus deinen eigenen Log-Einträgen bestimmt.</Muted>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:14}}>{(Object.keys(goalTitles) as AthleteGoalMetric[]).map(g=><Chip key={g} text={goalTitles[g]} active={metric===g} onPress={()=>setMetric(g)}/>)}</ScrollView>
   {metric==='lift'?<><Muted>Wähle eine Übung aus deiner bisherigen Trainingshistorie.</Muted>{records.slice(0,30).map(r=><Chip key={r.exerciseId} text={exName(r.exerciseId)} active={exerciseId===r.exerciseId} onPress={()=>setExerciseId(r.exerciseId)}/>)}</>:null}
   <Field label={`Dein Ziel (${goalUnits[metric]})`} value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="Selbst festlegen"/>
   <Button title="Ziel anlegen" disabled={saving} onPress={()=>void addGoal()}/>
  </Overlay>
  <Overlay title="Körperumfang eintragen" visible={showMeasure} onClose={()=>setShowMeasure(false)}><View style={{flexDirection:'row',flexWrap:'wrap'}}>{muscles.map(x=><Chip key={x} text={measurementLabel[x]} active={measurementType===x} onPress={()=>setMeasurementType(x)}/>)}</View><DateField label="Datum (YYYY-MM-DD)" value={date} onChangeText={setDate}/><Field label={`${measurementLabel[measurementType]} in cm`} value={cm} onChangeText={setCm} keyboardType="decimal-pad"/><Field label="Notiz (optional)" value={note} onChangeText={setNote}/><Button title="Messung speichern" disabled={saving} onPress={()=>void addMeasurement()}/></Overlay>
 </View>
}


export function PerformanceTrend({compact=false,initialExerciseId}:{compact?:boolean;initialExerciseId?:string}){
 const c=usePalette(),{data}=useAthlete(),[tracked,setTracked]=useState(initialExerciseId??''),[basis,setBasis]=useState<LoadBasis|undefined>(),[side,setSide]=useState<'left'|'right'|undefined>(),[metric,setMetric]=useState<PerformanceMetric>('load'),[range,setRange]=useState(90),[limit,setLimit]=useState(12);
 const ids=useMemo(()=>performanceExerciseIds(data.workouts),[data.workouts]),selectedId=tracked||ids[0]||'';
 const metrics=useMemo(()=>availablePerformanceMetrics(data.workouts,selectedId),[data.workouts,selectedId]);
 const selectedMetric=metrics.includes(metric)?metric:metrics[0]??'load',spec=performanceMetricLabels[selectedMetric];
 const bases=performanceLoadBases(data.workouts,selectedId),selectedBasis=basis&&bases.includes(basis)?basis:bases[0]??'total';
 const hasSides=data.workouts.some(w=>w.sets.some(s=>s.exerciseId===selectedId&&(s.loadBasis??'total')===selectedBasis&&(s.unilateral||s.side==='left'||s.side==='right'))),selectedSide=hasSides&&(selectedMetric==='load'||selectedMetric==='reps')?side:undefined;
 const points=useMemo(()=>exerciseSeries(data.workouts,selectedId,selectedMetric,range,dateKey(),selectedBasis,selectedSide),[data.workouts,selectedId,selectedMetric,range,selectedBasis,selectedSide]),last=points[points.length-1];
 const name=(id:string)=>data.exercises.find(e=>e.id===id)?.name||starterCatalog.find(e=>e.id===id)?.name||id.replace(/^fedb:/,'').replace(/_/g,' ');
 const sessions=useMemo(()=>data.workouts.filter(w=>points.some(p=>p.sessionId===w.id)).slice().sort((a,b)=>Date.parse(b.finishedAt)-Date.parse(a.finishedAt)),[data.workouts,points]);
 if(!ids.length)return <View style={{paddingVertical:18,gap:8}}><Text style={{fontSize:22,color:c.ink,fontWeight:'700'}}>Dein erster Verlauf entsteht im Training.</Text><Muted>Nach einer gespeicherten Session erscheinen hier die tatsächlichen Werte deiner Übungen.</Muted></View>;
 return <View style={{gap:12}}>
 <Label>ÜBUNG WÄHLEN</Label><FlatList horizontal data={ids} keyExtractor={id=>id} showsHorizontalScrollIndicator={false} renderItem={({item:id})=><Chip text={name(id)} active={selectedId===id} onPress={()=>{setTracked(id);setBasis(undefined);setSide(undefined);setLimit(12)}}/>}/>
 <MarkerSwipe><Text style={{color:c.ink,fontSize:24,fontWeight:'800'}}>{name(selectedId)}</Text></MarkerSwipe>
 {bases.length>1&&<View style={{flexDirection:'row',flexWrap:'wrap'}}>{bases.map(value=><Chip key={value} text={value==='total'?'Gesamtlast':value==='perHand'?'Je Hand':'Je Seite'} active={selectedBasis===value} onPress={()=>setBasis(value)}/>)}</View>}<Muted>Lastbasis: {selectedBasis==='total'?'Gesamtlast':selectedBasis==='perHand'?'kg je Hand':'kg je Seite'}; unterschiedliche Lastbasen werden getrennt dargestellt.</Muted>
 <View style={{flexDirection:'row',flexWrap:'wrap'}}>{metrics.map(id=><Chip key={id} text={performanceMetricLabels[id].label} active={selectedMetric===id} onPress={()=>setMetric(id)}/>)}</View>
 {hasSides&&(selectedMetric==='load'||selectedMetric==='reps')&&<><View style={{flexDirection:'row',flexWrap:'wrap'}}><Chip text="Höchster Seitenwert" active={side===undefined} onPress={()=>setSide(undefined)}/><Chip text="Nur links" active={side==='left'} onPress={()=>setSide('left')}/><Chip text="Nur rechts" active={side==='right'} onPress={()=>setSide('right')}/></View><Muted>{side===undefined?'Pro Session wird der höchste einzelne Wert gezeigt; die Seiten werden nicht addiert.':`Die Kurve zeigt ausschließlich ${side==='left'?'linke':'rechte'} tatsächliche Werte.`} Beide Seiten bleiben unten einzeln dokumentiert.</Muted></>}
 <View style={{flexDirection:'row',flexWrap:'wrap'}}>{[[7,'7 Tage'],[30,'30 Tage'],[90,'90 Tage'],[180,'180 Tage'],[365,'1 Jahr'],[0,'Alle']].map(([n,label])=><Chip key={n} text={String(label)} active={range===n} onPress={()=>setRange(Number(n))}/>)}</View>
 {last&&<View><Text style={{color:c.ink,fontSize:32,fontWeight:'700',fontVariant:['tabular-nums']}}>{Number(last.value.toFixed(1))} <Text style={{fontSize:16}}>{spec.unit}</Text></Text><Muted>{spec.label} · zuletzt {last.date}</Muted></View>}
 <TrendChart points={points} unit={spec.unit} height={compact?190:230}/>
 <Muted>{points.length} protokollierte Sessions im Zeitraum. Auswertung nach stabiler Übungs-ID; Korrekturen im Archiv werden berücksichtigt.</Muted>
 {selectedMetric==='e1rm'&&<Muted>Schätzung aus geeigneten beidseitigen Gewichtssätzen bis 12 Wiederholungen. Keine Messung eines tatsächlichen Maximalversuchs.</Muted>}
 {selectedMetric==='volume'&&<Muted>Arbeitsvolumen ohne Warm-ups, Assistenz und Körpergewicht. Getrennte Seiten werden je einmal addiert; kg je Hand zählt zwei Hände, eine Gesamtlast nur einmal. Es beschreibt dokumentierte Arbeit, nicht allein deine Kraftentwicklung.</Muted>}
 {!compact&&data.routines.flatMap(r=>routinePositions(r).filter(pos=>pos.exerciseId===selectedId&&pos.enabled!==false).map(pos=><ProgressionPanel key={r.id+':'+pos.id} routine={r} position={pos}/>))}
 {!compact&&<><InkRule/><Section title="Sätze im ausgewählten Zeitraum"/>{sessions.slice(0,limit).map(w=>{const sets=w.sets.filter(s=>s.exerciseId===selectedId),planned=w.plannedRows?.filter(r=>r.exerciseId===selectedId&&!r.isExtraSet&&r.kind!=='warmup');return <View key={w.id} style={{borderBottomWidth:1,borderColor:c.line,paddingVertical:13,gap:5}}><Text style={{fontWeight:'700',fontSize:17,color:c.ink}}>{new Date(w.finishedAt).toLocaleDateString('de-AT')} · {w.name}</Text>{planned&&<Muted>{sets.filter(s=>s.plannedRowId&&planned.some(r=>r.id===s.plannedRowId)).length}/{planned.length} geplant · +{sets.filter(s=>s.isExtraSet&&s.kind!=='warmup').length} extra</Muted>}{sets.map((s,i)=><Text key={s.id} style={{color:c.ink,fontSize:14}}>{i+1}. {describeSet(s)}{s.isExtraSet?' · Extra':''}</Text>)}</View>})}{sessions.length>limit&&<Button secondary title="Weitere Sessions" onPress={()=>setLimit(n=>n+12)}/>}</>}
 </View>;
}
