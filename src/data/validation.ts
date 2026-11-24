import {validateSegments} from '../utils/segments';
import type {AthleteData,WeightEntry,BodyScan,Exercise,Routine,GymSet,Workout,LiveWorkout,Cardio,Performance,Habit,Nutrition,Measurement,AthleteGoal,TrainingPlan,MeasurementType,AthleteGoalMetric,RecoveryEntry,SetDraft,SetKind,TrainingBlock,Prescription} from './schema';
import {emptyData} from './schema';
import {validatePrograms} from '../utils/plans';
import {healthSpecs} from '../utils/health';
import type {HealthMetric} from './schema';

type Rec=Record<string,unknown>;
const record=(v:unknown):v is Rec=>!!v&&typeof v==='object'&&!Array.isArray(v);
const str=(v:unknown,max=300):string=>typeof v==='string'?v.slice(0,max):'';
const finite=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const date=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const stamp=(s:unknown):s is string=>typeof s==='string'&&s.length<=48&&Number.isFinite(Date.parse(s));
function list<T>(x:Rec,key:string,parse:(v:unknown)=>T|null,max=20000):T[]{
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
function prescriptionFields(v:Rec,ids:string[]){if(v.prescriptions===undefined)return {};if(!record(v.prescriptions)||Object.keys(v.prescriptions).length>200)throw Error('Übungsziele ungültig.');const out:Record<string,Prescription>=Object.create(null);for(const [id,p] of Object.entries(v.prescriptions)){if(!ids.includes(id))continue;if(!record(p))throw Error('Übungsziel ungültig.');const obj:Prescription={};for(const [key,min,max] of [['sets',1,100],['reps',1,150],['rir',0,5],['restSeconds',15,600],['warmupSets',0,30]] as const){if(p[key]!==undefined){if(!finite(p[key],min,max)||!Number.isInteger(p[key]))throw Error('Übungsziel außerhalb des erlaubten Bereichs.');obj[key]=p[key] as number;}}out[id]=obj;}return {prescriptions:out};}
function pauseFields(v:Rec){for(const k of ['pausedAt','pausedMs','blockEndsAt','segmentStartedAt'] as const)if(v[k]!==undefined&&!finite(v[k],0,4102444800000))throw Error('Ungültige Session-Zeit.');return {...(v.segmentStartedAt!==undefined?{segmentStartedAt:v.segmentStartedAt as number}:{}),...(v.pausedAt!==undefined?{pausedAt:v.pausedAt as number}:{}),...(v.pausedMs!==undefined?{pausedMs:v.pausedMs as number}:{}),...(v.blockEndsAt!==undefined?{blockEndsAt:v.blockEndsAt as number}:{})};}
function setParser(v:unknown):GymSet|null {
 if(!record(v)||!ident(v)||typeof v.exerciseId!=='string'||!v.exerciseId||v.exerciseId.length>150||!finite(v.weightKg,0,1000)||!Number.isInteger(v.reps)||!stamp(v.at))return null;
 const kind=v.kind===undefined?'work':v.kind;if(!kinds.includes(kind as string))return null;
 const time=kind==='timed',dist=kind==='distance';
 if(time||dist){if(v.reps!==0||v.weightKg!==0)return null;}else if(!finite(v.reps,1,150))return null;
 if(kind==='bodyweight'&&v.weightKg!==0)return null;
 const rir=optNum(v.rir,0,10),rpe=optNum(v.rpe,1,10),duration=optNum(v.durationSeconds,0.001,86400),distance=optNum(v.distanceMeters,0.001,300000);
 if(rir===null||rpe===null||duration===null||distance===null||(rir!==undefined&&!Number.isInteger(rir))||(time&&duration===undefined)||(dist&&distance===undefined))return null;
 if(v.side!==undefined&&!['both','left','right'].includes(v.side as string))return null;
 return {id:v.id as string,exerciseId:v.exerciseId,weightKg:v.weightKg,reps:v.reps,at:v.at,kind:kind as SetKind,note:str(v.note,280),...(rir!==undefined?{rir}:{}),...(rpe!==undefined?{rpe}:{}),...(duration!==undefined?{durationSeconds:duration}:{}),...(distance!==undefined?{distanceMeters:distance}:{}),...(v.side!==undefined?{side:v.side as GymSet['side']}:{}),...(v.tempo!==undefined?{tempo:str(v.tempo,60)}:{})};
}
function parseSets(v:unknown):GymSet[]|null {
 if(!Array.isArray(v)||v.length>5000)return null;
 const parsed=v.map(setParser);if(parsed.some(s=>s===null))return null;
 const ids=parsed.map(s=>s!.id);if(new Set(ids).size!==ids.length)return null;
 return parsed as GymSet[];
}
function workoutParser(v:unknown):Workout|null{
 if(!record(v)||!ident(v)||!stamp(v.startedAt)||!stamp(v.finishedAt)||Date.parse(v.finishedAt)<Date.parse(v.startedAt))return null;
 const sets=parseSets(v.sets);if(!sets)return null;
 return {id:v.id as string,name:str(v.name,200),startedAt:v.startedAt,finishedAt:v.finishedAt,sets,...(stamp(v.createdAt)?{createdAt:v.createdAt}:{}),...(v.status==='completed'?{status:v.status}:{}),...blockFields(v),...pauseFields(v),...(v.segments!==undefined?{segments:validateSegments(v.segments,Array.isArray(v.segments)?v.segments.flatMap(x=>Array.isArray(x?.exerciseIds)?x.exerciseIds:[]):[])}:{}),note:str(v.note,1000),...(typeof v.routineId==='string'?{routineId:str(v.routineId,150)}:{})};
}
function parseNotes(v:unknown):Record<string,string>{if(!record(v)||Object.keys(v).length>5000)throw Error('Gym-Notizen ungültig.');const out:Record<string,string>=Object.create(null);for(const [k,n] of Object.entries(v)){if(!k||k.length>150||typeof n!=='string'||n.length>1000)throw Error('Gym-Notiz ungültig.');out[k]=n;}return out;}
export function validateRestoredData(raw:unknown):AthleteData {
 if(!record(raw)||raw.schema!==4||!record(raw.profile))throw Error('Dieses Backup ist nicht ATHLETE-OS-kompatibel.');
 const base=emptyData();const p=raw.profile;
 const target=optNum(p.targetKg,20,350),start=optNum(p.startingKg,20,350);
 if(target===null||start===null)throw Error('Ungültiges Profilgewicht.');
 const weights=list(raw,'weights',v=>{
  if(!record(v)||!ident(v)||!date(v.date)||!finite(v.kg,20,350))return null;
  return {id:v.id as string,date:v.date,kg:v.kg,note:str(v.note,500)} as WeightEntry;
 });
 const scans=list(raw,'scans',v=>{
  if(!record(v)||!ident(v)||!date(v.date))return null;
  const fields=[['bodyFat',0,75],['muscleKg',0,200],['visceralFat',0,60],['waistCm',0,250],['weightKg',20,350],['bmr',500,5000]] as const;
  const obj:Rec={id:v.id,date:v.date,source:str(v.source,200)};
  for(const [key,lo,hi] of fields){const n=optNum(v[key],lo,hi);if(n===null)return null;if(n!==undefined)obj[key]=n;}
  return obj as BodyScan;
 });
 const exercises=list(raw,'exercises',v=>record(v)&&ident(v)&&str(v.name).trim()&&(v.photo===undefined||(typeof v.photo==='string'&&v.photo.length<=350023&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(v.photo)))?{id:v.id as string,name:str(v.name,130),group:str(v.group,80),...(typeof v.photo==='string'?{photo:v.photo}:{})} as Exercise:null,5000);
 const routines=list(raw,'routines',v=>{
  if(!record(v)||!ident(v)||!str(v.name).trim())return null;const ids=arrStr(v.exerciseIds,200);
  if(!ids||!ids.length||!finite(v.restSeconds,15,600))return null;
  return {id:v.id as string,name:str(v.name,200),exerciseIds:ids,restSeconds:v.restSeconds,...blockFields(v),...(v.segments!==undefined?{segments:validateSegments(v.segments,ids)}:{}),...prescriptionFields(v,ids)} as Routine;
 },2000);
 const workouts=list(raw,'workouts',workoutParser,20000);
 let live:LiveWorkout|null=null;
 if(raw.live!==null&&raw.live!==undefined){
  const v=raw.live;if(!record(v)||!ident(v)||!stamp(v.startedAt)||!finite(v.restSeconds,15,600))throw Error('Ungültige Live-Workout-Daten.');
  const ids=arrStr(v.exerciseIds,200),sets=parseSets(v.sets);
  if(!ids||!sets||(v.restUntil!==null&&!finite(v.restUntil,0,4102444800000)))throw Error('Ungültige Live-Workout-Daten.');
  const drafts:Record<string,SetDraft>={};
  if(v.drafts!==undefined){if(!record(v.drafts)||Object.keys(v.drafts).length>200)throw Error('Gym-Entwürfe beschädigt.');
   for(const [ex,entry] of Object.entries(v.drafts)){if(!ids.includes(ex)||!record(entry))continue;
    if([entry.weight,entry.reps,entry.rir].some(x=>typeof x!=='string'||x.length>24))throw Error('Gym-Entwurf ist ungültig.');
    const draft: SetDraft={weight:entry.weight as string,reps:entry.reps as string,rir:entry.rir as string};
    for(const k of ['duration','distance','rpe','tempo','note'] as const){if(entry[k]!==undefined){if(typeof entry[k]!=='string'||(entry[k] as string).length>(k==='note'?280:k==='tempo'?60:24))throw Error('Ungültiger Satzentwurf.');draft[k]=entry[k] as string;}}
    if(entry.kind!==undefined){if(!kinds.includes(entry.kind as string))throw Error('Ungültiger Satztyp.');draft.kind=entry.kind as SetKind;}
    if(entry.side!==undefined){if(!['both','left','right'].includes(entry.side as string))throw Error('Ungültige Seite.');draft.side=entry.side as SetDraft['side'];}
    drafts[ex]=draft;
   }
  }
  if(v.createdAt!==undefined&&!stamp(v.createdAt)||v.lastSavedAt!==undefined&&!stamp(v.lastSavedAt)||v.setSequence!==undefined&&(!finite(v.setSequence,sets.length,100000000)||!Number.isInteger(v.setSequence))||v.restPausedMs!==undefined&&(!finite(v.restPausedMs,0,3600000)||v.restUntil!==null))throw Error('Ungültige Workout-Metadaten.');
  live={id:v.id as string,name:str(v.name,200),startedAt:v.startedAt,...(stamp(v.createdAt)?{createdAt:v.createdAt}:{}),...(stamp(v.lastSavedAt)?{lastSavedAt:v.lastSavedAt}:{}),...(v.status!==undefined?{status:v.pausedAt!==undefined?'paused' as const:'active' as const}:{}),...(typeof v.setSequence==='number'?{setSequence:v.setSequence}:{}),...(typeof v.restPausedMs==='number'?{restPausedMs:v.restPausedMs}:{}),exerciseIds:ids,sets,...blockFields(v),...pauseFields(v),...(v.segments!==undefined?{segments:validateSegments(v.segments,ids)}:{}),...prescriptionFields(v,ids),restUntil:v.restUntil as number|null,restSeconds:v.restSeconds,note:str(v.note,1000),...(typeof v.routineId==='string'?{routineId:str(v.routineId,150)}:{}),activeExerciseId:typeof v.activeExerciseId==='string'&&ids.includes(v.activeExerciseId)?v.activeExerciseId:ids[0],drafts};
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
 return {
  schema:4,
  programs:validatePrograms(raw.programs,routines.map(r=>r.id)),
  healthEntries:raw.healthEntries===undefined?[]:list(raw,'healthEntries',v=>{if(!record(v)||!ident(v)||!date(v.date)||typeof v.metric!=='string'||!Object.prototype.hasOwnProperty.call(healthSpecs,v.metric))return null;const metric=v.metric as HealthMetric;const spec=healthSpecs[metric];if(!finite(v.value,spec.min,spec.max)||(spec.integer&&!Number.isInteger(v.value)))return null;return {id:v.id as string,date:v.date,metric,value:v.value,note:str(v.note,300)};}),
  equipmentNotes:parseNotes(raw.equipmentNotes===undefined?{}:raw.equipmentNotes),
  journal:raw.journal===undefined?[]:list(raw,'journal',v=>record(v)&&ident(v)&&date(v.date)&&typeof v.text==='string'&&v.text.trim()&&v.text.length<=4000&&typeof v.tag==='string'&&v.tag.length<=40?{id:v.id as string,date:v.date,text:v.text,tag:v.tag}:null,20000),
  profile:{name:str(p.name,120),targetKg:target??null,startingKg:start??null,onboarded:p.onboarded===true,...(['strength','endurance','composition','athletic','mixed'].includes(p.priority as string)?{priority:p.priority as AthleteData['profile']['priority']}:{} )},
  weights,scans,exercises,routines,workouts,live,cardio,performance,habits,habitChecks:checks,nutrition,
  favoriteExerciseIds:[...new Set(favorites)],recovery,measurements,goals,weeklyPlan,
  settings:{coach:settings.coach!==false,restSeconds:rest,showWeightOnShare:settings.showWeightOnShare===true,tone:settings.tone==='calm'||settings.tone==='coach'||settings.tone==='chaos'||settings.tone==='off'?settings.tone:undefined,focusMode:settings.focusMode===true,eggs:settings.eggs===true,weightStep:finite(settings.weightStep,0.1,25)?settings.weightStep:2.5,paperMode:settings.paperMode===true,haptics:settings.haptics!==false,appearance:settings.appearance==='dark'||settings.appearance==='light'?settings.appearance:'system',restAlerts:settings.restAlerts===true,alertSound:settings.alertSound===true,reminderTime:typeof settings.reminderTime==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.reminderTime)?settings.reminderTime:undefined,widgetEnabled:settings.widgetEnabled===true,activityEnabled:settings.activityEnabled===true}
 };
}
export function parseAthleteBackup(text:string):AthleteData {
 if(text.length>15_000_000)throw Error('Backup überschreitet 15 MB.');
 let parsed:unknown;
 try{parsed=JSON.parse(text)}catch{throw Error('Diese Datei enthält kein gültiges JSON.');}
 const input=record(parsed)&&parsed.format==='ATHLETE-OS-Backup'?parsed.data:parsed;
 return validateRestoredData(input);
}
