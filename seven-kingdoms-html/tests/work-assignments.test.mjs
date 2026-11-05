import test from 'node:test';
import assert from 'node:assert/strict';
import {SevenGame} from '../rules.js';
import {issueWorkOrder,completeWorkArrivals,reachableWorkEntrances} from '../playtest/work-assignments.js';
import {advancePlaytestRoutes,staticBlocked} from '../playtest/path-routes.js';

function setup(){
 const game=new SevenGame(73429);
 const unit=game.units.find(u=>u.owner===1&&u.kind==='peasant');
 const mine=game.firms.find(f=>f.owner===1&&f.kind==='mine');
 return {game,unit,mine};
}
function walk(game,until=2500){
 let movement=false,completed=[];
 const before=game.units.map(u=>({id:u.id,x:u.x,y:u.y}));
 for(let i=0;i<until;i++){
  advancePlaytestRoutes(game,.05);
  if(game.units.some(u=>{
    const start=before.find(b=>b.id===u.id);
    return start&&(start.x!==u.x||start.y!==u.y);
  }))movement=true;
  const results=completeWorkArrivals(game);
  completed.push(...results);
  if(results.length)break;
 }
 return {movement,completed};
}

test('peasant receives a job and walks to the mine entrance before becoming a worker',()=>{
 const {game,unit,mine}=setup();
 const workers=mine.workers;
 const start={x:unit.x,y:unit.y};
 const result=issueWorkOrder(game,unit.id,mine.id);
 assert.equal(result.ok,true,result.msg);
 assert.ok(result.steps>0);
 assert.equal(mine.workers,workers,'a job order must not teleport a resident');
 assert.ok(game.units.includes(unit));
 assert.equal(unit.workTargetId,mine.id);
 const initialRoute=unit.route.map(p=>({...p}));
 assert.equal(initialRoute.some(p=>staticBlocked(game,p.x,p.y)),false);
 const {movement,completed}=walk(game);
 assert.equal(movement,true,'person must visibly move on the map');
 assert.equal(completed.length,1,'arrival must complete exactly once');
 assert.equal(completed[0].ok,true);
 assert.equal(mine.workers,workers+1);
 assert.equal(game.units.includes(unit),false,'unit is consumed only at the entrance');
 assert.equal(completeWorkArrivals(game).length,0);
 assert.notDeepEqual(start,result.destination);
});

test('full or reserved building refuses orders without deleting an existing march',()=>{
 const {game,unit,mine}=setup();
 const market=game.firms.find(f=>f.owner===1&&f.kind==='market');
 const first=issueWorkOrder(game,unit.id,mine.id);
 assert.equal(first.ok,true);
 const route=unit.route.map(p=>({...p}));
 const destination={...unit.target};
 market.workers=8;
 const rejected=issueWorkOrder(game,unit.id,market.id);
 assert.equal(rejected.ok,false);
 assert.deepEqual(unit.route,route);
 assert.deepEqual(unit.target,destination);
 assert.equal(unit.workTargetId,mine.id);
});

test('occupied entrances are skipped and inaccessible buildings reject work',()=>{
 const {game,unit,mine}=setup();
 const choices=reachableWorkEntrances(game,unit,mine);
 assert.ok(choices.length>0);
 for(const {end,path} of choices){
  assert.equal(staticBlocked(game,end.x,end.y),false);
  assert.deepEqual(path[path.length-1],end);
 }
 mine.x=100;mine.y=100;
 const result=issueWorkOrder(game,unit.id,mine.id);
 assert.equal(result.ok,false);
 assert.equal(unit.workTargetId,undefined);
 assert.equal(game.units.includes(unit),true);
});

test('soldiers serve only in forts and still need to walk to the entrance',()=>{
 const {game,mine}=setup();
 const soldier=game.units.find(u=>u.owner===1&&u.kind==='soldier');
 const fort=game.firms.find(f=>f.owner===1&&f.kind==='fort');
 assert.equal(issueWorkOrder(game,soldier.id,mine.id).ok,false);
 const count=fort.workers;
 const order=issueWorkOrder(game,soldier.id,fort.id);
 assert.equal(order.ok,true,order.msg);
 assert.equal(fort.workers,count);
 const {completed}=walk(game);
 assert.ok(completed.some(x=>x.unitId===soldier.id&&x.ok));
 assert.equal(fort.workers,count+1);
});

test('stopping an inhabitant cancels the pending job without increasing workers',()=>{
 const {game,unit,mine}=setup();
 const previous=mine.workers;
 assert.equal(issueWorkOrder(game,unit.id,mine.id).ok,true);
 unit.target=null;unit.route=[];unit.workTargetId=null;
 for(let i=0;i<40;i++){advancePlaytestRoutes(game,.05);assert.deepEqual(completeWorkArrivals(game),[]);}
 assert.equal(mine.workers,previous);
 assert.equal(game.units.includes(unit),true);
});

test('a pending job survives saving and loading in the test namespace',()=>{
 const {game,unit,mine}=setup();
 assert.equal(issueWorkOrder(game,unit.id,mine.id).ok,true);
 const fake=new Map(),original=globalThis.localStorage;
 globalThis.localStorage={getItem:k=>fake.get(k)??null,setItem:(k,v)=>fake.set(k,v)};
 try{
  assert.equal(game.save('seven-kingdoms-html-job-test'),true);
  const loaded=SevenGame.load('seven-kingdoms-html-job-test');
  const traveler=loaded.get(unit.id),workplace=loaded.get(mine.id);
  assert.ok(traveler);
  assert.equal(traveler.workTargetId,mine.id);
  assert.equal(workplace.workers,mine.workers);
  const {completed}=walk(loaded);
  assert.ok(completed.some(x=>x.unitId===unit.id&&x.ok));
  assert.equal(workplace.workers,mine.workers+1);
 }finally{globalThis.localStorage=original;}
});

test('paused game preserves work route until the player resumes',()=>{
 const {game,unit,mine}=setup();
 assert.equal(issueWorkOrder(game,unit.id,mine.id).ok,true);
 const start={x:unit.x,y:unit.y},route=unit.route.map(p=>({...p}));
 game.paused=true;
 advancePlaytestRoutes(game,2);
 assert.deepEqual({x:unit.x,y:unit.y},start);
 assert.deepEqual(unit.route,route);
 game.paused=false;
 advancePlaytestRoutes(game,.2);
 assert.notDeepEqual({x:unit.x,y:unit.y},start);
});
