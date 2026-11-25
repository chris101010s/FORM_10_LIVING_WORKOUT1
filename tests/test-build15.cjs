const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),{crc32}=require('node:zlib');
const configure=require('../app.config.js');
const old={health:process.env.FORM_HEALTHKIT,widgets:process.env.FORM_WIDGETS};
let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++;};const ok=x=>{assert.ok(x);count++;};const rejects=(fn,pattern)=>{assert.throws(fn,pattern);count++;};
try{
 const app=JSON.parse(fs.readFileSync('app.json','utf8')).expo,pkg=JSON.parse(fs.readFileSync('package.json','utf8')),lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
 eq(app.version,'15.0.0');eq(app.name,'FORM 15.0.0');eq(pkg.version,'15.0.0');eq(lock.version,pkg.version);eq(lock.packages[''].version,pkg.version);
 eq(app.ios.bundleIdentifier,'app.athleteos.personal');eq(app.android.package,'app.athleteos.personal');eq(app.scheme,'athleteos');eq(app.ios.buildNumber,'150003');eq(app.android.versionCode,150003);eq(app.ios.icon,'./assets/icons/ink.png');eq(app.icon,app.ios.icon);ok(app.plugins.includes('./plugins/withBuildVersion'));ok(!app.plugins.some(p=>String(Array.isArray(p)?p[0]:p).includes('AlternateIcon')));eq(fs.existsSync('plugins/withAlternateIcons.js'),false);
 eq(pkg.dependencies.expo,'~58.0.26');eq(pkg.dependencies['react-native'],'0.88.1');eq(pkg.dependencies.react,'19.3.0');
 const base={...app,ios:{...app.ios,entitlements:{'aps-environment':'development','com.apple.developer.healthkit':true,'com.apple.developer.healthkit.access':['health-records'],'com.apple.developer.healthkit.background-delivery':true,'com.apple.security.application-groups':['group.app.athleteos.personal']},infoPlist:{...app.ios.infoPlist,FORMHealthKitEnabled:true,FORMWidgetsEnabled:true,NSSupportsLiveActivities:true,NSHealthShareUsageDescription:'old',NSHealthUpdateUsageDescription:'old'}},plugins:[...app.plugins,['expo-widgets',{old:true}]]};
 const original=JSON.stringify(base);delete process.env.FORM_HEALTHKIT;delete process.env.FORM_WIDGETS;
 const standard=configure({config:base});eq(JSON.stringify(base),original);eq(standard.ios.entitlements,{});eq(standard.ios.infoPlist.FORMHealthKitEnabled,undefined);eq(standard.ios.infoPlist.NSHealthShareUsageDescription,undefined);eq(standard.ios.infoPlist.NSHealthUpdateUsageDescription,undefined);eq(standard.ios.infoPlist.FORMWidgetsEnabled,undefined);eq(standard.ios.infoPlist.NSSupportsLiveActivities,undefined);ok(!standard.plugins.some(p=>(Array.isArray(p)?p[0]:p)==='expo-widgets'));
 process.env.FORM_HEALTHKIT='1';process.env.FORM_WIDGETS='0';const health=configure({config:app});eq(health.ios.entitlements['com.apple.developer.healthkit'],true);eq(health.ios.infoPlist.FORMHealthKitEnabled,true);ok(health.ios.infoPlist.NSHealthShareUsageDescription.includes('Makronährstoffe'));ok(health.ios.infoPlist.NSHealthUpdateUsageDescription.includes('ausdrücklichen'));eq(health.ios.infoPlist.FORMWidgetsEnabled,undefined);
 process.env.FORM_HEALTHKIT='0';process.env.FORM_WIDGETS='1';const widgets=configure({config:app});eq(widgets.ios.entitlements['com.apple.developer.healthkit'],undefined);eq(widgets.ios.infoPlist.FORMWidgetsEnabled,true);eq(widgets.plugins.filter(p=>(Array.isArray(p)?p[0]:p)==='expo-widgets').length,1);
 for(const script of ['build-ios-unsigned.sh','build-ios-signed.sh','setup-ci-signing.sh','cleanup-ci-signing.sh','simulator-smoke.sh']){cp.execFileSync('bash',['-n','scripts/'+script]);count++;}
 for(const script of ['test:plan15','test:nutrition15','test:migration15','test:repository15','test:plan-management15','test:progress15','test:switch-contract'])ok(pkg.scripts['test:all'].includes(`npm run ${script}`));
 // The removed alternate-icon plugin also owned the build setting. Exercise its
 // replacement against independent app configurations; no icon settings are added.
 const configurations=[['Debug',{buildSettings:{CURRENT_PROJECT_VERSION:'150001',ASSETCATALOG_COMPILER_APPICON_NAME:'AppIcon'}}],['Release',{buildSettings:{CURRENT_PROJECT_VERSION:'1',ASSETCATALOG_COMPILER_APPICON_NAME:'AppIcon'}}]];
 const pluginModule={exports:{}},project={fixture:'application project'};
 vm.runInNewContext(fs.readFileSync('plugins/withBuildVersion.js','utf8'),{module:pluginModule,exports:pluginModule.exports,require:name=>{assert.equal(name,'expo/config-plugins');return {withXcodeProject:(config,mod)=>mod({...config,modResults:project,modRequest:{projectRoot:'/synthetic/project'}}),IOSConfig:{XcodeUtils:{getProjectName:()=> 'FORM1500',getApplicationNativeTarget:input=>{assert.equal(input.project,project);return {target:{buildConfigurationList:'application-configs'}};},getBuildConfigurationsForListId:(input,id)=>{assert.equal(input,project);assert.equal(id,'application-configs');return configurations;}}}};}},{filename:'plugins/withBuildVersion.js'});
 pluginModule.exports({ios:{buildNumber:'150003'}});for(const [,configuration] of configurations)eq(configuration.buildSettings,{CURRENT_PROJECT_VERSION:'150003',ASSETCATALOG_COMPILER_APPICON_NAME:'AppIcon'});rejects(()=>pluginModule.exports({ios:{}}),/explicit numeric/);rejects(()=>pluginModule.exports({ios:{buildNumber:'not-a-version'}}),/explicit numeric/);
 const {verifyPresentationInfo,verifyPresentationBundle}=require('../scripts/verify-ios-presentation.cjs');
 const icons={CFBundlePrimaryIcon:{CFBundleIconName:'AppIcon',CFBundleIconFiles:['AppIcon60x60']}};
 const built={CFBundleIdentifier:app.ios.bundleIdentifier,CFBundleShortVersionString:'15.0.0',CFBundleVersion:'150003',CFBundleURLTypes:[{CFBundleURLSchemes:['athleteos']}],CFBundleIcons:icons};
 eq(verifyPresentationInfo(built).build,'150003');eq(verifyPresentationInfo(built).alternates,[]);eq(verifyPresentationInfo({...built,'CFBundleIcons~ipad':icons}).primaryIcons.length,2);
 for(const [key,value] of [['CFBundleVersion','150002'],['CFBundleIdentifier','different.container'],['CFBundleShortVersionString','16.0.0'],['CFBundleURLTypes',[]]])rejects(()=>verifyPresentationInfo({...built,[key]:value}),/Compiled/);
 rejects(()=>verifyPresentationInfo({...built,CFBundleIcons:undefined}),/primary icon missing/);rejects(()=>verifyPresentationInfo({...built,CFBundleIcons:{CFBundlePrimaryIcon:{}}}),/no asset catalog or file reference/);
 for(const scope of ['CFBundleIcons','CFBundleIcons~ipad'])rejects(()=>verifyPresentationInfo({...built,[scope]:{...icons,CFBundleAlternateIcons:{FORMPaper:{CFBundleIconFiles:['FORMPaper60x60']}}}}),/unexpected alternate/);
 rejects(()=>verifyPresentationInfo({...built,CFBundleAlternateIcons:{Other:{}}}),/unexpected alternate/);
 rejects(()=>verifyPresentationInfo({...built,CFBundleIcons:{CFBundlePrimaryIcon:{CFBundleIconName:'FORMPaper'}}}),/fixed primary/);
 rejects(()=>verifyPresentationInfo({...built,CFBundleIcons:{CFBundlePrimaryIcon:{CFBundleIconFiles:['../AppIcon']}}}),/references are invalid/);
 const catalogOnly={...built,CFBundleIcons:{CFBundlePrimaryIcon:{CFBundleIconName:'AppIcon'}}};eq(verifyPresentationInfo(catalogOnly).primaryIcons[0].files,[]);
 const bundle=fs.mkdtempSync(path.join(os.tmpdir(),'form-primary-icon-'));
 try{
  const png=fs.readFileSync('assets/icons/ink-120.png'),iconFile=path.join(bundle,'AppIcon60x60@2x.png');fs.writeFileSync(iconFile,png);
  const noCatalog=()=>{throw Error('Loose primary PNG should not require assetutil');};
  eq(verifyPresentationBundle(bundle,built,{readCatalog:noCatalog}).verifiedIconFiles,['AppIcon60x60@2x.png']);eq(verifyPresentationBundle(bundle,catalogOnly,{readCatalog:noCatalog}).verifiedAssetCatalog,false);
  // An Apple optimized PNG may put its CgBI chunk before IHDR.
  const cgbi=Buffer.alloc(16);cgbi.writeUInt32BE(4,0);cgbi.write('CgBI',4);cgbi.writeUInt32BE(crc32(cgbi.subarray(4,12))>>>0,12);fs.writeFileSync(iconFile,Buffer.concat([png.subarray(0,8),cgbi,png.subarray(8)]));eq(verifyPresentationBundle(bundle,built,{readCatalog:noCatalog}).verifiedIconFiles.length,1);
  fs.writeFileSync(iconFile,Buffer.from('not an icon'));rejects(()=>verifyPresentationBundle(bundle,built),/not a PNG/);
  const corrupt=Buffer.from(png);corrupt[29]^=1;fs.writeFileSync(iconFile,corrupt);rejects(()=>verifyPresentationBundle(bundle,built),/CRC mismatch/);
  fs.writeFileSync(iconFile,png.subarray(0,png.length-12));rejects(()=>verifyPresentationBundle(bundle,built),/Incomplete primary/);
  fs.unlinkSync(iconFile);rejects(()=>verifyPresentationBundle(bundle,built),/asset is missing/);
  fs.writeFileSync(path.join(bundle,'Assets.car'),'synthetic catalog-reader adapter');const catalog=[{AssetType:'Icon Image',Name:'AppIcon',PixelWidth:1024,PixelHeight:1024,SizeOnDisk:4096}];
  eq(verifyPresentationBundle(bundle,catalogOnly,{readCatalog:file=>{eq(file,path.join(bundle,'Assets.car'));return catalog;}}).verifiedAssetCatalog,true);
  eq(verifyPresentationBundle(bundle,built,{readCatalog:()=>catalog}).verifiedAssetCatalog,true);
  rejects(()=>verifyPresentationBundle(bundle,catalogOnly,{readCatalog:()=>[]}),/absent from the compiled catalog/);
  rejects(()=>verifyPresentationBundle(bundle,catalogOnly,{readCatalog:()=>[{...catalog[0],Name:'UnrelatedImage'}]}),/absent from the compiled catalog/);
  rejects(()=>verifyPresentationBundle(bundle,catalogOnly,{readCatalog:()=>[{Name:'AppIcon',AssetType:'Color',SizeOnDisk:10}]}),/absent from the compiled catalog/);
  rejects(()=>verifyPresentationBundle(bundle,catalogOnly,{readCatalog:()=>[...catalog,{...catalog[0],Name:'FORMRetro'}]}),/Obsolete alternate/);
  fs.writeFileSync(path.join(bundle,'FORMBlueprint60x60@2x.png'),png);rejects(()=>verifyPresentationBundle(bundle,built,{readCatalog:()=>catalog}),/Obsolete alternate/);fs.unlinkSync(path.join(bundle,'FORMBlueprint60x60@2x.png'));
  fs.writeFileSync(path.join(bundle,'Assets.car'),'');rejects(()=>verifyPresentationBundle(bundle,catalogOnly,{readCatalog:()=>catalog}),/asset is missing/);
 }finally{fs.rmSync(bundle,{recursive:true,force:true});}
 console.log(`PASS: ${count} FORM15 build identity, primary Ink metadata and actual bundle PNG checks, controlled asset-catalog fallback, no alternates, build-version plugin, capability isolation, lockfile and shell syntax checks. Native compilation and assetutil execution require the actual macOS build.`);
}finally{if(old.health===undefined)delete process.env.FORM_HEALTHKIT;else process.env.FORM_HEALTHKIT=old.health;if(old.widgets===undefined)delete process.env.FORM_WIDGETS;else process.env.FORM_WIDGETS=old.widgets;}
