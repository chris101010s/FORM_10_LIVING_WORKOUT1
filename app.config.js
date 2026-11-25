// App identity and data container stay unchanged; optional native capabilities require their own signing.
module.exports = ({config}) => {
  const health=process.env.FORM_HEALTHKIT==='1', widgets=process.env.FORM_WIDGETS==='1';
  const ios={...config.ios,entitlements:{...config.ios?.entitlements},infoPlist:{...config.ios?.infoPlist}};
  if(health){
    ios.entitlements['com.apple.developer.healthkit']=true;
    ios.infoPlist.FORMHealthKitEnabled=true;
    ios.infoPlist.NSHealthShareUsageDescription='Auf Wunsch Nahrungsenergie, Makronährstoffe, Wasser und ausgewählte Tageswerte aus Apple Health lokal anzeigen.';
    ios.infoPlist.NSHealthUpdateUsageDescription='Nur nach deiner ausdrücklichen Auswahl ein Körpergewicht oder ein abgeschlossenes Training an Apple Health übertragen.';
  }else{
    delete ios.entitlements['com.apple.developer.healthkit'];
    delete ios.entitlements['com.apple.developer.healthkit.access'];
    delete ios.entitlements['com.apple.developer.healthkit.background-delivery'];
    delete ios.infoPlist.FORMHealthKitEnabled;
    delete ios.infoPlist.NSHealthShareUsageDescription;
    delete ios.infoPlist.NSHealthUpdateUsageDescription;
  }
  // Timers/reminders use local notifications; APNs is not part of either release mode.
  delete ios.entitlements['aps-environment'];
  const plugins=(config.plugins||[]).filter(plugin=>(Array.isArray(plugin)?plugin[0]:plugin)!=='expo-widgets');
  if(widgets){
    ios.infoPlist.FORMWidgetsEnabled=true;ios.infoPlist.NSSupportsLiveActivities=true;
    plugins.push(['expo-widgets',{bundleIdentifier:'app.athleteos.personal.widgets',groupIdentifier:'group.app.athleteos.personal',enablePushNotifications:false,widgets:[{name:'FORMTraining',displayName:'FORM Training',description:'Nächster geplanter Trainingstag und Wochenübersicht',ios:{supportedFamilies:['systemSmall','systemMedium']}}]}]);
  }else{
    delete ios.infoPlist.FORMWidgetsEnabled;delete ios.infoPlist.NSSupportsLiveActivities;
    if(Array.isArray(ios.entitlements['com.apple.security.application-groups'])){
      const groups=ios.entitlements['com.apple.security.application-groups'].filter(group=>group!=='group.app.athleteos.personal');
      if(groups.length)ios.entitlements['com.apple.security.application-groups']=groups;else delete ios.entitlements['com.apple.security.application-groups'];
    }
  }
  return {...config,ios,plugins};
};
