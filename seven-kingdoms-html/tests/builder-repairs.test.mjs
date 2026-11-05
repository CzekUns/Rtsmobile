import test from 'node:test';
import assert from 'node:assert/strict';
import {SevenGame} from '../rules.js';
import {issueRepairOrder,cancelRepairOrder,advanceRepairs,canRepair} from '../playtest/repairs.js';
import {advancePlaytestRoutes} from '../playtest/path-routes.js';
import {issueWorkOrder} from '../playtest/work-assignments.js';
import {issueBuildOrder} from '../playtest/construction.js';

const scenario=()=>{
 const game=new SevenGame();
 const market=game.ownFirms().find(f=>f.kind==='market');
 const builder=game.units.find(u=>u.owner===1&&u.skillId===1);
 return {game,market,builder};
};
function reach(game,u){
 const start={x:u.x,y:u.y};
 for(let i=0;i<1600&&u.route?.length;i++)advancePlaytestRoutes(game,.05);
 assert.equal(u.route.length,0,'builder must reach the firm entrance');
 assert.notDeepEqual({x:u.x,y:u.y},start,'unit must physically walk');
}
test('new demo has a slightly damaged market and an available real builder',()=>{
 const {game,market,builder}=scenario();
 assert.equal(market.hp,98);
 assert.equal(canRepair(builder,market),true);
 assert.equal(game.ownFirms().find(f=>f.kind==='fort').hp,undefined);
});
test('repairer walks to a reachable entrance before restoring any building HP',()=>{
 const {game,market,builder}=scenario(),before=market.hp;
 const order=issueRepairOrder(game,builder.id,market.id);
 assert.equal(order.ok,true,order.msg);
 assert.equal(builder.repairTargetId,market.id);
 assert.ok(builder.route.length>0);
 assert.equal(market.hp,before);
 reach(game,builder);
 assert.equal(market.hp,before,'walking alone does not repair');
 let changed=false,finish=false;
 for(let i=0;i<15;i++){
  game.advanceDay();
  const events=advanceRepairs(game);
  changed ||=market.hp>before;
  finish ||=events.some(e=>e.type==='completed');
  if(finish)break;
 }
 assert.equal(changed,true);
 assert.equal(finish,true,'market should reach max HP under real day/skill interval');
 assert.equal(market.hp,100);
 assert.equal(builder.repairTargetId,null);
 assert.equal(game.units.includes(builder),true,'construction worker remains on map');
});
test('orders and resources remain intact when no entrance can be found',()=>{
 const {game,market,builder}=scenario();
 const cash=game.cash,before={x:builder.x,y:builder.y};
 market.x=100;market.y=100;
 const r=issueRepairOrder(game,builder.id,market.id);
 assert.equal(r.ok,false);
 assert.equal(builder.repairTargetId,undefined);
 assert.deepEqual({x:builder.x,y:builder.y},before);
 assert.equal(game.cash,cash);
});
test('one firm has only one repairer and stop cancels the activity',()=>{
 const {game,market,builder}=scenario();
 assert.equal(issueRepairOrder(game,builder.id,market.id).ok,true);
 const other=game.units.find(u=>u!==builder&&u.kind==='peasant');
 other.skillId=1;other.skillLevel=20;
 assert.equal(issueRepairOrder(game,other.id,market.id).ok,false);
 assert.equal(issueWorkOrder(game,builder.id,game.ownFirms().find(f=>f.kind==='mine').id).ok,false);
 assert.equal(issueBuildOrder(game,builder.id,'market',15,15).ok,false);
 const before=market.hp;
 assert.equal(cancelRepairOrder(game,builder.id).ok,true);
 assert.equal(builder.repairTargetId,null);
 assert.equal(builder.route.length,0);
 for(let i=0;i<8;i++){game.advanceDay();advanceRepairs(game)}
 assert.equal(market.hp,before);
 assert.equal(cancelRepairOrder(game,builder.id).ok,false);
});
test('repair waits after attack, when treasury is negative, and during pause',()=>{
 const {game,market,builder}=scenario();
 assert.equal(issueRepairOrder(game,builder.id,market.id).ok,true);
 reach(game,builder);
 const hp=market.hp;
 game.paused=true;
 assert.deepEqual(advanceRepairs(game),[]);
 assert.equal(market.hp,hp);
 game.paused=false;game.cash=-1;
 for(let i=0;i<12;i++){game.advanceDay();advanceRepairs(game)}
 assert.equal(market.hp,hp);
 game.cash=1000;
 market.lastAttackedDay=game.day;
 for(let i=0;i<2;i++){game.advanceDay();advanceRepairs(game)}
 assert.equal(market.hp,hp);
 let increased=false;
 for(let i=0;i<6;i++){game.advanceDay();advanceRepairs(game);increased||=market.hp>hp}
 assert.equal(increased,true);
});
test('save/reload retains repair destination, HP and partial repair dates',()=>{
 const {game,market,builder}=scenario();
 assert.equal(issueRepairOrder(game,builder.id,market.id).ok,true);
 reach(game,builder);
 for(let i=0;i<3;i++){game.advanceDay();advanceRepairs(game)}
 const hp=market.hp;
 const storage=new Map(),original=globalThis.localStorage;
 globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
 try{
  assert.equal(game.save('7k-repair-save'),true);
  const copy=SevenGame.load('7k-repair-save');
  const u=copy.get(builder.id),f=copy.get(market.id);
  assert.equal(u.personId,builder.personId);
  assert.equal(u.repairTargetId,market.id);
  assert.equal(f.hp,hp);
  assert.equal(f.lastRepairAppliedDay,market.lastRepairAppliedDay);
  for(let i=0;i<12&&u.repairTargetId;i++){copy.advanceDay();advanceRepairs(copy)}
  assert.equal(f.hp,100);
  assert.equal(u.repairTargetId,null);
 }finally{globalThis.localStorage=original}
});
