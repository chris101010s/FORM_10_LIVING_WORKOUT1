export type KeepAwakeFacts={enabled:boolean;focused:boolean;appActive:boolean;hasSession:boolean;paused:boolean};
export const keepAwakeRequired=(facts:KeepAwakeFacts)=>facts.enabled&&facts.focused&&facts.appActive&&facts.hasSession&&!facts.paused;
export function nativeSessionClockValid(live:{startedAt:string;pausedAt?:number;pausedMs?:number;lastSavedAt?:string},now:number):boolean{
  const start=Date.parse(live.startedAt),saved=Date.parse(live.lastSavedAt||live.startedAt),effectiveStart=start+(live.pausedMs||0);
  return Number.isFinite(now)&&Number.isFinite(start)&&Number.isFinite(saved)&&now>=start&&now>=(live.pausedAt||0)&&effectiveStart<=(live.pausedAt||now)&&now+60000>=saved;
}
export type KeepAwakePort={activate:()=>Promise<void>;deactivate:()=>Promise<void>};
/** Latest intent wins even if native activation completes after navigation/unmount. */
export class KeepAwakeController {
  private desired=false;
  private applied=false;
  private disposed=false;
  private queue:Promise<void>=Promise.resolve();
  constructor(private readonly port:KeepAwakePort){}
  setActive(active:boolean):Promise<void>{
    this.desired=active&&!this.disposed;
    this.queue=this.queue.catch(()=>{}).then(async()=>{
      while(this.desired!==this.applied){
        const target=this.desired;
        try{if(target)await this.port.activate();else await this.port.deactivate();this.applied=target;}
        catch(error){if(target){try{await this.port.deactivate();}catch{/* A later inactive reconciliation retries the tag release. */this.applied=true;}}throw error;}
      }
    });
    return this.queue;
  }
  dispose(){this.disposed=true;return this.setActive(false);}
}

export type ScheduledLocalNotification={id:string;fingerprint?:string};
export type DesiredLocalNotification={id:string;at:number;title:string;body:string;sound:boolean;sessionId?:string;timerId?:string};
export type NotificationPort={list:()=>Promise<ScheduledLocalNotification[]>;cancel:(id:string)=>Promise<void>;schedule:(notification:DesiredLocalNotification,fingerprint:string)=>Promise<void>};
export const ownNotification=(id:string)=>id.startsWith('form-rest-')||id.startsWith('form-plan-');
export const notificationFingerprint=(item:DesiredLocalNotification)=>JSON.stringify([item.id,item.at,item.title,item.body,item.sound,item.sessionId||'',item.timerId||'']);
/** Only FORM's own scheduled reminders are reconciled. Other app/system schedules are untouched. */
export async function reconcileLocalNotifications(port:NotificationPort,desired:DesiredLocalNotification[],isCurrent:()=>boolean=()=>true,now:()=>number=Date.now):Promise<{scheduled:number;cancelled:number}>{
  if(desired.some(item=>!ownNotification(item.id)||!Number.isFinite(item.at))||new Set(desired.map(item=>item.id)).size!==desired.length)throw Error('Benachrichtigungsplan enthält ungültige oder doppelte Einträge.');
  const targets=new Map(desired.filter(item=>item.at>now()+1000).map(item=>[item.id,item]));
  const existing=await port.list(),matched=new Set<string>(),counts=new Map<string,number>(),cancelledIds=new Set<string>();let cancelled=0,scheduled=0;
  for(const item of existing)counts.set(item.id,(counts.get(item.id)||0)+1);
  for(const item of existing){
    if(!isCurrent())return {scheduled,cancelled};
    if(!ownNotification(item.id))continue;
    if((counts.get(item.id)||0)>1){if(!cancelledIds.has(item.id)){await port.cancel(item.id);cancelledIds.add(item.id);cancelled++;}continue;}
    const target=targets.get(item.id);
    if(target&&item.fingerprint===notificationFingerprint(target)&&!matched.has(item.id))matched.add(item.id);
    else {await port.cancel(item.id);cancelled++;}
  }
  for(const target of targets.values()){
    if(!isCurrent())return {scheduled,cancelled};
    if(matched.has(target.id)||target.at<=now()+1000)continue;
    await port.schedule(target,notificationFingerprint(target));scheduled++;
  }
  return {scheduled,cancelled};
}
