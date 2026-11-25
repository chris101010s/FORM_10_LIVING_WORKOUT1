import type {AthleteData,LiveWorkout} from '../data/schema';
import {dateKey} from './metrics';
import {plannedDay} from './plans';
import {occurrencesOnDate,occurrenceCompleted} from './planOperations';
import {matchesPlannedDay,weekOverview} from './planOverview';
import {nativeSessionClockValid} from './nativeReconciliation';
export type WidgetProps={enabled:boolean;headline:string;detail:string;weekCount:number;weekPlanned:number;weekCompleted:number};
export const hiddenWidget:WidgetProps={enabled:false,headline:'FORM',detail:'Öffne die App für deine Übersicht.',weekCount:0,weekPlanned:0,weekCompleted:0};
export function widgetData(data:AthleteData,now:Date,enabled:boolean):WidgetProps{
 if(!enabled)return hiddenWidget;
 const today=dateKey(now),week=weekOverview(data,today),start=week[0].date;
 const completed=new Set(data.workouts.filter(w=>w.sets.length>0).map(w=>dateKey(new Date(w.finishedAt))).filter(key=>key>=start&&key<=today));
 const counts={weekCount:completed.size,weekPlanned:week.reduce((n,d)=>n+d.plannedCount,0),weekCompleted:week.reduce((n,d)=>n+d.completedCount,0)};
 for(let i=0;i<=56;i++){
  const date=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,12),key=dateKey(date),p=plannedDay(data,date);
  const pending=occurrencesOnDate(data,key).filter(o=>o.kind==='training'&&o.status!=='skipped'&&!occurrenceCompleted(data,o));
  const legacy=!data.programs?.length&&p.routine&&p.kind==='training'&&!data.workouts.some(w=>matchesPlannedDay(w,p.routine!.id,key));
  if(pending.length||legacy)return {enabled:true,headline:i===0?'Heute':date.toLocaleDateString('de-AT',{weekday:'short',day:'numeric',month:'short'}),detail:pending.length>1?`${pending.length} offene Trainingstermine`:'Geplanter Trainingstag',...counts};
 }
 return {enabled:true,headline:'Dein Rhythmus',detail:'Kein offener Pflichttermin',...counts};
}
export function widgetTimeline(data:AthleteData,now:Date,enabled:boolean){if(!enabled)return [{date:now,props:hiddenWidget}];return [0,1,2,3,4,5,6,7].map(i=>{const date=i===0?now:new Date(now.getFullYear(),now.getMonth(),now.getDate()+i);return {date,props:widgetData(data,date,true)};});}

export type ActivityProps={sets:number;status:string;elapsedStartMs:number;elapsedPaused:string|null;restFromMs:number;restEndMs:number|null;restPaused:string|null;clockIssue:boolean};
const duration=(ms:number)=>{const seconds=Math.floor(Math.max(0,ms)/1000);return `${Math.floor(seconds/3600)}:${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;};
/** Absolute timestamps let SwiftUI update time without foreground JavaScript polling. */
export function liveActivityData(live:LiveWorkout,now:number):ActivityProps{
 const start=Date.parse(live.startedAt),elapsedStartMs=start+(live.pausedMs||0),clockIssue=!nativeSessionClockValid(live,now);
 return {sets:live.sets.length,status:clockIssue?'Uhrzeit in FORM prüfen':live.pausedAt?'Unterbrochen':'Training läuft',elapsedStartMs:clockIssue?now:elapsedStartMs,elapsedPaused:clockIssue?'—':live.pausedAt?duration(live.pausedAt-elapsedStartMs):null,restFromMs:now,restEndMs:!clockIssue&&!live.pausedAt&&live.restUntil&&live.restUntil>now?live.restUntil:null,restPaused:!clockIssue&&live.restPausedMs!==undefined?duration(live.restPausedMs):null,clockIssue};
}
