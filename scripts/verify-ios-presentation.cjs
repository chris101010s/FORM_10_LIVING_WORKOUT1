'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),cp=require('node:child_process');
/** Verify compiled Info.plist output, not just app.json or source icon filenames. */
function verifyPresentationInfo(info){
 assert.equal(info.CFBundleIdentifier,'app.athleteos.personal','Compiled bundle identifier changed');
 assert.equal(info.CFBundleShortVersionString,'15.0.0','Compiled marketing version changed');
 assert.equal(String(info.CFBundleVersion),'150001','Compiled second-pass build number is wrong');
 const check=(icons,scope)=>{assert(icons&&icons.CFBundlePrimaryIcon,`${scope} primary icon missing`);for(const name of ['FORMPaper','FORMBlueprint','FORMRetro']){const entry=icons.CFBundleAlternateIcons?.[name];assert(entry,`${scope} ${name} missing from compiled alternate icons`);assert(Array.isArray(entry.CFBundleIconFiles)&&entry.CFBundleIconFiles.length>0,`${scope} ${name} has no generated icon files`);}};
 check(info.CFBundleIcons,'iPhone');if(info['CFBundleIcons~ipad'])check(info['CFBundleIcons~ipad'],'iPad');
 return {version:info.CFBundleShortVersionString,build:String(info.CFBundleVersion),alternates:['FORMPaper','FORMBlueprint','FORMRetro']};
}
module.exports={verifyPresentationInfo};
if(require.main===module){const app=process.argv[2];if(!app)throw Error('Usage: node scripts/verify-ios-presentation.cjs /path/to/App.app');const info=JSON.parse(cp.execFileSync('plutil',['-convert','json','-o','-',path.join(app,'Info.plist')],{encoding:'utf8'}));console.log('Compiled iOS presentation metadata verified:',JSON.stringify(verifyPresentationInfo(info)));}
