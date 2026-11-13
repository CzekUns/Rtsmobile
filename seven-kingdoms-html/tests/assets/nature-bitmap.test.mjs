import test from 'node:test';
import assert from 'node:assert/strict';
import {readPlantBitmap,linkPlantResources} from '../../tools/assets/nature-bitmap.mjs';
import {RECORD_SIZES} from '../../tools/assets/nature-database.mjs';

const enc = new TextEncoder();
function dbf(kind, record) {
 const stride=RECORD_SIZES[kind]+1, header=33, out=new Uint8Array(header+stride);
 out[0]=3; const v=new DataView(out.buffer);v.setUint32(4,1,true);v.setUint16(8,header,true);v.setUint16(10,stride,true);
 out[header-1]=13;out[header]=32;out.set(record,header+1);return out;
}
function field(row,at,size,value){const b=enc.encode(String(value).padEnd(size,' '));assert.equal(b.length,size);row.set(b,at);}
function plant(){const b=new Uint8Array(21);field(b,0,8,'TREE');field(b,8,1,'2');for(const at of [9,11,13])field(b,at,2,'  ');field(b,15,3,'001');field(b,18,3,'000');return dbf('PLANT',b);}
function plantbm(code='TREE',offset=0){const b=new Uint8Array(29);field(b,0,8,code);field(b,8,2,'01');field(b,10,3,'000');field(b,13,3,'000');field(b,16,1,'1');field(b,17,8,'TREE');new DataView(b.buffer).setUint32(25,offset,true);return dbf('PLANTBM',b);}
test('original bitmap framing: 16-bit LE dimensions, indexed pixels and byte offset',()=>{
 const a=Uint8Array.from([99,2,0,1,0,7,8,88]);
 const b=readPlantBitmap(a,1);assert.equal(b.width,2);assert.equal(b.height,1);assert.deepEqual([...b.pixels],[7,8]);
});
test('rejects invalid bitmap dimensions, truncation and offset',()=>{
 assert.throws(()=>readPlantBitmap(Uint8Array.from([2,0,2,0,1]),0),/truncated/);
 assert.throws(()=>readPlantBitmap(Uint8Array.from([0,0,1,0]),0),/dimensions/);
 assert.throws(()=>readPlantBitmap(new Uint8Array(4),5),/offset/);
});
test('links original PLANT bitmap recno (1-based) and bitmap payload',()=>{
 const out=linkPlantResources(plant(),plantbm(),Uint8Array.from([1,0,1,0,42]));
 assert.equal(out.plants[0].code,'TREE');assert.deepEqual([...out.bitmaps[0].bitmap.pixels],[42]);
});
test('rejects mismatched plant code and out-of-range bitmap reference',()=>{
 assert.throws(()=>linkPlantResources(plant(),plantbm('ROCK'),Uint8Array.from([1,0,1,0,42])),/mismatch/);
 const p=plant();p[33+1+15]=48;p[33+1+16]=48;p[33+1+17]=50;
 assert.throws(()=>linkPlantResources(p,plantbm(),Uint8Array.from([1,0,1,0,42])),/out of range/);
});
