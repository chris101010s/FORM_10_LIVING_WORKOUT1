import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'artifacts');fs.mkdirSync(out,{recursive:true});
const steps=[['check',['run','check']],['expo-config',['run','config:check']],['expo-dependencies',['exec','--no','--','expo','install','--check']],['expo-doctor',['run','doctor']]];
const report={startedAt:new Date().toISOString(),node:process.version,platform:process.platform,checks:[]};
for(const [name,args] of steps){
 const started=Date.now(),log=fs.createWriteStream(path.join(out,`${name}.log`));
 const command=`npm ${args.join(' ')}`;log.write(`$ ${command}\n`);
 const child=spawn(process.platform==='win32'?'npm.cmd':'npm',args,{cwd:root,env:{...process.env,CI:'1',EXPO_NO_TELEMETRY:'1'},stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',chunk=>{process.stdout.write(chunk);log.write(chunk);});child.stderr.on('data',chunk=>{process.stderr.write(chunk);log.write(chunk);});
 const exitCode=await new Promise(resolve=>{child.on('error',error=>{log.write(String(error));resolve(127);});child.on('close',code=>resolve(code??1));});
 log.end(`\nEXIT_CODE=${exitCode}\n`);
 report.checks.push({name,command,exitCode,elapsedMs:Date.now()-started,log:`${name}.log`});
 fs.writeFileSync(path.join(out,'check-status.json'),JSON.stringify(report,null,2)+'\n');
 if(exitCode!==0){process.exitCode=exitCode;break;}
}
