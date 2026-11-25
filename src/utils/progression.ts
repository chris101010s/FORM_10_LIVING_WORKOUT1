import type {AthleteData,LiveWorkout,Routine,GymSet,Workout} from '../data/schema';
import type {RoutinePosition} from '../features/workout/secondPassTypes';
import {routinePositions,projectPositions,validateRoutineTargets} from './plannedTargets';
import {previousForPosition,comparablePosition,comparableSets,orderedWorkouts,targetSignature} from './workoutAnalytics';
import {draftFromSet} from './trainingEngine';
import {commitPlanChange} from './planOperations';
import {availablePlatePlan} from './equipment';
import {dateKey,dayNumber} from './metrics';
const fingerprint=(value:string)=>{let a=2166136261,b=5381;for(const c of value){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b,33)^c.charCodeAt(0);}return (a>>>0).toString(16)+(b>>>0).toString(16);};
const uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
/** Keep gaps from a partial workout: a completed third target must never seed the first target. */
export function previousTargetsForPosition(workouts:Workout[],routine:Routine,position:RoutinePosition):{workout:Workout;byTargetId:Record<string,GymSet>}|null {
 const previous=previousForPosition(workouts,routine,position);if(!previous)return null;
 const oldPosition=comparablePosition(previous.workout,routine,position);if(!oldPosition)return null;
 const oldTargets=oldPosition.targets.filter(t=>t.kind!=='warmup'),targets=position.targets.filter(t=>t.kind!=='warmup'),unique=routinePositions(previous.workout.routineSnapshot!).filter(p=>p.exerciseId===position.exerciseId).length===1;
 const oldRows=(previous.workout.plannedRows??[]).filter(r=>!r.isExtraSet&&r.kind!=='warmup'&&(r.planPositionId===oldPosition.id||(!r.planPositionId&&unique&&r.exerciseId===position.exerciseId))).sort((a,b)=>(a.plannedIndex??0)-(b.plannedIndex??0));
 const byTargetId:Record<string,GymSet>={};
 targets.forEach((target,index)=>{const oldTarget=oldTargets[index],row=oldRows.find(r=>r.targetId===oldTarget?.id)??(!oldRows.some(r=>r.targetId)?oldRows[index]:undefined),set=row&&previous.workout.sets.find(s=>s.id===row.id&&s.exerciseId===position.exerciseId);if(set)byTargetId[target.id]=set;});
 return {workout:previous.workout,byTargetId};
}
export function seedPlannedSuggestions(live:LiveWorkout,data:AthleteData):LiveWorkout {
 const routine=live.routineSnapshot;if(!routine)return live;
 const positions=routinePositions(routine),previous=new Map(positions.map(p=>[p.id,data.settings.previousSuggestions===false?null:previousTargetsForPosition(data.workouts,routine,p)]));
 return {...live,plannedRows:live.plannedRows?.map(row=>{const history=previous.get(row.planPositionId??''),old=row.kind!=='warmup'&&row.targetId?history?.byTargetId[row.targetId]:undefined;
 if(old)return {...row,draft:{...draftFromSet(old),kind:row.kind,note:'',loadBasis:row.loadBasis},suggestionSource:'previous' as const,suggestionSessionId:history!.workout.id};
 if(row.targetWeightKg!==undefined)return {...row,draft:{...row.draft,weight:String(row.targetWeightKg),...(row.unilateral?{unilateral:{left:{weight:String(row.targetWeightKg),reps:'',rir:''},right:{weight:String(row.targetWeightKg),reps:'',rir:''}}}:{})},suggestionSource:'target' as const};
 return row;
 })};
}
export type ProgressionProposal={key:string;routineId:string;positionId:string;exerciseId:string;sessionIds:string[];kind:'load'|'reps'|'time'|'distance'|'hold';delta:number;targetWeights?:Record<string,number>;reason:string;basis:string;plateau:boolean};
const minRir=(s:GymSet)=>s.unilateral?Math.min(s.unilateral.left.rir??-1,s.unilateral.right.rir??-1):s.rir??-1;
const reps=(s:GymSet)=>s.unilateral?Math.min(s.unilateral.left.reps,s.unilateral.right.reps):s.reps;
const load=(s:GymSet)=>s.unilateral?Math.min(s.unilateral.left.weightKg,s.unilateral.right.weightKg):s.weightKg;
export function progressionProposal(data:AthleteData,routine:Routine,position:RoutinePosition,now=Date.now()):ProgressionProposal|null {
 const targets=position.targets.filter(t=>t.kind!=='warmup');if(!targets.length||position.enabled===false)return null;
 // A changed plan, deload or incomplete attempt ends a streak instead of being filtered out of it.
 const related=orderedWorkouts(data.workouts).filter(w=>Date.parse(w.finishedAt)<=now&&now-Date.parse(w.finishedAt)<90*86400000&&(w.sets.some(s=>s.exerciseId===position.exerciseId)||w.plannedRows?.some(r=>r.exerciseId===position.exerciseId))).map(w=>({w,sets:comparableSets(w,routine,position)}));
 const recent:typeof related=[];for(const item of related){if(item.sets.length!==targets.length||!comparablePosition(item.w,routine,position))recent.length=0;else {if(recent.length&&Date.parse(item.w.finishedAt)-Date.parse(recent.at(-1)!.w.finishedAt)>21*86400000)recent.length=0;recent.push(item);}}
 if(recent.length<2)return null;const last=recent.slice(-2),latest=last[1],days=dayNumber(dateKey(new Date(now)))-dayNumber(dateKey(new Date(latest.w.finishedAt)));if(days>21)return null;
 const key=[routine.id,position.id,...last.map(o=>o.w.id),fingerprint(targetSignature(routine,position))].join('|');if(data.progressionDecisions?.some(d=>d.proposalKey===key))return null;
 const safety=last.some(o=>o.w.safety?.pain||o.w.safety?.overload),recovery=data.recovery.filter(r=>r.date>=dateKey(new Date(now-2*86400000))&&r.date<=dateKey(new Date(now))).some(r=>(r.energy!==undefined&&r.energy<=2)||(r.soreness!==undefined&&r.soreness>=4));
 const four=recent.slice(-4),span=four.length===4?Date.parse(four[3].w.finishedAt)-Date.parse(four[0].w.finishedAt):0;
 const metrics=(s:GymSet):number[]=>s.kind==='timed'?[s.durationSeconds??0]:s.kind==='distance'?[s.distanceMeters??0]:s.unilateral?[s.unilateral.left.weightKg,s.unilateral.left.reps,s.unilateral.right.weightKg,s.unilateral.right.reps]:[s.weightKg,s.reps];
 const improved=four.some((later,index)=>four.slice(0,index).some(earlier=>later.sets.some((s,i)=>metrics(s).some((value,m)=>value>(metrics(earlier.sets[i])[m]??0)))));
 const plateau=four.length===4&&span>=21*86400000&&!improved&&!four.some(o=>o.w.safety?.pain||o.w.safety?.overload||o.w.planContext?.deload||o.sets.some(s=>!['timed','distance'].includes(s.kind??'')&&minRir(s)<0));
 const common={key,routineId:routine.id,positionId:position.id,exerciseId:position.exerciseId,sessionIds:last.map(o=>o.w.id),basis:`${last.map(o=>new Date(o.w.finishedAt).toLocaleDateString('de-AT')).join(' und ')} · je ${targets.length} geplante Arbeitssätze mit identischen Zielen.`,plateau};
 if(safety||recovery)return {...common,kind:'hold',delta:0,reason:'Schmerz-, Belastungs- oder Erholungsvermerk vorhanden. Keine Steigerung vorgeschlagen.'};
 const mode=targets[0].targetMode;if(targets.some(t=>t.targetMode!==mode))return null;
 if(mode==='time'||mode==='distance'){const field=mode==='time'?'durationSeconds':'distanceMeters';if(last.every(o=>o.sets.every((s,i)=>(s[field]??0)>=(targets[i][field]??Infinity))))return {...common,kind:mode==='time'?'time':'distance',delta:mode==='time'?5:10,reason:mode==='time'?'Beide Einheiten erreichten alle Zeitzielwerte. Optional +5 Sekunden pro Arbeitssatz.':'Beide Einheiten erreichten alle Distanzziele. Optional +10 Meter pro Arbeitssatz.'};return {...common,kind:'hold',delta:0,reason:'Zielumfang zuerst in vergleichbarer Ausführung wiederholen.'};}
 if(last.some(o=>o.sets.some(s=>minRir(s)<0)))return null;
 const completed=last.every(o=>o.sets.every((s,i)=>reps(s)>=(targets[i].repsMax??Infinity))),controlled=last.every(o=>o.sets.every(s=>minRir(s)>=1));
 if(!completed||!controlled)return {...common,kind:'hold',delta:0,reason:!completed?'Die obere Wiederholungsgrenze wurde noch nicht in allen geplanten Arbeitssätzen erreicht. Last zunächst halten.':'Mindestens ein Satz war bei RIR 0. Last zunächst halten.'};
 if(targets.every(t=>t.loadType==='bodyweight'))return {...common,kind:'reps',delta:1,reason:'Zwei vollständige Einheiten am oberen Ziel mit mindestens einer Wiederholung Reserve. Optional +1 Wiederholung pro Arbeitssatz.'};
 if(targets.some(t=>t.loadType==='assisted'||t.weightKg===undefined))return null;
 const basis=targets[0].loadBasis??'total';if(targets.some(t=>(t.loadBasis??'total')!==basis))return null;
 const inventory=data.equipment?.[position.exerciseId],bar=basis==='total'?inventory?.barKg:undefined,plate=bar!==undefined?Math.min(...(inventory?.plates??[]).filter(p=>p.count>=2).map(p=>p.kg))*2:Infinity,step=Number.isFinite(plate)?plate:data.settings.progressionStepKg??data.settings.weightStep??2.5;
 const targetWeights=Object.fromEntries(targets.map(t=>[t.id,Math.round(((bar??0)+Math.ceil((t.weightKg!+step-(bar??0)-1e-8)/step)*step)*1000)/1000]));
 if(Object.values(targetWeights).some(kg=>kg>1000||bar!==undefined&&(!inventory||availablePlatePlan(kg,inventory)?.remainderKg!==0)))return null;
 return {...common,kind:'load',delta:step,targetWeights,reason:`Zwei vollständige Einheiten am oberen Ziel mit mindestens RIR 1. Optional mindestens +${step} kg ${basis==='perHand'?'je Hand':basis==='perSide'?'je Seite':'Gesamtlast'}; Zielwerte auf deinen Gewichtsschritt gerundet${bar===undefined?'':', mit deinem Scheibenbestand überprüft'}.`};
}
export function decideProgression(data:AthleteData,proposal:ProgressionProposal,accept:boolean,now=Date.now()):AthleteData {
 if(data.progressionDecisions?.some(d=>d.proposalKey===proposal.key))return data;
 const r=data.routines.find(r=>r.id===proposal.routineId),pos=r&&routinePositions(r).find(p=>p.id===proposal.positionId);if(!r||!pos)throw Error('Planposition nicht mehr vorhanden.');const fresh=progressionProposal(data,r,pos,now);if(!fresh||fresh.key!==proposal.key||fresh.kind!==proposal.kind||fresh.delta!==proposal.delta||JSON.stringify(fresh.targetWeights)!==JSON.stringify(proposal.targetWeights))throw Error('Die Grundlage hat sich verändert. Vorschlag neu ansehen.');
 let next=data;if(accept&&proposal.kind!=='hold'){const positions=routinePositions(r).map(p=>p.id!==pos.id?p:{...p,targets:p.targets.map(t=>t.kind==='warmup'?t:{...t,...(proposal.kind==='load'?{weightKg:proposal.targetWeights![t.id]}:proposal.kind==='reps'?{repsMin:(t.repsMin??1)+proposal.delta,repsMax:(t.repsMax??1)+proposal.delta}:proposal.kind==='time'?{durationSeconds:(t.durationSeconds??0)+proposal.delta}:{distanceMeters:(t.distanceMeters??0)+proposal.delta})})});const routine=projectPositions(r,positions);validateRoutineTargets(routine);next=commitPlanChange(data,{...data,routines:data.routines.map(x=>x.id===r.id?routine:x)},'progression',proposal.reason,now);}
 return {...next,progressionDecisions:[...(next.progressionDecisions??[]),{id:uid(),exerciseId:proposal.exerciseId,positionId:proposal.positionId,at:new Date(now).toISOString(),sessionIds:proposal.sessionIds,proposalKey:proposal.key,decision:accept?'accepted':'dismissed'}]};
}
