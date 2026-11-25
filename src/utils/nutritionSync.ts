import type {HealthExportRecord,HealthExportRequest,HealthNutritionSample,HealthNutritionState,HealthSource,NutritionCoverage,NutritionMetric,NutritionSnapshot,NutritionSyncAttempt,NutritionWindow} from './nutritionTypes';

export const nutritionMetrics: NutritionMetric[] = ['kcal','protein','carbs','fat','waterMl'];
export const nutritionLabels: Record<NutritionMetric,{label:string;unit:'kcal'|'g'|'ml'}> = {
  kcal:{label:'Nahrungsenergie',unit:'kcal'}, protein:{label:'Protein',unit:'g'},
  carbs:{label:'Kohlenhydrate',unit:'g'}, fat:{label:'Fett',unit:'g'},waterMl:{label:'Wasser',unit:'ml'}
};
export const newHealthNutrition = ():HealthNutritionState => ({version:1,authorizationRequested:false,requestedMetrics:['kcal','protein','carbs','fat'],samples:[],exports:[]});
const record = (x:unknown):x is Record<string,unknown> => !!x&&typeof x==='object'&&!Array.isArray(x);
function text(value:unknown,name:string,max=300):string {if(typeof value!=='string'||!value.trim()||value.length>max)throw Error(`Apple Health: ${name} ungültig.`);return value;}
function iso(value:unknown,name:string):string {const s=text(value,name,80);if(!/^\d{4}-\d{2}-\d{2}T/.test(s)||!Number.isFinite(Date.parse(s)))throw Error(`Apple Health: ${name} ungültig.`);return s;}
function finite(value:unknown,name:string,min:number,max:number):number {if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error(`Apple Health: ${name} ungültig.`);return value;}
function metrics(value:unknown):NutritionMetric[] {if(!Array.isArray(value)||value.length>nutritionMetrics.length||value.some(x=>!nutritionMetrics.includes(x))||new Set(value).size!==value.length)throw Error('Apple Health: Datentypen ungültig.');return [...value];}
function source(raw:unknown):HealthSource {if(!record(raw))throw Error('Apple Health: Datenquelle fehlt.');return {...raw,name:text(raw.name,'Quellname'),bundleIdentifier:text(raw.bundleIdentifier,'Quell-ID'),...(raw.version!==undefined?{version:text(raw.version,'Quellversion')}:{}),...(raw.productType!==undefined?{productType:text(raw.productType,'Gerätetyp')}:{})};}
export function validateNutritionSample(raw:unknown):HealthNutritionSample {
  if(!record(raw)||!nutritionMetrics.includes(raw.metric as NutritionMetric))throw Error('Apple Health: Nährstoff-Sample ungültig.');
  const metric=raw.metric as NutritionMetric;
  if(raw.unit!==nutritionLabels[metric].unit)throw Error('Apple Health: Einheit passt nicht zum Datentyp.');
  const startedAt=iso(raw.startedAt,'Beginn'),endedAt=iso(raw.endedAt,'Ende');
  if(Date.parse(endedAt)<Date.parse(startedAt))throw Error('Apple Health: Sample-Ende vor Beginn.');
  if(raw.isOwnExport!==undefined&&typeof raw.isOwnExport!=='boolean')throw Error('Apple Health: Herkunftsmarkierung ungültig.');
  return {...raw,uuid:text(raw.uuid,'UUID',100),metric,value:finite(raw.value,'Wert',0,1e9),unit:nutritionLabels[metric].unit,startedAt,endedAt,source:validateHealthSource(raw.source)};
}
function window(raw:Record<string,unknown>,maxDays=32):NutritionWindow {
  const from=iso(raw.from,'Zeitraumbeginn'),to=iso(raw.to,'Zeitraumende'),span=Date.parse(to)-Date.parse(from);
  if(span<=0||span>maxDays*86400000)throw Error('Apple Health: Zeitraum außerhalb des erlaubten Abfragefensters.');
  return {from,to,timeZone:text(raw.timeZone,'Zeitzone',100)};
}
function exportRequest(raw:unknown):HealthExportRequest {
  if(!record(raw))throw Error('Apple Health: Exportauftrag ungültig.');
  const entryId=text(raw.entryId,'Eintrag-ID',200);
  if(raw.kind==='weight')return {...raw,kind:'weight',entryId,at:iso(raw.at,'Messzeit'),kg:finite(raw.kg,'Gewicht',20,350)};
  if(raw.kind!=='workout')throw Error('Apple Health: Exporttyp ungültig.');
  const startedAt=iso(raw.startedAt,'Trainingsbeginn'),finishedAt=iso(raw.finishedAt,'Trainingsende');
  const max=(Date.parse(finishedAt)-Date.parse(startedAt))/1000;
  if(max<=0||max>7*86400)throw Error('Apple Health: Trainingszeit ungültig.');
  const durationSeconds=finite(raw.durationSeconds,'Trainingsdauer',1,max);
  return {...raw,kind:'workout',entryId,startedAt,finishedAt,durationSeconds};
}
function exportRecord(raw:unknown):HealthExportRecord {
  if(!record(raw)||!['pending','confirmed','deletePending','deleted'].includes(String(raw.status)))throw Error('Apple Health: Exportstatus ungültig.');
  const request=exportRequest(raw.request),syncVersion=finite(raw.syncVersion,'Sync-Version',1,1e9);
  if(!Number.isInteger(syncVersion))throw Error('Apple Health: Sync-Version ungültig.');
  const id=`${request.kind}:${request.entryId}`,syncIdentifier=`FORM:${id}`;
  if(raw.id!==id||raw.syncIdentifier!==syncIdentifier||raw.fingerprint!==exportFingerprint(request))throw Error('Apple Health: Exportidentität ungültig.');
  if(raw.status==='confirmed'&&(!raw.confirmedAt||!raw.healthKitUUID))throw Error('Apple Health: Exportbestätigung unvollständig.');
  if(['deletePending','deleted'].includes(String(raw.status))&&!raw.deletionRequestedAt)throw Error('Apple Health: Löschauftrag unvollständig.');
  if(raw.status==='deleted'&&!raw.deletedAt)throw Error('Apple Health: Löschbestätigung fehlt.');
  for(const key of ['deletionRequestedAt','deletedAt'] as const)if(raw[key]!==undefined)iso(raw[key],'Löschzeit');
  if(raw.deletedUUIDs!==undefined&&(!Array.isArray(raw.deletedUUIDs)||raw.deletedUUIDs.length>1000||raw.deletedUUIDs.some(x=>typeof x!=='string'||!x.trim()||x.length>100)))throw Error('Apple Health: Gelöschte UUIDs ungültig.');
  return {...raw,id,syncIdentifier,syncVersion,fingerprint:exportFingerprint(request),request,status:raw.status as HealthExportRecord['status'],requestedAt:iso(raw.requestedAt,'Exportzeit'),...(raw.confirmedAt!==undefined?{confirmedAt:iso(raw.confirmedAt,'Bestätigungszeit')}:{}),...(raw.healthKitUUID!==undefined?{healthKitUUID:text(raw.healthKitUUID,'Export-UUID',100)}:{})};
}
export function validateHealthNutritionState(raw:unknown):HealthNutritionState {
  if(!record(raw)||raw.version!==1||typeof raw.authorizationRequested!=='boolean'||!Array.isArray(raw.samples)||raw.samples.length>200000||!Array.isArray(raw.exports)||raw.exports.length>50000)throw Error('Apple Health: Gespeicherte Integration ungültig.');
  const samples=raw.samples.map(validateNutritionSample),exports=raw.exports.map(exportRecord);
  if(new Set(samples.map(x=>x.uuid)).size!==samples.length||new Set(exports.map(x=>x.id)).size!==exports.length)throw Error('Apple Health: Doppelte gespeicherte Identität.');
  let lastSync:HealthNutritionState['lastSync'];
  if(raw.lastSync!==undefined){if(!record(raw.lastSync))throw Error('Apple Health: Sync-Zeit ungültig.');lastSync={...raw.lastSync,...window(raw.lastSync),queriedAt:iso(raw.lastSync.queriedAt,'Abfragezeit'),completeMetrics:metrics(raw.lastSync.completeMetrics),unavailable:metrics(raw.lastSync.unavailable)};}
  if(raw.syncPreferences!==undefined){if(!record(raw.syncPreferences))throw Error('Apple Health: Sync-Einstellung ungültig.');for(const key of ['onOpen','onForeground'])if(raw.syncPreferences[key]!==undefined&&typeof raw.syncPreferences[key]!=='boolean')throw Error('Apple Health: Sync-Einstellung ungültig.');}
  if(raw.coverage!==undefined){if(!Array.isArray(raw.coverage)||raw.coverage.length>730)throw Error('Apple Health: Abfrageabdeckung ungültig.');raw.coverage.forEach(validateCoverage);}
  if(raw.lastAttempt!==undefined)validateSyncAttempt(raw.lastAttempt);
  if(raw.connectionConfirmedAt!==undefined)iso(raw.connectionConfirmedAt,'Bestätigte Verbindung');
  if(raw.connectionEventId!==undefined)text(raw.connectionEventId,'Verbindungsereignis',150);
  if(raw.formGoals!==undefined)validateFormGoals(raw.formGoals);
  return {...raw,version:1,authorizationRequested:raw.authorizationRequested,requestedMetrics:metrics(raw.requestedMetrics),samples,exports,...(raw.selectedSourceBundle!==undefined?{selectedSourceBundle:text(raw.selectedSourceBundle,'Gewählte Quelle')}:{}),...(lastSync?{lastSync}:{})};
}
export function validateNutritionSnapshot(raw:unknown):NutritionSnapshot {
  if(!record(raw)||!Array.isArray(raw.samples)||raw.samples.length>200000)throw Error('Apple Health: Abfrageantwort ungültig.');
  const bounds=window(raw),completeMetrics=metrics(raw.completeMetrics),unavailable=metrics(raw.unavailable);
  if(completeMetrics.some(m=>unavailable.includes(m)))throw Error('Apple Health: Widersprüchlicher Abfragestatus.');
  const samples=raw.samples.map(validateNutritionSample);
  for(const sample of samples)if(!completeMetrics.includes(sample.metric)||Date.parse(sample.startedAt)<Date.parse(bounds.from)||Date.parse(sample.startedAt)>=Date.parse(bounds.to))throw Error('Apple Health: Sample außerhalb des bestätigten Abfragebereichs.');
  const byId=new Map<string,HealthNutritionSample>();
  for(const sample of samples){const previous=byId.get(sample.uuid);if(previous&&JSON.stringify(previous)!==JSON.stringify(sample))throw Error('Apple Health: Widersprüchliche Sample-UUID.');byId.set(sample.uuid,sample);}
  return {...bounds,queriedAt:iso(raw.queriedAt,'Abfragezeit'),completeMetrics,unavailable,samples:[...byId.values()]};
}
/** Re-query an explicit complete window. Deletions and changed samples reconcile only successful metrics. */
export function reconcileNutrition(state:HealthNutritionState|undefined,input:unknown):HealthNutritionState {
  const before=state?validateHealthNutritionState(state):newHealthNutrition(),snapshot=validateNutritionSnapshot(input);
  if(!snapshot.completeMetrics.length)throw Error('Keine Nährstoffabfrage erfolgreich. Vorhandene Daten bleiben erhalten.');
  const lo=Date.parse(snapshot.from),hi=Date.parse(snapshot.to),incoming=snapshot.samples.filter(s=>!s.isOwnExport);
  const incomingIds=new Set(incoming.map(s=>s.uuid));
  const retained=before.samples.filter(s=>!incomingIds.has(s.uuid)&&!(snapshot.completeMetrics.includes(s.metric)&&Date.parse(s.startedAt)>=lo&&Date.parse(s.startedAt)<hi));
  const lastSync={from:snapshot.from,to:snapshot.to,timeZone:snapshot.timeZone,queriedAt:snapshot.queriedAt,completeMetrics:snapshot.completeMetrics,unavailable:snapshot.unavailable};
  const coverage=[...(before.coverage||(before.lastSync?[before.lastSync]:[])).filter(c=>!(c.from===lastSync.from&&c.to===lastSync.to&&c.timeZone===lastSync.timeZone&&c.completeMetrics.every(m=>lastSync.completeMetrics.includes(m)))),lastSync].slice(-730);
  return {...before,samples:[...retained,...incoming].sort((a,b)=>a.startedAt.localeCompare(b.startedAt)||a.uuid.localeCompare(b.uuid)),lastSync,coverage};
}
function localDateKey(date:Date):string {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function nutritionWindow(date:string,period:'day'|'week'='day'):NutritionWindow {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Ungültiges Datum.');
  const from=new Date(date+'T12:00:00');if(!Number.isFinite(from.getTime())||localDateKey(from)!==date)throw Error('Ungültiges Datum.');
  if(period==='week')from.setDate(from.getDate()-((from.getDay()+6)%7));
  from.setHours(0,0,0,0);const to=new Date(from);to.setDate(to.getDate()+(period==='week'?7:1));
  return {from:from.toISOString(),to:to.toISOString(),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone||'local'};
}
export function nutritionDates(bounds:NutritionWindow):string[] {
  const cursor=new Date(bounds.from),end=Date.parse(bounds.to),days:string[]=[];
  while(cursor.getTime()<end&&days.length<93){days.push(localDateKey(cursor));cursor.setDate(cursor.getDate()+1);}
  return days;
}
export function nutritionSources(state:HealthNutritionState|undefined,bounds?:NutritionWindow):HealthSource[] {
  const samples=(state?.samples||[]).filter(s=>!bounds||(Date.parse(s.startedAt)>=Date.parse(bounds.from)&&Date.parse(s.startedAt)<Date.parse(bounds.to)));
  return [...new Map(samples.map(s=>[s.source.bundleIdentifier,s.source])).values()].sort((a,b)=>a.name.localeCompare(b.name));
}
export function nutritionForDay(state:HealthNutritionState|undefined,date:string,sourceBundle?:string):{values:Partial<Record<NutritionMetric,number>>;source?:HealthSource;requiresSourceSelection:boolean;sampleCount:number} {
  const bounds=nutritionWindow(date),sources=nutritionSources(state,bounds),selected=sourceBundle||state?.selectedSourceBundle||(sources.length===1?sources[0].bundleIdentifier:undefined);
  if(!selected)return {values:{},requiresSourceSelection:sources.length>1,sampleCount:0};
  const source=nutritionSources(state).find(x=>x.bundleIdentifier===selected),values:Partial<Record<NutritionMetric,number>>={};
  const samples=(state?.samples||[]).filter(s=>s.source.bundleIdentifier===selected&&Date.parse(s.startedAt)>=Date.parse(bounds.from)&&Date.parse(s.startedAt)<Date.parse(bounds.to));
  for(const sample of samples)values[sample.metric]=(values[sample.metric]??0)+sample.value;
  return {values,source,requiresSourceSelection:false,sampleCount:samples.length};
}
/** Stable content key; HealthKit receives it only as metadata for collision detection. */
export function exportFingerprint(input:HealthExportRequest):string {
  return input.kind==='weight'?JSON.stringify(['weight',input.entryId,input.at,input.kg]):JSON.stringify(['workout',input.entryId,input.startedAt,input.finishedAt,input.durationSeconds]);
}
/** Save this pending record to SQLite BEFORE the native write. Retrying reuses its version. */
export function prepareHealthExport(state:HealthNutritionState|undefined,input:HealthExportRequest,now:string):{state:HealthNutritionState;record:HealthExportRecord} {
  const before=state?validateHealthNutritionState(state):newHealthNutrition(),request=exportRequest(input),id=`${request.kind}:${request.entryId}`,fingerprint=exportFingerprint(request),existing=before.exports.find(x=>x.id===id);
  if(existing?.status==='deletePending')throw Error('Zuerst den gespeicherten Löschauftrag abschließen oder erneut versuchen.');
  const next:HealthExportRecord=existing?.fingerprint===fingerprint&&existing.status!=='deleted'?existing:{id,syncIdentifier:`FORM:${id}`,syncVersion:(existing?.syncVersion||0)+1,fingerprint,request,status:'pending',requestedAt:iso(now,'Exportzeit')};
  return {state:{...before,exports:[...before.exports.filter(x=>x.id!==id),next]},record:next};
}
export function confirmHealthExport(state:HealthNutritionState,recordId:string,receipt:{uuid:string;syncIdentifier:string;syncVersion:number},now:string):HealthNutritionState {
  const entry=state.exports.find(x=>x.id===recordId);
  if(!entry||entry.status==='deletePending'||entry.status==='deleted'||entry.syncIdentifier!==receipt.syncIdentifier||entry.syncVersion!==receipt.syncVersion)throw Error('Apple Health: Exportbestätigung passt nicht zum Auftrag.');
  const updated:HealthExportRecord={...entry,status:'confirmed',healthKitUUID:text(receipt.uuid,'Export-UUID',100),confirmedAt:iso(now,'Bestätigungszeit')};
  return {...state,exports:state.exports.map(x=>x.id===recordId?updated:x)};
}

export function validateHealthSource(raw:unknown):HealthSource {
  const value=source(raw);
  for(const key of ['deviceName','deviceId'] as const)if(value[key]!==undefined)text(value[key],key);
  return value;
}
function validateCoverage(raw:unknown):NutritionCoverage {
  if(!record(raw))throw Error('Apple Health: Abfrageabdeckung ungültig.');
  const completeMetrics=metrics(raw.completeMetrics),unavailable=metrics(raw.unavailable);
  if(completeMetrics.some(m=>unavailable.includes(m)))throw Error('Apple Health: Widersprüchliche Abdeckung.');
  return {...window(raw),queriedAt:iso(raw.queriedAt,'Abfragezeit'),completeMetrics,unavailable};
}
export function validateSyncAttempt(raw:unknown):NutritionSyncAttempt {
  if(!record(raw)||!['open','foreground','manual','history'].includes(String(raw.trigger))||!['running','success','partial','failed','cancelled'].includes(String(raw.status)))throw Error('Apple Health: Abfragestatus ungültig.');
  const totalChunks=finite(raw.totalChunks,'Abfrageseiten',1,100),completedChunks=finite(raw.completedChunks,'Abfrageseiten',0,totalChunks);
  if(!Number.isInteger(totalChunks)||!Number.isInteger(completedChunks))throw Error('Apple Health: Abfrageseiten ungültig.');
  if(raw.finishedAt!==undefined)iso(raw.finishedAt,'Abfrageende');
  if(raw.errorCode!==undefined)text(raw.errorCode,'Fehlercode',100);
  if(raw.message!==undefined)text(raw.message,'Abfragemeldung',500);
  return {...raw,...window(raw,93),id:text(raw.id,'Abfrage-ID',150),startedAt:iso(raw.startedAt,'Abfragebeginn'),trigger:raw.trigger as NutritionSyncAttempt['trigger'],status:raw.status as NutritionSyncAttempt['status'],totalChunks,completedChunks};
}
export function validateFormGoals(raw:unknown):Partial<Record<NutritionMetric,number>> {
  if(!record(raw))throw Error('FORM-Ziele ungültig.');
  const goals:Partial<Record<NutritionMetric,number>>={};
  for(const metric of nutritionMetrics)if(raw[metric]!==undefined)goals[metric]=finite(raw[metric],nutritionLabels[metric].label,0,metric==='kcal'||metric==='waterMl'?20000:3000);
  return {...raw,...goals};
}
/** Inclusive local end date, with a calendar-day range. Query chunks stay small. */
export function nutritionHistoryWindow(date:string,days:1|7|30|90):NutritionWindow {
  if(![1,7,30,90].includes(days))throw Error('Wähle 1, 7, 30 oder 90 Tage.');
  const one=nutritionWindow(date),from=new Date(one.from);from.setDate(from.getDate()-days+1);
  return {...one,from:from.toISOString()};
}
export function nutritionChunks(bounds:NutritionWindow,days=7):NutritionWindow[] {
  window({...bounds},93);
  if(!Number.isInteger(days)||days<1||days>7)throw Error('Ungültige Abfrageseitengröße.');
  const chunks:NutritionWindow[]=[],end=Date.parse(bounds.to);let cursor=new Date(bounds.from);
  while(cursor.getTime()<end){const next=new Date(cursor);next.setDate(next.getDate()+days);const to=new Date(Math.min(next.getTime(),end));chunks.push({from:cursor.toISOString(),to:to.toISOString(),timeZone:bounds.timeZone});cursor=to;}
  return chunks;
}
export function nutritionCoverageForDay(state:HealthNutritionState|undefined,date:string,requested:NutritionMetric[]=state?.requestedMetrics||[]):Partial<Record<NutritionMetric,string>> {
  const bounds=nutritionWindow(date),coverage=state?.coverage|| (state?.lastSync?[state.lastSync]:[]),result:Partial<Record<NutritionMetric,string>>={};
  for(const item of coverage){
    if(Date.parse(item.from)>Date.parse(bounds.from)||Date.parse(item.to)<Date.parse(bounds.to))continue;
    for(const metric of requested)if(item.completeMetrics.includes(metric)&&(!result[metric]||Date.parse(item.queriedAt)>Date.parse(result[metric]!)))result[metric]=item.queriedAt;
  }
  return result;
}
export function nutritionIsFresh(state:HealthNutritionState|undefined,bounds:NutritionWindow,now:number,maxAgeMs=300000):boolean {
  const requested=state?.requestedMetrics||[];
  if(!requested.length||bounds.timeZone!==(Intl.DateTimeFormat().resolvedOptions().timeZone||'local')||state?.lastSync?.timeZone!==bounds.timeZone)return false;
  return nutritionDates(bounds).every(day=>{const coverage=nutritionCoverageForDay(state,day,requested);return requested.every(metric=>{const at=Date.parse(coverage[metric]||'');return Number.isFinite(at)&&now>=at&&now-at<maxAgeMs;});});
}
export function prepareHealthDelete(state:HealthNutritionState|undefined,id:string,now:string):{state:HealthNutritionState;record:HealthExportRecord} {
  if(!state)throw Error('Kein eigener Exportauftrag vorhanden.');
  const before=validateHealthNutritionState(state),entry=before.exports.find(e=>e.id===id);
  if(!entry)throw Error('Dieser FORM-Export wurde nicht gefunden.');
  const updated:HealthExportRecord=entry.status==='deleted'||entry.status==='deletePending'?entry:{...entry,status:'deletePending',deletionRequestedAt:iso(now,'Löschzeit')};
  return {state:{...before,exports:before.exports.map(e=>e.id===id?updated:e)},record:updated};
}
export type HealthDeleteReceipt={syncIdentifier:string;syncVersion:number;deletedUUIDs:string[];alreadyAbsent:boolean};
export function confirmHealthDelete(state:HealthNutritionState,id:string,receipt:HealthDeleteReceipt,now:string):HealthNutritionState {
  const entry=state.exports.find(e=>e.id===id);
  if(!entry||!['deletePending','deleted'].includes(entry.status)||entry.syncIdentifier!==receipt.syncIdentifier||entry.syncVersion!==receipt.syncVersion||!Array.isArray(receipt.deletedUUIDs)||receipt.deletedUUIDs.length>1000||receipt.deletedUUIDs.some(uuid=>typeof uuid!=='string'||!uuid.trim()||uuid.length>100)||typeof receipt.alreadyAbsent!=='boolean')throw Error('Apple Health: Löschbestätigung passt nicht zum Auftrag.');
  const updated:HealthExportRecord={...entry,status:'deleted',deletedAt:iso(now,'Löschbestätigung'),deletedUUIDs:[...new Set(receipt.deletedUUIDs)]};
  return {...state,exports:state.exports.map(e=>e.id===id?updated:e)};
}
