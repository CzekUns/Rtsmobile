const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../street-webgl-core.js');
const building={id:1,z:30,poly:[{x:10,y:-2},{x:11,y:-2},{x:11,y:2},{x:10,y:2}]};
const sweep=(start,end)=>Core.sweepCameraMovement(start,end,[building],1);
test('fast movement stops before a thin wall',()=>{
 const p=sweep({x:0,y:10,z:0},{x:100,y:10,z:0});
 assert.ok(p.x>=8.9&&p.x<10);
});
test('movement above the roof is unrestricted',()=>{
 assert.equal(sweep({x:0,y:40,z:0},{x:100,y:40,z:0}).x,100);
});
test('free street and long displacement reach destination',()=>{
 assert.equal(sweep({x:0,y:10,z:10},{x:100,y:10,z:10}).x,100);
 assert.equal(sweep({x:0,y:10,z:10},{x:100000,y:10,z:10}).x,100000);
});
test('ascending movement still hits wall below roof',()=>{
 assert.ok(sweep({x:0,y:10,z:0},{x:100,y:100,z:0}).x<10);
});
test('descending camera above roof at crossing passes',()=>{
 assert.equal(sweep({x:0,y:100,z:0},{x:100,y:10,z:0}).x,100);
});
