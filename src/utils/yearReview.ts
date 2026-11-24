import type {AthleteData} from '../data/schema';
import {dateKey,dayNumber} from './metrics';
export function yearReview(data:AthleteData,year:number){const months=Array.from({length:12},(_,month)=>({month,sessions:0,sets:0,days:0}));const days=new Set<string>();for(const w of data.workouts){const d=new Date(w.finishedAt);if(d.getFullYear()!==year||!w.sets.length)continue;const m=months[d.getMonth()];m.sessions++;m.sets+=w.sets.length;const key=dateKey(d);if(!days.has(key)){days.add(key);m.days++;}}return months;}
export function journalMilestone(data:AthleteData){return data.workouts.reduce((n,w)=>n+w.sets.length,0)>=100;}
export function weightQuality(data:AthleteData){const dates=[...new Set(data.weights.map(w=>w.date))].sort();if(dates.length<9)return false;const end=dayNumber(dates[dates.length-1]);return [0,1,2].every(week=>dates.filter(d=>end-dayNumber(d)>=week*7&&end-dayNumber(d)<(week+1)*7).length>=3);}
