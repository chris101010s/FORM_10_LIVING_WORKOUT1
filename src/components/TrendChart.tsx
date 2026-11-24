import React,{useState} from 'react';
import {View,Text,useWindowDimensions,Pressable} from 'react-native';
import Svg,{Path,Circle,Line,Text as SvgText,Rect} from 'react-native-svg';
import {color,usePalette,surfaceTint} from './Design';
import {dayNumber,validateDate} from '../utils/metrics';
type Point={date:string,value:number};
export function TrendChart({points,height=190,target,unit='kg',line:lineOverride}:{points:Point[],height?:number,target?:number|null,unit?:string,line?:string}){const color=usePalette();const line=lineOverride||color.chart;
 const {width}=useWindowDimensions();const [point,setPoint]=useState<number|null>(null);const [compare,setCompare]=useState<number|null>(null);const w=Math.max(180,Math.min(width-80,560));const h=height;const margin={left:28,right:16,top:22,bottom:25};
 const clean=[...points].filter(p=>Number.isFinite(p.value)&&validateDate(p.date)).sort((a,b)=>a.date.localeCompare(b.date));
 if(!clean.length)return <View style={{height,alignItems:'center',justifyContent:'center'}}><Text style={{color:color.muted}}>Noch keine Messungen vorhanden.</Text></View>;
 const values=clean.map(p=>p.value);if(target!=null&&Number.isFinite(target))values.push(target);
 const mn=Math.min(...values),mx=Math.max(...values);const pad=Math.max(1,(mx-mn)*0.23);const lo=mn-pad,hi=mx+pad;
 const time=clean.map(p=>dayNumber(p.date));const xMin=time[0],xMax=time[time.length-1];
 const x=(d:number)=>margin.left+(xMax===xMin?.5:(d-xMin)/(xMax-xMin))*(w-margin.left-margin.right);
 const y=(v:number)=>margin.top+(hi-v)/(hi-lo)*(h-margin.top-margin.bottom);
 const path=clean.map((p,i)=>(i?'L':'M')+x(time[i]).toFixed(1)+','+y(p.value).toFixed(1)).join(' ');
 const baseline=h-margin.bottom;
 const chosen=point===null?null:clean[Math.min(point,clean.length-1)],base=compare===null?null:clean[Math.min(compare,clean.length-1)];
 return <View><Svg accessibilityLabel={`Diagramm, ${clean.length} Messpunkte, letzter Wert ${clean[clean.length-1].value} ${unit}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
   {[0,1,2,3].map(i=><React.Fragment key={i}><Line x1={margin.left} y1={margin.top+(baseline-margin.top)*i/3} x2={w-margin.right} y2={margin.top+(baseline-margin.top)*i/3} stroke={color.line} strokeDasharray="3 5"/><SvgText x={margin.left-4} y={margin.top+(baseline-margin.top)*i/3-4} fill={color.muted} fontSize={9} textAnchor="end">{(hi-(hi-lo)*i/3).toFixed(0)}</SvgText></React.Fragment>)}
   {target!=null&&Number.isFinite(target)?<><Line x1={margin.left} x2={w-margin.right} y1={y(target)} y2={y(target)} stroke="#9BA7B3" strokeDasharray="6 5"/><SvgText x={w-margin.right-3} y={y(target)-5} fontSize={9} textAnchor="end" fill={color.muted}>Ziel</SvgText></>:null}
   <Path d={path} fill="none" stroke={line} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
   {clean.filter((_,i)=>clean.length<=150||i%Math.ceil(clean.length/150)===0||i===clean.length-1).map((p,i)=><Circle key={p.date+'_'+i} cx={x(dayNumber(p.date))} cy={y(p.value)} r={i===clean.length-1?5:3} stroke="white" strokeWidth={2} fill={line}/>)}
   {chosen&&<><Line x1={x(dayNumber(chosen.date))} x2={x(dayNumber(chosen.date))} y1={margin.top} y2={baseline} stroke={color.ink} strokeDasharray="3 3"/><Circle cx={x(dayNumber(chosen.date))} cy={y(chosen.value)} r={6} fill={color.ink}/></>}
   <SvgText x={margin.left} y={h-6} fontSize={10} fill={color.muted}>{clean[0].date.slice(5)}</SvgText>
   <SvgText x={w-margin.right} y={h-6} textAnchor="end" fontSize={10} fill={color.muted}>{clean[clean.length-1].date.slice(5)}</SvgText>
 </Svg>{clean.length>0&&<View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'}}><Pressable accessibilityRole="button" accessibilityLabel="Vorheriger Messpunkt" style={{padding:10,minHeight:44}} onPress={()=>setPoint(i=>Math.max(0,(i??clean.length-1)-1))}><Text style={{color:color.blue}}>‹</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>{if(point===null)setPoint(clean.length-1);else setCompare(compare===null?point:null)}} onLongPress={()=>{setCompare(point??clean.length-1);setPoint(point??clean.length-1)}}><Text style={{color:color.ink,fontSize:12}}>{chosen?`${chosen.date} · ${chosen.value.toFixed(1)} ${unit}`:'Messpunkte ansehen'}</Text><Text style={{fontSize:11,color:color.muted}}>{base&&chosen?`Δ ${(chosen.value-base.value).toFixed(1)} ${unit} · Vergleich beenden`:'Tippen zum Vergleichen'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Nächster Messpunkt" style={{padding:10,minHeight:44}} onPress={()=>setPoint(i=>Math.min(clean.length-1,(i??-1)+1))}><Text style={{color:color.blue}}>›</Text></Pressable></View>}<Text style={{color:color.muted,fontSize:10,textAlign:'right',marginTop:-4}}>Messwerte in {unit} · zeitlich korrekte Abstände</Text></View>
}
