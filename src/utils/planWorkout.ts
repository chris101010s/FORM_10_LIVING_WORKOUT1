import {seedPlannedSuggestions} from './progression';
import {defaultOccurrence,occurrencesOnDate,occurrenceCompleted} from './planOperations';
import {settleRest} from './workoutTiming';
import {allowedReps,validatePrescriptionForStart,validateRoutineTargets} from './plannedTargets';
export {allowedReps,buildPlannedRows,prescriptionLabel,prescriptionMode,validatePrescriptionForStart} from './plannedTargets';
import {matchesPlannedDay} from './planOverview';
import type {AthleteData,LiveWorkout,PlannedSetRow,Prescription,Routine,SetDraft,GymSet,Workout,PlanContext,SetKind} from '../data/schema';
import {dateKey,validateDate} from './metrics';
import {blankDraft,setFromDraft,makeLive,logTrainingSet,draftFromSet} from './trainingEngine';

export type StartPlanOptions={occurrenceId?:string;scheduledDate?:string;programId?:string;week?:number;weekday?:number;allowRepeat?:boolean};
export type StartPlanCheck={ok:boolean;reason?:string;repeat:boolean;context?:PlanContext};
/** A saved routine must belong to an explicitly existing plan day before a new session may begin. */
export function canStartPlannedWorkout(data:AthleteData,routineId:string,now=Date.now(),options:StartPlanOptions={}):StartPlanCheck {
 if(data.live)return {ok:false,reason:'Es läuft bereits ein Training. Setze es fort.',repeat:false};
 const routine=data.routines.find(r=>r.id===routineId);if(!routine)return {ok:false,reason:'Wähle einen vorhandenen Plan-Tag.',repeat:false};
 const requested=(data.planOccurrences??[]).find(o=>o.id===options.occurrenceId);const scheduledDate=requested?.scheduledDate??options.scheduledDate??dateKey(new Date(now));if(!validateDate(scheduledDate))return {ok:false,reason:'Das geplante Datum ist ungültig.',repeat:false};
 const candidates=(data.programs??[]).filter(p=>p.status!=='archived'&&(!options.programId||p.id===options.programId));
 const matches=(p:NonNullable<AthleteData['programs']>[number])=>(requested?.programId===p.id||scheduledDate>=p.start&&(!p.end||scheduledDate<=p.end))&&p.days.some(d=>d.routineId===routineId&&((requested?.week??options.week)===undefined||d.week===(requested?.week??options.week))&&((requested?.weekday??options.weekday)===undefined||d.day===(requested?.weekday??options.weekday)));
 const program=candidates.find(p=>p.status==='active'&&matches(p))??candidates.find(matches);
 const day=program?.days.find(d=>d.routineId===routineId&&((requested?.week??options.week)===undefined||d.week===(requested?.week??options.week))&&((requested?.weekday??options.weekday)===undefined||d.day===(requested?.weekday??options.weekday)));
 const legacy=!options.programId&&data.weeklyPlan.find(d=>d.routineId===routineId&&(options.weekday===undefined||d.day===options.weekday));
 if(!day&&!legacy)return {ok:false,reason:'Ordne diesen Trainingstag zuerst einem vorhandenen Plan zu.',repeat:false};
 const occurrence=program?(requested??occurrencesOnDate(data,scheduledDate,program.id).find(o=>o.routineId===routineId&&(!options.occurrenceId||o.id===options.occurrenceId))):undefined;
 if(program&&(!occurrence||occurrence.routineId!==routineId||occurrence.programId!==program.id||occurrence.status==='skipped'||day&&(occurrence.week!==day.week||occurrence.weekday!==day.day)))return {ok:false,reason:'Wähle den konkreten Plantermin. Einzelne Termine kannst du im Kalender bewusst verschieben.',repeat:false};
 const context:PlanContext={routineId,scheduledDate,...(occurrence?{occurrenceId:occurrence.id,originalScheduledDate:occurrence.originalDate}:{}),...(program?.revisionId?{revisionId:program.revisionId}:{}),...(program&&day&&program.deloadWeeks?.includes(day.week)?{deload:true}:{}),...(program&&day?{programId:program.id,week:day.week,weekday:day.day,kind:day.kind==='optional'?'optional' as const:'training' as const}:{kind:'training' as const,weekday:legacy?legacy.day:undefined})};
 try{validateRoutineTargets(routine)}catch(error){return {ok:false,reason:String((error as Error).message),repeat:false,context};}
 const repeat=occurrence?occurrenceCompleted(data,occurrence):data.workouts.some(w=>matchesPlannedDay(w,routineId,scheduledDate,context.programId));
 return {ok:!repeat||options.allowRepeat===true,repeat,context,...(repeat&&!options.allowRepeat?{reason:'Dieser Plan-Tag wurde für dieses Datum bereits abgeschlossen. Ein weiteres Training ausdrücklich bestätigen.'}:{})};
}
export function startPlannedWorkout(data:AthleteData,routineId:string,id:string,now=Date.now(),options:StartPlanOptions={}):AthleteData {
 if(data.workouts.some(w=>w.id===id))throw Error('Diese Session-ID gehört bereits zur Historie.');
 const check=canStartPlannedWorkout(data,routineId,now,options);if(!check.ok)throw Error(check.reason);
 const routine=data.routines.find(r=>r.id===routineId)!;
 return {...data,live:seedPlannedSuggestions({...makeLive(routine,data.settings.restSeconds,id,now),planContext:check.context},data)};
}
export function rowProgress(session:Pick<LiveWorkout,'plannedRows'|'sets'>,exerciseId?:string,positionId?:string) {
 const rows=(session.plannedRows??[]).filter(r=>(!exerciseId||r.exerciseId===exerciseId)&&(!positionId||r.planPositionId===positionId)),completed=new Set(session.sets.map(s=>s.plannedRowId??s.id));
 const planned=rows.filter(r=>!r.isExtraSet&&r.kind!=='warmup'),warmups=rows.filter(r=>r.kind==='warmup'),extra=rows.filter(r=>r.isExtraSet&&r.kind!=='warmup');
 return {planned:planned.length,completed:planned.filter(r=>completed.has(r.id)).length,extra:extra.filter(r=>completed.has(r.id)).length,extraDrafts:extra.filter(r=>!completed.has(r.id)).length,warmups:warmups.length,warmupsCompleted:warmups.filter(r=>completed.has(r.id)).length,missing:planned.filter(r=>!completed.has(r.id)).length};
}
export function setPlannedDraft(live:LiveWorkout,rowId:string,draft:SetDraft):LiveWorkout {
 const row=live.plannedRows?.find(r=>r.id===rowId);if(!row||row.status==='completed')return live;
 // The prescribed unit cannot be bypassed by changing a draft's set type.
 if(draft.kind&&draft.kind!==row.kind)throw Error('Der Satztyp ist im Plan festgelegt. Für zusätzliche Warm-ups „+ Warm-up“ verwenden.');
 return {...live,plannedRows:live.plannedRows!.map(r=>r.id===rowId?{...r,draft:{...draft,kind:row.kind},suggestionSource:undefined,suggestionSessionId:undefined,status:'draft'}:r)};
}

