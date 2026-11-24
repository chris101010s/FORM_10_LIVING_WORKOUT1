import React,{createContext,useContext,useEffect,useState,useRef} from 'react';
import {Alert} from 'react-native';
import {validateRestoredData} from './validation';
import {AthleteData,emptyData} from './schema';
import {loadRepository as loadData,saveRepository as saveData} from './repository';
type Store={data:AthleteData;ready:boolean;saving:boolean;lastSaved:string|null;fault:string|null;faultOrigin:'load'|'save'|null;update:(f:(d:AthleteData)=>AthleteData)=>Promise<boolean>;replace:(d:AthleteData)=>void;retrySave:()=>void};
const Ctx=createContext<Store|null>(null);
export function AthleteProvider({children}:{children:React.ReactNode}) {
 const [data,setData]=useState<AthleteData>(emptyData);const [ready,setReady]=useState(false);const [fault,setFault]=useState<string|null>(null);const [faultOrigin,setFaultOrigin]=useState<'load'|'save'|null>(null);
 const [saving,setSaving]=useState(false);const [lastSaved,setLastSaved]=useState<string|null>(null);const writeToken=useRef(0);const replacePending=useRef(false);
 const revision=useRef(0);const latest=useRef<AthleteData>(data);
 const persist=(value:AthleteData,replacing=false)=>{const token=++writeToken.current;replacePending.current=replacing;setSaving(true);return saveData(value,replacing).then(()=>{if(token===writeToken.current){replacePending.current=false;setSaving(false);setLastSaved(new Date().toISOString());setFault(null);setFaultOrigin(null)}return true}).catch(e=>{if(token===writeToken.current){setSaving(false);setFaultOrigin('save');setFault(`Speichern fehlgeschlagen: ${String(e)}`)}return false})};
 useEffect(()=>{loadData().then(d=>{if(revision.current===0){latest.current=d;setData(d);}setReady(true)}).catch(e=>{setFaultOrigin('load');setFault(String(e));setReady(true)})},[]);

 const update=(fn:(d:AthleteData)=>AthleteData)=>{if(!ready||faultOrigin==='load')return Promise.resolve(false);let next:AthleteData;try{const proposed=fn(latest.current);if(proposed===latest.current)return Promise.resolve(false);revision.current++;next=validateRestoredData(proposed.live&&proposed.live!==latest.current.live?{...proposed,live:{...proposed.live,lastSavedAt:new Date().toISOString()}}:proposed)}catch(e){Alert.alert('Eingabe nicht gespeichert',String((e as Error).message));return Promise.resolve(false)}latest.current=next;setData(next);return persist(next)};
 const replace=(d:AthleteData)=>{revision.current++;latest.current=d;setData(d);setFault(null);setFaultOrigin(null);persist(d,true)};
 const retrySave=()=>{if(faultOrigin!=='save')return;setFault(null);setFaultOrigin(null);persist(latest.current,replacePending.current)};
 return <Ctx.Provider value={{data,ready,saving,lastSaved,fault,faultOrigin,update,replace,retrySave}}>{children}</Ctx.Provider>
}
export function useAthlete():Store{const x=useContext(Ctx);if(!x)throw new Error('Store fehlt');return x;}
