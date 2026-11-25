import {startObservedRest} from './workoutTiming';
import {buildPlannedRows,allowedReps} from './plannedTargets';
import {activeSegment,selectLiveExercise,validSegmentSize} from './segments';
import type {GymSet,SetKind,SetDraft,TrainingBlock,LiveWorkout,Workout,Routine} from '../data/schema';
export const setKinds: {id:SetKind;label:string}[]=[{id:'work',label:'Arbeit'},{id:'warmup',label:'Warm-up'},{id:'drop',label:'Drop'},{id:'failure',label:'Failure'},{id:'assisted',label:'Assistiert'},{id:'bodyweight',label:'Körpergewicht'},{id:'timed',label:'Zeit'},{id:'distance',label:'Distanz'}];
export const blockKinds: {id:TrainingBlock;label:string}[]=[{id:'straight',label:'Normal'},{id:'superset',label:'Superset'},{id:'giant',label:'Giant Set'},{id:'circuit',label:'Zirkel'},{id:'emom',label:'EMOM'},{id:'amrap',label:'AMRAP'},{id:'interval',label:'Intervalle'}];
export const blankDraft=():SetDraft=>({weight:'',reps:'',rir:'',kind:'work',duration:'',distance:'',rpe:'',side:'both',tempo:'',note:''});
const numeric=(value:string|undefined)=>{const s=(value||'').trim().replace(',','.');return /^\d+(\.\d+)?$/.test(s)?Number(s):NaN};
export function setFromDraft(d: SetDraft, exerciseId:string,id:string,at:string):GymSet {
 if(d.unilateral){const {unilateral,...plain}=d;const left=setFromDraft({...plain,...unilateral.left},exerciseId,id,at),right=setFromDraft({...plain,...unilateral.right},exerciseId,id,at);return {...left,side:'both',loadBasis:'perSide',unilateral:{left:{weightKg:left.weightKg,reps:left.reps,...(left.rir===undefined?{}:{rir:left.rir})},right:{weightKg:right.weightKg,reps:right.reps,...(right.rir===undefined?{}:{rir:right.rir})}}};}
 const kind=d.kind||'work'; const time=kind==='timed', distance=kind==='distance', body=kind==='bodyweight';
 const weight=body||time||distance?0:numeric(d.weight), reps=time||distance?0:numeric(d.reps);
 const duration=numeric(d.duration), meters=numeric(d.distance), rir=numeric(d.rir), rpe=numeric(d.rpe);
 if(!exerciseId||!id||!Number.isFinite(Date.parse(at)))throw Error('Übung oder Zeitpunkt fehlt.');
 if(!Number.isFinite(weight)||weight<0||weight>1000||(!time&&!distance&&(!Number.isInteger(reps)||reps<1||reps>150)))throw Error('Gewicht 0–1000 kg und 1–150 ganze Wiederholungen eingeben.');
 if(time&&(!Number.isFinite(duration)||duration<=0||duration>86400))throw Error('Gültige Dauer in Sekunden eingeben (max. 86400).');
 if(distance&&(!Number.isFinite(meters)||meters<=0||meters>300000))throw Error('Gültige Distanz in Metern eingeben.');
 if(distance&&d.duration?.trim()&&(!Number.isFinite(duration)||duration<=0||duration>86400))throw Error('Dauer in Sekunden prüfen.');
 if(!time&&!distance&&d.rir?.trim()&&(!Number.isInteger(rir)||rir<0||rir>5))throw Error('RIR: 0–5 ganze Wiederholungen.');
 if(d.rpe?.trim()&&(!Number.isFinite(rpe)||rpe<1||rpe>10))throw Error('RPE: 1–10.');
 return {id,exerciseId,at,kind,weightKg:weight,reps,...(d.loadBasis?{loadBasis:d.loadBasis}:{}),...(time||distance&&Number.isFinite(duration)?{durationSeconds:duration}:{}),...(distance?{distanceMeters:meters}:{}),...(!time&&!distance&&Number.isFinite(rir)?{rir}:{}),...(Number.isFinite(rpe)?{rpe}:{}),side:d.side||'both',tempo:(d.tempo||'').slice(0,60),note:(d.note||'').slice(0,280)};
}
export function draftFromSet(s:GymSet):SetDraft {return {...blankDraft(),...(s.loadBasis?{loadBasis:s.loadBasis}:{}),...(s.unilateral?{unilateral:{left:{weight:String(s.unilateral.left.weightKg),reps:String(s.unilateral.left.reps),rir:s.unilateral.left.rir===undefined?'':String(s.unilateral.left.rir)},right:{weight:String(s.unilateral.right.weightKg),reps:String(s.unilateral.right.reps),rir:s.unilateral.right.rir===undefined?'':String(s.unilateral.right.rir)}}}:{}),kind:s.kind||'work',weight:String(s.weightKg),reps:s.reps?String(s.reps):'',rir:s.rir==null?'':String(s.rir),rpe:s.rpe==null?'':String(s.rpe),duration:s.durationSeconds==null?'':String(s.durationSeconds),distance:s.distanceMeters==null?'':String(s.distanceMeters),side:s.side||'both',tempo:s.tempo||'',note:s.note||''};}
export function describeSet(s:GymSet):string {if(s.unilateral)return `Links ${s.unilateral.left.weightKg} kg × ${s.unilateral.left.reps} · Rechts ${s.unilateral.right.weightKg} kg × ${s.unilateral.right.reps}${s.role==='warmup'?' · Warm-up':''}`;const label=setKinds.find(x=>x.id===s.kind)?.label||'Arbeit';const value=s.kind==='timed'?`${s.durationSeconds} s`:s.kind==='distance'?`${s.distanceMeters} m${s.durationSeconds?` · ${s.durationSeconds} s`:''}`:s.kind==='bodyweight'?`${s.reps} Wdh. · BW`:`${s.weightKg} kg × ${s.reps}`;return `${value} · ${label}${s.loadBasis==='perHand'?' · kg pro Hand':''}${s.role==='warmup'&&s.kind!=='warmup'?' · Warm-up':''}${s.rir===undefined?'':` · RIR ${s.rir}`}${s.rpe===undefined?'':` · RPE ${s.rpe}`}${s.side==='left'?' · L':s.side==='right'?' · R':''}`;}
export const weightedSet=(s:GymSet)=>!['timed','distance','bodyweight','assisted'].includes(s.kind||'work')&&(s.unilateral?[s.unilateral.left,s.unilateral.right].some(side=>side.weightKg>0&&side.reps>0):s.weightKg>0&&s.reps>0);
export const strengthSet=(s:GymSet)=>weightedSet(s)&&!s.unilateral&&s.role!=='warmup'&&s.kind!=='warmup'&&s.reps<=12&&(!s.side||s.side==='both');
export function logTrainingSet(live:LiveWorkout,set:GymSet,now:number):LiveWorkout {
 if(live.pausedAt!==undefined||!live.exerciseIds.includes(set.exerciseId)||live.sets.some(s=>s.id===set.id))return live;
 const row=live.plannedRows?.find(r=>r.id===set.id&&r.exerciseId===set.exerciseId);
 if(live.plannedRows){
  if(!row||set.plannedRowId!==row.id)throw Error('Zusätzliche Sätze sind nur über + Satz möglich.');
  if(row.status==='completed')return live;
  const maximum=allowedReps(row);
  if(maximum!==undefined&&Math.max(set.reps,set.unilateral?.right.reps??0)>maximum)throw Error(`Geplant: ${row.plannedRepsMax} · + Wdh. erlaubt mehr.`);
  const kind=row.targetMode==='time'?'timed':row.targetMode==='distance'?'distance':row.loadType==='bodyweight'?'bodyweight':row.loadType==='assisted'?'assisted':row.kind;
  if((set.kind??'work')!==kind)throw Error('Satztyp stimmt nicht mit der geplanten Zeile überein.');
 }
 const position=row?.planPositionId,positions=live.routineSnapshot?.positions;
 const segment=position?live.segments?.find(s=>s.positionIds?.includes(position)||!s.positionIds&&s.exerciseIds.includes(set.exerciseId)):activeSegment(live,set.exerciseId),positionKeys=segment?.positionIds??(!live.segments&&positions?positions.filter(p=>p.enabled!==false).map(p=>p.id):undefined),ids=positionKeys??segment?.exerciseIds??live.exerciseIds;
 const block=segment?.kind||(live.segments?'straight':live.block||'straight'),index=ids.indexOf(positionKeys?position??'':set.exerciseId),group=['superset','giant','circuit'].includes(block),last=index===ids.length-1;
 const nextKey=group?ids[(index+1)%ids.length]:(positionKeys?position??set.exerciseId:set.exerciseId),nextPosition=positionKeys?nextKey:position;
 const next=positionKeys?(live.plannedRows?.find(r=>r.planPositionId===nextKey&&r.status!=='completed')??live.plannedRows?.find(r=>r.planPositionId===nextKey))?.exerciseId??set.exerciseId:nextKey;
 const rest=group&&!last?null:now+(row?.targetRestSeconds??live.prescriptions?.[set.exerciseId]?.restSeconds??live.restSeconds)*1000;
 const updated={...selectLiveExercise(live,next,now),activePositionId:nextPosition,sets:[...live.sets,set],plannedRows:live.plannedRows?.map(r=>r.id===set.id?{...r,status:'completed' as const,completedAt:set.at}:r),setSequence:(live.setSequence??live.sets.length)+1};
 return startObservedRest(updated,rest,now,`${set.id.slice(0,110)}:rest:${now}`,set.id);
}
export function pauseTraining(live:LiveWorkout,now:number):LiveWorkout {return live.pausedAt?live:{...live,pausedAt:now,status:'paused',restUntil:null};}
export function resumeTraining(live:LiveWorkout,now:number):LiveWorkout {if(!live.pausedAt)return live;const elapsed=Math.max(0,now-live.pausedAt);return {...live,pausedAt:undefined,status:'active',pausedMs:(live.pausedMs||0)+elapsed,segmentStartedAt:live.segmentStartedAt===undefined?undefined:live.segmentStartedAt+elapsed,blockEndsAt:live.blockEndsAt?live.blockEndsAt+elapsed:undefined};}
export function blockClock(live:LiveWorkout,now:number){const t=live.pausedAt||now;const elapsed=Math.max(0,t-Date.parse(live.startedAt)-(live.pausedMs||0));const period=(live.blockSeconds||60)*1000;return {elapsed,round:Math.floor(elapsed/period)+1,left:live.block==='amrap'?Math.max(0,Math.ceil(((live.blockEndsAt||t)-t)/1000)):Math.ceil((period-elapsed%period)/1000)};}
export function warmupPlan(kg:number,bar:number){if(!Number.isFinite(kg)||!Number.isFinite(bar)||bar<=0||kg<bar||kg>1000)return [];return [...new Set([bar,...[.4,.6,.8].map(f=>Math.max(bar,Math.floor(kg*f/2.5)*2.5))])].filter(x=>x<kg).map((weight,i)=>({weight,reps:[8,5,3,1][i]||1}));}
export function sessionReview(w:Workout){const weighted=w.sets.filter(s=>weightedSet(s)&&s.kind!=='warmup');return {sets:w.sets.length,volume:weighted.reduce((n,s)=>n+s.weightKg*s.reps,0),minutes:Math.max(0,Math.round((Date.parse(w.finishedAt)-Date.parse(w.startedAt)-(w.pausedMs||0))/60000)),exercises:new Set(w.sets.map(s=>s.exerciseId)).size};}

