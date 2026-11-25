// Compile the actual JSX callback expressions against the reported RN Switch contract.
const ts=require('typescript'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
// The workshop now shares one Switch adapter. Test it and each actual Toggle callback.
const cases=[['src/components/NativeFeatures.tsx',3],['src/components/WidgetSync.tsx',2],['src/screens/More.tsx',1]];
const callbacks=[];
for(const [file,count] of cases){
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 let seen=0;
 function walk(n){if(ts.isJsxSelfClosingElement(n)&&n.tagName.getText(source)==='Switch'){
  const attr=n.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(source)==='onValueChange');
  assert(attr&&attr.initializer&&ts.isJsxExpression(attr.initializer)&&attr.initializer.expression,file);
  callbacks.push(attr.initializer.expression.getText(source));seen++;
 }if(file.endsWith('More.tsx')&&ts.isJsxSelfClosingElement(n)&&n.tagName.getText(source)==='Toggle'){
  const attr=n.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(source)==='onChange');
  assert(attr&&attr.initializer&&ts.isJsxExpression(attr.initializer)&&attr.initializer.expression,file);
  callbacks.push(attr.initializer.expression.getText(source));
 }ts.forEachChild(n,walk)}walk(source);assert.equal(seen,count,file);
}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'form-switch-'));
try{
 const schema=JSON.stringify(path.resolve('src/data/schema.ts').replace(/\.ts$/,''));
 const source=`import type {AthleteData} from ${schema};\ntype Handler=(value:boolean)=>void|Promise<void>;\ndeclare const onChange:(v:boolean)=>void;\ndeclare const update:(fn:(d:AthleteData)=>AthleteData)=>Promise<boolean>;\ndeclare const patch:(settings:Partial<AthleteData['settings']>)=>Promise<boolean>;\ndeclare const permissions:(fn:()=>void)=>Promise<void>;\ndeclare const auth:{change:(v:boolean)=>Promise<void>};\n`+callbacks.map((fn,i)=>`const handler${i}:Handler=${fn};`).join('\n');
 fs.writeFileSync(path.join(tmp,'switch.ts'),source);
 execFileSync('tsc',['--strict','--noEmit','--skipLibCheck','--target','ES2022','--module','commonjs','switch.ts'],{cwd:tmp,stdio:'inherit'});
 assert(fs.readFileSync('src/data/context.tsx','utf8').includes('=>Promise<boolean>'));
 console.log(`PASS: ${callbacks.length} actual Switch callbacks typechecked; persistence boolean contract preserved.`);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
