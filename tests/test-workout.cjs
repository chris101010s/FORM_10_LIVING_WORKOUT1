const {execFileSync}=require('node:child_process'),path=require('node:path'),fs=require('node:fs'),os=require('node:os'),assert=require('node:assert/strict');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'athlete-v6-'));
try {
 // Isolate the compilation from ATHLETE OS's tsconfig.json.
 // TypeScript 6 otherwise raises TS5112 when explicit file arguments are given.
 const srcDir=path.join(__dirname,'..','src');
 execFileSync('tsc',['--target','ES2022','--module','commonjs','--skipLibCheck',
   '--rootDir',srcDir,'--outDir',tmp,
   path.join(srcDir,'utils','workout.ts'),
   path.join(srcDir,'data','schema.ts'),
   path.join(srcDir,'data','validation.ts'),
   path.join(srcDir,'utils','metrics.ts')],{cwd:tmp,stdio:'inherit'});
 const logic=require(path.join(tmp,'utils','workout.js'));
 const sets=[{id:'s1',exerciseId:'squat',weightKg:75,reps:8,at:'2026-11-02T11:00:00Z',rir:2},{id:'s2',exerciseId:'bench',weightKg:50,reps:10,at:'2026-11-02T11:05:00Z'}];
 const history=[{id:'w1',name:'Workout',startedAt:'2026-11-02T10:00:00Z',finishedAt:'2026-11-02T11:00:00Z',sets},{id:'w2',name:'Workout',startedAt:'2026-11-10T10:00:00Z',finishedAt:'2026-11-10T11:00:00Z',sets:[{id:'s3',exerciseId:'squat',weightKg:80,reps:6,at:'2026-11-10T10:10:00Z'}]}];
 let count=0;function eq(a,b){count++;assert.deepEqual(a,b)};
 eq(logic.suggestedSet(history,null,'squat'),{weightKg:80,reps:6,rir:undefined});
 eq(logic.suggestedSet(history,{sets:[{id:'live1',exerciseId:'squat',weightKg:82.5,reps:6,at:'2026-11-10T11:30:00Z'}]},'squat'),{weightKg:82.5,reps:6,rir:undefined});
 eq(logic.suggestedSet(history,null,'lat'),null);eq(logic.workoutVolume(sets),1100);
 eq(logic.weeklyWorkouts(history).map(w=>w.week),['2026-11-02','2026-11-09']);
 eq(logic.weeklyWorkouts(history).map(w=>w.sessions),[1,1]);
 eq(logic.recentWeeklyWorkouts(history,'2026-11-24',4).map(w=>w.sessions),[1,1,0,0]);
 eq(Math.round(logic.bestEstimated1RM(history,'squat')),96);
 eq(logic.bestEstimated1RM(history,'pullup'),null);
 eq(logic.safeRestSeconds(5000),600);eq(logic.safeRestSeconds(0),15);eq(logic.safeRestSeconds(NaN),90);
 console.log(`PASS: ${count} Workout-Vorwert-, Progressions- und Wochenstatistikprüfungen.`);
} finally { fs.rmSync(tmp,{recursive:true,force:true}); }
