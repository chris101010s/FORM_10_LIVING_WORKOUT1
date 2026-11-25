import type {PrivateStorageProtection} from '../data/persistenceTypes';
export type PrivateFileEntry={name:string;byteLength:number};
export interface PrivateFiles{
 protection:PrivateStorageProtection;
 read(path:string):Promise<Uint8Array>;writeNew(path:string,bytes:Uint8Array):Promise<void>;
 move(from:string,to:string):Promise<void>;remove(path:string):Promise<void>;exists(path:string):Promise<boolean>;
 list(directory:'assets'|'backups'|'staging'):Promise<PrivateFileEntry[]>;
 sha256(bytes:Uint8Array):Promise<string>;uri(path:string):string;
}
export function safePrivatePath(path:string):string{if(path.length>220||! /^(assets|backups|staging|metadata)\/[A-Za-z0-9_-]+\.(jpg|json|tmp)$/.test(path))throw Error('Unzulässiger relativer Dateipfad.');return path;}
let files:Promise<PrivateFiles>|null=null;
export function privateFiles():Promise<PrivateFiles>{
 if(!files)files=(async()=>{
  // Keep this module safe for pure backup validation. Metro import() enumerates
  // CommonJS exports and would activate unrelated React Native lazy getters
  // (including PushNotificationIOS). Load only the adapter's named exports here.
  const {File,Directory,Paths}=require('expo-file-system') as typeof import('expo-file-system');
  const {Platform}=require('react-native') as typeof import('react-native');
  const {requireOptionalNativeModule}=require('expo') as typeof import('expo');
  const {digest,CryptoDigestAlgorithm}=require('expo-crypto') as typeof import('expo-crypto');
  const native=Platform.OS==='ios'?requireOptionalNativeModule<{preparePrivateStorage:()=>Promise<{uri:string;excludedFromBackup:boolean;protected:boolean}>}>('FormHealth'):null;
  const prepared=native?.preparePrivateStorage?await native.preparePrivateStorage():null;
  const root=prepared?new Directory(prepared.uri):new Directory(Paths.document,'FORMPrivate');root.create({intermediates:true,idempotent:true});
  const protection:PrivateStorageProtection={excludedFromBackup:prepared?.excludedFromBackup===true,protected:prepared?.protected===true,location:prepared?'native-private':'app-private-fallback'};
  const file=(path:string)=>new File(root,safePrivatePath(path));
  return {protection,read:async path=>{const f=file(path);if(!f.exists)throw Error('Eine lokale Datei fehlt.');if((f.size??0)>21_000_000)throw Error('Die lokale Datei überschreitet die geprüfte Größenbegrenzung.');return f.bytes();},writeNew:async(path,bytes)=>{const f=file(path);f.create({intermediates:true,overwrite:false});await f.write(bytes);},move:async(from,to)=>{const target=file(to);target.parentDirectory.create({intermediates:true,idempotent:true});file(from).move(target,{overwrite:false});},remove:async path=>{const f=file(path);if(f.exists)f.delete();},exists:async path=>file(path).exists,list:async directory=>{const d=new Directory(root,directory);if(!d.exists)return [];return d.list().filter((f):f is InstanceType<typeof File>=>f instanceof File).map(f=>({name:f.name,byteLength:f.size??0}));},sha256:async bytes=>{const hash=await digest(CryptoDigestAlgorithm.SHA256,new Uint8Array(bytes));return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');},uri:path=>file(path).uri} satisfies PrivateFiles;
 })().catch(error=>{files=null;throw error;});return files;
}
