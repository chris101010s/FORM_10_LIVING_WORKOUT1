// Standard unsigned IPA deliberately requires no HealthKit or App Group entitlements.
module.exports = ({config}) => {
  const health=process.env.FORM_HEALTHKIT==='1', widgets=process.env.FORM_WIDGETS==='1';
  const ios={...config.ios,entitlements:{...config.ios?.entitlements},infoPlist:{...config.ios?.infoPlist}};
  if(health){ios.entitlements['com.apple.developer.healthkit']=true;ios.infoPlist.FORMHealthKitEnabled=true;ios.infoPlist.NSHealthShareUsageDescription='Auf Wunsch ausgewählte Tageswerte aus Apple Health anzeigen und lokal übernehmen.';}
  const plugins=[...(config.plugins||[])];
  if(widgets){ios.infoPlist.FORMWidgetsEnabled=true;ios.infoPlist.NSSupportsLiveActivities=true;plugins.push(['expo-widgets',{bundleIdentifier:'app.athleteos.personal.widgets',groupIdentifier:'group.app.athleteos.personal',enablePushNotifications:false,widgets:[{name:'FORMTraining',displayName:'FORM Training',description:'Nächster geplanter Trainingstag und Wochenübersicht',ios:{supportedFamilies:['systemSmall','systemMedium']}}]}]);}
  return {...config,ios,plugins};
};
