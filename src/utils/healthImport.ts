import type {AthleteData,HealthMetric} from '../data/schema';
import {healthSpecs} from './health';
import {validateDate} from './metrics';
import type {HealthDailyMetric,HealthDaySample,HealthDaySnapshot,HealthDayValue,HealthImportedProvenance} from './healthDayTypes';
import type {HealthSource} from './nutritionTypes';
import {validateHealthSource} from './nutritionSync';
export type ImportMetric=HealthMetric|'weight'|'sleepHours';
const appleMetrics=['steps','walkKm','restingPulse','heartRate','activeKcal','weight','sleepHours'] as const;
export function healthPreview(raw:unknown):{metric:ImportMetric;value:number}[]{if(!raw||typeof raw!=='object')return [];const values=raw as Record<string,unknown>;return appleMetrics.flatMap(metric=>{const input=values[metric];if(typeof input!=='number'||!Number.isFinite(input))return [];const spec=metric==='weight'?{min:20,max:350,integer:false}:metric==='sleepHours'?{min:0,max:24,integer:false}:healthSpecs[metric];const value=spec.integer?Math.round(input):Math.round(input*100)/100;return input>=spec.min&&input<=spec.max&&value>=spec.min&&value<=spec.max?[{metric,value}]:[]});}
export function mergeHealthPreview(data:AthleteData,date:string,entries:{metric:ImportMetric;value:number}[]):AthleteData{if(!validateDate(date))throw Error('Ungültiges Datum.');const accepted=healthPreview(Object.fromEntries(entries.map(e=>[e.metric,e.value])));let next={...data,weights:[...data.weights],recovery:[...data.recovery],healthEntries:[...(data.healthEntries||[])]};for(const {metric,value} of accepted){const id=`apple-health:${date}:${metric}`;const note=metric==='sleepHours'?'Apple Health · Schlaf innerhalb des Kalendertags':metric==='walkKm'?'Apple Health · Geh- und Laufdistanz':'Apple Health';if(metric==='weight')next.weights=[...next.weights.filter(x=>x.id!==id),{id,date,kg:value,note}];else if(metric==='sleepHours')next.recovery=[...next.recovery.filter(x=>x.id!==id),{id,date,sleepHours:value,note}];else next.healthEntries=[...next.healthEntries.filter(x=>x.id!==id),{id,date,metric,value,note}];}return next;}

