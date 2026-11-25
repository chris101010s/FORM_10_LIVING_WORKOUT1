'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),{crc32}=require('node:zlib');
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const oldAlternate=/^FORM(?:Paper|Blueprint|Retro)(?:[0-9@/._~-]|$)/;
function noAlternates(value,scope){assert(value===undefined||object(value)&&Object.keys(value).length===0,`${scope} contains unexpected alternate icons`);}
/** Check the compiled plist. Modern iOS accepts an asset name without loose PNG names.
 * https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html
 */
function verifyPresentationInfo(info){
 assert(object(info),'Compiled Info.plist is invalid');
 assert.equal(info.CFBundleIdentifier,'app.athleteos.personal','Compiled bundle identifier changed');
 assert.equal(info.CFBundleShortVersionString,'15.0.0','Compiled marketing version changed');
 assert.equal(String(info.CFBundleVersion),'150004','Compiled build number is wrong');
 assert(Array.isArray(info.CFBundleURLTypes)&&info.CFBundleURLTypes.some(entry=>Array.isArray(entry.CFBundleURLSchemes)&&entry.CFBundleURLSchemes.includes('athleteos')),'Compiled athleteos URL scheme is missing');
 noAlternates(info.CFBundleAlternateIcons,'Info.plist');
 if(info.CFBundleIconName!==undefined)assert.equal(info.CFBundleIconName,'AppIcon','Unexpected primary asset catalog');
 const primaryIcons=[];
 const check=(icons,scope)=>{
  assert(object(icons)&&object(icons.CFBundlePrimaryIcon),`${scope} primary icon missing`);
  noAlternates(icons.CFBundleAlternateIcons,scope);
  const primary=icons.CFBundlePrimaryIcon,catalogName=primary.CFBundleIconName??info.CFBundleIconName,files=primary.CFBundleIconFiles??[];
  if(catalogName!==undefined)assert.equal(catalogName,'AppIcon',`${scope} must use the fixed primary AppIcon catalog`);
  assert(Array.isArray(files)&&files.every(name=>typeof name==='string'&&/^AppIcon[A-Za-z0-9@_.~-]*$/.test(name)&&!name.includes('..')),`${scope} primary icon file references are invalid`);
  assert(catalogName||files.length,`${scope} primary icon has no asset catalog or file reference`);
  primaryIcons.push({scope,catalogName:catalogName??null,files});
 };
 check(info.CFBundleIcons,'iPhone');
 if(info['CFBundleIcons~ipad']!==undefined)check(info['CFBundleIcons~ipad'],'iPad');
 return {version:info.CFBundleShortVersionString,build:String(info.CFBundleVersion),primaryIcons,alternates:[]};
}
function verifyPng(file){
 const bytes=fs.readFileSync(file);assert(bytes.length>=45&&bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a',`Primary icon is not a PNG: ${path.basename(file)}`);
 let header=false,image=false,end=false;
 for(let offset=8;offset+12<=bytes.length;){
  const length=bytes.readUInt32BE(offset),next=offset+12+length,type=bytes.toString('ascii',offset+4,offset+8);
  assert(next<=bytes.length,`Truncated primary icon: ${path.basename(file)}`);
  assert.equal(crc32(bytes.subarray(offset+4,offset+8+length))>>>0,bytes.readUInt32BE(offset+8+length),`Primary icon CRC mismatch: ${path.basename(file)}`);
  if(type==='IHDR'){assert(!header&&length===13,'Invalid primary icon header');const width=bytes.readUInt32BE(offset+8),height=bytes.readUInt32BE(offset+12);assert(width>0&&width===height&&width<=4096,'Primary icon dimensions are invalid');header=true;}
  if(type==='IDAT'&&length>0)image=true;
  if(type==='IEND'){assert.equal(length,0,'Invalid primary icon ending');end=true;break;}
  offset=next;
 }
 // CgBI may precede IHDR in Apple's optimized PNGs; those are intentionally accepted.
 assert(header&&image&&end,`Incomplete primary icon: ${path.basename(file)}`);
}
function readCompiledCatalog(file){return JSON.parse(cp.execFileSync('xcrun',['--sdk','iphoneos','assetutil','--info',file],{encoding:'utf8',maxBuffer:32*1024*1024}));}
function verifyPresentationBundle(app,info,{readCatalog=readCompiledCatalog}={}){
 const summary=verifyPresentationInfo(info),names=fs.readdirSync(app),verified=new Set();
 assert(!names.some(name=>oldAlternate.test(name)),'Obsolete alternate icon files remain in the app bundle');
 let catalog=null;
 const fromCatalog=reference=>{
  const file=path.join(app,'Assets.car');
  assert(fs.existsSync(file)&&fs.statSync(file).isFile()&&fs.statSync(file).size>0,'Primary icon asset is missing from bundle files and Assets.car');
  if(catalog===null){catalog=readCatalog(file);assert(Array.isArray(catalog),'Compiled asset catalog is invalid');assert(!catalog.some(entry=>oldAlternate.test(String(entry.Name??''))||oldAlternate.test(String(entry.RenditionName??''))),'Obsolete alternate icons remain in the compiled catalog');}
  const base=reference.replace(/\.png$/i,'');
  assert(catalog.some(entry=>{const name=String(entry.Name??''),rendition=String(entry.RenditionName??'');return (name==='AppIcon'||name.startsWith('AppIcon/')||name===base||rendition.startsWith(base))&&/icon|image/i.test(String(entry.AssetType??entry.Type??''))&&(Number(entry.PixelWidth)>0&&Number(entry.PixelHeight)>0||Number(entry.SizeOnDisk)>0);}),`Primary icon asset ${reference} is absent from the compiled catalog`);
 };
 for(const primary of summary.primaryIcons){
  for(const reference of primary.files.length?primary.files:['AppIcon']){
   const escaped=reference.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   const matcher=reference.endsWith('.png')?new RegExp(`^${escaped}$`):reference==='AppIcon'?/^AppIcon(?:\d+x\d+)?(?:@[1-4]x)?(?:~(?:iphone|ipad))?\.png$/:new RegExp(`^${escaped}(?:@[1-4]x)?(?:~(?:iphone|ipad))?\\.png$`);
   const matching=names.filter(name=>matcher.test(name));
   if(!matching.length)fromCatalog(reference);
   for(const name of matching){const file=path.join(app,name);assert(fs.statSync(file).isFile(),`Primary icon is not a file: ${name}`);verifyPng(file);verified.add(name);}
  }
 }
 return {...summary,verifiedIconFiles:[...verified],verifiedAssetCatalog:catalog!==null};
}
module.exports={verifyPresentationInfo,verifyPresentationBundle};
if(require.main===module){const app=process.argv[2];if(!app)throw Error('Usage: node scripts/verify-ios-presentation.cjs /path/to/App.app');const info=JSON.parse(cp.execFileSync('plutil',['-convert','json','-o','-',path.join(app,'Info.plist')],{encoding:'utf8'}));console.log('Compiled primary Ink icon and identity verified:',JSON.stringify(verifyPresentationBundle(app,info)));}
