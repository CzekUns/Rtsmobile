import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectionMeter} from '../../selection-meter.js';

const game=readFileSync(new URL('../../game.js',import.meta.url),'utf8');

test('town racial choices show the original race-specific loyalty beside population and unemployed counts',()=>{
 assert.match(game,/selectionMeter\('Fedeltà '\+r\.culture,r\.loyalty,100,\{decorative:true\}\)/);
 assert.match(game,/Disoccupati '\+r\.jobless/);
 assert.match(game,/aria-pressed="\x27\+active/);
});
test('building roster includes worker health and stable personnel identity',()=>{
 assert.match(game,/selectionMeter\('Salute '\+who,person\.hp\?\?100\)/);
 assert.match(game,/person\.personId\?\?person\.id/);
 assert.match(game,/data-worker-exit/);
});
test('per-person status is bounded and escaped even with legacy data',()=>{
 const html=selectionMeter('Salute <Operaio>',180);
 assert.match(html,/aria-valuenow="100"/);
 assert.match(html,/Salute &lt;Operaio&gt;/);
 assert.doesNotMatch(html,/<Operaio>/);
});
