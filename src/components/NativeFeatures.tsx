import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {Alert,AppState,ActivityIndicator,Text,View,Switch,Platform} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import KV from 'expo-sqlite/kv-store';
import {useAthlete} from '../data/context';
import {Button,Card,Field,Muted,Section,usePalette} from './Design';
import {notificationPlan} from '../utils/nativePreferences';
import {reconcileLocalNotifications,ownNotification} from '../utils/nativeReconciliation';
const LOCK_KEY='form-v84-device-auth-lock';
Notifications.setNotificationHandler({handleNotification:async notification=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:notification.request.content.data?.sound===true,shouldSetBadge:false})});
const granted=async()=>{const p=await Notifications.getPermissionsAsync();return p.granted||p.ios?.status===Notifications.IosAuthorizationStatus.PROVISIONAL;};
async function requestAlerts(){if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('form-training',{name:'FORM Training',importance:Notifications.AndroidImportance.DEFAULT});if(await granted())return true;const p=await Notifications.requestPermissionsAsync();return p.granted||p.ios?.status===Notifications.IosAuthorizationStatus.PROVISIONAL;}
let notificationsQueue:Promise<unknown>=Promise.resolve();
type NotificationStatus={error:string;lastSyncedAt:string|null;running:boolean};
let notificationStatus:NotificationStatus={error:'',lastSyncedAt:null,running:false};
const notificationListeners=new Set<()=>void>(),retryListeners=new Set<()=>void>();
const publishNotificationStatus=(value:NotificationStatus)=>{notificationStatus=value;for(const listener of notificationListeners)listener();};
export const retryLocalNotifications=()=>{for(const listener of retryListeners)listener();};
function NotificationStatusLine(){
 const [status,setStatus]=useState(notificationStatus);
 useEffect(()=>{const listener=()=>setStatus(notificationStatus);notificationListeners.add(listener);return()=>{notificationListeners.delete(listener);};},[]);
 return <View style={{marginTop:12}}>{status.running&&<Muted>Lokale Mitteilungen werden abgeglichen …</Muted>}{status.error?<><Muted accessibilityLiveRegion="polite">{status.error}</Muted><Button secondary small title="Mitteilungen erneut abgleichen" onPress={retryLocalNotifications}/></>:status.lastSyncedAt?<Muted>Zuletzt mit iOS/Android abgeglichen: {new Date(status.lastSyncedAt).toLocaleString('de-AT')}. Das bestätigt die Planung, nicht die Zustellung.</Muted>:null}</View>;
}
export function NativeNotificationSync(){
 const {confirmedData,ready,fault}=useAthlete(),[resume,setResume]=useState(0);
 const desired=confirmedData?notificationPlan(confirmedData,Date.now()):[],intent=JSON.stringify(desired);
 useEffect(()=>{const refresh=()=>setResume(x=>x+1),sub=AppState.addEventListener('change',s=>{if(s==='active')refresh();});retryListeners.add(refresh);return()=>{sub.remove();retryListeners.delete(refresh);};},[]);
 useEffect(()=>{
  if(!ready||fault||!confirmedData)return;
  let current=true;
  notificationsQueue=notificationsQueue.catch(()=>{}).then(async()=>{
   if(!current)return;
   publishNotificationStatus({...notificationStatus,error:'',running:true});
   const targets=await granted()?desired:[];
   if(!current)return;
   await reconcileLocalNotifications({
    list:async()=>(await Notifications.getAllScheduledNotificationsAsync()).map(item=>({id:item.identifier,fingerprint:typeof item.content.data?.formFingerprint==='string'?item.content.data.formFingerprint:undefined})),
    cancel:id=>Notifications.cancelScheduledNotificationAsync(id),
    schedule:async(target,fingerprint)=>{await Notifications.scheduleNotificationAsync({identifier:target.id,content:{title:target.title,body:target.body,sound:target.sound?'default':false,data:{formFingerprint:fingerprint,sound:target.sound,sessionId:target.sessionId||'',timerId:target.timerId||''}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(target.at),...(Platform.OS==='android'?{channelId:'form-training'}:{})}});}
   },targets,()=>current);
   if(!current)return;
   const keep=new Set(targets.map(target=>target.id));
   for(const delivered of await Notifications.getPresentedNotificationsAsync()){
    if(!current)return;
    if(ownNotification(delivered.request.identifier)&&!keep.has(delivered.request.identifier))await Notifications.dismissNotificationAsync(delivered.request.identifier);
   }
   if(current)publishNotificationStatus({error:'',lastSyncedAt:new Date().toISOString(),running:false});
  }).catch(()=>{if(current)publishNotificationStatus({...notificationStatus,error:'Der Abgleich lokaler Mitteilungen ist fehlgeschlagen. Frühere Erinnerungen könnten noch aktiv sein. Bitte erneut versuchen.',running:false});});
  return()=>{current=false;};
 },[ready,fault,intent,resume]);
 return null;
}
const AuthContext=createContext<{enabled:boolean;change:(v:boolean)=>Promise<void>;busy:boolean}|null>(null);
async function authenticate(){const result=await LocalAuthentication.authenticateAsync({promptMessage:'FORM entsperren',cancelLabel:'Abbrechen',fallbackLabel:'Gerätecode verwenden',disableDeviceFallback:false});return result.success;}
export function PrivacyGate({children}:{children:React.ReactNode}){const color=usePalette();const [loaded,setLoaded]=useState(false),[enabled,setEnabled]=useState(false),[locked,setLocked]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');const working=useRef(false);const enabledRef=useRef(false);const [active,setActive]=useState(AppState.currentState==='active');
 const read=()=>{setError('');KV.getItem(LOCK_KEY).then(v=>{const on=v==='1';enabledRef.current=on;setEnabled(on);setLocked(on);setLoaded(true)}).catch(e=>setError('Geräteschutz konnte nicht geladen werden. '+String(e)))};
 useEffect(()=>{read();const sub=AppState.addEventListener('change',s=>{setActive(s==='active');if(s==='background'&&enabledRef.current&&!working.current)setLocked(true)});return()=>sub.remove()},[]);
 const unlock=async()=>{if(working.current)return;working.current=true;setBusy(true);try{if(await authenticate())setLocked(false);else setError('Nicht entsperrt. Erneut versuchen.')}catch(e){setError(String(e))}finally{working.current=false;setBusy(false)}};
 const change=async(v:boolean)=>{if(working.current)return;working.current=true;setBusy(true);try{const level=await LocalAuthentication.getEnrolledLevelAsync();if(v&&level===LocalAuthentication.SecurityLevel.NONE)throw Error('Richte zuerst einen Gerätecode oder biometrische Entsperrung ein.');if(!await authenticate())return;await KV.setItem(LOCK_KEY,v?'1':'0');enabledRef.current=v;setEnabled(v);setLocked(false);setError('')}catch(e){Alert.alert('Geräteschutz',String(e))}finally{working.current=false;setBusy(false)}};
 if(!loaded)return <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:24,backgroundColor:color.bg}}>{error?<><Muted>{error}</Muted><Button title="Erneut laden" onPress={read}/></>:<ActivityIndicator/>}</View>;
 const shield=enabled&&(locked||!active);return <AuthContext.Provider value={{enabled,change,busy}}><View style={{flex:1}}><View style={{flex:1}} importantForAccessibility={shield?'no-hide-descendants':'auto'} accessibilityElementsHidden={shield} pointerEvents={shield?'none':'auto'}>{locked?null:children}</View>{shield&&<View accessibilityViewIsModal style={{position:'absolute',top:0,bottom:0,left:0,right:0,backgroundColor:color.bg,justifyContent:'center',padding:28,gap:16}}><Text style={{fontSize:42,fontWeight:'800',color:color.ink}}>form.</Text><Muted>Deine Daten bleiben privat.</Muted>{active&&<><Button title={busy?'Authentifizierung …':'Entsperren'} disabled={busy} onPress={()=>void unlock()}/>{error?<Muted>{error}</Muted>:null}</>}</View>}</View></AuthContext.Provider>}
