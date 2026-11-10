import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../game.js',import.meta.url),'utf8');

test('report HUD exposes pressed state for selected and cleared reports',()=>{
 assert.match(source,/b\.setAttribute\('aria-pressed','false'\)/);
 assert.match(source,/b\.setAttribute\('aria-pressed',String\(active\)\)/);
 assert.match(source,/b\.classList\.toggle\('active',active\)/);
});

test('Escape restores collapsed menu accessibility state',()=>{
 assert.match(source,/if\(e\.key==='Escape'\)\{[^\n]*setAttribute\('aria-expanded','false'\)/);
});
