import KV from 'expo-sqlite/kv-store';
import {validateRestoredData} from './validation';
import * as SQLite from 'expo-sqlite';
import {freshData} from '../utils/setup';
import {initializeRelational,readRelational,writeRelational,SqlPort} from './relational';
import type {AthleteData} from './schema';
let port:Promise<SqlPort>|null=null;let committed:AthleteData|null=null;let queue:Promise<unknown>=Promise.resolve();
function open():Promise<SqlPort>{if(!port)port=(async()=>{
 const database=await SQLite.openDatabaseAsync('form-v84-clean.db');
 await database.execAsync('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
 // The JS queue is the only writer. Use one dedicated connection and a single SQLite transaction.
 const make=(db:typeof database):SqlPort=>({exec:async sql=>{await db.execAsync(sql)},run:async(sql,params)=>{await db.runAsync(sql,...params)},all:<T>(sql:string,params:(string|number|null)[]=[])=>db.getAllAsync<T>(sql,...params),transaction:async <T>(fn:(tx:SqlPort)=>Promise<T>)=>{let result:T|undefined;await db.withTransactionAsync(async()=>{result=await fn(make(db))});return result as T;}});
 const p=make(database);await initializeRelational(p);return p;
 })().catch(e=>{port=null;throw e});return port;}
export async function loadRepository():Promise<AthleteData>{const db=await open();const existing=await readRelational(db);if(existing){committed=existing;return existing;}committed=await writeRelational(db,freshData(),null,true);return committed;}
const RESTORE_SNAPSHOT='form-v84-before-restore';
export async function previousRestoreSnapshot():Promise<AthleteData|null>{const raw=await KV.getItem(RESTORE_SNAPSHOT);return raw?validateRestoredData(JSON.parse(raw)):null;}
export function saveRepository(data:AthleteData,replacing=false):Promise<void>{queue=queue.catch(()=>{}).then(async()=>{const db=await open();if(replacing&&committed)await KV.setItem(RESTORE_SNAPSHOT,JSON.stringify(committed));committed=await writeRelational(db,data,committed,replacing||!committed)});return queue as Promise<void>;}