export function validatePlannedDraft(row:PlannedSetRow,draft:SetDraft):void {
 if(!!draft.unilateral!==!!row.unilateral)throw Error(row.unilateral?'Für diese Planzeile linke und rechte Seite getrennt eingeben.':'Diese Planzeile verwendet eine gemeinsame Satzeingabe.');
 if((draft.kind??row.kind)!==row.kind)throw Error('Der Satztyp muss zum Plan passen.');
 if(row.targetMode==='reps'){
  const n=draft.unilateral?Math.max(Number(draft.unilateral.left.reps.trim().replace(',','.')),Number(draft.unilateral.right.reps.trim().replace(',','.'))):Number(draft.reps.trim().replace(',','.')),max=allowedReps(row);
  if(max!==undefined&&Number.isFinite(n)&&n>max)throw Error(`Geplant: ${row.plannedRepsMax} · + Wdh. erlaubt mehr (aktuell maximal ${max}).`);
 }
}
export function allowExtraRep(live:LiveWorkout,rowId:string,expectedAllowance:number):LiveWorkout {
 const row=live.plannedRows?.find(r=>r.id===rowId);if(!row||row.status==='completed'||row.targetMode!=='reps'||row.extraRepAllowance!==expectedAllowance)return live;
 if((allowedReps(row)??0)>=150)throw Error('Das technische Maximum von 150 Wiederholungen ist erreicht.');
 return {...live,plannedRows:live.plannedRows!.map(r=>r.id===rowId?{...r,extraRepAllowance:r.extraRepAllowance+1}:r)};
}
export function addExtraRow(live:LiveWorkout,exerciseId:string,expectedCount:number,rowId:string,kind?:SetKind,positionId=live.activePositionId):LiveWorkout {
 if(!live.plannedRows||live.pausedAt!==undefined||!live.exerciseIds.includes(exerciseId)||live.plannedRows.some(r=>r.id===rowId))return live;
 const rows=live.plannedRows.filter(r=>r.exerciseId===exerciseId&&(!positionId||r.planPositionId===positionId));if(rows.length!==expectedCount)return live;
 const base=[...rows].reverse().find(r=>r.kind!=='warmup'&&!r.isExtraSet)??rows[0];if(!base)throw Error('Kein geplanter Satz für diese Übung vorhanden.');
 if(rows.length>=160)throw Error('Zu viele zusätzliche Satzzeilen.');
 const row:PlannedSetRow={...base,id:rowId,plannedIndex:null,kind:kind??base.kind,extraRepAllowance:0,isExtraSet:true,status:'draft',completedAt:undefined,draft:{...blankDraft(),kind:kind??base.kind,loadBasis:base.loadBasis,rir:base.targetRir===undefined?'':String(base.targetRir),rpe:base.targetRpe===undefined?'':String(base.targetRpe),tempo:base.targetTempo??'',...(base.unilateral?{unilateral:{left:{weight:'',reps:''},right:{weight:'',reps:''}}}:{})},suggestionSource:undefined,suggestionSessionId:undefined};
 return {...live,plannedRows:[...live.plannedRows,row]};
}
export function removePlannedDraft(live:LiveWorkout,rowId:string):LiveWorkout {
 const row=live.plannedRows?.find(r=>r.id===rowId);if(!row||row.status==='completed')return live;
 // A planned target remains visible as skipped. Only additional draft rows disappear.
 return {...live,plannedRows:row.isExtraSet?live.plannedRows!.filter(r=>r.id!==rowId):live.plannedRows!.map(r=>r.id===rowId?{...r,status:'skipped'}:r)};
}
export function plannedSetFromDraft(row:PlannedSetRow,draft:SetDraft,at:string):GymSet {
 validatePlannedDraft(row,draft);
 const effective={...draft,kind:row.targetMode==='time'?'timed' as const:row.targetMode==='distance'?'distance' as const:row.loadType==='bodyweight'?'bodyweight' as const:row.loadType==='assisted'?'assisted' as const:row.kind};
 const set=setFromDraft(effective,row.exerciseId,row.id,at);
 return {...set,role:row.kind==='warmup'?'warmup':'work',planPositionId:row.planPositionId,targetId:row.targetId,loadBasis:row.loadBasis??set.loadBasis,plannedRowId:row.id,exerciseInstanceId:row.exerciseInstanceId,plannedIndex:row.plannedIndex,plannedRepsMin:row.plannedRepsMin,plannedRepsMax:row.plannedRepsMax,extraRepAllowance:row.extraRepAllowance,isExtraSet:row.isExtraSet};
}
export function completePlannedRow(live:LiveWorkout,rowId:string,now:number):LiveWorkout {
 const row=live.plannedRows?.find(r=>r.id===rowId);if(!row||row.status==='completed'||live.sets.some(s=>s.id===rowId)||live.pausedAt!==undefined)return live;
 const set=plannedSetFromDraft(row,row.draft,new Date(now).toISOString());return logTrainingSet(live,set,now);
}
export function removeCompletedRow(input:LiveWorkout,rowId:string):LiveWorkout {
 const ownsTimer=input.restEvents?.some(e=>e.id===input.restTimerId&&e.rowId===rowId);const live=ownsTimer?{...settleRest(input,Date.now(),'skip'),restUntil:null,restPausedMs:undefined,restTimerId:undefined}:input;
 const set=live.sets.find(s=>s.id===rowId);if(!set)return live;
 return {...live,sets:live.sets.filter(s=>s.id!==rowId),plannedRows:live.plannedRows?.map(r=>r.id===rowId?{...r,status:'draft',completedAt:undefined,draft:{...draftFromSet(set),kind:r.kind}}:r)};
}
/** Corrections preserve targets; the explicit save of a correction records any needed allowance. */
export function correctCompletedSet<T extends LiveWorkout|Workout>(session:T,oldSet:GymSet,draft:SetDraft,now:number):T {
 const corrected={...oldSet,...setFromDraft(draft,oldSet.exerciseId,oldSet.id,oldSet.at),correctedAt:new Date(now).toISOString()};
 const row=session.plannedRows?.find(r=>r.id===oldSet.plannedRowId);
 if(row){
  if(draft.kind!==row.kind&&!(row.targetMode==='time'&&draft.kind==='timed')&&!(row.targetMode==='distance'&&draft.kind==='distance')&&!(row.loadType==='bodyweight'&&draft.kind==='bodyweight')&&!(row.loadType==='assisted'&&draft.kind==='assisted'))throw Error('Bei dieser Korrektur bleibt der geplante Satztyp erhalten.');
  corrected.extraRepAllowance=row.targetMode==='reps'?Math.max(row.extraRepAllowance,Math.max(corrected.reps,corrected.unilateral?.right.reps??0)-(row.plannedRepsMax??corrected.reps)):row.extraRepAllowance;
 }
 return {...session,sets:session.sets.map(s=>s.id===oldSet.id?corrected:s),plannedRows:session.plannedRows?.map(r=>r.id===oldSet.plannedRowId?{...r,draft:{...draft,kind:r.kind},extraRepAllowance:corrected.extraRepAllowance??r.extraRepAllowance}:r)};
}

