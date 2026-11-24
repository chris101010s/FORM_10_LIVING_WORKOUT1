import {Nutrition} from '../data/schema';
import {numberInput,validateDate} from './metrics';
// RFC-4180-style parser: quoted separators, escaped quotes and newlines supported.
export function readDelimited(text:string,sep:string):string[][]{
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 const input=text.replace(/^\uFEFF/,'');
 for(let i=0;i<input.length;i++){
  const ch=input[i];
  if(ch==='"'){if(quoted&&input[i+1]==='"'){cell+='"';i++}else quoted=!quoted;continue}
  if(ch===sep&&!quoted){row.push(cell.trim());cell='';continue}
  if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&input[i+1]==='\n')i++;row.push(cell.trim());cell='';if(row.some(x=>x.length))rows.push(row);row=[];continue}
  cell+=ch;
 }
 if(quoted)throw Error('CSV enthält ein nicht geschlossenes Anführungszeichen.');
 row.push(cell.trim());if(row.some(x=>x.length))rows.push(row);
 return rows;
}
export function parseNutritionCSV(text:string):Nutrition[]{
 const headerLine=text.replace(/^\uFEFF/,'').split(/\r?\n/,1)[0];
 const sep=(headerLine.match(/;/g)||[]).length>=(headerLine.match(/,/g)||[]).length?';':',';
 const rows=readDelimited(text,sep);if(rows.length<2)throw Error('CSV enthält keine Datensätze.');
 const headers=rows[0].map(h=>h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,''));
 const index=(names:string[])=>headers.findIndex(h=>names.some(n=>h===n||h.includes(n)));
 const d=index(['datum','date','day','tag']),kcal=index(['kalorien','calories','kcal','energie']),protein=index(['protein','eiweiss']),carbs=index(['kohlenhydrate','carbohydrate','carbs']),fat=index(['fett','fat']);
 if(d<0||[kcal,protein,carbs,fat].every(x=>x<0))throw Error('CSV benötigt Datum und Kalorien oder Makronährstoffe.');
 const out:Nutrition[]=[];
 for(const [i,cells] of rows.slice(1,2001).entries()){
  let date=(cells[d]||'').trim();
  if(/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(date)){const [dd,mm,yy]=date.split('.');date=`${yy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;}
  if(!validateDate(date))continue;
  const val=(n:number):number|undefined=>{
   if(n<0)return undefined;const raw=(cells[n]||'').replace(/\s|kcal|g/gi,'');
   if(!raw)return undefined;const normalized=/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(raw)?raw.replace(/\./g,''):raw;
   const v=numberInput(normalized);return v!=null&&v>=0&&v<=15000?v:undefined;
  };
  const fingerprint=cells.join('\u001f').split('').reduce((hash,ch)=>((hash*31)+ch.charCodeAt(0))>>>0,7).toString(16);
  const entry:Nutrition={id:`csv-${date}-${i}-${fingerprint}`,date,kcal:val(kcal),protein:val(protein),carbs:val(carbs),fat:val(fat),source:'CSV'};
  if([entry.kcal,entry.protein,entry.carbs,entry.fat].some(x=>x!==undefined))out.push(entry);
 }
 if(!out.length)throw Error('Keine lesbaren Zeilen erkannt. Prüfe Datums- und Zahlenschreibweise.');
 return out;
}
