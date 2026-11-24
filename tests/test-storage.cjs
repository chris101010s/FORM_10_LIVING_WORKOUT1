const ts=require('typescript'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module');
const dir=path.resolve(__dirname,'../src/data'),files=new Map();
const db=new Map();let failWrites=false;
// Both TypeScript 5 and TypeScript 6 may apply ESM/CJS default-import interop.
// The real Expo module exposes a default export; our mock must do the same.
const KV={getItem:async k=>db.get(k)??null,setItem:async(k,v)=>{if(failWrites)throw Error('disk full');db.set(k,v)}};
const KV_ESM={__esModule:true,default:KV};
function load(name){if(files.has(name))return files.get(name);const file=path.join(dir,name+'.ts');const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const mod=new Module(file,module);mod.filename=file;mod.paths=Module._nodeModulePaths(dir);const prev=Module._load;Module._load=function(req,parent,isMain){if(req==='expo-sqlite/kv-store')return KV_ESM;if(req.startsWith('.')&&parent?.filename===file)return load(path.relative(dir,path.resolve(path.dirname(file),req)));return prev.call(this,req,parent,isMain)};try{mod._compile(js,file)}finally{Module._load=prev}files.set(name,mod.exports);return mod.exports;}
const {emptyData}=load('schema'),{saveData,loadData}=load('storage');
(async()=>{
 let count=0;const eq=(a,b)=>{count++;assert.deepEqual(a,b)};
 const one=emptyData();one.profile.onboarded=true;
 await saveData(one);eq(db.has('athlete-os-v4-data'),true);
 const two={...one,weights:[{id:'first',date:'2026-11-20',kg:93}]};
 await saveData(two);
 eq(JSON.parse(db.get('athlete-os-recovery-v1')).weights.length,0);
 eq(JSON.parse(db.get('athlete-os-v4-data')).weights.length,1);
 await loadData();eq(JSON.parse(db.get('athlete-os-v7-original')).weights[0].kg,93);
 db.set('athlete-os-v4-data','not JSON');
 const recovered=await loadData();eq(recovered.weights.length,0);
 eq(db.get('athlete-os-v4-data'),'not JSON'); // load must NEVER overwrite a corrupt record
 await saveData(recovered);eq(JSON.parse(db.get('athlete-os-v4-data')).weights.length,0); // explicit valid write repairs corrupted primary
 failWrites=true;
 await assert.rejects(()=>saveData(two),/disk full/);count++;
 failWrites=false;
 await saveData(two);eq(JSON.parse(db.get('athlete-os-v4-data')).weights[0].kg,93);
 eq(JSON.parse(db.get('athlete-os-v7-original')).weights[0].kg,93);
 console.log(`PASS: ${count} Speicher-/Recovery-Fälle mit simuliertem Schreibfehler.`);
})().catch(e=>{console.error(e);process.exitCode=1});
