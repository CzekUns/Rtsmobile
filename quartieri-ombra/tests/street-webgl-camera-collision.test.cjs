const assert=require("node:assert/strict");
const Core=require("../street-webgl-core.js");
const lot={id:2,z:50,poly:[{x:0,y:0},{x:20,y:0},{x:20,y:20},{x:0,y:20}]};
for(const [name,point] of [
 ["inside",{x:10,y:27,z:10}],["corner",{x:1,y:20,z:1}],
 ["other side",{x:19,y:12,z:19}]
]){
 const safe=Core.resolveCameraCollision(point,[lot],3);
 assert.equal(Core.pointInsidePolygon(safe,lot.poly),false,name);
 assert.equal(safe.y,point.y,name);
}
const high=Core.resolveCameraCollision({x:10,y:60,z:10},[lot]);
assert.deepEqual(high,{x:10,y:60,z:10});
const outside=Core.resolveCameraCollision({x:30,y:20,z:10},[lot]);
assert.deepEqual(outside,{x:30,y:20,z:10});
console.log("PASS street WebGL camera solid-footprint collision (5 cases)");
