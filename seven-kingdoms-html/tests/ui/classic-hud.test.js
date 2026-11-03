import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSIC_SIZE,CLASSIC_RECTS,REPORTS,landscapeFit,normalizeClassicViewModel,createClassicHud} from '../../ui/classic/classic-hud.js';
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
 const hud=createClassicHud(canvas,{onCommand:c=>fired.push(c)});
 const cmd=hud.dispatchPoint(707,132);
 assert.equal(cmd.type,'minimap');assert.ok(Math.abs(cmd.x-.5)<.01);
 hud.render({selection:{type:'town',name:'Rouen',actions:[{id:'tax',label:'Tax'}]}});
 assert.deepEqual(hud.dispatchPoint(640,428),{type:'action',action:'tax'});
 assert.equal(fired.length,2);hud.dispose();assert.equal(handler,null);
});
