import test from 'node:test';
import assert from 'node:assert/strict';
import {minimapFootprint,minimapViewport,createMinimapTerrainLayer,minimapKeyboardTarget,installMinimapNavigation} from '../../playtest/minimap-system.js';
import {WorldView} from '../../view.js';
import {WORLD_W,WORLD_H} from '../../rules.js';

test('full-resolution minimap raster covers every pixel without 2x2 terrain sampling',()=>{
 let samples=0,rendered=[],images=0;
 const offscreen={width:0,height:0,getContext(){return {set fillStyle(v){},fillRect(...r){rendered.push(r)}}}};
 const ctx={drawImage(){images++}};
 const layer=createMinimapTerrainLayer({worldW:76,worldH:66,
  terrain(seed,x,y){samples++;return (x+y+seed)%2?'water':'grass';},
  colorFor:t=>t==='water'?'#587f8b':'#81996a',
  createCanvas:()=>offscreen});
 assert.equal(layer.draw(ctx,5,184,137),true);
 assert.equal(samples,76*66);
 assert.equal(images,1);
 assert.equal(rendered.reduce((acc,[, ,w,h])=>acc+w*h,0),184*137);
 layer.draw(ctx,5,184,137);
 assert.equal(samples,76*66,'identical seed and resolution reuse the offscreen raster');
 assert.equal(images,2);
 layer.draw(ctx,6,184,137);
 assert.equal(samples,2*76*66,'changed seed invalidates cached terrain');
 layer.invalidate();
 layer.draw(ctx,6,184,137);
 assert.equal(samples,3*76*66);
});
test('minimap gracefully renders directly when offscreen canvas or drawImage is unavailable',()=>{
 let fills=0;
 const layer=createMinimapTerrainLayer({worldW:4,worldH:3,terrain:()=>0,colorFor:()=> '#fff',createCanvas:()=>null});
 assert.equal(layer.draw({fillRect(){fills++}},0,40,30),false);
 assert.equal(fills,12);
});
test('map entities use actual footprints; camera stroke stays within viewport',()=>{
 assert.deepEqual(minimapFootprint(2,3,4,2,20,10,200,100),{x:20,y:30,width:40,height:20});
 assert.deepEqual(minimapFootprint(-1,-1,3,3,20,10,200,100),{x:0,y:0,width:20,height:20});
 assert.equal(minimapFootprint(-4,1,1,1,20,10,200,100),null);
 const camera=minimapViewport(0,0,10,10,20,10,200,100,2);
 assert.deepEqual(camera,{x:1,y:1,width:49,height:49});
 assert.equal(minimapViewport(2,3,0,10,20,10,200,100),null);
});
test('dragged minimap only captures the chosen pointer; keyboard ignores modified shortcuts',()=>{
 const events={},camera=[],captures=[];
 const minimap={
  addEventListener:(name,fn)=>{events[name]=fn},removeEventListener:(name)=>{delete events[name]},
  getBoundingClientRect:()=>({left:10,top:20,width:100,height:50}),
  setPointerCapture:(id)=>captures.push(id),
  hasPointerCapture:()=>false
 };
 const view={cx:50,cy:40,center(x,y){this.cx=x;this.cy=y;camera.push([x,y]);}};
 const cleanup=installMinimapNavigation(minimap,view,100,80);
 events.pointerdown({pointerType:'mouse',button:2,pointerId:9,clientX:60,clientY:45});
 assert.equal(camera.length,0);
 events.pointerdown({pointerType:'touch',pointerId:7,clientX:60,clientY:45});
 assert.deepEqual(camera.at(-1),[50,40]);assert.deepEqual(captures,[7]);
 events.pointermove({pointerId:8,clientX:110,clientY:70});
 assert.equal(camera.length,1);
 events.pointermove({pointerId:7,clientX:220,clientY:-20});
 assert.deepEqual(camera.at(-1),[100,0]);
 events.pointercancel({pointerId:7});
 events.pointermove({pointerId:7,clientX:10,clientY:20});
 assert.equal(camera.length,2);
 let prevented=0;
 events.keydown({key:'Home',preventDefault(){prevented++}});
 assert.deepEqual(camera.at(-1),[50,40]);assert.equal(prevented,1);
 events.keydown({key:'ArrowRight',ctrlKey:true});
 assert.equal(prevented,1);
 assert.deepEqual(minimapKeyboardTarget({key:'ArrowUp'},{x:5,y:0},100,80),{x:5,y:0});
 cleanup();assert.equal(Object.keys(events).length,0);
});
test('world minimap draws town, firm, pending site, moving unit and clipped camera over static terrain',()=>{
 const rects=[],strokes=[],ctx={set fillStyle(v){this.color=v},get fillStyle(){return this.color},strokeStyle:'',
  fillRect(...a){rects.push({a,color:this.color})},strokeRect(...a){strokes.push(a)}};
 const view=Object.create(WorldView.prototype);
 view.mini={width:184,height:137};view.mctx=ctx;
 view.canvas={width:640,height:400};view.tileSize=24;view.zoom=1;view.cx=0;view.cy=0;
 let terrainCount=0;view.minimapTerrain={draw(){terrainCount++}};
 const g={seed:4,towns:[{x:2,y:4,size:4,owner:1}],
  firms:[{x:5,y:7,size:3,owner:2}],
  constructionSites:[{x:10,y:8,size:3,status:'walking'}],
  units:[{x:12.3,y:13.6,owner:2}]};
 view.drawMini(g);
 assert.equal(terrainCount,1);
 assert.equal(rects.length,4,'background plus town firm and one moving unit');
 assert.deepEqual(rects[1].a,[Math.floor(2*184/WORLD_W),Math.floor(4*137/WORLD_H),
  Math.ceil(6*184/WORLD_W)-Math.floor(2*184/WORLD_W),
  Math.ceil(8*137/WORLD_H)-Math.floor(4*137/WORLD_H)]);
 assert.equal(strokes.length,2,'pending site and camera');
 assert.ok(strokes.at(-1)[0]>=0&&strokes.at(-1)[1]>=0);
});
