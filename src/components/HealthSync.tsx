import React,{createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {AppState,View} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useAthlete} from '../data/context';
import {getRepositoryCommitStatus} from '../data/repository';
import {healthBridge} from '../utils/healthBridge';
import {nutritionHistoryWindow} from '../utils/nutritionSync';
import {dateKey} from '../utils/metrics';
import {NutritionSyncCoordinator,type NutritionSyncView} from '../utils/nutritionCoordinator';
import {Button,Muted} from './Design';

type SyncContext={coordinator:NutritionSyncCoordinator;view:NutritionSyncView};
const Context=createContext<SyncContext|null>(null);
export function HealthSyncProvider({children}:{children:React.ReactNode}){
  const {update}=useAthlete(),bridge=useMemo(healthBridge,[]);
  const writer=useRef(update);writer.current=update;
  const coordinator=useMemo(()=>new NutritionSyncCoordinator({available:()=>!!bridge,getConfirmed:()=>getRepositoryCommitStatus().data?.healthNutrition,commit:change=>writer.current(data=>({...data,healthNutrition:change(data.healthNutrition)})),read:async(from,to,metrics)=>{if(!bridge)throw Error('HealthKit ist in diesem Build nicht verfügbar.');return bridge.readNutrition(from,to,metrics);}}),[bridge]);
  const [view,setView]=useState(coordinator.getSnapshot);
  useEffect(()=>{const unsubscribe=coordinator.subscribe(setView);return()=>{unsubscribe();coordinator.dispose();};},[coordinator]);
  useEffect(()=>{const listener=AppState.addEventListener('change',state=>{if(state==='active')void coordinator.request(nutritionHistoryWindow(dateKey(),7),'foreground');else coordinator.cancel();});return()=>listener.remove();},[coordinator]);
  return <Context.Provider value={{coordinator,view}}>{children}</Context.Provider>;
}
export function useHealthSync(){const context=useContext(Context);if(!context)throw Error('HealthSyncProvider fehlt.');return context;}
/** Root mounts this once on the Health hub. Nutrition uses the same coordinator. */
export function HealthAreaSync(){
  const focused=useIsFocused(),{coordinator,view}=useHealthSync(),{confirmedData}=useAthlete(),state=confirmedData?.healthNutrition,available=useMemo(()=>!!healthBridge(),[]);
  useEffect(()=>{if(focused)void coordinator.request(nutritionHistoryWindow(dateKey(),7),'open');},[coordinator,focused]);
  if(!state?.authorizationRequested&&!state?.lastSync)return null;
  const busy=view.phase==='waiting'||view.phase==='running';
  return <View style={{marginBottom:14,gap:6}}>
    {busy?<Muted accessibilityLiveRegion="polite">Ernährung wird aktualisiert · {view.completedChunks}/{view.totalChunks} Abschnitte bestätigt.</Muted>:view.phase==='failed'?<Muted accessibilityLiveRegion="polite">{view.message||'Die Aktualisierung konnte nicht abgeschlossen werden.'}</Muted>:null}
    {state.lastSync&&<Muted>Letzter bestätigter Health-Stand: {new Date(state.lastSync.queriedAt).toLocaleString('de-AT')}.</Muted>}
    {!available?<Muted>HealthKit ist in diesem Build nicht verfügbar. Der gespeicherte Stand bleibt lesbar.</Muted>:state.authorizationRequested&&view.phase==='failed'?<Button secondary small title="Ernährungsabfrage erneut versuchen" onPress={()=>void coordinator.request(nutritionHistoryWindow(dateKey(),7),'manual')}/>:null}
  </View>;
}
