import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSIC_SIZE,CLASSIC_RECTS,REPORTS,landscapeFit,mobileTouchSpec,toClassicPoint,normalizeClassicViewModel,createClassicHud} from '../../ui/classic/classic-hud.js';
test('classic geometry and fixed 800x600 baseline',()=>{
 assert.deepEqual(CLASSIC_SIZE,{width:800,height:600});
 assert.equal(CLASSIC_RECTS.world.x+CLASSIC_RECTS.world.w,610);
 assert.equal(CLASSIC_RECTS.minimap.x,614);
 assert.equal(REPORTS.length,8);
});
test('normalize does not mutate input and tolerates missing information',()=>{
 const data={selection:{name:'Rouen',stats:[{label:'Loyalty',value:80}]}};
 const out=normalizeClassicViewModel(data);
 assert.equal(out.selection.name,'Rouen');
 out.selection.stats.push({label:'x',value:2});
 assert.equal(data.selection.stats.length,1);
 assert.equal(normalizeClassicViewModel().resources.cash,0);
});
test('landscape letterboxing maintains aspect ratio',()=>{
 assert.deepEqual(landscapeFit(1600,900),{scale:1.5,offsetX:200,offsetY:0,portrait:false});
 assert.equal(landscapeFit(400,800).portrait,true);
});
test('interaction dispatch, minimap normalized coordinates and disposal',()=>{
 let handler;let fired=[];const ctx=new Proxy({}, {get:(o,k)=>k==='drawImage'?()=>{}:k==='fillText'||k==='fillRect'||k==='clearRect'?()=>{}:o[k],set:(o,k,v)=>(o[k]=v,true)});
 const canvas={width:0,height:0,getContext:()=>ctx,addEventListener:(_,fn)=>handler=fn,removeEventListener:()=>handler=null,
 getBoundingClientRect:()=>({left:0,top:0,width:800,height:600})};
 const hud=createClassicHud(canvas,{onCommand:c=>fired.push(c),listenPointer:true});
 const cmd=hud.dispatchPoint(707,132);
 assert.equal(cmd.type,'minimap');assert.ok(Math.abs(cmd.x-.5)<.01);
 hud.render({selection:{type:'town',name:'Rouen',actions:[{id:'tax',label:'Tax'}]}});
 assert.deepEqual(hud.dispatchPoint(640,428),{type:'action',action:'tax'});
 assert.equal(fired.length,2);hud.dispose();assert.equal(handler,null);
});

test('eight authentic report commands and three separate minimap modes',()=>{
 const events=[];
 const ctx=new Proxy({}, {get:(_,k)=>['clearRect','fillRect','fillText','drawImage'].includes(k)?()=>{}:undefined,set:()=>true});
 const canvas={getContext:()=>ctx,addEventListener(){},removeEventListener(){}};
 const ui=createClassicHud(canvas,{onCommand:c=>events.push(c)});
 assert.equal(ui.dispatchPoint(27,10).report,'kingdoms');
 assert.equal(ui.dispatchPoint(81,10).report,'villages');
 assert.equal(ui.dispatchPoint(27,29).report,'military');
 assert.deepEqual(ui.dispatchPoint(639,20),{type:'map-mode',mode:'terrain'});
 assert.deepEqual(ui.dispatchPoint(680,20),{type:'map-mode',mode:'borders'});
 assert.deepEqual(ui.dispatchPoint(729,20),{type:'map-mode',mode:'villages-map'});
 assert.equal(ui.dispatchPoint(300,300),null,'world map must be forwarded to game');
 assert.equal(events.length,6);
 ui.dispose();
});
test('mobile landscape is scaled uniformly; stage input mapping and 44px target contract',()=>{
 const fit=landscapeFit(915,412);
 assert.ok(fit.scale>0.68&&fit.scale<0.69);
 assert.deepEqual(toClassicPoint(100,50,{left:0,top:0,width:800,height:600}),{x:100,y:50});
 assert.deepEqual(toClassicPoint(457.5,206,{left:0,top:0,width:915,height:412}),{x:400,y:300});
 assert.equal(toClassicPoint(0,0,{width:0,height:0}),null);
 assert.equal(mobileTouchSpec(800,360).needsAlternateControls,true);
 assert.equal(mobileTouchSpec(915,412).minTargetCssPx,44);
 assert.equal(mobileTouchSpec(360,800).orientationRequired,true);
});
test('disabled actions do not emit commands',()=>{
 const ctx=new Proxy({}, {get:(_,k)=>['clearRect','fillRect','fillText','drawImage'].includes(k)?()=>{}:undefined,set:()=>true});
 const canvas={getContext:()=>ctx,addEventListener(){throw Error('listener should be opt-in')},removeEventListener(){}};
 const ui=createClassicHud(canvas);
 ui.render({selection:{name:'Town',actions:[{id:'tax',label:'Tax',disabled:true}]}});
 assert.equal(ui.dispatchPoint(640,428),null);
 ui.dispose();
});
