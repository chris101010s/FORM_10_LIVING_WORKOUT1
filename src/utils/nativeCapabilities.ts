import {Platform} from 'react-native';
import {requireOptionalNativeModule} from 'expo';

export type RuntimeCapabilities={
 nativeModule:boolean;checkedAt:string;error?:string;
 healthKit:{configured:boolean;available:boolean};
 widgets:{configured:boolean;extensionEmbedded:boolean;groupAccessible:boolean;available:boolean;activitiesAllowed:boolean};
 keepAwake:{available:boolean};
};
type PresentationModule={nativeCapabilities?:()=>Promise<unknown>};
const object=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
const presentationModule=():PresentationModule|null=>{if(Platform.OS!=='ios')return null;try{return requireOptionalNativeModule<PresentationModule>('FormHealth');}catch{return null;}};
export function unavailableCapabilities():RuntimeCapabilities{return {nativeModule:false,checkedAt:new Date().toISOString(),healthKit:{configured:false,available:false},widgets:{configured:false,extensionEmbedded:false,groupAccessible:false,available:false,activitiesAllowed:false},keepAwake:{available:false}};}
export async function getRuntimeCapabilities():Promise<RuntimeCapabilities>{
 const result=unavailableCapabilities(),native=presentationModule();result.nativeModule=!!native;
 try{const keepAwake=await import('expo-keep-awake');result.keepAwake.available=await keepAwake.isAvailableAsync();}catch{result.keepAwake.available=false;}
 if(!native?.nativeCapabilities)return result;
 try{
  const raw=object(await native.nativeCapabilities()),health=object(raw.healthKit),widgets=object(raw.widgets);
  result.healthKit={configured:health.configured===true,available:health.available===true&&health.configured===true};
  const widgetModule=!!requireOptionalNativeModule('ExpoWidgets'),widgetAvailable=widgets.available===true&&widgets.configured===true&&widgets.extensionEmbedded===true&&widgets.groupAccessible===true&&widgetModule;
  result.widgets={configured:widgets.configured===true,extensionEmbedded:widgets.extensionEmbedded===true,groupAccessible:widgets.groupAccessible===true,available:widgetAvailable,activitiesAllowed:widgets.activitiesAllowed===true&&widgetAvailable};
 }catch{result.error='Der native Funktionsstatus konnte nicht vollständig gelesen werden.';}
 return result;
}
export const readNativeCapabilities=getRuntimeCapabilities;
