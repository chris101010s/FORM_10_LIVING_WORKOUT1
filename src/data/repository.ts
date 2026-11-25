import KV from 'expo-sqlite/kv-store';
import {File} from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import {immutableAthleteData,validateRestoredData} from './validation';
import {freshData} from '../utils/setup';
import {initializeRelational,readRelational,writeRelational,checkRelationalIntegrity,SqlPort,MigrationSnapshot,DATABASE_SCHEMA_VERSION} from './relational';
import type {AthleteData} from './schema';
import {validatePersistentTransition} from './secondPassValidation';

export const DATABASE_NAME='form-v84-clean.db';
const INITIALIZED='form-v15-database-initialized';
const RESTORE_SNAPSHOT='form-v84-before-restore';
const RESTORE_INFO='form-v15-before-restore-info';
const MIGRATION_SNAPSHOT='form-v15-before-migration-8-to-9';
let port:Promise<SqlPort>|null=null;
let committed:AthleteData|null=null;
let queue:Promise<unknown>=Promise.resolve();
let loadPromise:Promise<AthleteData>|null=null;
let loadSucceeded=false;
let provenNewDatabase=false;
let lastRestoreToken:number|undefined;
let lastCommittedAt:string|null=null;
export type RepositorySnapshotHandler=(data:AthleteData,reason:'version'|'preimport',key?:string)=>Promise<void>;
let snapshotHandler:RepositorySnapshotHandler=async(data,reason,key)=>{const manager=await (await import('../utils/localSnapshots')).localSnapshots();if(reason==='version')await manager.ensureVersion(data);else await manager.create(data,'preimport',key);};
/** Platform adapter injection; the production default always verifies the private local snapshot. */
export function configureRepositorySnapshotHandler(handler:RepositorySnapshotHandler){snapshotHandler=handler;}
export type SaveReceipt={savedAt:string;changed:boolean};
/** Read-only committed state. Pending RAM edits are deliberately excluded. */
export function getRepositoryCommitStatus():{data:AthleteData|null;savedAt:string|null}{return {data:loadSucceeded?committed:null,savedAt:loadSucceeded?lastCommittedAt:null};}
export type IntegrityReceipt={checkedAt:string;status:'ok'|'failed';code?:'DATABASE_INTEGRITY_FAILED'};
let lastIntegrity:IntegrityReceipt|null=null;
export function repositoryFileInfo(){let byteLength=0;for(const suffix of ['', '-wal', '-shm']){const file=new File(SQLite.defaultDatabaseDirectory,DATABASE_NAME+suffix);if(file.exists)byteLength+=file.size??0;}return {databaseSchema:DATABASE_SCHEMA_VERSION,byteLength,lastSuccessfulWrite:loadSucceeded?lastCommittedAt:null,lastIntegrity};}
export function checkRepositoryIntegrity():Promise<IntegrityReceipt>{const task=queue.catch(()=>{}).then(async()=>{if(!loadSucceeded)throw Error('Datenbestand zuerst erfolgreich laden.');try{await checkRelationalIntegrity(await open());lastIntegrity={checkedAt:new Date().toISOString(),status:'ok'};}catch{lastIntegrity={checkedAt:new Date().toISOString(),status:'failed',code:'DATABASE_INTEGRITY_FAILED'};}return lastIntegrity;});queue=task;return task;}

