import test from 'node:test';
import assert from 'node:assert/strict';
import {worldPainterOrder} from '../world-depth-order.js';
test('overlapping world objects paint back to front by world foot position', () => {
 const town={x:1,y:2,size:3}, firm={x:2,y:7,size:2}, unit={x:3,y:6}, site={x:2,y:3,size:2};
 assert.deepEqual(worldPainterOrder([town],[site],[firm],[unit]).map(e=>e.kind),['town','site','unit','firm']);
});
test('ties remain stable and input collections are not modified', () => {
 const towns=[{x:0,y:2,size:2}], units=[{x:1,y:4},{x:2,y:4}];
 assert.deepEqual(worldPainterOrder(towns,[],[],units).map(e=>e.item),[towns[0],units[0],units[1]]);
 assert.equal(units.length,2);
});
test('invalid coordinates are skipped and missing collections are accepted', () => {
 assert.deepEqual(worldPainterOrder(null,undefined,[],[{x:NaN,y:3},{x:2,y:2}]).map(e=>e.item.x),[2]);
});
