import {useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {useAthlete} from '../data/context';
import {localSnapshots} from '../utils/localSnapshots';
export type AutoBackupStatus={state:'idle'|'writing'|'ok'|'failed';at?:string;code?:'LOCAL_BACKUP_FAILED'};
let status:AutoBackupStatus={state:'idle'};
export function automaticBackupStatus(){return status;}
/** Coalesced committed-state snapshots; never serialize optimistic keypress state. */
export function AutoBackupSync(){const {confirmedData,ready,saving,fault}=useAthlete(),[resume,setResume]=useState(0),current=useRef(confirmedData);current.current=confirmedData;
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state==='active')setResume(n=>n+1);});return()=>sub.remove();},[]);
 useEffect(()=>{if(!ready||!confirmedData||saving||fault)return;let cancelled=false;const timer=setTimeout(()=>{void(async()=>{const data=current.current;if(cancelled||!data)return;status={state:'writing'};try{const manager=await localSnapshots();await manager.ensureVersion(data);const written=await manager.ensureDaily(data);status={state:'ok',at:written?.createdAt??new Date().toISOString()};}catch{status={state:'failed',code:'LOCAL_BACKUP_FAILED'};}})();},1500);return()=>{cancelled=true;clearTimeout(timer);};},[ready,saving,fault,confirmedData,resume]);return null;}
