import type {AthleteData,Habit} from '../data/schema';
import {dateKey,dayNumber} from './metrics';
import {weightedSet} from './trainingEngine';
export function habitDue(h:Habit,day:string){return !h.paused&&!h.archived&&(!h.days||h.days.includes(new Date(day+'T12:00:00Z').getUTCDay()));}
export type Insight={title:string;detail:string;basis:string};
export function localInsights(data:AthleteData,today=dateKey()):Insight[]{
 if(!data.settings.coach||data.settings.tone==='off')return [];
 const out:Insight[]=[];const recent=[...data.workouts].filter(w=>dayNumber(today)-dayNumber(dateKey(new Date(w.finishedAt)))>=0).sort((a,b)=>b.finishedAt.localeCompare(a.finishedAt));
 const ids=[...new Set(recent.slice(0,12).flatMap(w=>w.sets.filter(weightedSet).map(s=>s.exerciseId)))];
 for(const id of ids){const sessions=recent.filter(w=>w.sets.some(s=>s.exerciseId===id&&weightedSet(s)&&s.kind!=='warmup')).slice(0,3).reverse();if(sessions.length<3)continue;
 const top=sessions.map(w=>w.sets.filter(s=>s.exerciseId===id&&weightedSet(s)&&s.kind!=='warmup'&&(!s.side||s.side==='both')).sort((a,b)=>b.weightKg-a.weightKg||b.reps-a.reps)[0]);
 if(top.every(Boolean)&&top.every(s=>s.weightKg===top[0].weightKg)&&top[0].reps<top[1].reps&&top[1].reps<top[2].reps){out.push({title:'Mehr Wiederholungen',detail:`${data.exercises.find(e=>e.id===id)?.name||id.replace(/^fedb:/,'').replace(/_/g,' ')}: ${top.map(s=>s.reps).join(' → ')} bei ${top[0].weightKg} kg.`,basis:'Drei dokumentierte Sessions, jeweils schwerster Satz.'});break;}}
 const end=dayNumber(today);const rec=data.recovery.filter(r=>end-dayNumber(r.date)>=0&&end-dayNumber(r.date)<7).sort((a,b)=>b.date.localeCompare(a.date));const last=rec[0];if(last){const signals=[last.sleepHours!==undefined&&last.sleepHours<6,last.energy!==undefined&&last.energy<=2,last.soreness!==undefined&&last.soreness>=4].filter(Boolean).length;if(signals>=2)out.push({title:'Erholung einplanen',detail:'Mehrere deiner letzten Check-in-Werte sprechen für einen ruhigeren Tag. Entscheide selbst nach Befinden.',basis:`${signals} Hinweise aus dem Check-in vom ${last.date}; keine medizinische Bewertung.`});}
 const weights=data.weights.filter(w=>end-dayNumber(w.date)>=0&&end-dayNumber(w.date)<28);const avg=(a:typeof weights)=>a.reduce((n,w)=>n+w.kg,0)/a.length;const current=weights.filter(w=>end-dayNumber(w.date)<14),older=weights.filter(w=>end-dayNumber(w.date)>=14);if(new Set(current.map(w=>w.date)).size>=3&&new Set(older.map(w=>w.date)).size>=3){out.push({title:'Langfristiger Blick',detail:`14-Tage-Mittel ${avg(current).toFixed(1)} kg; vorherige 14 Tage ${avg(older).toFixed(1)} kg.`,basis:`${current.length+older.length} Messungen; Wasser und Messbedingungen können schwanken.`});}
 if(recent.length>=4&&recent.slice(0,4).every(w=>w.sets.length>0))out.push({title:'Protokoll geführt',detail:'Deine letzten vier abgeschlossenen Sessions enthalten dokumentierte Sätze.',basis:'4 gespeicherte Sessions; keine Aussage über Trainingsqualität.'});
 return out;
}
