"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const worldModel=require("../board-world.js");
const joins=require("../block-continuity.js");
const world=worldModel.generate(1860);
const layout=joins.build(world.buildings,worldModel.project);
test("street rows stitch many neighboring buildings without changing world topology",()=>{
 assert.equal(world.buildings.length,454);
 assert.equal(layout.stats.buildings,world.buildings.length);
 assert(layout.joints.length>=270,"Expected many connected historical street-front gaps");
 assert(layout.stats.multiBuildingGroups>=70);
 assert(layout.joints.every(j=>j.gap>0&&j.gap<=18));
 assert(layout.joints.some(j=>j.kind==="shared"));
 assert(layout.joints.some(j=>j.kind==="passage"));
});
test("no row join crosses a road, faces the opposing side, or uses one endpoint twice",()=>{
 const used=new Set();
 for(const j of layout.joints){
  const a=layout.byId.get(j.left),b=layout.byId.get(j.right);
  assert.equal(a.b.roadId,b.b.roadId);
  const facing=a.inward.x*b.inward.x+a.inward.y*b.inward.y;
  assert(facing>.93);
  for(const end of [j.left+":R",j.right+":L"]){
   assert(!used.has(end),"Repeated street frontage end "+end);
   used.add(end);
  }
  const d=(u,v)=>Math.hypot(u.x-v.x,u.y-v.y);
  assert(d(j.frontA,j.frontB)<=18.00001);
  assert(d(j.rearA,j.rearB)<=27.00001);
 }
});
test("raster orientation is deterministic and only matches approved facade axes",()=>{
 const repeat=joins.build(worldModel.generate(1860).buildings,worldModel.project);
 assert.deepEqual(layout.joints,repeat.joints);
 assert(layout.stats.supported>100);
 for(const [id,f] of layout.byId){
  assert(["A","B","unmatched"].includes(f.kind));
  if(f.kind!=="unmatched"){
   assert(f.facing);
   assert(f.error<=22.00001);
  }
 }
});
test("board variants load joints before renderer and retain existing game",()=>{
 const root=path.resolve(__dirname,"..");
 for(const file of ["board-preview.html","board-1860.html"]){
  const s=fs.readFileSync(path.join(root,file),"utf8");
  const a=s.indexOf("block-continuity.js"),b=s.indexOf("board-preview.js");
  assert(a>0&&b>a,"Module missing/incorrect load order: "+file);
 }
 const preview=fs.readFileSync(path.join(root,"board-preview.js"),"utf8");
 assert(preview.includes("drawStreetFootings();"));
 assert(preview.includes("drawMasonryJoint(layer.obj)"));
 assert(preview.includes("frontX-rw/2,frontY-rh"));
 assert(preview.includes('front.kind==="unmatched"'));
 new Function(preview);
});
