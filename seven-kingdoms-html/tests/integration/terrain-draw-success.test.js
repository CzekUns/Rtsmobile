import test from 'node:test';
import assert from 'node:assert/strict';
import {WorldView} from '../../view.js';

function scenario(drawSuccess){
 const strokes=[];
 const ctx={
  fillRect(){},setLineDash(){},beginPath(){},moveTo(){},lineTo(){},
  stroke(){strokes.push('stroke')},closePath(){},arc(){},fill(){}
 };
 const view={
  originalTerrain:{isReady(){return true},drawTile(){return drawSuccess}},
  screen(x,y){return {x,y}},
  authenticTilesDrawn:0
 };
 const game={seed:4,firms:[{x:2,y:2,size:2}],nearestTown(){return {x:8,y:8,size:3}},linked(){return true}};
 for(let y=0;y<2;y++)for(let x=0;x<2;x++)WorldView.prototype.tileDraw.call(view,game,ctx,x,y,24);
 WorldView.prototype.drawDemoLinks.call(view,game,ctx,24);
 return {strokes,drawn:view.authenticTilesDrawn};
}

test('ready atlas with failing drawImage retains demo connections in procedural fallback',()=>{
 const result=scenario(false);
 assert.equal(result.drawn,0);
 assert.equal(result.strokes.length,1);
});

test('successful atlas rendering hides invented demo connections',()=>{
 const result=scenario(true);
 assert.equal(result.drawn,4);
 assert.equal(result.strokes.length,0);
});

test('a partial atlas success suppresses invented lines over original tiles',()=>{
 let n=0;
 const result=scenario(()=>++n===1);
 assert.equal(result.drawn,1);
 assert.equal(result.strokes.length,0);
});
