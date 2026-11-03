import test from 'node:test';
import assert from 'node:assert/strict';
import {canTraverseTile as pass,canPlaceFootprint as place,validateTileRoute as route} from '../../systems/movement/terrain-policy.js';
// Matrix evidence / upstream limitations: docs/movement/7kaa-parity.md.
const land={walkable:true,sailable:false,regionId:1},water={walkable:false,sailable:true,regionId:2},
  wall={walkable:false,sailable:false,regionId:1},unit={id:'worker'};
const map=(w,h,defaultTile=land)=>{
  const cells=Array.from({length:w*h},()=>({...defaultTile}));
  return {set:(x,y,t)=>cells[y*w+x]={...t},getTile:(x,y)=>cells[y*w+x]};
};
test('S01 land cannot cross water: OSPATH UNIT_LAND',()=>{
  assert.equal(pass({tile:water,mobileType:'land'}),false);
});
test('S02 ship cannot cross land: OSPATH UNIT_SEA',()=>{
  assert.equal(pass({tile:land,mobileType:'sea'}),false);
});
test('S03 air layer ignores ground walls and ground cargo, blocks air cargo',()=>{
  for(const t of [land,water,wall,{...wall,cargo:{id:'soldier'}}])assert.equal(pass({tile:t,mobileType:'air'}),true);
  assert.equal(pass({tile:{...wall,airCargo:{id:'bird'}},mobileType:'air'}),false);
});
test('S04 footprint building 3x3 blocks land, air is separate',()=>{
  const m=map(8,8);for(let y=2;y<5;y++)for(let x=2;x<5;x++)m.set(x,y,wall);
  assert.equal(place({width:8,height:8,at:{x:1,y:1},size:{width:3,height:3},getTile:m.getTile,mobileType:'land'}),false);
  assert.equal(place({width:8,height:8,at:{x:2,y:2},size:{width:3,height:3},getTile:m.getTile,mobileType:'air'}),true);
});
test('S05 out-of-bounds footprint and build site prohibition',()=>{
  const m=map(4,4);m.set(1,1,{...land,hasSite:true});
  assert.equal(place({width:4,height:4,at:{x:3,y:3},size:{width:2,height:2},getTile:m.getTile,mobileType:'land'}),false);
  assert.equal(place({width:4,height:4,at:{x:1,y:1},getTile:m.getTile,mobileType:'land',build:true}),false);
  assert.equal(place({width:4,height:4,at:{x:1,y:1},getTile:m.getTile,mobileType:'land'}),true);
});
test('S06 conservative diagonal no corner cutting: NOT yet proven C++ parity',()=>{
  const m=map(3,3);m.set(1,0,wall);m.set(0,1,wall);
  assert.equal(route({path:[{x:0,y:0},{x:1,y:1}],width:3,height:3,getTile:m.getTile,mobileType:'land'}),false);
});
test('S07 valid alternative perimeter route, no crossing firm',()=>{
  const m=map(6,5);for(let y=1;y<4;y++)m.set(2,y,wall);
  const p=[{x:0,y:2},{x:0,y:1},{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0},{x:4,y:0},{x:4,y:1},{x:4,y:2}];
  assert.equal(route({path:p,width:6,height:5,getTile:m.getTile,mobileType:'land'}),true);
  assert.equal(route({path:[{x:1,y:2},{x:2,y:2}],width:6,height:5,getTile:m.getTile,mobileType:'land'}),false);
});
test('S08 adjacent occupied tile and search moving-group exception',()=>{
  assert.equal(pass({tile:{...land,cargo:{id:'other',moving:false}},mobileType:'land',unit}),false);
  assert.equal(pass({tile:{...land,cargo:{id:'other',moving:true}},mobileType:'land',unit,mode:'moving-group'}),true);
  assert.equal(pass({tile:{...land,cargo:{id:'cart',moving:true,isCaravan:true}},mobileType:'land',unit,mode:'moving-group'}),false);
  assert.equal(pass({tile:{...water,cargo:{id:'ship',moving:true}},mobileType:'sea',unit,mode:'moving-group'}),true);
});
test('S09 occupied target exception only during attack search',()=>{
  const tile={...land,cargo:{id:'enemy'}};
  assert.equal(pass({tile,mobileType:'land',unit}),false);
  assert.equal(pass({tile,mobileType:'land',unit,mode:'attack-target',targetId:'enemy'}),true);
  assert.equal(pass({tile,mobileType:'land',unit,mode:'attack-target',targetId:'other'}),false);
});
test('S10 optional strict region land check, air bypass',()=>{
  const tile={...land,regionId:2};
  assert.equal(pass({tile,mobileType:'land',regionId:1}),false);
  assert.equal(pass({tile,mobileType:'air',regionId:1}),true);
});
test('S11 firm exit: inside footprint blocked, outer neighbor free',()=>{
  const m=map(5,5);for(let y=1;y<4;y++)for(let x=1;x<4;x++)m.set(x,y,wall);
  assert.equal(place({width:5,height:5,at:{x:1,y:1},getTile:m.getTile,mobileType:'land'}),false);
  assert.equal(place({width:5,height:5,at:{x:0,y:2},getTile:m.getTile,mobileType:'land'}),true);
});
test('S12 unreachable blocked goal and restricted nation',()=>{
  assert.equal(pass({tile:wall,mobileType:'land'}),false);
  assert.equal(pass({tile:{...land,powerNation:2},mobileType:'land',isNationPassable:n=>n===1}),false);
  assert.equal(pass({tile:{...land,powerNation:2},mobileType:'land',isNationPassable:n=>n===2}),true);
});
test('incorrect inputs throw instead of silently allowing terrain',()=>{
  assert.throws(()=>pass({tile:{walkable:true},mobileType:'land'}),TypeError);
  assert.throws(()=>pass({tile:land,mobileType:'hover'}),TypeError);
});
