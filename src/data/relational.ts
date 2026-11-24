import type {AthleteData,GymSet,Workout,LiveWorkout} from './schema';
import {emptyData} from './schema';
import {validateRestoredData} from './validation';
type Value=string|number|null;
export interface SqlPort {exec(sql:string):Promise<void>; run(sql:string,params:Value[]):Promise<void>; all<T>(sql:string,params?:Value[]):Promise<T[]>; transaction<T>(fn:(tx:SqlPort)=>Promise<T>):Promise<T>}
const lists=['weights','scans','exercises','routines','cardio','performance','habits','nutrition','recovery','measurements','goals','journal','programs','healthEntries'] as const;
const singles=['profile','settings','habitChecks','favoriteExerciseIds','weeklyPlan','equipmentNotes'] as const;
export const relationalSchema=`
CREATE TABLE IF NOT EXISTS form_meta (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS form_singleton (key TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS form_entity (collection TEXT NOT NULL, id TEXT NOT NULL, ordinal INTEGER NOT NULL, date TEXT, payload TEXT NOT NULL, PRIMARY KEY(collection,id));
CREATE INDEX IF NOT EXISTS form_entity_date ON form_entity(collection,date);
CREATE TABLE IF NOT EXISTS form_session (scope TEXT NOT NULL CHECK(scope IN ('live','history')), id TEXT NOT NULL, ordinal INTEGER NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, payload TEXT NOT NULL, PRIMARY KEY(scope,id));
CREATE INDEX IF NOT EXISTS form_session_date ON form_session(scope,finished_at);
CREATE TABLE IF NOT EXISTS form_set (scope TEXT NOT NULL, session_id TEXT NOT NULL, id TEXT NOT NULL, ordinal INTEGER NOT NULL, exercise_id TEXT NOT NULL, completed_at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(scope,session_id,id), FOREIGN KEY(scope,session_id) REFERENCES form_session(scope,id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS form_set_exercise ON form_set(exercise_id,completed_at);
`;
type Row={key:Value[];values:Value[]};
type Table={name:string;keys:string[];columns:string[];rows:Row[]};
function tables(data:AthleteData):Table[]{
 const singleton:Table={name:'form_singleton',keys:['key'],columns:['key','payload'],rows:singles.map(k=>({key:[k],values:[k,JSON.stringify(data[k]??(k==='equipmentNotes'?{}:[]))]}))};
 const entities:Table={name:'form_entity',keys:['collection','id'],columns:['collection','id','ordinal','date','payload'],rows:[]};
 for(const k of lists)for(const [i,x] of (data[k]||[]).entries()){const id=x.id;entities.rows.push({key:[k,id],values:[k,id,i,'date' in x?String(x.date):null,JSON.stringify(x)]});}
 const sessions:Table={name:'form_session',keys:['scope','id'],columns:['scope','id','ordinal','started_at','finished_at','payload'],rows:[]};
 const sets:Table={name:'form_set',keys:['scope','session_id','id'],columns:['scope','session_id','id','ordinal','exercise_id','completed_at','payload'],rows:[]};
 const add=(scope:'live'|'history',w:Workout|LiveWorkout,i:number)=>{const {sets:entries,...rest}=w;sessions.rows.push({key:[scope,w.id],values:[scope,w.id,i,w.startedAt,'finishedAt' in w?w.finishedAt:null,JSON.stringify(rest)]});for(const [j,s] of entries.entries())sets.rows.push({key:[scope,w.id,s.id],values:[scope,w.id,s.id,j,s.exerciseId,s.at,JSON.stringify(s)]});};
 data.workouts.forEach((w,i)=>add('history',w,i));if(data.live)add('live',data.live,0);
 return [singleton,entities,sessions,sets];
}
function key(r:Row){return JSON.stringify(r.key)}
export async function initializeRelational(db:SqlPort){await db.exec('PRAGMA foreign_keys=ON;');await db.exec(relationalSchema);}
export async function readRelational(db:SqlPort):Promise<AthleteData|null>{
 const meta=(await db.all<{version:number}>('SELECT version FROM form_meta WHERE id=1'))[0];if(!meta){const rows=(await db.all<{n:number}>('SELECT (SELECT count(*) FROM form_singleton)+(SELECT count(*) FROM form_entity)+(SELECT count(*) FROM form_session)+(SELECT count(*) FROM form_set) AS n'))[0];if(rows?.n)throw Error('Datenbank enthält Daten ohne gültigen Migrationsmarker. Bitte Backup prüfen.');return null;}if(meta.version!==8)throw Error(`Nicht unterstütztes FORM-Datenbankschema: ${meta.version}`);
 const data=emptyData();const out=data as unknown as Record<string,unknown>;
 const singletonRows=await db.all<{key:string;payload:string}>('SELECT key,payload FROM form_singleton');for(const k of singles){const row=singletonRows.find(r=>r.key===k);if(!row)throw Error(`Datenbankfeld fehlt: ${k}`);out[k]=JSON.parse(row.payload);}
 const entities=await db.all<{collection:string;payload:string}>('SELECT collection,payload FROM form_entity ORDER BY collection,ordinal');for(const k of lists)out[k]=entities.filter(r=>r.collection===k).map(r=>JSON.parse(r.payload));
 const sessions=await db.all<{scope:string;id:string;payload:string}>('SELECT scope,id,payload FROM form_session ORDER BY scope,ordinal');const entries=await db.all<{scope:string;session_id:string;payload:string}>('SELECT scope,session_id,payload FROM form_set ORDER BY scope,session_id,ordinal');const map=new Map<string,GymSet[]>();for(const e of entries){const k=JSON.stringify([e.scope,e.session_id]);const l=map.get(k)||[];l.push(JSON.parse(e.payload));map.set(k,l);}
 if(sessions.filter(s=>s.scope==='live').length>1)throw Error('Mehrere Live-Workouts in Datenbank.');
 for(const s of sessions){const w={...JSON.parse(s.payload),sets:map.get(JSON.stringify([s.scope,s.id]))||[]};if(s.scope==='live')data.live=w;else data.workouts.push(w);}
 return validateRestoredData(data);
}
/** All changes are one SQLite transaction. The previously committed state remains on failure. */
export async function writeRelational(db:SqlPort,data:AthleteData,previous:AthleteData|null,verify=false):Promise<AthleteData>{
 const clean=validateRestoredData(data);const next=tables(clean);const old=previous?tables(previous):null;
 await db.transaction(async tx=>{
  if(!old){for(const t of [...next].reverse())await tx.run(`DELETE FROM ${t.name}`,[]);}
  else for(const t of [...next].reverse()){const before=old.find(x=>x.name===t.name)!;const keep=new Set(t.rows.map(key));for(const r of before.rows)if(!keep.has(key(r)))await tx.run(`DELETE FROM ${t.name} WHERE ${t.keys.map(k=>`${k}=?`).join(' AND ')}`,r.key);}
  for(const t of next){const prior=new Map((old?.find(x=>x.name===t.name)?.rows||[]).map(r=>[key(r),JSON.stringify(r.values)]));const update=t.columns.filter(c=>!t.keys.includes(c)).map(c=>`${c}=excluded.${c}`).join(',');const sql=`INSERT INTO ${t.name} (${t.columns.join(',')}) VALUES (${t.columns.map(()=>'?').join(',')}) ON CONFLICT (${t.keys.join(',')}) DO UPDATE SET ${update}`;for(const r of t.rows)if(prior.get(key(r))!==JSON.stringify(r.values))await tx.run(sql,r.values);}
  await tx.run('INSERT INTO form_meta(id,version,updated_at) VALUES(1,8,?) ON CONFLICT(id) DO UPDATE SET version=excluded.version,updated_at=excluded.updated_at',[new Date().toISOString()]);
  if(verify){const read=await readRelational(tx);if(!read||JSON.stringify(read)!==JSON.stringify(clean))throw Error('Datenbankmigration: Kontrollvergleich fehlgeschlagen.');}
 });return clean;
}
