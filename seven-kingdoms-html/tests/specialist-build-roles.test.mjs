import test from 'node:test';
import assert from 'node:assert/strict';
import {SevenGame} from '../rules.js';
import {canBuildFirm,isBuilder,issueBuildOrder,advanceConstruction,SPECIALIZED_BUILD_SKILL} from '../playtest/construction.js';
import {advancePlaytestRoutes} from '../playtest/path-routes.js';

function testUnit(game,skillId){
 const unit=game.units.find(u=>u.kind==='peasant'&&u.owner===1);
 unit.skillId=skillId;unit.skillLevel=20;
 return unit;
}
function buildAtAvailableSite(game,unit,kind){
 for(let y=18;y<39;y++)for(let x=15;x<40;x++){
  const result=issueBuildOrder(game,unit.id,kind,x,y);
  if(result.ok)return result.site;
 }
 throw Error('No valid '+kind+' site reachable from '+unit.id);
}
function finish(game,site,max=1400){
 let completed=null;
 for(let i=0;i<max&&!completed;i++){
  advancePlaytestRoutes(game,.05);
  const events=advanceConstruction(game,.05);
  completed=events.find(e=>e.type==='completed')||null;
 }
 assert.ok(completed,'expected actual completed building, not just a placed footprint');
 assert.equal(completed.firmId,site.firmId);
 return completed;
}

test('original skill specializations may build only their own building type',()=>{
 const pairs={2:'fort',3:'mine',4:'factory',5:'research'};
 assert.deepEqual(SPECIALIZED_BUILD_SKILL,{fort:2,mine:3,factory:4,research:5});
 for(let id=2;id<=5;id++){
  const game=new SevenGame(),unit=testUnit(game,id);
  assert.equal(isBuilder(unit),true);
  for(const kind of ['fort','mine','factory','research','market','inn'])
   assert.equal(canBuildFirm(unit,kind),kind===pairs[id],id+' -> '+kind);
 }
 const game=new SevenGame(),unit=testUnit(game,1);
 for(const kind of ['fort','mine','factory','research','market','inn'])
  assert.equal(canBuildFirm(unit,kind),true);
 unit.skillId=6;
 assert.equal(isBuilder(unit),false);
 assert.equal(canBuildFirm(unit,'market'),false);
});

test('a trained research specialist erects the Tower and enters it on completion',()=>{
 const game=new SevenGame(),unit=testUnit(game,5),id=unit.id,personId=unit.personId;
 const cash=game.cash,oldCount=game.firms.length;
 const site=buildAtAvailableSite(game,unit,'research');
 assert.equal(game.cash,cash-360);
 assert.equal(game.firms.length,oldCount,'no instant finished building');
 const finished=finish(game,site);
 const firm=game.get(finished.firmId);
 assert.equal(firm.kind,'research');
 assert.equal(firm.underConstruction,false);
 assert.equal(firm.staff.length,1);
 assert.equal(firm.staff[0].skillId,5);
 assert.equal(firm.staff[0].skillLevel,20);
 assert.equal(firm.staff[0].personId,personId);
 assert.equal(game.get(id),null,'specialist automatically becomes an occupant');
 assert.equal(finished.autoAssigned,true);
 assert.equal(finished.builderId,id);
});

test('unskilled spy cannot order construction or spend money',()=>{
 const game=new SevenGame(),unit=testUnit(game,6);
 const money=game.cash,firms=game.firms.length;
 assert.equal(issueBuildOrder(game,unit.id,'mine',17,20).ok,false);
 assert.equal(game.cash,money);
 assert.equal(game.firms.length,firms);
 assert.equal(game.constructionSites.length,0);
});

test('non-construction specialist cannot gain Construction skill while erecting a building',()=>{
 const game=new SevenGame(),unit=testUnit(game,4);
 const site=buildAtAvailableSite(game,unit,'factory');
 const first=unit.skillLevel;
 const finished=finish(game,site);
 assert.ok(finished.autoAssigned);
 const staff=game.get(finished.firmId).staff[0];
 assert.equal(staff.skillId,4);
 assert.equal(staff.skillLevel,first,'no artificial Construction XP for Manufacturing');
});

test('construction makes no progress if assigned unit is moving despite proximity',()=>{
 const game=new SevenGame(),unit=testUnit(game,1);
 const site=buildAtAvailableSite(game,unit,'market');
 for(let i=0;i<1400&&site.status!=='building';i++){
  advancePlaytestRoutes(game,.05);
  advanceConstruction(game,.05);
 }
 assert.equal(site.status,'building');
 unit.target={x:unit.x+1,y:unit.y};
 const percent=site.progress;
 for(let i=0;i<20;i++)advanceConstruction(game,.05);
 assert.equal(site.progress,percent);
 unit.target=null;
 advanceConstruction(game,.05);
 assert.ok(site.progress>percent);
});
