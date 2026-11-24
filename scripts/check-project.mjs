import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
import {readdirSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const base=process.cwd(),files=[];
function visit(dir){for(const e of readdirSync(dir,{withFileTypes:true})){if(e.isDirectory()){if(!['node_modules','.git','artifacts','ios','android'].includes(e.name))visit(path.join(dir,e.name));}else if(/\.tsx?$/.test(e.name))files.push(path.join(dir,e.name));}}
visit(path.join(base,'src'));if(existsSync(path.join(base,'modules')))visit(path.join(base,'modules'));files.push(path.join(base,'App.tsx'));
let errs=0, checkedImports=0;
const pkg=JSON.parse(readFileSync(path.join(base,'package.json'),'utf8'));
const deps={...pkg.dependencies,...pkg.devDependencies};
const candidates=(p)=>[p,p+'.ts',p+'.tsx',p+'.js',p+'.json',path.join(p,'index.ts'),path.join(p,'index.tsx'),path.join(p,'index.js')];
function checkImport(file,spec){
 checkedImports++;
 if(spec.startsWith('.')){
  const absolute=path.resolve(path.dirname(file),spec);
  if(!candidates(absolute).some(existsSync)){console.error('Import ohne Quelldatei:',path.relative(base,file),'->',spec);errs++;}
 }else if(!spec.startsWith('node:')){
  const root=spec.startsWith('@')?spec.split('/').slice(0,2).join('/'):spec.split('/')[0];
  if(!Object.hasOwn(deps,root)){console.error('Abhängigkeit nicht in package.json:',path.relative(base,file),'->',root);errs++;}
 }
}
for(const file of files){const code=readFileSync(file,'utf8');const result=ts.transpileModule(code,{fileName:file,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});const messages=(result.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);if(messages.length){console.error(file,messages.map(m=>m.messageText));errs+=messages.length;}
 const source=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 for(const statement of source.statements){
  if((ts.isImportDeclaration(statement)||ts.isExportDeclaration(statement))&&statement.moduleSpecifier&&ts.isStringLiteral(statement.moduleSpecifier)) checkImport(file,statement.moduleSpecifier.text);
 }
}
console.log(`${files.length} TypeScript-/TSX-Quelldateien und ${checkedImports} Importpfade geprüft: ${errs} Fehler`);if(errs)process.exitCode=1;
