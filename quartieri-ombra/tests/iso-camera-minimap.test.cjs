"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"..","game.js"),"utf8");
function between(a,b){const start=source.indexOf(a),end=source.indexOf(b,start);assert.ok(start>=0&&end>start);return source.slice(start,end)}
const cameraCode=between("function clampAxis(","function resizeWorld()");
const isoCode=between("function isoPoint(","function isoPoly(");
function setup(width,height,zoom){
 const sandbox={canvas:{width,height},W:1120,H:680,camera:{zoom,offsetX:0,offsetY:0},clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};
 vm.createContext(sandbox);
 vm.runInContext("const CAMERA_BOUNDS={left:170,top:-110,right:960,bottom:545};function coverScale(){return Math.max(canvas.width/W,canvas.height/H)}function visibleWorld(){const scale=coverScale()*camera.zoom;return {w:canvas.width/scale,h:canvas.height/scale}};"+cameraCode,sandbox);
 return sandbox;
}
for(const [width,height] of [[1280,720],[1600,900],[844,390],[1920,1080]]){
 for(const zoom of [1,2.6])test("camera bounds "+width+"x"+height+" zoom "+zoom,()=>{
   const s=setup(width,height,zoom);
   s.camera.offsetX=1e5;s.camera.offsetY=1e5;s.constrainCamera();
   const v=s.visibleWorld();
   assert.ok(s.camera.offsetX+v.w>=960-1e-5);
   assert.ok(s.camera.offsetY+v.h>=545-1e-5);
   s.camera.offsetX=-1e5;s.camera.offsetY=-1e5;s.constrainCamera();
   assert.ok(s.camera.offsetX<=170+1e-5);
   assert.ok(s.camera.offsetY<=-110+1e-5);
 });
}
test("minimap uses projected points and actual camera bounds",()=>{
 assert.match(source,/function drawMini\(\)/);
 assert.match(source,/const center=isoPoint\(b\.x\+b\.w\/2,b\.y\+b\.h\/2\)/);
 assert.match(source,/miniPoint\(camera\.offsetX,camera\.offsetY\)/);
 assert.match(source,/street\.points\.forEach/);
});
test("isometric forward/inverse coordinates remain bijective",()=>{
 const sandbox={W:1120,H:680,ctx:{}};vm.createContext(sandbox);
 vm.runInContext("const ISO={ox:W/2,oy:40,sx:.48,sy:.24};"+isoCode,sandbox);
 for(let x=0;x<=1120;x+=70)for(let y=0;y<=680;y+=40){
   const p=sandbox.isoPoint(x,y),q=sandbox.isoInverse(p.x,p.y);
   assert.ok(Math.abs(q.x-x)<1e-8&&Math.abs(q.y-y)<1e-8);
 }
});
