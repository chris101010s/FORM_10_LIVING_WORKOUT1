import type {AthleteData} from '../data/schema';
import {validateRestoredData} from '../data/validation';
const collections=['weights','scans','exercises','routines','workouts','cardio','performance','habits','nutrition','recovery','measurements','goals','journal','programs','healthEntries'] as const;
function canonical(x:unknown):string {if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';if(x&&typeof x==='object'){const o=x as Record<string,unknown>;return '{'+Object.keys(o).filter(k=>o[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonical(o[k])).join(',')+'}';}return JSON.stringify(x)??'null';}
export function backupCounts(d:AthleteData){return {sessions:d.workouts.length,sets:d.workouts.reduce((n,w)=>n+w.sets.length,0)+(d.live?.sets.length||0),weights:d.weights.length,plans:(d.programs||[]).length,health:d.recovery.length+d.measurements.length+(d.healthEntries||[]).length+d.scans.length+d.nutrition.length,journal:(d.journal||[]).length};}
/** Keep existing profile/settings/active session. Reject incompatible IDs rather than silently losing data. */
export function mergeBackups(current:AthleteData,incoming:AthleteData):AthleteData{
 const a=validateRestoredData(current),b=validateRestoredData(incoming);const out={...a};const obj=out as unknown as Record<string,unknown>;
 for(const key of collections){const map=new Map((a[key]||[]).map(x=>[x.id,x]));for(const item of b[key]||[]){const old=map.get(item.id);if(old){if(canonical(old)!==canonical(item)&&!(key==='programs'&&'status' in item&&item.status==='active'&&'status' in old&&old.status==='paused'&&canonical(old)===canonical({...item,status:'paused'})))throw Error(`Konflikt in ${key}: gleiche ID mit unterschiedlichem Inhalt. Verwende ein anderes Backup oder bewusst Ersetzen.`);}else map.set(item.id,key==='programs'&&'status' in item&&item.status==='active'?{...item,status:'paused' as const}:item);}obj[key]=[...map.values()];}
 if(b.live&&a.live&&canonical(a.live)!==canonical(b.live))throw Error('Beide Backups enthalten unterschiedliche laufende Workouts. Beende zuerst eines oder wähle Ersetzen.');
 out.live=a.live||b.live;
 out.favoriteExerciseIds=[...new Set([...a.favoriteExerciseIds,...b.favoriteExerciseIds])];
 out.habitChecks={...a.habitChecks};for(const [day,ids] of Object.entries(b.habitChecks))out.habitChecks[day]=[...new Set([...(out.habitChecks[day]||[]),...ids])];
 out.equipmentNotes={...b.equipmentNotes,...a.equipmentNotes};
 return validateRestoredData(out);
}
export const encryptedFormat='FORM-Encrypted-Backup-v1';
export function isEncryptedBackup(raw:string){try{return JSON.parse(raw)?.format===encryptedFormat}catch{return false}}
export function makeBackup(d:AthleteData){const text=JSON.stringify({format:'ATHLETE-OS-Backup',createdAt:new Date().toISOString(),appVersion:'8.4.0',data:validateRestoredData(d)});let bytes=0;for(const c of text){const code=c.codePointAt(0)!;bytes+=code<128?1:code<2048?2:code<65536?3:4;if(bytes>15_000_000)throw Error('Backup überschreitet 15 MB.');}return text;}
