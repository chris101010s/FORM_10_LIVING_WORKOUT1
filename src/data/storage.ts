import KV from 'expo-sqlite/kv-store';
import {AthleteData,emptyData} from './schema';
import {validateRestoredData} from './validation';
const KEY='athlete-os-v4-data'; // do not rename: retain data from version 4/5
const LEGACY_SNAPSHOT='athlete-os-v7-original';
const RECOVERY_KEY='athlete-os-recovery-v1';
let pending:Promise<unknown>=Promise.resolve();
let lastWritten:string|null=null;
let repairNeeded=false;

export async function loadData():Promise<AthleteData>{
 const current=await KV.getItem(KEY);
 if(!current){
  const backup=await KV.getItem(RECOVERY_KEY);
  if(!backup)return emptyData();
  try{const restored=validateRestoredData(JSON.parse(backup));lastWritten=backup;repairNeeded=true;return restored;}
  catch{throw new Error('Die Hauptdaten fehlen und die letzte Sicherung ist beschädigt. Nichts wurde überschrieben.');}
 }
 if(!(await KV.getItem(LEGACY_SNAPSHOT))){let valid=false;try{validateRestoredData(JSON.parse(current));valid=true}catch{/* invalid primary is handled below */}if(valid)await KV.setItem(LEGACY_SNAPSHOT,current);}
 try {const value=validateRestoredData(JSON.parse(current));lastWritten=current;repairNeeded=false;return value;}
 catch(primaryError){
  const backup=await KV.getItem(RECOVERY_KEY);
  if(backup){
   try {const value=validateRestoredData(JSON.parse(backup));lastWritten=backup;repairNeeded=true;return value;}
   catch {/* preserve error from primary record */}
  }
  throw new Error(`Die gespeicherten Daten sind beschädigt. Sie wurden NICHT gelöscht. ${String(primaryError)}`);
 }
}
export async function saveData(data:AthleteData):Promise<void>{
 const normalized=validateRestoredData(data);const next=JSON.stringify(normalized);
 pending=pending.catch(()=>{}).then(async()=>{
  if(lastWritten===next&&!repairNeeded)return;
  // Keep a previously known-good snapshot before replacing the live record.
  if(lastWritten!==null)await KV.setItem(RECOVERY_KEY,lastWritten);
  await KV.setItem(KEY,next);
  lastWritten=next;repairNeeded=false;
 });
 return pending as Promise<void>;
}
