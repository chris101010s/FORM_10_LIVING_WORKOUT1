import type {Prescription,Routine} from '../data/schema';
import {numberInput} from './metrics';
import {prescriptionMode} from './plannedTargets';
export type RawPlanInputs=Record<string,Record<string,string>>;
export const numericTargetRules={weightKg:{min:0,max:1000,integer:false},estimatedSeconds:{min:1,max:3600,integer:false},sets:{min:1,max:100,integer:true},reps:{min:1,max:150,integer:true},repsMin:{min:1,max:150,integer:true},repsMax:{min:1,max:150,integer:true},warmupSets:{min:0,max:30,integer:true},restSeconds:{min:15,max:600,integer:true},rir:{min:0,max:5,integer:true},rpe:{min:1,max:10,integer:false},durationSeconds:{min:1,max:86400,integer:false},distanceMeters:{min:1,max:300000,integer:false}} as const;
export type NumericTargetKey=keyof typeof numericTargetRules;
export function parseTargetInput(key:NumericTargetKey,text:string):{valid:boolean;value?:number}{
 if(!text.trim())return {valid:true};const value=numberInput(text),rule=numericTargetRules[key];
 if(value===null||value<rule.min||value>rule.max||(rule.integer&&!Number.isInteger(value)))return {valid:false};
 return {valid:true,value};
}
export function prescriptionInputErrors(value:Prescription,raw:Record<string,string>={}):string[]{
 const mode=prescriptionMode(value),range=raw._range!==undefined?raw._range==='1':value.repsMin!==undefined||value.repsMax!==undefined;
 const active:NumericTargetKey[]=['sets','warmupSets','restSeconds','rir','rpe',...(mode==='reps'?(range?['repsMin','repsMax'] as const:['reps'] as const):mode==='time'?['durationSeconds'] as const:mode==='distance'?['distanceMeters'] as const:[])];
 return active.filter(key=>raw[key]!==undefined&&!parseTargetInput(key,raw[key]).valid);
}
export function validateRoutineEditorInputs(routine:Routine,raw:RawPlanInputs={}):void {
 const rest=raw.$routine?.restSeconds;
 if(rest!==undefined&&(!rest.trim()||!parseTargetInput('restSeconds',rest).valid))throw Error('Die Standardpause enthält noch eine unvollständige oder ungültige Eingabe.');
 if(routine.positions){for(const p of routine.positions)for(const t of p.targets){const active=['restSeconds','estimatedSeconds',...(t.targetMode==='reps'?['repsMin','repsMax']:t.targetMode==='time'?['durationSeconds']:t.targetMode==='distance'?['distanceMeters']:[]),...(['reps','amrap'].includes(t.targetMode)?['rir','rpe',...(t.loadType==='bodyweight'?[]:['weightKg'])]:[])];for(const [key,value] of Object.entries(raw[t.id]??{})){if(active.includes(key)&&key in numericTargetRules&&!parseTargetInput(key as NumericTargetKey,value).valid)throw Error('Eine Satzvorgabe enthält noch eine ungültige oder unvollständige Eingabe.');}if(t.targetMode==='reps'&&((raw[t.id]?.repsMin!==undefined&&!raw[t.id].repsMin.trim())||(raw[t.id]?.repsMax!==undefined&&!raw[t.id].repsMax.trim())))throw Error('Wiederholungsgrenzen fehlen.');}return;}
 for(const id of routine.exerciseIds){const p=routine.prescriptions?.[id]??{};if(prescriptionMode(p)==='reps'&&raw[id]?._range==='1'&&(p.repsMin===undefined||p.repsMax===undefined))throw Error('Für den Wiederholungsbereich beide Grenzen ergänzen.');const errors=prescriptionInputErrors(routine.prescriptions?.[id]??{},raw[id]);if(errors.length)throw Error(`Die Sollwerte von ${id} enthalten noch unvollständige oder ungültige Texteingaben (${errors.join(', ')}).`);}
}
