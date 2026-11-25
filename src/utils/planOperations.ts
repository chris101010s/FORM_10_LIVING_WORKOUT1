import type {AthleteData,LiveWorkout,Program,Routine,Workout} from '../data/schema';
import type {PlanOccurrence,PlanRevision,UndoAction,UndoRecord,RoutinePosition} from '../features/workout/secondPassTypes';
import {dateKey,validateDate} from './metrics';
import {routinePositions,projectPositions,validateRoutineTargets} from './plannedTargets';
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
export function stableValue(value:unknown):string {const clean=(v:unknown):unknown=>{if(Array.isArray(v))return v.map(clean);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k,x])=>x!==undefined&&k!=='lastSavedAt').sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,clean(x)]));return v;};return JSON.stringify(clean(value));}
function undoRecord(data:AthleteData,record:UndoRecord):AthleteData {return {...data,undoState:stableValue(record).length<=2_000_000?record:null};}
export function liveAction(data:AthleteData,action:UndoAction,operation:(live:LiveWorkout)=>LiveWorkout,id=uid(),now=Date.now()):AthleteData {
 if(!data.live)return data;const next=operation(data.live);if(next===data.live||stableValue(next)===stableValue(data.live))return data;
 return undoRecord({...data,live:next},{id,action,scope:'live',entityId:data.live.id,createdAt:new Date(now).toISOString(),before:data.live,expectedAfter:stableValue(next)});
}
function undoTarget(data:AthleteData,undo:UndoRecord){return undo.scope==='live'?data.live:undo.scope==='workout'?data.workouts.find(w=>w.id===undo.entityId)??null:data.planOccurrences?.find(o=>o.id===undo.entityId)??null;}
export function undoAvailable(data:AthleteData):boolean{return !!data.undoState&&stableValue(undoTarget(data,data.undoState))===data.undoState.expectedAfter;}
export function undoLastAction(data:AthleteData,id:string):AthleteData {
 const u=data.undoState;if(!u||u.id!==id)return data;
 if(!undoAvailable(data))throw Error('Diese Eingaben wurden inzwischen verändert. Rückgängig ist hier nicht mehr sicher; nutze die gezielte Korrektur.');
 if(u.scope==='live')return {...data,live:clone(u.before),undoState:null};
 if(u.scope==='workout')return {...data,workouts:[...data.workouts.filter(w=>w.id!==u.entityId),clone(u.before)],undoState:null};
 return {...data,planOccurrences:[...(data.planOccurrences??[]).filter(o=>o.id!==u.entityId),...(u.before?[clone(u.before)]:[])],undoState:null};
}
export function historyAction(data:AthleteData,workoutId:string,operation:(workout:Workout)=>Workout|null,action:UndoAction='setRemove',id=uid(),now=Date.now()):AthleteData {
 const old=data.workouts.find(w=>w.id===workoutId);if(!old)return data;const next=operation(old);if(next!==null&&stableValue(next)===stableValue(old))return data;
 return undoRecord({...data,workouts:data.workouts.flatMap(w=>w.id===workoutId?next?[next]:[]:[w])},{scope:'workout',id,action,entityId:workoutId,createdAt:new Date(now).toISOString(),before:old,expectedAfter:stableValue(next)});
}
function cycleWeek(p:Program,key:string){const monday=(s:string)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.getTime();};return Math.round((monday(key)-monday(p.start))/604800000)%p.weeks;}
export function defaultOccurrence(data:AthleteData,program:Program,key:string):PlanOccurrence|null {
 if(!validateDate(key)||key<program.start||!!program.end&&key>program.end)return null;
 const week=cycleWeek(program,key),weekday=new Date(key+'T12:00:00').getDay(),day=program.days.find(d=>d.week===week&&d.day===weekday&&d.kind!=='rest');
 if(!day?.routineId||!data.routines.some(r=>r.id===day.routineId))return null;
 return {id:`${program.id}@${key}`,programId:program.id,routineId:day.routineId,originalDate:key,scheduledDate:key,week,weekday,kind:day.kind==='optional'?'optional':'training',updatedAt:key+'T12:00:00.000Z'};
}
export function occurrencesOnDate(data:AthleteData,key:string,programId?:string):PlanOccurrence[]{
 const programs=(data.programs??[]).filter(p=>programId?p.id===programId:p.status==='active'),out:PlanOccurrence[]=[];
 for(const p of programs){const base=defaultOccurrence(data,p,key),overrides=(data.planOccurrences??[]).filter(o=>o.programId===p.id);if(base&&!overrides.some(o=>o.id===base.id))out.push(base);for(const o of overrides)if(o.scheduledDate===key)out.push(o);}
 return out;
}
export function occurrenceCompleted(data:AthleteData,o:PlanOccurrence):boolean{return data.workouts.some(w=>w.planContext?.occurrenceId===o.id||w.routineId===o.routineId&&(!w.planContext?.programId||w.planContext.programId===o.programId)&&(w.planContext?.originalScheduledDate??w.planContext?.scheduledDate??dateKey(new Date(w.startedAt)))===o.originalDate);}
export function moveOccurrence(data:AthleteData,occurrence:PlanOccurrence,to:string,allowConflict=false,now=Date.now()):AthleteData {
 if(!validateDate(to))throw Error('Gültiges Zieldatum wählen.');
 const program=data.programs?.find(p=>p.id===occurrence.programId),source=program?defaultOccurrence(data,program,occurrence.originalDate):null;
 if(!source||source.id!==occurrence.id||source.routineId!==occurrence.routineId)throw Error('Der ursprüngliche Plantermin ist nicht mehr vorhanden.');
 if(occurrenceCompleted(data,occurrence)||data.live?.planContext?.occurrenceId===occurrence.id)throw Error('Ein gestarteter oder abgeschlossener Termin wird nicht nachträglich verschoben.');
 if(occurrencesOnDate(data,to,occurrence.programId).some(o=>o.id!==occurrence.id&&o.status!=='skipped')&&!allowConflict)throw Error('Am Zieldatum liegt bereits ein Training. Wähle einen anderen Tag oder bestätige beide Termine ausdrücklich.');
 const before=data.planOccurrences?.find(o=>o.id===occurrence.id)??null;if((before??source).scheduledDate===to)return data;const next:PlanOccurrence={...source,...before,scheduledDate:to,updatedAt:new Date(now).toISOString()};
 return undoRecord({...data,planOccurrences:[...(data.planOccurrences??[]).filter(o=>o.id!==next.id),next]},{scope:'occurrence',id:uid(),action:'occurrenceMove',entityId:next.id,createdAt:next.updatedAt,before,expectedAfter:stableValue(next)});
}
export function skipOccurrence(data:AthleteData,occurrence:PlanOccurrence,reason='',now=Date.now()):AthleteData {
 if(data.live?.planContext?.occurrenceId===occurrence.id)throw Error('Ein gestarteter Termin wird in seiner laufenden Session abgeschlossen oder verworfen.');
 if(occurrenceCompleted(data,occurrence))throw Error('Eine abgeschlossene Einheit bleibt im Kalender dokumentiert.');
 const before=data.planOccurrences?.find(o=>o.id===occurrence.id)??null,next={...occurrence,status:occurrence.status==='skipped'?'scheduled' as const:'skipped' as const,reason:reason.slice(0,300),updatedAt:new Date(now).toISOString()};if(before?.status===next.status&&before.reason===next.reason)return data;
 return undoRecord({...data,planOccurrences:[...(data.planOccurrences??[]).filter(o=>o.id!==next.id),next]},{scope:'occurrence',id:uid(),action:'occurrenceSkip',entityId:next.id,createdAt:next.updatedAt,before,expectedAfter:stableValue(next)});
}
function planSnapshot(data:AthleteData,program:Program){const {revisionId,...snapshot}=program;return {program:clone(snapshot),routines:clone(data.routines.filter(r=>program.days.some(d=>d.routineId===r.id))),exercises:clone(data.exercises.filter(e=>data.routines.some(r=>program.days.some(d=>d.routineId===r.id)&&r.exerciseIds.includes(e.id))))};}
export function commitPlanChange(before:AthleteData,after:AthleteData,source:PlanRevision['source']='edit',comment='',now=Date.now(),newId=uid):AthleteData {
 const revisions=[...(before.planRevisions??[])],programs=(after.programs??[]).map(program=>{const old=before.programs?.find(p=>p.id===program.id),current=planSnapshot(after,program),previous=old?planSnapshot(before,old):null;
  if(previous&&stableValue(previous)===stableValue(current))return program;
  let parentId=old?.revisionId;
  if(previous&&!parentId){parentId=newId();revisions.push({id:parentId,programId:program.id,createdAt:new Date(now).toISOString(),source:'baseline',comment:'Vor der ersten versionierten Änderung gesichert.',...previous});}
  const id=newId();if(revisions.some(r=>r.id===id))throw Error('Revisions-ID bereits vergeben.');revisions.push({id,programId:program.id,createdAt:new Date(now).toISOString(),source,comment:comment.slice(0,500),parentId,...current});return {...program,revisionId:id};
 });return {...after,programs,planRevisions:revisions};
}
export function duplicatePositions(positions:RoutinePosition[],newId=uid):RoutinePosition[]{return positions.map(p=>({...clone(p),id:newId(),targets:p.targets.map(t=>({...clone(t),id:newId()}))}));}
export function cloneRoutine(routine:Routine,id=uid(),newId=uid):Routine {const old=routinePositions(routine),positions=duplicatePositions(old,newId),map=new Map(old.map((p,i)=>[p.id,positions[i].id]));return projectPositions({...clone(routine),id,segments:routine.segments?.map(s=>({...clone(s),id:newId(),positionIds:s.positionIds?.map(id=>map.get(id)??id)}))},positions);}
export function transferPlanPosition(data:AthleteData,fromId:string,toId:string,positionId:string,move:boolean,now=Date.now(),newId=uid):AthleteData {if(fromId===toId)throw Error('Einen anderen Trainingstag wählen.');const from=data.routines.find(r=>r.id===fromId),to=data.routines.find(r=>r.id===toId),position=from&&routinePositions(from).find(p=>p.id===positionId);if(!from||!to||!position)throw Error('Übung oder Trainingstag nicht gefunden.');const source=move?routinePositions(from).filter(p=>p.id!==positionId):routinePositions(from);if(move&&!source.some(p=>p.enabled!==false))throw Error('Ein Trainingstag benötigt mindestens eine aktive Übung.');const copied=duplicatePositions([position],newId)[0],target=[...routinePositions(to),copied],routines=data.routines.map(r=>r.id===from.id?projectPositions({...r,segments:undefined},source):r.id===to.id?projectPositions({...r,segments:undefined},target):r);return commitPlanChange(data,{...data,routines},'copy',`${move?'Verschoben':'Kopiert'}: ${position.exerciseId} von ${from.name} nach ${to.name}.`,now,newId);}
export function restorePlanRevision(data:AthleteData,revisionId:string,now=Date.now(),newId=uid):AthleteData {
 const revision=data.planRevisions?.find(r=>r.id===revisionId);if(!revision)throw Error('Planversion nicht gefunden.');
 const mapping=new Map<string,string>(),copies=revision.routines.map(r=>{const id=newId();mapping.set(r.id,id);return cloneRoutine(r,id,newId);});
 const existing=data.programs?.find(p=>p.id===revision.programId),program={...clone(revision.program),status:existing?.status??'paused',days:revision.program.days.map(d=>({...d,routineId:d.routineId?mapping.get(d.routineId)??d.routineId:null}))};
 const next={...data,routines:[...data.routines,...copies],programs:[...(data.programs??[]).filter(p=>p.id!==program.id),program]};return commitPlanChange(data,next,'restore',`Aus Version ${revision.id} wiederhergestellt.`,now,newId);
}
export function copyPlanWeek(data:AthleteData,programId:string,from:number,to:number,options:{loadPercent:number;repsDelta:number;deload:boolean},now=Date.now(),newId=uid):AthleteData {
 const p=data.programs?.find(x=>x.id===programId);if(!p||from===to||from<0||to<0||from>=p.weeks||to>=p.weeks)throw Error('Zwei unterschiedliche vorhandene Zykluswochen wählen.');
 if(!Number.isFinite(options.loadPercent)||options.loadPercent<10||options.loadPercent>200||!Number.isInteger(options.repsDelta)||Math.abs(options.repsDelta)>30)throw Error('Anpassung prüfen (Last 10–200 %, Wiederholungen −30 bis +30).');
 const routines:Routine[]=[],map=new Map<string,string>(),step=data.settings.weightStep??2.5;
 for(const day of p.days.filter(d=>d.week===from&&d.routineId)){const old=data.routines.find(r=>r.id===day.routineId);if(!old||map.has(old.id))continue;const id=newId();map.set(old.id,id);const copied=cloneRoutine(old,id,newId);const positions=routinePositions(copied).map(position=>({...position,targets:position.targets.map(t=>({...t,...(t.weightKg===undefined?{}:{weightKg:Math.round(t.weightKg*options.loadPercent/100/step)*step}),...(t.targetMode==='reps'?{repsMin:Math.max(1,Math.min(150,(t.repsMin??1)+options.repsDelta)),repsMax:Math.max(1,Math.min(150,(t.repsMax??1)+options.repsDelta))}:{})}))}));const r=projectPositions(copied,positions);validateRoutineTargets(r);routines.push(r);}
 const nextProgram={...p,deloadWeeks:[...(p.deloadWeeks??[]).filter(w=>w!==to),...(options.deload?[to]:[])],days:[...p.days.filter(d=>d.week!==to),...p.days.filter(d=>d.week===from).map(d=>({...d,week:to,routineId:d.routineId?map.get(d.routineId)??null:null}))]};
 return commitPlanChange(data,{...data,routines:[...data.routines,...routines],programs:data.programs?.map(x=>x.id===p.id?nextProgram:x)},'copy',`Woche ${from+1} nach ${to+1}; Last ${options.loadPercent} %, Wdh. ${options.repsDelta>=0?'+':''}${options.repsDelta}.`,now,newId);
}

