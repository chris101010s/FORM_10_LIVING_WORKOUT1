import type {LiveWorkout,Routine,Workout} from '../data/schema';
import type {RestObservation} from '../features/workout/secondPassTypes';
import {routinePositions} from './plannedTargets';
export function settleRest(live:LiveWorkout,now:number,reason?:RestObservation['reason']):LiveWorkout {
 if(!live.restTimerId||!live.restEvents)return live;
 return {...live,restEvents:live.restEvents.map(e=>{if(e.id!==live.restTimerId||e.endedAt!==undefined)return e;const until=e.expectedEndAt??now,end=Math.min(now,until),elapsed=e.runningSince===undefined?0:Math.max(0,end-e.runningSince),expired=e.runningSince!==undefined&&now>=until;return {...e,activeMs:e.activeMs+elapsed,runningSince:undefined,...(reason||expired?{endedAt:Math.max(e.startedAt,expired?until:now),reason:reason??'elapsed'}:{})};})};
}
export function startObservedRest(live:LiveWorkout,until:number|null,now:number,id:string,rowId?:string):LiveWorkout {
 const settled=settleRest(live,now,'nextSet');
 if(until===null||until<=now)return {...settled,restUntil:until,restPausedMs:undefined,restTimerId:undefined};
 const event:RestObservation={id,rowId,startedAt:now,activeMs:0,runningSince:now,expectedEndAt:until};
 return {...settled,restUntil:until,restPausedMs:undefined,restTimerId:id,restEvents:[...(settled.restEvents??[]).filter(e=>e.id!==id),event]};
}
export function observeRestChange(before:LiveWorkout,after:LiveWorkout,action:string,now:number):LiveWorkout {
 if(action==='start')return startObservedRest({...after,restEvents:before.restEvents,restTimerId:before.restTimerId},after.restUntil,now,`${before.id.slice(0,100)}:rest:${now}`);
 const settled=settleRest(before,now,action==='skip'?'skip':undefined);
 const events=settled.restEvents?.map(e=>e.id===before.restTimerId&&e.endedAt===undefined?{...e,...(after.restUntil!==null?{runningSince:now,expectedEndAt:after.restUntil}:{runningSince:undefined})}:e);
 return {...after,restEvents:events,restTimerId:action==='skip'?undefined:before.restTimerId};
}
export function measuredRest(session:Pick<Workout,'restEvents'>){const events=(session.restEvents??[]).filter(e=>e.endedAt!==undefined);return {count:events.length,totalMs:events.reduce((n,e)=>n+e.activeMs,0),averageMs:events.length?events.reduce((n,e)=>n+e.activeMs,0)/events.length:null};}
export function estimateRoutineDuration(routine:Routine){
 const positions=routinePositions(routine).filter(p=>p.enabled!==false),counted=new Set<string>();let seconds=0,missing=0,targets=0;
 for(let pi=0;pi<positions.length;pi++){const p=positions[pi],segment=routine.segments?.find(s=>s.positionIds?s.positionIds.includes(p.id):s.exerciseIds.includes(p.exerciseId)),kind=segment?.kind??routine.block??'straight',groupPositions=segment?positions.filter(p=>segment.positionIds?segment.positionIds.includes(p.id):segment.exerciseIds.includes(p.exerciseId)):positions,key=segment?.id??'base';
  if(['amrap','emom','interval'].includes(kind)){if(counted.has(key))continue;counted.add(key);const count=groupPositions.reduce((n,p)=>n+p.targets.length,0);targets+=count;if(kind==='amrap')seconds+=segment?.seconds??routine.blockSeconds??60;else seconds+=(segment?.seconds??routine.blockSeconds??60)*count;continue;}
  for(let ti=0;ti<p.targets.length;ti++){const t=p.targets[ti];targets++;const duration=t.targetMode==='time'?t.durationSeconds:t.estimatedSeconds;if(duration===undefined)missing++;else seconds+=duration;
   const group=['superset','giant','circuit'].includes(kind),groupLast=groupPositions.at(-1)?.id===p.id;
   if((!group||groupLast)&&!(pi===positions.length-1&&ti===p.targets.length-1))seconds+=t.restSeconds??routine.restSeconds;
  }
 }
 return {seconds,missing,targets,complete:missing===0};
}
