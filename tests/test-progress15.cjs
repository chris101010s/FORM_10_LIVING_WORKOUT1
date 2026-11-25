const {execFileSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'form-progress15-'));
try{
 const src=path.resolve('src');execFileSync(path.resolve('node_modules/.bin/tsc'),['--target','ES2022','--module','commonjs','--strict','--skipLibCheck','--rootDir',src,'--outDir',tmp,path.join(src,'utils/progress15.ts')],{cwd:tmp,stdio:'inherit'});
 const P=require(path.join(tmp,'utils/progress15.js'));let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++};
 const set=(id,exerciseId,weightKg,reps,extra={})=>({id,exerciseId,weightKg,reps,at:'2026-11-24T12:01:00Z',...extra});
 const session=(id,date,sets)=>({id,name:'Identical label',startedAt:date+'T12:00:00Z',finishedAt:date+'T13:00:00Z',sets});
 const rows=[session('old','2025-01-01',[set('old','a',200,2)]),session('one','2026-11-01',[set('1','a',60,5),set('2','a',62,4,{isExtraSet:true}),set('w','a',90,10,{kind:'warmup'}),set('other','b',250,1)]),session('two','2026-11-24',[set('3','a',65,5),set('4','a',70,15),set('5','a',20,5,{kind:'assisted'}),set('6','body',0,20,{kind:'bodyweight'}),set('7','time',0,0,{kind:'timed',durationSeconds:45}),set('8','distance',0,0,{kind:'distance',distanceMeters:120})]),session('future','2026-12-01',[set('9','a',300,2)])];
 eq(P.exerciseSeries(rows,'a','load',30,'2026-11-25').map(p=>p.value),[62,70]);
 eq(P.exerciseSeries(rows,'a','volume',30,'2026-11-25').map(p=>p.value),[548,1375]);
 eq(P.exerciseSeries(rows,'a','e1rm',30,'2026-11-25').map(p=>Number(p.value.toFixed(2))),[70.27,75.83]);
 eq(P.exerciseSeries(rows,'a','load',30,'2026-11-25')[0].extraSets,1);
 eq(P.exerciseSeries(rows,'b','load',30,'2026-11-25').map(p=>p.value),[250]);
 eq(P.exerciseSeries(rows,'a','load',7,'2026-11-25').map(p=>p.sessionId),['two']);
 eq(P.exerciseSeries(rows,'a','load',0,'2026-11-25').map(p=>p.sessionId),['old','one','two']);
 eq(P.exerciseSeries(rows,'missing','load',0,'2026-11-25'),[]);
 eq(P.exerciseSeries(rows,'body','load',0,'2026-11-25'),[]);
 eq(P.exerciseSeries(rows,'body','reps',0,'2026-11-25').map(p=>p.value),[20]);
 eq(P.exerciseSeries(rows,'time','duration',0,'2026-11-25').map(p=>p.value),[45]);
 eq(P.exerciseSeries(rows,'distance','distance',0,'2026-11-25').map(p=>p.value),[120]);
 eq(P.exerciseSeries(rows,'time','reps',0,'2026-11-25'),[]);
 const corrected=rows.map(w=>w.id==='two'?{...w,sets:w.sets.filter(s=>s.id!=='4').map(s=>s.id==='3'?{...s,weightKg:66}:s)}:w);
 eq(P.exerciseSeries(corrected,'a','load',7,'2026-11-25').map(p=>p.value),[66]);
 eq(P.performanceExerciseIds(rows).includes('a'),true);eq(new Set(P.performanceExerciseIds(rows)).size,P.performanceExerciseIds(rows).length);
 console.log(`PASS: ${checks} progress assertions — stable IDs, real date filtering, corrections, suitable e1RM, warm-up/assist exclusion, independent units, no fabricated points.`);
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
