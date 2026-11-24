import type {AthleteData} from '../data/schema';
import {dateKey,dayNumber} from './metrics';
import {weightedSet,sessionReview} from './trainingEngine';
export const storyThemes=[{id:'weekly',name:'Weekly Film',bg:'#202820',ink:'#F6F5F0',accent:'#C8D0A3'},{id:'pr',name:'PR Ticket',bg:'#E65E3A',ink:'#171915',accent:'#F6F5F0'},{id:'receipt',name:'Training Receipt',bg:'#F6F5F0',ink:'#171915',accent:'#9B3C24'},{id:'quiet',name:'Quiet Progress',bg:'#E1E8DF',ink:'#171915',accent:'#536456'},{id:'race',name:'Race Day',bg:'#18213A',ink:'#FFFFFF',accent:'#A8C2FF'}] as const;
export type StoryId=typeof storyThemes[number]['id'];
export type StoryMetric={label:string;value:string};
export function storyMetrics(data:AthleteData,theme:StoryId,days:number,today=dateKey(),includeWeight=false):StoryMetric[]{
 const end=dayNumber(today),within=(s:string)=>{const d=end-dayNumber(s);return d>=0&&d<days};
 const workouts=data.workouts.filter(w=>within(dateKey(new Date(w.finishedAt)))).sort((a,b)=>b.finishedAt.localeCompare(a.finishedAt));
 const sets=workouts.flatMap(w=>w.sets),cardio=data.cardio.filter(c=>within(c.date));const out:StoryMetric[]=[];
 if(theme==='race'){if(cardio.length){out.push({label:'Einheiten',value:String(cardio.length)},{label:'Zeit',value:`${Math.round(cardio.reduce((n,c)=>n+c.minutes,0))} min`});const withKm=cardio.filter(c=>c.km!=null&&c.km>0);if(withKm.length)out.push({label:'Distanz',value:`${withKm.reduce((n,c)=>n+c.km!,0).toFixed(1)} km`});}}
 else if(theme==='pr'){const newest=workouts[0];if(newest){const candidates=newest.sets.filter(s=>weightedSet(s)&&s.kind!=='warmup'&&(!s.side||s.side==='both'));for(const s of candidates.sort((a,b)=>b.weightKg-a.weightKg)){const previous=data.workouts.filter(w=>Date.parse(w.finishedAt)<Date.parse(newest.finishedAt)).flatMap(w=>w.sets).filter(x=>x.exerciseId===s.exerciseId&&weightedSet(x)&&x.kind!=='warmup'&&(!x.side||x.side==='both'));if(previous.length&&s.weightKg>Math.max(...previous.map(x=>x.weightKg))){out.push({label:data.exercises.find(e=>e.id===s.exerciseId)?.name||s.exerciseId.replace(/^fedb:/,'').replace(/_/g,' '),value:`${s.weightKg} kg × ${s.reps}`});break;}}}}
 else if(theme==='receipt'){if(workouts[0]){const r=sessionReview(workouts[0]);out.push({label:'Letzte Session',value:`${r.minutes} min`},{label:'Sätze',value:String(r.sets)},{label:'Arbeitsvolumen',value:`${Math.round(r.volume)} kg`});}}
 else if(workouts.length){out.push({label:'Trainingseinheiten',value:String(workouts.length)},{label:'Sätze',value:String(sets.length)});if(theme==='quiet')out.push({label:'Trainingstage',value:String(new Set(workouts.map(w=>dateKey(new Date(w.finishedAt)))).size)});}
 if(includeWeight){const w=data.weights.filter(w=>within(w.date)).sort((a,b)=>a.date.localeCompare(b.date));if(w.length>1)out.push({label:'Gewichtsänderung',value:`${(w[w.length-1].kg-w[0].kg).toFixed(1)} kg`});}
 return out;
}
