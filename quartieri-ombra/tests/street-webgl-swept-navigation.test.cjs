const assert=require('node:assert/strict');
const {test}=require('node:test');
const Core=require('../street-webgl-core.js');
const wall={id:1,z:30,poly:[{x:10,y:0},{x:12,y:0},{x:12,y:20},{x:10,y:20}]};
test('swept joystick movement stops before a thin building',()=>{
 const end=Core.sweepCameraMovement({x:0,y:10,z:10},{x:30,y:10,z:10},[wall]);
 assert.ok(end.x<10);
});
test('movement above the roof remains free',()=>{
 assert.equal(Core.sweepCameraMovement({x:0,y:40,z:10},{x:30,y:40,z:10},[wall]).x,30);
});
test('street parallel to a building remains navigable',()=>{
 assert.equal(Core.sweepCameraMovement({x:0,y:10,z:30},{x:30,y:10,z:30},[wall]).x,30);
});
test('stationary camera remains stationary',()=>{
 assert.equal(Core.sweepCameraMovement({x:0,y:10,z:10},{x:0,y:10,z:10},[wall]).x,0);
});
