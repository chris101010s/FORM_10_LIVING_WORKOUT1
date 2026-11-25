import React,{useMemo,useState} from 'react';
import {View,Text} from 'react-native';
import type {Routine} from '../data/schema';
import type {RoutinePosition} from '../features/workout/secondPassTypes';
import {useAthlete} from '../data/context';
import {progressionProposal,decideProgression} from '../utils/progression';
import {Button,Muted,Label,usePalette} from './Design';
import {MotionCue} from './MotionCue';
import {SketchEvent} from './Personality';
export function ProgressionPanel({routine,position}:{routine:Routine;position:RoutinePosition}){
 const p=usePalette(),{data,update,saving,fault}=useAthlete(),[open,setOpen]=useState(false),[saved,setSaved]=useState(''),proposal=useMemo(()=>progressionProposal(data,routine,position),[data.workouts,data.recovery,data.progressionDecisions,data.settings.progressionStepKg,data.settings.weightStep,data.equipment,routine,position]);
 const decide=async(accept:boolean)=>{if(!proposal)return;const ok=await update(d=>decideProgression(d,proposal,accept));if(ok&&accept)setSaved(proposal.key)};
 return <View style={{gap:7,marginTop:8}}><Button small secondary title={open?'Entwicklung schließen':'Entwicklung & nächste Vorgabe'} onPress={()=>setOpen(v=>!v)}/>{open&&<><Label>OPTIONALER ENTWICKLUNGSVORSCHLAG</Label>{proposal?<><Muted>{proposal.basis}</Muted><Text style={{color:p.ink}}>{proposal.reason}</Text>{proposal.targetWeights&&<Muted>Vorgeschlagene Zielgewichte je Arbeitssatz: {position.targets.filter(t=>t.kind!=='warmup').map(t=>proposal.targetWeights![t.id]+' kg').join(' / ')}.</Muted>}{proposal.plateau&&<Muted>Vier vergleichbare vollständige Einheiten über mindestens drei Wochen zeigen keinen Anstieg. Das ist ein vorsichtiger Plateauhinweis; Ausführung, Erholung und Planvorgaben gemeinsam prüfen.</Muted>}<View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}><Button small title={proposal.kind==='hold'?'Hinweis gelesen':'Vorschlag in Plan übernehmen'} disabled={saving||!!fault} onPress={()=>void decide(true)}/><Button small secondary title="Für diese Grundlage verwerfen" disabled={saving||!!fault} onPress={()=>void decide(false)}/></View><Muted>Übernehmen erzeugt eine neue Planversion. Laufende und alte Trainings behalten ihre ursprünglichen Vorgaben.</Muted></>:<Muted>Noch keine ausreichende, vergleichbare Grundlage oder der Vorschlag wurde bereits bearbeitet. Nötig sind mindestens zwei vollständige Einheiten mit passenden Zielen; Kraftvorschläge brauchen dokumentierte RIR.</Muted>}</>}{saved&&<><MotionCue variant="stampPress" eventKey={saved} confirmed mark/><SketchEvent event="planSaved" eventId={saved} confirmed compact/></>}</View>;
}
