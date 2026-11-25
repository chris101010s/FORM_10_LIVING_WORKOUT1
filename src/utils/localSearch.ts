import type {AthleteData} from '../data/schema';
import type {CatalogExercise} from '../catalog/catalog';
import {dateKey} from './metrics';

export type SearchSettingsArea='appearance'|'training'|'notifications'|'privacy'|'backup'|'health'|'search';
export type SearchTarget=
 | {type:'exercise';exerciseId:string}
 | {type:'program';programId:string}
 | {type:'routine';routineId:string}
 | {type:'workout';workoutId:string}
 | {type:'setting';area:SearchSettingsArea};
export type LocalSearchResult={id:string;kind:'exercise'|'plan'|'workout'|'setting';title:string;subtitle:string;target:SearchTarget};
export type SearchIndexEntry=LocalSearchResult&{text:string;favorite?:boolean;lastUsedAt?:string;muscles?:string[];equipment?:string};
export type SearchFilters={kind?:LocalSearchResult['kind']|'all';favoritesOnly?:boolean;recentOnly?:boolean;muscle?:string;equipment?:string};
export const normalizeSearch=(text:string)=>text.toLocaleLowerCase('de-AT').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const settings:{area:SearchSettingsArea;title:string;keywords:string}[]=[
 {area:'appearance',title:'Darstellung und Bewegung',keywords:'Theme Papier Retro dunkel hell Motion Animation Charakter Pip Sprüche'},
 {area:'training',title:'Trainingseinstellungen',keywords:'Gym Schriftgröße Händigkeit linkshänder rechtshänder Vorschläge KeepAwake Bildschirm Haptik'},
 {area:'notifications',title:'Lokale Mitteilungen',keywords:'Pause Ton Benachrichtigungen Erinnerung'},
 {area:'privacy',title:'Datenschutz und Diagnose',keywords:'Speicher Datenbank Version Integrität Geräteschutz FaceID TouchID'},
 {area:'backup',title:'Backup und Wiederherstellung',keywords:'Sicherung Export Import Medien Daten'},
 {area:'health',title:'Gesundheit und Verbindungen',keywords:'YAZIO Apple Health Ernährung Synchronisieren'},
 {area:'search',title:'Lokaler Suchverlauf',keywords:'Suche Verlauf löschen Privatsphäre'}
];

