import React,{createContext,useContext,useState} from 'react';
import {MotionCue,usePressMotion} from './MotionCue';
import {effectiveTheme,type FormTheme} from '../art/themes';
import {useFonts} from 'expo-font';
import {bundledFonts} from './fonts.generated';
import {Animated,View,Text,Pressable,TextInput,StyleSheet,ViewStyle,TextStyle,KeyboardTypeOptions,Platform,useColorScheme,type TextProps,type TextInputProps} from 'react-native';
import {GlassView,isGlassEffectAPIAvailable} from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
export const color={bg:'#FAF9F3',white:'#FFFEFB',ink:'#1D2025',muted:'#606369',line:'#D9D8D0',blue:'#2655D9',accent:'#C9D5F5',ice:'#E9EDF9',mint:'#CFE8D5',orange:'#F4D0C8',olive:'#365C42',error:'#A43B31',chart:'#2655D9'};
export type Palette=typeof color;
export const darkPalette:Palette={bg:'#17191D',white:'#22262C',ink:'#F3F5F7',muted:'#B1B9C4',line:'#383E46',blue:'#9BCCFF',accent:'#A9D7FF',ice:'#283C50',mint:'#30483A',orange:'#E99D81',olive:'#B4D5B8',error:'#FFB8AE',chart:'#8CC6FF'};
export const paperPalette:Palette={...color,bg:'#F5F3EE',white:'#FFFEFA',ink:'#20201D',muted:'#5E605A',line:'#D9D5CB',blue:'#454740',accent:'#D9D6CC',ice:'#ECE9E1',mint:'#E3E4DC',orange:'#CBC4B3',olive:'#50574B',chart:'#444842'};
export const retroPalette:Palette={...color,bg:'#F0F2E9',white:'#FBFCF7',ink:'#1F302C',muted:'#52635B',line:'#C1CABC',blue:'#2456C4',accent:'#B7D7C3',ice:'#E0E9DD',mint:'#CFE8D5',orange:'#EDD6CD',olive:'#365C42',chart:'#2456C4'};
const PaletteContext=createContext(color);
const HapticContext=createContext(false);
export function PaletteProvider({appearance,haptics,paper,theme,children}:{paper?:boolean;theme?:FormTheme;appearance?:'system'|'light'|'dark';haptics?:boolean;children:React.ReactNode}){const scheme=useColorScheme(),resolved=effectiveTheme({theme,appearance,paperMode:paper},scheme),palette=resolved==='dark'?darkPalette:resolved==='paper'?paperPalette:resolved==='retro'?retroPalette:color;return <PaletteContext.Provider value={palette}><HapticContext.Provider value={haptics===true}>{children}</HapticContext.Provider></PaletteContext.Provider>}
export const usePalette=()=>useContext(PaletteContext);
const lightSurfaces:Record<string,string>={'#FFE48A':'#5B4D22','#CFE8D5':'#30483A','#F4D0C8':'#513932','#E9EDF9':'#283C50','#EDF3FF':'#283C50','#FFFFFFF2':'#22262CF2','#EFF0EF':'#30353D','#E9EDF3':'#303B47','#EDF3FC':'#283C50','#E1E9F5':'#40536A','#E0E5EC':'#383E46','#E7ECF3':'#383E46','#DCEEFF':'#283C50','#FFF0B8':'#4D4022','#DDF4D9':'#30483A','#FFE3DA':'#513932','#FFE5DA':'#513932','#E8E4FA':'#3C3456','#E1F1DC':'#30483A','#FFF1C7':'#4D4022','#FBE7DF':'#513932','#EAF0F6':'#303B47','#FCE7E5':'#513932','#E6F4EA':'#30483A','#F4F6FA':'#30353D','#F4F6F8':'#30353D','#F6F8FC':'#30353D','#F6F5F0':'#30353D','#FFFFFF':'#22262C','white':'#22262C'};
export function surfaceTint(value:string,palette:Palette){return palette===darkPalette?(lightSurfaces[value]||value):value;}
const FontContext=createContext(false);
export function FormFonts({children}:{children:React.ReactNode}){const [loaded]=useFonts(bundledFonts);return <FontContext.Provider value={loaded}>{children}</FontContext.Provider>}
export function useFormFont(alias:'FormDisplay'|'FormText'|'FormMono'|'FormHand'){return useContext(FontContext)&&bundledFonts[alias]?alias:undefined;}
export function Title({children,sub}:{children:React.ReactNode,sub?:string}){const color=usePalette();const styles=makeStyles(color);const fontFamily=useFormFont('FormDisplay');return <View style={{marginBottom:22}}><Text style={[styles.title,fontFamily?{fontFamily}:{}]}>{children}</Text>{sub?<Text style={styles.sub}>{sub}</Text>:null}</View>}
export function Card({children,style}:{children:React.ReactNode;style?:ViewStyle}){const color=usePalette();const styles=makeStyles(color);return <View style={[styles.card,style]}>{children}</View>}
export function Label({children,style}:{children:React.ReactNode,style?:TextStyle}){const color=usePalette();const styles=makeStyles(color);return <Text style={[styles.label,style]}>{children}</Text>}
export function Muted({children,style,...props}:{children:React.ReactNode,style?:TextStyle}&Pick<TextProps,'accessibilityLiveRegion'|'accessibilityLabel'|'testID'>){const color=usePalette();const styles=makeStyles(color);const fontFamily=useFormFont('FormText');return <Text {...props} style={[styles.sub,fontFamily?{fontFamily}:null,style]}>{children}</Text>}
export function Metric({label,value,unit,style}:{label:string,value:string,unit?:string,style?:ViewStyle}){const color=usePalette();const styles=makeStyles(color);const fontFamily=useFormFont('FormMono');return <Card style={{flex:1,...style}}><Label>{label}</Label><Text style={[styles.metric,fontFamily?{fontFamily,fontWeight:'400'}:null]}>{value}<Text style={{fontSize:15,color:color.muted,fontWeight:'500'}}> {unit||''}</Text></Text></Card>}
export function Button({title,onPress,secondary=false,disabled=false,small=false,danger=false}:{title:string,onPress:()=>void,secondary?:boolean,disabled?:boolean,small?:boolean,danger?:boolean}){
 const color=usePalette(),styles=makeStyles(color),haptics=useContext(HapticContext),fontFamily=useFormFont('FormText'),press=usePressMotion(disabled);
 return <Animated.View style={[{minWidth:44,marginBottom:3},press.animatedStyle]}>
  <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPressIn={press.onPressIn} onPressOut={press.onPressOut}
   onPress={()=>{if(haptics)void Haptics.selectionAsync().catch(()=>{});onPress()}}
   style={({pressed})=>[styles.button,secondary&&styles.secondary,small&&{paddingVertical:11,paddingHorizontal:15,minHeight:44},danger&&{backgroundColor:surfaceTint('#FCE7E5',color),borderColor:color.error},pressed&&{opacity:.88,shadowOffset:{width:0,height:1}},disabled&&{opacity:.4,shadowOpacity:0}]}>
   <Text style={[styles.buttonText,fontFamily?{fontFamily}:null,secondary&&{color:color.ink},danger&&{color:color.error}]}>{title}</Text>
  </Pressable>
 </Animated.View>;
}
export function Field({label,value,onChangeText,placeholder,keyboardType,style,multiline=false,autoCapitalize,returnKeyType}:{label:string,value:string,onChangeText:(s:string)=>void,placeholder?:string,keyboardType?:KeyboardTypeOptions,style?:ViewStyle,multiline?:boolean;autoCapitalize?:TextInputProps['autoCapitalize'];returnKeyType?:TextInputProps['returnKeyType']}){const color=usePalette();const styles=makeStyles(color);const fontFamily=useFormFont('FormText'),[focused,setFocused]=useState(false);return <View style={[{marginBottom:13},style]}><Label>{label}</Label><View><TextInput accessibilityLabel={label} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={[styles.input,fontFamily?{fontFamily}:null,multiline&&{minHeight:80,textAlignVertical:'top'},focused&&{borderColor:color.blue}]} value={value} onChangeText={onChangeText} placeholder={placeholder||'Eingeben'} placeholderTextColor={color.muted} keyboardType={keyboardType} multiline={multiline} autoCorrect={false} autoCapitalize={autoCapitalize} returnKeyType={returnKeyType}/><View pointerEvents="none" style={{position:'absolute',bottom:0,left:1,right:1,height:5}}>{focused&&<MotionCue variant="fieldFocus" eventKey={label} mark color={color.blue}/>}</View></View></View>}
export function Section({title,action}:{title:string,action?:React.ReactNode}){const color=usePalette();return <View style={{flexDirection:'row',flexWrap:'wrap',gap:9,justifyContent:'space-between',alignItems:'center',marginTop:22,marginBottom:12}}><Text accessibilityRole="header" style={{flexShrink:1,fontSize:19,fontWeight:'700',color:color.ink,letterSpacing:-0.4}}>{title}</Text>{action}</View>}
export function Empty({title,text}:{title:string,text:string}){const color=usePalette();return <View style={{paddingVertical:24,alignItems:'center'}}><Text style={{fontSize:34,marginBottom:9}}>◌</Text><Text style={{fontSize:17,fontWeight:'700',color:color.ink}}>{title}</Text><Text style={{color:color.muted,textAlign:'center',lineHeight:21,marginTop:6}}>{text}</Text></View>}
export function Chip({text,active,onPress}:{text:string,active?:boolean,onPress:()=>void}){
 const color=usePalette(),press=usePressMotion(),haptics=useContext(HapticContext);
 return <Animated.View style={[{marginRight:8,marginBottom:8,maxWidth:'100%'},press.animatedStyle]}><Pressable accessibilityRole="button" accessibilityState={{selected:!!active}}
  onPressIn={press.onPressIn} onPressOut={press.onPressOut} onPress={()=>{if(haptics)void Haptics.selectionAsync().catch(()=>{});onPress()}}
  style={({pressed})=>({minHeight:44,minWidth:44,justifyContent:'center',paddingVertical:10,paddingHorizontal:14,borderRadius:12,backgroundColor:active?color.ink:color.white,borderWidth:1,borderBottomWidth:2,borderColor:active?color.ink:color.line,opacity:pressed?.8:1})}>
  <Text style={{color:active?color.white:color.ink,fontSize:12,fontWeight:'700',flexShrink:1}}>{text}</Text>
 </Pressable></Animated.View>;
}
export function GlassBar({children}:{children:React.ReactNode}){const color=usePalette();const styles=makeStyles(color);const glass=Platform.OS==='ios'&&isGlassEffectAPIAvailable();return glass?<GlassView glassEffectStyle="regular" isInteractive style={styles.glass}>{children}</GlassView>:<View style={[styles.glass,{backgroundColor:surfaceTint('#FFFFFFF2',color)}]}>{children}</View>}
const makeStyles=(color:Palette)=>StyleSheet.create({
 kicker:{fontSize:10,letterSpacing:2.3,color:color.blue,fontWeight:'800',marginBottom:7},
 title:{fontSize:36,letterSpacing:-1.2,fontWeight:'700',color:color.ink},
 sub:{fontSize:14,lineHeight:21,color:color.muted,marginTop:5},
 card:{backgroundColor:color.white,padding:18,borderRadius:4,borderWidth:1,borderColor:color.line,shadowOpacity:0,elevation:0},
 label:{fontSize:11,letterSpacing:0.7,color:color.muted,fontWeight:'700',marginBottom:7,textTransform:'none'},
 metric:{fontSize:32,fontVariant:['tabular-nums'],fontWeight:'800',color:color.ink,letterSpacing:-1},
 button:{backgroundColor:color.blue,paddingVertical:15,paddingHorizontal:18,minHeight:51,minWidth:44,justifyContent:'center',alignItems:'center',borderRadius:8,borderWidth:1,borderColor:color.blue,shadowColor:color===darkPalette?'#000000':color.ink,shadowOpacity:.18,shadowRadius:0,shadowOffset:{width:0,height:3}},
 buttonText:{fontSize:15,fontWeight:'700',color:color===darkPalette?'#17191D':'#FFFFFF',textAlign:'center'},
 secondary:{backgroundColor:color.white,borderColor:color.line,shadowOpacity:.11},
 input:{borderWidth:1,borderColor:color.line,borderBottomColor:color.ink,borderRadius:4,paddingHorizontal:12,paddingVertical:12,minHeight:48,color:color.ink,fontSize:17,backgroundColor:color.bg},
 glass:{minHeight:68,borderRadius:27,marginHorizontal:15,marginBottom:6,paddingHorizontal:8,paddingVertical:7,flexDirection:'row',justifyContent:'space-around',alignItems:'center',overflow:'hidden',borderWidth:0.5,borderColor:surfaceTint('#E0E5EC',color)},
});
