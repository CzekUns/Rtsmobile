import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const content=await readFile(new URL('../sim.js',import.meta.url),'utf8');
// The production game uses browser-native ES modules; this data URL lets Node
// test that same module without a package.json or an npm build step.
const {Strategy,BUILDINGS,distance,SAVE_KEY}=await import('data:text/javascript;base64,'+Buffer.from(content).toString('base64'));
const memory=new Map();
globalThis.localStorage={
  setItem(key,val){memory.set(key,String(val));},
  getItem(key){return memory.get(key)||null;}
};

test('new world contains villages, ten persistent residents and local inventory',()=>{
  const game=new Strategy(12345);
  assert.equal(game.version,1);
  assert.equal(game.people.length,10);
  assert.equal(game.buildings.length,6);
  assert.equal(game.warehouses.length,1);
  assert.deepEqual(game.stocks(),{food:85,wood:76,stone:34});
  assert.equal(game.neighbours.length,2);
  assert.equal(game.people.filter(p=>p.inside).length,5);
  assert.equal(game.people.filter(p=>!p.inside).length,5);
});

test('overlapping placement rejected and building consumes exact resources',()=>{
  const game=new Strategy(12345);
  assert.equal(game.createConstruction('farm',23,22).ok,false);
  const before=game.stocks(),result=game.createConstruction('farm',35,26);
  assert.equal(result.ok,true);
  assert.equal(result.building.done,false);
  assert.equal(game.stocks().wood,before.wood-BUILDINGS.farm.cost.wood);
  assert.equal(game.stocks().stone,before.stone);
  assert.equal(game.people.some(p=>p.task?.kind==='build'),true);
  for(let i=0;i<1000;i++)game.update(.05);
  assert.equal(result.building.done,true);
});

test('a real resident reaches resources, gathers and delivers to warehouse',()=>{
  const game=new Strategy(12345);
  const p=game.people.find(p=>!p.inside);
  const node=game.resources.filter(r=>r.type==='wood').sort((a,b)=>distance(a,p)-distance(b,p))[0];
  assert.ok(node);
  const before=game.stocks().wood,quantity=node.quantity;
  assert.equal(game.assign(p,'gather',node.id),true);
  for(let i=0;i<800;i++)game.update(.05);
  assert.ok(game.stocks().wood>before,'goods physically reached a warehouse');
  assert.ok(node.quantity<quantity,'source resources decreased');
  assert.ok(p.skills.gather>1,'person improved skill through work');
});

test('residents mobilize as individuals and can return home',()=>{
  const game=new Strategy(12345);
  const p=game.people.find(p=>p.inside);
  const id=p.id,name=p.name;
  assert.equal(game.mobilize(p),true);
  assert.equal(p.id,id);
  assert.equal(p.name,name);
  assert.equal(p.inside,false);
  assert.equal(game.train(p),true);
  assert.equal(p.soldier,true);
  game.assign(p,'home',p.homeId);
  for(let i=0;i<220;i++)game.update(.05);
  assert.equal(p.inside,true);
});

test('diplomacy changes relations; peaceful accession transfers local settlement',()=>{
  const game=new Strategy(12345);
  for(let i=0;i<6;i++)assert.equal(game.gift(1).ok,true);
  assert.equal(game.neighbour(1).relation,'Alleate');
  assert.equal(game.annex(1).ok,true);
  assert.equal(game.neighbour(1),undefined);
  assert.equal(game.buildings.filter(b=>b.owner===1).length,0);
  assert.ok(game.buildings.some(b=>b.type==='village'&&b.x===44&&b.owner===0));
});

test('save key is isolated and restores a fully editable Strategy instance',()=>{
  memory.clear();
  const game=new Strategy(1001);
  const id=game.people[0].id;
  game.day=19;
  assert.equal(game.save(),true);
  const saved=JSON.parse(memory.get(SAVE_KEY));
  assert.equal(saved.version,1);
  assert.equal(saved.people[0].id,id);
  const restored=Strategy.restore();
  assert.ok(restored instanceof Strategy);
  assert.equal(restored.day,19);
  assert.equal(restored.people[0].id,id);
  assert.equal(restored.canPay({wood:10}),true);
  assert.equal(memory.has('terra-italica-save-v5'),false);
});
