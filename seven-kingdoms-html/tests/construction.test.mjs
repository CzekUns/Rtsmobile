import test from 'node:test';
import assert from 'node:assert/strict';
import {SevenGame,FIRMS} from '../rules.js';
import {issueBuildOrder,advanceConstruction,cancelBuildOrder,isBuilder} from '../playtest/construction.js';
import {issueWorkOrder} from '../playtest/work-assignments.js';
import {advancePlaytestRoutes} from '../playtest/path-routes.js';

const findBuilder=g=>g.units.find(u=>u.owner===1&&u.skillId===1);
function orderAvailableMarket(game,builder){
 for(let y=20;y<=36;y++)for(let x=20;x<=36;x++){
  const order=issueBuildOrder(game,builder.id,'market',x,y);
  if(order.ok)return order;
 }
 throw Error('No reachable market site in initial demo world');
}
function simulateUntil(game,predicate,maxSteps=1400){
 for(let i=0;i<maxSteps&&!predicate();i++){
  advancePlaytestRoutes(game,.05);
  advanceConstruction(game,.05);
 }
 assert.ok(predicate(),'expected construction milestone not reached');
}

test('demonstration new game exposes one trained builder; old untrained units cannot build',()=>{
 const game=new SevenGame();
 assert.equal(game.constructionSites.length,0);
 assert.ok(isBuilder(findBuilder(game)));
 const untrained=game.units.find(u=>u.owner===1&&!isBuilder(u));
 assert.ok(untrained);
 const r=issueBuildOrder(game,untrained.id,'market',18,20);
 assert.equal(r.ok,false);
 assert.equal(game.constructionSites.length,0);
});

test('new construction waits for walking and completes only after a visible worksite',()=>{
 const game=new SevenGame(),builder=findBuilder(game),oldFirms=game.firms.length,oldCash=game.cash;
 const order=orderAvailableMarket(game,builder);
 assert.equal(game.firms.length,oldFirms,'no finished building at order placement');
 assert.equal(game.cash,oldCash-FIRMS.market.cost,'pay exactly once on valid order');
 assert.equal(order.site.status,'walking');
 assert.ok(builder.route.length>0,'builder must have a real path');
 assert.equal(builder.buildSiteId,order.site.id);
 const old={x:builder.x,y:builder.y};
 advancePlaytestRoutes(game,.05);
 assert.notDeepEqual({x:builder.x,y:builder.y},old);
 simulateUntil(game,()=>order.site.status==='building');
 assert.equal(game.firms.length,oldFirms+1);
 const building=game.get(order.site.firmId);
 assert.equal(building.underConstruction,true);
 assert.ok(building.buildProgress<1);
 assert.equal(building.workers,0);
 assert.equal(builder.buildSiteId,order.site.id);
 const blocked=issueWorkOrder(game,builder.id,game.ownFirms().find(f=>f.kind==='mine').id);
 assert.equal(blocked.ok,false,'building worker cannot disappear into a mine');
 simulateUntil(game,()=>!building.underConstruction);
 assert.equal(building.buildProgress,1);
 assert.equal(building.hp,100);
 assert.equal(builder.buildSiteId,null,'builder freed on completion');
 assert.ok(game.units.includes(builder));
 assert.equal(game.constructionSites.length,0);
});

test('cancelling a reserved site restores resources and does not create a firm',()=>{
 const game=new SevenGame(),builder=findBuilder(game),cash=game.cash,count=game.firms.length;
 orderAvailableMarket(game,builder);
 const result=cancelBuildOrder(game,builder.id);
 assert.equal(result.ok,true);
 assert.equal(game.cash,cash);
 assert.equal(game.firms.length,count);
 assert.equal(game.constructionSites.length,0);
 assert.equal(builder.buildSiteId,null);
 assert.equal(builder.route.length,0);
});

test('pause freezes walking, progress, and pending construction order',()=>{
 const game=new SevenGame(),builder=findBuilder(game);
 const order=orderAvailableMarket(game,builder);
 const before={x:builder.x,y:builder.y},route=builder.route.map(p=>({...p}));
 game.paused=true;
 advancePlaytestRoutes(game,5);
 assert.deepEqual(advanceConstruction(game,5),[]);
 assert.deepEqual({x:builder.x,y:builder.y},before);
 assert.deepEqual(builder.route,route);
 assert.equal(order.site.status,'walking');
 game.paused=false;
 advancePlaytestRoutes(game,.1);
 assert.notDeepEqual({x:builder.x,y:builder.y},before);
});

test('construction and the same builder identity survive save/load mid-work',()=>{
 const game=new SevenGame(),builder=findBuilder(game);
 const order=orderAvailableMarket(game,builder);
 simulateUntil(game,()=>order.site.status==='building');
 for(let i=0;i<25;i++)advanceConstruction(game,.05);
 const percentage=order.site.progress,personId=builder.personId;
 assert.ok(percentage>0&&percentage<1);
 const memory=new Map(),original=globalThis.localStorage;
 globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
 try{
  assert.equal(game.save('construction-build-test'),true);
  const restored=SevenGame.load('construction-build-test');
  assert.ok(restored);
  assert.equal(restored.constructionSites.length,1);
  assert.equal(restored.constructionSites[0].progress,percentage);
  assert.equal(restored.get(builder.id).personId,personId);
  const unfinished=restored.get(order.site.firmId);
  assert.equal(unfinished.underConstruction,true);
  simulateUntil(restored,()=>!unfinished.underConstruction);
  assert.equal(unfinished.buildProgress,1);
  assert.ok(restored.get(builder.id));
  assert.equal(restored.constructionSites.length,0);
 }finally{globalThis.localStorage=original}
});

test('training builder costs 30, takes 5 game days and creates correct skill',()=>{
 const game=new SevenGame(),town=game.ownTowns()[0],cash=game.cash;
 const before=game.units.length;
 const r=game.trainConstruction(town.id);
 assert.equal(r.ok,true,r.msg);
 assert.equal(game.cash,cash-30);
 assert.equal(game.units.length,before,'no instant trained worker');
 for(let i=0;i<4;i++)game.advanceDay();
 assert.equal(game.units.length,before);
 const populationBeforeFinish=town.pop;
 game.advanceDay();
 assert.equal(game.units.length,before+1);
 // Daily natural growth may coincide with graduation; do not assume static town population.
 assert.ok(town.pop===populationBeforeFinish-1||town.pop===populationBeforeFinish);
 const trained=game.units.at(-1);
 assert.equal(trained.skillId,1);
 assert.equal(trained.skillLevel,20);
 assert.equal(trained.personId,trained.id);
});
