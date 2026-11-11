import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldView } from '../../view.js';
import { WORLD_W, WORLD_H, NATIONS } from '../../rules.js';

test('minimap draws true tile footprints and moving unit coordinates', () => {
  const rectangles=[];
  const ctx={
    fillStyle:'',strokeStyle:'',lineWidth:0,
    fillRect(...args){rectangles.push({color:this.fillStyle,args});},
    strokeRect(){}
  };
  const view=Object.create(WorldView.prototype);
  view.mini={width:184,height:137};
  view.mctx=ctx;
  view.canvas={width:612,height:528};
  view.tileSize=24;view.zoom=1;view.cx=27;view.cy=27;
  const owner=Object.keys(NATIONS)[0];
  const town={x:4,y:6,size:3,owner};
  const firm={x:12,y:9,size:2,owner};
  const unit={x:19.5,y:13.25,owner};
  view.drawMini({seed:1,towns:[town],firms:[firm],units:[unit]});
  const dx=184/WORLD_W,dy=137/WORLD_H;
  const markers=rectangles.slice(-3);
  assert.deepEqual(markers.map(r=>r.args),[
    [4*dx,6*dy,3*dx,3*dy],
    [12*dx,9*dy,2*dx,2*dy],
    [19.5*dx,13.25*dy,Math.max(1,dx),Math.max(1,dy)]
  ]);
  assert.ok(markers.every(r=>r.color===NATIONS[owner].color));
});
