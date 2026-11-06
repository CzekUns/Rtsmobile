import test from 'node:test';
import assert from 'node:assert/strict';
import {SevenGame} from '../../rules.js';

test('new HTML demo includes two real selectable Norman identities, separate from Greek soldiers',()=>{
 const game=new SevenGame();
 const enemy=game.units.filter(u=>u.owner===2&&u.kind==='soldier');
 assert.equal(enemy.length,2);
 assert.ok(enemy.every(u=>u.raceId==='norman'&&u.culture==='Normanni'&&u.personId===u.id));
 assert.equal(game.units.filter(u=>u.owner===1&&u.kind==='soldier').length,2);
 assert.ok(enemy.every(u=>!game.occupied(u.x,u.y,1)));
});
test('older saved HTML demo receives Norman defenders once without erasing player work',()=>{
 const game=new SevenGame();
 const old=JSON.parse(JSON.stringify(game));
 old.units=old.units.filter(u=>u.owner!==2);
 delete old.normanScoutDemoInitialized;
 old.cash=1234;
 const store=new Map([['legacy',JSON.stringify(old)]]);
 const previous=globalThis.localStorage;
 globalThis.localStorage={getItem:(k)=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
 try{
  const restored=SevenGame.load('legacy');
  assert.equal(restored.cash,1234);
  assert.equal(restored.units.filter(u=>u.owner===2).length,2);
  assert.equal(new Set([...restored.towns,...restored.units,...restored.firms].map(u=>u.id)).size,
   restored.towns.length+restored.units.length+restored.firms.length);
  restored.save('legacy');
  const again=SevenGame.load('legacy');
  assert.equal(again.units.filter(u=>u.owner===2).length,2);
 }finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous}
});
