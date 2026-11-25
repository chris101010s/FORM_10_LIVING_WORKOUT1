import React,{createContext,useContext,useEffect,useState,useRef} from 'react';
import {Alert} from 'react-native';
import {immutableAthleteData} from './validation';
import {AthleteData,emptyData} from './schema';
import {loadRepository as loadData,saveRepository as saveData,getRepositoryCommitStatus} from './repository';
import {validateNewWorkoutTransition} from '../utils/planWorkout';
import {validatePersistentTransition} from './secondPassValidation';
type Store={data:AthleteData;confirmedData:AthleteData|null;ready:boolean;saving:boolean;lastSaved:string|null;fault:string|null;faultOrigin:'load'|'save'|null;update:(f:(d:AthleteData)=>AthleteData)=>Promise<boolean>;replace:(d:AthleteData|((current:AthleteData)=>AthleteData))=>Promise<boolean>;retrySave:()=>Promise<boolean>;retryLoad:()=>Promise<void>};
const Ctx=createContext<Store|null>(null);
export function AthleteProvider({children}:{children:React.ReactNode}) {
 const [data,setData]=useState<AthleteData>(emptyData),[ready,setReady]=useState(false);
 const [confirmedData,setConfirmedData]=useState<AthleteData|null>(null);
 const [fault,setFault]=useState<string|null>(null),[faultOrigin,setFaultOrigin]=useState<'load'|'save'|null>(null);
 const [saving,setSaving]=useState(false),[lastSaved,setLastSaved]=useState<string|null>(null);
 const writeToken=useRef(0),restoreSequence=useRef(0),replacePending=useRef<number|undefined>(undefined);
 const latest=useRef<AthleteData>(data),loaded=useRef(false),mounted=useRef(true);
 const persist=(value:AthleteData)=>{
  const token=++writeToken.current,restoreToken=replacePending.current;
  setSaving(true);
  return saveData(value,restoreToken!==undefined,restoreToken).then(receipt=>{
   if(mounted.current){setConfirmedData(getRepositoryCommitStatus().data);setLastSaved(receipt.savedAt);}
   if(restoreToken!==undefined&&replacePending.current===restoreToken)replacePending.current=undefined;
   if(mounted.current&&token===writeToken.current){setSaving(false);setLastSaved(receipt.savedAt);setFault(null);setFaultOrigin(null);}
   return true;
  }).catch(error=>{
   // Keep the newest valid state and all row drafts in RAM; the repository remains on the last commit.
   if(mounted.current&&token===writeToken.current){setSaving(false);setFaultOrigin('save');setFault(`Speichern fehlgeschlagen: ${String(error)}`);}
   return false;
  });
 };
 const retryLoad=async()=>{
  if(loaded.current)return;
  setReady(false);
  try{
   const value=await loadData();loaded.current=true;latest.current=value;
   if(mounted.current){setData(value);setConfirmedData(value);setLastSaved(getRepositoryCommitStatus().savedAt);setFault(null);setFaultOrigin(null);setReady(true);}
  }catch(error){if(mounted.current){setFaultOrigin('load');setFault(String(error));setReady(true);}}
 };
 useEffect(()=>{mounted.current=true;void retryLoad();return()=>{mounted.current=false;};},[]);
 const update=(fn:(d:AthleteData)=>AthleteData):Promise<boolean>=>{
  if(!loaded.current)return Promise.resolve(false);
  let next:AthleteData;
  try{
   const proposed=fn(latest.current);if(proposed===latest.current)return Promise.resolve(false);
   validateNewWorkoutTransition(latest.current,proposed);
   validatePersistentTransition(latest.current,proposed);
   next=immutableAthleteData(proposed.live&&proposed.live!==latest.current.live?{...proposed,live:{...proposed.live,lastSavedAt:new Date().toISOString()}}:proposed);
  }catch(error){Alert.alert('Eingabe nicht gespeichert',String((error as Error).message));return Promise.resolve(false);}
  latest.current=next;setData(next);return persist(next);
 };
 const replace=(replacement:AthleteData|((current:AthleteData)=>AthleteData)):Promise<boolean>=>{
  if(!loaded.current){Alert.alert('Datenbestand zuerst laden','Die Datenbank konnte nicht sicher gelesen werden. Wiederhole das Laden oder sichere die vorhandenen Daten zur Wiederherstellung. Es wurde nichts überschrieben.');return Promise.resolve(false);}
  let next:AthleteData;try{next=immutableAthleteData(typeof replacement==='function'?replacement(latest.current):replacement)}catch(error){Alert.alert('Backup nicht übernommen',String((error as Error).message));return Promise.resolve(false);}
  replacePending.current=++restoreSequence.current;latest.current=next;setData(next);return persist(next);
 };
 const retrySave=():Promise<boolean>=>loaded.current?persist(latest.current):Promise.resolve(false);
 return <Ctx.Provider value={{data,confirmedData,ready,saving,lastSaved,fault,faultOrigin,update,replace,retrySave,retryLoad}}>{children}</Ctx.Provider>;
}
export function useAthlete():Store{const value=useContext(Ctx);if(!value)throw new Error('Store fehlt');return value;}
