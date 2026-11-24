import React,{useState} from 'react';
import {View,ScrollView,Text,Pressable} from 'react-native';
import type {SetDraft} from '../data/schema';
import {setKinds} from '../utils/trainingEngine';
import {Field,Chip,Button,Label,Muted,color,usePalette,surfaceTint} from './Design';
export function SetEditor({draft,onChange,step=2.5}:{draft:SetDraft;onChange:(d:SetDraft)=>void;step?:number}){const color=usePalette();
 const [advanced,setAdvanced]=useState(false);const kind=draft.kind||'work',timed=kind==='timed',distance=kind==='distance',body=kind==='bodyweight';
 const edit=(key:keyof SetDraft,v:string)=>onChange({...draft,[key]:v.slice(0,key==='note'?280:key==='tempo'?60:24)});
 const increment=(key:'weight'|'reps',delta:number)=>{const n=Number(draft[key].replace(',','.'));edit(key,String(Math.round(Math.max(key==='reps'?1:0,Math.min(key==='reps'?150:1000,(Number.isFinite(n)?n:0)+delta))*1000)/1000))};
 return <View>
 <Label>SATZTYP</Label><ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">{setKinds.map(k=><Chip key={k.id} text={k.label} active={kind===k.id} onPress={()=>onChange({...draft,kind:k.id})}/>)}</ScrollView>
 {timed||distance?<>{distance&&<Field label="Distanz (m)" value={draft.distance||''} onChangeText={v=>edit('distance',v)} keyboardType="decimal-pad"/>}<Field label={`Dauer (Sekunden)${distance?' · optional':''}`} value={draft.duration||''} onChangeText={v=>edit('duration',v)} keyboardType="decimal-pad"/></>:<>
 <View style={{flexDirection:'row',gap:8}}>{!body&&<Field label={kind==='assisted'?'Assistenz (kg)':'Gewicht (kg)'} style={{flex:1}} value={draft.weight} onChangeText={v=>edit('weight',v)} keyboardType="decimal-pad" placeholder="—"/>}<Field label="Wiederholungen" style={{flex:1}} value={draft.reps} onChangeText={v=>edit('reps',v)} keyboardType="number-pad" placeholder="—"/></View>
 <View style={{flexDirection:'row',gap:6,flexWrap:'wrap',marginBottom:12}}>{!body&&[-step,step].map(n=><Button key={n} small secondary title={`${n>0?'+':''}${n} kg`} onPress={()=>increment('weight',n)}/>)}<Button small secondary title="−1 Wdh." onPress={()=>increment('reps',-1)}/><Button small secondary title="+1 Wdh." onPress={()=>increment('reps',1)}/></View>
 <Field label="RIR · optional (0–5)" value={draft.rir} onChangeText={v=>edit('rir',v)} keyboardType="number-pad" placeholder="—"/></>}
 <Pressable accessibilityRole="button" accessibilityState={{expanded:advanced}} onPress={()=>setAdvanced(x=>!x)} style={{minHeight:44,justifyContent:'center'}}><Text style={{fontWeight:'700',color:color.blue}}>{advanced?'−':'+'} Details · RPE, Seite, Tempo, Notiz</Text></Pressable>
 {advanced&&<><Field label="RPE · optional (1–10)" value={draft.rpe||''} onChangeText={v=>edit('rpe',v)} keyboardType="decimal-pad"/><Label>SEITE</Label><View style={{flexDirection:'row',flexWrap:'wrap'}}>{(['both','left','right'] as const).map((v,i)=><Chip key={v} text={['Beide','Links','Rechts'][i]} active={(draft.side||'both')===v} onPress={()=>onChange({...draft,side:v})}/>)}</View><Field label="Tempo (optional)" value={draft.tempo||''} onChangeText={v=>edit('tempo',v)}/><Field label="Satznotiz" value={draft.note||''} onChangeText={v=>edit('note',v)} multiline/></>}
 {kind==='assisted'&&<Muted>Assistenzgewicht wird nicht als gehobenes Gewicht oder Kraftrekord gerechnet.</Muted>}
 </View>
}
