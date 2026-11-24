/* Compile the real TS logic and run reproducible assertions with Node. */
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const assert=require('node:assert/strict');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'athlete-logic-'));
try{
 // Run the isolated compilation outside the app's tsconfig directory.
 // TypeScript 6 rejects passing source files while a tsconfig.json is present
 // (TS5112); this method also works with TypeScript 5.x.
 const srcDir=path.join(__dirname,'..','src');
 execFileSync('tsc',['--target','ES2022','--module','commonjs','--skipLibCheck',
   '--rootDir',srcDir,'--outDir',temp,
   path.join(srcDir,'utils','metrics.ts'),path.join(srcDir,'data','schema.ts')],
   {cwd:temp,stdio:'inherit'});
 const m=require(path.join(temp,'utils','metrics.js'));
 const e=[{id:'1',date:'2026-01-01',kg:100},{id:'2',date:'2026-01-08',kg:99},{id:'3',date:'2026-01-16',kg:98},{id:'4',date:'2026-01-23',kg:97}];
 assert.equal(m.validWeight(100),true);assert.equal(m.validWeight(null),false);assert.equal(m.numberInput('82,5'),82.5);assert.equal(m.numberInput(''),null);assert.equal(m.numberInput('12abc'),null);
 assert.equal(m.sortedWeight([...e].reverse())[0].date,'2026-01-01');
 assert.equal(m.rollingWeight(e)[1].average,99); // exactly 7 days apart, excludes Jan 1
 assert(m.rateKgPerWeek(e)<0);assert(m.projectedWeeks(e,85)>0);
 assert.equal(m.projectedWeeks(e.slice(0,1),85),null);
 assert.equal(m.estimatedOneRepMax(60,10),80);assert.equal(m.estimatedOneRepMax(60,20),null);
 assert.equal(m.latestExerciseSets([{id:'w',name:'x',startedAt:'2026-01-01',finishedAt:'2026-01-02',sets:[{id:'s',exerciseId:'bench',weightKg:60,reps:8,at:'2026-01-01'}]}],'bench')[0].weightKg,60);
 assert.equal(m.validateDate('2026-02-30'),false);assert.equal(m.validateDate('2026-02-28'),true);
 const scan=m.parseBodyScanText('Körperfett: 23,4 %\nMuskelmasse: 42.8 kg\nGewicht: 96,2 kg\nGrundumsatz 2120');
 assert.equal(scan.bodyFat,23.4);assert.equal(scan.muscleKg,42.8);assert.equal(scan.weightKg,96.2);assert.equal(scan.bmr,2120);
 assert.equal(m.distancePace(30,5),'6:00 min/km');
 console.log('PASS: 17 Prüfschritte – Zahlen, Datum, Trends, Scan-Parser, Vorwerte, Cardio');
}finally{fs.rmSync(temp,{recursive:true,force:true})}
