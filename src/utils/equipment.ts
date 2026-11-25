import type {EquipmentSetup} from '../features/workout/secondPassTypes';
import {numberInput} from './metrics';
export function parseEquipment(raw:Record<string,string>):EquipmentSetup {
 const out:EquipmentSetup={};for(const key of ['studio','machine','seat','pin','grip','rack','note'] as const)if(raw[key]?.trim())out[key]=raw[key].trim().slice(0,key==='note'?1000:150);
 for(const key of ['barKg','stackOffsetKg'] as const)if(raw[key]?.trim()){const n=numberInput(raw[key]);if(n===null||n<(key==='barKg'?0:-1000)||n>(key==='barKg'?100:1000))throw Error('Stangen- oder Gerätegewicht prüfen.');out[key]=n;}
 if(raw.plates?.trim())out.plates=raw.plates.split(/[;\n]+/).filter(v=>v.trim()).map(part=>{const m=part.trim().match(/^(\d+(?:[.,]\d+)?)\s*(?:kg)?\s*[x×]\s*(\d+)$/i);if(!m)throw Error('Scheiben als „20 × 4; 10 × 2; 2,5 × 4“ eingeben. Anzahl insgesamt, für beide Seiten.');const kg=Number(m[1].replace(',','.')),count=Number(m[2]);if(kg<=0||kg>100||count<0||count>100)throw Error('Scheibengewicht und Anzahl prüfen.');return {kg,count};});
 return out;
}
export function availablePlatePlan(total:number,equipment:EquipmentSetup){if(equipment.barKg===undefined||!Number.isFinite(total)||total<equipment.barKg||total>1000)return null;let remaining=(total-equipment.barKg)/2;const plates:number[]=[];for(const item of [...(equipment.plates??[])].sort((a,b)=>b.kg-a.kg)){let pairs=Math.floor(item.count/2);while(pairs>0&&remaining+1e-8>=item.kg){plates.push(item.kg);remaining-=item.kg;pairs--;}}return {plates,remainderKg:Math.round(Math.max(0,remaining)*2*1000)/1000,barKg:equipment.barKg};}
