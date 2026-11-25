import type {AthleteData,Workout,Program} from '../data/schema';
import {dateKey,validateDate} from './metrics';
import {plannedDay} from './plans';
import {occurrencesOnDate,occurrenceCompleted} from './planOperations';

export function matchesPlannedDay(workout:Workout,routineId:string,date:string,programId?:string,occurrenceId?:string):boolean{
 if(occurrenceId&&workout.planContext?.occurrenceId)return workout.planContext.occurrenceId===occurrenceId;
 if(workout.routineId!==routineId)return false;
 if(workout.planContext)return workout.planContext.scheduledDate===date&&(!programId||workout.planContext.programId===programId);
 return dateKey(new Date(workout.startedAt))===date;
}
/** Each dated occurrence counts once. Repeated sessions never inflate a plan's completion. */
export function weekOverview(data:AthleteData,key=dateKey()){
 if(!validateDate(key))throw Error('Ungültiges Wochendatum.');
 const today=new Date(key+'T12:00:00'),monday=new Date(today);monday.setDate(today.getDate()-((today.getDay()+6)%7));
 return Array.from({length:7},(_,i)=>{
  const d=new Date(monday);d.setDate(monday.getDate()+i);const date=dateKey(d),plan=plannedDay(data,d),occurrences=occurrencesOnDate(data,date).map(o=>({...o,completed:occurrenceCompleted(data,o)}));
  const legacy=occurrences.length===0&&!data.programs?.length&&!!plan.routine,legacyComplete=legacy&&data.workouts.some(w=>matchesPlannedDay(w,plan.routine!.id,date));
  const required=occurrences.filter(o=>o.kind==='training'),optional=occurrences.filter(o=>o.kind==='optional');
  const plannedCount=required.length+(legacy&&plan.kind==='training'?1:0),completedCount=required.filter(o=>o.completed).length+(legacyComplete&&plan.kind==='training'?1:0),optionalCount=optional.length+(legacy&&plan.kind==='optional'?1:0),optionalCompleted=optional.filter(o=>o.completed).length+(legacyComplete&&plan.kind==='optional'?1:0);
  const kind=plannedCount?'training' as const:optionalCount?'optional' as const:plan.kind;
  return {date,label:['So','Mo','Di','Mi','Do','Fr','Sa'][d.getDay()],kind,routineId:plan.routine?.id??occurrences[0]?.routineId,completed:plannedCount>0?completedCount===plannedCount:optionalCount>0&&optionalCompleted===optionalCount,plannedCount,completedCount,optionalCount,optionalCompleted,occurrences};
 });
}


/** Choose the selected program's cycle, independently of another active program. */
export function planDateForSlot(program:Program,week:number,weekday:number,reference=dateKey()):string|null {
 if(!validateDate(program.start)||!validateDate(reference)||!Number.isInteger(week)||week<0||week>=program.weeks||!Number.isInteger(weekday)||weekday<0||weekday>6)throw Error('Ungültiger Plantag.');
 const start=new Date(program.start+'T12:00:00Z'),monday=new Date(start);monday.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));
 const referenceKey=reference<program.start?program.start:program.end&&reference>program.end?program.end:reference;
 const referenceDay=new Date(referenceKey+'T12:00:00Z'),days=Math.floor((referenceDay.getTime()-monday.getTime())/86400000),cycleDays=program.weeks*7;
 const cycle=Math.floor(days/cycleDays),candidate=new Date(monday);candidate.setUTCDate(monday.getUTCDate()+cycle*cycleDays+week*7+(weekday+6)%7);
 let date=candidate.toISOString().slice(0,10);if(date<program.start){candidate.setUTCDate(candidate.getUTCDate()+cycleDays);date=candidate.toISOString().slice(0,10)}
 if(program.end&&date>program.end){candidate.setUTCDate(candidate.getUTCDate()-cycleDays);date=candidate.toISOString().slice(0,10)}
 return date<program.start||!!program.end&&date>program.end?null:date;
}
