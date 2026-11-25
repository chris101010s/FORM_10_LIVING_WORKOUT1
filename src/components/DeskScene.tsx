import React from 'react';
import {Text,View,useWindowDimensions,type StyleProp,type ViewStyle} from 'react-native';
import Svg,{Circle,Ellipse,G,Path} from 'react-native-svg';
import {doodles,type DoodleName,type InkDrawing} from '../art/doodles';
import {deskScenePaths as paths,deskScenes,type DeskSceneTone,type DeskSceneVariant} from '../art/deskScenes';
import {useFormFont,usePalette,surfaceTint,type Palette} from './Design';
import {IdleFloat,SceneEntrance} from './MotionCue';

export type {DeskSceneVariant} from '../art/deskScenes';
export type DeskSceneProps={
  variant:DeskSceneVariant;
  /** Maximum width in dp. The scene always shrinks to the actual parent width. */
  size?:number;
  compact?:boolean;
  /** Explicit character opt-in; this never reads or changes personal settings. */
  character?:boolean;
  style?:StyleProp<ViewStyle>;
};

function tint(p:Palette,tone:DeskSceneTone){
  return tone==='mint'?p.mint:tone==='blue'?p.ice:surfaceTint(tone==='warm'?'#FFF1C7':'#F4D0C8',p);
}

/** Registry drawings stay recognizably FORM, with a quiet second ink pass. */
function Motif({name,p,wash,x=0,y=0,size=96,angle=0}:{name:DoodleName;p:Palette;wash:string;x?:number;y?:number;size?:number;angle?:number}){
  const drawing:InkDrawing=doodles[name];
  return <G transform={`translate(${x} ${y}) rotate(${angle} ${size/2} ${size/2}) scale(${size/96})`}>
    {drawing.wash&&<Path d={drawing.wash} fill={wash}/>}
    {drawing.paths.map((d,index)=><Path key={index} d={d} fill="none" stroke={p.ink} strokeWidth={index===0?2.5:index%2?1.8:2.1} strokeLinecap="round" strokeLinejoin="round"/>)}
    {drawing.detail?.map((d,index)=><Path key={`detail-${index}`} d={d} fill="none" stroke={p.blue} strokeWidth={1.7} strokeLinecap="round"/>)}
  </G>;
}

function OpenPages({p,welcome=false}:{p:Palette;welcome?:boolean}){
  return <G strokeLinecap="round" strokeLinejoin="round">
    <Path d="M89 59Q118 47 158 63Q195 46 224 58L222 126Q188 117 158 136Q124 119 89 130Z" fill={p.white} stroke={p.ink} strokeWidth={1.9}/>
    <Path d="M90 134Q125 125 158 140Q192 124 221 130M158 64 158 135" fill="none" stroke={p.ink} strokeWidth={1.6}/>
    <Path d="M99 72Q119 66 145 77M100 84Q121 79 145 89M101 97Q120 90 143 102M170 75Q191 66 214 70M171 87Q190 80 214 83M171 101Q190 94 211 97" fill="none" stroke={p.blue} strokeWidth={1.5} opacity={.75}/>
    <Path d={welcome?'M175 112Q191 101 207 111':'M105 111Q122 106 137 113'} fill="none" stroke={p.ink} strokeWidth={1.3}/>
    <Path d="M156 128 155 148 161 144 166 149 165 130" fill={tint(p,'peach')} stroke={p.ink} strokeWidth={1.1}/>
  </G>;
}

function CalendarPage({p}:{p:Palette}){
  return <G strokeLinecap="round" strokeLinejoin="round">
    <Path d="M101 52 218 53 216 128Q161 133 101 128Z" fill={p.white} stroke={p.ink} strokeWidth={1.9}/>
    <Path d="M101 53 218 54 218 74 101 73Z" fill={p.ice}/>
    <Path d="M101 73 218 74M120 47 120 59M140 47 140 59M180 47 180 59M201 47 201 59" fill="none" stroke={p.ink} strokeWidth={1.9}/>
    <Path d="M109 89 208 90M109 104 209 105M127 80 126 121M147 80 146 122M167 81 167 123M188 81 188 122" fill="none" stroke={p.line} strokeWidth={1.3}/>
    <Path d="M94 136Q158 142 225 135" fill="none" stroke={p.blue} strokeWidth={1.4}/>
    <Path d="M204 116 213 116 213 124 204 125Z" fill={p.mint} stroke={p.ink} strokeWidth={.8}/>
  </G>;
}

