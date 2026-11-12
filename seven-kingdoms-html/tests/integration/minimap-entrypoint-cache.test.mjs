import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
const game=readFileSync(new URL('../../game.js',import.meta.url),'utf8');
test('deployed JS entrypoint cache is newer than the minimap input integration',()=>{
 const match=html.match(/<script type="module" src="game\.js\?v=(\d+)"\s*>/);
 assert.ok(match,'versioned game.js module entrypoint is present');
 assert.ok(Number(match[1])>=16,'new minimap UI must not serve the pre-drag cached module');
 assert.match(game,/installMinimapNavigation/,'entrypoint actually wires minimap controls');
});
