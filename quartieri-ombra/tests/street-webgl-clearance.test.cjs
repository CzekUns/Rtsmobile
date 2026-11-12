const assert=require("node:assert/strict");
const core=require("../street-webgl-core.js");
const building={id:1,z:40,poly:[{x:0,y:0},{x:20,y:0},{x:20,y:20},{x:0,y:20}]};
function distance(p){return Math.min(...building.poly.map((a,i)=>core.segmentDistance({x:p.x,y:p.z},a,building.poly[(i+1)%4])))}
for(const p of [{x:10,y:12,z:10},{x:-1,y:12,z:10},{x:-2,y:12,z:-2},{x:21,y:12,z:10}]){
 const safe=core.resolveCameraCollision(p,[building],3);
 assert.equal(core.pointInsideFootprint(safe,building.poly),false);
 assert.ok(distance(safe)>=2.999,"camera clearance must hold even outside walls and corners");
}
const high={x:10,y:50,z:10};
assert.deepEqual(core.resolveCameraCollision(high,[building],3),high,"camera above roof must remain free");
console.log("5 WebGL camera clearance cases passed");
