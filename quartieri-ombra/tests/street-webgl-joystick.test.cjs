"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const Core=require("../street-webgl-core.js");

function close(a,b,epsilon=1e-8){assert(Math.abs(a-b)<epsilon,`${a} ≠ ${b}`)}
test("joystick center and small thumb drift stop the camera",()=>{
 assert.deepEqual(Core.joystickAxes(0,0),{x:0,y:0});
 assert.deepEqual(Core.joystickAxes(3,4,38,.14),{x:0,y:0});
 assert.deepEqual(Core.joystickAxes(NaN,5),{x:0,y:0});
});
test("joystick diagonal clamps to a circle and max input",()=>{
 const vector=Core.joystickAxes(100,100,38);
 close(Math.hypot(vector.x,vector.y),1);
 const right=Core.joystickAxes(38,0,38);
 close(right.x,1);close(right.y,0);
 const up=Core.joystickAxes(0,38,38);
 close(up.x,0);close(up.y,1);
});
test("up follows camera gaze and right strafes; 255-degree orbit is finite",()=>{
 const north=Core.joystickDisplacement({x:0,z:200},{x:0,y:1},80,.05);
 close(north.x,0);close(north.z,-4);
 const east=Core.joystickDisplacement({x:0,z:200},{x:1,y:0},80,.05);
 close(east.x,4);close(east.z,0);
 const south=Core.joystickDisplacement({x:0,z:-200},{x:0,y:1},80,.05);
 close(south.z,4);
 const angle=255*Math.PI/180;
 const at255=Core.joystickDisplacement({x:Math.sin(angle)*220,z:Math.cos(angle)*220},{x:0,y:1},80,.05);
 close(Math.hypot(at255.x,at255.z),4);
 assert(Number.isFinite(at255.x)&&Number.isFinite(at255.z));
});
test("movement cannot jump after frame stalls, and leaves camera altitude alone",()=>{
 const delta=Core.joystickDisplacement({x:0,z:150},{x:0,y:1},88,5);
 close(delta.z,-4.4);
 assert.deepEqual(Core.joystickDisplacement({x:0,z:150},{x:1,y:1},88,0),{x:0,z:0});
 assert.deepEqual(Core.joystickDisplacement({x:0,z:0},{x:1,y:0},88,.05),{x:0,z:0});
});
test("WEBGL page has a joystick over the responsive HUD without replacing touch orbit",()=>{
 const root=path.resolve(__dirname,"..");
 const html=fs.readFileSync(path.join(root,"street-webgl.html"),"utf8");
 const renderer=fs.readFileSync(path.join(root,"street-webgl.js"),"utf8");
 for(const fragment of ['id="move-stick"','id="move-stick-thumb"','id="webgl-controls"','--webgl-hud-height'])
  assert(html.includes(fragment)||renderer.includes(fragment),fragment);
 for(const fragment of ["Core.joystickAxes","Core.joystickDisplacement","stickEl.setPointerCapture","lostpointercapture","stepStickMovement(delta)","keepCameraOutside()","pointerup"])
  assert(renderer.includes(fragment),fragment);
 assert(renderer.indexOf("stepStickMovement(delta)")<renderer.indexOf("keepCameraOutside();\n  updateVisibleCity();\n  renderer.render"));
 assert(renderer.includes("const controls=new OrbitControls"));
});
