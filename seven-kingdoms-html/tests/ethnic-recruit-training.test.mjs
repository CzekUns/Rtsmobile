import test from 'node:test';
import assert from 'node:assert/strict';
import {SevenGame} from '../rules.js';
import {SKILLS} from '../playtest/personnel.js';
import {ensureTownRaces,recruitableTownPeople,summarizeTown} from '../playtest/town-races.js';

const townOf=g=>g.ownTowns()[0];
const race=(t,id)=>t.races.find(r=>r.raceId===id);

test('new skirmish exposes two selectable ethnic populations in Corinto',()=>{
 const game=new SevenGame(),town=townOf(game);
 assert.deepEqual(town.races.map(r=>r.raceId),['greek','norman']);
 assert.deepEqual(town.races.map(r=>r.population),[34,8]);
 assert.equal(town.selectedRaceId,'greek');
 assert.equal(town.pop,42);
 assert.equal(recruitableTownPeople(town,'norman'),8);
});

test('recruit a specifically chosen Norman without reducing Greek population',()=>{
 const game=new SevenGame(),town=townOf(game);
 const population=town.pop,cash=game.cash;
 const result=game.recruit(town.id,'norman');
 assert.equal(result.ok,true,result.msg);
 assert.equal(result.unit.raceId,'norman');
 assert.equal(result.unit.culture,'Normanni');
 assert.equal(result.unit.personId,result.unit.id);
 assert.equal(race(town,'norman').population,7);
 assert.equal(race(town,'norman').jobless,7);
 assert.equal(race(town,'greek').population,34);
 assert.equal(town.pop,population-1);
 assert.equal(game.cash,cash);
 assert.equal(town.races.reduce((s,r)=>s+r.population,0),town.pop);
 assert.equal(game.occupied(result.unit.x,result.unit.y,1),false);
});

test('reject unknown race, disallowed loyalty or exhausted jobless population',()=>{
 const game=new SevenGame(),town=townOf(game);
 const start=town.pop;
 assert.equal(game.recruit(town.id,'does-not-exist').ok,false);
 assert.equal(town.pop,start);
 race(town,'norman').loyalty=20;
 assert.equal(game.recruit(town.id,'norman').ok,false);
 assert.equal(game.recruit(town.id,'greek').ok,true);
 race(town,'norman').loyalty=78;
 race(town,'norman').jobless=0;
 assert.equal(game.recruit(town.id,'norman').ok,false);
 assert.equal(town.pop,start-1);
});

test('tax and subsidy update per-race loyalty while preserving aggregate invariants',()=>{
 const game=new SevenGame(),town=townOf(game);
 assert.equal(game.tax(town.id).ok,true);
 assert.equal(town.loyalty,68);
 assert.deepEqual(town.races.map(r=>r.loyalty),[68,68]);
 assert.equal(game.grant(town.id).ok,true);
 assert.equal(town.loyalty,78);
 assert.deepEqual(town.races.map(r=>r.loyalty),[78,78]);
});

test('train selected race and specific profession; queue jobs are sequential',()=>{
 const game=new SevenGame(),town=townOf(game);
 const startCash=game.cash,startPeople=game.units.length;
 const first=game.trainSkill(town.id,'norman',1);
 const second=game.trainSkill(town.id,'greek',6);
 assert.equal(first.ok,true,first.msg);
 assert.equal(second.ok,true,second.msg);
 assert.equal(game.cash,startCash-60);
 assert.deepEqual(town.trainingQueue.map(j=>j.readyDay),[6,11]);
 assert.deepEqual(town.trainingQueue.map(j=>j.raceId),['norman','greek']);
 assert.equal(town.pop,42,'queued training must not mobilize a person yet');
 for(let i=0;i<5;i++)game.advanceDay();
 assert.equal(game.units.length,startPeople+1);
 assert.equal(game.units.at(-1).skillId,1);
 assert.equal(game.units.at(-1).skillLevel,20);
 assert.equal(game.units.at(-1).raceId,'norman');
 assert.equal(town.trainingQueue.length,1);
 for(let i=0;i<5;i++)game.advanceDay();
 assert.equal(game.units.length,startPeople+2);
 assert.equal(game.units.at(-1).skillId,6);
 assert.equal(game.units.at(-1).raceId,'greek');
 assert.equal(town.trainingQueue.length,0);
 assert.equal(town.pop,town.races.reduce((n,r)=>n+r.population,0));
});

