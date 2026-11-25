'use strict';
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),Module=require('node:module');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'form15-nutrition-'));
const originalTZ=process.env.TZ;
let assertions=0;
const eq=(a,b)=>{assert.deepEqual(a,b);assertions++;};
const ok=x=>{assert.ok(x);assertions++;};
const fail=f=>{assert.throws(f);assertions++;};
(async()=>{try{
 const src=path.resolve('src');
 execFileSync(path.resolve('node_modules/.bin/tsc'),['--target','ES2022','--module','commonjs','--strict','--skipLibCheck','--rootDir',src,'--outDir',temp,path.join(src,'utils/nutritionSync.ts'),path.join(src,'utils/healthBridge.ts')],{cwd:temp,stdio:'inherit'});
 const n=require(path.join(temp,'utils/nutritionSync.js'));
 process.env.TZ='Europe/Vienna';
 const bounds=n.nutritionWindow('2026-11-25'),at='2026-11-25T10:00:00.000Z',queriedAt='2026-11-25T12:00:00.000Z';
 const source={name:'Nutrition writer A',bundleIdentifier:'test.fixture.a',version:'1.0',productType:'iPhone'};
 const sample=(uuid,metric,value,extra={})=>({uuid,metric,value,unit:n.nutritionLabels[metric].unit,startedAt:at,endedAt:at,source,...extra});
 const snapshot=(samples,extra={})=>({...bounds,queriedAt,samples,completeMetrics:['kcal','protein','carbs','fat'],unavailable:[],...extra});
 let state=n.newHealthNutrition();
 eq(state.samples,[]);eq(state.exports,[]);eq(state.authorizationRequested,false);
 state=n.reconcileNutrition(state,snapshot([sample('a','kcal',400),sample('b','protein',25),sample('c','kcal',0)]));
 eq(state.samples.length,3);eq(n.nutritionForDay(state,'2026-11-25').values,{kcal:400,protein:25});eq(n.nutritionForDay(state,'2026-11-25').values.fat,undefined);
 eq(n.reconcileNutrition(state,snapshot([sample('a','kcal',400),sample('b','protein',25),sample('c','kcal',0)])),state);
 eq(n.reconcileNutrition(state,snapshot([sample('a','kcal',400),sample('a','kcal',400)])).samples.length,1);
 fail(()=>n.reconcileNutrition(state,snapshot([sample('a','kcal',400),sample('a','kcal',401)])));
 state=n.reconcileNutrition(state,snapshot([sample('a','kcal',410)]));eq(state.samples.length,1);eq(n.nutritionForDay(state,'2026-11-25').values,{kcal:410});
 // A deleted UUID disappears after a successful complete-window re-query.
 const empty=n.reconcileNutrition(state,snapshot([]));eq(empty.samples,[]);eq(n.nutritionForDay(empty,'2026-11-25').values.kcal,undefined);
 // Read denial is indistinguishable from no samples; both produce an empty accessible snapshot.
 const denied=n.reconcileNutrition(state,snapshot([]));eq(denied.samples,[]);eq(denied.lastSync.queriedAt,queriedAt);
 state=n.reconcileNutrition(state,snapshot([sample('p','protein',20)]));
 const partial=n.reconcileNutrition(state,snapshot([sample('k','kcal',500)],{completeMetrics:['kcal'],unavailable:['protein','carbs','fat']}));
 eq(n.nutritionForDay(partial,'2026-11-25').values,{kcal:500,protein:20});eq(partial.lastSync.unavailable,['protein','carbs','fat']);
 fail(()=>n.reconcileNutrition(state,snapshot([],{completeMetrics:[],unavailable:['kcal','protein','carbs','fat']})));
 fail(()=>n.reconcileNutrition(state,snapshot([],{completeMetrics:['kcal'],unavailable:['kcal']})));
 fail(()=>n.reconcileNutrition(state,snapshot([sample('bad','kcal',-1)])));
 fail(()=>n.reconcileNutrition(state,snapshot([sample('bad','kcal',10,{unit:'g'})])));
 fail(()=>n.reconcileNutrition(state,snapshot([sample('bad','kcal',10,{source:{name:'missing id'}})])));
 fail(()=>n.reconcileNutrition(state,snapshot([sample('bad','kcal',10,{startedAt:bounds.to,endedAt:bounds.to})])));
 fail(()=>n.validateHealthNutritionState({...state,version:2}));
 fail(()=>n.validateHealthNutritionState({...state,samples:[...state.samples,...state.samples]}));
 const unknown=n.validateHealthNutritionState({...state,future:{kept:true},samples:state.samples.map(s=>({...s,newField:'retained'}))});eq(unknown.future,{kept:true});eq(unknown.samples[0].newField,'retained');
 // Multiple providers are not combined. Labels come from actual sample provenance.
 const sourceB={name:'Nutrition writer B',bundleIdentifier:'test.fixture.b'};
 const multisource=n.reconcileNutrition(undefined,snapshot([sample('one','kcal',600),sample('two','kcal',600,{source:sourceB})]));
 eq(n.nutritionForDay(multisource,'2026-11-25').requiresSourceSelection,true);eq(n.nutritionForDay(multisource,'2026-11-25').values,{});
 eq(n.nutritionForDay({...multisource,selectedSourceBundle:source.bundleIdentifier},'2026-11-25').values.kcal,600);
 eq(n.nutritionSources(multisource).map(s=>s.bundleIdentifier),['test.fixture.a','test.fixture.b']);
 const changedSource=n.reconcileNutrition(multisource,snapshot([sample('one','kcal',650,{source:sourceB})]));eq(changedSource.samples.length,1);eq(changedSource.samples[0].source.bundleIdentifier,'test.fixture.b');
 const own=n.reconcileNutrition(undefined,snapshot([sample('self','kcal',99,{isOwnExport:true})]));eq(own.samples.length,0);
 // Re-querying a day preserves the adjacent date and its exact UUID/time.
 const previousBounds=n.nutritionWindow('2026-11-24'),prevAt='2026-11-24T10:00:00Z';
 let adjacent=n.reconcileNutrition(state,{...snapshot([sample('prev','kcal',700,{startedAt:prevAt,endedAt:prevAt})]),...previousBounds});
 adjacent=n.reconcileNutrition(adjacent,snapshot([]));eq(adjacent.samples.map(s=>s.uuid),['prev']);
 // Local calendar arithmetic handles 23h and 25h days; no 24h approximation.
 const spring=n.nutritionWindow('2026-03-29'),autumn=n.nutritionWindow('2026-10-25');
 eq((Date.parse(spring.to)-Date.parse(spring.from))/3600000,23);eq((Date.parse(autumn.to)-Date.parse(autumn.from))/3600000,25);
 const week=n.nutritionWindow('2026-03-29','week');eq(n.nutritionDates(week),['2026-03-23','2026-03-24','2026-03-25','2026-03-26','2026-03-27','2026-03-28','2026-03-29']);
 fail(()=>n.nutritionWindow('2026-02-30'));
 const midnight='2026-11-24T23:30:00.000Z';let tzState=n.reconcileNutrition(undefined,snapshot([sample('midnight','kcal',100,{startedAt:midnight,endedAt:midnight})]));
 eq(n.nutritionForDay(tzState,'2026-11-25').values.kcal,100);process.env.TZ='America/New_York';eq(n.nutritionForDay(tzState,'2026-11-24').values.kcal,100);eq(n.nutritionForDay(tzState,'2026-11-25').values.kcal,undefined);process.env.TZ='Europe/Vienna';
 // An export is reserved durably before the bridge call. Crash/retry keeps stable version.
 const request={kind:'weight',entryId:'weight-one',at:'2026-11-25T08:00:00Z',kg:80};
 let prepared=n.prepareHealthExport(undefined,request,queriedAt);eq(prepared.record.status,'pending');eq(prepared.record.syncVersion,1);eq(prepared.record.syncIdentifier,'FORM:weight:weight-one');
 const restarted=n.validateHealthNutritionState(JSON.parse(JSON.stringify(prepared.state)));
 eq(n.prepareHealthExport(restarted,request,'2026-11-25T12:01:00Z').record,prepared.record);
 const receipt={uuid:'native-confirmed-uuid',syncIdentifier:prepared.record.syncIdentifier,syncVersion:1};
 let confirmed=n.confirmHealthExport(restarted,prepared.record.id,receipt,queriedAt);eq(confirmed.exports[0].status,'confirmed');eq(confirmed.exports[0].healthKitUUID,receipt.uuid);
 fail(()=>n.confirmHealthExport(restarted,prepared.record.id,{...receipt,syncVersion:2},queriedAt));
 const correction=n.prepareHealthExport(confirmed,{...request,kg:81},queriedAt);eq(correction.record.syncVersion,2);eq(correction.record.status,'pending');eq(correction.record.healthKitUUID,undefined);
 eq(n.prepareHealthExport(correction.state,{...request,kg:81},queriedAt).record.syncVersion,2);
 const workout={kind:'workout',entryId:'work-one',startedAt:'2026-11-25T08:00:00Z',finishedAt:'2026-11-25T09:00:00Z',durationSeconds:3300};
 const preparedWorkout=n.prepareHealthExport(correction.state,workout,queriedAt);eq(preparedWorkout.state.exports.length,2);eq(preparedWorkout.record.request.durationSeconds,3300);
 fail(()=>n.prepareHealthExport(undefined,{...workout,durationSeconds:3601},queriedAt));fail(()=>n.prepareHealthExport(undefined,{...request,kg:NaN},queriedAt));
 fail(()=>n.validateHealthNutritionState({...preparedWorkout.state,exports:preparedWorkout.state.exports.map(x=>({...x,fingerprint:'tampered'}))}));
 // Adapter must do nothing when native capability is missing and never write after denial.
 const load=Module._load;let nativeModule=null;
 Module._load=function(name,...args){if(name==='react-native')return {Platform:{OS:'ios'}};if(name==='expo')return {requireOptionalNativeModule:()=>nativeModule};return load.call(this,name,...args);};
 const bridgeModule=require(path.join(temp,'utils/healthBridge.js'));Module._load=load;
 eq(bridgeModule.healthBridge(),null);nativeModule={available:()=>false};eq(bridgeModule.healthBridge(),null);
 let calls=[];const bridge={available:()=>true,authorizeExport:async kind=>{calls.push(['authorize',kind]);return false;},writeWeight:async(...args)=>{calls.push(['weight',...args]);return receipt;},writeWorkout:async(...args)=>{calls.push(['workout',...args]);return receipt;}};
 nativeModule=bridge;eq(bridgeModule.healthBridge(),bridge);
 await assert.rejects(()=>bridgeModule.sendHealthExport(bridge,prepared.record));assertions++;eq(calls,[['authorize','weight']]);
 calls=[];bridge.authorizeExport=async kind=>{calls.push(['authorize',kind]);return true;};
 eq(await bridgeModule.sendHealthExport(bridge,prepared.record),receipt);eq(calls[1],['weight','weight-one',80,Date.parse(request.at),1,prepared.record.fingerprint]);
 calls=[];await bridgeModule.sendHealthExport(bridge,preparedWorkout.record);eq(calls[1],['workout','work-one',Date.parse(workout.startedAt),Date.parse(workout.finishedAt),3300,1,preparedWorkout.record.fingerprint]);
 console.log(`PASS: ${assertions} FORM15 HealthKit nutrition/export checks. Pure JS + mocked native adapter; no native compile or YAZIO roundtrip claimed.`);
}finally{if(originalTZ===undefined)delete process.env.TZ;else process.env.TZ=originalTZ;fs.rmSync(temp,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exitCode=1;});
