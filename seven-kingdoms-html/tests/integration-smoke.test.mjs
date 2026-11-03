/* SKH-106 baseline smoke tests: fail early when native entrypoint integration breaks. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SevenGame,SAVE_KEY,WORLD_W,WORLD_H} from '../rules.js';
const source=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('baseline exposes a native JS game with separate domain and browser modules',()=>{
 const html=source('index.html');
 assert.match(html,/type=["']module["'][^>]*src=["']game\.js\?v=1["']/);
 assert.match(source('game.js'),/from ['"]\.\/rules\.js['"]/);
 assert.match(source('game.js'),/from ['"]\.\/view\.js['"]/);
 assert.doesNotMatch(html,/\.wasm(?:["'?]|\b)/i);
 for(const id of ['stage','world','minimap','selectionActions','reportBody','fullscreenBtn','rotate']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.equal(WORLD_W,76);
 assert.equal(WORLD_H,66);
});

test('fresh skirmish keeps IDs unique and initial links valid',()=>{
 const g=new SevenGame(73429);
 const things=[...g.towns,...g.firms,...g.units];
 const ids=things.map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.ok(g.towns.length>0&&g.units.length>0);
 assert.ok(things.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)));
 assert.ok(!g.occupied(0,0,1));
});

test('paused update leaves serialized game state unchanged',()=>{
 const g=new SevenGame(73429);
 g.paused=true;
 const before=JSON.stringify(g);
 g.update(1);
 assert.equal(JSON.stringify(g),before);
});

test('same seed and equivalent actions lead to equivalent states in the current demo',()=>{
 const a=new SevenGame(73429),b=new SevenGame(73429);
 // IDs are globally allocated, so compare meaningful state independently of IDs.
 const shape=g=>({seed:g.seed,day:g.day,cash:g.cash,food:g.food,
  towns:g.towns.map(t=>[t.name,t.owner,t.pop,t.loyalty,t.resistance]),
  units:g.units.map(u=>[u.kind,u.owner,u.x,u.y])});
 for(const g of [a,b]){g.update(0.05);g.advanceDay();}
 assert.deepEqual(shape(a),shape(b));
});

test('save storage is namespaced to HTML edition',()=>{
 assert.match(SAVE_KEY,/seven-kingdoms-html/);
 assert.doesNotMatch(SAVE_KEY,/ver-sacrum/i);
});
