import {strengthSet,weightedSet} from './trainingEngine';
import type {AthleteData,AthleteGoal,GymSet,MeasurementType,Workout} from '../data/schema';
import {dateKey,dayNumber,dailyWeight} from './metrics';
import {plannedDay} from './plans';
import {workoutVolume,bestEstimated1RM} from './workout';

/** ISO date local: no UTC day shift when logging or checking habits. */
export function currentCalendarWeek(today=dateKey()):{start:string;end:string}{
 const d=new Date(`${today}T12:00:00Z`);const dow=(d.getUTCDay()+6)%7;
 d.setUTCDate(d.getUTCDate()-dow);const start=d.toISOString().slice(0,10);
 d.setUTCDate(d.getUTCDate()+6);return {start,end:d.toISOString().slice(0,10)};
}
export function weeklyAdherence(data:AthleteData,today=dateKey()){
 const {start,end}=currentCalendarWeek(today);
 const days=Array.from({length:7},(_,i)=>{const d=new Date(`${start}T12:00:00`);d.setDate(d.getDate()+i);return {date:dateKey(d),kind:plannedDay(data,d).kind}}).filter(x=>x.kind==='training');
 const expected=days.filter(x=>x.date<=today).length;
 const actual=data.workouts.filter(w=>dateKey(new Date(w.finishedAt))>=start&&dateKey(new Date(w.finishedAt))<=end).length;
 return {expected,actual,plannedTotal:days.length};
}
export function trainingStreak(workouts:Workout[],today=dateKey()){
 const days=new Set(workouts.map(w=>dateKey(new Date(w.finishedAt))));
 const d=new Date(`${today}T12:00:00Z`);if(!days.has(today))d.setUTCDate(d.getUTCDate()-1);
 let count=0;while(count<365&&days.has(d.toISOString().slice(0,10))){count++;d.setUTCDate(d.getUTCDate()-1);}return count;
}
export type ExercisePoint={date:string;bestKg:number;volumeKg:number;maxReps:number;sets:number};
export function exerciseHistory(workouts:Workout[],exerciseId:string):ExercisePoint[]{
 return [...workouts].sort((a,b)=>Date.parse(a.finishedAt)-Date.parse(b.finishedAt))
 .flatMap(w=>{const sets=w.sets.filter(s=>s.exerciseId===exerciseId&&s.kind!=='warmup'&&weightedSet(s));if(!sets.length)return [];
  return [{date:dateKey(new Date(w.finishedAt)),bestKg:Math.max(...sets.map(s=>s.weightKg)),volumeKg:workoutVolume(sets),maxReps:Math.max(...sets.map(s=>s.reps)),sets:sets.length}];});
}
export function isNewBest(sets:GymSet[],allWorkouts:Workout[],exerciseId:string):boolean{
 const eligible=sets.filter(s=>s.exerciseId===exerciseId&&strengthSet(s));
 if(!eligible.length)return false;
 const newest=eligible[eligible.length-1];const candidate=newest.weightKg*(1+newest.reps/30);
 const previous=eligible.slice(0,-1).map(s=>s.weightKg*(1+s.reps/30));
 const oldBest=Math.max(bestEstimated1RM(allWorkouts,exerciseId)??0,...previous);
 return candidate>oldBest+0.00001;
}
export function personalRecords(data:AthleteData):Array<{exerciseId:string;bestKg:number;maxReps:number;totalSets:number;lastDate:string}>{
 const groups=new Map<string,{exerciseId:string;bestKg:number;maxReps:number;totalSets:number;lastDate:string}>();
 for(const w of data.workouts)for(const s of w.sets){if(s.kind==='warmup'||!weightedSet(s))continue;
  const old=groups.get(s.exerciseId)||{exerciseId:s.exerciseId,bestKg:0,maxReps:0,totalSets:0,lastDate:dateKey(new Date(w.finishedAt))};
  old.bestKg=Math.max(old.bestKg,s.weightKg);old.maxReps=Math.max(old.maxReps,s.reps);old.totalSets++;
  if(dateKey(new Date(w.finishedAt))>old.lastDate)old.lastDate=dateKey(new Date(w.finishedAt));
  groups.set(s.exerciseId,old);
 }
 return [...groups.values()].sort((a,b)=>b.totalSets-a.totalSets);
}
export function weeklyTrainingMinutes(data:AthleteData,today=dateKey()){
 const {start,end}=currentCalendarWeek(today);
 const workoutMinutes=data.workouts.filter(w=>dateKey(new Date(w.finishedAt))>=start&&dateKey(new Date(w.finishedAt))<=end).reduce((sum,w)=>sum+Math.min(360,Math.max(0,(Date.parse(w.finishedAt)-Date.parse(w.startedAt)-(w.pausedMs||0))/60000)),0);
 const cardioMinutes=data.cardio.filter(c=>c.date>=start&&c.date<=end).reduce((sum,c)=>sum+c.minutes,0);
 return Math.round(workoutMinutes+cardioMinutes);
}
export function bestMetric(data:AthleteData,kind:string):number|null{
 const p=data.performance.filter(x=>x.kind===kind);return p.length?Math.max(...p.map(x=>x.value)):null;
}
export function goalProgress(data:AthleteData,g:AthleteGoal):{current:number|null;unit:string;direction:'up'|'down';reached:boolean}{
 let current:number|null=null,unit='';let direction:'up'|'down'='up';
 if(g.metric==='pushups'){current=bestMetric(data,'Push-ups');unit='Wdh.';}
 if(g.metric==='pullups'){current=bestMetric(data,'Klimmzüge');unit='Wdh.';}
 if(g.metric==='plank'){current=bestMetric(data,'Plank');unit='Sek.';}
 if(g.metric==='workouts'){current=weeklyAdherence(data).actual;unit='pro Woche';}
 if(g.metric==='weight'){const w=dailyWeight(data.weights);current=w.length?w[w.length-1].kg:null;unit='kg';const first=w.length?w[0].kg:data.profile.startingKg;direction=first!==null&&first!==undefined&&g.target>first?'up':'down';}
 if(g.metric==='run5k'){const p=data.cardio.filter(c=>c.km!=null&&Math.abs(c.km-5)<0.15&&c.kind==='Laufen');current=p.length?Math.min(...p.map(c=>c.minutes)):null;unit='Min.';direction='down';}
 if(g.metric==='lift'&&g.exerciseId){current=bestEstimated1RM(data.workouts,g.exerciseId);unit='kg (e1RM)';}
 return {current,unit,direction,reached:current!==null&&(direction==='up'?current>=g.target:current<=g.target)};
}
export const measurementLabel:Record<MeasurementType,string>={waist:'Taille',chest:'Brust',hips:'Hüfte',upperArm:'Oberarm',thigh:'Oberschenkel',neck:'Hals'};
export function measurementsFor(data:AthleteData,metric:MeasurementType){return data.measurements.filter(x=>x.metric===metric).sort((a,b)=>a.date.localeCompare(b.date));}
export function balanceSummary(data:AthleteData,days=28,today=dateKey()){
 const end=dayNumber(today);
 const active=data.workouts.filter(w=>{const d=dayNumber(dateKey(new Date(w.finishedAt)));return d<=end&&d>end-days});
 const totalSets=active.reduce((s,w)=>s+w.sets.filter(x=>x.kind!=='warmup').length,0);
 return {sessions:active.length,totalSets,volumeKg:Math.round(active.reduce((s,w)=>s+workoutVolume(w.sets),0)),cardioMin:Math.round(data.cardio.filter(c=>{const d=dayNumber(c.date);return d<=end&&d>end-days}).reduce((s,c)=>s+c.minutes,0))};
}

export function sleepSummary(data:AthleteData,days=7,today=dateKey()):{average:number|null;entries:number}{
 const end=dayNumber(today);const recent=data.recovery.filter(r=>r.sleepHours!==undefined&&r.sleepHours>=0&&end-dayNumber(r.date)<days&&end-dayNumber(r.date)>=0);
 return {average:recent.length?recent.reduce((sum,r)=>sum+(r.sleepHours||0),0)/recent.length:null,entries:recent.length};
}
