const assert=require('node:assert/strict');
const Core=require('../street-webgl-core.js');
const b={id:2,z:50,poly:[{x:0,y:0},{x:20,y:0},{x:20,y:20},{x:0,y:20}]};
for(const p of [{x:10,y:27,z:10},{x:1,y:20,z:1},{x:19,y:12,z:19}]){
 const q=Core.resolveCameraCollision(p,[b],3);
 assert.equal(Core.pointInsideFootprint(q,b.poly),false,'camera exits solid');
 assert.equal(q.y,p.y,'camera elevation preserved');
}
for(const p of [{x:30,y:20,z:10},{x:10,y:60,z:10}]){
 assert.deepEqual(Core.resolveCameraCollision(p,[b],3),p,'street/above roof unaffected');
}
console.log('PASS camera clearance: five geometry cases');
