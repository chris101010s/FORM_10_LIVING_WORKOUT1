const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'form-art-'));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const ink=d=>`${d.wash?`<path d="${d.wash}" fill="#FFE48A" fill-opacity=".68"/>`:''}${d.paths.map((p,i)=>`<path d="${p}" fill="none" stroke="#1D2025" stroke-width="${i===0?2.5:i%2?1.8:2.1}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}${(d.detail??[]).map(p=>`<path d="${p}" fill="none" stroke="#2655D9" stroke-width="1.7" stroke-linecap="round"/>`).join('')}`;
const svg=d=>`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${ink(d)}</svg>`;
try{
 execFileSync(path.join(root,'node_modules/.bin/tsc'),['--target','ES2022','--module','commonjs','--strict','--skipLibCheck','--rootDir',path.join(root,'src'),'--outDir',tmp,path.join(root,'src/art/registry.ts')],{cwd:tmp,stdio:'inherit'});
 const {assetRegistry,categoryRegistry,tabRegistry}=require(path.join(tmp,'art/registry.js'));
 const all=[...assetRegistry,...categoryRegistry,...tabRegistry];
 fs.mkdirSync(path.join(root,'assets/art'),{recursive:true});fs.mkdirSync(path.join(root,'docs/design'),{recursive:true});fs.mkdirSync(path.join(root,'assets/tabs'),{recursive:true});
 for(const a of all)fs.writeFileSync(path.join(root,a.localSvg),svg(a.drawing));
 const width=1120,height=90+Math.ceil(all.length/7)*152;
 const sheet=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#FAF9F3"/><text x="24" y="35" font-family="sans-serif" font-size="22" font-weight="bold" fill="#1D2025">FORM 15 · Original vector asset sheet</text><text x="24" y="61" font-family="sans-serif" font-size="12" fill="#606369">48 motifs · 16 Pip poses included · 10 equipment categories · 6 tabs × 2 states · source-rendered, not app screenshots</text>${all.map((a,i)=>{const x=24+(i%7)*156,y=90+Math.floor(i/7)*152;return `<g transform="translate(${x},${y})"><rect width="146" height="142" rx="3" fill="#FFFEFB" stroke="#D9D8D0"/><g transform="translate(23,4)">${ink(a.drawing)}</g><text x="7" y="118" font-family="sans-serif" font-size="10" fill="#1D2025">${escape(a.id)}</text><text x="7" y="133" font-family="sans-serif" font-size="8" fill="#606369">FORM original · local SVG</text></g>`}).join('')}</svg>`;
 fs.writeFileSync(path.join(root,'docs/design/FORM_15_SECOND_PASS_ASSET_SHEET.svg'),sheet);
 const manifest=all.map(a=>({id:a.id,source:a.source,file:a.localSvg,license:a.license,use:a.use,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.localSvg))).digest('hex'),pathSha256:crypto.createHash('sha256').update(JSON.stringify(a.drawing.paths)).digest('hex')}));
 fs.writeFileSync(path.join(root,'assets/art/manifest.json'),JSON.stringify({version:'15.0.0',build:Number(require('../app.json').expo.ios.buildNumber),motifs:48,categories:10,tabStates:12,assets:manifest},null,2)+'\n');
 for(const a of tabRegistry){const name=a.id.slice(4);for(const scale of [1,2,3])execFileSync('inkscape',[path.join(root,a.localSvg),'--export-type=png',`--export-filename=${path.join(root,'assets/tabs',name+(scale===1?'':`@${scale}x`)+'.png')}`,`--export-width=${24*scale}`,`--export-height=${24*scale}`],{stdio:'pipe'});}
 execFileSync('inkscape',[path.join(root,'docs/design/FORM_15_SECOND_PASS_ASSET_SHEET.svg'),'--export-type=png',`--export-filename=${path.join(root,'docs/design/FORM_15_SECOND_PASS_ASSET_SHEET.png')}`],{stdio:'pipe'});
 console.log(`Generated ${all.length} source-derived SVG assets, 36 scale-correct tab PNGs, manifest and real asset sheet.`);
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
