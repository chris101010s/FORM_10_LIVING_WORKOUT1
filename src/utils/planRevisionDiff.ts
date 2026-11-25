import type {PlanRevision} from '../features/workout/secondPassTypes';
import {routinePositions,targetLabel} from './plannedTargets';
import {stableValue} from './planOperations';
export type RevisionDifference={field:string;before:string;after:string};
const text=(v:unknown)=>v===undefined||v===null||v===''?'—':Array.isArray(v)?v.join(', '):String(v);
/** Compare user-facing prescription values, ignoring fresh copy IDs and revision metadata. */
export function comparePlanRevisions(before:PlanRevision,after:PlanRevision):RevisionDifference[]{
 const changes:RevisionDifference[]=[],put=(field:string,a:unknown,b:unknown)=>{if(stableValue(a)!==stableValue(b))changes.push({field,before:text(a),after:text(b)})};
 for(const key of ['name','description','start','end','weeks','status','deloadWeeks'] as const)put('Plan · '+({name:'Name',description:'Beschreibung',start:'Start',end:'Ende',weeks:'Zykluswochen',status:'Status',deloadWeeks:'Deloadwochen'}[key]),before.program[key],after.program[key]);
 const keys=new Set([...before.program.days,...after.program.days].map(d=>`${d.week}:${d.day}`));
 for(const key of keys){const oldDay=before.program.days.find(d=>`${d.week}:${d.day}`===key),newDay=after.program.days.find(d=>`${d.week}:${d.day}`===key),slot=`Woche ${Number(key.split(':')[0])+1} · ${['So','Mo','Di','Mi','Do','Fr','Sa'][Number(key.split(':')[1])]}`,a=before.routines.find(r=>r.id===oldDay?.routineId),b=after.routines.find(r=>r.id===newDay?.routineId);put(slot+' · Tagart',oldDay?.kind,newDay?.kind);put(slot+' · Trainingstag',a?.name,b?.name);put(slot+' · Standardpause',a?.restSeconds,b?.restSeconds);put(slot+' · Blöcke',a?.segments?.map(s=>`${s.kind} ${s.seconds}s / ${s.positionIds?.length??s.exerciseIds.length}`)??a?.block,b?.segments?.map(s=>`${s.kind} ${s.seconds}s / ${s.positionIds?.length??s.exerciseIds.length}`)??b?.block);
  const ap=a?routinePositions(a):[],bp=b?routinePositions(b):[];for(let i=0;i<Math.max(ap.length,bp.length);i++){const x=ap[i],y=bp[i],label=slot+' · Übung '+(i+1);put(label,x?.exerciseId,y?.exerciseId);put(label+' · aktiv',x?.enabled!==false,y?.enabled!==false);put(label+' · Ersatz',x?.replacementExerciseIds,y?.replacementExerciseIds);put(label+' · Hinweis',x?.note,y?.note);for(let j=0;j<Math.max(x?.targets.length??0,y?.targets.length??0);j++){const u=x?.targets[j],v=y?.targets[j],row=label+' · Satz '+(j+1);put(row+' · Ziel',u?targetLabel(u):undefined,v?targetLabel(v):undefined);for(const field of ['kind','targetMode','loadType','loadBasis','rir','rpe','restSeconds','tempo','note','estimatedSeconds'] as const)put(row+' · '+({kind:'Satzart',targetMode:'Einheit',loadType:'Lastart',loadBasis:'Lastbasis',rir:'RIR',rpe:'RPE',restSeconds:'Pause',tempo:'Tempo',note:'Notiz',estimatedSeconds:'geschätzte Dauer'}[field]),u?.[field],v?.[field]);}}
 }
 return changes;
}
