import test from 'node:test';
import assert from 'node:assert/strict';
import {CHINESE_BASE,chineseBaseMode,validateChineseBaseAssets,drawChineseBase} from '../playtest/chinese-base.js';

test('Chinese BASE phase and provenance are source-backed',()=>{
 assert.equal(CHINESE_BASE.footprint.width,4);
 assert.equal(CHINESE_BASE.modes.length,5);
 assert.deepEqual(CHINESE_BASE.modes[2].records,[30,28]);
 assert.deepEqual(CHINESE_BASE.modes[3].records,[30,29]);
 assert.equal(chineseBaseMode({underConstruction:true,buildProgress:0}).phase,0);
 assert.equal(chineseBaseMode({underConstruction:true,buildProgress:0.5}).phase,1);
 assert.equal(chineseBaseMode({underConstruction:true,buildProgress:0.99}).phase,2);
 assert.equal(chineseBaseMode({active:false}).kind,'idle');
});
test('manifest must match source hashes, ordered phases and every PNG',()=>{
 const modes=CHINESE_BASE.modes.map(m=>({path:m.file,sourceBitmapRecords:m.records}));
 const manifest={id:'BASE:CHINESE',locWidth:4,locHeight:4,
  source:{sha256:{tables:CHINESE_BASE.source.sha256[0],bitmap:CHINESE_BASE.source.sha256[1],palette:CHINESE_BASE.source.sha256[2]}},modes};
 const files=new Set(modes.map(m=>m.path));
 assert.equal(validateChineseBaseAssets(manifest,files),true);
 assert.equal(validateChineseBaseAssets(manifest,new Set()),false);
 assert.equal(validateChineseBaseAssets({...manifest,id:'BASE:NORMAN'},files),false);
 assert.equal(validateChineseBaseAssets({...manifest,modes:[...modes].reverse()},files),false);
});
test('Chinese renderer uses verified 147x139 frame and never changes collision',()=>{
 const mode=chineseBaseMode({});
 const image={complete:true,naturalWidth:147,naturalHeight:139};
 const images=new Map([[mode.file,image]]);
 const draws=[];
 const ctx={save(){},restore(){},drawImage(...args){draws.push(args)}};
 const firm={kind:'fort',raceId:'chinese',size:3};
 assert.equal(drawChineseBase(ctx,firm,10,20,24,images),true);
 assert.equal(draws.length,1);
 assert.equal(draws[0][0],image);
 assert.equal(draws[0][3],147*0.75);
 assert.equal(draws[0][4],139*0.75);
 assert.equal(firm.size,3);
 assert.equal(drawChineseBase(ctx,{...firm,raceId:'norman'},10,20,24,images),false);
 assert.equal(drawChineseBase(ctx,firm,10,20,24,new Map()),false);
 assert.equal(drawChineseBase(ctx,firm,10,20,0,images),false);
 assert.equal(draws.length,1);
});
