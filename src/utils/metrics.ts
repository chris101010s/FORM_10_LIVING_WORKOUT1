import type {WeightEntry, Workout, GymSet, BodyScan} from '../data/schema';

export function dateKey(date = new Date()): string {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function numberInput(value: string): number | null {
  const clean = value.trim().replace(',','.');
  if (!clean || !/^-?\d+(?:\.\d+)?$/.test(clean)) return null;
  const n = Number(clean); return Number.isFinite(n) ? n : null;
}
export function validWeight(n: number | null): n is number {return n != null && n > 20 && n < 350;}
export function sortedWeight(entries: WeightEntry[]): WeightEntry[] {return [...entries].filter(e => validWeight(e.kg) && validateDate(e.date)).sort((a,b)=>a.date.localeCompare(b.date));}
export function dayNumber(iso: string): number {const t = Date.parse(iso+'T12:00:00Z'); return Number.isFinite(t)? Math.floor(t/86400000):0;}
export function dailyWeight(entries:WeightEntry[]):Array<{date:string,kg:number}> {
 const grouped=new Map<string,{sum:number,count:number}>();
 for(const e of sortedWeight(entries)){
  const g=grouped.get(e.date)||{sum:0,count:0};g.sum+=e.kg;g.count++;grouped.set(e.date,g);
 }
 return [...grouped].map(([date,g])=>({date,kg:g.sum/g.count})).sort((a,b)=>a.date.localeCompare(b.date));
}
export function rollingWeight(entries: WeightEntry[], span = 7): Array<{date:string, raw:number, average:number}> {
 const days=dailyWeight(entries);
 let left=0,sum=0;
 return days.map((p,i)=>{sum+=p.kg;while(left<i&&dayNumber(p.date)-dayNumber(days[left].date)>=Math.max(1,span)){sum-=days[left++].kg;}return {date:p.date,raw:p.kg,average:sum/(i-left+1)};});
}
export function rateKgPerWeek(entries: WeightEntry[]): number | null {
 const days=dailyWeight(entries);if(days.length<3)return null;
 const end=dayNumber(days[days.length-1].date);const recent=days.filter(e=>end-dayNumber(e.date)<=35);
 if(recent.length<3 || end-dayNumber(recent[0].date)<14)return null;
 const pts=recent.map(e=>({x:dayNumber(e.date)-dayNumber(recent[0].date),y:e.kg}));
 const xm=pts.reduce((s,p)=>s+p.x,0)/pts.length,ym=pts.reduce((s,p)=>s+p.y,0)/pts.length;
 const denom=pts.reduce((s,p)=>s+(p.x-xm)**2,0);if(!denom)return null;
 return 7*pts.reduce((s,p)=>s+(p.x-xm)*(p.y-ym),0)/denom;
}
export function projectedWeeks(entries: WeightEntry[], target: number | null): number | null {
 if(!target || !validWeight(target))return null;
 const sorted=dailyWeight(entries); if(!sorted.length)return null;
 const last=sorted[sorted.length-1].kg;
 if(last<=target)return 0;
 const rate=rateKgPerWeek(entries);if(rate===null||rate>=-0.15)return null;
 const result=(last-target)/-rate;return Number.isFinite(result) && result>0 && result<260 ? result:null;
}
export function estimatedOneRepMax(kg:number,reps:number):number|null {return kg>0&&reps>0&&reps<=15?kg*(1+reps/30):null;}
export function latestExerciseSets(workouts:Workout[],exerciseId:string):GymSet[] {
 const sorted=[...workouts].sort((a,b)=>b.finishedAt.localeCompare(a.finishedAt));
 const previous=sorted.find(w=>w.sets.some(s=>s.exerciseId===exerciseId));
 return previous?previous.sets.filter(s=>s.exerciseId===exerciseId):[];
}
export function parseBodyScanText(text: string): Partial<BodyScan> {
 const s=text.replace(/[\u00a0\u202f]/g,' ');
 const parse=(pattern:RegExp, low:number, high:number):number|undefined=>{
   const m=s.match(pattern);if(!m)return undefined;const value=Number(m[1].replace(',','.'));
   return Number.isFinite(value)&&value>=low&&value<=high?value:undefined;
 };
 return {
  bodyFat:parse(/(?:k[oö]rperfett(?:anteil)?|body\s*fat|fat\s*(?:mass|percentage)|pbf)\s*(?:\(%\)|\[%\]|:|=|\s)*\s*([\d.,]+)\s*%?/i,1,75),
  muscleKg:parse(/(?:skelettmuskel(?:masse)?|muskelmasse|skeletal\s*muscle\s*mass|muscle\s*mass|smm)\s*(?:\(kg\)|\[kg\]|:|=|\s)*\s*([\d.,]+)\s*(?:kg)?/i,1,150),
  visceralFat:parse(/(?:viszeral(?:fett)?|visceral\s*fat)\s*(?:level|stufe|:|=|\s)*\s*([\d.,]+)/i,1,60),
  waistCm:parse(/(?:taillen(?:umfang)?|waist(?:\s*circumference)?)\s*(?:\(cm\)|:|=|\s)*\s*([\d.,]+)/i,30,250),
  weightKg:parse(/(?:k[oö]rpergewicht|body\s*weight|weight|gewicht)\s*(?:\(kg\)|:|=|\s)*\s*([\d.,]+)\s*(?:kg)?/i,20,350),
  bmr:parse(/(?:grundumsatz|bmr|basal\s*metabolic\s*rate)\s*(?:\(kcal\)|:|=|\s)*\s*([\d.,]+)/i,500,5000)
 };
}
export function validateDate(iso:string):boolean {return /^\d{4}-\d{2}-\d{2}$/.test(iso)&&!Number.isNaN(Date.parse(iso+'T12:00:00Z'))&&new Date(iso+'T12:00:00Z').toISOString().startsWith(iso);}
export function previousWeekChange(entries:WeightEntry[]):number|null {
 const days=dailyWeight(entries);if(days.length<2)return null;
 const newest=days[days.length-1],now=dayNumber(newest.date);
 const prior=days.filter(e=>{const gap=now-dayNumber(e.date);return gap>=7&&gap<=13});
 return prior.length?newest.kg-prior[prior.length-1].kg:null;
}
export function distancePace(min:number,km?:number):string {if(!km||km<=0)return '–';const total=Math.round(min/km*60);return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')} min/km`;}
