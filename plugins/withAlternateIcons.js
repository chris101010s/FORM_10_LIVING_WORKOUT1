const fs=require('node:fs');
const path=require('node:path');
const {withDangerousMod,withXcodeProject,IOSConfig}=require('expo/config-plugins');
const variants={paper:'FORMPaper',blueprint:'FORMBlueprint',retro:'FORMRetro'};

module.exports=function withAlternateIcons(config){
 config=withDangerousMod(config,['ios',async mod=>{
  const projectName=IOSConfig.XcodeUtils.getProjectName(mod.modRequest.projectRoot);
  const catalog=path.join(mod.modRequest.platformProjectRoot,projectName,'Images.xcassets');
  for(const [key,name] of Object.entries(variants)){
   const source=path.join(mod.modRequest.projectRoot,'assets','icons',`${key}.png`),bytes=fs.readFileSync(source);
   if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.readUInt32BE(16)!==1024||bytes.readUInt32BE(20)!==1024)throw Error(`App icon ${key} must be an actual 1024 × 1024 PNG.`);
   const folder=path.join(catalog,`${name}.appiconset`);fs.mkdirSync(folder,{recursive:true});fs.copyFileSync(source,path.join(folder,`${name}.png`));
   fs.writeFileSync(path.join(folder,'Contents.json'),JSON.stringify({images:[{filename:`${name}.png`,idiom:'universal',platform:'ios',size:'1024x1024'}],info:{author:'xcode',version:1}},null,2)+'\n');
  }
  return mod;
 }]);
 return withXcodeProject(config,mod=>{
  const project=mod.modResults,projectName=IOSConfig.XcodeUtils.getProjectName(mod.modRequest.projectRoot);
  const app=IOSConfig.XcodeUtils.getApplicationNativeTarget({project,projectName});
  for(const [,configuration] of IOSConfig.XcodeUtils.getBuildConfigurationsForListId(project,app.target.buildConfigurationList)){
   configuration.buildSettings.CURRENT_PROJECT_VERSION=String(mod.ios?.buildNumber||'1');
   configuration.buildSettings.ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES='"FORMPaper FORMBlueprint FORMRetro"';
   configuration.buildSettings.ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS='YES';
  }
  return mod;
 });
};
