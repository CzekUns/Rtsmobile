import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTerrainDatabase} from '../../tools/assets/terrain-database.mjs';
// Unmodified 27-byte dBASE rows from 7KAA TERRAIN1.RES at upstream
// 14e6fdfba9481af4dc3a54722614a608776e20bc:
// row 1 at byte 385; coast row 412 at byte 11482.
const rows=[
  '20442a442a442a464220204644323846442d3032382020683c0400',
  '20472a472a472a534220205347323853472d303238202068360100'
];
const fields=[['NW_TYPE','C',2],['NE_TYPE','C',2],['SW_TYPE','C',2],['SE_TYPE','C',2],
 ['EXTRA','C',1],['SPECIAL','C',1],['REP_TYPE','C',1],['SEC_TYPE','C',1],
 ['PATTERN_ID','N',2],['FILENAME','C',8],['BITMAPPTR','C',4]];
function db(){
  const bytes=new Uint8Array(385+27*rows.length+1);
  const v=new DataView(bytes.buffer);bytes[0]=3;v.setUint32(4,rows.length,true);
  v.setUint16(8,385,true);v.setUint16(10,27,true);
  fields.forEach(([name,type,length],i)=>{
    const p=32+i*32;bytes.set(new TextEncoder().encode(name),p);
    bytes[p+11]=type.charCodeAt(0);bytes[p+16]=length;
  });
  bytes[384]=13;bytes[bytes.length-1]=26;
  rows.forEach((hex,i)=>bytes.set(Uint8Array.from(hex.match(/../g),h=>parseInt(h,16)),385+i*27));
  return bytes;
}
test('real 7KAA dBASE rows decode with deletion marker and correct coast flag',()=>{
  const result=parseTerrainDatabase(db());
  assert.equal(result.recordCount,2);assert.equal(result.recordLength,27);
  assert.equal(result.records[0].fileName,'FD-028');
  assert.equal(result.records[0].isCoast,false);
  assert.equal(result.records[1].isCoast,true);
  assert.equal(result.records[1].fileName,'SG-028');
  assert.equal(result.records[1].bitmapOffset,0x13668);
  assert.equal(result.records[1].corners.se.code,'SB');
});
test('rejects changed field layout, deleted rows and truncated resource',()=>{
  const badSchema=db();badSchema[32]=88;
  assert.throws(()=>parseTerrainDatabase(badSchema),/schema/);
  const deleted=db();deleted[385]=42;
  assert.throws(()=>parseTerrainDatabase(deleted),/deleted/);
  assert.throws(()=>parseTerrainDatabase(db().subarray(0,400)),/truncated/);
});
