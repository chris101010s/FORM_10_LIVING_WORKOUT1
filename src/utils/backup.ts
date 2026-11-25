import type {AthleteData} from '../data/schema';
import {validateRestoredData} from '../data/validation';
const collections=['weights','scans','exercises','routines','workouts','cardio','performance','habits','nutrition','recovery','measurements','goals','journal','programs','healthEntries','mediaAssets','planRevisions','planOccurrences','progressionDecisions'] as const;
function canonical(x:unknown):string {if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';if(x&&typeof x==='object'){const o=x as Record<string,unknown>;return '{'+Object.keys(o).filter(k=>o[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonical(o[k])).join(',')+'}';}return JSON.stringify(x)??'null';}
export function backupCounts(d:AthleteData){return {sessions:d.workouts.length,sets:d.workouts.reduce((n,w)=>n+w.sets.length,0)+(d.live?.sets.length||0),draftRows:(d.live?.plannedRows||[]).filter(r=>r.status==='draft').length,weights:d.weights.length,plans:(d.programs||[]).length,health:d.recovery.length+d.measurements.length+(d.healthEntries||[]).length+d.scans.length+d.nutrition.length,healthSamples:d.healthNutrition?.samples.length||0,journal:(d.journal||[]).length};}
function mergeExtensions(current:Record<string,unknown>,incoming:Record<string,unknown>,known:readonly string[],path:string){
 const result={...current};
 for(const [key,value] of Object.entries(incoming)){
  if(known.includes(key))continue;
  const old=current[key];
  if(old===undefined||old===null){Object.defineProperty(result,key,{value,enumerable:true,writable:true,configurable:true});continue;}
  if(value!==undefined&&value!==null&&canonical(old)!==canonical(value))throw Error(`Konflikt in ${path}.${key}: zusätzliche Daten unterscheiden sich. Es wurde nichts verworfen; prüfe die Backups oder wähle bewusst Ersetzen.`);
 }
 return result;
}
/** Keep existing profile/settings/active session. Reject incompatible IDs rather than silently losing data. */
export function mergeBackups(current:AthleteData,incoming:AthleteData):AthleteData{
 const a=validateRestoredData(current),b=validateRestoredData(incoming);
 const known=[...collections,'schema','profile','settings','live','favoriteExerciseIds','habitChecks','equipmentNotes','weeklyPlan'];
 const out=mergeExtensions(a as unknown as Record<string,unknown>,b as unknown as Record<string,unknown>,known,'Backup') as unknown as AthleteData;const obj=out as unknown as Record<string,unknown>;
 for(const key of collections){const map=new Map((a[key]||[]).map(x=>[x.id,x]));for(const item of b[key]||[]){const old=map.get(item.id);if(old){if(canonical(old)!==canonical(item)&&!(key==='programs'&&'status' in item&&item.status==='active'&&'status' in old&&old.status==='paused'&&canonical(old)===canonical({...item,status:'paused'})))throw Error(`Konflikt in ${key}: gleiche ID mit unterschiedlichem Inhalt. Verwende ein anderes Backup oder bewusst Ersetzen.`);}else map.set(item.id,key==='programs'&&'status' in item&&item.status==='active'?{...item,status:'paused' as const}:item);}obj[key]=[...map.values()];}
 if(b.live&&a.live&&canonical(a.live)!==canonical(b.live))throw Error('Beide Backups enthalten unterschiedliche laufende Workouts. Beende zuerst eines oder wähle Ersetzen.');
 out.live=a.live||b.live;
 out.favoriteExerciseIds=[...new Set([...a.favoriteExerciseIds,...b.favoriteExerciseIds])];
 out.habitChecks={...a.habitChecks};for(const [day,ids] of Object.entries(b.habitChecks))out.habitChecks[day]=[...new Set([...(out.habitChecks[day]||[]),...ids])];
 out.equipmentNotes=mergeExtensions(a.equipmentNotes||{},b.equipmentNotes||{},[],'Gym-Notizen') as Record<string,string>;
 out.profile=mergeExtensions(a.profile,b.profile,['name','targetKg','startingKg','onboarded','priority'],'Profil') as AthleteData['profile'];
 out.settings=mergeExtensions(a.settings,b.settings,['coach','restSeconds','showWeightOnShare','tone','focusMode','eggs','weightStep','paperMode','haptics','appearance','restAlerts','alertSound','reminderTime','widgetEnabled','activityEnabled','motion','theme','motionLevel','character','copyEnabled','copyTone','homeOverview','gymTextScale','handedness','autoFocusGym','previousSuggestions','keepAwake','searchHistory','appIcon','progressionStepKg','localBackup'],'Einstellungen') as AthleteData['settings'];
 out.weeklyPlan=[...a.weeklyPlan];for(const day of b.weeklyPlan){const before=out.weeklyPlan.find(d=>d.day===day.day);if(!before)out.weeklyPlan.push(day);else if(canonical(before)!==canonical(day))throw Error('Konflikt im alten Wochenplan. Wähle die richtige Sicherung oder bewusst Ersetzen.');}
 return validateRestoredData(out);
}
export const encryptedFormat='FORM-Encrypted-Backup-v1';
export function isEncryptedBackup(raw:string){try{return JSON.parse(raw)?.format===encryptedFormat}catch{return false}}
export function makeBackup(d:AthleteData){const text=JSON.stringify({format:'ATHLETE-OS-Backup',createdAt:new Date().toISOString(),appVersion:'15.0.0',databaseSchema:9,data:validateRestoredData(d)});let bytes=0;for(const c of text){const code=c.codePointAt(0)!;bytes+=code<128?1:code<2048?2:code<65536?3:4;if(bytes>15_000_000)throw Error('Backup überschreitet 15 MB.');}return text;}
