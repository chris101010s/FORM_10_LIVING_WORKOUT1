import type {AthleteData,GymSet,Workout,Routine,LiveWorkout} from '../data/schema';
import type {RecordTicket,WorkoutComparison,RoutinePosition} from '../features/workout/secondPassTypes';
import {dateKey,dayNumber,validateDate} from './metrics';
import {routinePositions} from './plannedTargets';
import {routineSegments} from './segments';
import {workoutVolume} from './workout';
import {measuredRest} from './workoutTiming';

export const activeDuration=(w:Workout)=>Math.max(0,Date.parse(w.finishedAt)-Date.parse(w.startedAt)-(w.pausedMs??0));
/** The purpose of a set and its unit are independent, including old v15 time warm-ups. */
export function workSet(w:Pick<Workout,'plannedRows'>,s:GymSet):boolean{return s.role!=='warmup'&&s.kind!=='warmup'&&w.plannedRows?.find(r=>r.id===(s.plannedRowId??s.id))?.kind!=='warmup';}
export const orderedWorkouts=(workouts:Workout[])=>[...workouts].sort((a,b)=>Date.parse(a.finishedAt)-Date.parse(b.finishedAt)||a.id.localeCompare(b.id));
export function targetSignature(routine:Routine,position:RoutinePosition):string{
 const segment=routineSegments(routine).find(s=>s.positionIds?s.positionIds.includes(position.id):s.exerciseIds.includes(position.exerciseId));
 const positions=routinePositions(routine),kind=segment?.kind??routine.block??'straight';
 const members=kind==='straight'?[]:segment?.positionIds?segment.positionIds.map(id=>positions.find(p=>p.id===id)?.exerciseId??'unknown'):segment?.exerciseIds??routine.exerciseIds;
 const place=kind==='straight'?0:segment?.positionIds?segment.positionIds.indexOf(position.id):members.indexOf(position.exerciseId);
 return JSON.stringify({block:[kind,segment?.seconds??routine.blockSeconds??60,members,place],targets:position.targets.filter(t=>t.kind!=='warmup').map(t=>[t.kind,t.targetMode,t.loadType??'weighted',t.repsMin,t.repsMax,t.durationSeconds,t.distanceMeters,t.weightKg,t.rir,t.rpe,t.unilateral??false,t.loadBasis??'total',t.restSeconds??routine.restSeconds,t.tempo??''])});
}
export function comparablePosition(w:Workout,routine:Routine,position:RoutinePosition):RoutinePosition|undefined {
 if(!w.routineSnapshot||w.planContext?.deload)return undefined;const current=targetSignature(routine,position),positions=routinePositions(w.routineSnapshot).filter(p=>p.enabled!==false&&p.exerciseId===position.exerciseId);
 const exact=positions.find(p=>p.id===position.id);return exact&&targetSignature(w.routineSnapshot,exact)===current?exact:positions.length===1&&targetSignature(w.routineSnapshot,positions[0])===current?positions[0]:undefined;
}
export function comparableSets(w:Workout,routine:Routine,position:RoutinePosition):GymSet[]{const p=comparablePosition(w,routine,position);if(!p)return [];const unique=routinePositions(w.routineSnapshot!).filter(x=>x.exerciseId===position.exerciseId).length===1;const rows=w.plannedRows?.filter(r=>(r.planPositionId===p.id||(!r.planPositionId&&unique&&r.exerciseId===position.exerciseId))&&!r.isExtraSet&&r.kind!=='warmup');if(!rows?.length)return [];return rows.flatMap(r=>{const s=w.sets.find(s=>s.id===r.id&&s.exerciseId===position.exerciseId);return s?[s]:[];});}
export function previousForPosition(workouts:Workout[],routine:Routine,position:RoutinePosition):{workout:Workout;sets:GymSet[]}|null {
 for(const w of orderedWorkouts(workouts).reverse()){const sets=comparableSets(w,routine,position);if(sets.length)return {workout:w,sets};}return null;
}
export function compareWorkout(workouts:Workout[],current:Workout):WorkoutComparison {
 const candidates=orderedWorkouts(workouts).filter(w=>w.id!==current.id&&Date.parse(w.finishedAt)<=Date.parse(current.startedAt)&&w.routineId===current.routineId);
 const signature=(w:Workout)=>w.routineSnapshot?routinePositions(w.routineSnapshot).filter(p=>p.enabled!==false).map(p=>p.exerciseId+targetSignature(w.routineSnapshot!,p)).join('|'):'';
 const previous=[...candidates].reverse().find(w=>signature(w)&&signature(w)===signature(current))??null;
 const values=(w:Workout)=>({planned:w.plannedRows?.filter(r=>r.kind!=='warmup'&&!r.isExtraSet).length??0,completed:w.sets.filter(s=>workSet(w,s)&&!s.isExtraSet).length,extra:w.sets.filter(s=>workSet(w,s)&&s.isExtraSet).length,volume:workoutVolume(w.sets.filter(s=>workSet(w,s))),activeMs:activeDuration(w),observedRests:measuredRest(w)});
 return {previous,reason:previous?undefined:candidates.length?'Vorgaben oder Übungen wurden geändert; kein gleichwertiger Vergleich.':'Noch keine vergleichbare vorherige Einheit.',current:values(current),baseline:previous?values(previous):undefined};
}
export function recordArchive(workouts:Workout[]):RecordTicket[]{
 const best=new Map<string,number>(),out:RecordTicket[]=[];
 for(const w of orderedWorkouts(workouts)){
  const sessionBest=new Map<string,Omit<RecordTicket,'previous'>>();
  for(const s of [...w.sets].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))){if(!workSet(w,s)||s.kind==='assisted')continue;
   const sides=s.unilateral?([{side:'left',...s.unilateral.left},{side:'right',...s.unilateral.right}] as const):[{side:s.side==='left'||s.side==='right'?s.side:undefined,weightKg:s.weightKg,reps:s.reps}];
   const add=(kind:RecordTicket['kind'],value:number,unit:string,side?:'left'|'right',loadKg?:number)=>{if(!Number.isFinite(value)||value<=0)return;const key=[s.exerciseId,kind,side??'both',s.loadBasis??'total',kind==='repsAtLoad'?loadKg:''].join('|'),existing=sessionBest.get(key);if(!existing||value>existing.value)sessionBest.set(key,{id:`${w.id}:${s.id}:${kind}:${side??''}`,exerciseId:s.exerciseId,sessionId:w.id,setId:s.id,at:s.at,kind,value,unit,loadKg,side,set:s});};
   if(s.kind==='timed')add('duration',s.durationSeconds??0,'s');else if(s.kind==='distance')add('distance',s.distanceMeters??0,'m');else for(const v of sides){if(s.kind==='bodyweight'){add('bodyweight',v.reps,'Wdh.',v.side);continue;}if(v.weightKg>0){add('load',v.weightKg,s.loadBasis==='perHand'?'kg/Hand':s.loadBasis==='perSide'?'kg/Seite':'kg',v.side);add('repsAtLoad',v.reps,'Wdh.',v.side,v.weightKg);if(!s.unilateral&&!v.side&&v.reps>0&&v.reps<=12)add('e1rm',v.weightKg*(1+v.reps/30),s.loadBasis==='perHand'?'kg/Hand · e1RM':s.loadBasis==='perSide'?'kg/Seite · e1RM':'kg · e1RM',v.side);}}
  }
  for(const [key,record] of sessionBest){const previous=best.get(key);if(previous!==undefined&&record.value>previous)out.push({...record,previous});best.set(key,Math.max(previous??0,record.value));}
 }
 return out.reverse();
}
export type PeriodSummary={from:string;to:string;days:number;incomplete:boolean;sessions:number;planned:number;completed:number;extra:number;activeMs:number;pausedMs:number;volumeKg:number;seconds:number;meters:number;bodyweightReps:number;observedRest:{count:number;totalMs:number;averageMs:number|null}};
export function periodSummary(workouts:Workout[],from:string,to:string,today=dateKey()):PeriodSummary {
 if(!validateDate(from)||!validateDate(to)||from>to)throw Error('Gültigen Zeitraum wählen.');
 const selected=workouts.filter(w=>{const key=dateKey(new Date(w.finishedAt));return key>=from&&key<=to&&key<=today}),sets=selected.flatMap(w=>w.sets.filter(s=>workSet(w,s))),rests=selected.map(measuredRest),count=rests.reduce((n,r)=>n+r.count,0),totalMs=rests.reduce((n,r)=>n+r.totalMs,0);
 return {from,to,days:dayNumber(to)-dayNumber(from)+1,incomplete:to>today,sessions:selected.length,planned:selected.reduce((n,w)=>n+(w.plannedRows?.filter(r=>!r.isExtraSet&&r.kind!=='warmup').length??0),0),completed:sets.filter(s=>!s.isExtraSet).length,extra:sets.filter(s=>s.isExtraSet).length,activeMs:selected.reduce((n,w)=>n+activeDuration(w),0),pausedMs:selected.reduce((n,w)=>n+(w.pausedMs??0),0),volumeKg:workoutVolume(sets),seconds:sets.reduce((n,s)=>n+(s.durationSeconds??0),0),meters:sets.reduce((n,s)=>n+(s.distanceMeters??0),0),bodyweightReps:sets.filter(s=>s.kind==='bodyweight').reduce((n,s)=>n+(s.unilateral?s.unilateral.left.reps+s.unilateral.right.reps:s.reps),0),observedRest:{count,totalMs,averageMs:count?totalMs/count:null}};
}
export type MuscleDefinition={id:string;group?:string;primaryMuscles?:string[];secondaryMuscles?:string[]};
export type MuscleSummary={muscle:string;primarySets:number;secondarySets:number;extraSets:number;weightedVolume:number;timeSeconds:number;distanceMeters:number;bodyweightReps:number};
export function muscleSummary(workouts:Workout[],definitions:MuscleDefinition[],from:string,to:string):MuscleSummary[]{
 const map=new Map<string,MuscleSummary>(),defs=new Map(definitions.map(e=>[e.id,e]));
 for(const w of workouts){const key=dateKey(new Date(w.finishedAt));if(key<from||key>to)continue;for(const s of w.sets){if(!workSet(w,s))continue;const e=defs.get(s.exerciseId),primary=e?.primaryMuscles?.length?e.primaryMuscles:[e?.group||'Nicht zugeordnet'],secondary=(e?.secondaryMuscles??[]).filter(m=>!primary.includes(m));for(const muscle of [...primary,...secondary]){const old=map.get(muscle)??{muscle,primarySets:0,secondarySets:0,extraSets:0,weightedVolume:0,timeSeconds:0,distanceMeters:0,bodyweightReps:0};if(primary.includes(muscle)){old.primarySets++;old.extraSets+=Number(!!s.isExtraSet);old.weightedVolume+=workoutVolume([s]);old.timeSeconds+=s.durationSeconds??0;old.distanceMeters+=s.distanceMeters??0;old.bodyweightReps+=s.kind==='bodyweight'?(s.unilateral?s.unilateral.left.reps+s.unilateral.right.reps:s.reps):0;}else old.secondarySets++;map.set(muscle,old);}}}
 return [...map.values()].sort((a,b)=>b.primarySets-a.primarySets||a.muscle.localeCompare(b.muscle));
}
export function plannedMuscleSummary(data:AthleteData,programId:string,week:number,definitions:MuscleDefinition[]):{muscle:string;primary:number;secondary:number;optional:number;optionalSecondary:number}[]{
 const p=data.programs?.find(x=>x.id===programId),defs=new Map(definitions.map(e=>[e.id,e])),out=new Map<string,{muscle:string;primary:number;secondary:number;optional:number;optionalSecondary:number}>();
 for(const day of p?.days.filter(d=>d.week===week&&d.kind!=='rest')??[]){const r=data.routines.find(r=>r.id===day.routineId);if(!r)continue;for(const pos of routinePositions(r).filter(p=>p.enabled!==false)){const count=pos.targets.filter(t=>t.kind!=='warmup').length,e=defs.get(pos.exerciseId),primary=e?.primaryMuscles?.length?e.primaryMuscles:[e?.group||'Nicht zugeordnet'],secondary=(e?.secondaryMuscles??[]).filter(m=>!primary.includes(m));for(const muscle of [...primary,...secondary]){const row=out.get(muscle)??{muscle,primary:0,secondary:0,optional:0,optionalSecondary:0};if(day.kind==='optional'){if(primary.includes(muscle))row.optional+=count;else row.optionalSecondary+=count;}else if(primary.includes(muscle))row.primary+=count;else row.secondary+=count;out.set(muscle,row);}}}
 return [...out.values()].sort((a,b)=>b.primary-a.primary||a.muscle.localeCompare(b.muscle));
}
export type RecoveryPair={date:string;sleepHours:number;activeMinutes:number;sets:number;source:string};
export function recoveryPairs(data:AthleteData,from:string,to:string):RecoveryPair[]{
 const grouped=new Map<string,typeof data.recovery>();for(const r of data.recovery)if(r.date>=from&&r.date<=to&&r.sleepHours!==undefined){const list=grouped.get(r.date)??[];grouped.set(r.date,[...list,r]);}
 return [...grouped].flatMap(([date,entries])=>{if(new Set(entries.map(r=>r.sleepHours)).size!==1)return [];const ws=data.workouts.filter(w=>dateKey(new Date(w.startedAt))===date),sources=[...new Set(entries.map(r=>r.healthOrigin?.source.name??'Manuell'))];return ws.length?[{date,sleepHours:entries[0].sleepHours!,activeMinutes:ws.reduce((n,w)=>n+activeDuration(w)/60000,0),sets:ws.reduce((n,w)=>n+w.sets.filter(s=>workSet(w,s)).length,0),source:sources.join(' / ')}]:[];}).sort((a,b)=>a.date.localeCompare(b.date));
}
export function recoveryAssociation(pairs:RecoveryPair[]):{count:number;correlation:number|null;reason:string}{const unique=[...new Map(pairs.map(p=>[p.date,p])).values()];if(unique.length<7)return {count:unique.length,correlation:null,reason:'Mindestens 7 unterschiedliche Tage mit Schlafwert und Training nötig.'};const x=unique.reduce((n,p)=>n+p.sleepHours,0)/unique.length,y=unique.reduce((n,p)=>n+p.activeMinutes,0)/unique.length,cov=unique.reduce((n,p)=>n+(p.sleepHours-x)*(p.activeMinutes-y),0),den=Math.sqrt(unique.reduce((n,p)=>n+(p.sleepHours-x)**2,0)*unique.reduce((n,p)=>n+(p.activeMinutes-y)**2,0));return {count:unique.length,correlation:den?cov/den:null,reason:den?'Beschreibender Zusammenhang von Schlaf und aktiver Trainingsdauer. Keine Ursache und keine Diagnose.':'Zu wenig Streuung für einen aussagekräftigen Zusammenhang.'};}
