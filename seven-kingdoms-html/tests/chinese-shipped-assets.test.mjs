import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHINESE_BASE,validateChineseBaseAssets,drawChineseBase} from '../playtest/chinese-base.js';

const root=new URL('../assets/original/chinese-base/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('firm.json',root),'utf8'));
const expected=new Set(CHINESE_BASE.modes.map(mode=>mode.file));

test('shipped Chinese BASE GPL manifest and all five original PNGs agree',()=>{
 assert.equal(manifest.license.status,'upstream-gpl-release');
 assert.equal(manifest.source.repository,CHINESE_BASE.source.repository);
 assert.equal(manifest.source.originalFilePaths.bitmap,CHINESE_BASE.source.files[1]);
 assert.equal(validateChineseBaseAssets(manifest,expected),true);
 for(const mode of CHINESE_BASE.modes){
  const bytes=readFileSync(new URL(mode.file,root));
  assert.ok(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),mode.file+' PNG signature');
  assert.equal(bytes.toString('ascii',12,16),'IHDR',mode.file+' IHDR');
  assert.equal(bytes.readUInt32BE(16),CHINESE_BASE.bounds.width,mode.file+' width');
  assert.equal(bytes.readUInt32BE(20),CHINESE_BASE.bounds.height,mode.file+' height');
  assert.ok(bytes.length>100,mode.file+' not empty');
 }
});

test('all shipped Chinese modes draw at 1x/2x and invalid foreign culture falls back',()=>{
 for(const mode of CHINESE_BASE.modes){
  for(const zoom of [1,2]){
   const calls=[];
   const ctx={save(){},restore(){},drawImage(...args){calls.push(args)}};
   const image={complete:true,naturalWidth:147,naturalHeight:139};
   const images=new Map([[mode.file,image]]);
   const firm={kind:'fort',raceId:'CHINESE',size:4,
    underConstruction:mode.kind==='construction',
    buildProgress:mode.kind==='construction'?(mode.phase+0.1)/3:1,
    active:mode.kind!=='idle'};
   assert.equal(drawChineseBase(ctx,firm,50,80,24*zoom,images),true,mode.file+' '+zoom+'x');
   assert.equal(calls.length,1);
   assert.equal(calls[0][3],147*zoom);
   assert.equal(calls[0][4],139*zoom);
   assert.equal(drawChineseBase(ctx,{...firm,raceId:'NORMAN'},50,80,24*zoom,images),false);
   assert.equal(calls.length,1);
  }
 }
});
