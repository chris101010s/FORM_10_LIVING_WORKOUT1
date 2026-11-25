import React,{useMemo,useState} from 'react';
import {Text,View,Pressable,useWindowDimensions} from 'react-native';
import {useAthlete} from '../data/context';
import {Button,Label,Muted,Section,usePalette,useFormFont} from '../components/Design';
import {Doodle,InkRule,MarkerSwipe,NotebookHeader,NotebookSheet} from '../components/Sketchbook';
import {dateKey} from '../utils/metrics';
import {SketchEvent} from '../components/Personality';
import {MotionCue} from '../components/MotionCue';
import {DeskScene,PaperSticker} from '../components/DeskScene';
import {MarginNote,PaperGrain} from '../components/PaperDetails';
import {plannedDay,newId} from '../utils/plans';
import {canStartPlannedWorkout,startPlannedWorkout,rowProgress} from '../utils/planWorkout';
import {weekOverview} from '../utils/planOverview';

export function HomeScreen({go}:{go:(tab:string)=>void}){
 const p=usePalette(),font=useFormFont('FormDisplay'),mono=useFormFont('FormMono'),{fontScale}=useWindowDimensions();
 const {data,confirmedData,update,saving,fault}=useAthlete(),[starting,setStarting]=useState(false);
 const today=new Date(),key=dateKey(today),plan=plannedDay(data,today);
 const days=useMemo(()=>weekOverview({...data,workouts:confirmedData?.workouts??[]},key),[data.programs,data.weeklyPlan,data.routines,confirmedData?.workouts,data.planOccurrences,key]);
 const current=days.find(d=>d.date===key),required=days.filter(d=>d.plannedCount>0),requiredCount=days.reduce((n,d)=>n+d.plannedCount,0),done=days.reduce((n,d)=>n+d.completedCount,0);
 const options={programId:plan.program?.id,weekday:plan.weekday??today.getDay(),week:plan.week,scheduledDate:key,occurrenceId:plan.occurrenceId};
 const startCheck=plan.routine?canStartPlannedWorkout(data,plan.routine.id,Date.now(),options):null;
 const readyToStart=!!plan.routine&&startCheck?.ok&&(plan.conflictCount??1)<=1;
 const confirmedLive=confirmedData?.live?.id===data.live?.id?confirmedData?.live:null;
 const liveProgress=confirmedLive?.plannedRows?rowProgress(confirmedLive):null;
 const title=data.live?.name??plan.routine?.name??(plan.kind==='rest'?'Platz für Erholung.':'Dein Plan beginnt hier.');
 const primary=data.live?'Training fortsetzen':(plan.conflictCount??0)>1?'Heutigen Termin auswählen':current?.completed?'Plan ansehen':readyToStart?'Heutiges Training starten':plan.routine?'Sollwerte im Plan prüfen':plan.kind==='rest'?'Plan ansehen':'Plan erstellen';
 const start=async()=>{if(data.live){go('gym');return}if(!readyToStart||!plan.routine||current?.completed){go('plans');return}if(starting)return;setStarting(true);try{const saved=await update(d=>startPlannedWorkout(d,plan.routine!.id,newId(),Date.now(),options));if(saved)go('gym')}finally{setStarting(false)}};
 const last=(confirmedData?.workouts??[]).slice().sort((a,b)=>Date.parse(b.finishedAt)-Date.parse(a.finishedAt))[0];
 const plannedCount=plan.routine?.positions?plan.routine.positions.filter(x=>x.enabled!==false).reduce((n,pos)=>n+pos.targets.filter(t=>t.kind!=='warmup').length,0):plan.routine?.exerciseIds.reduce((n,id)=>n+(plan.routine?.prescriptions?.[id]?.sets??0),0)??0;
 return <View><PaperGrain/>
  <NotebookHeader eyebrow="FORM 15.0.0 / TAGESNOTIZ" title={today.toLocaleDateString('de-AT',{weekday:'long'})+'.'} subtitle={today.toLocaleDateString('de-AT',{day:'numeric',month:'long',year:'numeric'})} doodle={plan.kind==='rest'?'moon':'notebook'}/>
  <View style={{marginBottom:22}}><Label>{plan.program?.name||'DEIN TRAININGSHEFT'}</Label><MarkerSwipe><Text style={{fontFamily:font,fontSize:28,lineHeight:34,fontWeight:'700',color:p.ink}}>{title}</Text></MarkerSwipe>
   <Muted>{data.live?(!confirmedLive?'Neue Session noch nicht bestätigt gespeichert.':liveProgress?`${liveProgress.completed}/${liveProgress.planned} geplante Sätze bestätigt${liveProgress.extra?` · ${liveProgress.extra} extra`:''}`:`${confirmedLive.sets.length} Sätze bestätigt · bisherige Session`):current?.completed?'Dieser Plan-Tag ist abgeschlossen. Dein Eintrag bleibt im Trainingsarchiv.':plan.routine?`${plan.routine.exerciseIds.length} Übungen · ${plannedCount} geplante Arbeitssätze${plan.kind==='optional'?' · freiwilliger Tag':''}`:plan.kind==='rest'?'Heute ist laut Plan frei. Du kannst in deinem Heft einen anderen Trainingstag bewusst auswählen.':'Ordne deine Übungen und Sollwerte einem Trainingstag zu. Danach führt FORM dich durch genau diesen Plan.'}</Muted>
   {data.live&&(saving||fault)&&<Muted>{fault?'Änderungen sind noch nicht gespeichert. Öffne das Training für Retry und deine aktuellen Eingaben.':'Weitere Änderungen werden noch gesichert.'}</Muted>}
   {plan.routine&&!readyToStart&&!data.live&&!current?.completed&&startCheck?.reason&&<Muted>{startCheck.reason}</Muted>}
   <View style={{marginTop:19}}><Button title={starting?'Training wird gespeichert …':primary} disabled={starting||saving} onPress={()=>void start()}/></View>
  </View>
  <View style={{marginTop:-8,marginBottom:4}}><DeskScene variant="today" character={data.settings.character===true}/><PaperSticker label="Dein Heft. Dein Rhythmus." tone="blue" tilt={-1} style={{alignSelf:'center',marginTop:-9}}/></View>
  <Section title="Die Woche, Seite für Seite"/>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:3}}>{days.map(day=><Pressable key={day.date} accessibilityRole="button" accessibilityLabel={`${day.label}, ${day.date}: ${day.kind==='optional'?'optional':day.kind==='training'?'geplant':day.kind==='rest'?'Ruhetag':'kein Plan'}${day.completed?', dokumentiert':''}`} onPress={()=>go('plans')} style={{flex:1,minWidth:fontScale>1.3?64:44,minHeight:88,paddingVertical:8,alignItems:'center',justifyContent:'center',borderBottomWidth:day.date===key?3:1,borderColor:day.date===key?p.blue:p.line,backgroundColor:day.completed?p.mint:'transparent'}}><Text style={{fontSize:11,color:p.muted}}>{day.label}</Text><Text style={{fontSize:22,fontFamily:mono,color:p.ink,marginVertical:5}}>{Number(day.date.slice(8))}</Text><Text style={{fontSize:14,color:p.blue}}>{day.completed?'✓':day.kind==='training'?'○':day.kind==='optional'?'·':'–'}</Text></Pressable>)}</View>
  <Muted>{requiredCount?`${done}/${requiredCount} Pflichttrainings dokumentiert`:'Diese Woche sind keine Pflichttrainings eingetragen.'}{days.some(d=>d.kind==='optional')?' · Optionale Tage zählen separat.':''}</Muted>
  <SketchEvent event={data.live?'restored':plan.kind==='rest'?'restDay':plan.routine?'planReady':'noPlan'} eventId={data.live?.id??key}/>
  {(data.settings.homeOverview??'none')!=='none'&&<MarginNote id={'home-note-'+key} onClose={()=>{}}>{data.settings.homeOverview==='last'?<><Label>LETZTER BESTÄTIGTER EINTRAG</Label><Muted>{last?last.name+' · '+new Date(last.finishedAt).toLocaleDateString('de-AT')+' · '+last.sets.length+' gespeicherte Sätze':'Noch kein abgeschlossenes Training vorhanden.'}</Muted></>:<><Label>DIESE WOCHE</Label><Muted>{requiredCount?`${done} von ${requiredCount} Pflichtterminen dokumentiert.`:'Keine Pflichttermine in dieser Woche.'}</Muted><Muted>Optionale Tage sind freiwillig und zählen separat.</Muted></>}</MarginNote>}
  {confirmedData?.workouts.length===100&&<MotionCue variant="stampPress" eventKey="confirmed-workouts-100" confirmed><NotebookSheet style={{marginTop:12}}><Doodle name="calendarStamp" size={48}/><Label>100 DOKUMENTIERTE EINHEITEN</Label><Muted>Ein Archivmoment aus deinen gespeicherten Einträgen. Daraus entsteht kein neues Trainingsziel.</Muted></NotebookSheet></MotionCue>}

 </View>;
}
