import type {AthleteData,GymSet,Workout,LiveWorkout,PlannedSetRow} from './schema';
import {emptyData} from './schema';
import {immutableAthleteData} from './validation';

type Value=string|number|null;
export interface SqlPort {
 exec(sql:string):Promise<void>;
 run(sql:string,params:Value[]):Promise<void>;
 all<T>(sql:string,params?:Value[]):Promise<T[]>;
 transaction<T>(fn:(tx:SqlPort)=>Promise<T>):Promise<T>;
}
export const DATABASE_SCHEMA_VERSION=9;
const lists=['weights','scans','exercises','routines','cardio','performance','habits','nutrition','recovery','measurements','goals','journal','programs','healthEntries'] as const;
const extensionLists=['mediaAssets','planRevisions','planOccurrences','progressionDecisions'] as const;
const singles=['profile','settings','habitChecks','favoriteExerciseIds','weeklyPlan','equipmentNotes'] as const;
const baseTables=['form_meta','form_singleton','form_entity','form_session','form_set'] as const;
const rowTable='form_planned_row';
// Retain the physical representation of unknown extensions from an older/newer compatible writer.
const layouts=new WeakMap<AthleteData,Map<string,'single'|'entity'>>();
export const relationalSchema=`
CREATE TABLE IF NOT EXISTS form_meta (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS form_singleton (key TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS form_entity (collection TEXT NOT NULL, id TEXT NOT NULL, ordinal INTEGER NOT NULL, date TEXT, payload TEXT NOT NULL, PRIMARY KEY(collection,id));
CREATE INDEX IF NOT EXISTS form_entity_date ON form_entity(collection,date);
CREATE TABLE IF NOT EXISTS form_session (scope TEXT NOT NULL CHECK(scope IN ('live','history')), id TEXT NOT NULL, ordinal INTEGER NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, payload TEXT NOT NULL, PRIMARY KEY(scope,id));
CREATE INDEX IF NOT EXISTS form_session_date ON form_session(scope,finished_at);
CREATE TABLE IF NOT EXISTS form_set (scope TEXT NOT NULL, session_id TEXT NOT NULL, id TEXT NOT NULL, ordinal INTEGER NOT NULL, exercise_id TEXT NOT NULL, completed_at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(scope,session_id,id), FOREIGN KEY(scope,session_id) REFERENCES form_session(scope,id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS form_set_exercise ON form_set(exercise_id,completed_at);
CREATE TABLE IF NOT EXISTS form_planned_row (scope TEXT NOT NULL, session_id TEXT NOT NULL, id TEXT NOT NULL, ordinal INTEGER NOT NULL, exercise_id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(scope,session_id,id), FOREIGN KEY(scope,session_id) REFERENCES form_session(scope,id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS form_migration_snapshot (id TEXT PRIMARY KEY, from_version INTEGER NOT NULL, to_version INTEGER NOT NULL, created_at TEXT NOT NULL, payload TEXT NOT NULL);
`;
export type MigrationSnapshot={
 format:'FORM-Migration-Snapshot-v1';databaseSchema:number;targetSchema:number;createdAt:string;
 appVersion:'15.0.0';data:AthleteData;tables:Record<string,Record<string,Value>[]>;
};
export type MigrationOptions={beforeMigration?:(snapshot:MigrationSnapshot)=>Promise<void>;now?:()=>Date};

