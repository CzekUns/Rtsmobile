import test from 'node:test';
import assert from 'node:assert/strict';
import {SevenGame} from '../rules.js';

test('Construction training costs 30, takes five days and creates one level-20 builder',()=>{
 const g=new SevenGame(123);
 const t=g.ownTowns().find(t=>g.ownFirms().some(f=>f.kind==='fort'&&g.linked(f,t)));
 assert.ok(t,'fixture requires a connected town');
 t.loyalty=90;t.pop=30;g.cash=100;
 const startPop=t.pop;
 assert.equal(g.trainConstruction(t.id).ok,true);
 assert.equal(g.cash,70);
 assert.equal(t.pop,startPop-1);
 assert.equal(g.trainConstruction(t.id).ok,false);
 for(let i=0;i<4;i++)g.advanceDay();
 assert.equal(g.units.filter(u=>u.skillId===1).length,0);
 assert.equal(t.constructionTraining.daysRemaining,1);
 g.advanceDay();
 const builders=g.units.filter(u=>u.skillId===1);
 assert.equal(builders.length,1);
 assert.equal(builders[0].skillLevel,20);
 assert.equal(t.constructionTraining,null);
});
test('Training refuses insufficient funds without altering population',()=>{
 const g=new SevenGame(123);
 const t=g.ownTowns().find(t=>g.ownFirms().some(f=>f.kind==='fort'&&g.linked(f,t)));
 assert.ok(t);
 t.loyalty=90;g.cash=30;
 const pop=t.pop;
 assert.equal(g.trainConstruction(t.id).ok,false);
 assert.equal(t.pop,pop);
 assert.equal(t.constructionTraining,undefined);
});
test('Training state survives JSON roundtrip without losing remaining days',()=>{
 const g=new SevenGame(123);
 const t=g.ownTowns().find(t=>g.ownFirms().some(f=>f.kind==='fort'&&g.linked(f,t)));
 assert.ok(t);t.loyalty=90;g.cash=100;
 assert.equal(g.trainConstruction(t.id).ok,true);
 g.advanceDay();
 const copy=Object.assign(Object.create(SevenGame.prototype),JSON.parse(JSON.stringify(g)));
 assert.equal(copy.get(t.id).constructionTraining.daysRemaining,4);
 for(let i=0;i<4;i++)copy.advanceDay();
 assert.equal(copy.units.filter(u=>u.skillId===1).length,1);
});