/** Indexes existing records only. A result contains navigation identity, never a start-workout action. */
export function buildLocalSearchIndex(data:AthleteData,catalog:CatalogExercise[],exerciseText?:(item:CatalogExercise)=>string):SearchIndexEntry[]{
 const entries:SearchIndexEntry[]=[],lastUsed=new Map<string,string>(),favorites=new Set(data.favoriteExerciseIds);
 for(const workout of data.workouts)for(const set of workout.sets)if(!lastUsed.has(set.exerciseId)||Date.parse(workout.finishedAt)>Date.parse(lastUsed.get(set.exerciseId)!))lastUsed.set(set.exerciseId,workout.finishedAt);
 const exercises=new Map(catalog.map(item=>[item.id,item]));
 for(const item of data.exercises)exercises.set(item.id,{id:item.id,name:item.name,primaryMuscles:item.primaryMuscles||[item.group],secondaryMuscles:item.secondaryMuscles||[],equipment:exercises.get(item.id)?.equipment||'Eigene',level:'',category:'',instructions:[],images:[]});
 for(const item of exercises.values())entries.push({id:`exercise:${item.id}`,kind:'exercise',title:item.name,subtitle:[item.primaryMuscles.join(', '),item.equipment].filter(Boolean).join(' · '),target:{type:'exercise',exerciseId:item.id},text:normalizeSearch([item.name,exerciseText?.(item)||'',...item.primaryMuscles,...item.secondaryMuscles,item.equipment].join(' ')),favorite:favorites.has(item.id),lastUsedAt:lastUsed.get(item.id),muscles:[...item.primaryMuscles,...item.secondaryMuscles],equipment:item.equipment});
 for(const program of data.programs||[])entries.push({id:`program:${program.id}`,kind:'plan',title:program.name,subtitle:`Plan · ${program.status==='active'?'aktiv':program.status==='archived'?'archiviert':'pausiert'}`,target:{type:'program',programId:program.id},text:normalizeSearch([program.name,program.description,...program.days.map(day=>data.routines.find(r=>r.id===day.routineId)?.name||'')].join(' '))});
 for(const routine of data.routines)entries.push({id:`routine:${routine.id}`,kind:'plan',title:routine.name,subtitle:`Trainingstag · ${routine.exerciseIds.length} Übungen`,target:{type:'routine',routineId:routine.id},text:normalizeSearch([routine.name,...routine.exerciseIds.map(id=>exercises.get(id)?.name||id)].join(' '))});
 for(const workout of data.workouts){const date=new Date(workout.finishedAt).toLocaleDateString('de-AT');entries.push({id:`workout:${workout.id}`,kind:'workout',title:workout.name,subtitle:`Abgeschlossen · ${date}`,target:{type:'workout',workoutId:workout.id},text:normalizeSearch([workout.name,date,dateKey(new Date(workout.finishedAt)),...new Set(workout.sets.map(set=>exercises.get(set.exerciseId)?.name||''))].join(' ')),lastUsedAt:workout.finishedAt});}
 for(const setting of settings)entries.push({id:`setting:${setting.area}`,kind:'setting',title:setting.title,subtitle:'Werkstatt',target:{type:'setting',area:setting.area},text:normalizeSearch(`${setting.title} ${setting.keywords}`)});
 return entries;
}
export function searchLocalIndex(index:SearchIndexEntry[],query:string,filters:SearchFilters={},limit=100):{results:LocalSearchResult[];total:number}{
 const normalized=normalizeSearch(query.slice(0,150)),terms=normalized.split(' ').filter(Boolean),scored:{entry:SearchIndexEntry;score:number}[]=[];
 for(const entry of index){
  if(filters.kind&&filters.kind!=='all'&&entry.kind!==filters.kind)continue;
  if((filters.favoritesOnly||filters.recentOnly||filters.muscle&&filters.muscle!=='Alle'||filters.equipment&&filters.equipment!=='Alle')&&entry.kind!=='exercise')continue;
  if(filters.favoritesOnly&&!entry.favorite||filters.recentOnly&&!entry.lastUsedAt||filters.muscle&&filters.muscle!=='Alle'&&!entry.muscles?.includes(filters.muscle)||filters.equipment&&filters.equipment!=='Alle'&&entry.equipment!==filters.equipment)continue;
  if(!terms.every(term=>entry.text.includes(term)))continue;
  const title=normalizeSearch(entry.title),score=normalized?(title===normalized?100:title.startsWith(normalized)?60:terms.filter(term=>title.includes(term)).length*15):0;
  scored.push({entry,score});
 }
 scored.sort((a,b)=>b.score-a.score||(filters.recentOnly||a.entry.kind==='workout'&&b.entry.kind==='workout'?(Date.parse(b.entry.lastUsedAt||'')||0)-(Date.parse(a.entry.lastUsedAt||'')||0):0)||a.entry.title.localeCompare(b.entry.title,'de-AT')||a.entry.id.localeCompare(b.entry.id));
 return {total:scored.length,results:scored.slice(0,Math.max(1,Math.min(5000,Math.floor(limit)))).map(({entry})=>({id:entry.id,kind:entry.kind,title:entry.title,subtitle:entry.subtitle,target:entry.target}))};
}
export function rememberLocalSearch(data:AthleteData,query:string,at:string):AthleteData {
 const value=query.trim().slice(0,150),key=normalizeSearch(value);
 if(!data.settings.searchHistory||!key)return data;
 if(!Number.isFinite(Date.parse(at)))throw Error('Ungültiger Suchzeitpunkt.');
 return {...data,recentSearches:[{query:value,lastUsedAt:at},...(data.recentSearches||[]).filter(item=>normalizeSearch(item.query)!==key)].slice(0,20)};
}
