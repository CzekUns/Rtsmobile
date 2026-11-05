"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const World=require("../board-world.js");
const Rows=require("../block-continuity.js");
const Skeleton=require("../board-skeleton.js");
const Art=require("../board-chunks.js");
const world=World.generate(1860),rows=Rows.build(world.buildings,World.project);
const skeleton=Skeleton.create(world,World.project,rows,World.inverse);
function mid(poly){return{x:poly.reduce((s,p)=>s+p.x,0)/poly.length,y:poly.reduce((s,p)=>s+p.y,0)/poly.length}}
test("all city lots are addressable independently of grouped graphic chunks",()=>{
 assert.equal(skeleton.lots.length,454);
 assert.equal(skeleton.byId.size,454);
 assert.equal(skeleton.chunks.length,117);
 assert.equal(skeleton.chunks.reduce((n,c)=>n+c.lotIds.length,0),454);
 assert.equal(new Set(skeleton.chunks.flatMap(c=>c.lotIds)).size,454);
 for(const lot of skeleton.lots){
  assert.equal(lot.ground.length,4);
  assert.equal(lot.roof.length,4);
  assert.equal(lot.faces.length,4);
  assert.equal(lot.frontage.length,2);
  assert.equal(lot.door.x,World.project(lot.building.door.x,lot.building.door.y).x);
  assert(["residential","active","decorative"].includes(lot.use));
  assert(skeleton.chunkByLot.has(lot.id));
 }
});
test("clicking a real roof and the five-point road never uses sprite bounding boxes",()=>{
 const lot=skeleton.byId.get(2),hit=Skeleton.pick(skeleton,mid(lot.roof));
 assert.equal(hit.kind,"building");assert.equal(hit.lot.id,2);assert.equal(hit.side,"roof");
 const street=Skeleton.pick(skeleton,World.project(world.hub.x,world.hub.y));
 assert.equal(street.kind,"street");assert.equal(street.road.name,"Cross Street");
 assert.equal(Skeleton.pick(skeleton,{x:1e8,y:1e8}).kind,"empty");
});
test("Cross Street art section is one visual chunk with six independent hitboxes",()=>{
 const target=skeleton.chunkByLot.get(2);
 assert.equal(target.id,"block-2");
 assert.deepEqual(target.lotIds,[2,3,4,9,10,11]);
 const svg=Skeleton.svgGuide(skeleton,target.id,{title:"Cross Street block"});
 assert.match(svg,/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 assert.match(svg,/street/i);
 assert.equal((svg.match(/data-lot-id=/g)||[]).length,6);
 assert.equal((svg.match(/data-use=/g)||[]).length,6);
 assert.match(svg,/data-lot-id="9"/);
 assert.throws(()=>Skeleton.svgGuide(skeleton,"nope"));
});
test("group artwork supports independent 3-tier zoom resources and fallback",()=>{
 const original=global.Image;
 class FakeImage{
  constructor(){this.complete=false;this.naturalWidth=0;this._src="";}
  set src(v){this._src=v;this.naturalWidth=512;if(this.onload)this.onload()}
  get src(){return this._src}
 }
 global.Image=FakeImage;
 try{
  const id="block-2",chunk=skeleton.chunkByLot.get(2);
  assert(!Art.ready(id));
  Art.register(id,{src:"valid-base.webp",detail:"detail.webp",ultra:"ultra.webp"});
  assert(Art.ready(id));
  const choices=[];const ctx={drawImage(img){choices.push(img.src)}};
  assert(Art.draw(ctx,chunk,1));
  assert(Art.draw(ctx,chunk,3));
  assert(Art.draw(ctx,chunk,7));
  assert.deepEqual(choices,["valid-base.webp","detail.webp","ultra.webp"]);
 }finally{global.Image=original}
});
test("real board pages and runtime expose blueprint, markers and close zoom",()=>{
 const root=path.resolve(__dirname,"..");
 const files=["board-preview.html","board-1860.html"];
 for(const file of files){
  const html=fs.readFileSync(path.join(root,file),"utf8");
  for(const required of ["board-world.js","block-continuity.js","board-skeleton.js","board-chunks.js","board-selection-overlay.js","board-preview.js","blueprint-btn","markers-btn","guide-btn"])
   assert(html.includes(required),file+": missing "+required);
  assert(html.indexOf("board-skeleton.js")<html.indexOf("board-preview.js"));
 }
 const js=fs.readFileSync(path.join(root,"board-preview.js"),"utf8");
 assert(js.includes("7.5"),"high zoom limit must remain at least 7.5x");
 assert(js.includes("highlightSelected()"));
 assert(js.includes("QOBoardSkeleton.pick(skeleton"));
 assert(js.includes("skeleton.chunks.filter"));
 assert(js.includes('kind:"chunk-lot"'));
 assert(js.includes("selectionOverlay.clipLot(ctx,layer.lot)"));
 assert(js.includes("selectionOverlay.clipVisible(ctx,skeleton,lot)"));
 assert(js.includes('const study=["study","fixed"].includes'));
 assert(js.includes('kind:"chunk-audit"'),"raster audit should show full grouped image");
 assert(js.includes('else if(layer.kind==="chunk-audit")chunkArt.draw'));
 assert(js.includes('./assets/runtime/chunks/block-2-draft-audit.webp'));
 assert(js.includes("blueprintMode"));
 assert(js.includes("ctx.drawImage(pilot.tile,pilot.left,pilot.top,pilot.width,pilot.height)"));
 new Function(js);
});
