import {AthleteData,emptyData} from '../data/schema';
import {dateKey,numberInput,validWeight} from './metrics';
import {validateRestoredData} from '../data/validation';
export type SetupDraft={name:string;weight:string;target:string;priority?:AthleteData['profile']['priority'];days:number[];tone:'calm'|'coach'|'chaos'|'off';restSeconds:number;eggs:boolean};
export const blankSetup=():SetupDraft=>({name:'',weight:'',target:'',days:[],tone:'off',restSeconds:90,eggs:false});
export function validateSetup(s:SetupDraft){
 const weight=s.weight.trim()?numberInput(s.weight):null,target=s.target.trim()?numberInput(s.target):null;
 if(s.weight.trim()&&!validWeight(weight))throw Error('Bitte ein gültiges aktuelles Gewicht eingeben oder leer lassen.');
 if(s.target.trim()&&!validWeight(target))throw Error('Bitte ein gültiges Zielgewicht eingeben oder leer lassen.');
 if(s.name.trim().length>120)throw Error('Name ist zu lang.');
 if(s.days.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Ungültiger Trainingstag.');
 if(!Number.isInteger(s.restSeconds)||s.restSeconds<15||s.restSeconds>600)throw Error('Ungültige Pausendauer.');
 if(!['calm','coach','chaos','off'].includes(s.tone))throw Error('Ungültiger Coach-Modus.');
 return {weight,target};
}
/** Applies a new, explicitly chosen setup once. Never creates measurements from defaults. */
export function finishSetup(data:AthleteData,s:SetupDraft,now=new Date(),measurementId=`setup:${now.getTime()}`):AthleteData{
 if(data.profile.onboarded)return data;
 const {weight,target}=validateSetup(s);
 return validateRestoredData({...data,profile:{...data.profile,name:s.name.trim(),targetKg:target,startingKg:weight??data.profile.startingKg,onboarded:true,priority:s.priority},weights:weight===null?data.weights:[...data.weights,{id:measurementId,date:dateKey(now),kg:weight,note:'Beim Einrichten selbst eingetragen'}],weeklyPlan:[...data.weeklyPlan,...[...new Set(s.days)].filter(day=>!data.weeklyPlan.some(p=>p.day===day)).map(day=>({day,routineId:null}))],settings:{...data.settings,coach:s.tone!=='off',tone:s.tone,restSeconds:s.restSeconds,eggs:s.eggs}});
}
export function freshData():AthleteData{const data=emptyData();return {...data,settings:{...data.settings,coach:false,tone:'off',eggs:false}};}
