const assert=require('node:assert/strict');
const test=require('node:test');
const Core=require('../street-webgl-core.js');
const start={id:7,button:0,x:40,y:30,multi:false};
test('single-finger tap picks only matching pointer within threshold',()=>{
 assert.equal(Core.isTap(start,{id:7,x:44,y:34}),true);
 assert.equal(Core.isTap(start,{id:8,x:40,y:30}),false);
 assert.equal(Core.isTap(start,{id:7,x:61,y:30}),false);
});
test('pinch and right mouse button never trigger building picking',()=>{
 assert.equal(Core.isTap({...start,multi:true},{id:7,x:40,y:30}),false);
 assert.equal(Core.isTap({...start,button:2},{id:7,x:40,y:30}),false);
});
