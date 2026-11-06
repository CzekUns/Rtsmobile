"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const world=require("../board-world.js").generate(1860);
const Core=require("../street-webgl-core.js");

test("observer spawns on the actual Five Points street junction, not around the edge",()=>{
 const spawn=Core.streetSpawn(world,42,27);
 assert.deepEqual(spawn.eye,{x:world.hub.x,y:27,z:world.hub.y});
 const road=world.roads.find(r=>r.name==="Cross Street");
 const direction={x:road.points[1].x-road.points[0].x,y:road.points[1].y-road.points[0].y};
 const len=Math.hypot(direction.x,direction.y);
 assert(Math.abs(spawn.target.x-(world.hub.x+direction.x/len*42))<1e-8);
 assert(Math.abs(spawn.target.z-(world.hub.y+direction.y/len*42))<1e-8);
 assert(spawn.target.y<spawn.eye.y);
});
test("walking can traverse far sectors; streaming never limits scene to the original 38 lots",()=>{
 const start={x:world.hub.x,z:world.hub.y};
 const far={x:2400,z:1750};
 const nearStart=Core.nearbyBuildings(world.buildings,start,440,120);
 const nearFar=Core.nearbyBuildings(world.buildings,far,440,120);
 assert(nearStart.length>0&&nearFar.length>0);
 assert.notDeepEqual(nearStart.map(b=>b.id),nearFar.map(b=>b.id));
 assert(nearFar.some(b=>Math.hypot(b.x-world.hub.x,b.y-world.hub.y)>540),
  "far streamed buildings must extend beyond the old 540-unit target limit");
 assert.equal(world.buildings.length,454,"all original world lots remain intact");
 assert(nearFar.length<=120);
});
test("ground movement is bounded by the full city footprint only",()=>{
 assert.deepEqual(Core.clampToWorld({x:-500,y:27,z:2500},world,18),{x:18,y:27,z:2082});
 assert.deepEqual(Core.clampToWorld({x:1900,y:27,z:1700},world,18),{x:1900,y:27,z:1700});
});
test("street-level movement follows road direction and remains a physical camera translation",()=>{
 const spawn=Core.streetSpawn(world,42,27);
 const gaze={x:spawn.eye.x-spawn.target.x,z:spawn.eye.z-spawn.target.z};
 const step=Core.joystickDisplacement(gaze,{x:0,y:1},112,.05);
 assert(step.x<0&&step.z<0,"forward follows Cross Street from the hub");
 const destination=Core.clampToWorld({x:spawn.eye.x+step.x,y:27,z:spawn.eye.z+step.z},world,18);
 assert(Math.hypot(destination.x-spawn.eye.x,destination.z-spawn.eye.z)>5);
 assert(!Core.pointInsideFootprint(destination,world.buildings[2].poly));
});
test("renderer uses full-map roads/ground, all-world collision, and dynamic visible buildings",()=>{
 const html=fs.readFileSync(path.join(__dirname,"../street-webgl.html"),"utf8");
 const js=fs.readFileSync(path.join(__dirname,"../street-webgl.js"),"utf8");
 assert(js.includes("controls.maxTargetRadius=Infinity"));
 assert(js.includes("Core.streetSpawn(data,42,27)"));
 assert(js.includes("Core.nearbyBuildings(data.buildings,p,radius,120)"));
 assert(js.includes("Core.resolveCameraCollision(destination,data.buildings,3)"));
 assert(js.includes("Core.resolveCameraCollision(bounded,data.buildings,3)"));
 assert(js.includes("new THREE.PlaneGeometry(data.width+240,data.height+240)"));
 assert(js.includes("updateVisibleCity();"));
 assert(js.includes("unloadBuilding"));
 assert(js.includes("disposeGeometry"));
 assert(!js.includes("cluster.buildings.length"),"old fixed pilot count should be gone");
 assert(html.includes('value="42"')&&html.includes("20261106-walk2"),"zoom and assets must use walking defaults");
 assert.doesNotThrow(()=>new Function(js.replace('import * as THREE from "three";',"").replace('import {OrbitControls} from "three/addons/controls/OrbitControls.js";',"")));
});
