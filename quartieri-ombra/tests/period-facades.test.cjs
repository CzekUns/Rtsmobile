"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","game.js"),"utf8");
const a=source.indexOf(" function faceQuad("),b=source.indexOf(" function drawIsoBuilding(",a);
assert(a>=0&&b>a,"The production facade functions must exist in game.js");
function setup(onPoly){
 const ctx={};
 return new Function("ctx","isoPoly",source.slice(a,b)+"\nreturn {faceQuad,drawPeriodFacade};")(ctx,onPoly);
}
const project=(x,y)=>({x:545+(x-y)*.5,y:50+(x+y)*.25});
test("the source facade interpolation follows actual projected wall edges",()=>{
 const {faceQuad}=setup(()=>{});
 const q=faceQuad({x:0,y:0},{x:100,y:50},{x:0,y:80},{x:100,y:130},.2,.8,.2,.7);
 assert.deepEqual(q,[{x:20,y:26},{x:80,y:56},{x:80,y:96},{x:20,y:66}]);
});
test("15 production building facades draw finite independent polygons",()=>{
 let polygons=0,invalid=0;
 const {drawPeriodFacade}=setup(points=>{
  polygons++;if(points.length!==4||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))invalid++;
 });
 for(let i=0;i<15;i++){
  const x=32+i*44,y=68+(i%4)*50,w=98+(i%3)*7,h=70;
  const foot=[project(x,y),project(x+w,y),project(x+w,y+h),project(x,y+h)];
  const roof=foot.map(q=>({x:q.x,y:q.y-(i%3===1?56:48)}));
  drawPeriodFacade({id:i,type:i%3===1?"prod":"res"},foot,roof);
 }
 assert.equal(invalid,0);assert(polygons>=400,"The facades should have meaningful per-building detail");
});
test("period shopfronts and workshops use different architecture",()=>{
 const counts=[];
 const {drawPeriodFacade}=setup(points=>{counts[counts.length-1]++});
 const foot=[project(0,0),project(100,0),project(100,80),project(0,80)];
 const roof=foot.map(q=>({x:q.x,y:q.y-50}));
 for(const b of [{id:0,type:"res"},{id:2,type:"res"},{id:1,type:"prod"}]){
  counts.push(0);drawPeriodFacade(b,foot,roof);
 }
 assert.notEqual(counts[0],counts[1]);
 assert.notEqual(counts[0],counts[2]);
});
