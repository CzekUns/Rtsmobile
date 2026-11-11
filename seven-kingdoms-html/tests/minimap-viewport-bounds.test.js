import test from 'node:test';
import assert from 'node:assert/strict';
import {WorldView} from '../view.js';
import {WORLD_W,WORLD_H} from '../rules.js';

function fixture(){
 const rectangles=[];
 const context={
  fillRect(){},strokeRect(...args){rectangles.push(args)},
 };
 const world={width:612,height:528,getContext:()=>context};
 const mini={width:184,height:137,getContext:()=>context};
 const view=new WorldView(world,mini);
 const game={seed:1,towns:[],firms:[],units:[]};
 return {view,game,rectangles};
}
test('minimap camera outline stays inside map at all four edges',()=>{
 const {view,game,rectangles}=fixture();
 for(const [x,y] of [[0,0],[0,WORLD_H],[WORLD_W,0],[WORLD_W,WORLD_H],[WORLD_W/2,WORLD_H/2]]){
  view.center(x,y);
  view.drawMini(game);
  const [left,top,width,height]=rectangles.at(-1);
  assert.ok(left>=0 && top>=0,[left,top]);
  assert.ok(width>0 && height>0);
  assert.ok(left+width<=view.mini.width+1e-9);
  assert.ok(top+height<=view.mini.height+1e-9);
 }
});
test('minimap camera outline covers entire minimap when viewport exceeds world',()=>{
 const {view,game,rectangles}=fixture();
 view.tileSize=1;view.center(WORLD_W/2,WORLD_H/2);
 view.drawMini(game);
 assert.deepEqual(rectangles.at(-1),[0,0,184,137]);
});
test('minimap click maps corners and center to world coordinates',()=>{
 const {view}=fixture();
 view.minimapAt(0,0);
 assert.equal(view.cx,0);assert.equal(view.cy,0);
 view.minimapAt(view.mini.width/2,view.mini.height/2);
 assert.equal(view.cx,WORLD_W/2);assert.equal(view.cy,WORLD_H/2);
});
