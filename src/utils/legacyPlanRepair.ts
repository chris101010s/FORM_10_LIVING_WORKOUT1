import type {AthleteData,Exercise,Prescription,Routine} from '../data/schema';
import {prescriptionLabel,validatePrescriptionForStart,validateRoutineTargets} from './plannedTargets';

type Goal={min:number;max:number;unit:'reps'|'time'|'distance'};
function namedGoal(name:string):Goal|undefined {
 const goals:Goal[]=[];
 for(const part of name.matchAll(/\(([^()]*)\)/g)){
  const match=part[1].match(/^\s*(\d{1,6})(?:\s*[-–—]\s*(\d{1,6}))?\s*(wdh\.?|wiederholungen|sekunden|sek\.?|s|minuten|min\.?|meter|m)(?=$|[\s;,.])/i);
  if(!match)continue;
  const unit=match[3].toLowerCase(),min=Number(match[1]),max=Number(match[2]??match[1]);
  if(min<1||max<min)continue;
  const scale=unit.startsWith('min')?60:1;
  goals.push({min:min*scale,max:max*scale,unit:unit.startsWith('wdh')||unit==='wiederholungen'?'reps':unit.startsWith('s')||unit.startsWith('min')?'time':'distance'});
 }
 return goals.length===1?goals[0]:undefined;
}
function valid(p:Prescription|undefined,id:string):p is Prescription {
 try{validatePrescriptionForStart(p,id);return true}catch{return false}
}
function addRangeNote(p:Prescription,g:Goal):Prescription {
 if(g.min===g.max)return p;
 const note='Zielbereich aus Übungsname: '+g.min+'–'+g.max+(g.unit==='time'?' s':' m');
 return {...p,note:[p.note,note].filter(Boolean).join(' · ').slice(0,1000)};
}
/** Only old unstructured targets. Never alter a valid explicitly typed target or invent a number. */
export function repairLegacyRoutine(routine:Routine,exercises:Exercise[],allowOpenPushups=false){
 const changes:string[]=[],unresolved:string[]=[];
 if(routine.positions){
  try{validateRoutineTargets(routine)}catch(e){unresolved.push(routine.name+': '+(e as Error).message)}
  return {routine,changes,unresolved};
 }
 const prescriptions={...routine.prescriptions};
 for(const id of routine.exerciseIds){
  const p=prescriptions[id],name=exercises.find(e=>e.id===id)?.name??id;
  let candidate:Prescription|undefined;
  const oldValid=valid(p,id);
  if(p&&Number.isInteger(p.sets)&&p.sets!>=1&&p.sets!<=100&&p.targetMode===undefined&&p.kind===undefined){
   const noRep=p.reps===undefined&&p.repsMin===undefined&&p.repsMax===undefined;
   const noOther=p.durationSeconds===undefined&&p.distanceMeters===undefined;
   const g=namedGoal(name);
   if(noRep&&p.durationSeconds!==undefined&&p.distanceMeters===undefined){
    candidate={...p,kind:'timed',targetMode:'time'};
   }else if(noRep&&p.distanceMeters!==undefined&&p.durationSeconds===undefined){
    candidate={...p,kind:'distance',targetMode:'distance'};
   }else if(noOther&&g?.unit==='reps'&&p.repsMin===undefined&&p.repsMax===undefined&&(p.reps===undefined||p.reps===g.min)){
    if(!oldValid||g.min!==g.max)candidate={...p,targetMode:'reps',repsMin:g.min,repsMax:g.max};
   }else if(noRep&&noOther&&g?.unit==='time'&&g.max<=86400){
    candidate=addRangeNote({...p,kind:'timed',targetMode:'time',durationSeconds:g.min},g);
   }else if(noRep&&noOther&&g?.unit==='distance'&&g.max<=300000){
    candidate=addRangeNote({...p,kind:'distance',targetMode:'distance',distanceMeters:g.min},g);
   }else if(noRep&&noOther&&!g&&allowOpenPushups&&/^(liegestütze|push[- ]?ups?)$/i.test(name.trim())){
    candidate={...p,kind:'bodyweight',targetMode:'amrap',rir:p.rir??2};
   }
  }
  if(candidate&&valid(candidate,id)){
   prescriptions[id]=candidate;changes.push(routine.name+' · '+name+': '+prescriptionLabel(candidate)+(candidate.targetMode==='amrap'?' · RIR '+candidate.rir:''));
  }else if(!oldValid){unresolved.push(routine.name+' · '+name);}
 }
 const repaired=changes.length?{...routine,prescriptions}:routine;
 if(!routine.exerciseIds.length)unresolved.push(routine.name+': keine Übungen.');
 return {routine:repaired,changes,unresolved};
}
export function previewLegacyProgramRepair(data:Pick<AthleteData,'routines'|'exercises'|'programs'>,programId:string,allowOpenPushups=false){
 const program=data.programs?.find(p=>p.id===programId);
 if(!program)throw Error('Plan nicht mehr vorhanden.');
 const ids=new Set(program.days.map(d=>d.routineId)),changes:string[]=[],unresolved:string[]=[];
 const routines=data.routines.map(r=>{
  if(!ids.has(r.id))return r;
  const result=repairLegacyRoutine(r,data.exercises,allowOpenPushups);
  changes.push(...result.changes);unresolved.push(...result.unresolved);
  return result.routine;
 });
 return {routines,changes,unresolved};
}
