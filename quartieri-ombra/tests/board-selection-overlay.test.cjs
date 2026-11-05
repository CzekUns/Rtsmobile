"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const O=require("../board-selection-overlay.js");
function lot(id,x,y,z=10){
 const ground=[{x,y},{x:x+20,y},{x:x+20,y:y+10},{x,y:y+10}],roof=ground.map(p=>({x:p.x,y:p.y-z}));
 return{id,ground,roof,projectedBounds:{left:x,right:x+20,top:y-z,bottom:y+10}};
}
test("volumetric silhouette is deterministic, convex, and based on eight real vertices",()=>{
 const b=lot(2,0,20),h=O.silhouette(b);
 assert.deepEqual(h,[{x:0,y:10},{x:20,y:10},{x:20,y:30},{x:0,y:30}]);
 assert.equal(O.roofCenter(b).y,15);
});
test("only nearer buildings with overlapping projected envelopes mask a selection",()=>{
 const back=lot(2,0,10),front=lot(3,8,19),away=lot(4,200,40),rear=lot(5,4,0);
 const skeleton={ordered:[rear,back,front,away]};
 assert.deepEqual(O.occluders(skeleton,back).map(l=>l.id),[3]);
 assert.deepEqual(O.occluders(skeleton,front).map(l=>l.id),[]);
});
test("each occluder contributes a separate evenodd clipping step",()=>{
 const target=lot(0,0,10),a=lot(1,5,16),b=lot(2,12,18),log=[];
 const ctx={beginPath:()=>log.push("begin"),rect:()=>log.push("rect"),moveTo:()=>{},lineTo:()=>{},closePath:()=>{},clip:rule=>log.push(rule||"normal")};
 assert.equal(O.clipVisible(ctx,{ordered:[target,a,b]},target),2);
 assert.deepEqual(log.filter(x=>x==="evenodd"),["evenodd","evenodd"]);
 O.clipLot(ctx,target);assert.equal(log.at(-1),"normal");
});
