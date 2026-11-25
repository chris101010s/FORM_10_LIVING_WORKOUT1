import type {AthleteData} from '../data/schema';
import {plannedDay} from './plans';
import {occurrencesOnDate,occurrenceCompleted} from './planOperations';
import {matchesPlannedDay} from './planOverview';
import {nativeSessionClockValid,type DesiredLocalNotification} from './nativeReconciliation';
import {validateDate,dateKey} from './metrics';
export function moveItem<T>(items:readonly T[],from:number,to:number):T[]{const result=[...items];if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=items.length||to>=items.length)return result;const [item]=result.splice(from,1);result.splice(to,0,item);return result;}
export function dragDestination(rows:readonly {y:number;height:number}[],from:number,dy:number):number{const start=rows[from];if(!start||!Number.isFinite(dy))return from;const center=start.y+start.height/2+dy;let nearest=from,best=Infinity;rows.forEach((r,i)=>{if(!r||r.height<=0)return;const d=Math.abs(center-(r.y+r.height/2));if(d<best){best=d;nearest=i;}});return nearest;}
export function pickerDate(value:string,now=new Date()):Date{if(!validateDate(value))return new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d,12);}
export type AlertPlan=DesiredLocalNotification;
export function notificationPlan(data:AthleteData,now:number):AlertPlan[]{
 const out:AlertPlan[]=[],live=data.live,sound=data.settings.alertSound===true;
 if(data.settings.restAlerts&&live&&!live.pausedAt&&nativeSessionClockValid(live,now)&&live.restUntil&&live.restUntil>now+1000){
  const timerId=live.restTimerId||'legacy';
  out.push({id:`form-rest-${live.id}-${timerId}-${live.restUntil}`,sessionId:live.id,timerId,at:live.restUntil,title:'Pause vorbei',body:'Bereit für den nächsten Satz?',sound});
 }
 const time=data.settings.reminderTime;
 if(time&&/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){
  const [h,m]=time.split(':').map(Number),start=new Date(now);
  for(let i=0;i<21;i++){
   const date=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i,h,m),key=dateKey(date);
   const occurrences=occurrencesOnDate(data,key),pending=occurrences.filter(o=>o.kind==='training'&&o.status!=='skipped'&&!occurrenceCompleted(data,o));
   const day=plannedDay(data,date),legacy=!data.programs?.length&&day.kind==='training'&&day.routine&&!data.workouts.some(w=>matchesPlannedDay(w,day.routine!.id,key));
   if(date.getTime()>now+1000&&(pending.length||legacy))out.push({id:`form-plan-${key}-${date.getTime()}`,at:date.getTime(),title:'Dein Training steht an',body:pending.length>1?`${pending.length} geplante Trainingstermine sind heute offen.`:'Dein geplanter Trainingstag ist heute.',sound});
  }
 }
 return out;
}
