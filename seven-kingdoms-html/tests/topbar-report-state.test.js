import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');

test('all nine HUD reports expose a non-pressed initial button state',()=>{
 const buttons=[...html.matchAll(/<button\b[^>]*data-report="([^"]+)"[^>]*>/g)];
 assert.equal(buttons.length,9);
 assert.equal(new Set(buttons.map(b=>b[1])).size,9);
 for(const [markup] of buttons){
  assert.match(markup,/type="button"/);
  assert.match(markup,/aria-pressed="false"/);
 }
});
test('opening a report updates both visible active class and pressed state',()=>{
 assert.match(game,/const active=b\.dataset\.report===name;b\.classList\.toggle\('active',active\);b\.setAttribute\('aria-pressed',String\(active\)\)/);
});
test('closing a report clears active and pressed states for every report',()=>{
 assert.match(game,/b\.classList\.remove\('active'\);b\.setAttribute\('aria-pressed','false'\)/);
 assert.match(game,/addEventListener\('close'/);
});
