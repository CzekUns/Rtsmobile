const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../street-webgl-core.js');
const wall={z:30,poly:[{x:5,y:-1},{x:5.2,y:-1},{x:5.2,y:1},{x:5,y:1}]};
const start={x:0,y:12,z:0};
test('fast joystick cannot tunnel through a thin building',()=>{
 const p=Core.sweepCameraMovement(start,{x:10,y:12,z:0},[wall],.5);
 assert.ok(p.x>=4&&p.x<5);
});
test('above roof remains traversable',()=>{
 assert.equal(Core.sweepCameraMovement({...start,y:40},{x:10,y:40,z:0},[wall],.5).x,10);
});
test('street beside building remains traversable',()=>{
 assert.equal(Core.sweepCameraMovement({...start,z:4},{x:10,y:12,z:4},[wall],.5).x,10);
});
test('very long movement cannot bypass intersection by sampling cap',()=>{
 assert.ok(Core.sweepCameraMovement(start,{x:100000,y:12,z:0},[wall],.5).x<5);
});
