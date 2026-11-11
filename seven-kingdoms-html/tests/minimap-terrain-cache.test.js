import test from 'node:test';
import assert from 'node:assert/strict';
import {createMinimapTerrainLayer} from '../minimap-terrain.js';

function harness(){
 const calls={tiles:0,images:0,canvases:0};
 const createCanvas=(w,h)=>{
  calls.canvases++;
  const context={fillStyle:'',fillRect(){calls.tiles++;}};
  return {width:w,height:h,getContext:()=>context};
 };
 const output={drawImage(){calls.images++;},fillRect(){calls.tiles++;}};
 const layer=createMinimapTerrainLayer({worldW:76,worldH:66,
  terrain:(seed,x,y)=>(x+y+seed)%2?'grass':'water',
  colors:{grass:['#123456','#234567'],water:['#456789','#56789a']},
  hash:(x,y)=>((x+y)%2)*.5,createCanvas});
 return {calls,output,layer};
}
test('unchanged terrain renders once while camera and entities can redraw independently',()=>{
 const {calls,output,layer}=harness();
 layer.draw(output,3,184,137);
 assert.equal(calls.tiles,76*66);
 layer.draw(output,3,184,137);
 layer.draw(output,3,184,137);
 assert.equal(calls.tiles,76*66);
 assert.equal(calls.images,3);
 assert.equal(calls.canvases,1);
});
test('new seed, resize and explicit invalidation rebuild terrain',()=>{
 const {calls,output,layer}=harness();
 layer.draw(output,3,184,137);
 layer.draw(output,4,184,137);
 layer.draw(output,4,368,274);
 layer.invalidate();
 layer.draw(output,4,368,274);
 assert.equal(calls.tiles,4*76*66);
});
test('no offscreen context falls back to original direct raster',()=>{
 let count=0;
 const layer=createMinimapTerrainLayer({worldW:2,worldH:2,
  terrain:()=> 'grass',colors:{grass:['#123456']},hash:()=>0,
  createCanvas:()=>null});
 const ctx={fillRect(){count++;}};
 layer.draw(ctx,1,20,20);
 layer.draw(ctx,1,20,20);
 assert.equal(count,8);
});
test('raster retains floor-aligned tile edges at fractional scales',()=>{
 const cells=[];
 const canvas={width:5,height:3,getContext:()=>({set fillStyle(v){},fillRect(...a){cells.push(a);}})};
 const layer=createMinimapTerrainLayer({worldW:3,worldH:2,terrain:()=> 'grass',
  colors:{grass:['#123456']},hash:()=>0,createCanvas:()=>canvas});
 layer.draw({drawImage(){}},0,5,3);
 assert.deepEqual(cells.slice(0,3),[[0,0,1,1],[1,0,2,1],[3,0,2,1]]);
 assert.deepEqual(cells.slice(3),[[0,1,1,2],[1,1,2,2],[3,1,2,2]]);
});
