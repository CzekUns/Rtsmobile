import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPlantRecords} from '../../tools/assets/inspect-plant-compression.mjs';

function dbf(offset=0){
  const b=new Uint8Array(33+30);
  b[0]=3;
  const h=new DataView(b.buffer);
  h.setUint32(4,1,true);h.setUint16(8,33,true);h.setUint16(10,30,true);
  b[32]=13;b[33]=32;
  const row=b.subarray(34);
  row.fill(32);
  row.set(Buffer.from('TREE    '),0);
  row.set(Buffer.from('01'),8);
  row.set(Buffer.from('000'),10);
  row.set(Buffer.from('000'),13);
  row.set(Buffer.from('0'),16);
  row.set(Buffer.from('TREE0001'),17);
  new DataView(row.buffer,row.byteOffset+25,4).setUint32(0,offset,true);
  return b;
}
test('PLANT compressed diagnostic retains exact bytes and does not pretend to decode',()=>{
  const archive=Uint8Array.of(7,0,0,0,2,0,2,0,0xf8,0x04,0x11);
  const report=inspectPlantRecords(dbf(),archive);
  assert.equal(report.recordCount,1);
  assert.equal(report.samples[0].encodedBytes,3);
  assert.equal(report.samples[0].decodedPixels,4);
  assert.equal(report.samples[0].first32Hex,'f80411');
  assert.equal(report.samples[0].topBytes.length,3);
  assert.equal(report.codec,'unverified');
  assert.match(report.archiveSha256,/^[0-9a-f]{64}$/);
});
test('PLANT diagnostics reject invalid offsets and truncated records',()=>{
  assert.throws(()=>inspectPlantRecords(dbf(100),new Uint8Array(12)),/offset out of range/);
  assert.throws(()=>inspectPlantRecords(dbf(),Uint8Array.of(50,0,0,0,2,0,2,0,1,2)),/invalid compressed bitmap record/);
});
test('PLANT diagnostic output is bounded',()=>{
  assert.throws(()=>inspectPlantRecords(dbf(),new Uint8Array(12),{limit:101}),/invalid diagnostic input/);
});
