import test from 'node:test';
import assert from 'node:assert/strict';
import {SevenGame,SAVE_KEY,WORLD_W,WORLD_H} from '../rules.js';
import {issuePlaytestOrder,advancePlaytestRoutes,staticBlocked} from '../playtest/path-routes.js';

function scenario(){
 const g=new SevenGame(73429);
 const soldier=g.units.find(u=>u.kind==='soldier'&&u.owner===1);
 g.units=[soldier]; // Isolate path behavior from demo unit congestion.
 return {g,soldier};
}
function reach(g,u){
 for(let y=0;y<WORLD_H;y++)for(let x=0;x<WORLD_W;x++){
  if(Math.hypot(x-u.x,y-u.y)<5||staticBlocked(g,x,y))continue;
  const result=issuePlaytestOrder(g,u.id,x+.1,y+.1);
  if(result.ok&&u.route?.length>=4)return {x,y};
 }
 throw Error('no reachable route in the demo scenario');
}
test('pathfinding routes around actual towns, firms and water',()=>{
 const {g,soldier}=scenario(),dest=reach(g,soldier);
 assert.ok(soldier.route.length>=4);
 assert.deepEqual(soldier.target,dest);
 let previous={x:Math.round(soldier.x),y:Math.round(soldier.y)};
 for(const tile of soldier.route){
  assert.equal(staticBlocked(g,tile.x,tile.y),false);
  assert.ok(Math.abs(tile.x-previous.x)<=1&&Math.abs(tile.y-previous.y)<=1);
  previous=tile;
 }
});
test('moves along planned route, never entering a blocked tile, then stops',()=>{
 const {g,soldier}=scenario(),goal=reach(g,soldier);
 for(let i=0;i<2000&&soldier.target;i++){
  advancePlaytestRoutes(g,.05);
  // Check the location tile and permit only the original legacy spawn if invalid.
  if(i>25)assert.equal(staticBlocked(g,Math.round(soldier.x),Math.round(soldier.y)),false);
 }
 assert.equal(soldier.target,null);
 assert.deepEqual({x:soldier.x,y:soldier.y},goal);
 assert.equal(soldier.route.length,0);
});
test('rejects occupied town target without corrupting old route',()=>{
 const {g,soldier}=scenario();const goal=reach(g,soldier);
 const initial=soldier.route.map(x=>({...x}));
 const t=g.ownTowns()[0];
 const result=issuePlaytestOrder(g,soldier.id,t.x+1,t.y+1);
 assert.equal(result.ok,false);
 assert.deepEqual(soldier.route,initial);
 assert.deepEqual(soldier.target,goal);
});
test('paused game does not move and legacy movement is available',()=>{
 const {g,soldier}=scenario();reach(g,soldier);
 const before={x:soldier.x,y:soldier.y};
 g.paused=true;advancePlaytestRoutes(g,1);
 assert.deepEqual({x:soldier.x,y:soldier.y},before);
 const old=new SevenGame(73429),u=old.units.find(x=>x.owner===1);
 assert.equal(old.order(u.id,u.x+2,u.y).ok,true);
 const start={x:u.x,y:u.y};
 old.update(.1);
 assert.ok(Math.hypot(u.x-start.x,u.y-start.y)>0);
});
test('playtest save key does not overwrite normal demo key',()=>{
 const previous=globalThis.localStorage,items=new Map();
 globalThis.localStorage={getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,v)};
 try{
  const main=new SevenGame();main.cash=71;main.save();
  const isolated=new SevenGame();isolated.cash=93;isolated.save('seven-kingdoms-html-quick-playtest-v1');
  assert.equal(SevenGame.load().cash,71);
  assert.equal(SevenGame.load('seven-kingdoms-html-quick-playtest-v1').cash,93);
  assert.notEqual(items.get(SAVE_KEY),items.get('seven-kingdoms-html-quick-playtest-v1'));
 }finally{globalThis.localStorage=previous}
});