test('all six trainable original skills can yield an individual specialist',()=>{
 const game=new SevenGame(),town=townOf(game);
 const count=game.units.length;
 const skills=SKILLS.filter(s=>s.trainable);
 assert.equal(skills.length,6);
 for(const s of skills)assert.equal(game.trainSkill(town.id,'greek',s.id).ok,true,s.label);
 for(let i=0;i<30;i++)game.advanceDay();
 const born=game.units.slice(count);
 assert.deepEqual(born.map(u=>u.skillId),[1,2,3,4,5,6]);
 assert.ok(born.every(u=>u.skillLevel===20&&u.raceId==='greek'&&u.personId===u.id));
});

test('invalid, non-trainable skill or no cash never changes queue or population',()=>{
 const game=new SevenGame(),town=townOf(game);
 const count=town.pop;
 assert.equal(game.trainSkill(town.id,'greek',7).ok,false,'praying is not trainable');
 assert.equal(game.trainSkill(town.id,'norman',42).ok,false);
 assert.equal(game.trainSkill(town.id,'missing',1).ok,false);
 game.cash=29;
 assert.equal(game.trainSkill(town.id,'greek',1).ok,false);
 assert.equal(town.trainingQueue.length,0);
 assert.equal(town.pop,count);
});

test('queue capacity respects ten entries and reserved ethnic jobless counts',()=>{
 const game=new SevenGame(),town=townOf(game);
 for(let i=0;i<8;i++)assert.equal(game.trainSkill(town.id,'norman',1).ok,true);
 assert.equal(recruitableTownPeople(town,'norman'),0);
 assert.equal(game.recruit(town.id,'norman').ok,false);
 assert.equal(game.trainSkill(town.id,'norman',1).ok,false);
 assert.equal(game.trainSkill(town.id,'greek',2).ok,true);
 assert.equal(game.trainSkill(town.id,'greek',3).ok,true);
 assert.equal(town.trainingQueue.length,10);
 assert.equal(game.trainSkill(town.id,'greek',4).ok,false);
});

test('cancel one queued job refunds only that entry and reflows remaining schedule',()=>{
 const game=new SevenGame(),town=townOf(game),cash=game.cash;
 const a=game.trainSkill(town.id,'norman',1).queue;
 const b=game.trainSkill(town.id,'greek',3).queue;
 assert.equal(game.cancelTraining(town.id,a.id).ok,true);
 assert.equal(town.trainingQueue.length,1);
 assert.equal(town.trainingQueue[0].id,b.id);
 assert.equal(town.trainingQueue[0].readyDay,6);
 assert.equal(game.cash,cash-30);
 assert.equal(game.cancelTraining(town.id,'unknown').ok,false);
 assert.equal(town.pop,42);
});

test('save/reload preserves selected ethnic group and pending individual training',()=>{
 const previous=globalThis.localStorage,items=new Map();
 globalThis.localStorage={getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,v)};
 try{
  const game=new SevenGame(),town=townOf(game);
  town.selectedRaceId='norman';
  assert.equal(game.trainSkill(town.id,'norman',5).ok,true);
  const id=town.trainingQueue[0].id;
  const ready=town.trainingQueue[0].readyDay;
  assert.equal(game.save('7k-test-races'),true);
  const restored=SevenGame.load('7k-test-races'),home=townOf(restored);
  assert.equal(home.selectedRaceId,'norman');
  assert.equal(home.trainingQueue[0].id,id);
  assert.equal(home.trainingQueue[0].readyDay,ready);
  for(let i=0;i<5;i++)restored.advanceDay();
  assert.equal(restored.units.at(-1).skillId,5);
  assert.equal(restored.units.at(-1).raceId,'norman');
  assert.equal(home.trainingQueue.length,0);
 }finally{globalThis.localStorage=previous}
});

test('old one-culture save is migrated without inventing a second ethnicity',()=>{
 const previous=globalThis.localStorage,items=new Map();
 globalThis.localStorage={getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,v)};
 try{
  const game=new SevenGame(),town=townOf(game);
  const initialPop=town.pop;
  delete town.races;delete town.selectedRaceId;
  assert.equal(game.save('7k-legacy-ethnicity'),true);
  const restored=SevenGame.load('7k-legacy-ethnicity');
  const migrated=townOf(restored);
  assert.equal(migrated.races.length,1);
  assert.equal(migrated.races[0].culture,'Greci');
  assert.equal(migrated.races[0].legacyEstimated,true);
  assert.equal(migrated.pop,initialPop);
  assert.equal(restored.recruit(migrated.id,'greek').ok,true);
 }finally{globalThis.localStorage=previous}
});
