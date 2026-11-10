import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../game.js',import.meta.url),'utf8');
const start=source.indexOf("const minimap=$('minimap');");
const end=source.indexOf("document.addEventListener('click'",start);
assert.ok(start>=0&&end>start,'minimap handlers must be present');
function harness(){
 const handlers={};const camera=[];let captured=null;
 const minimap={
  getBoundingClientRect:()=>({left:10,top:20,width:200,height:100}),
  addEventListener:(type,fn)=>handlers[type]=fn,
  setPointerCapture:id=>captured=id,
  hasPointerCapture:id=>captured===id,
  releasePointerCapture:id=>{if(captured===id)captured=null;}
 };
 runInNewContext(source.slice(start,end),{
  $:()=>minimap,view:{center:(x,y)=>camera.push([x,y])},
  WORLD_W:100,WORLD_H:80
 });
 return {handlers,camera,minimap};
}
test('drag moves camera and clamps to minimap boundaries',()=>{
 const {handlers,camera}=harness();
 handlers.pointerdown({pointerType:'touch',pointerId:1,clientX:110,clientY:70});
 handlers.pointermove({pointerId:1,clientX:999,clientY:-100});
 assert.deepEqual(camera,[[50,40],[100,0]]);
 handlers.pointerup({pointerId:1});
 handlers.pointermove({pointerId:1,clientX:10,clientY:20});
 assert.equal(camera.length,2);
});
test('other pointers and secondary mouse button cannot hijack drag',()=>{
 const {handlers,camera}=harness();
 handlers.pointerdown({pointerType:'mouse',button:2,pointerId:1,clientX:10,clientY:20});
 assert.equal(camera.length,0);
 handlers.pointerdown({pointerType:'mouse',button:0,pointerId:2,clientX:10,clientY:20});
 handlers.pointermove({pointerId:3,clientX:210,clientY:120});
 handlers.pointercancel({pointerId:2});
 assert.deepEqual(camera,[[0,0]]);
});
