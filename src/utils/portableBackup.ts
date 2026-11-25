import type {AthleteData} from '../data/schema';
import type {SnapshotSource} from '../data/persistenceTypes';
import {immutableAthleteData,parseAthleteBackup} from '../data/validation';
import {canonicalData,validateMediaAssets} from '../data/secondPassValidation';
import type {PrivateFiles} from './privateFiles';
import {safePrivatePath} from './privateFiles';
import {fromBase64,fromUtf8,toBase64,utf8} from './portableCodec';
import {verifyMedia,verifyJpegMetadata} from './mediaAssets';
export const PORTABLE_FORMAT='FORM-Portable-Backup-v1',MAX_BACKUP_BYTES=15_000_000;
type MediaPart={id:string;relativePath:string;mimeType:'image/jpeg';byteLength:number;sha256:string}&({base64:string;missing?:never}|{missing:true;base64?:never});
export type PortableEnvelope={format:typeof PORTABLE_FORMAT;createdAt:string;appVersion:string;databaseSchema:number;source:SnapshotSource;sourceKey?:string;completeness?:'missing-media';data:AthleteData;media:MediaPart[];integrity:{algorithm:'SHA-256';sha256:string}};
export type PreparedBackup={data:AthleteData;media:{path:string;bytes:Uint8Array;sha256:string}[];metadata:{createdAt:string|null;appVersion:string|null;databaseSchema:number|null;source:string;mediaCount:number;missingMediaCount:number;byteLength:number};envelope?:PortableEnvelope};
const isObject=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
function mediaRelationships(data:AthleteData){const ids=new Set((data.mediaAssets??[]).map(m=>m.id));const exercises=[...data.exercises,...(data.planEditorDraft?.customExercises??[]),...(data.planRevisions??[]).flatMap(r=>r.exercises??[])];for(const e of exercises)if(e.photoAssetId&&!ids.has(e.photoAssetId))throw Error('Ein Foto verweist auf einen fehlenden Medienverzeichnis-Eintrag.');}
export async function makePortableBackup(data:AthleteData,port:PrivateFiles,options:{source?:SnapshotSource;sourceKey?:string;now?:Date;allowMissingMedia?:boolean}={}):Promise<string>{
 const clean=immutableAthleteData(data);mediaRelationships(clean);const assets=clean.mediaAssets??[];validateMediaAssets(assets);const media:MediaPart[]=[];let size=0,missing=0;
 for(const asset of assets){const header={id:asset.id,relativePath:asset.relativePath,mimeType:asset.mimeType,byteLength:asset.byteLength,sha256:asset.sha256};let bytes:Uint8Array;try{bytes=await verifyMedia(port,asset);}catch(error){if(!options.allowMissingMedia)throw error;media.push({...header,missing:true});missing++;continue;}size+=bytes.length;if(size>10_500_000)throw Error('Die eigenen Fotos überschreiten die portable Backupgrenze. Es wurde keine unvollständige Sicherung erstellt.');media.push({...header,base64:toBase64(bytes)});}
 const body={format:PORTABLE_FORMAT,createdAt:(options.now??new Date()).toISOString(),appVersion:'15.0.0',databaseSchema:9,source:options.source??'manual',...(options.sourceKey?{sourceKey:options.sourceKey}:{}),...(missing?{completeness:'missing-media' as const}:{}),data:clean,media};
 const result=JSON.stringify({...body,integrity:{algorithm:'SHA-256',sha256:await port.sha256(utf8(canonicalData(body)))}});if(utf8(result).length>MAX_BACKUP_BYTES)throw Error('Backup überschreitet 15 MB. Keine Datei wurde überschrieben.');return result;
}
export async function prepareBackup(raw:string,port:PrivateFiles):Promise<PreparedBackup>{
 const byteLength=utf8(raw).length;if(byteLength>MAX_BACKUP_BYTES)throw Error('Backup überschreitet 15 MB.');let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw Error('Ungültige JSON-Datei.');}
 if(!isObject(parsed)||parsed.format!==PORTABLE_FORMAT){const data=immutableAthleteData(parseAthleteBackup(raw));if(data.mediaAssets?.length)throw Error('Diese JSON-Datei enthält Medienverweise, aber kein portables Medienmanifest. Ein vollständiges Backup verwenden.');return {data,media:[],metadata:{createdAt:isObject(parsed)&&typeof parsed.createdAt==='string'?parsed.createdAt:null,appVersion:isObject(parsed)&&typeof parsed.appVersion==='string'?parsed.appVersion:null,databaseSchema:isObject(parsed)&&typeof parsed.databaseSchema==='number'?parsed.databaseSchema:null,source:'legacy-json',mediaCount:0,missingMediaCount:0,byteLength}};}
 const {integrity,...body}=parsed;if(!isObject(integrity)||integrity.algorithm!=='SHA-256'||typeof integrity.sha256!=='string'||!/^[a-f0-9]{64}$/.test(integrity.sha256)||await port.sha256(utf8(canonicalData(body)))!==integrity.sha256)throw Error('Die Integritätsprüfung des Backups ist fehlgeschlagen.');
 if(typeof parsed.createdAt!=='string'||!Number.isFinite(Date.parse(parsed.createdAt))||typeof parsed.appVersion!=='string'||parsed.appVersion.length>40||parsed.databaseSchema!==9||!['daily','version','preimport','manual'].includes(String(parsed.source))||parsed.sourceKey!==undefined&&(typeof parsed.sourceKey!=='string'||parsed.sourceKey.length>200)||!Array.isArray(parsed.media)||parsed.media.length>5000)throw Error('Backup-Metadaten ungültig.');
 const data=immutableAthleteData(parsed.data);mediaRelationships(data);const assets=data.mediaAssets??[];validateMediaAssets(assets);if(parsed.media.length!==assets.length)throw Error('Medienmanifest und Datenbestand sind unvollständig.');const ids=new Set<string>(),media:PreparedBackup['media']=[];let missingMediaCount=0;
 for(const part of parsed.media){if(!isObject(part)||typeof part.id!=='string'||ids.has(part.id)||typeof part.relativePath!=='string'||typeof part.base64!=='string'&&part.missing!==true)throw Error('Medienmanifest ungültig.');safePrivatePath(part.relativePath);const asset=assets.find(a=>a.id===part.id);if(!asset||part.relativePath!==asset.relativePath||part.mimeType!==asset.mimeType||part.byteLength!==asset.byteLength||part.sha256!==asset.sha256)throw Error('Medienmanifest passt nicht zum gespeicherten Foto.');ids.add(part.id);if(part.missing===true){if(part.base64!==undefined||parsed.completeness!=='missing-media')throw Error('Fehlende Medien müssen ausdrücklich gekennzeichnet sein.');missingMediaCount++;continue;}const bytes=fromBase64(part.base64 as string);if(bytes.length!==asset.byteLength||await port.sha256(bytes)!==asset.sha256)throw Error('Ein Foto im Backup ist beschädigt.');verifyJpegMetadata(bytes,asset.metadataStripped);media.push({path:asset.relativePath,bytes,sha256:asset.sha256});}
 if(parsed.completeness!==undefined&&parsed.completeness!=='missing-media'||parsed.completeness==='missing-media'&&!missingMediaCount)throw Error('Wiederherstellungsstatus passt nicht zum Medienmanifest.');
 return {data,media,metadata:{createdAt:parsed.createdAt,appVersion:parsed.appVersion,databaseSchema:9,source:String(parsed.source),mediaCount:media.length,missingMediaCount,byteLength},envelope:parsed as unknown as PortableEnvelope};
}
let importSequence=0;
/** All bytes are checked in staging before any database replacement is attempted. */
export async function commitPreparedBackup(prepared:PreparedBackup,port:PrivateFiles,commit:(data:AthleteData)=>Promise<boolean>):Promise<boolean>{
 const transaction=`import-${Date.now()}-${++importSequence}`,staged:{path:string;target:string;hash:string}[]=[],created:string[]=[];let databaseAttempted=false;
 try{
  for(const [i,part] of prepared.media.entries()){if(await port.exists(part.path)){const old=await port.read(part.path);if(await port.sha256(old)!==part.sha256)throw Error('Eine vorhandene Mediendatei ist beschädigt. Nichts wurde überschrieben.');continue;}const path=`staging/${transaction}-${i}.tmp`;staged.push({path,target:part.path,hash:part.sha256});await port.writeNew(path,part.bytes);if(await port.sha256(await port.read(path))!==part.sha256)throw Error('Medienprüfung im Importbereich fehlgeschlagen.');}
  for(const file of staged){await port.move(file.path,file.target);created.push(file.target);if(await port.sha256(await port.read(file.target))!==file.hash)throw Error('Medienprüfung nach der Übernahme fehlgeschlagen.');}
  databaseAttempted=true;return await commit(prepared.data);
 }catch(error){if(!databaseAttempted)for(const path of created)try{await port.remove(path);}catch{/* Only newly created unreferenced assets. */}throw error;}
 finally{for(const file of staged)try{await port.remove(file.path);}catch{/* Never touch existing/final referenced files here. */}}
 // On DB failure keep final assets: optimistic RAM may reference them and Retry must remain possible.
}
export const readPortableFile=async(port:PrivateFiles,path:string)=>prepareBackup(fromUtf8(await port.read(path)),port);
/** Explicit emergency export: retain every record and clearly list unrecoverable photo files. */
export const makeRecoveryBackup=(data:AthleteData,port:PrivateFiles)=>makePortableBackup(data,port,{allowMissingMedia:true});