function canonical(value:unknown):string {
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object'){const obj=value as Record<string,unknown>;return '{'+Object.keys(obj).filter(k=>obj[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonical(obj[k])).join(',')+'}';}
 return JSON.stringify(value)??'null';
}
async function integrity(db:SqlPort){
 const check=await db.all<Record<string,unknown>>('PRAGMA quick_check');
 if(check.length!==1||Object.values(check[0])[0]!=='ok')throw Error('Die SQLite-Integritätsprüfung ist fehlgeschlagen. Der Datenbestand wurde nicht ersetzt.');
 if((await db.all('PRAGMA foreign_key_check')).length)throw Error('Beschädigte Datenbankbeziehungen. Der Datenbestand wurde nicht ersetzt.');
}
export async function checkRelationalIntegrity(db:SqlPort):Promise<void>{await integrity(db);if(!await readRelational(db))throw Error('Kein bestätigter Datenbestand.');}
async function tableNames(db:SqlPort){return (await db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")).map(r=>r.name);}
async function hasData(db:SqlPort,includeSnapshots=false){
 const names=includeSnapshots?[...baseTables,rowTable,'form_migration_snapshot']:[...baseTables,rowTable];
 const present=await tableNames(db);
 for(const table of names)if(present.includes(table)&&(await db.all<{n:number}>(`SELECT count(*) AS n FROM ${table}`))[0].n)return true;
 return false;
}
/** No resets: schema 8 is upgraded in place; future/partial databases fail closed. */
export async function initializeRelational(db:SqlPort,options:MigrationOptions={}):Promise<void>{
 await db.exec('PRAGMA foreign_keys=ON;');
 const names=await tableNames(db);
 const existing=baseTables.filter(t=>names.includes(t));
 if(!existing.length){
  if(names.length)throw Error('Vorhandene Datenbank ohne bekanntes FORM-Schema. Kein Erststart und kein Überschreiben.');
  await db.transaction(tx=>tx.exec(relationalSchema));return;
 }
 if(existing.length!==baseTables.length)throw Error('Unvollständiges FORM-Datenbankschema. Kein Erststart und kein Überschreiben.');
 await integrity(db);
 const meta=(await db.all<{version:number}>('SELECT version FROM form_meta WHERE id=1'))[0];
 if(!meta){
  if(await hasData(db,true))throw Error('Datenbank enthält Daten ohne gültigen Migrationsmarker. Bitte Backup prüfen.');
  await db.transaction(tx=>tx.exec(relationalSchema));return;
 }
 if(meta.version!==8&&meta.version!==DATABASE_SCHEMA_VERSION)throw Error(`Nicht unterstütztes FORM-Datenbankschema: ${meta.version}`);
 if(meta.version===DATABASE_SCHEMA_VERSION){
  if(!names.includes(rowTable)||!names.includes('form_migration_snapshot'))throw Error('FORM-Datenbankschema 9 ist unvollständig. Keine automatische Reparatur mit leeren Daten.');
  return;
 }
 await db.transaction(async tx=>{
  const original=await readRelational(tx);if(!original)throw Error('Migrationsquelle fehlt.');
  const raw:MigrationSnapshot['tables']={};
  for(const name of baseTables)raw[name]=await tx.all(`SELECT * FROM ${name}`);
  const snapshot:MigrationSnapshot={format:'FORM-Migration-Snapshot-v1',databaseSchema:8,targetSchema:DATABASE_SCHEMA_VERSION,createdAt:(options.now?.()??new Date()).toISOString(),appVersion:'15.0.0',data:original,tables:raw};
  // The repository also writes this recoverable backup to its separate KV store.
  // A failed backup aborts before schema or marker changes.
  await options.beforeMigration?.(snapshot);
  await tx.exec(relationalSchema);
  await tx.run('INSERT INTO form_migration_snapshot(id,from_version,to_version,created_at,payload) VALUES(?,?,?,?,?)',['8-to-9',8,DATABASE_SCHEMA_VERSION,snapshot.createdAt,JSON.stringify(snapshot)]);
  await tx.run('UPDATE form_meta SET version=?,updated_at=? WHERE id=1',[DATABASE_SCHEMA_VERSION,snapshot.createdAt]);
  await integrity(tx);
  const after=await readRelational(tx);
  if(canonical(after)!==canonical(original))throw Error('Datenbankmigration: Kontrollvergleich fehlgeschlagen.');
 });
}

export async function readRelational(db:SqlPort):Promise<AthleteData|null>{
 const meta=(await db.all<{version:number}>('SELECT version FROM form_meta WHERE id=1'))[0];
 if(!meta){if(await hasData(db,true))throw Error('Datenbank enthält Daten ohne gültigen Migrationsmarker. Bitte Backup prüfen.');return null;}
 if(meta.version!==8&&meta.version!==DATABASE_SCHEMA_VERSION)throw Error(`Nicht unterstütztes FORM-Datenbankschema: ${meta.version}`);
 const data=emptyData(),out=data as unknown as Record<string,unknown>;
 const singletonRows=await db.all<{key:string;payload:string}>('SELECT key,payload FROM form_singleton');
 for(const k of singles)if(!singletonRows.some(r=>r.key===k))throw Error(`Datenbankfeld fehlt: ${k}`);
 for(const row of singletonRows){if(['schema','workouts','live'].includes(row.key))throw Error('Unzulässiges Datenbankfeld.');Object.defineProperty(out,row.key,{value:JSON.parse(row.payload),enumerable:true,writable:true,configurable:true});}
 const entities=await db.all<{collection:string;id:string;payload:string}>('SELECT collection,id,payload FROM form_entity ORDER BY collection,ordinal');
 for(const k of lists)out[k]=[];
 for(const k of extensionLists)if(!Object.prototype.hasOwnProperty.call(out,k))out[k]=[];
 const entityCollections=new Map<string,unknown[]>();
 for(const row of entities){
  if(['schema','workouts','live'].includes(row.collection)||singletonRows.some(s=>s.key===row.collection))throw Error('Mehrdeutige Datenbankliste.');
  const item=JSON.parse(row.payload);if(!item||item.id!==row.id)throw Error('ID und gespeicherter Eintrag widersprechen sich.');
  const values=entityCollections.get(row.collection)||[];values.push(item);entityCollections.set(row.collection,values);
 }
 for(const [collection,items] of entityCollections)Object.defineProperty(out,collection,{value:items,enumerable:true,writable:true,configurable:true});
 const sessions=await db.all<{scope:string;id:string;started_at:string;finished_at:string|null;payload:string}>('SELECT scope,id,started_at,finished_at,payload FROM form_session ORDER BY scope,ordinal');
 const entries=await db.all<{scope:string;session_id:string;id:string;exercise_id:string;completed_at:string;payload:string}>('SELECT scope,session_id,id,exercise_id,completed_at,payload FROM form_set ORDER BY scope,session_id,ordinal');
 const map=new Map<string,GymSet[]>(),sessionKeys=new Set(sessions.map(s=>JSON.stringify([s.scope,s.id])));
 for(const e of entries){
  const k=JSON.stringify([e.scope,e.session_id]),s=JSON.parse(e.payload);
  if(!sessionKeys.has(k)||!s||s.id!==e.id||s.exerciseId!==e.exercise_id||s.at!==e.completed_at)throw Error('Satzbeziehung oder Satzdaten beschädigt.');
  const values=map.get(k)||[];values.push(s);map.set(k,values);
 }
 const rowMap=new Map<string,PlannedSetRow[]>();
 if(meta.version>=9){
  const rows=await db.all<{scope:string;session_id:string;id:string;exercise_id:string;payload:string}>('SELECT scope,session_id,id,exercise_id,payload FROM form_planned_row ORDER BY scope,session_id,ordinal');
  for(const row of rows){const k=JSON.stringify([row.scope,row.session_id]),value=JSON.parse(row.payload);if(!sessionKeys.has(k)||!value||value.id!==row.id||value.exerciseId!==row.exercise_id)throw Error('Geplante Satzbeziehung beschädigt.');const values=rowMap.get(k)||[];values.push(value);rowMap.set(k,values);}
 }
 if(sessions.filter(s=>s.scope==='live').length>1)throw Error('Mehrere Live-Workouts in Datenbank.');
 for(const session of sessions){
  const rest=JSON.parse(session.payload),k=JSON.stringify([session.scope,session.id]);
  if(!rest||rest.id!==session.id||rest.startedAt!==session.started_at||(session.scope==='history'&&rest.finishedAt!==session.finished_at))throw Error('Session-Metadaten widersprechen dem gespeicherten Inhalt.');
  const w={...rest,sets:map.get(k)||[],...(rowMap.has(k)?{plannedRows:rowMap.get(k)}:{})};
  if(session.scope==='live')data.live=w;else data.workouts.push(w);
 }
 const clean=immutableAthleteData(data);
 const layout=new Map<string,'single'|'entity'>();for(const row of singletonRows)layout.set(row.key,'single');for(const key of lists)layout.set(key,'entity');for(const key of extensionLists)if(!layout.has(key))layout.set(key,'entity');for(const row of entities)layout.set(row.collection,'entity');layouts.set(clean,layout);
 return clean;
}

type Row={key:Value[];values:Value[]};
type Group={id:string;name:string;keys:string[];columns:string[];source:unknown;rows:Row[]};
const payloads=new WeakMap<object,string>();
const groupCache=new WeakMap<AthleteData,Group[]>();
const headerPayloads=new WeakMap<object,string>();
let serialized=0;
function json(value:unknown):string{
 if(value&&typeof value==='object'&&Object.isFrozen(value)){const cached=payloads.get(value);if(cached!==undefined)return cached;serialized++;const result=JSON.stringify(value);payloads.set(value,result);return result;}
 serialized++;return JSON.stringify(value);
}
/** Counts payload serialization work, never user values. */
export function persistenceDiagnostics(reset=false){const result={serializedPayloads:serialized};if(reset)serialized=0;return result;}
function groups(data:AthleteData):Group[]{
 const cached=groupCache.get(data);if(cached)return cached;
 const out:Group[]=[];
 for(const [key,value] of Object.entries(data)){
  if(key==='schema'||key==='live'||key==='workouts'||value===undefined)continue;
  const entity=(layouts.get(data)?.get(key)??([...lists,...extensionLists].includes(key as typeof lists[number])?'entity':'single'))==='entity';
  if(entity){
   const entries=value as {id:string;date?:string}[];
   if(new Set(entries.map(x=>x.id)).size!==entries.length)throw Error(`Doppelte ID in ${key}.`);
   out.push({id:'entity:'+key,name:'form_entity',keys:['collection','id'],columns:['collection','id','ordinal','date','payload'],source:value,rows:entries.map((x,i)=>({key:[key,x.id],values:[key,x.id,i,typeof x.date==='string'?x.date:null,json(x)]}))});
  }else out.push({id:'single:'+key,name:'form_singleton',keys:['key'],columns:['key','payload'],source:value,rows:[{key:[key],values:[key,json(value)]}]});
 }
 const add=(scope:'live'|'history',sessions:(Workout|LiveWorkout)[],source:unknown)=>{
  const headers:Row[]=[],sets:Row[]=[],planned:Row[]=[];
  for(const [i,w] of sessions.entries()){
   const {sets:entries,plannedRows,...rest}=w;
   let payload=headerPayloads.get(w);
   if(payload===undefined){payload=json({...rest,...(plannedRows!==undefined?{plannedRows:[]}: {})});headerPayloads.set(w,payload);}
   headers.push({key:[scope,w.id],values:[scope,w.id,i,w.startedAt,'finishedAt' in w?w.finishedAt:null,payload]});
   for(const [j,s] of entries.entries())sets.push({key:[scope,w.id,s.id],values:[scope,w.id,s.id,j,s.exerciseId,s.at,json(s)]});
   for(const [j,row] of (plannedRows||[]).entries())planned.push({key:[scope,w.id,row.id],values:[scope,w.id,row.id,j,row.exerciseId,json(row)]});
  }
  out.push({id:'session:'+scope,name:'form_session',keys:['scope','id'],columns:['scope','id','ordinal','started_at','finished_at','payload'],source,rows:headers});
  out.push({id:'sets:'+scope,name:'form_set',keys:['scope','session_id','id'],columns:['scope','session_id','id','ordinal','exercise_id','completed_at','payload'],source:scope==='live'?data.live?.sets:source,rows:sets});
  out.push({id:'planned:'+scope,name:'form_planned_row',keys:['scope','session_id','id'],columns:['scope','session_id','id','ordinal','exercise_id','payload'],source:scope==='live'?data.live?.plannedRows:source,rows:planned});
 };
 add('history',data.workouts,data.workouts);add('live',data.live?[data.live]:[],data.live);
 groupCache.set(data,out);return out;
}
const rowKey=(row:Row)=>JSON.stringify(row.key);
const sameRow=(a:Row,b:Row)=>a.values.length===b.values.length&&a.values.every((v,i)=>v===b.values[i]);
const rank=(name:string)=>name==='form_set'||name==='form_planned_row'?2:name==='form_session'?1:0;

/** Commits changed rows only. Failure leaves the previous committed state untouched. */
export async function writeRelational(db:SqlPort,data:AthleteData,previous:AthleteData|null,verify=false):Promise<AthleteData>{
 const clean=immutableAthleteData(data);
 if(clean===previous)return clean;
 const before=previous?immutableAthleteData(previous):null;
 if(!layouts.has(clean))layouts.set(clean,new Map(before?layouts.get(before):undefined));
 const next=groups(clean),old=before?groups(before):[];
 const changed=next.filter(g=>{const before=old.find(b=>b.id===g.id);return !before||before.source!==g.source;});
 const removed=old.filter(g=>!next.some(n=>n.id===g.id));
 await db.transaction(async tx=>{
  const meta=(await tx.all<{version:number}>('SELECT version FROM form_meta WHERE id=1'))[0];
  if(before&&(!meta||meta.version!==DATABASE_SCHEMA_VERSION))throw Error(meta?`Nicht unterstütztes FORM-Datenbankschema: ${meta.version}`:'Datenbank-Migrationsmarker fehlt. Nichts wurde überschrieben.');
  if(!previous&&await hasData(tx,true))throw Error('Schreiben ohne geladenen Datenbestand abgebrochen. Kein nachgewiesener Erststart.');
  for(const before of [...old].sort((a,b)=>rank(b.name)-rank(a.name))){
   const after=next.find(g=>g.id===before.id);if(after?.source===before.source)continue;
   const keep=new Set(after?.rows.map(rowKey)||[]);
   for(const row of before.rows)if(!keep.has(rowKey(row)))await tx.run(`DELETE FROM ${before.name} WHERE ${before.keys.map(k=>`${k}=?`).join(' AND ')}`,row.key);
  }
  for(const group of changed.sort((a,b)=>rank(a.name)-rank(b.name))){
   const prior=new Map((old.find(g=>g.id===group.id)?.rows||[]).map(r=>[rowKey(r),r]));
   const update=group.columns.filter(c=>!group.keys.includes(c)).map(c=>`${c}=excluded.${c}`).join(',');
   const sql=`INSERT INTO ${group.name} (${group.columns.join(',')}) VALUES (${group.columns.map(()=>'?').join(',')}) ON CONFLICT (${group.keys.join(',')}) DO UPDATE SET ${update}`;
   for(const row of group.rows){const before=prior.get(rowKey(row));if(!before||!sameRow(before,row))await tx.run(sql,row.values);}
  }
  if(changed.length||removed.length)await tx.run('INSERT INTO form_meta(id,version,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET version=excluded.version,updated_at=excluded.updated_at',[DATABASE_SCHEMA_VERSION,new Date().toISOString()]);
  if(verify){await integrity(tx);const read=await readRelational(tx);if(!read||canonical(read)!==canonical(clean))throw Error('Datenbankmigration: Kontrollvergleich fehlgeschlagen.');}
 });
 return clean;
}
