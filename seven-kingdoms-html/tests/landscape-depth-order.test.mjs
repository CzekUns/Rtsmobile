import test from 'node:test';
import assert from 'node:assert/strict';
import {worldPainterOrder, landscapePainterOrder} from '../world-depth-order.js';

const sequence = items => items.map(e => e.kind === 'unit' ? e.item.id : e.kind === 'firm' ? e.item.id : e.kind + ':' + e.y);

test('unit behind tree and rock is painted before authentic overlays; foreground unit after', () => {
  const units = [{id:'behind',x:8,y:9},{id:'same',x:8,y:11},{id:'front',x:8,y:13}];
  const objects = worldPainterOrder([],[],[],units);
  const order = landscapePainterOrder([{kind:'plant',x:8,y:10},{kind:'rock',x:9,y:11}],objects);
  assert.deepEqual(sequence(order), ['behind','plant:10','same','rock:11','front']);
});

test('buildings use footprint baseline and stable equal-depth ties', () => {
  const firm = {id:'fort',x:8,y:7,size:4};
  const objects = worldPainterOrder([],[],[firm],[{id:'unit',x:8,y:11}]);
  const order = landscapePainterOrder([{kind:'plant',x:8,y:10},{kind:'rock',x:9,y:10}],objects);
  assert.deepEqual(sequence(order), ['plant:10','rock:10','fort','unit']);
});

test('painter order remains identical at zoom 1x and 2x and never mutates inputs', () => {
  const overlays = Object.freeze([Object.freeze({kind:'plant',x:3,y:4}),Object.freeze({kind:'rock',x:4,y:6})]);
  const objects = Object.freeze(worldPainterOrder([],[],[],[{id:'unit',x:4,y:5}]));
  const drawAtZoom = zoom => landscapePainterOrder(overlays,objects).map(e => ({kind:e.kind,depth:e.depth,screenY:e.depth*24*zoom}));
  const one = drawAtZoom(1),two = drawAtZoom(2);
  assert.deepEqual(one.map(e=>e.kind),two.map(e=>e.kind));
  assert.deepEqual(two.map(e=>e.screenY),one.map(e=>e.screenY*2));
  assert.equal(overlays[0].depth,undefined);
});

test('invalid overlays are excluded without affecting existing objects', () => {
  const unit = worldPainterOrder([],[],[],[{id:'unit',x:1,y:2}]);
  assert.deepEqual(sequence(landscapePainterOrder([{kind:'rock',x:NaN,y:3},{kind:'unknown',x:1,y:2}],unit)),['unit']);
});