function WorkoutPage({p}:{p:Palette}){
  return <G strokeLinecap="round" strokeLinejoin="round">
    <Path d="M99 52Q165 47 218 53L214 128 99 132Z" fill={p.white} stroke={p.ink} strokeWidth={1.6}/>
    <Path d="M109 61 110 122M115 66 207 64M115 118 205 116" fill="none" stroke={p.line} strokeWidth={1.3}/>
    <Motif name="dumbbell" p={p} wash={p.ice} x={110} y={44} size={104} angle={-12}/>
    <Path d="M203 45 209 38M216 47 225 43" fill="none" stroke={p.blue} strokeWidth={1.6}/>
  </G>;
}

function HeartPage({p}:{p:Palette}){
  return <G strokeLinecap="round" strokeLinejoin="round">
    <Path d="M101 49 213 51 216 129 99 131Z" fill={p.white} stroke={p.ink} strokeWidth={1.4}/>
    <Path d="M112 61 200 62M110 119 204 118" fill="none" stroke={p.line} strokeWidth={1.2}/>
    <Motif name="heart" p={p} wash={tint(p,'peach')} x={114} y={47} size={94} angle={-3}/>
    <Path d="M90 93Q80 89 79 82M218 110Q228 108 230 101" fill="none" stroke={p.blue} strokeWidth={1.5}/>
  </G>;
}

function Surface({variant,p,compact}:{variant:DeskSceneVariant;p:Palette;compact:boolean}){
  const spec=deskScenes[variant];
  return <Svg width="100%" height="100%" viewBox="0 0 384 180" fill="none">
    <Path d={paths.backdrop} fill={tint(p,spec.paperTone)} opacity={.58}/>
    {!compact&&<G stroke={p.line} strokeWidth={.8} opacity={.7}>
      {[54,65,76].map(x=><Path key={x} d={`M${x} 49 ${x} 68M${x-4} 53 ${x+19} 53M${x-4} 64 ${x+19} 64`}/>)}
      <Path d="M303 134 303 147M313 134 313 147M298 138 320 138M298 145 320 145"/>
    </G>}
    <G transform={`rotate(${spec.paperAngle} 158 90)`}>
      <Path d={paths.paperShadow} fill={p.ink} opacity={.08}/>
      <Path d={paths.paper} fill={tint(p,spec.paperTone)} stroke={p.ink} strokeWidth={1.25} strokeLinejoin="round"/>
      <Path d={paths.paperFold} fill={p.white} stroke={p.ink} strokeWidth={1.1} strokeLinejoin="round"/>
      <Path d="M83 39 83 138M84 140Q162 145 232 139" stroke={p.ink} opacity={.22} strokeWidth={.9}/>
      {variant==='plan'?<CalendarPage p={p}/>:variant==='training'?<WorkoutPage p={p}/>:variant==='health'?<HeartPage p={p}/>:<OpenPages p={p} welcome={variant==='welcome'}/>}
    </G>
    <G transform="rotate(-5 163 27)">
      <Path d={paths.tape} fill={tint(p,'warm')} stroke={p.ink} strokeOpacity={.45} strokeWidth={.8}/>
      <Path d="M137 22 135 33M146 21 145 34M183 21 181 34M192 22 190 33" stroke={p.ink} strokeWidth={.75} opacity={.18}/>
    </G>
    <Path d={paths.clip} stroke={p.blue} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"/>
    <Ellipse cx={47} cy={145} rx={30} ry={5} fill={p.ink} opacity={.07}/>
    <Motif name={spec.side} p={p} wash={tint(p,'mint')} x={5} y={75} size={79} angle={spec.sideAngle}/>
    <Path d={paths.deskEdge} stroke={p.ink} strokeWidth={1.1} strokeOpacity={.45} strokeLinecap="round"/>
    <G transform="rotate(2 162 156)" strokeLinecap="round" strokeLinejoin="round">
      <Path d={paths.pencil} fill={tint(p,'warm')} stroke={p.ink} strokeWidth={1.15}/>
      <Path d={paths.pencilDetail} stroke={p.ink} strokeWidth={.95}/>
    </G>
    {!compact&&paths.quietStars.map((d,i)=><Path key={i} d={d} stroke={p.blue} strokeWidth={1.3} strokeLinecap="round"/>)}
    <Circle cx={290} cy={160} r={2} fill={p.blue} opacity={.45}/>
    <Path d="M270 163 277 162" stroke={p.ink} strokeWidth={1.1} strokeLinecap="round"/>
  </Svg>;
}

