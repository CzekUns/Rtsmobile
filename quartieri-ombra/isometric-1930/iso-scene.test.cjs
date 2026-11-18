"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const Core=require("./iso-core.js");
const world=require("../board-world.js").generate(1860);
const scene=fs.readFileSync(path.join(__dirname,"iso-scene.js"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
test("standalone isometric experiment uses real canonical 1860 lots",()=>{
 const focus={x:world.hub.x+24,y:world.hub.y-15};
 const lots=Core.chooseBuildings(world,focus,26,405);
 assert.equal(lots.length,26);
 assert.equal(new Set(lots.map(x=>x.id)).size,26);
 const starter=Core.chooseInterior(lots,focus);
 assert.equal(starter.id,32);
 assert.equal(starter.type,"shop");
 assert.deepEqual(Core.footprint(starter),starter.poly.map(p=>({x:p.x,z:p.y})));
});
test("walls visible to camera may be removed for a cutaway",()=>{
 const b={x:5,y:5,poly:[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}]};
 assert.deepEqual(Core.facingWalls(b,{x:20,z:20}),[1,2]);
 assert.deepEqual(Core.facingWalls(b,{x:-10,z:-10}),[0,3]);
});
test("geometry placement obeys rotated real lot footprints",()=>{
 const b=world.buildings[32],center=Core.placementOnBuilding(b,.5,.5);
 assert(Math.hypot(center.x-b.x,center.y-b.y)<1e-6);
 for(const p of b.poly)assert(Core.pointInsidePolygon({x:b.x,y:b.y},b.poly));
});
test("camera is orthographic isometric and zoom-ready at four quarter turns",()=>{
 for(const angle of [45,135,225,315]){
  const p=Core.cameraOrbit(world.hub,angle,550,560);
  assert(Math.hypot(p.x-world.hub.x,p.z-world.hub.y)>549.999);
  assert.equal(p.y,560);
 }
});
test("no copyrighted game assets loaded; original canvas textures and interiors exist",()=>{
 assert.match(scene,/new THREE.OrthographicCamera/);
 assert.match(scene,/new THREE.CanvasTexture/);
 assert.match(scene,/function decorateInterior/);
 assert.match(scene,/Core.facingWalls/);
 assert.match(scene,/Core.chooseBuildings\(world,focus,26,405\)/);
 assert.match(scene,/renderer\.render\(scene,camera\)/);
 assert.match(html,/Trascina: esplora/);
 assert.match(html,/id="interior"/);
 assert.match(html,/id="zoom-in"/);
 assert.match(html,/\.\/iso-scene\.js/);
 assert.doesNotMatch(scene,/\.png|\.jpg|\basset\/|chicago-1930\.jpg/);
 assert.doesNotThrow(()=>new Function(scene.replace('import * as THREE from "three";',"").replace('import {OrbitControls} from "three/addons/controls/OrbitControls.js";',"")));
});
