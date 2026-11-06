const assert = require('node:assert/strict');
const test = require('node:test');
const Core = require('../street-webgl-core.js');
const lot = (id, left, right) => ({ id, x:(left+right)/2, y:0,
 poly:[{x:left,y:-4},{x:right,y:-4},{x:right,y:4},{x:left,y:4}] });
test('long building remains streamed when its footprint reaches the radius', () => {
 assert.deepEqual(Core.nearbyBuildings([lot(1,90,310)],{x:0,z:0},100).map(b=>b.id),[1]);
});
test('footprint beyond radius stays excluded', () => {
 assert.equal(Core.nearbyBuildings([lot(1,110,310)],{x:0,z:0},100).length,0);
});
test('camera within footprint gives zero distance', () => {
 assert.deepEqual(Core.nearbyBuildings([lot(1,-5,5)],{x:0,z:0},1).map(b=>b.id),[1]);
});
test('nearest geometry wins with stable lot order', () => {
 assert.deepEqual(Core.nearbyBuildings([lot(3,20,30),lot(2,5,10)],{x:0,z:0},100).map(b=>b.id),[2,3]);
});
