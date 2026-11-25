const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const filename=path.resolve(__dirname,'../src/utils/shareTextExport.ts'),compiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
let checks=0;
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;},ok=(a,message)=>{assert.ok(a,message);checks++;},reject=async(fn,pattern)=>{await assert.rejects(fn,pattern);checks++;};
function adapter(flags={}){
 const files=new Map(),events=[],shares=[];let sequence=0;
 class File{
  constructor(directory,name){this.uri=directory+'/'+name;events.push('construct');}
  get exists(){return files.has(this.uri);}
  create(options){events.push('create');assert.equal(options.overwrite,false);assert.equal(this.exists,false);files.set(this.uri,'');if(flags.create)throw Error('synthetic partial create failure');}
  async write(text){events.push('write-start');await new Promise(resolve=>{setImmediate(resolve);});files.set(this.uri,text);events.push('write-finished');if(flags.write)throw Error('synthetic write failure');}
  async text(){events.push('readback');if(flags.read)throw Error('synthetic readback failure');return files.get(this.uri)+(flags.mismatch?'damaged':'');}
  delete(){events.push('delete');if(flags.remove)throw Error('synthetic removal failure');if(!flags.noRemove)files.delete(this.uri);}
 }
 const module={exports:{}},Sharing={isAvailableAsync:async()=>{events.push('available');return !flags.unavailable;},shareAsync:async(uri,options)=>{events.push(flags.cancel?'cancel':'share');shares.push({uri,options,text:files.get(uri)});if(flags.share)throw Error('synthetic sharing failure');}};
 vm.runInNewContext(compiled,{module,exports:module.exports,require:name=>{if(name==='expo-file-system')return {File,Paths:{cache:'file:///private/cache'}};if(name==='expo-crypto')return {randomUUID:()=>`00000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`};if(name==='expo-sharing')return Sharing;throw Error('Unexpected adapter dependency '+name);}},{filename});
 return {run:module.exports.shareTextExport,files,events,shares};
}
async function main(){
 const text='Synthetischer Export · äöü 🏈',success=adapter();await success.run('FORM_Backup.json',text,'application/json','Bewusst teilen');eq(success.events,['construct','create','write-start','write-finished','readback','available','share','delete']);eq(success.shares[0].text,text);eq(success.shares[0].options.mimeType,'application/json');eq(success.shares[0].options.dialogTitle,'Bewusst teilen');eq(success.files.size,0);
 const concurrent=adapter();await Promise.all([concurrent.run('report.csv','first','text/csv'),concurrent.run('report.csv','second','text/csv')]);eq(new Set(concurrent.shares.map(s=>s.uri)).size,2,'same requested basename gets a unique file per operation');eq(concurrent.shares.map(s=>s.text).sort(),['first','second']);eq(concurrent.files.size,0);eq(concurrent.events.filter(e=>e==='delete').length,2);
 for(const [flag,pattern,shared] of [['mismatch',/nicht vollständig/,0],['read',/readback failure/,0],['write',/write failure/,0],['unavailable',/nicht verfügbar/,0],['share',/sharing failure/,1],['create',/partial create failure/,0]]){const a=adapter({[flag]:true});await reject(()=>a.run('test.json',text,'application/json'),pattern);eq(a.files.size,0,flag+': no file retained');eq(a.events.filter(e=>e==='delete').length,1,flag+': cleanup performed');eq(a.shares.length,shared,flag+': sharing only after readback/availability');}
 const cancelled=adapter({cancel:true});await cancelled.run('cancelled.csv',text,'text/csv');ok(cancelled.events.includes('cancel'),'resolved system cancellation');eq(cancelled.files.size,0);eq(cancelled.events.at(-1),'delete');
 for(const name of ['../private.json','folder/file.json','folder\\file.json','/absolute.json','%2e%2e.json','.hidden.json','','x'.repeat(121)]){const a=adapter();await reject(()=>a.run(name,text,'application/json'),/Exportdateiname/);eq(a.events,[],'invalid basename has no filesystem/share side effects');eq(a.files.size,0);}
 for(const flag of ['remove','noRemove']){const removal=adapter({[flag]:true});await reject(()=>removal.run('cleanup.json',text,'application/json'),/konnte nicht entfernt/);eq(removal.shares.length,1);eq(removal.files.size,1,'a physical cleanup failure is explicitly reported, never claimed successful');removal.files.clear();}
 console.log(`PASS: ${checks} transient text-export assertions: awaited write/readback, distinct concurrent files, unavailable/cancel/share/write/read/create failures, basename rejection and explicit cleanup failure. Expo filesystem/share/UUID adapters are controlled; no device claim.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
