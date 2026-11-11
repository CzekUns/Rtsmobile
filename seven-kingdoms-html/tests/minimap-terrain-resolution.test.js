import test from 'node:test';
import assert from 'node:assert/strict';
import {WorldView} from '../view.js';
import {WORLD_W,WORLD_H,terrain} from '../rules.js';

function makeView(width=184,height=137){
 const rects=[];
 const ctx={fillStyle:'',fillRect(...args){rects.push({color:this.fillStyle,args})},strokeRect(){}};
 const view=Object.create(WorldView.prototype);
 view.mini={width,height};view.mctx=ctx;
 view.canvas={width:612,height:528};view.tileSize=24;view.zoom=1;
 view.cx=WORLD_W/2;view.cy=WORLD_H/2;
 return {view,rects};
}

test('minimap terrain paints each world tile once with gap-free integer pixel edges',()=>{
 const {view,rects}=makeView();
 view.drawMini({seed:7,towns:[],firms:[],units:[]});
 const tiles=rects.slice(1);
 assert.equal(tiles.length,WORLD_W*WORLD_H);
 const dx=view.mini.width/WORLD_W,dy=view.mini.height/WORLD_H;
 for(const [x,y] of [[0,0],[1,0],[WORLD_W-1,0],[0,WORLD_H-1],[WORLD_W-1,WORLD_H-1]]){
  const cell=tiles[y*WORLD_W+x];
  assert.deepEqual(cell.args,[Math.floor(x*dx),Math.floor(y*dy),Math.floor((x+1)*dx)-Math.floor(x*dx),Math.floor((y+1)*dy)-Math.floor(y*dy)]);
 }
 for(let y=0;y<WORLD_H;y++){
  let end=0;
  for(let x=0;x<WORLD_W;x++){
   const [left,top,w,h]=tiles[y*WORLD_W+x].args;
   assert.equal(left,end);assert.ok(w>0&&h>0);end=left+w;
   assert.equal(top,Math.floor(y*dy));
  }
  assert.equal(end,view.mini.width);
 }
});

test('minimap terrain retains the same deterministic tile shade as the world view',()=>{
 const seed=11,{view,rects}=makeView();
 view.drawMini({seed,towns:[],firms:[],units:[]});
 const tiles=rects.slice(1);
 const ctx={fillStyle:'',fillRect(){}};
 for(const [x,y] of [[0,0],[5,8],[WORLD_W-1,WORLD_H-1]]){
  assert.ok(terrain(seed,x,y));
  WorldView.prototype.tileDraw.call({screen:(tx,ty)=>({x:tx,y:ty}),originalTerrain:null}, {seed},ctx,x,y,1);
  assert.equal(tiles[y*WORLD_W+x].color,ctx.fillStyle);
 }
});