export function copyPlanDay(data:AthleteData,programId:string,fromWeek:number,fromDay:number,toWeek:number,toDay:number,move=false,allowOverwrite=false,now=Date.now(),newId=uid):AthleteData {
 const program=data.programs?.find(p=>p.id===programId);if(!program||fromWeek===toWeek&&fromDay===toDay||![fromWeek,toWeek].every(w=>Number.isInteger(w)&&w>=0&&w<program.weeks)||![fromDay,toDay].every(day=>Number.isInteger(day)&&day>=0&&day<=6))throw Error('Zwei unterschiedliche gültige Plantage wählen.');
 const source=program.days.find(d=>d.week===fromWeek&&d.day===fromDay),target=program.days.find(d=>d.week===toWeek&&d.day===toDay),routine=data.routines.find(r=>r.id===source?.routineId);if(!source||!routine)throw Error('Der Quelltag enthält kein Training.');if(target?.routineId&&!allowOverwrite)throw Error('Der Zieltag enthält bereits ein Training. Ersetzen ausdrücklich bestätigen.');
 const copy=cloneRoutine(routine,newId(),newId),days=program.days.filter(d=>!(d.week===toWeek&&d.day===toDay)&&!(move&&d.week===fromWeek&&d.day===fromDay));days.push({...source,week:toWeek,day:toDay,routineId:copy.id});
 return commitPlanChange(data,{...data,routines:[...data.routines,copy],programs:data.programs?.map(p=>p.id===programId?{...p,days}:p)},'copy',`Trainingstag ${move?'verschoben':'kopiert'}: Woche ${fromWeek+1}, Tag ${fromDay} → Woche ${toWeek+1}, Tag ${toDay}.`,now,newId);
}