async function preserveMigration(snapshot:MigrationSnapshot){
 // Never replace the first pre-upgrade copy on a retry. It lives in the separate KV database.
 const existing=await KV.getItem(MIGRATION_SNAPSHOT);
 if(existing){const saved=JSON.parse(existing);if(saved?.format!=='FORM-Migration-Snapshot-v1'||saved.databaseSchema!==8||saved.targetSchema!==9||!Number.isFinite(Date.parse(saved.createdAt)))throw Error('Die vorhandene Migrationssicherung ist beschädigt. Migration angehalten.');validateRestoredData(saved.data);return;}
 await KV.setItem(MIGRATION_SNAPSHOT,JSON.stringify(snapshot));
}
function open():Promise<SqlPort>{
 if(!port)port=(async()=>{
  const marker=await KV.getItem(INITIALIZED);
  const file=new File(SQLite.defaultDatabaseDirectory,DATABASE_NAME);
  provenNewDatabase=!file.exists;
  if(file.exists&&file.size===0||marker&&!file.exists)throw Error('Die bisherige FORM-Datenbank fehlt oder ist leer. Kein Erststart: vorhandene Sicherung prüfen.');
  if(!file.exists){
   // v10 did not have INITIALIZED. Inspect key names only; never auto-import abandoned legacy data.
   const keys=await KV.getAllKeys();
   if(keys.some(key=>[RESTORE_SNAPSHOT,MIGRATION_SNAPSHOT,'form-v84-device-auth-lock','athlete-os-v4-data','athlete-os-v7-original','athlete-os-recovery-v1'].includes(key)))throw Error('Vorhandene FORM-Schlüssel, aber fehlende Hauptdatenbank. Kein bestätigter Erststart; vorhandene Daten und Sicherungen zuerst prüfen.');
  }
  const database=await SQLite.openDatabaseAsync(DATABASE_NAME);
  try{
   await database.execAsync('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
   // This dedicated connection is private to the serialized repository queue.
   // BEGIN IMMEDIATE preserves foreign_keys on the same connection and takes the write lock up front.
   const make=(db:typeof database):SqlPort=>({
    exec:async sql=>{await db.execAsync(sql)},
    run:async(sql,params)=>{await db.runAsync(sql,...params)},
    all:<T>(sql:string,params:(string|number|null)[]=[])=>db.getAllAsync<T>(sql,...params),
    transaction:async <T>(fn:(tx:SqlPort)=>Promise<T>)=>{
     await db.execAsync('BEGIN IMMEDIATE');
     try{const result=await fn(make(db));await db.execAsync('COMMIT');return result;}
     catch(error){try{await db.execAsync('ROLLBACK')}catch{/* Preserve the original fault. */}throw error;}
    }
   });
   const p=make(database);await initializeRelational(p,{beforeMigration:preserveMigration});return p;
  }catch(error){try{await database.closeAsync()}catch{/* Preserve the original fault. */}throw error;}
 })().catch(error=>{port=null;throw error;});
 return port;
}
export function loadRepository():Promise<AthleteData>{
 if(loadSucceeded&&committed)return Promise.resolve(committed);
 if(!loadPromise)loadPromise=(async()=>{
  const db=await open(),existing=await readRelational(db);
  if(existing)committed=existing;
  else{
   if(!provenNewDatabase||await KV.getItem(INITIALIZED))throw Error('Kein bestätigter Erststart. Ein leerer Datenbestand wird nicht über vorhandene Daten geschrieben.');
   committed=await writeRelational(db,freshData(),null,true);
  }
  const meta=(await db.all<{updated_at:string}>('SELECT updated_at FROM form_meta WHERE id=1'))[0];
  if(!meta||!Number.isFinite(Date.parse(meta.updated_at)))throw Error('Bestätigter Speicherzeitpunkt fehlt. Die Datenbank wurde nicht ersetzt.');
  lastCommittedAt=meta.updated_at;
  await KV.setItem(INITIALIZED,JSON.stringify({database:DATABASE_NAME,schema:DATABASE_SCHEMA_VERSION,confirmedAt:new Date().toISOString()}));
  loadSucceeded=true;
  return committed;
 })().catch(error=>{loadPromise=null;throw error;});
 return loadPromise;
}
export async function previousRestoreSnapshot():Promise<AthleteData|null>{const raw=await KV.getItem(RESTORE_SNAPSHOT);return raw?validateRestoredData(JSON.parse(raw)):null;}
async function migrationSnapshot():Promise<MigrationSnapshot|null>{
 const raw=await KV.getItem(MIGRATION_SNAPSHOT);if(!raw)return null;
 const snapshot=JSON.parse(raw) as MigrationSnapshot;
 if(snapshot?.format!=='FORM-Migration-Snapshot-v1'||snapshot.databaseSchema!==8||snapshot.targetSchema!==9||!Number.isFinite(Date.parse(snapshot.createdAt)))throw Error('Ungültige Migrationssicherung.');
 return {...snapshot,data:validateRestoredData(snapshot.data)};
}
export async function previousMigrationSnapshot():Promise<AthleteData|null>{return (await migrationSnapshot())?.data??null;}
export async function migrationSnapshotInfo():Promise<{createdAt:string;databaseSchema:number;targetSchema:number}|null>{const snapshot=await migrationSnapshot();return snapshot?{createdAt:snapshot.createdAt,databaseSchema:snapshot.databaseSchema,targetSchema:snapshot.targetSchema}:null;}
export function saveRepository(data:AthleteData,replacing=false,restoreToken?:number):Promise<SaveReceipt>{
 // Capture immutable validated data now, not later when an earlier queued save has finished.
 let next:AthleteData;
 try{next=immutableAthleteData(data)}catch(error){return Promise.reject(error);}
 queue=queue.catch(()=>{}).then(async()=>{
  if(!committed||!loadSucceeded)throw Error('Speichern ist erst nach erfolgreich geladenem Datenbestand möglich.');
  const db=await open();
  if(!replacing)validatePersistentTransition(committed,next);
  if(next!==committed)await snapshotHandler(committed,'version');
  if(replacing&&(restoreToken===undefined||restoreToken!==lastRestoreToken)){
   await snapshotHandler(committed,'preimport',restoreToken===undefined?undefined:String(restoreToken));
   await KV.setItem(RESTORE_SNAPSHOT,JSON.stringify(committed));
   await KV.setItem(RESTORE_INFO,JSON.stringify({schema:DATABASE_SCHEMA_VERSION,createdAt:new Date().toISOString()}));
   lastRestoreToken=restoreToken;
  }
  const before=committed;
  committed=await writeRelational(db,next,committed,replacing);
  if(committed!==before)lastCommittedAt=new Date().toISOString();
  if(!lastCommittedAt)throw Error('Bestätigter Speicherzeitpunkt fehlt.');
  return {savedAt:lastCommittedAt,changed:committed!==before};
 });
 return queue as Promise<SaveReceipt>;
}
