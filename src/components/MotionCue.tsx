import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,AppState,Easing,View,type ViewStyle} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import {motionAllowed,motionDuration,motionSpecs,type MotionLevel,type MotionName,type MotionSpec} from '../motion/spec';
export type {MotionName,MotionLevel} from '../motion/spec';
const MotionContext=createContext<{level:MotionLevel;reduced:boolean;active:boolean}>({level:'off',reduced:true,active:false});
export function SketchMotionProvider({enabled=true,level,children}:{enabled?:boolean;level?:MotionLevel;children:React.ReactNode}){
 const [reduced,setReduced]=useState(true),[active,setActive]=useState(AppState.currentState==='active');
 useEffect(()=>{let mounted=true;void AccessibilityInfo.isReduceMotionEnabled().then(x=>{if(mounted)setReduced(x)}).catch(()=>{});const a=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);const b=AppState.addEventListener('change',s=>setActive(s==='active'));return()=>{mounted=false;a.remove();b.remove()}},[]);
 return <MotionContext.Provider value={{level:enabled?(level??'subtle'):'off',reduced,active}}>{children}</MotionContext.Provider>;
}
export function useSketchMotion(){const c=useContext(MotionContext);return motionAllowed(c.level,c.reduced,c.active);}
export function useMotionLevel(){return useContext(MotionContext).level;}
export function useMotionValue(name:MotionName,key:string|number|boolean,enabled=true,confirmed=true,durationOverride?:number){
 const c=useContext(MotionContext),v=useRef(new Animated.Value(1)).current,last=useRef<string|undefined>(undefined),spec:MotionSpec=motionSpecs[name];
 const allowed=motionAllowed(c.level,c.reduced,c.active,!!spec.success,confirmed)&&enabled;
 useEffect(()=>{v.stopAnimation();const token=`${name}:${String(key)}:${enabled}:${confirmed}`;if(!allowed||last.current===token){last.current=token;v.setValue(1);return}last.current=token;v.setValue(0);const animation=Animated.timing(v,{toValue:1,duration:durationOverride??motionDuration(name,c.level),easing:Easing.out(Easing.cubic),useNativeDriver:false});animation.start();return()=>{animation.stop();v.stopAnimation()}},[name,key,enabled,confirmed,allowed,c.level,durationOverride,v]);
 return v;
}
const AnimatedPath=Animated.createAnimatedComponent(Path);
export function MotionCue({variant,eventKey,confirmed=false,enabled=true,children,style,color='#2655D9',mark=false,decorative=false}:{variant:MotionName;eventKey:string|number|boolean;confirmed?:boolean;enabled?:boolean;children?:React.ReactNode;style?:ViewStyle;color?:string;mark?:boolean;decorative?:boolean}){
 const spec:MotionSpec=motionSpecs[variant],v=useMotionValue(variant,eventKey,enabled,confirmed),level=useMotionLevel(),strength=level==='lively'?1:.55;
 const x=spec.shape==='slide'||spec.shape==='cursor'||spec.shape==='wipe'?(spec.distance??10)*strength:0;
 const y=spec.shape==='pin'||spec.shape==='window'||spec.shape==='expand'?(spec.distance??5)*strength:0;
 const scale=spec.scale??(spec.shape==='scale'?.92:1);
 const rotation=children&&!decorative?0:(spec.rotation??0)*strength;
 const transform:ViewStyle['transform']=[{translateX:v.interpolate({inputRange:[0,1],outputRange:[x,0]})},{translateY:v.interpolate({inputRange:[0,1],outputRange:[y,0]})},{scale:v.interpolate({inputRange:[0,.68,1],outputRange:[scale,spec.shape==='stamp'?1.01:1,1]})},{rotate:v.interpolate({inputRange:spec.shape==='wave'?[0,.28,.55,.8,1]:[0,1],outputRange:spec.shape==='wave'?['0deg',`${rotation}deg`,`${-rotation}deg`,'1deg','0deg']:[`${rotation}deg`,'0deg']})}];
 const opacity=spec.shape==='wipe'?v.interpolate({inputRange:[0,.5,1],outputRange:[.55,.8,1]}):v.interpolate({inputRange:[0,1],outputRange:[spec.shape==='window'?.2:.75,1]});
 const show=mark&&!!spec.path&&(!spec.success||confirmed);
 return <Animated.View style={[{opacity,transform},style]}>{children}{show&&<View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"><Svg width={variant==='fieldFocus'?'100%':46} height={variant==='fieldFocus'?5:38} viewBox={variant==='fieldFocus'?'0 0 96 5':'0 0 48 42'} preserveAspectRatio={variant==='fieldFocus'?'none':'xMidYMid meet'}><AnimatedPath d={spec.path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[spec.length??150,spec.length??150]} strokeDashoffset={v.interpolate({inputRange:[0,1],outputRange:[spec.length??150,0]})}/></Svg></View>}</Animated.View>;
}
