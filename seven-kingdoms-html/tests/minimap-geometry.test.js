import test from 'node:test';
import assert from 'node:assert/strict';
import {minimapFootprint,minimapViewport} from '../minimap-geometry.js';

test('footprints align to pixel boundaries and clip partly outside the world',()=>{
 assert.deepEqual(minimapFootprint(0,0,2,2,76,66,184,137),{x:0,y:0,width:5,height:5});
 assert.deepEqual(minimapFootprint(75,65,4,4,76,66,184,137),{x:181,y:134,width:3,height:3});
 assert.deepEqual(minimapFootprint(-2,-1,3,2,76,66,184,137),{x:0,y:0,width:3,height:3});
 assert.equal(minimapFootprint(80,70,1,1,76,66,184,137),null);
 assert.equal(minimapFootprint(2,2,0,1,76,66,184,137),null);
});
test('fractional unit markers occupy visible pixels without leaving canvas',()=>{
 const rect=minimapFootprint(75.9,65.9,1,1,76,66,184,137);
 assert.ok(rect);
 assert.ok(rect.x>=0&&rect.y>=0);
 assert.ok(rect.x+rect.width<=184&&rect.y+rect.height<=137);
 assert.ok(rect.width>=1&&rect.height>=1);
});
test('camera border stays fully inside minimap at corners and zoom out',()=>{
 for(const [cx,cy,w,h] of [[0,0,20,20],[76,66,20,20],[38,33,200,200],[38,33,20,20]]){
  const r=minimapViewport(cx,cy,w,h,76,66,184,137,1.2);
  assert.ok(r);
  assert.ok(r.x>=0.6-1e-9&&r.y>=0.6-1e-9);
  assert.ok(r.x+r.width<=183.4+1e-9);
  assert.ok(r.y+r.height<=136.4+1e-9);
 }
 assert.equal(minimapViewport(-100,-100,10,10,76,66,184,137,1.2),null);
});
test('rejects invalid world and pixel dimensions',()=>{
 assert.equal(minimapFootprint(0,0,1,1,0,66,184,137),null);
 assert.equal(minimapViewport(0,0,10,10,76,66,0,137),null);
});
