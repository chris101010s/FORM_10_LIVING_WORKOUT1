import {DateField} from '../components/DateField';
import React,{useMemo,useState} from 'react';
import {View,Text,Alert} from 'react-native';
import {useAthlete} from '../data/context';
import {dateKey,dayNumber,numberInput,rollingWeight,sortedWeight,validWeight,validateDate} from '../utils/metrics';
import type {WeightEntry} from '../data/schema';
import {Button,Field,Section,Chip,Muted,Label,usePalette} from '../components/Design';
import {Overlay} from '../components/Overlay';
import {TrendChart} from '../components/TrendChart';
import {NotebookHeader,InkRule} from '../components/Sketchbook';
const uid=()=>`${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
export function WeightScreen(){
 const color=usePalette(),{data,update,saving,fault}=useAthlete();
 const [open,setOpen]=useState(false),[editGoal,setEditGoal]=useState(false),[kg,setKg]=useState(''),[day,setDay]=useState(dateKey()),[note,setNote]=useState(''),[target,setTarget]=useState(data.profile.targetKg==null?'':String(data.profile.targetKg)),[range,setRange]=useState(90),[span,setSpan]=useState(7),[mode,setMode]=useState<'raw'|'average'>('raw'),[editId,setEditId]=useState<string|null>(null),[page,setPage]=useState(0),[history,setHistory]=useState(false);
 const all=useMemo(()=>sortedWeight(data.weights),[data.weights]),latest=all[all.length-1],end=dayNumber(dateKey());
 const shown=useMemo(()=>all.filter(e=>dayNumber(e.date)<=end&&(range===0||end-dayNumber(e.date)<range)),[all,range,end]);
 const moving=useMemo(()=>{const selected=new Set(shown.map(e=>e.date));return rollingWeight(all,span).filter(p=>selected.has(p.date))},[all,span,shown]);
 const points=useMemo(()=>mode==='raw'?shown.map(e=>({date:e.date,value:e.kg})):moving.map(e=>({date:e.date,value:e.average})),[mode,shown,moving]);
 const reversed=useMemo(()=>[...all].reverse(),[all]),delta=shown.length>1?shown[shown.length-1].kg-shown[0].kg:null;
 const edit=(entry?:WeightEntry)=>{setEditId(entry?.id??null);setKg(entry?String(entry.kg):'');setDay(entry?.date??dateKey());setNote(entry?.note??'');setOpen(true)};
 const save=async()=>{const value=numberInput(kg);if(!validWeight(value)||!validateDate(day)||day>dateKey())return Alert.alert('Eingabe prüfen','Gewicht zwischen 20 und 350 kg und ein gültiges Datum bis heute eingeben.');const entry:WeightEntry={id:editId??uid(),date:day,kg:value,note:note.trim()};const ok=await update(d=>({...d,weights:[...d.weights.filter(e=>e.id!==entry.id),entry]}));if(ok){setOpen(false);setEditId(null);setKg('');setNote('');setPage(0)}};
 const saveTarget=async()=>{const value=numberInput(target);if(target.trim()&&!validWeight(value))return Alert.alert('Zielwert prüfen','Ein Gewicht zwischen 20 und 350 kg eingeben oder das Feld leer lassen.');if(await update(d=>({...d,profile:{...d.profile,targetKg:value}})))setEditGoal(false)};
 const remove=(entry:WeightEntry)=>Alert.alert('Messung löschen?',`${entry.date} · ${entry.kg} kg`,[{text:'Abbrechen',style:'cancel'},{text:'Löschen',style:'destructive',onPress:()=>void update(d=>({...d,weights:d.weights.filter(e=>e.id!==entry.id)}))}]);
 return <View style={{gap:14}}>
 <NotebookHeader eyebrow="DEIN KÖRPERVERLAUF" title="Eine Messung. Ein Moment." subtitle="Werte beschreiben deinen Verlauf, nicht deinen Wert." doodle="plate"/>
 <Label>LETZTE DOKUMENTIERTE MESSUNG</Label><Text style={{fontSize:43,color:color.ink,fontWeight:'700',fontVariant:['tabular-nums']}}>{latest?latest.kg.toFixed(1):'—'} <Text style={{fontSize:18}}>kg</Text></Text><Muted>{latest?`${latest.date}${latest.note?' · '+latest.note:''}`:'Noch kein Gewicht eingetragen.'}</Muted>
 <Button title="Gewicht eintragen" onPress={()=>edit()} disabled={saving||!!fault}/>
 <InkRule/><Label>ZEITRAUM BIS HEUTE</Label><View style={{flexDirection:'row',flexWrap:'wrap'}}>{[[7,'7 Tage'],[30,'30 Tage'],[90,'90 Tage'],[365,'1 Jahr'],[0,'Alle']].map(([n,label])=><Chip key={n} text={String(label)} active={range===n} onPress={()=>setRange(Number(n))}/>)}</View>
 <View style={{flexDirection:'row',flexWrap:'wrap'}}><Chip text="Einzelmessungen" active={mode==='raw'} onPress={()=>setMode('raw')}/><Chip text="Gleitender Mittelwert" active={mode==='average'} onPress={()=>setMode('average')}/></View>
 {mode==='average'&&<View style={{flexDirection:'row',flexWrap:'wrap'}}>{[7,14,28].map(n=><Chip key={n} text={`${n} Tage`} active={span===n} onPress={()=>setSpan(n)}/>)}</View>}
 <TrendChart points={points} target={data.profile.targetKg} unit="kg"/>
 <Muted>{mode==='average'?`Gleitender ${span}-Tage-Mittelwert aus tatsächlich gemessenen Tagen. Mehrere Messungen eines Tages werden zuerst gemittelt.`:'Einzelne Messungen mit ihren tatsächlichen Datumsabständen.'}{delta===null?'':` Veränderung zwischen erster und letzter Messung im Zeitraum: ${delta>0?'+':''}${delta.toFixed(1)} kg.`}</Muted>
 <View style={{borderTopWidth:1,borderColor:color.line,paddingTop:15,gap:8}}><Label>DEIN OPTIONALER ZIELWERT</Label><Text style={{color:color.ink,fontSize:21}}>{data.profile.targetKg==null?'Kein Zielwert gesetzt':`${data.profile.targetKg.toFixed(1)} kg`}</Text><Button secondary small title="Eigenen Zielwert bearbeiten" onPress={()=>{setTarget(data.profile.targetKg==null?'':String(data.profile.targetKg));setEditGoal(true)}}/><Muted>Du kannst diesen Wert jederzeit ändern oder entfernen. Es wird kein Erreichungsdatum vorhergesagt.</Muted></View>
 <Button secondary title={history?'Messhistorie schließen':'Messhistorie öffnen'} onPress={()=>setHistory(v=>!v)}/>
 {history&&<><Section title="Deine bisherigen Messungen"/>{reversed.slice(page*25,(page+1)*25).map(entry=><View key={entry.id} style={{borderBottomWidth:1,borderColor:color.line,paddingVertical:12,gap:8}}><Text style={{color:color.ink,fontSize:21,fontWeight:'700'}}>{entry.kg.toFixed(1)} kg</Text><Muted>{entry.date}{entry.note?' · '+entry.note:''}</Muted><View style={{flexDirection:'row',gap:8}}><Button secondary small title="Bearbeiten" onPress={()=>edit(entry)}/><Button secondary small danger title="Löschen" onPress={()=>remove(entry)}/></View></View>)}{!all.length&&<Muted>Noch keine Messungen vorhanden.</Muted>}{all.length>25&&<View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:8}}><Button secondary small title="‹ Vorherige" disabled={page===0} onPress={()=>setPage(n=>n-1)}/><Muted>Seite {page+1}/{Math.ceil(all.length/25)}</Muted><Button secondary small title="Nächste ›" disabled={(page+1)*25>=all.length} onPress={()=>setPage(n=>n+1)}/></View>}</>}
 <Overlay title="Gewicht erfassen" visible={open} onClose={()=>setOpen(false)}><Field label="Gewicht (kg)" value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder="Dein Messwert"/><DateField label="Datum" value={day} onChangeText={setDay}/><Field label="Notiz (optional)" value={note} onChangeText={setNote}/><Button title="Messung speichern" disabled={saving||!!fault} onPress={()=>void save()}/></Overlay>
 <Overlay title="Dein optionaler Zielwert" visible={editGoal} onClose={()=>setEditGoal(false)}><Field label="Ziel in kg · leer lassen zum Entfernen" value={target} onChangeText={setTarget} keyboardType="decimal-pad"/><Button title="Zielwert speichern" disabled={saving||!!fault} onPress={()=>void saveTarget()}/></Overlay>
 </View>;
}
