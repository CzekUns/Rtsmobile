import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectionMeter} from '../../selection-meter.js';

const source=readFileSync(new URL('../../game.js',import.meta.url),'utf8');

test('unit health is a bounded meter, not an unbounded text value',()=>{
 assert.match(source,/selectionMeter\('Salute unità',item\.hp\?\?100,100\)/);
 const markup=selectionMeter('Salute unità',-15,100);
 assert.match(markup,/aria-valuenow="0"/);
 assert.doesNotMatch(markup,/NaN|Infinity/);
});
test('repair status uses the actual firm maximum health',()=>{
 assert.match(source,/selectionMeter\('Integrità riparazione',activeRepair\.hp\?\?100,activeRepair\.maxHp\?\?100\)/);
 assert.match(selectionMeter('Riparazione',40,80),/width:50%/);
});
test('active site progress uses normalized 0..1 and walking retains text',()=>{
 assert.match(source,/activeSite\.status==='walking'\?'In marcia':selectionMeter\('Avanzamento cantiere',activeSite\.progress\?\?0,1\)/);
 assert.match(selectionMeter('Cantiere',0.375,1),/width:37\.5%/);
 assert.match(selectionMeter('Cantiere',2,1),/aria-valuenow="1"/);
});
test('unit selection retains controls and assignment details',()=>{
 assert.match(source,/MOD \+ tocco/);
 assert.match(source,/const jobActions=eligible\.map/);
 assert.match(source,/data-repair-firm/);
});