/** Applied only to interactive updates, never to loading/restoring a legitimate legacy session. */
export function validateNewWorkoutTransition(previous:AthleteData,next:AthleteData):void {
 const live=next.live;if(!live)return;
 if(previous.live){if(previous.live.id!==live.id)throw Error('Beende oder verwirf die laufende Session, bevor du eine andere startest.');return;}
 if(!live.planContext||!live.routineSnapshot||!live.plannedRows)throw Error('Eine neue Session benötigt einen ausgewählten Plan-Tag und dessen gespeicherte Sollwerte.');
 if(live.routineId!==live.planContext.routineId||live.routineSnapshot.id!==live.routineId)throw Error('Die Session verweist auf unterschiedliche Plan-Tage.');
 if(previous.workouts.some(w=>w.id===live.id))throw Error('Diese Session-ID gehört bereits zur Historie.');
 const context=live.planContext,check=canStartPlannedWorkout(previous,context.routineId,Date.parse(live.startedAt),{...context,allowRepeat:true});
 if(!check.ok)throw Error(check.reason);
 const routine=previous.routines.find(r=>r.id===context.routineId);
 if(!routine||JSON.stringify(routine)!==JSON.stringify(live.routineSnapshot))throw Error('Die Soll-Momentaufnahme stimmt nicht mit dem ausgewählten Plan-Tag überein.');
 if(live.sets.length||live.plannedRows.some(r=>r.isExtraSet||r.extraRepAllowance!==0||r.status!=='draft'))throw Error('Eine neue Session beginnt mit offenen geplanten Sätzen. Zusatzleistung erst bewusst im Training freigeben.');
}