export const healthDailyMetrics:HealthDailyMetric[]=['steps','walkKm','restingPulse','heartRate','activeKcal','weight','sleepHours'];
const dailyUnits:Record<HealthDailyMetric,HealthDaySample['unit']>={steps:'count',walkKm:'km',restingPulse:'bpm',heartRate:'bpm',activeKcal:'kcal',weight:'kg',sleepHours:'h'};
const isRecord=(raw:unknown):raw is Record<string,unknown>=>!!raw&&typeof raw==='object'&&!Array.isArray(raw);
const stamp=(value:unknown)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(value)&&Number.isFinite(Date.parse(value));
/** Device identity keeps an iPhone and a Watch separate even if their app bundle matches. */
export function healthSourceKey(source:HealthSource):string{return JSON.stringify([source.bundleIdentifier,source.productType||'',source.deviceId||source.deviceName||'']);}
export function healthSourceLabel(source:HealthSource):string{return [source.name,source.deviceName||source.productType].filter(Boolean).join(' · ');}
export function validateHealthDaySnapshot(raw:unknown):HealthDaySnapshot {
  if(!isRecord(raw)||!stamp(raw.from)||!stamp(raw.to)||!stamp(raw.queriedAt)||typeof raw.timeZone!=='string'||!raw.timeZone||!Array.isArray(raw.samples)||raw.samples.length>175000||!Array.isArray(raw.unavailable)||raw.unavailable.some(x=>!healthDailyMetrics.includes(x)))throw Error('Apple Health: Tagesantwort ungültig.');
  const from=raw.from as string,to=raw.to as string,lo=Date.parse(from),hi=Date.parse(to);
  if(hi<=lo||hi-lo>26*3600000)throw Error('Apple Health: Ungültiger Kalendertag.');
  const byId=new Map<string,HealthDaySample>();
  for(const item of raw.samples){
    if(!isRecord(item)||typeof item.uuid!=='string'||!item.uuid||item.uuid.length>100||!healthDailyMetrics.includes(item.metric as HealthDailyMetric)||typeof item.value!=='number'||!Number.isFinite(item.value)||item.value<0||item.value>1e9||!stamp(item.startedAt)||!stamp(item.endedAt))throw Error('Apple Health: Tages-Sample ungültig.');
    const metric=item.metric as HealthDailyMetric,startedAt=item.startedAt as string,endedAt=item.endedAt as string,start=Date.parse(startedAt),end=Date.parse(endedAt);
    if(item.unit!==dailyUnits[metric]||end<start||raw.unavailable.includes(metric)||(metric==='sleepHours'?start>=hi||end<=lo:start<lo||start>=hi))throw Error('Apple Health: Sample passt nicht zum angefragten Tag oder Typ.');
    const sample:HealthDaySample={uuid:item.uuid,metric,value:item.value,unit:dailyUnits[metric],startedAt,endedAt,source:validateHealthSource(item.source)};
    const previous=byId.get(sample.uuid);if(previous&&JSON.stringify(previous)!==JSON.stringify(sample))throw Error('Apple Health: Widersprüchliche Tages-UUID.');byId.set(sample.uuid,sample);
  }
  return {from,to,timeZone:raw.timeZone,queriedAt:raw.queriedAt as string,samples:[...byId.values()],unavailable:[...new Set(raw.unavailable as HealthDailyMetric[])]};
}
export function healthDaySources(snapshot:HealthDaySnapshot,metric:HealthDailyMetric):{key:string;source:HealthSource;sampleCount:number}[]{
  const groups=new Map<string,{key:string;source:HealthSource;sampleCount:number}>();
  for(const sample of snapshot.samples.filter(s=>s.metric===metric)){const key=healthSourceKey(sample.source),value=groups.get(key);groups.set(key,{key,source:sample.source,sampleCount:(value?.sampleCount||0)+1});}
  return [...groups.values()].sort((a,b)=>healthSourceLabel(a.source).localeCompare(healthSourceLabel(b.source)));
}
export function healthDayValues(input:HealthDaySnapshot,selections:Partial<Record<HealthDailyMetric,string>>={}):HealthDayValue[]{
  const snapshot=validateHealthDaySnapshot(input),values:HealthDayValue[]=[];
  for(const metric of healthDailyMetrics){
    const sources=healthDaySources(snapshot,metric),key=selections[metric]||(sources.length===1?sources[0].key:undefined);
    if(!key)continue;
    const samples=snapshot.samples.filter(s=>s.metric===metric&&healthSourceKey(s.source)===key);if(!samples.length)continue;
    let value:number;
    if(metric==='weight')value=[...samples].sort((a,b)=>b.startedAt.localeCompare(a.startedAt)||a.uuid.localeCompare(b.uuid))[0].value;
    else if(metric==='heartRate'||metric==='restingPulse')value=samples.reduce((sum,s)=>sum+s.value,0)/samples.length;
    else if(metric==='sleepHours'){
      const intervals=samples.map(s=>[Math.max(Date.parse(s.startedAt),Date.parse(snapshot.from)),Math.min(Date.parse(s.endedAt),Date.parse(snapshot.to))] as [number,number]).sort((a,b)=>a[0]-b[0]),merged:[number,number][]=[];
      for(const interval of intervals){const last=merged[merged.length-1];if(last&&interval[0]<=last[1])last[1]=Math.max(last[1],interval[1]);else merged.push([...interval]);}
      value=merged.reduce((sum,[start,end])=>sum+end-start,0)/3600000;
    }else value=samples.reduce((sum,s)=>sum+s.value,0);
    const accepted=healthPreview({[metric]:value})[0];if(!accepted)continue;
    values.push({metric,value:accepted.value,origin:{queriedAt:snapshot.queriedAt,from:snapshot.from,to:snapshot.to,timeZone:snapshot.timeZone,sourceKey:key,source:samples[0].source,sampleUUIDs:samples.map(s=>s.uuid).sort()}});
  }
  return values;
}
export function validateHealthImportedProvenance(raw:unknown):HealthImportedProvenance {
  if(!isRecord(raw)||!stamp(raw.queriedAt)||!stamp(raw.from)||!stamp(raw.to)||Date.parse(raw.to as string)<=Date.parse(raw.from as string)||typeof raw.timeZone!=='string'||!raw.timeZone||raw.timeZone.length>100||typeof raw.sourceKey!=='string'||raw.sourceKey.length>1000||!Array.isArray(raw.sampleUUIDs)||!raw.sampleUUIDs.length||raw.sampleUUIDs.length>25000||raw.sampleUUIDs.some(id=>typeof id!=='string'||!id||id.length>100)||new Set(raw.sampleUUIDs).size!==raw.sampleUUIDs.length)throw Error('Apple Health: Importherkunft ungültig.');
  const source=validateHealthSource(raw.source);if(healthSourceKey(source)!==raw.sourceKey)throw Error('Apple Health: Quellidentität stimmt nicht.');
  return {...raw,queriedAt:raw.queriedAt as string,from:raw.from as string,to:raw.to as string,timeZone:raw.timeZone,sourceKey:raw.sourceKey,source,sampleUUIDs:raw.sampleUUIDs as string[]};
}
export function mergeHealthDayValues(data:AthleteData,date:string,values:HealthDayValue[]):AthleteData {
  if(!validateDate(date)||new Set(values.map(v=>v.metric)).size!==values.length)throw Error('Apple Health: Auswahl prüfen.');
  let next=data;
  for(const item of values){
    const origin=validateHealthImportedProvenance(item.origin),accepted=healthPreview({[item.metric]:item.value});if(accepted.length!==1)throw Error('Apple Health: Tageswert außerhalb der zulässigen Eingabe.');
    next=mergeHealthPreview(next,date,[item]);const id=`apple-health:${date}:${item.metric}`,note=`Apple Health · ${healthSourceLabel(origin.source)}`;
    if(item.metric==='weight')next={...next,weights:next.weights.map(e=>e.id===id?{...e,note,healthOrigin:origin}:e)};
    else if(item.metric==='sleepHours')next={...next,recovery:next.recovery.map(e=>e.id===id?{...e,note,healthOrigin:origin}:e)};
    else next={...next,healthEntries:(next.healthEntries||[]).map(e=>e.id===id?{...e,note,healthOrigin:origin}:e)};
  }
  return next;
}