export function makeLive(routine:Routine|undefined,rest:number,id:string,now=Date.now()):LiveWorkout {
 if(!routine?.id||!routine.exerciseIds.length)throw Error('Wähle einen vorhandenen Plan-Tag. Freies Training ist nicht verfügbar.');
 if(!id||id.length>150||!Number.isFinite(now))throw Error('Ungültiger Trainingsstart.');
 const snapshot:Routine=JSON.parse(JSON.stringify(routine)),plannedRows=buildPlannedRows(snapshot,id),interval=snapshot.blockSeconds||60;
 const activePositions=new Set(plannedRows.map(r=>r.planPositionId)),segments=snapshot.segments?.flatMap(segment=>{if(!segment.positionIds)return [JSON.parse(JSON.stringify(segment))];const positionIds=segment.positionIds.filter(id=>activePositions.has(id));if(!positionIds.length)return [];const exerciseIds=[...new Set(positionIds.map(id=>plannedRows.find(r=>r.planPositionId===id)!.exerciseId))];return [{...segment,positionIds,exerciseIds,kind:validSegmentSize(segment.kind,positionIds.length)?segment.kind:'straight' as const}];});
 return {id,createdAt:new Date(now).toISOString(),status:'active',setSequence:0,name:snapshot.name,routineId:snapshot.id,startedAt:new Date(now).toISOString(),exerciseIds:[...new Set(plannedRows.map(r=>r.exerciseId))],activePositionId:plannedRows[0]?.planPositionId,sets:[],restUntil:null,restSeconds:snapshot.restSeconds||rest,activeExerciseId:plannedRows[0]?.exerciseId,block:snapshot.block||'straight',blockSeconds:interval,...(segments?.length?{segments,segmentStartedAt:now}:{}),prescriptions:snapshot.prescriptions?JSON.parse(JSON.stringify(snapshot.prescriptions)):undefined,routineSnapshot:snapshot,plannedRows,...(snapshot.block==='amrap'?{blockEndsAt:now+interval*1000}:{})};
}
export function realRecords(workouts:Workout[]){const max=new Map<string,number>(),tickets:{sessionId:string;setId:string;exerciseId:string;kg:number;previousKg:number;date:string}[]=[];for(const w of [...workouts].sort((a,b)=>Date.parse(a.finishedAt)-Date.parse(b.finishedAt))){const top=new Map<string,GymSet>();for(const s of w.sets){if(!strengthSet(s))continue;const key=s.exerciseId+'|'+(s.loadBasis??'total'),old=top.get(key);if(!old||s.weightKg>old.weightKg)top.set(key,s);}for(const [id,s] of top){const previous=max.get(id);if(previous!==undefined&&s.weightKg>previous)tickets.push({sessionId:w.id,setId:s.id,exerciseId:s.exerciseId,kg:s.weightKg,previousKg:previous,date:w.finishedAt});max.set(id,Math.max(previous??0,s.weightKg));}}return tickets.reverse();}
