import test from 'node:test';
import assert from 'node:assert/strict';
import {findWorkerExitTile} from '../playtest/worker-exit-tile.js';
import {SevenGame} from '../rules.js';

test('worker exit prefers free east-side tile, skipping occupied cells',()=>{
 const firm={x:10,y:10,size:3};
 const tile=findWorkerExitTile(firm,{width:30,height:30,isBlocked:(x,y)=>x===13&&y===11});
 assert.deepEqual(tile,{x:13,y:10});
});
test('worker exit returns null when no valid tile exists',()=>{
 assert.equal(findWorkerExitTile({x:0,y:0,size:1},{
  width:2,height:2,isBlocked:()=>true
 }),null);
});
test('dismiss preserves person identity and does not overlap a blocked exit',()=>{
 const game=new SevenGame();
 const firm=game.firms.find(f=>f.owner===1&&f.workers>0);
 const staff=firm.staff[0],personId=staff.personId??staff.id;
 const blockedX=firm.x+firm.size,blockedY=firm.y+1;
 game.units.push({id:'test-blocker',owner:1,kind:'peasant',x:blockedX+.5,y:blockedY+.5});
 const result=game.dismiss(firm.id,staff.id);
 assert.equal(result.ok,true);
 assert.equal(result.unit.personId,personId);
 assert.notDeepEqual([Math.floor(result.unit.x),Math.floor(result.unit.y)],[blockedX,blockedY]);
 assert.equal(firm.staff.some(p=>p.id===staff.id),false);
 assert.equal(firm.workers,firm.staff.length);
});
