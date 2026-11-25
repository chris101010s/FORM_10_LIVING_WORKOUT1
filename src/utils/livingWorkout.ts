import {observeRestChange,settleRest} from './workoutTiming';
import {completePlannedRow,setPlannedDraft} from './planWorkout';
import type {LiveWorkout,Workout,SetDraft,GymSet} from '../data/schema';
import {blankDraft,draftFromSet,logTrainingSet,setFromDraft} from './trainingEngine';
import {reconcileSegments} from './segments';
export function elapsedMs(live:Pick<LiveWorkout,'startedAt'|'pausedAt'|'pausedMs'>,now:number):number {
 const start=Date.parse(live.startedAt), end=live.pausedAt===undefined?now:Math.min(now,live.pausedAt);
 return Number.isFinite(start)&&Number.isFinite(end)?Math.max(0,end-start-Math.max(0,live.pausedMs??0)):0;
}
export function clockText(ms:number){const s=Math.max(0,Math.floor((Number.isFinite(ms)?ms:0)/1000));return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(x=>String(x).padStart(2,'0')).join(':');}
export function recoveryReason(live:LiveWorkout,now:number):'clock'|'long'|null {if(now<Date.parse(live.startedAt)||now<(live.pausedAt??0)||now+60000<Date.parse(live.lastSavedAt??live.startedAt))return 'clock';return elapsedMs(live,now)>=4*3600000||now-Date.parse(live.startedAt)>=12*3600000?'long':null;}
export function restRemaining(live:LiveWorkout,now:number){return Math.max(0,live.restPausedMs??((live.restUntil??now)-now));}
function changeRestRaw(live:LiveWorkout,action:'pause'|'resume'|'skip'|'plus'|'minus'|'start',now:number):LiveWorkout{
 const remaining=restRemaining(live,now);
 if(action==='skip')return {...live,restUntil:null,restPausedMs:undefined};
 if(action==='pause')return remaining>0?{...live,restUntil:null,restPausedMs:remaining}:live;
 if(action==='resume')return live.restPausedMs===undefined?live:{...live,restUntil:remaining?now+remaining:null,restPausedMs:undefined};
 const timerRow=live.plannedRows?.find(r=>r.id===live.restEvents?.find(e=>e.id===live.restTimerId)?.rowId)??live.plannedRows?.find(r=>r.planPositionId===live.activePositionId&&r.status==='draft');
 const ms=action==='start'?(timerRow?.targetRestSeconds??live.prescriptions?.[live.activeExerciseId||'']?.restSeconds??live.restSeconds)*1000:Math.max(0,Math.min(3600000,remaining+(action==='plus'?15000:-15000)));
 return live.restPausedMs!==undefined&&action!=='start'?{...live,restPausedMs:ms,restUntil:null}:{...live,restUntil:ms?now+ms:null,restPausedMs:undefined};
}
export function changeRest(live:LiveWorkout,action:'pause'|'resume'|'skip'|'plus'|'minus'|'start',now:number):LiveWorkout{return observeRestChange(live,changeRestRaw(live,action,now),action,now);}
export function nextDraft(live:LiveWorkout,id:string,previous:GymSet[]):SetDraft {
 const saved=live.drafts?.[id];if(saved)return saved;
 const count=live.sets.filter(s=>s.exerciseId===id).length, old=previous[count];
 if(old)return {...draftFromSet(old),note:''};
 const p=live.prescriptions?.[id];return {...blankDraft(),reps:p?.reps===undefined?'':String(p.reps),rir:p?.rir===undefined?'':String(p.rir),kind:count<(p?.warmupSets??0)?'warmup':'work'};
}
/** One explicit row completion consumes one monotonic sequence, even if callbacks are replayed. */
export function completeSet(live:LiveWorkout,expected:number,id:string,exercise:string,draft:SetDraft,now:number):LiveWorkout{
 const sequence=live.setSequence??live.sets.length;
 if(sequence!==expected||live.pausedAt!==undefined||live.activeExerciseId!==exercise||live.sets.some(s=>s.id===id))return live;
 if(live.plannedRows){if(!live.plannedRows.some(r=>r.id===id&&r.exerciseId===exercise))throw Error('Geplante Satzzeile auswählen; zusätzliche Sätze nur über + Satz.');return completePlannedRow(setPlannedDraft(live,id,draft),id,now);}
 const set=setFromDraft(draft,exercise,id,new Date(now).toISOString());
 const result=logTrainingSet(live,set,now);if(result===live)return live;
 const drafts={...result.drafts};delete drafts[exercise];
 return {...result,setSequence:sequence+1,drafts,restPausedMs:undefined};
}
export function swapExercise(live:LiveWorkout,from:string,to:string):LiveWorkout{
 if(from===to||live.exerciseIds.includes(to)||!live.exerciseIds.includes(from))return live;
 // Keep logged exercise rows accessible; do not relabel historical sets.
 const hasSets=live.sets.some(s=>s.exerciseId===from);
 const ids=hasSets?live.exerciseIds.flatMap(x=>x===from?[x,to]:[x]):live.exerciseIds.map(x=>x===from?to:x);
 const drafts={...live.drafts};if(!hasSets)delete drafts[from];const prescriptions={...live.prescriptions};if(!hasSets)delete prescriptions[from];
 prescriptions[to]=live.prescriptions?.[from]||{};
 return {...live,exerciseIds:ids,activeExerciseId:to,drafts,prescriptions,plannedRows:live.plannedRows?.map(r=>r.exerciseId===from&&r.status!=='completed'?{...r,exerciseId:to,originalExerciseId:r.originalExerciseId??from}:r),segments:live.segments?reconcileSegments(live.segments,ids):undefined,segmentStartedAt:undefined};
}
export function finishSession(input:LiveWorkout,at:number):Workout{
 const live=settleRest(input,at,'finish');
 const start=Date.parse(live.startedAt),last=Math.max(start,...live.sets.map(s=>Date.parse(s.at)));
 if(!Number.isFinite(at)||at<last)throw Error('Endzeit darf nicht vor dem Start oder einem gespeicherten Satz liegen.');
 const paused=Math.min(at-start,(live.pausedMs??0)+(live.pausedAt===undefined?0:Math.max(0,at-live.pausedAt)));
 return {restEvents:live.restEvents?.filter(e=>e.startedAt<=at),safety:live.safety,exerciseDispositions:live.exerciseDispositions,id:live.id,routineId:live.routineId,name:live.name,startedAt:live.startedAt,createdAt:live.createdAt??live.startedAt,finishedAt:new Date(at).toISOString(),status:'completed',sets:live.sets,note:live.note,block:live.block,...(live.segments?{segments:live.segments}:{}),pausedMs:paused,...(live.plannedRows?{plannedRows:live.plannedRows.map(r=>r.status==='completed'?r:{...r,status:'skipped' as const})}:{}),...(live.routineSnapshot?{routineSnapshot:live.routineSnapshot}:{}),...(live.planContext?{planContext:live.planContext}:{})};
}

/** Pause both clocks without losing the separate rest countdown. */
export function pauseSessionClock(live:LiveWorkout,now:number):LiveWorkout {
 if(live.pausedAt!==undefined)return live;
 const remaining=restRemaining(live,now);
 return observeRestChange(live,{...live,status:'paused',pausedAt:now,restUntil:null,restPausedMs:remaining>0?remaining:undefined},'pause',now);
}
