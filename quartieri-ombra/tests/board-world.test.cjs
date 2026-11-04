"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"board-world.js"),"utf8");
const moduleRecord={exports:{}};
vm.runInNewContext(source,{module:moduleRecord},{filename:"board-world.js",timeout:4500});
const API=moduleRecord.exports;
test("the 3x3 board has continuous roads, populated sectors and independent props",()=>{
 const a=API.generate(1860);
 assert.equal(a.width,2700);assert.equal(a.height,2100);
 assert(a.roads.length>=20);assert(a.buildings.length>=300);assert(a.props.length>=100);
 assert.equal(a.sectors.length,9);
 assert(a.sectors.every(s=>s.buildings>=15),"Every board sector needs substantial urban density");
 assert.equal(a.sectors.reduce((n,s)=>n+s.buildings,0),a.buildings.length);
 assert.equal(a.roads.filter(r=>r.kind==="main"&&r.points[0].x===a.hub.x&&r.points[0].y===a.hub.y).length,5);
});
test("projection has an invertible isometric ratio and non-distorted footprint geometry",()=>{
 assert.equal(API.ISO.sx,2*API.ISO.sy);
 for(let x=0;x<=API.WIDTH;x+=131)for(let y=0;y<=API.HEIGHT;y+=127){
  const screen=API.project(x,y),ground=API.inverse(screen.x,screen.y);
  assert(Math.abs(ground.x-x)<1e-8&&Math.abs(ground.y-y)<1e-8);
 }
});
test("board generation is repeatable and all architecture is editable data",()=>{
 const a=API.generate(1860),b=API.generate(1860);
 assert.equal(JSON.stringify(a),JSON.stringify(b));
 assert(a.buildings.every(b=>b.poly.length===4&&Number.isFinite(b.z)&&b.z>25));
 assert(a.buildings.every(b=>b.type&&b.wall&&b.roof&&b.road));
});
test("no lot footprint overlaps another building",()=>{
 const b=API.generate(1860).buildings;
 for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++){
  if(Math.hypot(b[i].x-b[j].x,b[i].y-b[j].y)>132)continue;
  assert(!API.overlaps(b[i].poly,b[j].poly,0),"Overlapping lots: "+i+" and "+j);
 }
});
test("board-only page, fixed orientation and HUD controls are wired",()=>{
 const page=fs.readFileSync(path.join(root,"board-preview.html"),"utf8");
 const css=fs.readFileSync(path.join(root,"board-preview.css"),"utf8");
 const app=fs.readFileSync(path.join(root,"board-preview.js"),"utf8");
 for(const name of ["board-world.js","board-preview.js","board-minimap","full-btn","board-canvas"])
  assert(page.includes(name));
 assert.match(css,/touch-action:none/);assert.match(css,/orientation:portrait/);
 assert.match(app,/MAX_BUILDING_SPRITES=320/);
 assert.match(app,/function clampCamera/);
 assert.match(app,/function drawRoads/);
 assert.match(app,/pointerdown/);
 assert.match(app,/document\.createElement\("canvas"\)/);
 new Function(app);
});
