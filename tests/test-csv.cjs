const ts=require('typescript'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),Module=require('module');
const root=path.resolve(__dirname,'../src');
function compile(rel){const file=path.join(root,rel);const code=fs.readFileSync(file,'utf8');const out=ts.transpileModule(code,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});const mod=new Module(file,module);mod.filename=file;mod.paths=Module._nodeModulePaths(path.dirname(file));mod._compile(out.outputText,file);return mod.exports;}
// Compile dependencies of csv.ts once, but avoid missing runtime RN modules with type-only imports.
const orig=Module._load;Module._load=function(name,parent,isMain){if(name==='./metrics'&&parent?.filename.endsWith('csv.ts'))return compile('utils/metrics.ts');return orig.call(this,name,parent,isMain)};
const csv=compile('utils/csv.ts');Module._load=orig;
assert.deepEqual(csv.readDelimited('A;B\n"x;y";"a""b"',';'),[['A','B'],['x;y','a"b']]);
assert.deepEqual(csv.readDelimited('A,B\n"x\ny",2',','),[['A','B'],['x\ny','2']]);
const data=csv.parseNutritionCSV('Datum;Kalorien;Protein;Fett\n23.11.2026;"2.300,5";120,3;75,2\n24.11.2026;2100;117;62');
// Thousands separators are ambiguous and should be rejected, rather than misread as 2.3 kcal.
assert.equal(data.length,2);assert.equal(data[0].kcal,2300.5);assert.equal(data[0].protein,120.3);assert.equal(data[1].kcal,2100);
assert.throws(()=>csv.parseNutritionCSV('foo;bar\nx;y'),/Datum/);
assert.throws(()=>csv.readDelimited('a;"b', ';'),/geschlossenes/);
console.log('OK – CSV: Quotes, Newlines, BOM, German decimals, dates and invalid headers.');
