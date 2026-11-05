"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"..","game.js"),"utf8");
const start=source.indexOf(" function pointerMidpoint("),end=source.indexOf(' canvas.addEventListener("wheel"',start);
assert.ok(start>=0&&end>start,"Gesture handlers must be present");
const handlers=source.slice(start,end);
function harness(){
 const events={},pointers=new Map(),camera={zoom:2,offsetX:300,offsetY:100},canvas={setPointerCapture(){},addEventListener(k,fn){events[k]=fn}};
 let taps=0;
 const sandbox={canvas,pointerPositions:pointers,camera,dragStart:null,pinchDistance:null,pinchCenter:null,gestureConsumed:false,
 screenPoint:e=>({x:e.clientX,y:e.clientY}),distance:(a,b,c,d)=>Math.hypot(a-c,b-d),
 constrainCamera(){},zoomAt(f){camera.zoom*=f},worldPoint:p=>p,tap(){taps++}};
 vm.createContext(sandbox);vm.runInContext(handlers,sandbox);
 const pointer=(id,x,y,type)=>({pointerId:id,clientX:x,clientY:y,type,preventDefault(){}});
 const fire=(type,id,x,y)=>events[type](pointer(id,x,y,type));
 return {fire,camera,pointers,taps:()=>taps,events};
}
test("one-finger tap remains available",()=>{
 const h=harness();h.fire("pointerdown",1,100,100);h.fire("pointerup",1,100,100);
 assert.equal(h.taps(),1);assert.equal(h.pointers.size,0);
});
test("two-finger translation pans without selecting a building",()=>{
 const h=harness();h.fire("pointerdown",1,100,100);h.fire("pointerdown",2,200,100);
 h.fire("pointermove",1,120,100);h.fire("pointermove",2,220,100);
 assert.ok(h.camera.offsetX<300);
 h.fire("pointerup",1,120,100);h.fire("pointerup",2,220,100);
 assert.equal(h.taps(),0);assert.equal(h.pointers.size,0);
});
test("pinch changes zoom and cancelled pointers leave no phantom tap",()=>{
 const h=harness();h.fire("pointerdown",1,100,100);h.fire("pointerdown",2,200,100);
 h.fire("pointermove",2,240,100);assert.ok(h.camera.zoom>2);
 h.fire("pointercancel",1,100,100);h.fire("lostpointercapture",2,240,100);
 assert.equal(h.pointers.size,0);assert.equal(h.taps(),0);
 h.fire("pointerdown",3,100,100);h.fire("pointerup",3,100,100);assert.equal(h.taps(),1);
});
