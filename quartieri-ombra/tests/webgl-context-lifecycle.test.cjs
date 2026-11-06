const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","street-webgl.js"),"utf8");
const tail=source.slice(source.indexOf("let stopped=false,frameRequested=false,lastFrameTime=null;"));
assert.ok(tail.startsWith("let stopped=false,frameRequested=false,lastFrameTime=null;"),"RAF lifecycle found");
const listeners={},frames=[],status={textContent:""},renderer={
 domElement:{addEventListener:(name,fn)=>{listeners[name]=fn}},
 render:()=>{renderer.renders++},renders:0
};
const sandbox={
 renderer,status,lastUiState:"ready",resize:()=>{sandbox.resizes++},resizes:0,
 controls:{update:()=>{}},scene:{},camera:{},updateHUD:()=>{},\n stickReset:()=>{},stepStickMovement:()=>{},keepCameraOutside:()=>{},updateVisibleCity:()=>{},
 document:{hidden:false},requestAnimationFrame:fn=>{frames.push(fn)}
};
vm.runInNewContext(tail,sandbox);
assert.equal(frames.length,1,"one frame scheduled at boot");
frames.shift()();
assert.equal(renderer.renders,1,"frame renders normally");
assert.equal(frames.length,1,"one next frame scheduled");
let prevented=false;
listeners.webglcontextlost({preventDefault:()=>{prevented=true}});
assert.equal(prevented,true);
frames.shift()();
assert.equal(renderer.renders,1,"queued frame must not render during loss");
assert.equal(frames.length,0,"lost context must not schedule new frames");
listeners.webglcontextrestored();
assert.equal(sandbox.resizes,1,"restoration resizes viewport");
assert.equal(frames.length,1,"restoration resumes RAF");
listeners.webglcontextrestored();
assert.equal(frames.length,1,"duplicate restoration cannot double RAF");
frames.shift()();
assert.equal(renderer.renders,2,"rendering resumes");
console.log("PASS WebGL context loss/restore RAF lifecycle");
