import type {AthleteData,Program,Routine,Exercise} from '../data/schema';
import {emptyData} from '../data/schema';
import {validateRestoredData} from '../data/validation';
import {newId} from './plans';

export type PlanBundle={format:'FORM-Program';version:1|2;program:Program;routines:Routine[];exercises:Exercise[]};
export function exportPlanBundle(data:AthleteData,program:Program):PlanBundle{
 const routines=data.routines.filter(r=>program.days.some(d=>d.routineId===r.id)),ids=new Set(routines.flatMap(r=>r.exerciseIds));
 return {format:'FORM-Program',version:2,program,routines,exercises:data.exercises.filter(e=>ids.has(e.id))};
}
export function parsePlanBundle(raw:string):PlanBundle{
 if(raw.length>2_000_000)throw Error('Plan-Datei ist zu groß (maximal 2 MB).');
 const x=JSON.parse(raw) as Record<string,unknown>;
 if(!x||typeof x!=='object'||(x.format!==undefined&&x.format!=='FORM-Program')||(x.version!==undefined&&x.version!==1&&x.version!==2)||!x.program||!Array.isArray(x.routines)||!Array.isArray(x.exercises))throw Error('Keine kompatible FORM-Plansicherung (Version 1 oder 2).');
 const checked=validateRestoredData({...emptyData(),routines:x.routines,exercises:x.exercises,programs:[x.program]});
 return {format:'FORM-Program',version:2,program:{...checked.programs![0],status:'paused'},routines:checked.routines,exercises:checked.exercises};
}
const stable=(value:unknown):string=>JSON.stringify(value,(_key,v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export function planImportConflicts(data:AthleteData,bundle:PlanBundle):string[]{
 const conflicts:string[]=[];
 for(const r of bundle.routines){const old=data.routines.find(x=>x.id===r.id);if(old&&stable(old)!==stable(r))conflicts.push('Trainingstag: '+r.name)}
 for(const e of bundle.exercises){const old=data.exercises.find(x=>x.id===e.id);if(old&&stable(old)!==stable(e))conflicts.push('Übung: '+e.name)}
 const old=(data.programs??[]).find(p=>p.id===bundle.program.id);
 if(old&&stable({...old,status:'paused'})!==stable(bundle.program))conflicts.push('Plan: '+bundle.program.name);
 return conflicts;
}
/** Preserves imported IDs by default. Explicit copy creates new IDs without touching old data. */
export function applyPlanBundle(data:AthleteData,bundle:PlanBundle,copy=false,id:()=>string=newId):AthleteData{
 if(!copy&&planImportConflicts(data,bundle).length)throw Error('IDs mit unterschiedlichen Inhalten gefunden. Importiere bewusst als Kopie.');
 const used=new Set([...data.routines.map(x=>x.id),...data.exercises.map(x=>x.id),...(data.programs??[]).map(x=>x.id),...data.routines.flatMap(r=>r.segments?.map(s=>s.id)??[]),...data.routines.flatMap(r=>r.positions?.flatMap(p=>[p.id,...p.targets.map(t=>t.id)])??[])]);
 const allocate=(prefix='')=>{for(let attempt=0;attempt<64;attempt++){const next=prefix+id();if(next&&next.length<=150&&!used.has(next)){used.add(next);return next}}throw Error('Für die Kopie konnten keine eindeutigen IDs erzeugt werden. Der bestehende Plan wurde nicht verändert.');};
 const rm=new Map(bundle.routines.map(r=>[r.id,copy?allocate():r.id])),em=new Map(bundle.exercises.map(e=>[e.id,copy?allocate('custom:'):e.id]));
 const routines=bundle.routines.map(r=>{const positions=r.positions?.map(p=>({...p,id:copy?allocate():p.id,exerciseId:em.get(p.exerciseId)??p.exerciseId,replacementExerciseIds:p.replacementExerciseIds?.map(id=>em.get(id)??id),targets:p.targets.map(t=>({...t,id:copy?allocate():t.id}))})),pm=new Map(r.positions?.map((p,i)=>[p.id,positions![i].id]));return {...r,id:rm.get(r.id)!,positions,exerciseIds:r.exerciseIds.map(e=>em.get(e)||e),segments:r.segments?.map(s=>({...s,id:copy?allocate():s.id,exerciseIds:s.exerciseIds.map(e=>em.get(e)||e),positionIds:s.positionIds?.map(id=>pm.get(id)??id)})),prescriptions:r.prescriptions?Object.fromEntries(Object.entries(r.prescriptions).map(([key,value])=>[em.get(key)||key,value])):undefined}});
 const exercises=bundle.exercises.map(e=>({...e,id:em.get(e.id)!}));
 const program={...bundle.program,revisionId:undefined,id:copy?allocate():bundle.program.id,status:'paused' as const,days:bundle.program.days.map(day=>({...day,routineId:day.routineId?rm.get(day.routineId)!:null}))};
 const addUnique=<T extends {id:string}>(old:T[],incoming:T[])=>[...old,...incoming.filter(item=>!old.some(x=>x.id===item.id))];
 return validateRestoredData({...data,routines:addUnique(data.routines,routines),exercises:addUnique(data.exercises,exercises),programs:addUnique(data.programs??[],[program])});
}
