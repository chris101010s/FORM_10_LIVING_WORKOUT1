import React,{useState} from 'react';
import {Text,View} from 'react-native';
import type {Prescription,SetKind} from '../data/schema';
import {Button,Chip,Field,Label,Muted,usePalette} from './Design';
import {prescriptionLabel,prescriptionMode} from '../utils/planWorkout';
import {numericTargetRules,parseTargetInput,type NumericTargetKey} from '../utils/planEditorInput';
function NumericTarget({label,field,value,onChange,raw,onRawChange}:{label:string;field:NumericTargetKey;value:number|undefined;onChange:(v:number|undefined)=>void;raw?:string;onRawChange:(v:string)=>void}){
 const [local,setLocal]=useState<string|undefined>(),text=raw??local??(value===undefined?'':String(value)),parsed=parseTargetInput(field,text),rule=numericTargetRules[field];
 const change=(next:string)=>{const clipped=next.slice(0,100);setLocal(clipped);onRawChange(clipped);const check=parseTargetInput(field,clipped);if(check.valid)onChange(check.value)};
 return <View><Field label={label} value={text} onChangeText={change} keyboardType={rule.integer?'number-pad':'decimal-pad'}/>{!parsed.valid&&<Muted>Erlaubt: {rule.min}–{rule.max}{rule.integer?', ganze Zahlen':''}. Dein Text bleibt im Entwurf; vor dem Übernehmen bitte korrigieren.</Muted>}</View>;
}
export function PrescriptionEditor({value,onChange,rawInputs={},onRawChange}:{value:Prescription;onChange:(p:Prescription)=>void;rawInputs?:Record<string,string>;onRawChange?:(key:string,text:string)=>void}){
 const p=usePalette(),mode=prescriptionMode(value),[localRange,setLocalRange]=useState(value.repsMin!==undefined||value.repsMax!==undefined),range=rawInputs._range!==undefined?rawInputs._range==='1':localRange;
 const patch=(changes:Partial<Prescription>)=>onChange({...value,...changes});
 const input=(field:Exclude<NumericTargetKey,'weightKg'|'estimatedSeconds'>,label:string)=><NumericTarget key={field} field={field} label={label} value={value[field]} raw={rawInputs[field]} onRawChange={text=>onRawChange?.(field,text)} onChange={n=>patch({[field]:n})}/>;
 const kinds:[SetKind,string][]=[['work','Arbeit'],['bodyweight','Körpergewicht'],['assisted','Assistenz'],['drop','Drop']];
 return <View style={{paddingTop:13}}><Label>SOLL PRO ÜBUNG</Label><Text style={{fontSize:21,fontWeight:'700',color:p.ink,marginBottom:12}}>{prescriptionLabel(value)}</Text>
 {input('sets','Geplante Arbeitssätze')}
 <View style={{flexDirection:'row',flexWrap:'wrap'}}>{([['reps','Wiederholungen'],['amrap','AMRAP / offen'],['time','Zeit'],['distance','Distanz']] as const).map(([targetMode,text])=><Chip key={targetMode} text={text} active={mode===targetMode} onPress={()=>patch({targetMode,kind:targetMode==='amrap'?'failure':targetMode==='time'?'timed':targetMode==='distance'?'distance':'work'})}/>)}</View>
 {(mode==='reps'||mode==='amrap')&&<><Label>SATZTYP</Label><View style={{flexDirection:'row',flexWrap:'wrap'}}>{(mode==='amrap'?[['failure','Offen / Failure'] as [SetKind,string],...kinds]:kinds).map(([kind,label])=><Chip key={kind} text={label} active={(value.kind??'work')===kind} onPress={()=>patch({kind})}/>)}</View></>}
 {mode==='reps'?<><Button secondary small title={range?'Feste Wiederholungszahl verwenden':'Wiederholungsbereich verwenden'} onPress={()=>{const next=!range;setLocalRange(next);onRawChange?.('_range',next?'1':'0');if(next){const text=rawInputs.reps??(value.reps===undefined?'':String(value.reps));onRawChange?.('repsMin',text);onRawChange?.('repsMax',text);patch({repsMin:value.reps,repsMax:value.reps,reps:undefined})}else{const text=rawInputs.repsMax??(value.repsMax===undefined?'':String(value.repsMax));onRawChange?.('reps',text);patch({reps:value.repsMax,repsMin:undefined,repsMax:undefined})}}}/>{range?<>{input('repsMin','Unteres Ziel (Wdh.)')}{input('repsMax','Oberes Ziel / Standardlimit (Wdh.)')}</>:input('reps','Geplante Wiederholungen / Standardlimit')}<Muted>Weniger darfst du ehrlich eintragen. Mehr gibst du im Training pro Satz mit „+ Wdh.“ frei.</Muted></>:mode==='amrap'?<Muted>Offenes Wiederholungsziel. Es wird kein festes Wiederholungslimit erfunden.</Muted>:mode==='time'?input('durationSeconds','Geplante Dauer je Satz (Sekunden)'):input('distanceMeters','Geplante Strecke je Satz (Meter)')}
 {input('warmupSets','Geplante Warm-up-Sätze (optional)')}{input('restSeconds','Satzpause (Sekunden, optional)')}{input('rir','RIR (optional · ganze Wiederholungen)')}{input('rpe','RPE (optional)')}
 <Field label="Plannotiz (optional)" multiline value={value.note??''} onChangeText={note=>patch({note:note.slice(0,500)})}/>
 </View>;
}