export function selectLivePosition(live:LiveWorkout,positionId:string,now=Date.now()):LiveWorkout {const row=live.plannedRows?.find(r=>r.planPositionId===positionId&&r.status!=='completed')??live.plannedRows?.find(r=>r.planPositionId===positionId);if(!row)return live;const before=live.segments?.find(s=>s.positionIds?s.positionIds.includes(live.activePositionId??''):s.exerciseIds.includes(live.activeExerciseId??'')),after=live.segments?.find(s=>s.positionIds?s.positionIds.includes(positionId):s.exerciseIds.includes(row.exerciseId));return {...live,activePositionId:positionId,activeExerciseId:row.exerciseId,...(before?.id!==after?.id?{segmentStartedAt:live.pausedAt??now}:{})};}
export function skipLivePosition(live:LiveWorkout,positionId:string,reason='',now=Date.now()):LiveWorkout {const old=live.exerciseDispositions?.[positionId],skip=old?.status!=='skipped';return {...live,exerciseDispositions:{...live.exerciseDispositions,[positionId]:{status:skip?'skipped':'active',reason:reason.slice(0,300),at:new Date(now).toISOString()}},plannedRows:live.plannedRows?.map(r=>r.planPositionId===positionId&&r.status!=='completed'?{...r,status:skip?'skipped':'draft'}:r)};}
export function swapLivePosition(live:LiveWorkout,positionId:string,to:string):LiveWorkout {const rows=live.plannedRows?.filter(r=>r.planPositionId===positionId);if(!rows?.length||rows.every(r=>r.status==='completed')||!to)return live;return {...live,activePositionId:positionId,activeExerciseId:to,exerciseIds:[...new Set([...live.exerciseIds,to])],plannedRows:live.plannedRows?.map(r=>r.planPositionId===positionId&&r.status!=='completed'?{...r,exerciseId:to,originalExerciseId:r.originalExerciseId??r.exerciseId}:r)};}