export function NativeSettings(){const color=usePalette();const {data,update}=useAthlete();const auth=useContext(AuthContext);const [time,setTime]=useState(data.settings.reminderTime||'');const [busy,setBusy]=useState(false);const patch=(settings:Partial<typeof data.settings>)=>update(d=>({...d,settings:{...d.settings,...settings}}));
 const permissions=async(fn:()=>void)=>{if(busy)return;setBusy(true);try{if(await requestAlerts())fn();else Alert.alert('Benachrichtigungen deaktiviert','Du kannst sie in den iOS-Einstellungen erlauben. Der Timer bleibt ohne Benachrichtigungen benutzbar.')}catch(e){Alert.alert('Nicht verfügbar',String(e))}finally{setBusy(false)}};
 return <View><Section title="Geräteschutz"/><Card>{auth&&<View style={{flexDirection:'row',alignItems:'center',gap:8,marginTop:18}}><Text style={{flex:1,color:color.ink}}>Face ID / Touch ID / Gerätecode</Text><Switch disabled={auth.busy} value={auth.enabled} onValueChange={v=>void auth.change(v)}/></View>}<Muted>Optionaler App-Zugriffsschutz. Kein verschlüsselter Datenbank- oder Backup-Schutz. Gerätespezifisch, nicht im JSON-Backup.</Muted></Card><Section title="Lokale Mitteilungen"/><Card><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text style={{flex:1,color:color.ink}}>Pausenende melden</Text><Switch disabled={busy} value={data.settings.restAlerts===true} onValueChange={v=>{if(v){void permissions(()=>{void patch({restAlerts:true})})}else{void patch({restAlerts:false})}}}/></View><View style={{flexDirection:'row',alignItems:'center',gap:8,marginVertical:14}}><Text style={{flex:1,color:color.ink}}>Ton erlauben</Text><Switch value={data.settings.alertSound===true} onValueChange={alertSound=>{void patch({alertSound})}}/></View><Field label="Trainingserinnerung (HH:MM)" value={time} onChangeText={setTime} placeholder="18:00"/><Button title="Erinnerung aktivieren" disabled={busy} onPress={()=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return Alert.alert('Uhrzeit prüfen','Bitte HH:MM eingeben.');void permissions(()=>patch({reminderTime:time}))}}/>{data.settings.reminderTime&&<Button small secondary title="Erinnerung ausschalten" onPress={()=>{patch({reminderTime:undefined});setTime('')}}/>}<Muted>{data.settings.reminderTime?`Aktiv: ${data.settings.reminderTime}. `:''}Geplante Pflichttage der nächsten 21 Tage; beim Öffnen wird neu geplant. Keine Mitteilungen für Ruhetage oder optionale Tage. Das System entscheidet über Zustellung.</Muted><NotificationStatusLine/></Card></View>}
