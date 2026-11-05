import test from 'node:test';
import assert from 'node:assert/strict';
import {SevenGame,terrain} from '../rules.js';
import {findWorkerExitTile} from '../playtest/worker-exit-tile.js';
import {workerRoleLabel,workerRaceLabel} from '../playtest/personnel.js';

test('worker exit prefers first safe east-side candidate instead of occupied doorway',()=>{
 const firm={x:10,y:10,size:3};
 assert.deepEqual(findWorkerExitTile(firm,{width:30,height:30,isBlocked:(x,y)=>x===13&&y===11}),
 {x:13,y:10});
});
test('all blocked exits refuse without risking an undefined unit',()=>{
 assert.equal(findWorkerExitTile({x:0,y:0,size:1},{width:2,height:2,isBlocked:()=>true}),null);
 assert.equal(findWorkerExitTile({x:0,y:0,size:1},{width:5,height:5,isBlocked:()=>true}),null);
});
test('dismissal selects a safe tile and conserves employee identity, ethnicity, skill and health',()=>{
 const game=new SevenGame();
 const firm=game.ownFirms().find(f=>f.workers>0);
 const entering=game.units.find(u=>u.owner===1&&u.kind==='peasant');
 entering.raceId='norman';entering.culture='Normanni';entering.hp=81;
 entering.skillId=5;entering.skillLevel=20;
 assert.equal(game.assign(entering.id,firm.id).ok,true);
 const stored=firm.staff.find(p=>p.personId===entering.personId);
 const targetX=firm.x+firm.size,targetY=firm.y+1;
 game.units.push({id:'unit-test-blocker',owner:1,kind:'soldier',x:targetX,y:targetY});
 const beforeCount=firm.workers;
 const result=game.dismiss(firm.id,stored.id);
 assert.equal(result.ok,true);
 assert.equal(firm.workers,beforeCount-1);
 assert.notDeepEqual([result.unit.x,result.unit.y],[targetX,targetY]);
 assert.equal(game.occupied(result.unit.x,result.unit.y),false);
 assert.notEqual(terrain(game.seed,result.unit.x,result.unit.y),'water');
 assert.equal(result.unit.personId,entering.personId);
 assert.equal(result.unit.raceId,'norman');
 assert.equal(result.unit.skillId,5);
 assert.equal(result.unit.skillLevel,20);
 assert.equal(result.unit.hp,81);
 assert.ok(!game.units.filter(u=>u.id===result.unit.id).slice(1).length,'exit inserts one mobile unit');
});
test('safe exit blocked by a reserved construction lot is rejected as a destination',()=>{
 const game=new SevenGame();
 const firm=game.ownFirms().find(f=>f.workers>0);
 const location={x:firm.x+firm.size,y:firm.y+1};
 game.constructionSites.push({...location,size:2,id:'test-site',kind:'market'});
 const person=firm.staff[0],out=game.dismiss(firm.id,person.id);
 assert.equal(out.ok,true);
 assert.ok(out.unit.x<location.x||out.unit.x>=location.x+2||
  out.unit.y<location.y||out.unit.y>=location.y+2);
});
test('legacy skills and role are not fabricated while newer staff has explicit race',()=>{
 const old={legacyUnknown:true,culture:'Normanni',raceId:null,kind:'soldier'};
 assert.match(workerRoleLabel(old),/non documentato/);
 assert.match(workerRaceLabel(old),/non verificata/);
 assert.equal(workerRoleLabel({kind:'peasant'}),'Abitante');
 assert.equal(workerRoleLabel({kind:'soldier'}),'Soldato');
 assert.equal(workerRaceLabel({raceId:'norman',culture:'Normanni'}),'Normanni');
 assert.equal(workerRaceLabel({raceId:3,culture:'Greci'}),'Razza #3 · Greci');
});
