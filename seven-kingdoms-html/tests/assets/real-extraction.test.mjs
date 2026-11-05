import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {decodeImportedBitmap,indexedToRgba,nationRemapTable} from '../../tools/assets/pixel-codec.mjs';
import {selectedBuild,renderFirm} from '../../tools/assets/render-firm.mjs';
import {renderUnit} from '../../tools/assets/render-unit.mjs';

test('nation colors remap only the 8 original shade indices, never the whole building',()=>{
 const independent=nationRemapTable(0),red=nationRemapTable(1),blue=nationRemapTable(2);
 assert.deepEqual([...red.subarray(0xe0,0xe8)],[0xa0,0xa1,0xa2,0xa3,0xc0,0xc1,0xc2,0xc3]);
 assert.deepEqual([...blue.subarray(0xe0,0xe8)],[0xa4,0xa5,0xa6,0xa7,0xc4,0xc5,0xc6,0xc7]);
 assert.deepEqual([...independent.subarray(0xe0,0xe8)],[0xbc,0xbd,0xbe,0xbf,0xdc,0xdd,0xde,0xdf]);
 for(let i=0;i<256;i++)if((i<0xe0||i>=0xe8)&&i!==0xf2&&i!==0xf3)
  assert.equal(red[i],i,'non-faction index '+i+' must stay untouched');
 assert.equal(red[0xf2],255);assert.equal(red[0xf3],0);
 assert.equal(nationRemapTable(1,{selected:true})[0xf2],0xef);
 assert.throws(()=>nationRemapTable(8),/0..7/);
});
test('original transparent selected outlines become alpha 0 or selection pixel',()=>{
 const bitmap=decodeImportedBitmap(Buffer.from([
  8,0,0,0,2,0,2,0, 0xf2,0xf3,0xe0,0xe4
 ]));
 const pal=Buffer.alloc(768);pal[0xef*3]=66;pal[0xa0*3]=77;pal[0xc0*3]=88;
 const red=nationRemapTable(1),plain=indexedToRgba(bitmap,pal,{remap:red});
 assert.equal(plain[3],0);assert.equal(plain[7],255);
 assert.equal(plain[8],77);assert.equal(plain[12],88);
 const selected=indexedToRgba(bitmap,pal,{remap:nationRemapTable(1,{selected:true})});
 assert.equal(selected[0],66);assert.equal(selected[4],66);
});
test('FBUILD resolves construction, layered ground, and animation through original one-based records',()=>{
 const tables={FBUILD:[{recordNo:1,firmCode:'BASE',raceCode:'NORMAN',firstFrame:1,frameCount:1,
   constructionFirst:1,constructionCount:3,groundBitmap:5,idleBitmap:0}],
  FFRAME:[{recordNo:1,firmCode:'BASE',raceCode:'NORMAN',frameId:1,
   firstBitmap:4,bitmapCount:1,delay:0}],
  FBITMAP:Array.from({length:5},(_,i)=>({recordNo:i+1,firmCode:'BASE',raceCode:'NORMAN',layer:i===4?4:1}))};
 const sel=selectedBuild(tables);
 assert.deepEqual(sel.stages.map(x=>x.recordNo),[1,2,3]);
 assert.deepEqual(sel.main.map(x=>x.recordNo),[4]);
 assert.equal(sel.idle.recordNo,4);assert.equal(sel.ground.recordNo,5);
 assert.equal(sel.frames.length,1);
});
const upstream=process.env.SKH_7KAA_SOURCE;
test('REAL 7KAA NORMAN: all 48 source movement frames decode to PNG + 8 true idle fallbacks', {skip:!upstream},async()=>{
 const out=await mkdtemp(join(tmpdir(),'7kaa-unit-'));
 try{
  const m=await renderUnit(upstream,out,'NORMAN');
  assert.equal(m.actions.filter(x=>x.action==='M').length,8);
  assert.deepEqual(m.actions.filter(x=>x.action==='M').map(x=>x.declaredFrames),Array(8).fill(6));
  assert.deepEqual(m.actions.filter(x=>x.action==='M').map(x=>x.distinctPixelFrames),Array(8).fill(5));
  assert.equal(m.frames.filter(x=>x.action==='M').length,48);
  assert.equal(m.frames.filter(x=>x.action==='S').length,8);
  assert.equal(m.frames.filter(x=>x.action==='M'&&x.duplicateOf!==undefined).length,8);
  assert.equal(m.frames.every(x=>x.decoded&&!x.visuallyVerified),true);
  assert.deepEqual([...((await readFile(join(out,'NORMAN-M-1x.png'))).subarray(0,8))],[137,80,78,71,13,10,26,10]);
 }finally{await rm(out,{recursive:true,force:true})}
});
test('REAL 7KAA BASE:NORMAN: 3 construction stages, finished firm and ground layer decoded',{skip:!upstream},async()=>{
 const out=await mkdtemp(join(tmpdir(),'7kaa-firm-'));
 try{
  const m=await renderFirm(upstream,out,{firmCode:'BASE',raceCode:'NORMAN',colorSchemeId:1});
  assert.equal(m.locWidth,4);assert.equal(m.locHeight,4);
  assert.equal(m.bitmaps.length,5);
  assert.deepEqual(m.modes.filter(x=>x.mode==='construction').map(x=>x.sourceBitmapRecords),
   [[1],[2],[5,3]]);
  assert.deepEqual(m.modes.find(x=>x.mode==='active').sourceBitmapRecords,[5,4]);
  assert.equal(m.bitmaps.find(x=>x.recordNo===5).layer,4);
  assert.equal(m.decoded,true);assert.equal(m.visuallyVerified,false);
  const png=await readFile(join(out,'BASE-NORMAN-active-0.png'));
  assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 }finally{await rm(out,{recursive:true,force:true})}
});
