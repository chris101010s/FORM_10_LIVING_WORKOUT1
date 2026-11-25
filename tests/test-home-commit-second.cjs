/* Actual Home JSX/hooks + actual provider/repository/SQLite failures.
 * Controlled React/native leaf adapters: no native layout, navigation or device claim. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),ts=require('typescript');
const {repositoryHarness}=require('./fixtures/repository-harness.cjs');
const root=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'form-home-commit-'));
let checks=0;const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++},ok=(value,message)=>{assert.ok(value,message);checks++};
function reactAdapter(){
 let current=null;const contexts=[];
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
 const React={
  createContext(value){const context={value};context.Provider={context};contexts.push(context);return context},
  createElement(type,props,...children){if(type?.context)type.context.value=props.value;return {type,props:{...props,children:children.length===1?children[0]:children}}},
  useContext:context=>context.value,
  useState(initial){const owner=current,index=owner.cursor++;if(!(index in owner.slots))owner.slots[index]={value:typeof initial==='function'?initial():initial};return [owner.slots[index].value,next=>{const value=typeof next==='function'?next(owner.slots[index].value):next;if(!Object.is(value,owner.slots[index].value)){owner.slots[index].value=value;owner.dirty=true}}]},
  useRef(initial){const owner=current,index=owner.cursor++;if(!(index in owner.slots))owner.slots[index]={current:initial};return owner.slots[index]},
  useMemo(factory,deps){const owner=current,index=owner.cursor++,old=owner.slots[index];if(!old||!same(deps,old.deps))owner.slots[index]={value:factory(),deps};return owner.slots[index].value},
  useEffect(effect,deps){const owner=current,index=owner.cursor++,old=owner.slots[index];if(!old||!same(deps,old.deps)){owner.slots[index]={...old,deps};owner.effects.push(()=>{old?.cleanup?.();owner.slots[index].cleanup=effect()})}},
 };
 function mount(fn,...args){const owner={slots:[],cursor:0,effects:[],dirty:false,args,out:null,render(...next){if(next.length)this.args=next;let turns=0;do{this.dirty=false;this.cursor=0;this.effects=[];current=this;try{this.out=fn(...this.args)}finally{current=null}for(const effect of this.effects)effect();if(++turns>20)throw Error('Unstable hook adapter render')}while(this.dirty);return this.out},unmount(){for(const slot of this.slots)slot?.cleanup?.()}};owner.render();return owner;}
 return {React,mount,contexts};
}
function nodes(tree){if(Array.isArray(tree))return tree.flatMap(nodes);if(!tree||typeof tree!=='object')return [];return [tree,...nodes(tree.props?.children)]}
function text(tree){if(tree===null||tree===undefined||typeof tree==='boolean')return '';if(Array.isArray(tree))return tree.map(text).filter(Boolean).join(' ');if(typeof tree!=='object')return String(tree);return text(tree.props?.children)}
const leafNames=names=>Object.fromEntries(names.split(' ').map(name=>[name,name]));
const palette={bg:'#fff',white:'#fff',ink:'#111',muted:'#555',blue:'#256',line:'#ccc',mint:'#dfd',error:'#900',ice:'#def'};
function loadMain(React,useAthlete){
 // Execute the original private Main function, extracted by AST; no copied routing implementation.
 const filename=path.join(root,'App.tsx'),source=fs.readFileSync(filename,'utf8'),ast=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const main=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='Main');
 const variables=ast.statements.filter(node=>ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>['tabs','nativeTabsEnabled'].includes(d.name.getText(ast))));
 assert.ok(main,'actual App Main exists');
 const original=variables.map(node=>node.getText(ast)).join('\n')+'\n'+main.getText(ast)+'\nmodule.exports=Main;';
 const compiled=ts.transpileModule(original,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,module={exports:{}};
 const sandbox={module,exports:module.exports,React,useState:React.useState,useEffect:React.useEffect,useRef:React.useRef,useAthlete,usePalette:()=>palette,useNavigation:()=>({navigate(){}}),Platform:{OS:'ios'},process:{env:{EXPO_PUBLIC_FORM_CUSTOM_TABS:'1'}},Linking:{getInitialURL:async()=>null,addEventListener:()=>({remove(){}})},Date,...leafNames('View Text ScrollView Pressable MotionCue SceneEntrance ActivityIndicator Doodle Muted Button BackupCenter SetupScreen NativeMain SearchButton FormTabIcon GymScreen HomeScreen PlansScreen ProgressScreen HealthScreen PerformanceHub MoreScreen WorkoutMiniPlayer GlassBar TabIcon')};
 vm.runInNewContext(compiled,sandbox,{filename});return module.exports;
}
async function main(){
 const OriginalDate=global.Date,oldTZ=process.env.TZ;let clock=OriginalDate.parse('2026-11-25T10:00:00Z'),h,provider,home;
 class FixedDate extends OriginalDate{constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}}
 global.Date=FixedDate;process.env.TZ='UTC';
 try{
  const hooks=reactAdapter(),alerts=[];let homeState;
  const design={...leafNames('Button Label Muted Section Chip Field'),usePalette:()=>palette,useFormFont:()=>undefined};
  h=repositoryHarness(path.join(tmp,'repository'),{
   react:hooks.React,'react-native':{...leafNames('View Text Pressable ScrollView'),useWindowDimensions:()=>({width:375,height:667,fontScale:1}),Alert:{alert:(...args)=>alerts.push(args)}},
   '../data/context':{useAthlete:()=>homeState},
   '../components/Design':design,'../components/Sketchbook':leafNames('Doodle InkRule MarkerSwipe NotebookHeader NotebookSheet'),
   '../components/DeskScene':leafNames('DeskScene PaperSticker'),
   '../components/Personality':{SketchEvent:'SketchEvent'},'../components/MotionCue':{MotionCue:'MotionCue'},'../components/PaperDetails':leafNames('MarginNote PaperGrain'),
   '../components/TrendChart':{TrendChart:'TrendChart'},'./PerformanceHub':{PerformanceTrend:'PerformanceTrend'},'../catalog/catalog':{starterCatalog:[],MUSCLE_DE:{}},'../utils/shareTextExport':{shareTextExport:async()=>{throw Error('unexpected export')}}
  });
  await h.repo.loadRepository();const fixture=require('./fixtures/second-pass-workout.cjs')(h.load),base={...fixture.initialData,settings:{...fixture.initialData.settings,homeOverview:'last',character:false,copyEnabled:false}};
  await h.repo.saveRepository(base,true,1);
  const C=h.load('data/context'),P=h.load('utils/planWorkout'),L=h.load('utils/livingWorkout'),O=h.load('utils/planOperations');
  provider=hooks.mount(()=>{C.AthleteProvider({children:null});return C.useAthlete()});await new Promise(resolve=>{setImmediate(resolve)});
  const store=()=>provider.render();eq(store().ready,true,'actual provider loaded');
  eq(await store().update(fixture.actions[0].apply),true,'planned session committed');
  eq(await store().update(fixture.actions[1].apply),true,'first raw draft committed');
  const Home=h.load('screens/Home').HomeScreen;homeState=store();home=hooks.mount(()=>Home({go(){}}));
  const planned=P.rowProgress(homeState.confirmedData.live).planned;
  ok(text(home.out).includes(`0/${planned} geplante Sätze bestätigt`),'baseline Home reads confirmed live');
  let failures=0;h.state.failSql=sql=>{if(sql.startsWith('INSERT INTO form_set')){failures++;return true}return false};
  eq(await store().update(fixture.actions[2].apply),false,'actual SQL failure during first completed set');
  homeState=store();home.render();eq(failures,1,'set insert really attempted and failed');
  eq(homeState.data.live.sets.length,1,'new actual value retained in RAM');eq(homeState.confirmedData.live.sets.length,0,'committed session still has zero sets');eq((await h.read()).live.sets.length,0,'SQLite rollback retains zero sets');
  ok(text(home.out).includes(`0/${planned} geplante Sätze bestätigt`),'failed set does not become a confirmed Home count');
  ok(!text(home.out).includes(`1/${planned} geplante Sätze bestätigt`),'RAM set is not presented as committed');
  ok(text(home.out).includes('Änderungen sind noch nicht gespeichert.'),'failure notice is separate from confirmed count');
  h.state.failSql=null;eq(await store().retrySave(),true,'retry really commits');homeState=store();home.render();
  ok(text(home.out).includes(`1/${planned} geplante Sätze bestätigt`),'Home advances only after successful retry');
  ok(!text(home.out).includes('Änderungen sind noch nicht gespeichert.'),'old fault notice cleared after retry');

  // Memo invalidation: ONLY planOccurrences changes; all other dependency references stay identical.
  const unchanged=homeState,original=unchanged.data,optional=O.defaultOccurrence(original,original.programs[0],'2026-11-26'),shifted=O.moveOccurrence(original,optional,'2026-11-28',false,clock);
  const dayLabel=date=>nodes(home.out).find(node=>node.type==='Pressable'&&node.props.accessibilityLabel?.includes(date))?.props.accessibilityLabel;
  ok(dayLabel('2026-11-26').includes('optional'),'original Thursday occurrence is optional');ok(!dayLabel('2026-11-28').includes('optional'),'Saturday has no original optional occurrence');
  homeState={...unchanged,data:{...original,planOccurrences:shifted.planOccurrences}};
  for(const key of ['programs','weeklyPlan','routines'])eq(homeState.data[key]===original[key],true,key+' dependency retained');
  eq(homeState.confirmedData.workouts===unchanged.confirmedData.workouts,true,'confirmed workouts dependency retained');
  home.render();ok(!dayLabel('2026-11-26').includes('optional'),'week memo removes moved Thursday occurrence');ok(dayLabel('2026-11-28').includes('optional'),'week memo adds moved Saturday occurrence');

  // Failed finish stays pending in RAM; neither the week check nor latest confirmed entry advances.
  homeState=store();home.render();ok(text(home.out).includes('0/1 Pflichttrainings dokumentiert'),'no committed finish yet');
  failures=0;h.state.failSql=sql=>{if(sql.startsWith('INSERT INTO form_session')){failures++;return true}return false};clock+=900000;
  eq(await store().update(data=>({...data,live:null,workouts:[...data.workouts,L.finishSession(data.live,clock)]})),false,'actual SQL failure while finishing');
  homeState=store();home.render();ok(failures>0,'finished session write really failed');eq(homeState.data.live,null,'RAM contains the pending finish');eq(homeState.confirmedData.live.id,'second-live','confirmed state remains active');eq(homeState.data.workouts.length,3,'pending history entry remains in RAM');eq((await h.read()).workouts.length,2,'database contains only original workouts');
  ok(text(home.out).includes('0/1 Pflichttrainings dokumentiert'),'pending finish does not advance week completion');
  ok(!dayLabel('2026-11-25').includes('dokumentiert'),'today has no committed completed check');
  ok(!text(home.out).includes('Dieser Plan-Tag ist abgeschlossen.'),'no false completed status');
  ok(text(home.out).includes('Legacy free session'),'latest confirmed card still names the previous saved workout');
  h.state.failSql=null;eq(await store().retrySave(),true,'finish retry committed');homeState=store();home.render();
  ok(text(home.out).includes('1/1 Pflichttrainings dokumentiert'),'committed finish advances the week once');ok(dayLabel('2026-11-25').includes('dokumentiert'),'today check appears after commit');

  // Empty analytics information remains present when Personality is disabled.
  const empty=h.load('data/schema').emptyData();homeState={...homeState,data:empty,confirmedData:empty};const Analytics=h.load('screens/TrainingAnalytics').TrainingAnalyticsScreen;
  for(const [view,message] of [['comparison','Noch keine abgeschlossene Einheit für einen Vergleich vorhanden.'],['records','Für diese Übung, diesen Rekordtyp und Zeitraum liegt kein belegter neuer Bestwert vor.']]){const page=hooks.mount(()=>Analytics({initialView:view}));const plain=nodes(page.out).filter(node=>node.type==='Muted').map(text).join(' ');ok(plain.includes(message),view+': functional empty text exists outside optional SketchEvent');page.unmount();}

  // Repeated same screen params must be handled after a user changes the custom tab locally.
  homeState={...homeState,data:{...empty,profile:{...empty.profile,onboarded:true}},ready:true,saving:false,fault:null};
  const Main=loadMain(hooks.React,()=>homeState),routeOne={route:{params:{screen:'plans'}}},mainPage=hooks.mount(props=>Main(props),routeOne);
  const selected=()=>nodes(mainPage.out).filter(node=>node.type==='Pressable'&&node.props.accessibilityRole==='tab'&&node.props.accessibilityState?.selected).map(text);
  eq(selected(),['Plan'],'first custom-tabs route selects requested screen');
  nodes(mainPage.out).find(node=>node.type==='Pressable'&&node.props.accessibilityRole==='tab'&&text(node)==='Heute').props.onPress();mainPage.render();eq(selected(),['Heute'],'manual tab selection works');
  mainPage.render(routeOne);eq(selected(),['Heute'],'ordinary render does not replay the previous navigation');
  mainPage.render({route:{params:{screen:'plans'}}});eq(selected(),['Plan'],'new route params with the same screen are processed again');
  mainPage.render({route:{params:{screen:'gym'}}});eq(selected(),['Training'],'explicit gym route reaches custom training tab');
  nodes(mainPage.out).find(node=>node.type==='GymScreen').props.onMinimize();mainPage.render();eq(selected(),['Heute'],'actual Gym minimize callback returns to Home');
  mainPage.render({route:{params:{screen:'gym'}}});eq(selected(),['Training'],'same gym screen route works again after minimize');mainPage.unmount();
  eq(alerts.length,0,'valid fixture caused no domain validation alerts');
  console.log(`PASS: ${checks} actual Home/App/analytics JS render assertions: real SQL set/finish failures and retries, confirmed-only counts, occurrence-only memo invalidation, personality-independent empty text and repeated custom-tab route params. React/native leaves and navigation inputs are controlled; no native UI/device claim.`);
 }finally{home?.unmount();provider?.unmount();h?.close();global.Date=OriginalDate;if(oldTZ===undefined)delete process.env.TZ;else process.env.TZ=oldTZ;fs.rmSync(tmp,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1});
