import test from 'node:test';
import assert from 'node:assert/strict';
import {WorldView} from '../../view.js';
import {WORLD_W,WORLD_H,terrain} from '../../rules.js';

function fixture(width=184,height=137) {
 const fills=[];
 const mctx={
  fillStyle:'',strokeStyle:'',lineWidth:0,
  fillRect(x,y,w,h){fills.push({x,y,w,h,color:this.fillStyle});},
  strokeRect(){}
 };
 const canvas={width:640,height:400,getContext(){return {}}};
 const mini={width,height,getContext(){return mctx}};
 return {view:new WorldView(canvas,mini),fills};
}

test('minimap paints every world tile at its own coordinates',()=>{
 const {view,fills}=fixture();
 view.drawMini({seed:5,towns:[],firms:[]});
 assert.equal(fills.length,1+WORLD_W*WORLD_H);
 const dx=view.mini.width/WORLD_W,dy=view.mini.height/WORLD_H;
 for(let y=0;y<WORLD_H;y++)for(let x=0;x<WORLD_W;x++){
  const p=fills[1+y*WORLD_W+x];
  assert.equal(p.x,x*dx);
  assert.equal(p.y,y*dy);
  assert.equal(p.w,dx);
  assert.equal(p.h,dy);
 }
});

test('adjacent differing terrain tiles keep separate colors, including coast',()=>{
 const {view,fills}=fixture();
 const seed=5;
 view.drawMini({seed,towns:[],firms:[]});
 const palette={grass:'#81996a',forest:'#496d46',hill:'#a59d7f',dry:'#b6a983',water:'#587f8b'};
 let boundaries=0,coasts=0;
 for(let y=0;y<WORLD_H;y++)for(let x=0;x<WORLD_W-1;x++){
  const a=terrain(seed,x,y),b=terrain(seed,x+1,y);
  if(a===b)continue;
  boundaries++;
  if(a==='water'||b==='water')coasts++;
  assert.equal(fills[1+y*WORLD_W+x].color,palette[a]);
  assert.equal(fills[1+y*WORLD_W+x+1].color,palette[b]);
 }
 assert.ok(boundaries>0,'fixture must include transitions');
 assert.ok(coasts>0,'fixture must include coast transitions');
});

test('terrain rectangles cover world extent at non-native minimap size',()=>{
 const {view,fills}=fixture(230,101);
 view.drawMini({seed:12,towns:[],firms:[]});
 const last=fills.at(-1);
 assert.ok(Math.abs(last.x+last.w-230)<1e-9);
 assert.ok(Math.abs(last.y+last.h-101)<1e-9);
});
