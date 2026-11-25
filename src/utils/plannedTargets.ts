import type {PlannedSetRow,Prescription,Routine} from '../data/schema';
import type {PlannedSetTarget,RoutinePosition} from '../features/workout/secondPassTypes';
export function prescriptionMode(p:Prescription):PlannedSetRow['targetMode'] {return p.targetMode??(p.kind==='timed'?'time':p.kind==='distance'?'distance':p.kind==='failure'?'amrap':'reps');}
export function validatePrescriptionForStart(p:Prescription|undefined,exerciseId:string):asserts p is Prescription {
 if(!p||!Number.isInteger(p.sets)||Number(p.sets)<1||Number(p.sets)>100)throw Error(`Für ${exerciseId} zuerst die geplante Satzanzahl im Plan festlegen.`);
 if(p.warmupSets!==undefined&&(!Number.isInteger(p.warmupSets)||p.warmupSets<0||p.warmupSets>30))throw Error('Aufwärmsätze: 0–30 ganze Sätze.');
 const mode=prescriptionMode(p),max=p.repsMax??p.reps,min=p.repsMin??p.reps;
 if(p.rir!==undefined&&(!Number.isInteger(p.rir)||p.rir<0||p.rir>5))throw Error('RIR: 0–5 ganze Wiederholungen.');
 if(p.rpe!==undefined&&(!Number.isFinite(p.rpe)||p.rpe<1||p.rpe>10))throw Error('RPE: 1–10.');
 if(p.kind&&((mode==='reps'||mode==='amrap')&&(p.kind==='timed'||p.kind==='distance')||mode==='time'&&p.kind!=='timed'&&p.kind!=='warmup'||mode==='distance'&&p.kind!=='distance'&&p.kind!=='warmup'))throw Error('Satztyp und Zieleinheit passen nicht zusammen.');
 if(mode==='reps'&&(p.repsMin!==undefined||p.repsMax!==undefined)&&(!Number.isInteger(p.repsMin)||!Number.isInteger(p.repsMax)))throw Error('Ein Wiederholungsbereich benötigt eine untere und eine obere Grenze.');
 if(mode==='reps'&&(!Number.isInteger(max)||Number(max)<1||Number(max)>150||(min!==undefined&&(!Number.isInteger(min)||min<1||min>Number(max)))))throw Error(`Für ${exerciseId} Wiederholungen oder einen gültigen Wiederholungsbereich festlegen.`);
 if(mode==='time'&&(!Number.isFinite(p.durationSeconds)||Number(p.durationSeconds)<=0||Number(p.durationSeconds)>86400))throw Error('Geplante Dauer in Sekunden fehlt oder ist ungültig.');
 if(mode==='distance'&&(!Number.isFinite(p.distanceMeters)||Number(p.distanceMeters)<=0||Number(p.distanceMeters)>300000))throw Error('Geplante Distanz in Metern fehlt oder ist ungültig.');
 if(p.restSeconds!==undefined&&(!Number.isInteger(p.restSeconds)||p.restSeconds<15||p.restSeconds>600))throw Error('Geplante Satzpause: 15–600 Sekunden.');
}
export function prescriptionLabel(p:Prescription|undefined):string {
 if(!p)return 'Sollwerte im Plan ergänzen';const mode=prescriptionMode(p),max=p.repsMax??p.reps,min=p.repsMin??p.reps;
 const target=mode==='amrap'?'AMRAP':mode==='time'?`${p.durationSeconds??'—'} s`:mode==='distance'?`${p.distanceMeters??'—'} m`:min!==undefined&&max!==undefined&&min!==max?`${min}–${max}`:`${max??'—'}`;
 return `${p.sets??'—'} × ${target}${p.warmupSets?` · ${p.warmupSets} Warm-up`:''}`;
}
/** Read-only compatibility adapter; legacy plans are not rewritten merely by opening them. */
export function routinePositions(routine:Routine):RoutinePosition[]{
 if(routine.positions)return routine.positions;
 return routine.exerciseIds.map((exerciseId,index)=>{const p=routine.prescriptions?.[exerciseId]??{},mode=prescriptionMode(p),kind=p.kind??(mode==='time'?'timed':mode==='distance'?'distance':mode==='amrap'?'failure':'work'),warmups=p.warmupSets??0;
  return {id:`legacy-position-${index}`,exerciseId,targets:Array.from({length:(p.sets??0)+warmups},(_,n)=>({id:`legacy-target-${index}-${n}`,kind:n<warmups?'warmup':kind,targetMode:mode,loadType:p.kind==='bodyweight'?'bodyweight':p.kind==='assisted'?'assisted':'weighted',...(mode==='reps'?{repsMin:p.repsMin??p.reps,repsMax:p.repsMax??p.reps}:{}),...(p.rir===undefined?{}:{rir:p.rir}),...(p.rpe===undefined?{}:{rpe:p.rpe}),restSeconds:p.restSeconds??routine.restSeconds,...(p.durationSeconds===undefined?{}:{durationSeconds:p.durationSeconds}),...(p.distanceMeters===undefined?{}:{distanceMeters:p.distanceMeters}),...(p.note?{note:p.note}:{})}))};
 });
}
export function validateSetTarget(target:PlannedSetTarget):void {
 if(!target.id||target.id.length>150)throw Error('Die Satzvorgabe braucht eine eindeutige ID.');
 validatePrescriptionForStart({sets:1,kind:target.targetMode==='time'?'timed':target.targetMode==='distance'?'distance':target.kind,targetMode:target.targetMode,repsMin:target.repsMin,repsMax:target.repsMax,rir:target.rir,rpe:target.rpe,restSeconds:target.restSeconds,durationSeconds:target.durationSeconds,distanceMeters:target.distanceMeters},target.id);
 if(target.weightKg!==undefined&&(!Number.isFinite(target.weightKg)||target.weightKg<0||target.weightKg>1000))throw Error('Zielgewicht: 0–1000 kg.');
 if(target.estimatedSeconds!==undefined&&(!Number.isFinite(target.estimatedSeconds)||target.estimatedSeconds<=0||target.estimatedSeconds>3600))throw Error('Geschätzte Satzdauer: 1–3600 Sekunden.');
 if(target.unilateral&&(target.targetMode==='time'||target.targetMode==='distance'))throw Error('Getrennte Seitenwerte sind für Wiederholungen vorgesehen. Zeit/Distanz als getrennte Positionen planen.');
}
export function validateRoutineTargets(routine:Routine):void {
 if(!routine.positions){if(!routine.exerciseIds.length)throw Error('Der Plan-Tag enthält noch keine Übungen.');for(const id of routine.exerciseIds)validatePrescriptionForStart(routine.prescriptions?.[id],id);return;}
 const positions=routine.positions;
 if(!positions.length||positions.length>200||new Set(positions.map(p=>p.id)).size!==positions.length)throw Error('Planpositionen müssen eindeutig sein (1–200).');
 if(!positions.some(p=>p.enabled!==false))throw Error('Mindestens eine Übung muss für diesen Trainingstag aktiv sein.');
 const targets=new Set<string>();
 for(const p of positions){if(p.targets.filter(t=>t.kind==='warmup').length>30||p.targets.filter(t=>t.kind!=='warmup').length>100)throw Error('Pro Position höchstens 100 Arbeitssätze und 30 Warm-ups.');if(!p.id||p.id.length>150||!p.exerciseId||p.exerciseId.length>150||!p.targets.length||p.targets.length>130)throw Error('Jede Planposition braucht eine Übung und 1–130 Satzvorgaben.');for(const t of p.targets){if(targets.has(t.id))throw Error('Satzvorgaben brauchen eigene IDs.');targets.add(t.id);validateSetTarget(t);}}if(targets.size>5000)throw Error('Höchstens 5000 Satzvorgaben pro Trainingstag.');
}
export function projectPositions(routine:Routine,positions:RoutinePosition[]):Routine {
 const prescriptions:Record<string,Prescription>={};
 for(const p of positions){if(prescriptions[p.exerciseId])continue;const work=p.targets.filter(t=>t.kind!=='warmup'),t=work[0]??p.targets[0];if(t)prescriptions[p.exerciseId]={sets:Math.max(1,work.length),warmupSets:p.targets.filter(t=>t.kind==='warmup').length,kind:t.targetMode==='time'?'timed':t.targetMode==='distance'?'distance':t.loadType==='bodyweight'?'bodyweight':t.loadType==='assisted'?'assisted':t.kind,targetMode:t.targetMode,...(t.targetMode==='reps'?{repsMin:t.repsMin,repsMax:t.repsMax}:{}),restSeconds:t.restSeconds,rir:t.rir,rpe:t.rpe,durationSeconds:t.durationSeconds,distanceMeters:t.distanceMeters,note:p.note};}
 return {...routine,positions,exerciseIds:[...new Set(positions.map(p=>p.exerciseId))],prescriptions};
}
export function targetLabel(t:PlannedSetTarget):string {const unit=t.targetMode==='amrap'?'AMRAP':t.targetMode==='time'?`${t.durationSeconds??'—'} s`:t.targetMode==='distance'?`${t.distanceMeters??'—'} m`:t.repsMin===t.repsMax?`${t.repsMax??'—'} Wdh.`:`${t.repsMin??'—'}–${t.repsMax??'—'} Wdh.`;return `${unit}${t.weightKg===undefined?'':` · Ziel ${t.weightKg} kg`}${t.kind==='warmup'?' · Warm-up':''}${t.unilateral?' · links/rechts':''}`;}
export function positionLabel(p:RoutinePosition):string{return p.targets.map(targetLabel).join(' / ');}
export function buildPlannedRows(routine:Routine,sessionId:string):PlannedSetRow[] {
 validateRoutineTargets(routine);const rows:PlannedSetRow[]=[];
 routinePositions(routine).forEach((position,index)=>{if(position.enabled===false)return;
  position.targets.forEach((t,n)=>{rows.push({id:`${sessionId.slice(0,110)}:row:${rows.length}`,exerciseId:position.exerciseId,exerciseInstanceId:`${sessionId.slice(0,110)}:exercise:${index}`,planPositionId:position.id,targetId:t.id,plannedIndex:n,kind:t.kind,targetMode:t.targetMode,loadType:t.loadType??(t.kind==='bodyweight'?'bodyweight':t.kind==='assisted'?'assisted':'weighted'),loadBasis:t.loadBasis,unilateral:t.unilateral,plannedRepsMin:t.repsMin,plannedRepsMax:t.repsMax,plannedDurationSeconds:t.durationSeconds,plannedDistanceMeters:t.distanceMeters,targetWeightKg:t.weightKg,targetRestSeconds:t.restSeconds??routine.restSeconds,targetRir:t.rir,targetRpe:t.rpe,targetTempo:t.tempo,targetNote:t.note,estimatedSeconds:t.estimatedSeconds,extraRepAllowance:0,isExtraSet:false,draft:{weight:'',reps:'',rir:t.rir===undefined?'':String(t.rir),rpe:t.rpe===undefined?'':String(t.rpe),duration:'',distance:'',side:'both',tempo:t.tempo??'',note:'',kind:t.kind,loadBasis:t.loadBasis,...(t.unilateral?{unilateral:{left:{weight:'',reps:''},right:{weight:'',reps:''}}}:{})},status:'draft'});});
 });return rows;
}
export function allowedReps(row:PlannedSetRow):number|undefined{return row.targetMode==='reps'&&row.plannedRepsMax!==undefined?row.plannedRepsMax+row.extraRepAllowance:undefined;}
