import React,{useEffect,useState} from 'react';
import {View,Text,Switch,AppState,Platform} from 'react-native';
import {requireOptionalNativeModule} from 'expo';
import KV from 'expo-sqlite/kv-store';
import {useAthlete} from '../data/context';
import {Button,Card,Muted,Section,usePalette} from './Design';
import {widgetTimeline,liveActivityData} from '../utils/widgetData';
import {getRuntimeCapabilities,type RuntimeCapabilities} from '../utils/nativeCapabilities';
const native=Platform.OS==='ios'?requireOptionalNativeModule<{widgetsEnabled:()=>boolean}>('FormHealth'):null;
export const widgetsAvailable=()=>{try{return native?.widgetsEnabled()===true&&!!requireOptionalNativeModule('ExpoWidgets');}catch{return false;}};
const ACTIVITY_KEY='form15-device-live-activity';
let queue:Promise<unknown>=Promise.resolve(),widgetError='';
const listeners=new Set<()=>void>(),retryListeners=new Set<()=>void>();
const status=(message:string)=>{widgetError=message;for(const listener of listeners)listener();};
export function WidgetSync(){
 const {confirmedData,ready,fault}=useAthlete(),[resume,setResume]=useState(0);
 const clockIssue=confirmedData?.live?liveActivityData(confirmedData.live,Date.now()).clockIssue:false;
 useEffect(()=>{const refresh=()=>setResume(x=>x+1),sub=AppState.addEventListener('change',s=>{if(s==='active')refresh();});retryListeners.add(refresh);return()=>{sub.remove();retryListeners.delete(refresh);};},[]);
 useEffect(()=>{
  if(!ready||fault||!confirmedData||!widgetsAvailable())return;
  let current=true;const data=confirmedData;
  queue=queue.catch(()=>{}).then(async()=>{
   if(!current)return;
   const capability=await getRuntimeCapabilities();if(!current||!capability.widgets.available)return;
   const widget=(await import('../widgets/TrainingWidget')).default;if(!current)return;
   widget.updateTimeline(widgetTimeline(data,new Date(),data.settings.widgetEnabled===true));
   const activity=(await import('../widgets/TrainingActivity')).default;if(!current)return;
   const instances=activity.getInstances();
   if(!data.settings.activityEnabled||!data.live||!capability.widgets.activitiesAllowed){for(const instance of instances)await instance.end('immediate');await KV.removeItem(ACTIVITY_KEY);status('');return;}
   const live=data.live,props=liveActivityData(live,Date.now()),stale=new Date(Math.max(Date.now()+60_000,live.restUntil||0));
   let saved:{sessionId?:string;activityId?:string}={};const raw=await KV.getItem(ACTIVITY_KEY);
   if(raw)try{saved=JSON.parse(raw);}catch{/* Unknown old activity identity is ended below. */}
   if(!current)return;
   const existing=saved?.sessionId===live.id?instances.find(item=>item.getId()===saved.activityId):undefined;
   for(const item of instances){if(!current)return;if(item!==existing)await item.end('immediate');}
   if(!current)return;
   if(existing)await existing.update(props,stale);
   else if(AppState.currentState==='active'){
    const started=activity.start(props,'athleteos://training',stale),activityId=started.getId();
    if(!activityId)throw Error('Keine native Live-Activity-Identität erhalten.');
    try{await KV.setItem(ACTIVITY_KEY,JSON.stringify({sessionId:live.id,activityId}));}catch(error){await started.end('immediate');throw error;}
   }
   if(current)status('');
  }).catch(()=>{if(current)status('Die Widget-/Live-Activity-Aktualisierung konnte nicht bestätigt werden. Öffne FORM erneut oder versuche den Abgleich noch einmal.');});
  return()=>{current=false;};
 },[ready,fault,confirmedData?.programs,confirmedData?.planOccurrences,confirmedData?.routines,confirmedData?.weeklyPlan,confirmedData?.workouts,confirmedData?.live?.id,confirmedData?.live?.startedAt,confirmedData?.live?.sets.length,confirmedData?.live?.pausedAt,confirmedData?.live?.pausedMs,confirmedData?.live?.restUntil,confirmedData?.live?.restPausedMs,confirmedData?.settings.widgetEnabled,confirmedData?.settings.activityEnabled,clockIssue,resume]);
 return null;
}
export function WidgetSettings(){
 const color=usePalette(),{data,update}=useAthlete(),[capability,setCapability]=useState<RuntimeCapabilities|null>(null),[error,setError]=useState(widgetError);
 useEffect(()=>{let mounted=true;const refresh=()=>{void getRuntimeCapabilities().then(value=>{if(mounted)setCapability(value);});};refresh();const sub=AppState.addEventListener('change',s=>{if(s==='active')refresh();}),listen=()=>setError(widgetError);listeners.add(listen);return()=>{mounted=false;sub.remove();listeners.delete(listen);};},[]);
 return <View><Section title="Widgets & Live Activities"/><Card>{capability?.widgets.available?<>
  <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text style={{flex:1,color:color.ink}}>Wochenübersicht im Widget zeigen</Text><Switch value={data.settings.widgetEnabled===true} onValueChange={widgetEnabled=>{void update(d=>({...d,settings:{...d.settings,widgetEnabled}}));}}/></View>
  <View style={{flexDirection:'row',alignItems:'center',gap:8,marginTop:12}}><Text style={{flex:1,color:color.ink}}>Aktives Training am Sperrbildschirm</Text><Switch disabled={!capability.widgets.activitiesAllowed} value={data.settings.activityEnabled===true&&capability.widgets.activitiesAllowed} onValueChange={activityEnabled=>{void update(d=>({...d,settings:{...d.settings,activityEnabled}}));}}/></View>
  {!capability.widgets.activitiesAllowed&&<Muted>Live Activities sind derzeit vom System nicht freigegeben. Prüfe die iOS-Einstellungen für FORM.</Muted>}
  <Muted>Geplanter Tag, tatsächlicher Wochenfortschritt, Satzanzahl, aktive Dauer und Resttimer werden außerhalb des App-Zugriffsschutzes sichtbar. Namen und persönliche Gesundheitswerte werden nicht übertragen. iOS entscheidet über Darstellung und Laufzeit.</Muted>
 </>:<Muted>{capability?'Dieser installierte Build stellt keine nutzbare Widget-Erweiterung mit App Group bereit. Die laufende Einheit und Timer bleiben in FORM erreichbar.':'Native Funktionen werden geprüft …'}</Muted>}
 {error&&<><Muted accessibilityLiveRegion="polite">{error}</Muted><Button secondary title="Abgleich erneut versuchen" onPress={()=>{for(const listener of retryListeners)listener();}}/></>}
 </Card></View>;
}
