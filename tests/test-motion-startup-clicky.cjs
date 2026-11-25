/* Runs the actual provider/hooks with controlled React, Accessibility, AppState
 * and Animated adapters. This is JS lifecycle evidence, not native FPS evidence. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');let checks=0;
const eq=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);checks++;},ok=(actual,label)=>{assert.ok(actual,label);checks++;};
function environment(initialState='active'){
 let current=null;const contexts=[],listeners=new Map(),animations=[],cache=new Map();
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const subscribe=(name,fn)=>{const set=listeners.get(name)??new Set();set.add(fn);listeners.set(name,set);return {remove:()=>set.delete(fn)};};
 const React={createContext(value){const c={value};c.Provider={context:c};contexts.push(c);return c;},useContext:c=>c.value,
  createElement(type,props,...children){if(type?.context)type.context.value=props.value;return {type,props:{...props,children:children.length===1?children[0]:children}};},
  useRef(value){const h=current,i=h.index++;return h.slots[i]??(h.slots[i]={current:value});},
  useState(initial){const h=current,i=h.index++;if(!h.slots[i])h.slots[i]={value:typeof initial==='function'?initial():initial};return [h.slots[i].value,next=>{const value=typeof next==='function'?next(h.slots[i].value):next;if(!Object.is(value,h.slots[i].value)){h.slots[i].value=value;h.dirty=true;h.stateUpdates++;}}];},
  useEffect(effect,deps){const h=current,i=h.index++,old=h.slots[i];if(!old||!same(deps,old.deps)){h.slots[i]={...old,deps};h.pending.push(()=>{old?.cleanup?.();h.slots[i].cleanup=effect();});}}
 };
 class Value{constructor(value){this.value=value;this.stops=0;}setValue(value){this.value=value;}stopAnimation(){this.stops++;}interpolate(config){return {value:this,config};}}
 const Animated={Value,View:'AnimatedView',createAnimatedComponent:c=>'Animated'+c,timing(value,config){const a={value,config,starts:0,stops:0,finished:false,start(){this.starts++;},stop(){this.stops++;},finish(){if(this.stops)return;this.finished=true;value.setValue(config.toValue);}};animations.push(a);return a;}};
 let resolvePreference,rejectPreference;const preference=new Promise((resolve,reject)=>{resolvePreference=resolve;rejectPreference=reject;});
 const AppState={currentState:initialState,addEventListener:(name,fn)=>subscribe('app:'+name,fn)};
 const RN={Animated,View:'View',AppState,AccessibilityInfo:{isReduceMotionEnabled:()=>preference,addEventListener:(name,fn)=>subscribe('accessibility:'+name,fn)},Easing:{cubic:x=>x*x*x,out:fn=>x=>1-fn(1-x),linear:x=>x}};
 function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
  const requireAdapter=name=>{if(name==='react')return React;if(name==='react-native')return RN;if(name==='react-native-svg')return {__esModule:true,default:'Svg',Path:'Path'};if(name.startsWith('.')){const base=path.resolve(path.dirname(file),name),resolved=['.ts','.tsx'].map(ext=>base+ext).find(p=>fs.existsSync(p));if(resolved)return load(resolved);}throw Error('Unexpected adapter import: '+name);};
  vm.runInNewContext(code,{module,exports:module.exports,require:requireAdapter},{filename:file});return module.exports;
 }
 function mount(fn,...args){const h={slots:[],index:0,pending:[],dirty:false,stateUpdates:0,args,out:null,render(...next){if(next.length)this.args=next;let turns=0;do{this.dirty=false;this.index=0;this.pending=[];current=this;this.out=fn(...this.args);current=null;for(const effect of this.pending)effect();if(++turns>15)throw Error('Unstable hook render');}while(this.dirty);return this.out;},unmount(){for(const slot of this.slots)slot?.cleanup?.();}};h.render();return h;}
 const motion=load('src/components/MotionCue.tsx');
 return {motion,mount,animations,context:contexts[0],resolvePreference,rejectPreference,app(state){AppState.currentState=state;for(const fn of listeners.get('app:change')??[])fn(state);},reduce(value){for(const fn of listeners.get('accessibility:reduceMotionChanged')??[])fn(value);},listenerCount:()=>[...listeners.values()].reduce((n,set)=>n+set.size,0)};
}
const settle=async()=>{await Promise.resolve();await Promise.resolve();};
const provider=(env,props={level:'lively'})=>env.mount(value=>env.motion.SketchMotionProvider({...value,children:'usable content'}),props);

async function main(){
 // Real cold-start regression: the drawing mounts before iOS answers the query.
 const cold=environment(),p=provider(cold),drawing=cold.mount(key=>cold.motion.useMotionValue('inkReveal',key),'today');
 eq(cold.animations.length,0,'unknown preference never animates');eq(drawing.out.value,1,'content stays readable while preference is unknown');
 cold.resolvePreference(false);await settle();p.render();drawing.render();
 eq(cold.animations.length,1,'first scene actually animates after the initial preference resolves');eq(drawing.out.value,0);
 const first=cold.animations[0];first.finish();eq(drawing.out.value,1);drawing.render();eq(cold.animations.length,1,'stable render does not repeat entrance');
 cold.app('background');p.render();drawing.render();ok(first.stops>0);eq(drawing.out.value,1);
 cold.app('active');p.render();drawing.render();eq(cold.animations.length,1,'foreground return does not replay the initial scene');
 drawing.render('plan');eq(cold.animations.length,2,'a real new scene can animate');drawing.unmount();ok(cold.animations[1].stops>0);p.unmount();eq(cold.listenerCount(),0);

 // RN can report null/inactive until the first native activation is delivered.
 for(const initial of [null,'inactive']){
  const env=environment(initial),parent=provider(env),scene=env.mount(()=>env.motion.useMotionValue('paperFlip','first'));
  env.resolvePreference(false);await settle();parent.render();scene.render();eq(env.animations.length,0);
  env.app('active');parent.render();scene.render();eq(env.animations.length,1,'initial native activation releases the first scene');
  env.app('inactive');parent.render();scene.render();env.app('active');parent.render();scene.render();eq(env.animations.length,1,'later activation is not another entrance');
  scene.unmount();parent.unmount();eq(env.listenerCount(),0);
 }

 const events=environment(),ep=provider(events);events.resolvePreference(false);await settle();ep.render();
 const success=events.mount((key,confirmed)=>events.motion.useMotionValue('pencilCheck',key,true,confirmed),'row-1',false);
 eq(events.animations.length,0,'pending row never displays animated success');success.render('row-1',true);eq(events.animations.length,1);
 const committed=events.animations[0];events.app('background');ep.render();success.render('row-1',true);ok(committed.stops>0);
 success.render('row-2',true);eq(events.animations.length,1,'background commits do not run decorative success');
 events.app('active');ep.render();success.render('row-2',true);eq(events.animations.length,1,'background commit is not replayed as a new success');
 success.render('row-3',true);eq(events.animations.length,2,'new visible commit remains animated');
 events.reduce(true);ep.render();success.render();eq(success.out.value,1);ok(events.animations[1].stops>0);
 success.render('row-4',true);events.reduce(false);ep.render();success.render();eq(events.animations.length,2,'Reduce Motion events are never queued');
 ep.render({level:'off'});success.render('row-5',true);ep.render({level:'lively'});success.render();eq(events.animations.length,2,'motion-off events are never queued');
 success.render('row-6',true);eq(events.animations.length,3);success.unmount();ep.unmount();

 // A late initial query must not undo a newer Reduce Motion notification.
 const race=environment(),rp=provider(race),rscene=race.mount(()=>race.motion.useMotionValue('inkReveal','welcome'));
 race.reduce(true);rp.render();rscene.render();race.resolvePreference(false);await settle();rp.render();rscene.render();
 eq(race.context.value.reduced,true,'newer OS accessibility event wins over stale query');eq(race.animations.length,0);rscene.unmount();rp.unmount();
 const unknown=environment(),up=provider(unknown),unknownScene=unknown.mount(()=>unknown.motion.useMotionValue('paperFlip','first'));
 unknown.rejectPreference(Error('synthetic accessibility query failure'));await settle();up.render();unknownScene.render();eq(unknown.animations.length,0,'query failure fails closed');eq(unknownScene.out.value,1);unknownScene.unmount();up.unmount();
 const gone=environment(),gp=provider(gone);gp.unmount();const updateCount=gp.stateUpdates;gone.resolvePreference(false);await settle();eq(gp.stateUpdates,updateCount,'late async query never updates an unmounted provider');eq(gone.listenerCount(),0);

 // New scene/float helpers animate view transforms on the native driver. Their
 // timing is finite; completion schedules no further work or app actions.
 const visual=environment(),vp=provider(visual);visual.resolvePreference(false);await settle();vp.render();let actions=0;
 const control={type:'Button',props:{onPress:()=>actions++}};
 const entrance=visual.mount(key=>visual.motion.SceneEntrance({sceneKey:key,children:control}),'scene');
 const floating=visual.mount(key=>visual.motion.IdleFloat({eventKey:key,children:'small sticker'}),'sticker');
 eq(entrance.out.props.children,control,'scene keeps the original actionable child');control.props.onPress();eq(actions,1);
 eq(visual.animations.length,2);for(const a of visual.animations){eq(a.config.useNativeDriver,true);eq(a.config.isInteraction,false);ok(a.config.duration>0&&a.config.duration<7000);a.finish();eq(a.value.value,1);}
 eq(visual.animations.length,2,'finite decorative sequence never queues a loop');eq(actions,1,'animation completion cannot repeat an action');
 const floatTransform=floating.out.props.style[0].transform;eq(Math.abs(floatTransform[0].translateY.config.outputRange.at(-1)),0);eq(floatTransform[1].rotate.config.outputRange.at(-1),'0deg');
 entrance.render('other-scene');floating.render('other-sticker');eq(visual.animations.length,4);
 visual.app('background');vp.render();entrance.render();floating.render();for(const a of visual.animations.slice(-2)){ok(a.stops>0);eq(a.value.value,1);}
 visual.app('active');vp.render();entrance.render();floating.render();eq(visual.animations.length,4,'scene and float do not restart after tab-away background');
 entrance.unmount();floating.unmount();vp.unmount();eq(visual.listenerCount(),0);

 const press=environment(),pp=provider(press);press.resolvePreference(false);await settle();pp.render();const button=press.mount(disabled=>press.motion.usePressMotion(disabled),false);
 eq(press.animations.length,0,'press feedback has no idle animation');button.out.onPressIn();eq(press.animations.length,1);eq(press.animations[0].config.useNativeDriver,true);eq(press.animations[0].config.toValue,1);
 button.out.onPressOut();eq(press.animations.length,2);ok(press.animations[0].stops>0);eq(press.animations[1].config.toValue,0);press.animations[1].finish();eq(press.animations[1].value.value,0);
 button.out.onPressIn();const held=press.animations.at(-1);held.finish();press.app('background');pp.render();button.render();ok(held.stops>0);eq(held.value.value,0,'background releases pressed visual immediately');
 const before=press.animations.length;button.out.onPressIn();eq(press.animations.length,before);press.app('active');pp.render();button.render();eq(press.animations.length,before,'return never presses by itself');
 button.render(true);button.out.onPressIn();button.out.onPressOut();eq(press.animations.length,before,'disabled control has no press effect');button.render(false);press.reduce(true);pp.render();button.render();button.out.onPressIn();eq(press.animations.length,before,'Reduce Motion disables press transforms');
 press.reduce(false);pp.render();button.render();button.out.onPressIn();const last=press.animations.at(-1);button.unmount();ok(last.stops>0);eq(last.value.value,0);pp.unmount();eq(press.listenerCount(),0);

 // All helpers remain usable/static with system Reduce Motion from first launch.
 const reduced=environment(),redp=provider(reduced);reduced.resolvePreference(true);await settle();redp.render();
 const redscene=reduced.mount(()=>reduced.motion.SceneEntrance({sceneKey:'scene',children:control})),redfloat=reduced.mount(()=>reduced.motion.IdleFloat({eventKey:'sticker',children:'sticker'})),redpress=reduced.mount(()=>reduced.motion.usePressMotion());
 redpress.out.onPressIn();eq(reduced.animations.length,0);eq(redscene.out.props.children,control);control.props.onPress();eq(actions,2,'reduced motion never disables the control action');redscene.unmount();redfloat.unmount();redpress.unmount();redp.unmount();eq(reduced.listenerCount(),0);
 console.log(`PASS: ${checks} startup/Clicky motion lifecycle checks: async preference and first activation, stale preference race, success/no-replay, finite native-driver scene/float, press cancellation, off/reduced/background/unmount, independent controls. Controlled JS adapters; no native FPS or device claim.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
