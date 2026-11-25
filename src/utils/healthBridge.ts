import {Platform} from 'react-native';
import {requireOptionalNativeModule} from 'expo';
import type {HealthExportRecord,NutritionMetric,NutritionSnapshot} from './nutritionTypes';
import type {HealthDeleteReceipt} from './nutritionSync';
import type {HealthDaySnapshot} from './healthDayTypes';

export type HealthExportReceipt={uuid:string;syncIdentifier:string;syncVersion:number};
export type FormHealthBridge={
  available:()=>boolean;
  authorize:()=>Promise<boolean>;
  readDay:(from:number,to:number)=>Promise<{values:Record<string,number>;unavailable:string[]}>;
  readDaySources:(from:number,to:number)=>Promise<HealthDaySnapshot>;
  authorizeNutrition:(metrics:NutritionMetric[])=>Promise<boolean>;
  readNutrition:(from:number,to:number,metrics:NutritionMetric[])=>Promise<NutritionSnapshot>;
  authorizeExport:(kind:'weight'|'workout')=>Promise<boolean>;
  writeWeight:(entryId:string,kg:number,atMs:number,version:number,fingerprint:string)=>Promise<HealthExportReceipt>;
  writeWorkout:(entryId:string,fromMs:number,toMs:number,duration:number,version:number,fingerprint:string)=>Promise<HealthExportReceipt>;
  deleteExport:(kind:'weight'|'workout',entryId:string,version:number,fingerprint:string,expectedUUID:string)=>Promise<HealthDeleteReceipt>;
};
/** Availability is a native build capability, never inferred from being on iOS alone. */
export function healthBridge():FormHealthBridge|null {
  if(Platform.OS!=='ios')return null;
  try {const bridge=requireOptionalNativeModule<FormHealthBridge>('FormHealth');return bridge?.available()===true?bridge:null;}catch{return null;}
}
const exportQueues=new Map<string,Promise<unknown>>();
/** A delete must wait for an earlier write, even when two detail screens issue actions. */
function serializeExport<T>(identifier:string,action:()=>Promise<T>):Promise<T>{
  const queued=(exportQueues.get(identifier)||Promise.resolve()).catch(()=>{}).then(action);
  exportQueues.set(identifier,queued);
  return queued.finally(()=>{if(exportQueues.get(identifier)===queued)exportQueues.delete(identifier);});
}
export async function sendHealthExport(bridge:FormHealthBridge,record:HealthExportRecord):Promise<HealthExportReceipt> {
  if(record.status==='deletePending'||record.status==='deleted')throw Error('Ein Löschauftrag wird nicht als Export gesendet.');
  const request=record.request;
  return serializeExport(record.syncIdentifier,async()=>{
    if(!await bridge.authorizeExport(request.kind))throw Error('Schreibzugriff wurde nicht freigegeben. Der Eintrag bleibt in FORM erhalten.');
    return request.kind==='weight'
      ? bridge.writeWeight(request.entryId,request.kg,Date.parse(request.at),record.syncVersion,record.fingerprint)
      : bridge.writeWorkout(request.entryId,Date.parse(request.startedAt),Date.parse(request.finishedAt),request.durationSeconds,record.syncVersion,record.fingerprint);
  });
}
export async function deleteHealthExport(bridge:FormHealthBridge,record:HealthExportRecord):Promise<HealthDeleteReceipt> {
  if(record.status!=='deletePending')throw Error('Zuerst einen eigenen Löschauftrag lokal bestätigen.');
  return serializeExport(record.syncIdentifier,async()=>{
    if(!await bridge.authorizeExport(record.request.kind))throw Error('Schreibzugriff fehlt. Der FORM-Export wurde nicht gelöscht.');
    if(typeof bridge.deleteExport!=='function')throw Error('Dieser installierte Build unterstützt das Löschen eigener Exporte noch nicht.');
    return bridge.deleteExport(record.request.kind,record.request.entryId,record.syncVersion,record.fingerprint,record.healthKitUUID||'');
  });
}
