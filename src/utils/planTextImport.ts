import type {PlanBundle} from './planImport';
import type {Routine,Exercise} from '../data/schema';
import type {PlannedSetTarget} from '../features/workout/secondPassTypes';
import {projectPositions,validateRoutineTargets} from './plannedTargets';
import {validateDate} from './metrics';
export type TextPlanLine={id:string;line:number;raw:string;name:string;weekday:number|null;optional:boolean;targets:Omit<PlannedSetTarget,'id'>[];issues:string[]};
export type TextPlanPreview={lines:TextPlanLine[];issues:string[]};
const dayMap:Record<string,number>={sonntag:0,sunday:0,montag:1,monday:1,dienstag:2,tuesday:2,mittwoch:3,wednesday:3,donnerstag:4,thursday:4,freitag:5,friday:5,samstag:6,saturday:6};
const decimal=(s:string)=>Number(s.replace(',','.'));
/** Deterministic local parser. Unrecognized content remains an explicit issue. */
export function parseTextPlan(raw:string):TextPlanPreview {
 if(raw.length>100000)throw Error('Textimport maximal 100.000 Zeichen.');let weekday:number|null=null,optional=false;const lines:TextPlanLine[]=[],issues:string[]=[];
 raw.split(/\r?\n/).forEach((original,index)=>{const line=original.trim().replace(/^[-*#]\s*/, '');if(!line)return;
  const heading=line.match(/^(Sonntag|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b(.*)$/i);if(heading&&!/\d+\s*[x×]/i.test(line)){weekday=dayMap[heading[1].toLowerCase()];optional=/optional|freiwillig/i.test(heading[2]);return;}
  const row:TextPlanLine={id:`line${index+1}`,line:index+1,raw:original,name:'',weekday,optional,targets:[],issues:[]};
  let rest:number|undefined;let input=line.replace(/(?:[,;]\s*|\bPause\s*)(\d+)\s*(?:s|sec|Sekunden)\s*$/i,(_,n)=>{rest=Number(n);return ''}).trim();
  const loadMatch=input.match(/\s*@\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)*)\s*kg\s*$/i),loads=loadMatch?loadMatch[1].split('/').map(s=>decimal(s.trim())):[];if(loadMatch)input=input.slice(0,loadMatch.index).trim();
  const match=input.match(/^(.*?)\s+(?:(\d+)\s*[x×]\s*(AMRAP|\d+(?:[.,]\d+)?)(?:\s*(s|sec|min|m|km|Wdh\.?))?|(\d+(?:\s*\/\s*\d+)+))\s*$/i);
  if(!match){row.name=line;row.issues.push('Zeile nicht eindeutig: „Übung 3x8, 90s“, „Übung 12/10/8 @40/42,5/45kg“ oder „Übung 3x30s“ verwenden.');lines.push(row);return;}
  row.name=match[1].trim();const count=match[5]?match[5].split('/').length:Number(match[2]),unit=(match[4]??'Wdh').toLowerCase(),value=match[3]?.toLowerCase(),reps=match[5]?.split('/').map(s=>Number(s.trim()));
  if(!row.name)row.issues.push('Übungsname fehlt.');if(count<1||count>100)row.issues.push('1–100 Sätze pro Zeile erlaubt.');if(loads.length>1&&loads.length!==count)row.issues.push('Anzahl der Lastwerte muss zur Satzanzahl passen.');if(rest!==undefined&&(rest<15||rest>600))row.issues.push('Pause 15–600 Sekunden.');
  for(let i=0;i<Math.min(100,Math.max(0,count));i++){const mode=value==='amrap'?'amrap':['s','sec','min'].includes(unit)?'time':['m','km'].includes(unit)?'distance':'reps',n=reps?.[i]??decimal(match[3]??'0');row.targets.push({kind:mode==='amrap'?'failure':'work',targetMode:mode,loadType:'weighted',loadBasis:'total',...(mode==='reps'?{repsMin:n,repsMax:n}:mode==='time'?{durationSeconds:n*(unit==='min'?60:1)}:mode==='distance'?{distanceMeters:n*(unit==='km'?1000:1)}:{}),...(loads.length?{weightKg:loads[loads.length===1?0:i]}:{}),...(rest!==undefined?{restSeconds:rest}:{})});}
  if(weekday===null)row.issues.push('Trainingstag muss in der Vorschau ausgewählt werden.');lines.push(row);
 });
 if(!lines.length)issues.push('Keine Übungszeilen gefunden.');return {lines,issues};
}
export function buildTextPlanBundle(raw:string,choices:Record<string,string>,exercises:Exercise[],catalogIds:string[],start:string,newId:()=>string):PlanBundle {
 if(!validateDate(start))throw Error('Gültiges Planstartdatum wählen.');const parsed=parseTextPlan(raw),ids=new Set([...catalogIds,...exercises.map(e=>e.id)]);if(parsed.issues.length)throw Error(parsed.issues.join(' '));
 const used=new Set<string>(),allocate=()=>{for(let i=0;i<64;i++){const id=newId();if(id&&id.length<=150&&!used.has(id)){used.add(id);return id}}throw Error('Keine eindeutige Import-ID verfügbar.');},routines:Routine[]=[],days:PlanBundle['program']['days']=[];
 const grouped=new Map<number,TextPlanLine[]>();for(const row of parsed.lines){if(row.issues.some(issue=>!issue.startsWith('Trainingstag muss')))throw Error(`Zeile ${row.line}: ${row.issues.join(' ')}`);const weekday=choices[row.id+'.day']===undefined?row.weekday:Number(choices[row.id+'.day']);if(weekday===null||!Number.isInteger(weekday)||weekday<0||weekday>6)throw Error(`Zeile ${row.line}: Trainingstag bestätigen.`);if(choices[row.id+'.confirmed']!=='yes'||!ids.has(choices[row.id+'.exerciseId']))throw Error(`Zeile ${row.line}: Übungs-ID, Satztyp und Einheit bewusst bestätigen.`);grouped.set(weekday,[...(grouped.get(weekday)??[]),row]);}
 for(const [day,rows] of grouped){const routineId=allocate(),positions=rows.map(row=>{const loadType=choices[row.id+'.loadType'];if(!['weighted','bodyweight','assisted'].includes(loadType))throw Error(`Zeile ${row.line}: Lastart wählen.`);const loadBasis=choices[row.id+'.loadBasis'];if(!['total','perHand','perSide'].includes(loadBasis))throw Error(`Zeile ${row.line}: Lastbasis wählen.`);return {id:allocate(),exerciseId:choices[row.id+'.exerciseId'],enabled:true,targets:row.targets.map(t=>({...t,id:allocate(),loadType:loadType as 'weighted'|'bodyweight'|'assisted',loadBasis:loadBasis as 'total'|'perHand'|'perSide'}))};});const routine=projectPositions({id:routineId,name:['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'][day],exerciseIds:[],restSeconds:90,block:'straight'},positions);validateRoutineTargets(routine);routines.push(routine);const kinds=new Set(rows.map(row=>choices[row.id+'.kind']??(row.optional?'optional':'training')));if(kinds.size>1)throw Error('Ein Tag darf nicht zugleich Pflicht- und optionaler Tag sein. In der Vorschau angleichen.');days.push({week:0,day,kind:[...kinds][0]==='optional'?'optional':'training',routineId});}
 const customIds=new Set(routines.flatMap(r=>r.exerciseIds));return {format:'FORM-Program',version:2,program:{id:allocate(),name:'Importierter Plan',description:'Lokal aus Text geprüft und übernommen.',start,weeks:1,status:'paused',color:'blue',days},routines,exercises:exercises.filter(e=>customIds.has(e.id))};
}
