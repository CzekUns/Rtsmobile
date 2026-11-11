import test from 'node:test';
import assert from 'node:assert/strict';
import {WorldView} from '../../view.js';

function fixture(sites){
 const strokes=[];
 const mctx={
  fillRect(){},
  strokeRect(...args){strokes.push({args,color:this.strokeStyle});}
 };
 const world={width:612,height:528,getContext:()=>({})};
 const mini={width:184,height:137,getContext:()=>mctx};
 const view=new WorldView(world,mini);
 const game={seed:7,towns:[],firms:[],units:[],constructionSites:sites};
 view.drawMini(game);
 return strokes;
}

test('pending site is outlined with the existing construction color',()=>{
 const strokes=fixture([{x:10,y:12,size:3,status:'walking'}]);
 assert.equal(strokes.length,2); // construction footprint + camera
 assert.equal(strokes[0].color,'#f4cb63');
 assert.ok(strokes[0].args[2]>0&&strokes[0].args[3]>0);
});

test('only pending walking sites are drawn, not completed/cancelled entries',()=>{
 const strokes=fixture([
  {x:10,y:12,size:3,status:'walking'},
  {x:20,y:20,size:3,status:'completed'},
  {x:30,y:30,size:3,status:'cancelled'}
 ]);
 assert.equal(strokes.filter(x=>x.color==='#f4cb63').length,1);
});

test('site outside world is omitted and edge footprint remains clipped',()=>{
 const strokes=fixture([
  {x:-9,y:0,size:2,status:'walking'},
  {x:75,y:65,size:3,status:'walking'}
 ]);
 const sites=strokes.filter(x=>x.color==='#f4cb63');
 assert.equal(sites.length,1);
 const [x,y,w,h]=sites[0].args;
 assert.ok(x>=0&&y>=0&&x+w<=184&&y+h<=137);
});

test('missing constructionSites remains compatible with old saves',()=>{
 const strokes=fixture(undefined);
 assert.equal(strokes.filter(x=>x.color==='#f4cb63').length,0);
});
