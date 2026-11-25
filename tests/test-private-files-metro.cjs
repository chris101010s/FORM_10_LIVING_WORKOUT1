// Executes the installed Metro module/import runtime. Native adapters are mocked;
// this regression proves the JS interop failure, not a native device launch.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const ts=require('typescript'),babel=require('@babel/core'),generate=require('@babel/generator').default,t=require('@babel/types');
const {importExportPlugin}=require('metro-transform-plugins');
const collectDependencies=require('metro/private/ModuleGraph/worker/collectDependencies').default;
const {wrapModule}=require('metro/private/ModuleGraph/worker/JsFileWrapping');
const repo=path.resolve(__dirname,'..'),asyncModule='metro-runtime/modules/asyncRequire';
const privateSource=fs.readFileSync(path.join(repo,'src/utils/privateFiles.ts'),'utf8');
const runtimeSource=fs.readFileSync(require.resolve('metro-runtime/polyfills/require'),'utf8');
const asyncSource=fs.readFileSync(require.resolve(asyncModule),'utf8');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'form-private-metro-'));
let checks=0;
function eq(actual,expected,message){assert.deepEqual(actual,expected,message);checks++;}
async function rejects(fn,expected){await assert.rejects(fn,expected);checks++;}

function metroHarness(){
 const context=vm.createContext({__DEV__:false,__METRO_GLOBAL_PREFIX__:'',console,Uint8Array,ArrayBuffer});
 context.global=context;vm.runInContext(runtimeSource,context,{filename:'installed-metro-require.js'});
 const ids=new Map();let nextId=1;
 function id(name){if(!ids.has(name))ids.set(name,nextId++);return ids.get(name);}
 function defineNative(name,exports,onLoad){context.__d((_global,_require,_default,_all,module)=>{onLoad?.();module.exports=exports;},id(name),[]);}
 function defineSource(name,source){
  // Strip only TS types first; preserve import() for Metro's real transformation.
  const js=ts.transpileModule(source,{fileName:name.endsWith('.ts')?name:'fixture.ts',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  const ast=babel.transformSync(js,{configFile:false,babelrc:false,ast:true,code:false,plugins:[[importExportPlugin,{importDefault:'_importDefault',importAll:'_importAll'}]]}).ast;
  const collected=collectDependencies(ast,{asyncRequireModulePath:asyncModule,dependencyMapName:'_dependencyMap',dynamicRequires:'reject',keepRequireNames:false,allowOptionalDependencies:false,inlineableCalls:['_importDefault','_importAll']});
  const wrapped=wrapModule(collected.ast,'_importDefault','_importAll',collected.dependencyMapName,'').ast;
  wrapped.program.body[0].expression.arguments.push(t.numericLiteral(id(name)),t.arrayExpression(collected.dependencies.map(d=>t.numericLiteral(id(d.name)))));
  vm.runInContext(generate(wrapped).code,context,{filename:name});
 }
 defineSource(asyncModule,asyncSource);
 return {defineNative,defineSource,load:name=>context.__r(id(name))};
}

function nativeAdapters(label,options={}){
 const base=path.join(temp,label);fs.mkdirSync(base,{recursive:true});
 const state={loads:[],getters:[],prepares:0,requests:[],failPrepare:options.failPrepare===true};
 const resolve=(parts)=>path.join(...parts.map(part=>typeof part==='string'?part.replace(/^file:\/\//,''):part.path));
 class Directory{
  constructor(...parts){this.path=resolve(parts);}
  get uri(){return 'file://'+this.path;}
  get exists(){return fs.existsSync(this.path);}
  create(){fs.mkdirSync(this.path,{recursive:true});}
  list(){return fs.readdirSync(this.path,{withFileTypes:true}).map(entry=>entry.isDirectory()?new Directory(this,entry.name):new File(this,entry.name));}
 }
 class File{
  constructor(...parts){this.path=resolve(parts);}
  get uri(){return 'file://'+this.path;}
  get exists(){return fs.existsSync(this.path);}
  get name(){return path.basename(this.path);}
  get size(){return this.exists?fs.statSync(this.path).size:0;}
  get parentDirectory(){return new Directory(path.dirname(this.path));}
  create(options){if(options.intermediates)this.parentDirectory.create();fs.closeSync(fs.openSync(this.path,options.overwrite?'w':'wx'));}
  async bytes(){return new Uint8Array(fs.readFileSync(this.path));}
  async write(bytes){fs.writeFileSync(this.path,bytes);}
  move(target,options){if(!options.overwrite&&target.exists)throw Error('test refuses overwrite');fs.renameSync(this.path,target.path);}
  delete(){fs.unlinkSync(this.path);}
 }
 const rn={Platform:{OS:options.platform??'ios'}};
 Object.defineProperty(rn,'PushNotificationIOS',{enumerable:true,get(){state.getters.push('PushNotificationIOS');throw Error('`new NativeEventEmitter()` requires a non-null argument.');}});
 const expo={requireOptionalNativeModule:name=>{state.requests.push(name);return options.native===false?null:{preparePrivateStorage:async()=>{state.prepares++;if(state.failPrepare){state.failPrepare=false;throw Error('synthetic prepare failure');}return {uri:'file://'+path.join(base,'native-private'),excludedFromBackup:true,protected:true};}};}};
 Object.defineProperty(expo,'unrelatedNativeExport',{enumerable:true,get(){state.getters.push('unrelatedNativeExport');throw Error('unrelated Expo native export must stay lazy');}});
 const modules={
  'expo-file-system':{File,Directory,Paths:{document:new Directory(base,'Documents')}},
  'react-native':rn,
  expo,
  'expo-crypto':{CryptoDigestAlgorithm:{SHA256:'SHA-256'},digest:async(algorithm,bytes)=>{assert.equal(algorithm,'SHA-256');const hash=crypto.createHash('sha256').update(bytes).digest();return Uint8Array.from(hash).buffer;}}
 };
 function install(h){for(const [name,value]of Object.entries(modules))h.defineNative(name,value,()=>{state.loads.push(name);});}
 return {state,install};
}

async function main(){
 // This is the original initialization expression from build 150002. Running it
 // through Metro must reach RN's dangerous enumerable lazy getter and reject.
 const old=metroHarness(),oldNative=nativeAdapters('old');oldNative.install(old);
 old.defineSource('old-initialization.ts',`export async function initialize(){const [{File,Directory,Paths},{Platform},{requireOptionalNativeModule},Crypto]=await Promise.all([import('expo-file-system'),import('react-native'),import('expo'),import('expo-crypto')]);return {File,Directory,Paths,Platform,requireOptionalNativeModule,Crypto};}`);
 await rejects(()=>old.load('old-initialization.ts').initialize(),/NativeEventEmitter.*non-null/);
 eq(oldNative.state.getters,['PushNotificationIOS','unrelatedNativeExport'],'the actual Metro import-all runtime evaluates both namespace getters');

 const h=metroHarness(),native=nativeAdapters('fixed');native.install(h);h.defineSource('privateFiles.ts',privateSource);
 const api=h.load('privateFiles.ts');
 eq(native.state.loads,[],'importing the path validator must not load any native module');
 eq(api.safePrivatePath('backups/snapshot_1.json'),'backups/snapshot_1.json');
 assert.throws(()=>api.safePrivatePath('../escape.json'),/Unzulässiger/);checks++;
 eq(native.state.loads,[],'pure validation remains usable outside React Native');
 const pending=api.privateFiles();eq(api.privateFiles(),pending,'concurrent startup callers share initialization');
 const files=await pending;eq(await api.privateFiles(),files,'completed adapter is reused');
 eq(native.state.loads,['expo-file-system','react-native','expo','expo-crypto']);
 eq(native.state.getters,[],'neither RN nor Expo unrelated lazy getters are evaluated');
 eq(native.state.prepares,1);eq(native.state.requests,['FormHealth']);
 eq({...files.protection},{excludedFromBackup:true,protected:true,location:'native-private'});
 const bytes=Uint8Array.from([0,1,2,250,255]);
 await files.writeNew('staging/snapshot.tmp',bytes);eq(Array.from(await files.read('staging/snapshot.tmp')),Array.from(bytes));
 await rejects(()=>files.writeNew('staging/snapshot.tmp',bytes),/EEXIST/);
 await files.move('staging/snapshot.tmp','backups/snapshot.json');
 eq(await files.exists('staging/snapshot.tmp'),false);eq(await files.exists('backups/snapshot.json'),true);
 eq(Array.from(await files.list('backups'),entry=>({...entry})),[{name:'snapshot.json',byteLength:5}]);
 eq(await files.sha256(bytes),crypto.createHash('sha256').update(bytes).digest('hex'));
 eq(files.uri('backups/snapshot.json'),'file://'+path.join(temp,'fixed','native-private','backups','snapshot.json'));
 await files.remove('backups/snapshot.json');eq(await files.exists('backups/snapshot.json'),false);
 await rejects(()=>files.read('backups/snapshot.json'),/fehlt/);
 eq(native.state.getters,[],'file operations never activate unrelated native modules');

 const retry=metroHarness(),retryNative=nativeAdapters('retry',{failPrepare:true});retryNative.install(retry);retry.defineSource('privateFiles.ts',privateSource);
 const retryAPI=retry.load('privateFiles.ts'),failed=retryAPI.privateFiles();eq(retryAPI.privateFiles(),failed);
 await rejects(()=>failed,/synthetic prepare failure/);
 const retried=await retryAPI.privateFiles();eq(retryNative.state.prepares,2,'failed initialization clears the cached promise');
 eq({...retried.protection},{excludedFromBackup:true,protected:true,location:'native-private'});eq(retryNative.state.getters,[]);

 for(const [label,options]of [['no-module',{native:false}],['android',{platform:'android'}]]){
  const fallback=metroHarness(),fallbackNative=nativeAdapters(label,options);fallbackNative.install(fallback);fallback.defineSource('privateFiles.ts',privateSource);
  const result=await fallback.load('privateFiles.ts').privateFiles();
  eq({...result.protection},{excludedFromBackup:false,protected:false,location:'app-private-fallback'});
  eq(result.uri('assets/photo.jpg'),'file://'+path.join(temp,label,'Documents','FORMPrivate','assets','photo.jpg'));
  eq(fallbackNative.state.prepares,0);eq(fallbackNative.state.getters,[]);
  eq(fallbackNative.state.requests,options.platform==='android'?[]:['FormHealth']);
 }
 console.log(`PASS private-files Metro regression: ${checks} checks (old dynamic namespace import rejects; actual fixed adapter succeeds; lazy pure import, file operations, retry and fallback preserved).`);
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>fs.rmSync(temp,{recursive:true,force:true}));
