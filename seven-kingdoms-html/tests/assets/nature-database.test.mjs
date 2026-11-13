import test from 'node:test';
import assert from 'node:assert/strict';
import {RECORD_SIZES,parseNatureRecord,parseNatureDatabase} from '../../tools/assets/nature-database.mjs';
const row=(kind,fields)=>{const b=Buffer.alloc(RECORD_SIZES[kind],32);for(const [offset,value] of fields){if(typeof value==='number')b.writeUInt32LE(value,offset);else b.write(value,offset,'ascii')}return b};
test('packed plant/rock sizes match pinned C++ struct definitions',()=>assert.deepEqual(RECORD_SIZES,{PLANT:21,PLANTBM:29,ROCK:18,ROCKBLK:17,ROCKBMP:23,ROCKANI:14}));
test('plant bitmap preserves signed anchors and little-endian pointer',()=>{const r=parseNatureRecord('PLANTBM',row('PLANTBM',[[0,'OAK'],[8,'02'],[10,'-04'],[13,'012'],[16,'2'],[17,'OAK1'],[25,0x13668]]));assert.equal(r.offsetX,-4);assert.equal(r.bitmapOffset,0x13668);assert.equal(r.townAge,'2')});
test('rock bitmap record retains original frame and offset',()=>{const r=parseNatureRecord('ROCKBMP',row('ROCKBMP',[[0,'STONE'],[5,'00'],[7,'01'],[9,'02'],[11,'ROCK001'],[19,4096]]));assert.equal(r.frame,2);assert.equal(r.bitmapOffset,4096)});
test('DBF framing rejects truncated or deleted records',()=>{const b=Buffer.alloc(33+22);b[0]=3;b.writeUInt32LE(1,4);b.writeUInt16LE(33,8);b.writeUInt16LE(22,10);b[32]=13;b[33]=42;assert.throws(()=>parseNatureDatabase('PLANT',b),/deleted/);b[33]=32;assert.equal(parseNatureDatabase('PLANT',b).count,1);b.writeUInt32LE(2,4);assert.throws(()=>parseNatureDatabase('PLANT',b),/framing/)});
test('unknown and truncated record rejected',()=>{assert.throws(()=>parseNatureRecord('TREE',new Uint8Array(3)),/length/);assert.throws(()=>parseNatureRecord('ROCK',new Uint8Array(17)),/length/)});
