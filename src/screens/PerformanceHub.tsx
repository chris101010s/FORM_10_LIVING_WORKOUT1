import {DateField} from '../components/DateField';
import React,{useMemo,useState} from 'react';
import {View,Text,Alert,ScrollView,Pressable} from 'react-native';
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
export function PerformanceHub({initialPane='goals'}:{initialPane?:'goals'|'measure'|'records'}={}){const color=usePalette();
 const {data,update}=useAthlete();
 const [pane,setPane]=useState<'goals'|'measure'|'records'>(initialPane);
 const [showGoal,setShowGoal]=useState(false),[showMeasure,setShowMeasure]=useState(false);
 const [metric,setMetric]=useState<AthleteGoalMetric>('pushups'),[target,setTarget]=useState(''),[exerciseId,setExerciseId]=useState('');
 const [measurementType,setMeasurementType]=useState<MeasurementType>('waist'),[cm,setCm]=useState(''),[date,setDate]=useState(dateKey()),[note,setNote]=useState('');
 const [tracked,setTracked]=useState('');
 const records=useMemo(()=>personalRecords(data),[data.workouts]);
 const recent=balanceSummary(data);const selectedId=tracked||records[0]?.exerciseId||'';
 const selected=exerciseHistory(data.workouts,selectedId);
 const exName=(id:string)=>data.exercises.find(x=>x.id===id)?.name||starterCatalog.find(x=>x.id===id)?.name||id.replace(/^fedb:/,'').replace(/_/g,' ');
 const addGoal=()=>{const value=numberInput(target);if(value===null||value<=0||value>100000||metric==='workouts'&&(!Number.isInteger(value)||value>14)||metric==='lift'&&!exerciseId.trim())return Alert.alert('Ziel prüfen','Bitte einen gültigen Zielwert eingeben. Für ein Kraftziel benötigst du eine Übungs-ID aus deinen bisherigen Trainings.');
  update(d=>({...d,goals:[...d.goals,{id:uid(),metric,target:value,...(metric==='lift'?{exerciseId:exerciseId.trim(),label:exName(exerciseId.trim())}:{})}]}));setTarget('');setShowGoal(false);
 };
 const addMeasurement=()=>{const value=numberInput(cm);if(value===null||value<=1||value>350||!validateDate(date)||date>dateKey())return Alert.alert('Messung prüfen','Bitte einen Wert zwischen 1 und 350 cm und ein gültiges Datum eingeben.');
  update(d=>({...d,measurements:[...d.measurements,{id:uid(),date,metric:measurementType,cm:value,note:note.trim()}]}));setCm('');setNote('');setShowMeasure(false);
 };
 const m=measurementsFor(data,measurementType),last=m[m.length-1];
 return <View>
  <Card style={{backgroundColor:color.ice,borderColor:surfaceTint('#DDE9FC',color)}}><Label>PERFORMANCE CENTER · 28 TAGE</Label><Text style={{fontSize:24,fontWeight:'800',color:color.ink}}>Tracke mehr als Gewicht.</Text><Muted>Eigene Ziele, Körpermaße, Übungsrekorde und Trainingsqualität – alle Werte bleiben zunächst leer.</Muted>
   <View style={{flexDirection:'row',gap:10,marginTop:14}}><Metric label="Gym-Sessions" value={String(recent.sessions)}/><Metric label="Cardio-Minuten" value={String(recent.cardioMin)}/></View>
   <View style={{marginTop:10}}><Muted>{recent.totalSets} Arbeitssätze · {recent.volumeKg.toLocaleString('de-AT')} kg Trainingsvolumen · diese Woche {weeklyTrainingMinutes(data)} Bewegungsminuten</Muted></View></Card>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:16}}>{[['goals','Meine Ziele'],['measure','Körperumfänge'],['records','Kraftrekorde']].map(([id,label])=><Chip key={id} text={label} active={pane===id} onPress={()=>setPane(id as typeof pane)}/>)}</ScrollView>
  {pane==='goals'?<>
   <Section title="Deine Leistungsziele" action={<Button title="+ Ziel" small onPress={()=>setShowGoal(true)}/>}/>
   {data.goals.length?data.goals.map(g=>{const prog=goalProgress(data,g);return <Card key={g.id} style={{marginBottom:9}}><View style={{flexDirection:'row',alignItems:'flex-start',gap:8}}><View style={{flex:1}}><Text style={{fontWeight:'800',fontSize:17,color:color.ink}}>{g.label||goalTitles[g.metric]}</Text><Text style={{fontSize:16,fontWeight:'800',marginTop:8,color:prog.reached?'#207B54':color.blue}}>{prog.current===null?'Noch kein Ausgangswert':`${Number(prog.current.toFixed(1))} ${prog.unit}`} → {g.target} {prog.unit}</Text><Muted>{prog.reached?'Ziel erreicht. Du kannst dein nächstes Ziel setzen.':'Der Wert wird aus deinen eigenen Einträgen berechnet.'}</Muted></View><Pressable accessibilityLabel="Ziel löschen" onPress={()=>Alert.alert('Ziel löschen?',g.label||goalTitles[g.metric],[{text:'Abbrechen',style:'cancel'},{text:'Löschen',style:'destructive',onPress:()=>update(d=>({...d,goals:d.goals.filter(x=>x.id!==g.id)}))}])}><Text style={{color:'#B14A4A',fontSize:18}}>✕</Text></Pressable></View></Card>}):<Card><Empty title="Noch keine Ziele" text="Lege freiwillige Leistungsziele an. Kein Ziel und kein Körpergewicht wird automatisch gesetzt."/></Card>}
  </>:pane==='measure'?<>
   <Section title="Umfänge" action={<Button title="+ Messung" small onPress={()=>setShowMeasure(true)}/>}/>
   <ScrollView horizontal showsHorizontalScrollIndicator={false}>{muscles.map(x=><Chip key={x} text={measurementLabel[x]} active={measurementType===x} onPress={()=>setMeasurementType(x)}/>)}</ScrollView>
   <Card><Label>{measurementLabel[measurementType]} · cm</Label><Text style={{fontSize:28,color:color.ink,fontWeight:'800'}}>{last?last.cm.toFixed(1)+' cm':'–'}</Text><TrendChart points={m.map(x=>({date:x.date,value:x.cm}))} unit="cm" height={160}/><Muted>Mess immer an derselben Stelle und unter ähnlichen Bedingungen.</Muted></Card>
   <Section title="Messhistorie"/>{m.length?[...m].reverse().map(x=><Card key={x.id} style={{marginBottom:8}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View style={{flex:1}}><Text style={{fontWeight:'800',color:color.ink}}>{x.cm.toFixed(1)} cm</Text><Muted>{x.date} {x.note?'· '+x.note:''}</Muted></View><Button small secondary danger title="Löschen" onPress={()=>Alert.alert('Messung löschen?',`${x.cm} cm`,[{text:'Abbrechen',style:'cancel'},{text:'Löschen',style:'destructive',onPress:()=>update(d=>({...d,measurements:d.measurements.filter(v=>v.id!==x.id)}))}])}/></View></Card>):<Card><Empty title="Noch keine Messungen" text="Du bestimmst selbst, was du erfassen möchtest."/></Card>}
  </>:<>
   <Section title="Übungsrekorde"/>
   {records.length?records.slice(0,20).map(r=><Pressable key={r.exerciseId} onPress={()=>setTracked(r.exerciseId)} style={{marginBottom:8}}><Card style={{backgroundColor:selectedId===r.exerciseId?'#EDF3FF':'#FFFFFF'}}><Text style={{fontSize:15,fontWeight:'800',color:color.ink}}>{exName(r.exerciseId)}</Text><Muted>{r.bestKg} kg schwerster Satz · max. {r.maxReps} Wdh. · {r.totalSets} Sätze</Muted></Card></Pressable>):<Card><Empty title="Noch keine Rekorde" text="Nach deiner ersten gespeicherten Session erscheinen hier automatisch die Ergebnisse."/></Card>}
   {selected.length?<Card><Label>LEISTUNGSVERLAUF · {exName(selectedId)}</Label><TrendChart points={selected.map(x=>({date:x.date,value:x.bestKg}))} unit="kg" height={165}/><Label>TRAININGSVOLUMEN</Label><TrendChart points={selected.map(x=>({date:x.date,value:x.volumeKg}))} unit="kg × Wdh." height={135}/></Card>:null}
  </>}
  <Overlay title="Neues Leistungsziel" visible={showGoal} onClose={()=>setShowGoal(false)}>
   <Muted>Wähle ein messbares Ziel. Dein aktueller Wert wird aus deinen eigenen Log-Einträgen bestimmt.</Muted>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:14}}>{(Object.keys(goalTitles) as AthleteGoalMetric[]).map(g=><Chip key={g} text={goalTitles[g]} active={metric===g} onPress={()=>setMetric(g)}/>)}</ScrollView>
   {metric==='lift'?<><Muted>Wähle eine Übung aus deiner bisherigen Trainingshistorie.</Muted>{records.slice(0,30).map(r=><Chip key={r.exerciseId} text={exName(r.exerciseId)} active={exerciseId===r.exerciseId} onPress={()=>setExerciseId(r.exerciseId)}/>)}</>:null}
   <Field label={`Dein Ziel (${goalUnits[metric]})`} value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="Selbst festlegen"/>
   <Button title="Ziel anlegen" onPress={addGoal}/>
  </Overlay>
  <Overlay title="Körperumfang eintragen" visible={showMeasure} onClose={()=>setShowMeasure(false)}><View style={{flexDirection:'row',flexWrap:'wrap'}}>{muscles.map(x=><Chip key={x} text={measurementLabel[x]} active={measurementType===x} onPress={()=>setMeasurementType(x)}/>)}</View><DateField label="Datum (YYYY-MM-DD)" value={date} onChangeText={setDate}/><Field label={`${measurementLabel[measurementType]} in cm`} value={cm} onChangeText={setCm} keyboardType="decimal-pad"/><Field label="Notiz (optional)" value={note} onChangeText={setNote}/><Button title="Messung speichern" onPress={addMeasurement}/></Overlay>
 </View>
}
