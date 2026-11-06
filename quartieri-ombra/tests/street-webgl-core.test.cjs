"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const world=require("../board-world.js").generate(1860);
const Core=require("../street-webgl-core.js");
test("pilot uses the same six authoritative lot IDs; neighbors remain distinct",()=>{
 const result=Core.cluster(world,{radius:450,limit:36});
 assert.deepEqual(result.pilot.map(x=>x.id),[2,3,4,9,10,11]);
 assert.equal(new Set(result.buildings.map(x=>x.id)).size,result.buildings.length);
 assert(result.buildings.length>=6&&result.buildings.length<=36);
 assert.equal(Core.evaluateGeometry(result.buildings).vertices,result.buildings.length*8);
});
test("door frontage is the closest real polygon edge for all pilot buildings",()=>{
 for(const b of Core.cluster(world).pilot){
  const index=Core.doorEdgeIndex(b);
  assert(index>=0&&index<4);
  const d=Core.segmentDistance(b.door,b.poly[index],b.poly[(index+1)%4]);
  for(let i=0;i<4;i++)assert(d<=Core.segmentDistance(b.door,b.poly[i],b.poly[(i+1)%4])+1e-8);
 }
});
test("street camera stays finite with 360-degree orbit including the broken 255-degree view",()=>{
 const target={x:1260,z:950};
 for(const angle of [0,45,90,180,255,270,359,360]){
  const radians=angle*Math.PI/180;
  const p=Core.cameraPoint(target,radians,24,180);
  assert(Object.values(p).every(Number.isFinite));
  assert(Math.abs(Math.hypot(p.x-target.x,p.z-target.z)-180)<1e-8);
  assert(Math.abs(Core.angleDeg(radians)-angle%360)<1e-8);
 }
});
