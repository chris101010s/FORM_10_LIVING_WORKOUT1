// Optional build-time enrichment with a real Unlicense-licensed dataset.
// If the upstream server is unreachable, the shipped curated offline catalog is retained.
import fs from 'node:fs/promises';
const url='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const output=new URL('../src/catalog/exercises.generated.json',import.meta.url);
const fallback=new URL('../src/catalog/curated-fallback.json',import.meta.url);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function tryDownload(){
 for(let attempt=1;attempt<=3;attempt++){
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),30000);
  try{
   const response=await fetch(url,{signal:controller.signal});
   if(!response.ok)throw Error(`HTTP ${response.status}`);
   const data=await response.json();if(!Array.isArray(data))throw Error('Ungültiges Katalogformat');
   const ids=new Set(),normalized=[];
   const texts=(v,max=15)=>Array.isArray(v)?v.filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean).slice(0,max):[];
   for(const e of data){if(!e||typeof e.id!=='string'||typeof e.name!=='string'||!e.id.trim()||!e.name.trim())continue;
    const id=`fedb:${e.id}`;if(ids.has(id))continue;ids.add(id);
    normalized.push({id,name:e.name.slice(0,130),primaryMuscles:texts(e.primaryMuscles),secondaryMuscles:texts(e.secondaryMuscles),equipment:typeof e.equipment==='string'?e.equipment:'none',level:typeof e.level==='string'?e.level:'unknown',category:typeof e.category==='string'?e.category:'strength',instructions:texts(e.instructions).map(s=>s.slice(0,850)),images:texts(e.images,3).filter(s=>!s.includes('..'))});
   }
   if(normalized.length<700)throw Error(`Nur ${normalized.length} Übungen erkannt; Originalkatalog unvollständig`);
   normalized.sort((a,b)=>a.name.localeCompare(b.name,'en'));
   const temp=new URL('../src/catalog/exercises.download.tmp',import.meta.url);
   await fs.writeFile(temp,JSON.stringify(normalized));await fs.rename(temp,output);
   console.log(`OK: ${normalized.length} Übungen aus free-exercise-db für die IPA eingebettet.`);return;
  }catch(err){console.warn(`Katalogabruf ${attempt}/3 fehlgeschlagen: ${err.message}`);if(attempt<3)await wait(1000*attempt);}
  finally{clearTimeout(timeout)}
 }
 const local=JSON.parse(await fs.readFile(fallback,'utf8'));
 if(local.length<200)throw Error('Kein vollständiger Katalog und kein ausreichender lokaler Fallback verfügbar.');
 console.warn(`HINWEIS: Originalkatalog nicht erreichbar, Build verwendet ${local.length} kuratierte Fallback-Übungen. Ein späteres Update in der App ist möglich.`);
}
await tryDownload();
