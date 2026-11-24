import catalogSnapshot from './exercises.generated.json';
import legacyStarter from './starter-legacy.json';
import localCurated from './curated-fallback.json';
import KV from 'expo-sqlite/kv-store';

export type CatalogExercise = {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  level: string;
  category: string;
  instructions: string[];
  images: string[];
};
export const CATALOG_URL='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
export const IMAGE_ROOT='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const CACHE_KEY='athlete-os-catalog-free-exercise-db-v1';
const aliases:Record<string,string[]>={
 'bench press':['bankdrücken','brustpresse','langhantelbankdrücken'], 'incline':['schrägbank','schrägbankdrücken'],
 'decline':['negativbank'], 'push-up':['liegestütze'], 'pull-up':['klimmzug','klimmzüge'],
 'chin-up':['klimmzug untergriff','chinup'], 'deadlift':['kreuzheben'],
 'squat':['kniebeugen','kniebeuge'], 'leg press':['beinpresse'],
 'leg extension':['beinstrecker','beinstrecken'], 'leg curl':['beinbeuger','beincurls'],
 'calf raise':['wadenheben'], 'seated row':['rudern sitzend'],
 'row':['rudern'], 'lat pulldown':['latzug','latziehen'], 'shoulder press':['schulterdrücken'],
 'military press':['schulterdrücken'], 'bicep curl':['bizepscurls','bizeps curls'],
 'triceps pushdown':['trizepsdrücken'], 'triceps extension':['trizepsstrecken'],
 'plank':['unterarmstütz'], 'lunge':['ausfallschritt'],
 'romanian':['rumänisch','rdl','rumänisches kreuzheben'], 'lateral raise':['seitheben'],
 'front raise':['frontheben'], 'glute bridge':['glute bridge','hüftheben'],
 'hip thrust':['hüftstoß','hip thrust'], 'shrug':['schulterheben'],
 'face pull':['facepull','face pull'], 'crunch':['bauchpresse'],
 'dips':['dips'], 'cable':['kabelzug','kabel'],
 'dumbbell':['kurzhantel'], 'barbell':['langhantel'],
 'kettlebell':['kettlebell','kugelhantel'], 'machine':['maschine'],
};
export const MUSCLE_DE:Record<string,string>={
 abdominals:'Bauch',full_body:'Ganzkörper',abductors:'Abduktoren',adductors:'Adduktoren',biceps:'Bizeps',
 calves:'Waden',chest:'Brust',forearms:'Unterarme',glutes:'Gesäß',hamstrings:'Beinbeuger',
 lats:'Latissimus',lower_back:'Unterer Rücken','lower back':'Unterer Rücken',middle_back:'Mittlerer Rücken','middle back':'Mittlerer Rücken',neck:'Nacken',
 quadriceps:'Quadrizeps',shoulders:'Schultern',traps:'Trapez',triceps:'Trizeps'
};
export const EQUIPMENT_DE:Record<string,string>={
 'barbell':'Langhantel','dumbbell':'Kurzhantel','body only':'Körpergewicht','machine':'Maschine',
 'cable':'Kabelzug','kettlebells':'Kettlebell','bands':'Widerstandsband','exercise ball':'Gymnastikball',
 'medicine ball':'Medizinball','foam roll':'Faszienrolle','e-z curl bar':'SZ-Stange',
 'other':'Sonstiges','none':'Ohne Gerät'
};
export function normalized(value:string):string{return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,' ').trim();}
const indexCache=new WeakMap<CatalogExercise,string>();
export function searchText(e:CatalogExercise):string{
 const cached=indexCache.get(e);if(cached)return cached;
 const name=normalized(e.name);const related=Object.entries(aliases)
  .filter(([en])=>name.includes(normalized(en)))
  .flatMap(([,de])=>de);
 const text=normalized([e.name,...related,...e.primaryMuscles.map(m=>MUSCLE_DE[m]||m),EQUIPMENT_DE[e.equipment]||e.equipment].join(' '));
 indexCache.set(e,text);return text;
}
function oneEdit(a:string,b:string){if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,errors=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++errors>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}return errors+(a.length-i)+(b.length-j)<=1;}
export function filterCatalog(items:CatalogExercise[],query:string,muscle:string,equipment:string,limit=24):CatalogExercise[]{
 const q=normalized(query),terms=q.split(' ').filter(Boolean),cap=Math.max(1,Math.min(5000,limit));const output:{e:CatalogExercise;score:number;index:number}[]=[];
 for(const [index,e] of items.entries()){
  if(muscle!=='Alle'&&!e.primaryMuscles.includes(muscle))continue;if(equipment!=='Alle'&&e.equipment!==equipment)continue;
  const text=searchText(e),name=normalized(e.name);let score=q===name?100:name.startsWith(q)?60:0,valid=true;
  for(const t of terms){if(name.includes(t))score+=20;else if(text.includes(t))score+=10;else if(t.length>=4&&text.split(' ').some(w=>oneEdit(w,t)))score+=1;else{valid=false;break;}}
  if(valid)output.push({e,score,index});
 }
 return output.sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,cap).map(x=>x.e);
}
export function normalizeOfficialCatalog(raw:unknown):CatalogExercise[]{
 if(!Array.isArray(raw))throw Error('Die Übungsdatenbank hat kein gültiges Format.');
 const ids=new Set<string>();const out:CatalogExercise[]=[];
 for(const entry of raw){
  if(!entry||typeof entry!=='object')continue;
  const e=entry as Record<string,unknown>;
  if(typeof e.id!=='string'||typeof e.name!=='string'||!e.id.trim()||!e.name.trim())continue;
  const id='fedb:'+e.id.trim();if(ids.has(id))continue;ids.add(id);
  const strings=(v:unknown,max=12):string[]=>Array.isArray(v)?v.filter((s):s is string=>typeof s==='string').map(x=>x.trim()).filter(Boolean).slice(0,max):[];
  out.push({id,name:e.name.trim().slice(0,130),primaryMuscles:strings(e.primaryMuscles),secondaryMuscles:strings(e.secondaryMuscles),equipment:typeof e.equipment==='string'?e.equipment:'none',level:typeof e.level==='string'?e.level:'unknown',category:typeof e.category==='string'?e.category:'strength',instructions:strings(e.instructions,15).map(x=>x.slice(0,850)),images:strings(e.images,3).filter(x=>!x.includes('..'))});
 }
 if(out.length<700)throw Error(`Nur ${out.length} Übungen erkannt. Kein unvollständiges Update gespeichert.`);
 return out.sort((a,b)=>a.name.localeCompare(b.name,'en'));
}
export const starterCatalog:CatalogExercise[]=([...catalogSnapshot,...legacyStarter,...localCurated].filter((e,i,all)=>all.findIndex(x=>x.id===e.id)===i) as CatalogExercise[]).sort((a,b)=>a.name.localeCompare(b.name,'en'));
function mergeCatalog(official:CatalogExercise[]):CatalogExercise[]{return [...official,...starterCatalog].filter((e,i,a)=>a.findIndex(x=>x.id===e.id)===i).sort((a,b)=>a.name.localeCompare(b.name,"en"));}
export async function loadCatalog():Promise<CatalogExercise[]>{
 try{const text=await KV.getItem(CACHE_KEY);if(text){const data=JSON.parse(text);if(Array.isArray(data)&&data.length>=700&&data[0]?.id)return mergeCatalog(data as CatalogExercise[]);}}
 catch(e){/* Fehlerhaftes Katalog-Cache darf die Nutzerdaten niemals blockieren */}
 return starterCatalog;
}
export async function syncCatalog():Promise<CatalogExercise[]>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
 try{const response=await fetch(CATALOG_URL,{signal:controller.signal});if(!response.ok)throw Error(`HTTP ${response.status}`);
  const official=normalizeOfficialCatalog(await response.json());await KV.setItem(CACHE_KEY,JSON.stringify(official));return mergeCatalog(official);
 }finally{clearTimeout(timer)}
}
export function catalogImageUrl(e:CatalogExercise):string|null {
 if(!e.images.length)return null;
 return IMAGE_ROOT+e.images[0].split('/').map(encodeURIComponent).join('/');
}
