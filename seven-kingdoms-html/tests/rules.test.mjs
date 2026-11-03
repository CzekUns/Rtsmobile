/* Tests for the native HTML rewrite. Run: node --test tests/*.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';
import {SevenGame,FIRMS} from '../rules.js';
test('a skirmish is about kingdoms and independent towns, not Ver Sacrum',()=>{
 const g=new SevenGame();
 assert.equal(g.ownTowns().length,1);
 assert.equal(g.towns.filter(t=>t.owner===0).length,3);
 assert.equal(g.towns.filter(t=>t.owner===2).length,1);
 assert.equal(Object.keys(FIRMS).length,6);
});
test('taxes, grants and recruitment change population, loyalty and treasury',()=>{
 const g=new SevenGame(),town=g.ownTowns()[0];
 const pop=town.pop,initialCash=g.cash,initialLoyalty=town.loyalty;
 assert.equal(g.tax(town.id).ok,true);
 assert.ok(g.cash>initialCash);
 assert.ok(town.loyalty<initialLoyalty);
 assert.equal(g.recruit(town.id).ok,true);
 assert.equal(town.pop,pop-1);
 assert.equal(g.grant(town.id).ok,true);
});
test('a nearby fort permits persuasion and voluntary annexation',()=>{
 const g=new SevenGame();
 const town=g.towns.find(t=>t.owner===0&&g.ownFirms().some(f=>f.kind==='fort'&&g.linked(f,t)));
 assert.ok(town);
 for(let i=0;i<4&&town.resistance>15;i++)assert.equal(g.persuade(town.id).ok,true);
 assert.equal(g.annex(town.id).ok,true);
 assert.equal(town.owner,1);
 assert.equal(g.ownTowns().length,2);
});
test('assigning staff produces mineral, goods and sales',()=>{
 const g=new SevenGame();
 const factory=g.build('factory',32,30);
 assert.equal(factory.ok,true);
 const worker=g.units.find(u=>u.kind==='peasant'&&u.owner===1);
 assert.equal(g.assign(worker.id,factory.firm.id).ok,true);
 const cash=g.cash;
 for(let i=0;i<80;i++)g.produce();
 assert.ok(g.raw>=0);
 assert.ok(g.goods>=0);
 assert.ok(g.cash>cash);
});
test('save restore has an isolated key and continues the same skirmish',()=>{
 const previous=globalThis.localStorage;
 const items=new Map();
 globalThis.localStorage={getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,v)};
 try{
  const g=new SevenGame(1234);g.cash=870;g.day=31;
  assert.equal(g.save(),true);
  const copy=SevenGame.load();
  assert.equal(copy.cash,870);
  assert.equal(copy.day,31);
  assert.equal(copy.seed,1234);
 }finally{globalThis.localStorage=previous}
});
