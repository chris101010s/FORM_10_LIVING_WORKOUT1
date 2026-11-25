import type {Routine} from '../data/schema';
import type {PlannedSetTarget} from '../features/workout/secondPassTypes';
import {routinePositions,projectPositions,validateRoutineTargets} from './plannedTargets';
import {parseTargetInput,type NumericTargetKey} from './planEditorInput';
export type BatchTargetPatch=Pick<Partial<PlannedSetTarget>,'restSeconds'|'rir'|'repsMin'|'repsMax'|'weightKg'>;
export function parseBatchTargets(raw:Record<string,string>):BatchTargetPatch {const patch:BatchTargetPatch={};for(const key of ['restSeconds','rir','repsMin','repsMax','weightKg'] as const){if(raw['use_'+key]!=='1')continue;const parsed=parseTargetInput(key,raw[key]??'');if(!parsed.valid||parsed.value===undefined)throw Error('Für alle aktivierten Änderungen eine vollständige gültige Zahl eintragen.');patch[key]=parsed.value;}if(!Object.keys(patch).length)throw Error('Mindestens eine Änderung auswählen.');return patch;}
export function applyTargetBatch(routine:Routine,targetIds:string[],patch:BatchTargetPatch):Routine {
 if(!targetIds.length)throw Error('Mindestens einen Satz auswählen.');const ids=new Set(targetIds),found=new Set<string>();
 const positions=routinePositions(routine).map(p=>({...p,targets:p.targets.map(t=>{if(!ids.has(t.id))return t;found.add(t.id);if((patch.repsMin!==undefined||patch.repsMax!==undefined)&&t.targetMode!=='reps')throw Error('Wiederholungsgrenzen nur auf Sätze mit Wiederholungsziel anwenden.');if(patch.weightKg!==undefined&&(t.loadType==='bodyweight'||['time','distance'].includes(t.targetMode)))throw Error('Zielgewicht nur auf Gewichts- oder Assistenzsätze anwenden.');if(patch.rir!==undefined&&['time','distance'].includes(t.targetMode))throw Error('RIR nur auf Wiederholungssätze anwenden.');return {...t,...patch};})}));
 if(found.size!==ids.size)throw Error('Eine ausgewählte Satzvorgabe ist nicht mehr vorhanden.');const next=projectPositions(routine,positions);validateRoutineTargets(next);return next;
}
