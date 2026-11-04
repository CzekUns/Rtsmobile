"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"..","game.js"),"utf8");
const start=src.indexOf(" const parcels="),end=src.indexOf("\n let game=null",start);
assert(start>=0&&end>start,"source map block");
const context={};vm.runInNewContext("const W=1120,H=680;\n"+src.slice(start,end)+"\nthis.geometry={parcels,streets,defs};",context);
const {parcels,streets,defs}=context.geometry;
function pointRectDistance(px,py,p){
 const [x,y,w,h]=p;return Math.hypot(Math.max(x-px,0,px-(x+w)),Math.max(y-py,0,py-(y+h)));
}
function segmentClearance(a,b,p){
 const length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/2);
 let minimum=Infinity;
 for(let i=0;i<=steps;i++){
  const t=i/steps;
  minimum=Math.min(minimum,pointRectDistance(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,p));
 }
 return minimum;
}
test("all fifteen historic-inspired parcels remain present",()=>{
 assert.equal(parcels.length,15);assert.equal(defs.length,15);
 assert.equal(new Set(defs.map(d=>d.id)).size,15);
});
test("street corridors do not intersect any building or 10-unit collision margin",()=>{
 for(const street of streets){
  for(let i=1;i<street.points.length;i++)for(let j=0;j<parcels.length;j++){
   const clearance=segmentClearance(street.points[i-1],street.points[i],parcels[j]);
   assert(clearance>=street.width/2+10,
     street.name+" segment "+i+" intrudes parcel "+j+" (clearance "+clearance.toFixed(2)+")");
  }
 }
});
test("all building parcels keep the pathfinder safety gap",()=>{
 for(let i=0;i<parcels.length;i++)for(let j=i+1;j<parcels.length;j++){
  const a=parcels[i],b=parcels[j];
  assert(a[0]+a[2]+20<=b[0]||b[0]+b[2]+20<=a[0]||a[1]+a[3]+20<=b[1]||b[1]+b[3]+20<=a[1],"parcel "+i+" overlaps "+j);
 }
});
