import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHINESE_BASE,drawChineseBase} from '../playtest/chinese-base.js';

// Guard the integration seam: source-backed art must remain opt-in and
// the existing procedural fallback must be reachable until PNGs are shipped.
test('WorldView only opts into Chinese art with explicit loaded image map',()=>{
 const view=readFileSync(new URL('../view.js',import.meta.url),'utf8');
 assert.match(view,/chineseBaseImages=null/);
 assert.match(view,/previewOriginalSprites\s*\?\s*chineseBaseImages\s*:\s*null/);
 assert.match(view,/drawChineseBase\s*\(\s*ctx\s*,\s*firm\s*,\s*p\.x\s*,\s*p\.y\s*,\s*t\s*,\s*this\.chineseBaseImages\s*\)/);
 assert.match(view,/if\\(!originalFirm\\)/);
});
test('Chinese preview never draws when images are absent or foreign culture selected',()=>{
 let calls=0;
 const ctx={save(){},restore(){},drawImage(){calls++}};
 const firm={kind:'fort',raceId:'CHINESE',size:3};
 assert.equal(drawChineseBase(ctx,firm,0,0,24,new Map()),false);
 const file=CHINESE_BASE.modes[3].file;
 const image={complete:true,naturalWidth:147,naturalHeight:139};
 const map=new Map([[file,image]]);
 assert.equal(drawChineseBase(ctx,{...firm,raceId:'NORMAN'},0,0,24,map),false);
 assert.equal(drawChineseBase(ctx,firm,0,0,24,map),true);
 assert.equal(calls,1);
});
