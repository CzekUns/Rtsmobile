"use strict";
const assert=require("node:assert/strict");
const Core=require("../street-webgl-core.js");
const wall={id:1,z:40,poly:[{x:4,y:-4},{x:6,y:-4},{x:6,y:4},{x:4,y:4}]};
const start={x:0,y:20,z:0},end={x:10,y:20,z:0};
const stopped=Core.sweepCameraMovement(start,end,[wall],2);
assert(stopped.x<4,"Fast joystick motion must stop before thin wall");
assert.equal(stopped.y,20);
assert.equal(stopped.z,0);
assert.equal(Core.sweepCameraMovement({x:0,y:60,z:0},{x:10,y:60,z:0},[wall],2).x,10,
 "Camera above roof can cross");
assert.equal(Core.sweepCameraMovement({x:0,y:20,z:8},{x:10,y:20,z:8},[wall],2).x,10,
 "Street outside wall remains traversable");
console.log("street-webgl-sweep: 3 cases passed");
