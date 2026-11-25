import React,{useEffect,useMemo,useState} from 'react';
import {AppState} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import * as KeepAwake from 'expo-keep-awake';
import {useAthlete} from '../data/context';
import {KeepAwakeController,keepAwakeRequired} from '../utils/nativeReconciliation';
import {Muted} from './Design';
let keepAwakeSequence=0;

export function WorkoutKeepAwake({active}:{active:boolean}){
  const {data,confirmedData}=useAthlete(),focused=useIsFocused(),[appActive,setAppActive]=useState(AppState.currentState==='active'),[error,setError]=useState('');
  const tag=useMemo(()=>`FORM-active-gym-${++keepAwakeSequence}`,[]);
  const controller=useMemo(()=>new KeepAwakeController({activate:async()=>{if(!await KeepAwake.isAvailableAsync())throw Error('Bildschirm-Wachhalten ist hier nicht verfügbar.');await KeepAwake.activateKeepAwakeAsync(tag);},deactivate:()=>KeepAwake.deactivateKeepAwake(tag)}),[tag]);
  const desired=keepAwakeRequired({enabled:data.settings.keepAwake===true,focused:focused&&active,appActive,hasSession:!!data.live&&!!confirmedData?.live,paused:!!data.live?.pausedAt||!!confirmedData?.live?.pausedAt});
  useEffect(()=>{const subscription=AppState.addEventListener('change',state=>setAppActive(state==='active'));return()=>subscription.remove();},[]);
  useEffect(()=>{let mounted=true;void controller.setActive(desired).then(()=>{if(mounted)setError('');}).catch(()=>{if(mounted)setError('Bildschirm-Wachhalten konnte nicht bestätigt werden. Der Timer funktioniert weiter.');});return()=>{mounted=false;};},[controller,desired]);
  useEffect(()=>()=>{void controller.dispose().catch(()=>{});},[controller]);
  return error&&active?<Muted>{error}</Muted>:null;
}
