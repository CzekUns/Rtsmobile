import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../../',import.meta.url);
const html=readFileSync(new URL('index.html',root),'utf8');
const css=readFileSync(new URL('style.css',root),'utf8');
test('minimap display retains native canvas aspect ratio',()=>{
 const canvas=html.match(/<canvas id="minimap" width="(\d+)" height="(\d+)"/);
 assert.ok(canvas,'minimap native dimensions');
 const nativeRatio=Number(canvas[1])/Number(canvas[2]);
 const rule=css.match(/#minimap\s*\{([^}]+)\}/)?.[1];
 assert.ok(rule,'minimap CSS rule');
 assert.match(rule,/height\s*:\s*auto\s*;/,'avoid independent fixed CSS height');
 const ratio=rule.match(/aspect-ratio\s*:\s*(\d+)\s*\/\s*(\d+)/);
 assert.ok(ratio,'explicit aspect ratio');
 assert.equal(Number(ratio[1])/Number(ratio[2]),nativeRatio);
});
test('minimap remains interactive with existing pointer handling',()=>{
 assert.match(css,/#minimap\s*\{[^}]*cursor\s*:\s*crosshair/);
 assert.match(html,/id="minimap"/);
});
