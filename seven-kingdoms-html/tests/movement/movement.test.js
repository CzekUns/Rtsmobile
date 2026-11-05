import test from 'node:test';
import assert from 'node:assert/strict';
import {createGrid,canOccupy,findPath,createOccupancy} from '../../systems/movement/index.js';
const path=(w,h,blocked,start,goal,opts={})=>findPath({width:w,height:h,start,goal,isBlocked:createGrid(w,h,{blocked}).isBlocked,...opts});
test('repeatable path and same-tile goal',()=>{
  const a=path(8,8,[{x:3,y:3}],{x:1,y:1},{x:6,y:6});
  assert.deepEqual(a,path(8,8,[{x:3,y:3}],{x:1,y:1},{x:6,y:6}));
  assert.deepEqual(path(2,2,[],{x:0,y:0},{x:0,y:0}),[{x:0,y:0}]);
});
test('no corner cutting across two adjacent obstacles',()=>{
  assert.deepEqual(path(3,3,[{x:1,y:0},{x:0,y:1}],{x:0,y:0},{x:1,y:1}),[]);
});
test('narrow corridor: 1x1 passes and 2x2 cannot',()=>{
  const obstacles=[];for(let y=0;y<7;y++)for(let x=0;x<7;x++)if(x!==3)obstacles.push({x,y});
  assert.equal(path(7,7,obstacles,{x:3,y:0},{x:3,y:6}).length,7);
  assert.deepEqual(path(7,7,obstacles,{x:3,y:0},{x:3,y:5},{size:{width:2,height:2}}),[]);
});
test('walls, edge footprints and maxNodes',()=>{
  const blocked=[{x:2,y:0},{x:2,y:1},{x:2,y:2},{x:2,y:3}];
  assert.deepEqual(path(5,4,blocked,{x:0,y:0},{x:4,y:3}),[]);
  assert.deepEqual(path(5,5,[],{x:0,y:0},{x:4,y:4},{maxNodes:1}),[]);
  assert.equal(canOccupy({width:4,height:4,at:{x:3,y:3},size:{width:2,height:1},isBlocked:()=>false}),false);
});
test('alternative route does not cross blocked building',()=>{
  const blocked=[{x:2,y:1},{x:2,y:2},{x:2,y:3}];
  const route=path(5,5,blocked,{x:0,y:2},{x:4,y:2});
  assert.ok(route.length>0);
  for(const tile of route)assert.equal(blocked.some(b=>b.x===tile.x&&b.y===tile.y),false);
});
test('occupied units and structures cannot overlap',()=>{
  const g=createOccupancy(7,7);
  assert.equal(g.place('firm',{x:2,y:2},{width:2,height:2}),true);
  assert.equal(g.place('a',{x:2,y:2}),false);
  assert.equal(g.place('a',{x:1,y:2}),true);
  assert.equal(g.place('b',{x:0,y:2}),true);
  assert.equal(g.canOccupy({x:3,y:3}),false);
  assert.equal(g.findPath('a',{x:5,y:2}).some(p=>p.x===2&&p.y===2),false);
});
test('simultaneous same-target and swap attempts are rejected',()=>{
  const g=createOccupancy(5,5);g.place('b',{x:3,y:2});g.place('a',{x:1,y:2});
  assert.deepEqual(g.step([{id:'b',to:{x:2,y:2}},{id:'a',to:{x:2,y:2}}]).map(x=>x.moved),[true,false]);
  assert.equal(g.occupant(2,2),'a');
  const h=createOccupancy(3,3);h.place('a',{x:0,y:0});h.place('b',{x:1,y:0});
  assert.equal(h.step([{id:'a',to:{x:1,y:0}},{id:'b',to:{x:0,y:0}}]).every(x=>!x.moved),true);
});
test('blocked move leaves unit unchanged and can retry after removal',()=>{
  const g=createOccupancy(5,3);g.place('a',{x:0,y:1});g.place('rock',{x:1,y:1});
  assert.equal(g.step([{id:'a',to:{x:1,y:1}}])[0].moved,false);
  assert.deepEqual(g.get('a').at,{x:0,y:1});
  g.remove('rock');
  assert.equal(g.step([{id:'a',to:{x:1,y:1}}])[0].moved,true);
});
test('terrain and diagonal restrictions with deterministic stable order',()=>{
  const g=createOccupancy(4,4,{isTerrainBlocked:(x,y)=>x===2&&y===2});
  assert.equal(g.place('a',{x:2,y:2}),false);
  assert.deepEqual(path(2,2,[],{x:0,y:0},{x:1,y:1},{allowDiagonal:false}).length,3);
  assert.equal(g.step([{id:'missing',to:{x:0,y:0}}])[0].reason,'missing');
});
