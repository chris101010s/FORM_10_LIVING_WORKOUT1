import type {LoadBasis} from '../features/workout/secondPassTypes';
import {workSet} from './workoutAnalytics';
import type {Workout} from '../data/schema';
import {dateKey,dayNumber,validateDate} from './metrics';
import {strengthSet,weightedSet} from './trainingEngine';
import {workoutVolume} from './workout';
export type PerformanceMetric='load'|'reps'|'volume'|'e1rm'|'duration'|'distance';
export type PerformancePoint={date:string;value:number;sessionId:string;sets:number;extraSets:number};
export const performanceMetricLabels:Record<PerformanceMetric,{label:string;unit:string}>={load:{label:'Schwerster Satz',unit:'kg'},reps:{label:'Meiste Wiederholungen',unit:'Wdh.'},volume:{label:'Arbeitsvolumen',unit:'kg × Wdh.'},e1rm:{label:'Geschätztes 1RM',unit:'kg · e1RM'},duration:{label:'Längster Satz',unit:'s'},distance:{label:'Größte Distanz',unit:'m'}};
export function performanceExerciseIds(workouts:Workout[]):string[]{const ids=new Set<string>();for(const w of [...workouts].sort((a,b)=>Date.parse(b.finishedAt)-Date.parse(a.finishedAt)))for(const s of w.sets)if(workSet(w,s))ids.add(s.exerciseId);return [...ids];}
export function exerciseSeries(workouts:Workout[],exerciseId:string,metric:PerformanceMetric,days=90,today=dateKey(),basis?:LoadBasis,side?:'left'|'right'):PerformancePoint[]{
 const end=dayNumber(today);return [...workouts].sort((a,b)=>Date.parse(a.finishedAt)-Date.parse(b.finishedAt)).flatMap(w=>{
  const date=dateKey(new Date(w.finishedAt)),n=dayNumber(date);if(!validateDate(date)||n>end||(days>0&&n<=end-days))return [];
  const rows=w.sets.filter(s=>s.exerciseId===exerciseId&&workSet(w,s)&&(!basis||(s.loadBasis??'total')===basis)&&(!side||!!s.unilateral||s.side===side));if(!rows.length)return [];
  const sets=metric==='load'||metric==='volume'?rows.filter(weightedSet):metric==='e1rm'?rows.filter(strengthSet):metric==='reps'?rows.filter(s=>s.reps>0):metric==='duration'?rows.filter(s=>s.durationSeconds!==undefined):rows.filter(s=>s.distanceMeters!==undefined);
  if(!sets.length)return [];
  const value=metric==='volume'?workoutVolume(sets):Math.max(...sets.map(s=>{const actual=s.unilateral?(side?s.unilateral[side]:{weightKg:Math.max(s.unilateral.left.weightKg,s.unilateral.right.weightKg),reps:Math.max(s.unilateral.left.reps,s.unilateral.right.reps)}):s;return metric==='load'?actual.weightKg:metric==='reps'?actual.reps:metric==='e1rm'?s.weightKg*(1+s.reps/30):metric==='duration'?s.durationSeconds??0:s.distanceMeters??0}));
  return [{date,value,sessionId:w.id,sets:sets.length,extraSets:sets.filter(s=>s.isExtraSet).length}];
 });
}
export function performanceLoadBases(workouts:Workout[],exerciseId:string):LoadBasis[]{return [...new Set([...workouts].sort((a,b)=>Date.parse(b.finishedAt)-Date.parse(a.finishedAt)).flatMap(w=>w.sets.filter(s=>s.exerciseId===exerciseId&&workSet(w,s)).map(s=>s.loadBasis??'total')))];}
export function availablePerformanceMetrics(workouts:Workout[],exerciseId:string):PerformanceMetric[]{return (Object.keys(performanceMetricLabels) as PerformanceMetric[]).filter(metric=>exerciseSeries(workouts,exerciseId,metric,0).length>0);}
