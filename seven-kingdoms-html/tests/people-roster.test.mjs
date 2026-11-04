import test from 'node:test';
import assert from 'node:assert/strict';
import {SevenGame} from '../rules.js';
import {SKILLS,ensureFirmPersonnel,skillLabel} from '../playtest/personnel.js';

test('uses verified upstream OSKILL skill order and keeps prayer non-trainable',()=>{
 assert.deepEqual(SKILLS.map(x=>x.key),[
  'none','construction','leading','mining','manufacturing',
  'research','spying','praying'
 ]);
 assert.equal(SKILLS.filter(x=>x.trainable).length,6);
 assert.equal(skillLabel(1,20),'Costruzione · 20');
});
test('legacy buildings show distinct workers without invented names or skill histories',()=>{
 const game=new SevenGame(),fort=game.firms.find(f=>f.kind==='fort'&&f.owner===1);
 const staff=ensureFirmPersonnel(fort);
 assert.equal(staff.length,3);
 assert.equal(fort.workers,3);
 assert.equal(new Set(staff.map(x=>x.id)).size,3);
 assert.ok(staff.every(x=>x.personId===null&&x.legacyUnknown&&x.name===null));
 assert.equal(ensureFirmPersonnel(fort)[0].id,staff[0].id);
});
test('an entering inhabitant retains its person ID, race, skill, HP, and can be dismissed specifically',()=>{
 const game=new SevenGame(),firm=game.firms.find(f=>f.kind==='mine'&&f.owner===1);
 const first=game.units.find(u=>u.kind==='peasant');
 first.culture='Greci';first.raceId=3;first.skillId=1;first.skillLevel=20;
 first.combatLevel=7;first.hp=77;first.personId='person-generic-42';
 const head=firm.workers;
 const assigned=game.assign(first.id,firm.id);
 assert.equal(assigned.ok,true,assigned.msg);
 assert.equal(firm.workers,head+1);
 assert.equal(firm.staff.length,head+1);
 const staff=firm.staff.find(w=>w.personId==='person-generic-42');
 assert.ok(staff);
 assert.equal(staff.raceId,3);
 assert.equal(staff.skillId,1);
 assert.equal(staff.skillLevel,20);
 assert.equal(staff.hp,77);
 assert.equal(game.units.includes(first),false);
 const out=game.dismiss(firm.id,staff.id);
 assert.equal(out.ok,true,out.msg);
 assert.equal(out.unit.personId,'person-generic-42');
 assert.equal(out.unit.raceId,3);
 assert.equal(out.unit.skillId,1);
 assert.equal(out.unit.skillLevel,20);
 assert.equal(out.unit.combatLevel,7);
 assert.equal(out.unit.hp,77);
 assert.equal(firm.workers,head);
 assert.ok(!firm.staff.some(w=>w.id===staff.id));
});
test('specific dismissal rejects unknown person without changing workers',()=>{
 const game=new SevenGame(),firm=game.ownFirms()[0],first=firm.staff.map(w=>({...w}));
 const result=game.dismiss(firm.id,'bogus');
 assert.equal(result.ok,false);
 assert.equal(firm.staff.length,first.length);
 assert.equal(game.units.some(u=>u.personId==='bogus'),false);
});
test('save/load preserves roster and staff identity, including legacy migration',()=>{
 const items=new Map(),previous=globalThis.localStorage;
 globalThis.localStorage={getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,v)};
 try{
  const game=new SevenGame();
  const firm=game.ownFirms().find(x=>x.kind==='market');
  const person=game.units.find(x=>x.kind==='peasant');
  person.skillId=4;person.skillLevel=35;person.culture='Greci';
  const added=game.assign(person.id,firm.id);
  assert.equal(added.ok,true);
  const snapshot=firm.staff.map(x=>({id:x.id,personId:x.personId,skillId:x.skillId,skillLevel:x.skillLevel}));
  assert.equal(game.save('individual-workers-test'),true);
  const loaded=SevenGame.load('individual-workers-test');
  const newFirm=loaded.get(firm.id);
  assert.equal(newFirm.workers,firm.workers);
  assert.deepEqual(newFirm.staff.map(x=>({id:x.id,personId:x.personId,skillId:x.skillId,skillLevel:x.skillLevel})),snapshot);
  const out=loaded.dismiss(firm.id,added.worker.id);
  assert.equal(out.ok,true);
  assert.equal(out.unit.skillId,4);
  assert.equal(out.unit.skillLevel,35);

  // Simulate a true old save containing ONLY a numeric workers field.
  const legacy=new SevenGame();legacy.ownFirms()[0].staff=undefined;
  assert.equal(legacy.save('old-roster-test'),true);
  const restored=SevenGame.load('old-roster-test');
  assert.equal(restored.ownFirms()[0].staff.length,legacy.ownFirms()[0].workers);
  assert.equal(restored.ownFirms()[0].staff[0].legacyUnknown,true);
 }finally{globalThis.localStorage=previous;}
});
