/* Executes actual component hooks against controlled React/Animated/AppState adapters.
 * This is a JavaScript lifecycle test, not a renderer, native performance or device UI test. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');let checks=0;
const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++},ok=(v,label)=>{assert.ok(v,label);checks++};
function harness(){
 let current=null,now=100000,fontScale=1,timerId=0;const contexts=[],timers=new Map(),listeners=new Map(),animations=[],cache=new Map();
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const subscribe=(kind,fn)=>{const set=listeners.get(kind)??new Set();set.add(fn);listeners.set(kind,set);return {remove:()=>set.delete(fn)}};
 const React={createContext(value){const context={value};context.Provider={context};contexts.push(context);return context},useContext:c=>c.value,
  createElement(type,props,...children){if(type?.context)type.context.value=props.value;return {type,props:{...props,children:children.length===1?children[0]:children}}},
  useRef(initial){const h=current,i=h.index++;return h.slots[i]??(h.slots[i]={current:initial})},
  useState(initial){const h=current,i=h.index++;if(!h.slots[i])h.slots[i]={value:typeof initial==='function'?initial():initial};return [h.slots[i].value,next=>{const value=typeof next==='function'?next(h.slots[i].value):next;if(!Object.is(value,h.slots[i].value)){h.slots[i].value=value;h.dirty=true}}]},
  useEffect(effect,deps){const h=current,i=h.index++,old=h.slots[i];if(!old||!same(deps,old.deps)){h.slots[i]={...old,deps};h.pending.push(()=>{old?.cleanup?.();h.slots[i].cleanup=effect()})}},
  useMemo(factory,deps){const h=current,i=h.index++,old=h.slots[i];if(!old||!same(deps,old.deps))h.slots[i]={value:factory(),deps};return h.slots[i].value}
 };
 class Value{constructor(value){this.value=value;this.stops=0}setValue(value){this.value=value}stopAnimation(){this.stops++}interpolate(config){return {value:this,config}}}
 const Animated={Value,View:'AnimatedView',createAnimatedComponent:c=>'Animated'+c,timing(value,config){const a={value,config,starts:0,stops:0,start(){this.starts++},stop(){this.stops++}};animations.push(a);return a}};
 const AppState={currentState:'active',addEventListener:(kind,fn)=>subscribe('app:'+kind,fn)};
 let resolveReduced;const reducedPromise=new Promise(resolve=>{resolveReduced=resolve});
 const RN={Animated,AppState,AccessibilityInfo:{isReduceMotionEnabled:()=>reducedPromise,addEventListener:(kind,fn)=>subscribe('accessibility:'+kind,fn)},Easing:{cubic:'cubic',out:value=>value},View:'View',Text:'Text',useWindowDimensions:()=>({width:320,height:568,fontScale})};
 const design={usePalette:()=>({ink:'#111',blue:'#256',muted:'#555',line:'#ccc',mint:'#cfc',olive:'#363',white:'#fff',accent:'#256'}),useFormFont:()=>undefined,darkPalette:{}};
 class ClockDate extends Date{static now(){return now}}
 function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
  const localRequire=name=>{if(name==='react')return React;if(name==='react-native')return RN;if(name==='react-native-svg')return {__esModule:true,default:'Svg',Path:'Path',Circle:'Circle'};if(name==='./Design')return design;if(name.startsWith('.')){const base=path.resolve(path.dirname(file),name),resolved=['.ts','.tsx'].map(ext=>base+ext).find(p=>fs.existsSync(p));if(resolved)return load(resolved)}throw Error('Unexpected adapter import: '+name)};
  vm.runInNewContext(source,{module,exports:module.exports,require:localRequire,Date:ClockDate,Map,Set,setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,at:now+ms});return id},clearTimeout:id=>timers.delete(id)},{filename:file});return module.exports;
 }
 function mount(fn,...args){const h={slots:[],index:0,pending:[],dirty:false,args,out:null,render(...next){if(next.length)this.args=next;let turns=0;do{this.dirty=false;this.index=0;this.pending=[];current=this;this.out=fn(...this.args);current=null;for(const effect of this.pending)effect();if(++turns>15)throw Error('Unstable hook adapter render')}while(this.dirty);return this.out},unmount(){for(const slot of this.slots)slot?.cleanup?.()}};h.render();return h}
 return {load,mount,contexts,animations,timers,resolveReduced,app(state){AppState.currentState=state;for(const fn of listeners.get('app:change')??[])fn(state)},reduce(value){for(const fn of listeners.get('accessibility:reduceMotionChanged')??[])fn(value)},advance(ms){now+=ms;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.fn()}},font(value){fontScale=value},listenerCount:()=>[...listeners.values()].reduce((n,s)=>n+s.size,0)};
}
function nodes(tree){if(tree===null||tree===undefined||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...nodes(tree.props?.children)]}
async function main(){
 const env=harness(),M=env.load('src/components/MotionCue.tsx'),spec=env.load('src/motion/spec.ts'),context=env.contexts[0];
 for(const [name,value] of Object.entries(spec.motionSpecs)){
  if(name==='restDial')continue;context.value={level:'lively',reduced:false,active:true};const start=env.animations.length;
  const hook=env.mount((id,confirmed)=>M.useMotionValue(name,id,true,confirmed),'one',false);
  eq(env.animations.length-start,value.success?0:1,name+': failed commit cannot start success motion');
  hook.render('one',true);eq(env.animations.length-start,value.success?1:2,name+': confirmation transition');
  const stable=env.animations.length;hook.render('one',true);eq(env.animations.length,stable,name+': render does not replay');
  for(let i=0;i<5;i++){const old=env.animations.at(-1);hook.render('rapid-'+i,true);ok(old.stops>0,name+': new event cancels previous instead of queueing')}
  const before=env.animations.length;context.value={level:'lively',reduced:true,active:true};hook.render('rapid-4',true);eq(env.animations.length,before);eq(hook.out.value,1,name+': reduced motion leaves final readable state');
  context.value={level:'lively',reduced:false,active:true};hook.render('rapid-4',true);eq(env.animations.length,before,name+': no delayed replay after Reduce Motion');
  context.value={level:'off',reduced:false,active:true};hook.render('off-event',true);eq(env.animations.length,before,name+': off suppresses new event');
  context.value={level:'lively',reduced:false,active:true};hook.render('off-event',true);eq(env.animations.length,before,name+': off event is not queued');
  context.value={level:'lively',reduced:false,active:false};hook.render('background-event',true);eq(env.animations.length,before,name+': inactive suppresses event');
  context.value={level:'lively',reduced:false,active:true};hook.render('background-event',true);eq(env.animations.length,before,name+': foreground does not replay missed event');
  hook.render('fresh',true);const last=env.animations.at(-1);hook.unmount();ok(last.stops>0&&last.value.stops>0,name+': unmount cleans active effect');
 }
 context.value={level:'lively',reduced:false,active:true};let actions=0;const child={type:'Control',props:{onPress:()=>actions++}},cue=env.mount(props=>M.MotionCue(props),{variant:'pencilCheck',eventKey:'pending',confirmed:false,mark:true,children:child});
 eq(nodes(cue.out).filter(n=>n.type==='Svg').length,0,'unconfirmed success mark absent');nodes(cue.out).find(n=>n.type==='Control').props.onPress();eq(actions,1,'control works independently of success animation');cue.unmount();eq(actions,1,'cleanup never repeats domain action');
 const provider=env.mount(props=>M.SketchMotionProvider(props),{level:'lively',children:'usable'});eq(context.value.reduced,true,'provider fails closed while system preference unknown');env.resolveReduced(false);await Promise.resolve();provider.render();eq(context.value.reduced,false);env.reduce(true);provider.render();eq(context.value.reduced,true);env.app('inactive');provider.render();eq(context.value.active,false);provider.unmount();eq(env.listenerCount(),0,'provider subscriptions removed');
 const book=env.load('src/components/Sketchbook.tsx');const dial=env.mount(props=>book.RestDial(props),{remainingMs:30000,totalMs:60000});let arc=nodes(dial.out).find(n=>n.type==='Circle'&&n.props.strokeDashoffset!==undefined);eq(arc.props.strokeDashoffset,Math.PI*25,'dial derives one-half from actual time, no tween');dial.render({remainingMs:0,totalMs:60000});arc=nodes(dial.out).find(n=>n.type==='Circle'&&n.props.strokeDashoffset!==undefined);eq(arc.props.strokeDashoffset,2*Math.PI*25);dial.unmount();
 const persona=harness(),P=persona.load('src/components/Personality.tsx'),C=persona.load('src/copy/copy.de.ts'),pc=persona.contexts.find(c=>'character' in c.value);const select=C.createCopySelector(),shown=new Map();pc.value={character:true,copy:true,tone:'quiet',select,shown};
 let bubble=persona.mount(props=>P.SketchEvent(props),{event:'pr',eventId:'not-committed',confirmed:false});eq(bubble.out,null,'PR copy absent before commit');eq(persona.timers.size,0,'failed PR has no pending decoration');bubble.unmount();
 bubble=persona.mount(props=>P.SketchEvent(props),{event:'setSaved',eventId:'committed',confirmed:true});ok(nodes(bubble.out).some(n=>n.type==='Text'),'committed opt-in copy visible');eq(persona.timers.size,1);persona.advance(6500);bubble.render();eq(bubble.out,null,'speech bubble expires');bubble.unmount();
 bubble=persona.mount(props=>P.SketchEvent(props),{event:'setSaved',eventId:'committed',confirmed:true});eq(bubble.out,null,'remount does not replay an expired event');bubble.render({event:'setSaved',eventId:'next',confirmed:true});ok(bubble.out);eq(persona.timers.size,1);persona.app('background');bubble.render();eq(bubble.out,null,'app switch hides decoration');eq(persona.timers.size,0,'app switch clears timeout');persona.app('active');bubble.render();eq(bubble.out,null,'foreground does not replay bubble');bubble.unmount();eq(persona.listenerCount(),0,'unmount removes app-state listener');
 pc.value={character:false,copy:true,tone:'quiet',select,shown};bubble=persona.mount(props=>P.SketchEvent(props),{event:'backupSaved',eventId:'copy-only',confirmed:true});ok(nodes(bubble.out).some(n=>n.type==='Text'));eq(nodes(bubble.out).filter(n=>typeof n.type==='function'&&n.type.name==='Doodle').length,0,'character off still allows independent copy');bubble.unmount();
 pc.value={character:true,copy:false,tone:'quiet',select,shown};bubble=persona.mount(props=>P.SketchEvent(props),{event:'backupSaved',eventId:'character-only',confirmed:true});eq(nodes(bubble.out).filter(n=>n.type==='Text').length,0,'coach/copy off removes decorative text');ok(nodes(bubble.out).some(n=>typeof n.type==='function'&&n.type.name==='Doodle'));persona.font(1.8);bubble.render();eq(nodes(bubble.out).filter(n=>typeof n.type==='function'&&n.type.name==='Doodle').length,0,'large type hides optional figure');bubble.unmount();
 pc.value={character:false,copy:false,tone:'quiet',select,shown};bubble=persona.mount(props=>P.SketchEvent(props),{event:'planReady',eventId:'all-off'});eq(bubble.out,null);eq(persona.timers.size,0);bubble.unmount();
 console.log(`PASS: ${checks} actual motion/personality hook lifecycle assertions: every timed variant, rapid replacement, off/reduced/inactive, no replay, unmount, unconfirmed marks, independent controls, timestamp dial, short speech bubbles and separate opt-ins. Controlled JS adapters; no native device/FPS claim.`);
}
main().catch(error=>{console.error(error);process.exitCode=1});
