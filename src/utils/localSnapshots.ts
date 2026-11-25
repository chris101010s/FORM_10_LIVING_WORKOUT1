import type {AthleteData} from '../data/schema';
import type {LocalBackupPolicy,SnapshotInfo,SnapshotSource} from '../data/persistenceTypes';
import type {PrivateFiles} from './privateFiles';
import {fromUtf8,utf8} from './portableCodec';
import {makePortableBackup,prepareBackup,PreparedBackup} from './portableBackup';
export const DEFAULT_BACKUP_POLICY:LocalBackupPolicy={enabled:true,dailyLimit:7,versionLimit:3};
export const SECOND_PASS_BACKUP_KEY='15.0.0-second-pass';
export type SnapshotInventory={entries:SnapshotInfo[];damaged:number;byteLength:number};
let serial=0;
export class LocalSnapshots{
 private queue:Promise<unknown>=Promise.resolve();private versionReady=false;
 constructor(readonly files:PrivateFiles,readonly now:()=>Date=()=>new Date()){}
 private run<T>(fn:()=>Promise<T>):Promise<T>{const next=this.queue.catch(()=>{}).then(fn);this.queue=next;return next;}
 async inventory():Promise<SnapshotInventory>{return this.run(()=>this.scan());}
 private async scan():Promise<SnapshotInventory>{const entries:SnapshotInfo[]=[];let damaged=0,byteLength=0;for(const file of await this.files.list('backups')){if(!/^[A-Za-z0-9_-]+\.json$/.test(file.name))continue;byteLength+=file.byteLength;try{const prepared=await prepareBackup(fromUtf8(await this.files.read('backups/'+file.name)),this.files),e=prepared.envelope;if(!e||prepared.metadata.missingMediaCount||!file.name.startsWith(e.source+'-'))throw Error('Kein passendes lokales Paket.');entries.push({id:file.name.slice(0,-5),createdAt:e.createdAt,appVersion:e.appVersion,databaseSchema:e.databaseSchema,source:e.source,sourceKey:e.sourceKey,byteLength:file.byteLength,sha256:e.integrity.sha256});}catch{damaged++;}}entries.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));return {entries,damaged,byteLength};}
 create(data:AthleteData,source:SnapshotSource,sourceKey?:string):Promise<SnapshotInfo>{return this.run(()=>this.write(data,source,sourceKey));}
 private async write(data:AthleteData,source:SnapshotSource,sourceKey?:string):Promise<SnapshotInfo>{
  if(!this.files.protection.excludedFromBackup)throw Error('Automatische Cloud-Kopie lokaler Sicherungen kann in diesem Build nicht ausgeschlossen werden. Lokale Snapshots sind deshalb pausiert; ein bewusster Datei-Export bleibt möglich.');
  const now=this.now(),id=`${source}-${now.getTime()}-${++serial}-${Math.random().toString(36).slice(2,10)}`,temp=`staging/${id}.tmp`,path=`backups/${id}.json`;
  const raw=await makePortableBackup(data,this.files,{source,sourceKey,now}),bytes=utf8(raw);
  try{await this.files.writeNew(temp,bytes);const read=await this.files.read(temp);if(await this.files.sha256(read)!==await this.files.sha256(bytes))throw Error('Sicherungsdatei wurde nicht vollständig geschrieben.');await prepareBackup(fromUtf8(read),this.files);await this.files.move(temp,path);const verified=await prepareBackup(fromUtf8(await this.files.read(path)),this.files);const e=verified.envelope!;
   // The just-created complete backup is verified before any retention deletion.
   const inventory=await this.scan(),policy=data.settings.localBackup??DEFAULT_BACKUP_POLICY;const group=(s:SnapshotSource)=>s==='daily'?'daily':s==='version'||s==='preimport'?'version':'manual';const g=group(source);
   if(g!=='manual'){const limit=g==='daily'?policy.dailyLimit:policy.versionLimit;const same=inventory.entries.filter(s=>group(s.source)===g),keep=new Set([id,...same.filter(s=>s.id!==id).slice(0,Math.max(0,limit-1)).map(s=>s.id)]);for(const old of same)if(!keep.has(old.id))await this.files.remove(`backups/${old.id}.json`);}
   return {id,createdAt:e.createdAt,appVersion:e.appVersion,databaseSchema:e.databaseSchema,source,sourceKey,byteLength:bytes.length,sha256:e.integrity.sha256};
  }finally{try{await this.files.remove(temp);}catch{/* Do not delete any prior snapshot after a write error. */}}
 }
 ensureVersion(data:AthleteData):Promise<SnapshotInfo|null>{return this.run(async()=>{if(this.versionReady)return null;const marker='metadata/version-15-0-0-second-pass.json';if(await this.files.exists(marker)){const saved=JSON.parse(fromUtf8(await this.files.read(marker)));if(saved?.format!=='FORM-Version-Backup-State-v1'||saved.key!==SECOND_PASS_BACKUP_KEY||typeof saved.firstSnapshotId!=='string')throw Error('Versionssicherungsstatus beschädigt.');this.versionReady=true;return null;}const old=(await this.scan()).entries.find(x=>x.source==='version'&&x.sourceKey===SECOND_PASS_BACKUP_KEY),created=old??await this.write(data,'version',SECOND_PASS_BACKUP_KEY),bytes=utf8(JSON.stringify({format:'FORM-Version-Backup-State-v1',key:SECOND_PASS_BACKUP_KEY,firstSnapshotId:created.id,createdAt:created.createdAt})),stage=`staging/version-marker-${++serial}.tmp`;try{await this.files.writeNew(stage,bytes);if(await this.files.sha256(await this.files.read(stage))!==await this.files.sha256(bytes))throw Error('Versionssicherungsstatus konnte nicht geprüft werden.');await this.files.move(stage,marker);}finally{try{await this.files.remove(stage);}catch{}}this.versionReady=true;return created;});}
 ensureDaily(data:AthleteData):Promise<SnapshotInfo|null>{return this.run(async()=>{const policy=data.settings.localBackup??DEFAULT_BACKUP_POLICY;if(!policy.enabled)return null;const n=this.now(),key=[n.getFullYear(),String(n.getMonth()+1).padStart(2,'0'),String(n.getDate()).padStart(2,'0')].join('-');if((await this.scan()).entries.some(e=>e.source==='daily'&&e.sourceKey===key))return null;return this.write(data,'daily',key);});}
 read(id:string):Promise<PreparedBackup>{return this.run(async()=>{if(!/^[A-Za-z0-9_-]+$/.test(id))throw Error('Ungültige Sicherungs-ID.');return prepareBackup(fromUtf8(await this.files.read(`backups/${id}.json`)),this.files);});}
 raw(id:string):Promise<string>{return this.run(async()=>{if(!/^[A-Za-z0-9_-]+$/.test(id))throw Error('Ungültige Sicherungs-ID.');const raw=fromUtf8(await this.files.read(`backups/${id}.json`));await prepareBackup(raw,this.files);return raw;});}
}
let manager:Promise<LocalSnapshots>|null=null;
export async function localSnapshots():Promise<LocalSnapshots>{if(!manager)manager=import('./privateFiles').then(m=>m.privateFiles()).then(files=>new LocalSnapshots(files)).catch(error=>{manager=null;throw error;});return manager;}