function FloatingSticker({variant,p,character}:{variant:DeskSceneVariant;p:Palette;character:boolean}){
  const spec=deskScenes[variant];
  return <Svg width="100%" height="100%" viewBox="-8 -8 120 124" fill="none">
    <G transform={`rotate(${spec.stickerAngle} 51 53)`}>
      <Path d={paths.sticker} transform="translate(2 4)" fill={p.ink} opacity={.1}/>
      <Path d={paths.sticker} fill={p.white} stroke={p.ink} strokeWidth={1.2} strokeLinejoin="round"/>
      <Path d="M21 16Q42 6 68 16Q87 17 88 36L90 67Q81 90 56 91Q25 93 17 70Q8 44 21 16Z" fill={tint(p,spec.stickerTone)}/>
      <Motif name={character?spec.companion:spec.sticker} p={p} wash={p.white} x={7} y={8} size={87}/>
      <Path d="M82 81 91 77Q89 91 76 94Z" fill={tint(p,spec.stickerTone)} stroke={p.ink} strokeWidth={.9}/>
    </G>
  </Svg>;
}

/** Decorative scene has its own layout box; illustrations never cover screen text. */
export function DeskScene({variant,size,compact=false,character=false,style}:DeskSceneProps){
  const p=usePalette(),{fontScale}=useWindowDimensions();
  const small=compact||fontScale>1.5;
  const maximum=Number.isFinite(size)&&size!==undefined?Math.max(80,size):(small?310:420);
  const showCharacter=character&&fontScale<=1.5;
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{width:'100%',maxWidth:maximum,alignSelf:'center',marginVertical:6},style]}>
    <SceneEntrance sceneKey={variant}>
      <View style={{width:'100%',aspectRatio:384/180}}>
        <Surface variant={variant} p={p} compact={small}/>
        <View style={{position:'absolute',left:'64.05%',top:'18.3%',width:'30.2%',aspectRatio:120/124}}>
          <IdleFloat eventKey={`${variant}:${showCharacter}`} style={{width:'100%',height:'100%'}}>
            <FloatingSticker variant={variant} p={p} character={showCharacter}/>
          </IdleFloat>
        </View>
      </View>
    </SceneEntrance>
  </View>;
}

/** Optional caption decoration. Real instructions and statuses belong in normal screen text. */
export function PaperSticker({label,tone='warm',tilt=-2,style}:{label:string;tone?:DeskSceneTone;tilt?:number;style?:StyleProp<ViewStyle>}){
  const p=usePalette(),hand=useFormFont('FormHand'),{fontScale}=useWindowDimensions();
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{alignSelf:'flex-start',maxWidth:'100%',paddingHorizontal:14,paddingVertical:8,marginVertical:6,backgroundColor:tint(p,tone),borderColor:p.ink,borderWidth:1,borderRadius:3,transform:[{rotate:`${fontScale>1.5?0:Math.max(-6,Math.min(6,tilt))}deg`}]},style]}>
    <Text style={{fontFamily:hand,fontSize:hand?20:14,lineHeight:hand?26:21,color:p.ink,flexShrink:1}}>{label}</Text>
  </View>;
}
