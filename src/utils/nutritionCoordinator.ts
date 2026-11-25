import {newHealthNutrition,nutritionChunks,nutritionIsFresh,reconcileNutrition,validateNutritionSnapshot} from './nutritionSync';
import type {HealthNutritionState,NutritionMetric,NutritionSnapshot,NutritionSyncAttempt,NutritionSyncTrigger,NutritionWindow} from './nutritionTypes';

export type NutritionSyncView={phase:'idle'|'waiting'|'running'|'success'|'partial'|'failed'|'cancelled';id?:string;trigger?:NutritionSyncTrigger;completedChunks:number;totalChunks:number;samplesRead:number;message?:string;finishedAt?:string};
export type NutritionSyncOutcome=NutritionSyncView&{skipped?:'unavailable'|'setup'|'disabled'|'fresh'};
export type NutritionSyncPorts={
  available:()=>boolean;
  /** This must return committed SQLite state, never an optimistic React draft. */
  getConfirmed:()=>HealthNutritionState|undefined;
  commit:(change:(state:HealthNutritionState|undefined)=>HealthNutritionState)=>Promise<boolean>;
  read:(fromMs:number,toMs:number,metrics:NutritionMetric[])=>Promise<NutritionSnapshot>;
  now?:()=>number;debounceMs?:number;freshnessMs?:number;
};
type Job={id:string;key:string;cancelled:boolean;timer?:ReturnType<typeof setTimeout>;release?:()=>void;promise:Promise<NutritionSyncOutcome>};
type Pending={bounds:NutritionWindow;trigger:NutritionSyncTrigger;promise:Promise<NutritionSyncOutcome>;resolve:(value:NutritionSyncOutcome)=>void};

