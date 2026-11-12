import test from 'node:test';
import assert from 'node:assert/strict';
import {WorldView} from '../../view.js';

function fixture(originalTerrain){
 const calls=[];
 const ctx={setLineDash(v){calls.push(['dash',...v]);},beginPath(){calls.push(['begin']);},
  moveTo(){calls.push(['move']);},lineTo(){calls.push(['line']);},stroke(){calls.push(['stroke']);}};
 const town={x:3,y:5,size:3};
 const game={firms:[{x:8,y:9,size:3}],nearestTown(){return town;},linked(){return true;}};
 const view={originalTerrain,screen(x,y){return {x,y}}};
 WorldView.prototype.drawDemoLinks.call(view,game,ctx,24);
 return calls;
}

test('authentic terrain mode never overlays invented straight-line roads',()=>{
 assert.deepEqual(fixture({drawTile(){return true}}),[]);
});

test('procedural demo retains connected-settlement navigation hints',()=>{
 const calls=fixture(null);
 assert.equal(calls.filter(x=>x[0]==='stroke').length,1);
 assert.deepEqual(calls.at(-1),['dash']);
});

test('unlinked demo firms do not produce road strokes',()=>{
 const calls=[];
 const ctx={setLineDash(){},beginPath(){calls.push('begin')},moveTo(){},lineTo(){},stroke(){calls.push('stroke')}};
 WorldView.prototype.drawDemoLinks.call({originalTerrain:null,screen(){return {x:0,y:0}}},
  {firms:[{x:0,y:0,size:2}],nearestTown(){return null},linked(){return false}},ctx,24);
 assert.deepEqual(calls,[]);
});
