import {weightQuality} from '../utils/yearReview';
import {DateField} from '../components/DateField';
import React,{useMemo,useState} from 'react';
import {View,Text,Alert,ScrollView} from 'react-native';
import {useAthlete} from '../data/context';
import {dateKey,dayNumber,numberInput,projectedWeeks,rateKgPerWeek,rollingWeight,sortedWeight,validWeight,validateDate} from '../utils/metrics';
import {BodyScan,WeightEntry} from '../data/schema';
import {Title,Card,Metric,Button,Field,Section,Chip,Empty,color,Muted,Label,usePalette,surfaceTint} from '../components/Design';
import {Overlay} from '../components/Overlay';
import {TrendChart} from '../components/TrendChart';
const uid=()=>`${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
export function WeightScreen(){const color=usePalette();
 const {data,update}=useAthlete();const [open,setOpen]=useState(false);const [editGoal,setEditGoal]=useState(false);const [kg,setKg]=useState('');const [day,setDay]=useState(dateKey());const [note,setNote]=useState('');const [target,setTarget]=useState(data.profile.targetKg==null?'':String(data.profile.targetKg));const [range,setRange]=useState(90);const [span,setSpan]=useState(7);const [editId,setEditId]=useState<string|null>(null);const [limit,setLimit]=useState(25);const [details,setDetails]=useState(false);
 const all=useMemo(()=>sortedWeight(data.weights),[data.weights]);const latest=all.length?all[all.length-1]:null;
 const shown=range===0?all:all.filter(e=>all.length&&dayNumber(all[all.length-1].date)-dayNumber(e.date)<range);
 const shownDates=new Set(shown.map(e=>e.date));const moving=rollingWeight(all,span).filter(p=>shownDates.has(p.date));
 const quality=weightQuality(data);const rate=rateKgPerWeek(all),weeks=projectedWeeks(all,data.profile.targetKg);
 const delta=shown.length>1?shown[shown.length-1].kg-shown[0].kg:null;
 const add=()=>{const n=numberInput(kg);if(!validWeight(n)||!validateDate(day)||day>dateKey())return Alert.alert('Eingabe prüfen','Gewicht 20–350 kg, gültiges Datum und kein Zukunftsdatum erforderlich.');
  const entry:WeightEntry={id:editId||uid(),date:day,kg:n,note:note.trim()};update(s=>({...s,weights:[...s.weights.filter(x=>x.id!==entry.id),entry]}));setOpen(false);setEditId(null);setKg('');setNote('');setDay(dateKey());};
 const saveTarget=()=>{const n=numberInput(target);if(target.trim()&&!validWeight(n))return Alert.alert('Ungültiges Ziel','Bitte ein realistisches Gewicht eingeben oder leer lassen.');update(s=>({...s,profile:{...s.profile,targetKg:n}}));setEditGoal(false)};
 const del=(item:WeightEntry)=>Alert.alert('Eintrag löschen?',`${item.date} · ${item.kg} kg`,[{text:'Abbrechen',style:'cancel'},{text:'Löschen',style:'destructive',onPress:()=>update(s=>({...s,weights:s.weights.filter(x=>x.id!==item.id)}))}]);
 return <View><Title sub="Dein Verlauf. Deine Entscheidungen.">Gewicht</Title>{data.settings.eggs&&data.settings.tone!=='off'&&quality&&<Muted>Datengrundlage: mindestens drei Messtage in jedem der letzten drei 7-Tage-Fenster.</Muted>}
 <View style={{flexDirection:'row',gap:10}}><Metric label="Aktueller Wert" value={latest?latest.kg.toFixed(1):'–'} unit="kg"/><Metric label="Im Zeitraum" value={delta===null?'–':(delta>0?'+':'')+delta.toFixed(1)} unit="kg"/></View>
 <Section title="Verlauf" action={<Button small title="+ Eintragen" onPress={()=>{setEditId(null);setKg('');setNote('');setDay(dateKey());setOpen(true)}}/>}/>
 <Card><View style={{flexDirection:'row',flexWrap:'wrap',marginBottom:12}}>{[[7,'7T'],[30,'30T'],[90,'90T'],[180,'180T'],[365,'1J'],[0,'Alle']].map(([n,l])=><Chip key={n} text={String(l)} active={range===n} onPress={()=>setRange(Number(n))}/>)}</View>
 <TrendChart points={shown.map(e=>({date:e.date,value:e.kg}))} target={data.profile.targetKg}/>
 {moving.length>=2?<TrendChart points={moving.map(p=>({date:p.date,value:p.average}))} height={118} line="#8DB9AB"/>:null}
 <View style={{flexDirection:'row',flexWrap:'wrap'}}>{[7,14,28].map(n=><Chip key={n} text={`${n} Tage Ø`} active={span===n} onPress={()=>setSpan(n)}/>)}</View><Muted>Die zweite Kurve zeigt den gleitenden {span}-Tage-Mittelwert.</Muted></Card>
 <Button secondary title={details?"Details ausblenden":"Analyse und Messhistorie"} onPress={()=>setDetails(x=>!x)}/>{details&&<><Section title="Auswertung"/>
 <View style={{flexDirection:'row',gap:10}}><Metric label="Trend/Woche" value={rate===null?'–':`${rate>0?'+':''}${rate.toFixed(2)}`} unit="kg"/><Metric label="Prognose" value={weeks===null?'–':weeks===0?'Erreicht':`${Math.round(weeks)}`} unit={weeks===0?'':'Wochen'}/></View>
 <Card style={{marginTop:10}}><Label>Zielgewicht</Label><Text style={{fontSize:24,fontWeight:'800',color:color.ink}}>{data.profile.targetKg==null?'Noch kein Ziel':data.profile.targetKg.toFixed(1)+' kg'}</Text><View style={{marginTop:12}}><Button title="Ziel bearbeiten" secondary small onPress={()=>{setTarget(data.profile.targetKg==null?'':String(data.profile.targetKg));setEditGoal(true)}}/></View><Muted>Prognosen werden erst ab mindestens drei Werten über mindestens 14 Tage angezeigt. Sie sind keine Garantie.</Muted></Card>
 <Section title="Messhistorie"/>
 {all.length? [...all].reverse().slice(0,limit).map(x=><Card key={x.id} style={{marginBottom:9}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View><Text style={{fontSize:17,fontWeight:'800',color:color.ink}}>{x.kg.toFixed(1)} kg</Text><Muted>{x.date} {x.note?'· '+x.note:''}</Muted></View><View style={{gap:6}}><Button title="Bearbeiten" secondary small onPress={()=>{setEditId(x.id);setKg(String(x.kg));setDay(x.date);setNote(x.note||'');setOpen(true)}}/><Button title="Löschen" secondary small onPress={()=>del(x)}/></View></View></Card>):<Card><Empty title="Noch keine Messungen" text="Du startest mit einer leeren Datenbank. Trage deinen ersten Wert ein."/></Card>}
 {all.length>limit&&<Button secondary title="Weitere Messungen" onPress={()=>setLimit(n=>n+25)}/>}</>}<Overlay title="Gewicht erfassen" visible={open} onClose={()=>setOpen(false)}><Field label="Gewicht (kg)" value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder="z. B. 92,4"/><DateField label="Datum (JJJJ-MM-TT)" value={day} onChangeText={setDay}/><Field label="Notiz (optional)" value={note} onChangeText={setNote} placeholder="Wie ging es dir?"/><Button title="Messung speichern" onPress={add}/></Overlay>
 <Overlay title="Gewichtsziel" visible={editGoal} onClose={()=>setEditGoal(false)}><Field label="Ziel in kg (leer = kein Ziel)" value={target} onChangeText={setTarget} keyboardType="decimal-pad"/><Button title="Ziel speichern" onPress={saveTarget}/></Overlay>
 </View>
}
