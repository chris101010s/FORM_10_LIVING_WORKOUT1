const {withXcodeProject,IOSConfig}=require('expo/config-plugins');

// Expo's generated Info.plist may use $(CURRENT_PROJECT_VERSION). Keep it aligned
// with ios.buildNumber without installing any alternate-icon catalogs or settings.
module.exports=function withBuildVersion(config){
 return withXcodeProject(config,mod=>{
  const build=mod.ios?.buildNumber;
  if(typeof build!=='string'||!/^\d+(?:\.\d+){0,2}$/.test(build))throw Error('ios.buildNumber must contain an explicit numeric build version.');
  const project=mod.modResults,projectName=IOSConfig.XcodeUtils.getProjectName(mod.modRequest.projectRoot);
  const app=IOSConfig.XcodeUtils.getApplicationNativeTarget({project,projectName});
  for(const [,configuration] of IOSConfig.XcodeUtils.getBuildConfigurationsForListId(project,app.target.buildConfigurationList))configuration.buildSettings.CURRENT_PROJECT_VERSION=build;
  return mod;
 });
};
