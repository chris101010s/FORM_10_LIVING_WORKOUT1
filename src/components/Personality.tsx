import React,{createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {AppState,Text,View,useWindowDimensions} from 'react-native';
import {Doodle} from './Sketchbook';
import type {DoodleName} from '../art/doodles';
import {useFormFont,usePalette} from './Design';
import {MotionCue} from './MotionCue';
import {copyHash,createCopySelector,eventEligible,eventPose,type CopyEvent,type CopyTone} from '../copy/copy.de';
import type {PipPose} from '../art/types';
export type {CopyEvent} from '../copy/copy.de';
const PersonaContext=createContext({character:false,copy:false,tone:'quiet' as CopyTone,select:createCopySelector(),shown:new Map<string,number>()});
export function SketchPersonalityProvider({character=false,copy=false,tone='quiet',children}:{character?:boolean;copy?:boolean;tone?:CopyTone;children:React.ReactNode}){const select=useRef(createCopySelector()).current,shown=useRef(new Map<string,number>()).current;return <PersonaContext.Provider value={{character,copy,tone,select,shown}}>{children}</PersonaContext.Provider>}
const poses:Record<PipPose,DoodleName>={neutral:'pipNeutral',smile:'pipSmile',wave:'pipWave',focused:'pipFocused',ready:'pipReady',writing:'pipWriting',dumbbell:'pipDumbbell',stopwatch:'pipStopwatch',thumbsUp:'pipThumbsUp',resting:'pipResting',sleeping:'pipSleeping',thinking:'pipThinking',surprised:'pipSurprised',celebrating:'pipCelebrating',magnifier:'pipMagnifier',repair:'pipRepair'};
const greetings=new Set<string>();
/** Optional decoration only. Important status/errors remain visible in ordinary screen content. */
export function SketchEvent({event,eventId,confirmed=false,pose,compact=false}:{event:CopyEvent;eventId:string;confirmed?:boolean;pose?:PipPose;compact?:boolean}){
 const c=useContext(PersonaContext),p=usePalette(),hand=useFormFont('FormHand'),{fontScale}=useWindowDimensions();
 const [visible,setVisible]=useState(false);
 const active=(c.character||c.copy)&&eventEligible(event,confirmed);
 useEffect(()=>{if(!active||AppState.currentState!=='active'){setVisible(false);return}const key=event+':'+eventId,first=c.shown.get(key)??Date.now();c.shown.set(key,first);if(c.shown.size>512)c.shown.delete(c.shown.keys().next().value!);const remaining=6500-(Date.now()-first);if(remaining<=0){setVisible(false);return}setVisible(true);const timer=setTimeout(()=>setVisible(false),remaining),sub=AppState.addEventListener('change',state=>{if(state!=='active'){clearTimeout(timer);setVisible(false)}});return()=>{clearTimeout(timer);sub.remove()}},[event,eventId,active,c.shown]);
 const choice=useMemo(()=>c.copy?c.select(event,eventId,c.tone,confirmed):null,[c.copy,c.select,c.tone,event,eventId,confirmed]);
 const showWave=useMemo(()=>{if(event!=='planReady'||greetings.has(eventId))return false;greetings.add(eventId);if(greetings.size>60)greetings.delete(greetings.values().next().value!);return true},[event,eventId]);
 if(!visible||!eventEligible(event,confirmed)||(!c.character&&!choice))return null;
 const actualPose=pose??(showWave?'wave':eventPose[event]);
 return <View style={{marginVertical:compact?5:12,flexDirection:'row',alignItems:'center',gap:10}}>{c.character&&fontScale<=1.5&&<MotionCue variant={showWave?'mascotWave':'mascotExpression'} eventKey={`${event}:${eventId}:${actualPose}`} confirmed={confirmed} decorative><Doodle name={poses[actualPose]} size={compact?42:66}/></MotionCue>}<View style={{flex:1}}>{choice&&<Text style={{fontFamily:hand,fontSize:hand?(compact?18:21):15,lineHeight:hand?25:22,color:p.muted}}>{choice.text}</Text>}</View></View>;
}
export function StableMarginDoodle({day}:{day:string}){const c=useContext(PersonaContext);return c.character?<Doodle name={copyHash(day)%2?'pipNeutral':'pipWriting'} size={42}/>:null;}
