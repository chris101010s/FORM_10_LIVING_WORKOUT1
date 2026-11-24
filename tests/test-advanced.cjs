const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const ts=require('typescript');
// Execute the real app utility modules, transpiled to CommonJS; no mocked calculations.
require.extensions['.ts']=(mod,filename)=>{
 const source=fs.readFileSync(filename,'utf8');
 const out=ts.transpileModule(source,{fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 mod._compile(out.outputText,filename);
};
const {emptyData}=require('../src/data/schema.ts');
const {validateRestoredData}=require('../src/data/validation.ts');
const util=require('../src/utils/advanced.ts');
const {workoutVolume,suggestedSet}=require('../src/utils/workout.ts');
const {dateKey}=require('../src/utils/metrics.ts');
const base=emptyData();let n=0;
function check(actual,expected,msg){n++;assert.deepEqual(actual,expected,msg)}
function fail(fn,pattern){n++;assert.throws(fn,pattern)}
check(base.measurements,[]);check(base.goals,[]);check(base.weeklyPlan,[]);check(base.recovery,[]);
check(util.currentCalendarWeek('2026-11-24'),{start:'2026-11-23',end:'2026-11-29'});
const w1={id:'w1',name:'Upper',startedAt:'2026-11-23T09:00:00Z',finishedAt:'2026-11-23T10:00:00Z',sets:[{id:'s1',exerciseId:'bench',weightKg:40,reps:8,at:'2026-11-23T09:10:00Z',kind:'work'},{id:'s2',exerciseId:'bench',weightKg:20,reps:10,at:'2026-11-23T09:00:00Z',kind:'warmup'}]};
const w2={id:'w2',name:'Upper',startedAt:'2026-11-24T09:00:00Z',finishedAt:'2026-11-24T10:00:00Z',sets:[{id:'s3',exerciseId:'bench',weightKg:45,reps:8,at:'2026-11-24T09:10:00Z',kind:'work'}]};
const d={...base,workouts:[w1,w2],weeklyPlan:[{day:1,routineId:null},{day:2,routineId:null},{day:6,routineId:null}],performance:[{id:'p1',kind:'Push-ups',value:12,unit:'Wiederholungen',date:'2026-11-23'}],measurements:[{id:'m1',date:'2026-11-23',metric:'waist',cm:91}],recovery:[{id:'z1',date:'2026-11-23',sleepHours:7.5,energy:4,soreness:2}],weights:[{id:'a',date:'2026-11-22',kg:90},{id:'b',date:'2026-11-24',kg:89}]};
check(workoutVolume(w1.sets),320,'Warmups must not count in volume');
check(util.weeklyAdherence(d,'2026-11-24'),{expected:2,actual:2,plannedTotal:3});
check(util.weeklyTrainingMinutes(d,'2026-11-24'),120);
check(util.exerciseHistory(d.workouts,'bench').map(p=>p.bestKg),[40,45]);
check(util.personalRecords(d)[0].totalSets,2);
check(util.balanceSummary(d,28,'2026-11-24').totalSets,2);
check(util.sleepSummary(d,7,'2026-11-24'),{average:7.5,entries:1});
check(util.goalProgress(d,{id:'g',metric:'pushups',target:20}).current,12);
check(util.goalProgress(d,{id:'g',metric:'weight',target:85}).direction,'down');
check(util.goalProgress(d,{id:'g',metric:'weight',target:95}).direction,'up');
check(util.goalProgress(d,{id:'g',metric:'workouts',target:3}).reached,false);
check(util.isNewBest([{...w1.sets[0],weightKg:50}],d.workouts,'bench'),true);
check(util.isNewBest([{...w1.sets[0],weightKg:50},{...w1.sets[0],id:'new',weightKg:40}],d.workouts,'bench'),false);
check(util.isNewBest([{...w1.sets[1],weightKg:200}],d.workouts,'bench'),false,'Warmup never a PR');
check(suggestedSet(d.workouts,{id:'live',exerciseIds:['bench'],sets:[w1.sets[0],w1.sets[1]]},'bench').weightKg,40,'workset over warmup suggestion');
const normalized=validateRestoredData(d);
check(normalized.measurements[0].cm,91);check(normalized.recovery[0].sleepHours,7.5);check(normalized.weeklyPlan.length,3);
const old={...base};delete old.measurements;delete old.goals;delete old.weeklyPlan;delete old.recovery;
const migrated=validateRestoredData(old);
check(migrated.measurements.length,0);check(migrated.recovery.length,0);check(migrated.goals.length,0);check(migrated.weeklyPlan.length,0);
fail(()=>validateRestoredData({...base,measurements:[{id:'m',date:'2026-11-24',metric:'waist',cm:-8}]}),/measurements/);
fail(()=>validateRestoredData({...base,recovery:[{id:'r',date:'2026-11-24',sleepHours:40}]}),/recovery/);
fail(()=>validateRestoredData({...base,goals:[{id:'g',metric:'lift',target:60}]}),/goals/);
fail(()=>validateRestoredData({...base,weeklyPlan:[{day:1,routineId:null},{day:1,routineId:null}]}),/Doppelter Tag/);
fail(()=>validateRestoredData({...base,workouts:[{...w1,finishedAt:'2026-11-23T08:00:00Z'}]}),/workouts/);
console.log(`PASS ${n} checks: recovery, measurements, goals, weekly plans, PR, editing/legacy structure, validation`);
