// Run with Node & TypeScript; tests real in-app catalog functions, no fake reimplementation.
const ts=require('typescript'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module');
const source=fs.readFileSync(path.join(__dirname,'../src/catalog/catalog.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,resolveJsonModule:true,esModuleInterop:true,strict:true},reportDiagnostics:true});
assert.equal((compiled.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0,'catalog.ts syntax errors');
const file=path.join(__dirname,'../src/catalog/catalog.ts');
const mod=new Module(file,module);mod.filename=file;mod.paths=Module._nodeModulePaths(path.dirname(file));
const originalRequire=mod.require.bind(mod);
mod.require=(key)=>key==='expo-sqlite/kv-store'?{getItem:async()=>null,setItem:async()=>{}}:originalRequire(key);
mod._compile(compiled.outputText,file);const c=mod.exports;
const raw=[
 {id:'Bench_Press',name:'Barbell Bench Press',equipment:'barbell',primaryMuscles:['chest'],secondaryMuscles:['triceps'],level:'beginner',category:'strength',instructions:['Keep your back supported.'],images:['Bench_Press/0.jpg']},
 {id:'Full_Squat',name:'Barbell Full Squat',equipment:'barbell',primaryMuscles:['quadriceps'],secondaryMuscles:['glutes'],level:'beginner',category:'strength',instructions:['Brace trunk.'],images:[]}
];
assert.throws(()=>c.normalizeOfficialCatalog(raw),/unvollständiges Update|Nur 2 Übungen/);
assert.equal(c.filterCatalog(c.starterCatalog,'bankdrücken','Alle','Alle').length>=1,true);
assert(c.filterCatalog(c.starterCatalog,'kniebeugen','Alle','Alle').length>=1);
assert(c.filterCatalog(c.starterCatalog,'latzug','Alle','Alle').length>=1);
assert(c.filterCatalog(c.starterCatalog,'','chest','barbell').length>=1);
assert.equal(c.filterCatalog(c.starterCatalog,'','no-such-muscle','Alle').length,0);
assert(c.filterCatalog(c.starterCatalog,'liegestütze','Alle','Alle').length>=1);
assert.equal(c.filterCatalog(c.starterCatalog,'','Alle','Alle',3000).length,c.starterCatalog.length);
assert.equal(c.starterCatalog.every(e=>e.id&&e.name&&Array.isArray(e.primaryMuscles)),true);
assert.equal(c.normalized('KÖRPERGEWICHT Liegestütze'),'korpergewicht liegestutze');
assert(c.starterCatalog.length>=220,'Offline fallback should contain >200 catalog entries');
assert.equal(new Set(c.starterCatalog.map(e=>e.id)).size,c.starterCatalog.length,'Stable unique IDs');
console.log('OK – Katalogtests: echte Suchlogik, DE-Synonyme, Filter, Daten-Validator und Startbestand.');
