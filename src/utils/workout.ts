import {dateKey} from './metrics';
import {weightedSet,strengthSet} from './trainingEngine';
import type {GymSet,Workout,LiveWorkout} from '../data/schema';

/** Use the latest live set first, then the newest completed session. */
export function suggestedSet(workouts:Workout[],live:LiveWorkout|null,exerciseId:string):{weightKg:number,reps:number,rir?:number}|null {
 if(!exerciseId)return null;
 const recent=[...(live?.sets||[])].reverse();const today=recent.find(s=>s.exerciseId===exerciseId&&s.kind!=='warmup'&&s.reps>0)||recent.find(s=>s.exerciseId===exerciseId&&s.reps>0);
 if(today)return {weightKg:today.weightKg,reps:today.reps,rir:today.rir};
 const previous=[...workouts].sort((a,b)=>b.finishedAt.localeCompare(a.finishedAt))
  .find(w=>w.sets.some(s=>s.exerciseId===exerciseId&&s.reps>0));
 const options=previous?.sets.filter(s=>s.exerciseId===exerciseId&&s.reps>0)||[];const set=options.slice().reverse().find(s=>s.kind!=='warmup')||options.slice(-1)[0];
 return set?{weightKg:set.weightKg,reps:set.reps,rir:set.rir}:null;
}
export function workoutVolume(sets:GymSet[]):number {
 return sets.reduce((total,s)=>total+(s.kind==='warmup'||!weightedSet(s)?0:s.weightKg*s.reps),0);
}
export type WeekSummary={week:string;sessions:number;sets:number;volumeKg:number};
function mondayUTC(iso:string):string {
 const day=new Date(iso.slice(0,10)+'T12:00:00Z');
 if(!Number.isFinite(day.getTime()))return '';
 const mondayDistance=(day.getUTCDay()+6)%7;
 day.setUTCDate(day.getUTCDate()-mondayDistance);
 return day.toISOString().slice(0,10);
}
export function weeklyWorkouts(workouts:Workout[]):WeekSummary[]{
 const groups=new Map<string,WeekSummary>();
 for(const w of workouts){
  const week=mondayUTC(dateKey(new Date(w.finishedAt)));
  if(!week)continue;
  const summary=groups.get(week)||{week,sessions:0,sets:0,volumeKg:0};
  summary.sessions++;summary.sets+=w.sets.length;summary.volumeKg+=workoutVolume(w.sets);
  groups.set(week,summary);
 }
 return [...groups.values()].sort((a,b)=>a.week.localeCompare(b.week));
}
export function bestEstimated1RM(workouts:Workout[],exerciseId:string):number|null {
 const maximum=workouts.flatMap(w=>w.sets).filter(s=>s.exerciseId===exerciseId&&strengthSet(s))
  .map(s=>s.weightKg*(1+s.reps/30));
 return maximum.length?Math.max(...maximum):null;
}
export function safeRestSeconds(seconds:number):number {
 return Number.isInteger(seconds)?Math.max(15,Math.min(600,seconds)):90;
}

/** Exactly the last N calendar weeks, including weeks with no sessions. */
export function recentWeeklyWorkouts(workouts:Workout[],today:string,weeks=12):WeekSummary[]{
 const all=new Map(weeklyWorkouts(workouts).map(w=>[w.week,w]));
 const base=mondayUTC(today);
 if(!base)return [];
 const out:WeekSummary[]=[];
 for(let i=Math.max(1,Math.min(52,weeks))-1;i>=0;i--){
  const dt=new Date(base+'T12:00:00Z');dt.setUTCDate(dt.getUTCDate()-7*i);
  const week=dt.toISOString().slice(0,10);
  out.push(all.get(week)||{week,sessions:0,sets:0,volumeKg:0});
 }
 return out;
}
