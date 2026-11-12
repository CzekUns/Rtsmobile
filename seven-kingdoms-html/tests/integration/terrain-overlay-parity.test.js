import test from 'node:test';
import assert from 'node:assert/strict';
import {WorldView} from '../../view.js';

// Exercise the actual WorldView.tileDraw entrypoint, not a duplicated algorithm.
// The source terrain classification is deliberately left to rules.js.
function drawTile({atlas, size=24, x=1, y=1}={}){
 const calls=[];
 const ctx={
  fillRect(...args){calls.push(['fillRect',...args]);},
  beginPath(){calls.push(['beginPath']);},
  moveTo(){calls.push(['moveTo']);},
  lineTo(){calls.push(['lineTo']);},
  closePath(){calls.push(['closePath']);},
  arc(){calls.push(['arc']);},
  fill(){calls.push(['fill']);}
 };
 const fake={
  screen(tx,ty){return {x:tx*size,y:ty*size};},
  originalTerrain:{drawTile(){calls.push(['atlas']);return atlas;}}
 };
 WorldView.prototype.tileDraw.call(fake,{seed:7},ctx,x,y,size);
 return calls;
}
test('loaded original ground does not receive procedural demo shapes',()=>{
 const calls=drawTile({atlas:true});
 assert.deepEqual(calls,[['atlas']]);
});
test('unavailable original ground keeps complete procedural fallback',()=>{
 const calls=drawTile({atlas:false});
 assert.equal(calls[0][0],'atlas');
 assert.ok(calls.some(call=>call[0]==='fillRect'));
});
test('small tiles still draw original ground without demo ornaments',()=>{
 assert.deepEqual(drawTile({atlas:true,size:8}),[['atlas']]);
});
test('small fallback tiles still paint their base color',()=>{
 const calls=drawTile({atlas:false,size:8});
 assert.ok(calls.some(call=>call[0]==='fillRect'));
 assert.ok(!calls.some(call=>call[0]==='arc'));
});
