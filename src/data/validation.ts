import {validateSegments} from '../utils/segments';
import type {AthleteData,WeightEntry,BodyScan,Exercise,Routine,GymSet,Workout,LiveWorkout,Cardio,Performance,Habit,Nutrition,Measurement,AthleteGoal,TrainingPlan,MeasurementType,AthleteGoalMetric,RecoveryEntry,SetDraft,SetKind,TrainingBlock,Prescription,PlannedSetRow,PlannedWorkoutState} from './schema';
import {emptyData} from './schema';
import {validatePrograms} from '../utils/plans';
import {healthSpecs} from '../utils/health';
import {validateHealthNutritionState} from '../utils/nutritionSync';
import {validateHealthImportedProvenance} from '../utils/healthImport';
import type {HealthMetric} from './schema';
import {validateSecondPassSettings,validatePositionTargets,validateSplit,validateRowExtensions,validateSessionExtensions,validatePositionSnapshot,validateRootExtensions,validateExerciseExtensions} from './secondPassValidation';

type Rec=Record<string,unknown>;
const record=(v:unknown):v is Rec=>!!v&&typeof v==='object'&&!Array.isArray(v);
const immutableRoots=new WeakSet<object>();
const immutableNodes=new WeakSet<object>();
const immutableRoles=new WeakMap<object,Set<string>>();
const trusted=<T>(value:unknown,role:string):T|undefined=>value!==null&&typeof value==='object'&&immutableRoles.get(value)?.has(role)?value as T:undefined;
const absent=Symbol('unknown field');
function remember(value:unknown,role:string){if(value!==null&&typeof value==='object'){const roles=immutableRoles.get(value)||new Set<string>();roles.add(role);immutableRoles.set(value,roles);}}
/** Keep JSON extensions even when this release does not understand them. Never coerce them to null. */
export function preserveUnknownFields(source:unknown,normalized?:unknown,depth=0,ancestors=new Set<object>()):unknown{
 if(arguments.length<2)normalized=absent;
 if(depth>80)throw Error('Daten sind zu tief verschachtelt. Nichts wurde verworfen.');
 if((source===normalized||normalized===absent)&&source!==null&&typeof source==='object'&&immutableNodes.has(source))return source;
 if(normalized!==absent&&(normalized===undefined||normalized===null))return normalized;
 if(normalized!==absent&&source!==undefined&&source!==null&&(typeof source!==typeof normalized||Array.isArray(source)!==Array.isArray(normalized)))throw Error('Ein Datenfeld hat einen ungültigen Typ. Der ursprüngliche Inhalt bleibt erhalten.');
 if(source===null||typeof source!=='object'){
  if(typeof source==='number'&&!Number.isFinite(source)||typeof source==='function'||typeof source==='symbol'||typeof source==='bigint')throw Error('Ein Datenfeld kann nicht verlustfrei als JSON gespeichert werden.');
  return normalized===absent?source:normalized;
 }
 if(ancestors.has(source))throw Error('Zyklische Daten können nicht gespeichert werden.');
 if(!Array.isArray(source)&&Object.getPrototypeOf(source)!==Object.prototype&&Object.getPrototypeOf(source)!==null)throw Error('Unbekanntes Datenobjekt kann nicht verlustfrei gespeichert werden.');
 ancestors.add(source);
 let result:unknown;
 if(Array.isArray(source)){
  const values=Array.isArray(normalized)?normalized:source;
  const byId=new Map(source.filter(record).filter(x=>typeof x.id==='string').map(x=>[x.id,x]));
  result=values.map((v,i)=>{if(v===undefined)throw Error('Eine Datenliste enthält einen nicht speicherbaren leeren Eintrag.');return preserveUnknownFields(Array.isArray(normalized)&&record(v)&&typeof v.id==='string'?byId.get(v.id)??source[i]:source[i],v,depth+1,ancestors);});
 }else{
  const raw=source as Rec;
  const parsed=record(normalized)?normalized:{};
  const entries=Object.keys(raw).map(k=>[k,preserveUnknownFields(raw[k],Object.prototype.hasOwnProperty.call(parsed,k)?parsed[k]:absent,depth+1,ancestors)] as const);
  for(const k of Object.keys(parsed))if(!Object.prototype.hasOwnProperty.call(source,k))entries.push([k,preserveUnknownFields(parsed[k],absent,depth+1,ancestors)]);
  result=Object.fromEntries(entries.filter(([,value])=>value!==undefined));
 }
 ancestors.delete(source);return result;
}
function freezeState(data:AthleteData):AthleteData{
 if(immutableRoots.has(data))return data;
 const freeze=(v:unknown)=>{if(!v||typeof v!=='object'||immutableNodes.has(v))return;for(const child of Object.values(v))freeze(child);Object.freeze(v);immutableNodes.add(v);};freeze(data);immutableRoots.add(data);
 for(const [key,value] of Object.entries(data))if(key!=='live')remember(value,key);
 const session=(w:Workout|LiveWorkout,role:string)=>{if(trusted(w,role))return;remember(w,role);if(!trusted(w.sets,'sets')){remember(w.sets,'sets');for(const s of w.sets)remember(s,'set');}if(w.routineSnapshot)remember(w.routineSnapshot,'routine');if(w.plannedRows&&!trusted(w.plannedRows,'plannedRows')){remember(w.plannedRows,'plannedRows');for(const row of w.plannedRows)remember(row,'plannedRow');}};
 for(const w of data.workouts)session(w,'workout');if(data.live)session(data.live,'live');
 for(const routine of data.routines)remember(routine,'routine');
 return data;
}
/** Only immutable, already validated branches are cached; caller-owned mutable inputs are always checked. */
export function immutableAthleteData(raw:unknown):AthleteData{return freezeState(validateRestoredData(raw));}
const str=(v:unknown,max=300):string=>{if(typeof v!=='string')return '';if(v.length>max)throw Error(`Ein Textfeld überschreitet ${max} Zeichen. Der ursprüngliche Inhalt bleibt erhalten.`);return v;};
const finite=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const date=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const stamp=(s:unknown):s is string=>typeof s==='string'&&s.length<=48&&Number.isFinite(Date.parse(s));
function list<T>(x:Rec,key:string,parse:(v:unknown)=>T|null,max=20000):T[]{
 const cached=trusted<T[]>(x[key],key);if(cached)return cached;
 if(!Array.isArray(x[key]))throw Error(`Im Backup fehlen wichtige Datenlisten (${key}).`);
 const arr=x[key] as unknown[];
 if(arr.length>max)throw Error(`Zu viele Einträge in ${key}.`);
 const out:T[]=[];const ids=new Set<string>();
 for(const val of arr){const entry=parse(val);if(!entry)throw Error(`Ungültiger Eintrag in ${key}.`);
  const id=(entry as {id?:string}).id;
  if(id&&ids.has(id))throw Error(`Doppelte ID in ${key}.`);
  if(id)ids.add(id);out.push(entry);
 }
 return out;
}
const ident=(v:Rec):string|null=>typeof v.id==='string'&&v.id.length>=1&&v.id.length<=150?v.id:null;
const optNum=(v:unknown,lo:number,hi:number)=>v===undefined||v===null?undefined:finite(v,lo,hi)?v:null;
const arrStr=(v:unknown,max=300):string[]|null=>Array.isArray(v)&&v.length<=max&&v.every(s=>typeof s==='string'&&s.length<=150)?v.slice():null;
const kinds=['work','warmup','drop','failure','assisted','timed','distance','bodyweight'];
const blocks=['straight','superset','giant','circuit','emom','amrap','interval'];
function blockFields(v:Rec){if(v.block!==undefined&&!blocks.includes(v.block as string))throw Error('Ungültiger Trainingsblock.');if(v.blockSeconds!==undefined&&!finite(v.blockSeconds,15,3600))throw Error('Ungültiges Blockintervall.');return {...(v.block!==undefined?{block:v.block as TrainingBlock}:{}),...(v.blockSeconds!==undefined?{blockSeconds:v.blockSeconds as number}:{})};}
function prescriptionFields(v:Rec,_ids:string[]){
 if(v.prescriptions===undefined)return {};
 if(!record(v.prescriptions)||Object.keys(v.prescriptions).length>200)throw Error('Übungsziele ungültig.');
 const out:Record<string,Prescription>=Object.create(null);
 for(const [id,p] of Object.entries(v.prescriptions)){
  if(!id||id.length>150||!record(p))throw Error('Übungsziel ungültig.');
  const obj:Prescription={};
  for(const [key,min,max] of [['sets',1,100],['reps',1,150],['repsMin',1,150],['repsMax',1,150],['rir',0,5],['restSeconds',15,600],['warmupSets',0,30]] as const){
   if(p[key]!==undefined){if(!finite(p[key],min,max)||!Number.isInteger(p[key]))throw Error('Übungsziel außerhalb des erlaubten Bereichs.');obj[key]=p[key] as number;}
  }
  if(p.repsMin!==undefined&&p.repsMax!==undefined&&Number(p.repsMin)>Number(p.repsMax))throw Error('Wiederholungsbereich ist umgekehrt.');
  for(const [key,max] of [['rpe',10],['durationSeconds',86400],['distanceMeters',300000]] as const){if(p[key]!==undefined){if(!finite(p[key],key==='rpe'?1:0.001,max))throw Error('Übungsziel ungültig.');obj[key]=p[key] as number;}}
  if(p.targetMode!==undefined&&!['reps','amrap','time','distance'].includes(String(p.targetMode)))throw Error('Ungültige Zielart.');
  if(p.kind!==undefined&&!kinds.includes(String(p.kind)))throw Error('Ungültiger geplanter Satztyp.');
  if(p.note!==undefined&&(typeof p.note!=='string'||p.note.length>1000))throw Error('Übungsnotiz ungültig.');
  out[id]=preserveUnknownFields(p,obj) as Prescription;
 }
 return {prescriptions:out};
}
function parseDraft(v:unknown):SetDraft{
 if(!record(v)||[v.weight,v.reps,v.rir].some(x=>typeof x!=='string'||x.length>24))throw Error('Gym-Entwurf ist ungültig.');
 const out:SetDraft={weight:v.weight as string,reps:v.reps as string,rir:v.rir as string};
 for(const k of ['duration','distance','rpe','tempo','note'] as const){if(v[k]!==undefined){if(typeof v[k]!=='string'||v[k].length>(k==='note'?280:k==='tempo'?60:24))throw Error('Ungültiger Satzentwurf.');out[k]=v[k] as string;}}
 if(v.kind!==undefined&&!kinds.includes(String(v.kind)))throw Error('Ungültiger Satztyp.');
 if(v.side!==undefined&&!['both','left','right'].includes(String(v.side)))throw Error('Ungültige Seite.');
 validateSplit(v.unilateral,true);if(v.loadBasis!==undefined&&!['total','perHand','perSide'].includes(String(v.loadBasis)))throw Error('Lastbasis ungültig.');
 return preserveUnknownFields(v,out) as SetDraft;
}
function routineParser(v:unknown):Routine|null{
 const cached=trusted<Routine>(v,'routine');if(cached)return cached;
 if(!record(v)||!ident(v)||!str(v.name).trim())return null;
 const ids=arrStr(v.exerciseIds,200);if(!ids||!ids.length||!finite(v.restSeconds,15,600))return null;
 validatePositionTargets(v.positions);
 return preserveUnknownFields(v,{id:v.id as string,name:str(v.name,200),exerciseIds:ids,restSeconds:v.restSeconds,...blockFields(v),...(v.segments!==undefined?{segments:validateSegments(v.segments,ids,v.positions as Routine['positions'])}:{}),...prescriptionFields(v,ids)}) as Routine;
}
function validatePlannedSnapshot(rows:PlannedSetRow[],snapshot:Routine,sets:GymSet[]){
 if(snapshot.positions||rows.some(r=>r.planPositionId!==undefined)){validatePositionSnapshot(rows,snapshot,sets);return;}
 const setById=new Map(sets.map(set=>[set.id,set]));
 const groups=new Map<string,PlannedSetRow[]>();
 for(const row of rows){const group=groups.get(row.exerciseInstanceId)||[];group.push(row);groups.set(row.exerciseInstanceId,group);if(row.isExtraSet!==(row.plannedIndex===null))throw Error('Zusatzsatz und geplante Satznummer widersprechen sich.');}
 const remaining=[...snapshot.exerciseIds];
 for(const group of groups.values()){
  const original=group[0].originalExerciseId??group[0].exerciseId,index=remaining.indexOf(original);
  if(index<0||group.some(row=>(row.originalExerciseId??row.exerciseId)!==original))throw Error('Satzgruppe gehört nicht zur ursprünglichen Plan-Momentaufnahme.');
  remaining.splice(index,1);
  const p=snapshot.prescriptions?.[original];if(!p||p.sets===undefined)throw Error('Ursprüngliche Satzanzahl fehlt.');
  const count=p.sets+(p.warmupSets??0),base=group.filter(row=>!row.isExtraSet);
  if(base.length!==count||new Set(base.map(row=>row.plannedIndex)).size!==count||base.some(row=>row.plannedIndex===null||row.plannedIndex<0||row.plannedIndex>=count))throw Error('Geplante Satzanzahl wurde ohne Zusatzmarkierung verändert.');
  const mode=p.targetMode??(p.kind==='timed'?'time':p.kind==='distance'?'distance':p.kind==='failure'?'amrap':'reps');
  for(const row of group){
   if(row.targetMode!==mode||mode==='reps'&&(row.plannedRepsMin!==(p.repsMin??p.reps??p.repsMax)||row.plannedRepsMax!==(p.repsMax??p.reps))||mode==='time'&&row.plannedDurationSeconds!==p.durationSeconds||mode==='distance'&&row.plannedDistanceMeters!==p.distanceMeters)throw Error('Gespeicherte Satzvorgabe widerspricht der ursprünglichen Plan-Momentaufnahme.');
   const set=setById.get(row.id);
   if(row.status==='completed'&&(!set||set.plannedRowId!==row.id)||set&&row.status!=='completed')throw Error('Geplante Satzzeile und absolvierter Satz widersprechen sich.');
   if(!set)continue;
   if(set.exerciseId!==row.exerciseId||set.exerciseInstanceId!==row.exerciseInstanceId||set.plannedIndex!==row.plannedIndex||set.isExtraSet!==row.isExtraSet||set.extraRepAllowance!==row.extraRepAllowance||set.plannedRepsMin!==row.plannedRepsMin||set.plannedRepsMax!==row.plannedRepsMax||set.at!==row.completedAt)throw Error('Absolvierter Satz und ursprüngliche Satzzeile stimmen nicht überein.');
   if(mode==='reps'&&row.plannedRepsMax!==undefined&&set.reps>row.plannedRepsMax+row.extraRepAllowance)throw Error('Gespeicherter Satz überschreitet seine ursprüngliche Vorgabe ohne + Wdh.-Freigabe.');
  }
 }
 if(remaining.length)throw Error('Geplante Übungen fehlen gegenüber der ursprünglichen Momentaufnahme.');
}
/** Legacy records have no plannedRows and never acquire today's limits. V15 rows retain their original contract. */
function plannedFields(v:Rec,sets:GymSet[]):PlannedWorkoutState{
 validateSessionExtensions(v);
 const out:PlannedWorkoutState={};
 if(v.routineSnapshot!==undefined){const snapshot=routineParser(v.routineSnapshot);if(!snapshot)throw Error('Gespeicherte Plan-Momentaufnahme ist ungültig.');out.routineSnapshot=snapshot;}
 if(v.planContext!==undefined){
  const p=v.planContext;if(!record(p)||!date(p.scheduledDate)||typeof p.routineId!=='string'||!p.routineId||p.routineId.length>150)throw Error('Ungültiger Planbezug.');
  if(p.programId!==undefined&&(typeof p.programId!=='string'||!p.programId||p.programId.length>150)||p.kind!==undefined&&!['training','optional'].includes(String(p.kind))||p.week!==undefined&&(!Number.isInteger(p.week)||!finite(p.week,0,1000))||p.weekday!==undefined&&(!Number.isInteger(p.weekday)||!finite(p.weekday,0,6)))throw Error('Ungültiger Planbezug.');
  for(const key of ['revisionId','occurrenceId'] as const)if(p[key]!==undefined&&(typeof p[key]!=='string'||!p[key]||p[key].length>(key==='occurrenceId'?256:150)))throw Error('Ungültiger Revisions-/Terminbezug.');if(p.originalScheduledDate!==undefined&&!date(p.originalScheduledDate)||p.deload!==undefined&&typeof p.deload!=='boolean')throw Error('Ungültiger ursprünglicher Plantag.');
  out.planContext=preserveUnknownFields(p) as PlannedWorkoutState['planContext'];
 }
 if(v.plannedRows!==undefined){
  if(!Array.isArray(v.plannedRows)||v.plannedRows.length>5000)throw Error('Geplante Satzzeilen sind ungültig.');
  const ids=new Set<string>(),setById=new Map(sets.map(set=>[set.id,set]));
  out.plannedRows=v.plannedRows.map(raw=>{
   const cached=trusted<PlannedSetRow>(raw,'plannedRow');if(cached){if(ids.has(cached.id))throw Error('Doppelte geplante Satzzeile.');ids.add(cached.id);return cached;}
   if(!record(raw)||!ident(raw)||ids.has(raw.id as string)||typeof raw.exerciseId!=='string'||!raw.exerciseId||raw.exerciseId.length>150||typeof raw.exerciseInstanceId!=='string'||!raw.exerciseInstanceId||raw.exerciseInstanceId.length>200||!kinds.includes(String(raw.kind))||!['reps','amrap','time','distance'].includes(String(raw.targetMode))||!['draft','completed','skipped'].includes(String(raw.status))||!Number.isInteger(raw.extraRepAllowance)||!finite(raw.extraRepAllowance,0,1000000)||typeof raw.isExtraSet!=='boolean')throw Error('Ungültige oder doppelte geplante Satzzeile.');
   ids.add(raw.id as string);
   validateRowExtensions(raw);
   if(raw.plannedIndex!==null&&(!Number.isInteger(raw.plannedIndex)||!finite(raw.plannedIndex,0,100000)))throw Error('Ungültige geplante Satznummer.');
   if(raw.originalExerciseId!==undefined&&(typeof raw.originalExerciseId!=='string'||!raw.originalExerciseId||raw.originalExerciseId.length>150))throw Error('Ungültiger ursprünglicher Übungsbezug.');
   for(const k of ['plannedRepsMin','plannedRepsMax'] as const)if(raw[k]!==undefined&&(!Number.isInteger(raw[k])||!finite(raw[k],1,1000000)))throw Error('Ungültige ursprüngliche Wiederholungsvorgabe.');
   if(raw.plannedRepsMin!==undefined&&raw.plannedRepsMax!==undefined&&Number(raw.plannedRepsMin)>Number(raw.plannedRepsMax))throw Error('Wiederholungsbereich ist umgekehrt.');
   for(const [k,max] of [['plannedDurationSeconds',86400],['plannedDistanceMeters',300000]] as const)if(raw[k]!==undefined&&!finite(raw[k],0.001,max))throw Error('Ungültige geplante Zeit oder Distanz.');
   if(raw.completedAt!==undefined&&!stamp(raw.completedAt)||raw.status==='completed'&&!stamp(raw.completedAt))throw Error('Ungültiger Satzabschluss-Zeitpunkt.');
   const set=setById.get(raw.id as string);
   if(raw.status==='completed'&&(!set||set.plannedRowId!==raw.id)||set&&set.plannedRowId===raw.id&&raw.status!=='completed')throw Error('Geplante Satzzeile und absolvierter Satz widersprechen sich.');
   return preserveUnknownFields(raw,{...raw,draft:parseDraft(raw.draft)}) as PlannedSetRow;
  });
  for(const set of sets)if(!set.plannedRowId||!ids.has(set.plannedRowId)||set.id!==set.plannedRowId)throw Error('Absolvierter Satz verweist auf eine fehlende Planzeile.');
  if(!out.routineSnapshot)throw Error('Die ursprüngliche Plan-Momentaufnahme fehlt.');
  validatePlannedSnapshot(out.plannedRows,out.routineSnapshot,sets);
 }
 return out;
}
function pauseFields(v:Rec){for(const k of ['pausedAt','pausedMs','blockEndsAt','segmentStartedAt'] as const)if(v[k]!==undefined&&!finite(v[k],0,4102444800000))throw Error('Ungültige Session-Zeit.');return {...(v.segmentStartedAt!==undefined?{segmentStartedAt:v.segmentStartedAt as number}:{}),...(v.pausedAt!==undefined?{pausedAt:v.pausedAt as number}:{}),...(v.pausedMs!==undefined?{pausedMs:v.pausedMs as number}:{}),...(v.blockEndsAt!==undefined?{blockEndsAt:v.blockEndsAt as number}:{})};}
function setParser(v:unknown):GymSet|null {
 const cached=trusted<GymSet>(v,'set');if(cached)return cached;
 if(!record(v)||!ident(v)||typeof v.exerciseId!=='string'||!v.exerciseId||v.exerciseId.length>150||!finite(v.weightKg,0,1000)||!Number.isInteger(v.reps)||!stamp(v.at))return null;
 const kind=v.kind===undefined?'work':v.kind;if(!kinds.includes(kind as string))return null;
 const time=kind==='timed',dist=kind==='distance';
 if(time||dist){if(v.reps!==0||v.weightKg!==0)return null;}else if(!finite(v.reps,1,150))return null;
 if(kind==='bodyweight'&&v.weightKg!==0)return null;
 const rir=optNum(v.rir,0,10),rpe=optNum(v.rpe,1,10),duration=optNum(v.durationSeconds,0.001,86400),distance=optNum(v.distanceMeters,0.001,300000);
 if(rir===null||rpe===null||duration===null||distance===null||(rir!==undefined&&!Number.isInteger(rir))||(time&&duration===undefined)||(dist&&distance===undefined))return null;
 if(v.side!==undefined&&!['both','left','right'].includes(v.side as string))return null;
 validateSplit(v.unilateral,false);if(v.role!==undefined&&!['work','warmup'].includes(String(v.role))||v.loadBasis!==undefined&&!['total','perHand','perSide'].includes(String(v.loadBasis)))throw Error('Ungültige Satzrolle/Lastbasis.');if(record(v.unilateral)&&record(v.unilateral.left)&&(v.weightKg!==v.unilateral.left.weightKg||v.reps!==v.unilateral.left.reps))throw Error('Seitenwerte und kompatibler Hauptwert widersprechen sich.');for(const key of ['planPositionId','targetId'])if(v[key]!==undefined&&(typeof v[key]!=='string'||!v[key]||v[key].length>150))throw Error('Ungültiger Positions-/Zielbezug.');
 for(const k of ['plannedRowId','exerciseInstanceId'] as const)if(v[k]!==undefined&&(typeof v[k]!=='string'||!v[k]||v[k].length>200))throw Error('Ungültiger Bezug auf eine geplante Satzzeile.');
 for(const k of ['plannedRepsMin','plannedRepsMax','extraRepAllowance'] as const)if(v[k]!==undefined&&(!finite(v[k],k==='extraRepAllowance'?0:1,1000000)||!Number.isInteger(v[k])))throw Error('Ungültige gespeicherte Satzvorgabe.');
 if(v.plannedIndex!==undefined&&v.plannedIndex!==null&&(!finite(v.plannedIndex,0,100000)||!Number.isInteger(v.plannedIndex)))throw Error('Ungültige geplante Satznummer.');
 if(v.isExtraSet!==undefined&&typeof v.isExtraSet!=='boolean'||v.correctedAt!==undefined&&!stamp(v.correctedAt))throw Error('Ungültige Satzkorrektur.');
 return preserveUnknownFields(v,{id:v.id as string,exerciseId:v.exerciseId,weightKg:v.weightKg,reps:v.reps,at:v.at,kind:kind as SetKind,note:str(v.note,280),...(rir!==undefined?{rir}:{}),...(rpe!==undefined?{rpe}:{}),...(duration!==undefined?{durationSeconds:duration}:{}),...(distance!==undefined?{distanceMeters:distance}:{}),...(v.side!==undefined?{side:v.side as GymSet['side']}:{}),...(v.tempo!==undefined?{tempo:str(v.tempo,60)}:{})}) as GymSet;
}
function parseSets(v:unknown):GymSet[]|null {
 const cached=trusted<GymSet[]>(v,'sets');if(cached)return cached;
 if(!Array.isArray(v)||v.length>5000)return null;
 const parsed=v.map(setParser);if(parsed.some(s=>s===null))return null;
 const ids=parsed.map(s=>s!.id);if(new Set(ids).size!==ids.length)return null;
 return parsed as GymSet[];
}
function workoutParser(v:unknown):Workout|null{
 const cached=trusted<Workout>(v,'workout');if(cached)return cached;
 if(!record(v)||!ident(v)||!stamp(v.startedAt)||!stamp(v.finishedAt)||Date.parse(v.finishedAt)<Date.parse(v.startedAt))return null;
 const sets=parseSets(v.sets);if(!sets)return null;
 return preserveUnknownFields(v,{id:v.id as string,name:str(v.name,200),startedAt:v.startedAt,finishedAt:v.finishedAt,sets,...(stamp(v.createdAt)?{createdAt:v.createdAt}:{}),...(v.status==='completed'?{status:v.status}:{}),...blockFields(v),...pauseFields(v),...plannedFields(v,sets),...(v.segments!==undefined?{segments:validateSegments(v.segments,Array.isArray(v.segments)?v.segments.flatMap(x=>Array.isArray(x?.exerciseIds)?x.exerciseIds:[]):[])}:{}),note:str(v.note,1000),...(typeof v.routineId==='string'?{routineId:str(v.routineId,150)}:{})}) as Workout;
}
function parseNotes(v:unknown):Record<string,string>{if(!record(v)||Object.keys(v).length>5000)throw Error('Gym-Notizen ungültig.');const out:Record<string,string>=Object.create(null);for(const [k,n] of Object.entries(v)){if(!k||k.length>150||typeof n!=='string'||n.length>1000)throw Error('Gym-Notiz ungültig.');out[k]=n;}return out;}
function validateEditorDrafts(raw:Rec){
 const draft=raw.planEditorDraft;
 if(draft!==undefined&&draft!==null){
  if(!record(draft)||typeof draft.programId!=='string'||!draft.programId||draft.programId.length>150||!Number.isInteger(draft.week)||!finite(draft.week,0,7)||!Number.isInteger(draft.weekday)||!finite(draft.weekday,0,6)||!stamp(draft.updatedAt)||!record(draft.routine)||!ident(draft.routine)||typeof draft.routine.name!=='string'||draft.routine.name.length>200||!arrStr(draft.routine.exerciseIds,200)||!Array.isArray(draft.customExercises)||draft.customExercises.length>200)throw Error('Der gespeicherte Planentwurf ist beschädigt.');
  for(const e of draft.customExercises)if(!record(e)||!ident(e)||typeof e.name!=='string'||e.name.length>130)throw Error('Eine eigene Übung im Planentwurf ist beschädigt.');
  for(const e of draft.customExercises)validateExerciseExtensions(e as Rec);
  validatePositionTargets(draft.routine.positions,true);
  if(draft.rawInputs!==undefined){if(!record(draft.rawInputs)||Object.keys(draft.rawInputs).length>5003)throw Error('Texteingaben im Planentwurf sind beschädigt.');for(const [key,fields] of Object.entries(draft.rawInputs)){if(!key||key.length>150||!record(fields)||Object.keys(fields).length>20||Object.entries(fields).some(([field,value])=>!field||field.length>150||typeof value!=='string'||value.length>(key==='$picker'&&field==='customName'?130:100)))throw Error('Ein Entwurfstext ist ungültig.');}}
 }
 const program=raw.programEditorDraft;
 if(program!==undefined&&program!==null){
  if(!record(program)||!ident(program)||typeof program.name!=='string'||program.name.length>100||!Array.isArray(program.days)||program.days.length>56)throw Error('Der gespeicherte Programmentwurf ist beschädigt.');
 }
}
export function validateRestoredData(raw:unknown):AthleteData {
 if(raw&&typeof raw==='object'&&immutableRoots.has(raw))return raw as AthleteData;
 if(!record(raw)||raw.schema!==4||!record(raw.profile))throw Error('Dieses Backup ist nicht ATHLETE-OS-kompatibel.');
 validateEditorDrafts(raw);
 validateRootExtensions(Object.fromEntries(Object.entries(raw).filter(([key,value])=>trusted(value,key)===undefined)),routineParser,(value,live)=>{if(live)return validateRestoredData({...emptyData(),live:value}).live;const parsed=workoutParser(value);if(!parsed)throw Error('Ungültige Undo-Session.');return parsed;});
 const base=emptyData();const p=raw.profile;
 const target=optNum(p.targetKg,20,350),start=optNum(p.startingKg,20,350);
 if(target===null||start===null)throw Error('Ungültiges Profilgewicht.');
 const weights=list(raw,'weights',v=>{
  if(!record(v)||!ident(v)||!date(v.date)||!finite(v.kg,20,350))return null;
  if(v.healthOrigin!==undefined)validateHealthImportedProvenance(v.healthOrigin);
  return {id:v.id as string,date:v.date,kg:v.kg,note:str(v.note,500)} as WeightEntry;
 });
 const scans=list(raw,'scans',v=>{
  if(!record(v)||!ident(v)||!date(v.date))return null;
  const fields=[['bodyFat',0,75],['muscleKg',0,200],['visceralFat',0,60],['waistCm',0,250],['weightKg',20,350],['bmr',500,5000]] as const;
  const obj:Rec={id:v.id,date:v.date,source:str(v.source,200)};
  for(const [key,lo,hi] of fields){const n=optNum(v[key],lo,hi);if(n===null)return null;if(n!==undefined)obj[key]=n;}
  return obj as BodyScan;
 });
 const exercises=list(raw,'exercises',v=>record(v)&&ident(v)&&str(v.name).trim()&&(v.photo===undefined||(typeof v.photo==='string'&&v.photo.length<=350023&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(v.photo)))&&(v.photoAssetId===undefined||typeof v.photoAssetId==='string'&&/^m_[0-9a-f]{64}$/.test(v.photoAssetId))?{id:v.id as string,name:str(v.name,130),group:str(v.group,80),...(typeof v.photo==='string'?{photo:v.photo}:{})} as Exercise:null,5000);
 const routines=list(raw,'routines',routineParser,2000);
 const workouts=list(raw,'workouts',workoutParser,20000);
 let live:LiveWorkout|null=null;
 const cachedLive=trusted<LiveWorkout>(raw.live,'live');
 if(cachedLive)live=cachedLive;
 else if(raw.live!==null&&raw.live!==undefined){
  const v=raw.live;if(!record(v)||!ident(v)||!stamp(v.startedAt)||!finite(v.restSeconds,15,600))throw Error('Ungültige Live-Workout-Daten.');
  const ids=arrStr(v.exerciseIds,200),sets=parseSets(v.sets);
  if(!ids||!sets||(v.restUntil!==null&&!finite(v.restUntil,0,4102444800000)))throw Error('Ungültige Live-Workout-Daten.');
  const drafts:Record<string,SetDraft>={};
  if(v.drafts!==undefined){if(!record(v.drafts)||Object.keys(v.drafts).length>200)throw Error('Gym-Entwürfe beschädigt.');
   for(const [ex,entry] of Object.entries(v.drafts)){
    if(!ex||ex.length>150)throw Error('Ungültiger Übungsbezug im Gym-Entwurf.');
    Object.defineProperty(drafts,ex,{value:parseDraft(entry),enumerable:true,writable:true,configurable:true});
   }
  }
  if(v.createdAt!==undefined&&!stamp(v.createdAt)||v.lastSavedAt!==undefined&&!stamp(v.lastSavedAt)||v.setSequence!==undefined&&(!finite(v.setSequence,sets.length,100000000)||!Number.isInteger(v.setSequence))||v.restPausedMs!==undefined&&(!finite(v.restPausedMs,0,3600000)||v.restUntil!==null))throw Error('Ungültige Workout-Metadaten.');
  live={id:v.id as string,name:str(v.name,200),startedAt:v.startedAt,...(stamp(v.createdAt)?{createdAt:v.createdAt}:{}),...(stamp(v.lastSavedAt)?{lastSavedAt:v.lastSavedAt}:{}),...(v.status!==undefined?{status:v.pausedAt!==undefined?'paused' as const:'active' as const}:{}),...(typeof v.setSequence==='number'?{setSequence:v.setSequence}:{}),...(typeof v.restPausedMs==='number'?{restPausedMs:v.restPausedMs}:{}),exerciseIds:ids,sets,...blockFields(v),...pauseFields(v),...plannedFields(v,sets),...(v.segments!==undefined?{segments:validateSegments(v.segments,ids)}:{}),...prescriptionFields(v,ids),restUntil:v.restUntil as number|null,restSeconds:v.restSeconds,note:str(v.note,1000),...(typeof v.routineId==='string'?{routineId:str(v.routineId,150)}:{}),activeExerciseId:typeof v.activeExerciseId==='string'&&ids.includes(v.activeExerciseId)?v.activeExerciseId:ids[0],drafts};
 }
 const cardio=list(raw,'cardio',v=>record(v)&&ident(v)&&date(v.date)&&finite(v.minutes,0.1,1440)&&(v.km===undefined||finite(v.km,0,300))?{id:v.id as string,date:v.date,minutes:v.minutes,kind:str(v.kind,100),...(v.km!==undefined?{km:v.km}:{}),note:str(v.note,500)} as Cardio:null);
 const performance=list(raw,'performance',v=>record(v)&&ident(v)&&date(v.date)&&finite(v.value,0,100000)?{id:v.id as string,date:v.date,kind:str(v.kind,80) as Performance['kind'],value:v.value,unit:str(v.unit,60)} as Performance:null);
 const habits=list(raw,'habits',v=>{if(!record(v)||!ident(v)||!str(v.title).trim())return null;if(v.days!==undefined&&(!Array.isArray(v.days)||v.days.some(x=>!Number.isInteger(x)||!finite(x,0,6))))return null;return {id:v.id as string,title:str(v.title,200),...(v.days!==undefined?{days:[...new Set(v.days as number[])]}:{}),...(v.paused!==undefined?{paused:v.paused===true}:{}),...(v.archived!==undefined?{archived:v.archived===true}:{}),...(v.trigger!==undefined?{trigger:str(v.trigger,280)}:{}),...(v.replacement!==undefined?{replacement:str(v.replacement,280)}:{})} as Habit;},1000);
 const nutrition=list(raw,'nutrition',v=>{
  if(!record(v)||!ident(v)||!date(v.date))return null;
  const n:Rec={id:v.id,date:v.date,source:str(v.source,150)};
  for(const k of ['kcal','protein','carbs','fat'] as const){const x=optNum(v[k],0,15000);if(x===null)return null;if(x!==undefined)n[k]=x;}
  return n as Nutrition;
 });
 const checks:Record<string,string[]>={};
 if(!record(raw.habitChecks)||Object.keys(raw.habitChecks).length>5000)throw Error('Gewohnheitsdaten sind ungültig.');
 for(const [key,value] of Object.entries(raw.habitChecks)){
  if(!date(key))throw Error('Gewohnheitsdatum ungültig.');
  const arr=arrStr(value,1000);if(!arr)throw Error('Gewohnheitsliste ungültig.');
  checks[key]=[...new Set(arr)];
 }
 const recovery=raw.recovery===undefined?[]:list(raw,'recovery',v=>{
  if(!record(v)||!ident(v)||!date(v.date))return null;
  if(v.healthOrigin!==undefined)validateHealthImportedProvenance(v.healthOrigin);
  const sleep=optNum(v.sleepHours,0,24),energy=optNum(v.energy,1,5),soreness=optNum(v.soreness,1,5);
  if(sleep===null||energy===null||soreness===null||(sleep===undefined&&energy===undefined&&soreness===undefined))return null;
  if((energy!==undefined&&!Number.isInteger(energy))||(soreness!==undefined&&!Number.isInteger(soreness)))return null;
  return {id:v.id as string,date:v.date,...(sleep!==undefined?{sleepHours:sleep}:{}),...(energy!==undefined?{energy}:{}),...(soreness!==undefined?{soreness}:{}),note:str(v.note,300)} as RecoveryEntry;
 },10000);
 const measureTypes:MeasurementType[]=['waist','chest','hips','upperArm','thigh','neck'];
 const measurements=raw.measurements===undefined?[]:list(raw,'measurements',v=>
  record(v)&&ident(v)&&date(v.date)&&measureTypes.includes(v.metric as MeasurementType)&&finite(v.cm,1,350)
   ?{id:v.id as string,date:v.date,metric:v.metric as MeasurementType,cm:v.cm,note:str(v.note,300)} as Measurement:null,10000);
 const goalMetrics:AthleteGoalMetric[]=['pushups','pullups','plank','workouts','weight','run5k','lift'];
 const goals=raw.goals===undefined?[]:list(raw,'goals',v=>
  record(v)&&ident(v)&&goalMetrics.includes(v.metric as AthleteGoalMetric)&&finite(v.target,0.01,100000)
  &&(v.metric!=='lift'||(typeof v.exerciseId==='string'&&v.exerciseId.length>0&&v.exerciseId.length<=150))
   ?{id:v.id as string,metric:v.metric as AthleteGoalMetric,target:v.target,exerciseId:str(v.exerciseId,150)||undefined,label:str(v.label,150)||undefined} as AthleteGoal:null,150);
 const weeklyPlan:TrainingPlan[]=[];
 if(raw.weeklyPlan!==undefined){
  if(!Array.isArray(raw.weeklyPlan)||raw.weeklyPlan.length>7)throw Error('Wochenplan ist ungültig.');
  for(const v of raw.weeklyPlan){
   if(!record(v)||!Number.isInteger(v.day)||!finite(v.day,0,6)||!(v.routineId===null||(typeof v.routineId==='string'&&v.routineId.length<=150)))throw Error('Ungültiger Trainingstag.');
   if(weeklyPlan.some(x=>x.day===v.day))throw Error('Doppelter Tag im Trainingsplan.');
   weeklyPlan.push({day:v.day,routineId:v.routineId as string|null});
  }
 }
 const settings=record(raw.settings)?raw.settings:{};
 const rest=finite(settings.restSeconds,15,600)?settings.restSeconds:base.settings.restSeconds;
 const favorites=raw.favoriteExerciseIds===undefined?[]:arrStr(raw.favoriteExerciseIds,3000);
 if(!favorites)throw Error('Favoritenliste beschädigt.');
 if(settings.motion!==undefined&&typeof settings.motion!=='boolean')throw Error('Bewegungseinstellung ungültig.');
 validateSecondPassSettings(settings);
 const normalized:AthleteData={
  schema:4,
  mediaAssets:(raw.mediaAssets??[]) as AthleteData['mediaAssets'],planRevisions:(raw.planRevisions??[]) as AthleteData['planRevisions'],planOccurrences:(raw.planOccurrences??[]) as AthleteData['planOccurrences'],progressionDecisions:(raw.progressionDecisions??[]) as AthleteData['progressionDecisions'],
  programs:validatePrograms(raw.programs,routines.map(r=>r.id)),
  healthEntries:raw.healthEntries===undefined?[]:list(raw,'healthEntries',v=>{if(!record(v)||!ident(v)||!date(v.date)||typeof v.metric!=='string'||!Object.prototype.hasOwnProperty.call(healthSpecs,v.metric))return null;if(v.healthOrigin!==undefined)validateHealthImportedProvenance(v.healthOrigin);const metric=v.metric as HealthMetric;const spec=healthSpecs[metric];if(!finite(v.value,spec.min,spec.max)||(spec.integer&&!Number.isInteger(v.value)))return null;return {id:v.id as string,date:v.date,metric,value:v.value,note:str(v.note,300)};}),
  equipmentNotes:parseNotes(raw.equipmentNotes===undefined?{}:raw.equipmentNotes),
  journal:raw.journal===undefined?[]:list(raw,'journal',v=>record(v)&&ident(v)&&date(v.date)&&typeof v.text==='string'&&v.text.trim()&&v.text.length<=4000&&typeof v.tag==='string'&&v.tag.length<=40?{id:v.id as string,date:v.date,text:v.text,tag:v.tag}:null,20000),
  profile:{name:str(p.name,120),targetKg:target??null,startingKg:start??null,onboarded:p.onboarded===true,...(['strength','endurance','composition','athletic','mixed'].includes(p.priority as string)?{priority:p.priority as AthleteData['profile']['priority']}:{} )},
  weights,scans,exercises,routines,workouts,live,cardio,performance,habits,habitChecks:checks,nutrition,
  favoriteExerciseIds:[...new Set(favorites)],recovery,measurements,goals,weeklyPlan,
  settings:{coach:settings.coach!==false,restSeconds:rest,showWeightOnShare:settings.showWeightOnShare===true,tone:settings.tone==='calm'||settings.tone==='coach'||settings.tone==='chaos'||settings.tone==='off'?settings.tone:undefined,focusMode:settings.focusMode===true,eggs:settings.eggs===true,weightStep:finite(settings.weightStep,0.1,25)?settings.weightStep:2.5,paperMode:settings.paperMode===true,haptics:settings.haptics!==false,appearance:settings.appearance==='dark'||settings.appearance==='light'?settings.appearance:'system',restAlerts:settings.restAlerts===true,alertSound:settings.alertSound===true,reminderTime:typeof settings.reminderTime==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.reminderTime)?settings.reminderTime:undefined,widgetEnabled:settings.widgetEnabled===true,activityEnabled:settings.activityEnabled===true}
 };
 if(raw.healthNutrition!==undefined)normalized.healthNutrition=trusted(raw.healthNutrition,'healthNutrition')??validateHealthNutritionState(raw.healthNutrition);
 // Preserve stable immutable branches so a live draft edit does not traverse the workout archive.
 const obj=normalized as unknown as Rec;
 for(const key of ['profile','settings','habitChecks','weeklyPlan','equipmentNotes','favoriteExerciseIds']){const unchanged=trusted(raw[key],key);if(unchanged!==undefined)obj[key]=unchanged;}
 return preserveUnknownFields(raw,normalized) as AthleteData;
}
export function parseAthleteBackup(text:string):AthleteData {
 if(text.length>15_000_000)throw Error('Backup überschreitet 15 MB.');
 let bytes=0;for(const c of text){const code=c.codePointAt(0)!;bytes+=code<128?1:code<2048?2:code<65536?3:4;if(bytes>15_000_000)throw Error('Backup überschreitet 15 MB.');}
 let parsed:unknown;
 try{parsed=JSON.parse(text)}catch{throw Error('Diese Datei enthält kein gültiges JSON.');}
 const input=record(parsed)&&(parsed.format==='ATHLETE-OS-Backup'||parsed.format==='FORM-Migration-Snapshot-v1')?parsed.data:parsed;
 return validateRestoredData(input);
}