/** A single foreground queue shared by all Health screens. It never asks for permission. */
export class NutritionSyncCoordinator {
  private current:Job|null=null;
  private sequence=0;
  private pending:Pending|null=null;
  private listeners=new Set<(view:NutritionSyncView)=>void>();
  private view:NutritionSyncView={phase:'idle',completedChunks:0,totalChunks:0,samplesRead:0};
  constructor(private readonly ports:NutritionSyncPorts){}
  getSnapshot=()=>this.view;
  subscribe=(listener:(view:NutritionSyncView)=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private publish(value:NutritionSyncView){this.view=value;for(const listener of this.listeners)listener(value);}
  private now(){return this.ports.now?.()??Date.now();}
  cancel=()=>{this.pending?.resolve({...this.view,phase:'cancelled',message:'Vorgemerkte Abfrage abgebrochen.'});this.pending=null;const job=this.current;if(!job)return;job.cancelled=true;if(job.timer)clearTimeout(job.timer);job.release?.();};
  dispose=()=>{this.cancel();this.listeners.clear();};

  request=(bounds:NutritionWindow,trigger:NutritionSyncTrigger='manual'):Promise<NutritionSyncOutcome>=>{
    const key=JSON.stringify(bounds);
    if(this.current){
      let result=this.current.promise;
      if(this.current.key!==key||this.current.cancelled){
        if(this.pending){this.pending.bounds=bounds;this.pending.trigger=trigger;}
        else {let resolve:(value:NutritionSyncOutcome)=>void=()=>{};const promise=new Promise<NutritionSyncOutcome>(accept=>{resolve=accept;});this.pending={bounds,trigger,promise,resolve};}
        result=this.pending.promise;
      }
      // A deliberate refresh also releases a pending automatic debounce; it never creates a second query.
      if((trigger==='manual'||trigger==='history')&&this.current.timer){clearTimeout(this.current.timer);this.current.timer=undefined;this.current.release?.();}
      return result;
    }
    const state=this.ports.getConfirmed(),automatic=trigger==='open'||trigger==='foreground';
    const skipped=!this.ports.available()?'unavailable':!state?.authorizationRequested||!state.requestedMetrics.length?'setup':trigger==='open'&&state.syncPreferences?.onOpen===false||trigger==='foreground'&&state.syncPreferences?.onForeground!==true?'disabled':automatic&&nutritionIsFresh(state,bounds,this.now(),this.ports.freshnessMs??300000)?'fresh':undefined;
    if(skipped)return Promise.resolve({...this.view,skipped});
    const id=`health-sync-${this.now()}-${++this.sequence}`;
    const job:Job={id,key,cancelled:false,promise:Promise.resolve(this.view)};
    this.current=job;
    job.promise=this.run(job,bounds,trigger,automatic).finally(()=>{if(this.current===job){this.current=null;const pending=this.pending;this.pending=null;if(pending)void this.request(pending.bounds,pending.trigger).then(pending.resolve,()=>pending.resolve({...this.view,phase:'failed',message:'Der vorgemerkte Zeitraum konnte nicht abgefragt werden.'}));}});
    return job.promise;
  };

  private async run(job:Job,bounds:NutritionWindow,trigger:NutritionSyncTrigger,automatic:boolean):Promise<NutritionSyncOutcome>{
    const chunks=nutritionChunks(bounds),startedAt=new Date(this.now()).toISOString();
    let done=0,count=0,partial=false;
    const status=(phase:NutritionSyncView['phase'],message?:string,finishedAt?:string):NutritionSyncView=>({phase,id:job.id,trigger,completedChunks:done,totalChunks:chunks.length,samplesRead:count,...(message?{message}:{}),...(finishedAt?{finishedAt}:{})});
    this.publish(status(automatic?'waiting':'running'));
    if(automatic&&(this.ports.debounceMs??350)>0)await new Promise<void>(resolve=>{job.release=resolve;job.timer=setTimeout(()=>{job.timer=undefined;resolve();},this.ports.debounceMs??350);});
    if(job.cancelled){const result=status('cancelled','Abfrage vor dem Start abgebrochen.');this.publish(result);return result;}
    const attempt:NutritionSyncAttempt={...bounds,id:job.id,startedAt,trigger,status:'running',completedChunks:0,totalChunks:chunks.length};
    const finish=async(phase:'success'|'partial'|'failed'|'cancelled',message?:string)=>{
      const finishedAt=new Date(this.now()).toISOString();
      let saved=false;
      try{saved=await this.ports.commit(state=>{const before=state||newHealthNutrition();if(before.lastAttempt?.id!==job.id)return before;return {...before,lastAttempt:{...attempt,status:phase,completedChunks:done,finishedAt,...(message?{message:message.slice(0,500),errorCode:phase==='cancelled'?'CANCELLED':'SYNC_FAILED'}:{})}};});}catch{/* A thrown storage failure also leaves the previous confirmed cache visible. */}
      const result=status(saved?phase:'failed',saved?message:'Die Abfrage ist noch nicht vollständig lokal bestätigt. Speichern erneut versuchen.',finishedAt);
      this.publish(result);return result;
    };
    try{
      const current=this.ports.getConfirmed();
      if(!current?.authorizationRequested||!current.requestedMetrics.length){const result=status('cancelled','Abfragen sind in FORM pausiert.');this.publish(result);return result;}
      const metrics=[...current.requestedMetrics];
      if(!await this.ports.commit(state=>({...state||newHealthNutrition(),lastAttempt:attempt})))throw Error('Der Abfragestart konnte nicht lokal gesichert werden. Speichern erneut versuchen.');
      this.publish(status('running'));
      for(const chunk of chunks){
        if(job.cancelled)return finish('cancelled','Abfrage abgebrochen. Bereits bestätigte Zeiträume bleiben erhalten.');
        const latest=this.ports.getConfirmed();
        if(!latest?.authorizationRequested||JSON.stringify(latest.requestedMetrics)!==JSON.stringify(metrics))return finish('cancelled','Die Verbindungseinstellungen wurden geändert. Bereits bestätigte Zeiträume bleiben erhalten.');
        const snapshot=validateNutritionSnapshot(await this.ports.read(Date.parse(chunk.from),Date.parse(chunk.to),metrics));
        if(job.cancelled)return finish('cancelled','Abfrage abgebrochen. Bereits bestätigte Zeiträume bleiben erhalten.');
        if(Date.parse(snapshot.from)!==Date.parse(chunk.from)||Date.parse(snapshot.to)!==Date.parse(chunk.to)||snapshot.timeZone!==chunk.timeZone)throw Error('Abfragezeitraum oder Gerätezeitzone hat sich geändert. Bitte erneut aktualisieren.');
        if(metrics.some(metric=>!snapshot.completeMetrics.includes(metric)&&!snapshot.unavailable.includes(metric))||[...snapshot.completeMetrics,...snapshot.unavailable].some(metric=>!metrics.includes(metric)))throw Error('Apple Health hat nicht alle angefragten Typen eindeutig beantwortet.');
        if(!await this.ports.commit(state=>({...reconcileNutrition(state,snapshot),...(!state?.connectionConfirmedAt&&snapshot.samples.some(sample=>!sample.isOwnExport)?{connectionConfirmedAt:snapshot.queriedAt,connectionEventId:job.id}:{}),lastAttempt:{...attempt,completedChunks:done+1}})))throw Error('Gelesene Daten sind noch nicht lokal bestätigt. Speichern erneut versuchen.');
        done++;count+=snapshot.samples.length;partial=partial||snapshot.unavailable.length>0;
        this.publish(status('running'));
      }
      return finish(partial?'partial':'success');
    }catch(error){
      return finish(job.cancelled?'cancelled':'failed',error instanceof Error?error.message:'Die Health-Abfrage konnte nicht abgeschlossen werden.');
    }
  }
}
