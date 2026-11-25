import {Platform} from 'react-native';
import {requireOptionalNativeModule} from 'expo';

export type AppIcon='ink'|'paper'|'blueprint'|'retro';
export const appIcons:AppIcon[]=['ink','paper','blueprint','retro'];
export type RuntimeCapabilities={
 nativeModule:boolean;checkedAt:string;error?:string;
 healthKit:{configured:boolean;available:boolean};
 widgets:{configured:boolean;extensionEmbedded:boolean;groupAccessible:boolean;available:boolean;activitiesAllowed:boolean};
 icons:{available:boolean;selected:AppIcon|'unknown';variants:AppIcon[]};
 keepAwake:{available:boolean};
};
type PresentationModule={nativeCapabilities?:()=>Promise<unknown>;setAppIcon?:(key:AppIcon)=>Promise<string>};
const object=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
const presentationModule=():PresentationModule|null=>{if(Platform.OS!=='ios')return null;try{return requireOptionalNativeModule<PresentationModule>('FormHealth');}catch{return null;}};
export function unavailableCapabilities():RuntimeCapabilities{return {nativeModule:false,checkedAt:new Date().toISOString(),healthKit:{configured:false,available:false},widgets:{configured:false,extensionEmbedded:false,groupAccessible:false,available:false,activitiesAllowed:false},icons:{available:false,selected:'unknown',variants:[]},keepAwake:{available:false}};}
export async function getRuntimeCapabilities():Promise<RuntimeCapabilities>{
 const result=unavailableCapabilities(),native=presentationModule();result.nativeModule=!!native;
 try{const keepAwake=await import('expo-keep-awake');result.keepAwake.available=await keepAwake.isAvailableAsync();}catch{result.keepAwake.available=false;}
 if(!native?.nativeCapabilities)return result;
 try{
  const raw=object(await native.nativeCapabilities()),health=object(raw.healthKit),widgets=object(raw.widgets),icons=object(raw.icons);
  result.healthKit={configured:health.configured===true,available:health.available===true&&health.configured===true};
  const widgetModule=!!requireOptionalNativeModule('ExpoWidgets'),widgetAvailable=widgets.available===true&&widgets.configured===true&&widgets.extensionEmbedded===true&&widgets.groupAccessible===true&&widgetModule;
  result.widgets={configured:widgets.configured===true,extensionEmbedded:widgets.extensionEmbedded===true,groupAccessible:widgets.groupAccessible===true,available:widgetAvailable,activitiesAllowed:widgets.activitiesAllowed===true&&widgetAvailable};
  const variants=Array.isArray(icons.variants)?icons.variants.filter((key):key is AppIcon=>appIcons.includes(key as AppIcon)):[];
  result.icons={available:icons.available===true&&variants.length>1,selected:appIcons.includes(icons.selected as AppIcon)?icons.selected as AppIcon:'unknown',variants};
 }catch{result.error='Der native Funktionsstatus konnte nicht vollständig gelesen werden.';}
 return result;
}
export const readNativeCapabilities=getRuntimeCapabilities;
/** A successful UIKit callback and OS readback are required before preferences may be saved. */
export async function setAlternateAppIcon(icon:AppIcon):Promise<AppIcon>{
 const native=presentationModule(),before=await getRuntimeCapabilities();
 if(!native?.setAppIcon||!before.icons.available||!before.icons.variants.includes(icon))throw Error('Dieses App-Symbol ist in diesem Build nicht verfügbar.');
 const receipt=await native.setAppIcon(icon),after=await getRuntimeCapabilities();
 if(receipt!==icon||after.icons.selected!==icon)throw Error('Das System hat die Symboländerung noch nicht bestätigt.');
 return icon;
}
