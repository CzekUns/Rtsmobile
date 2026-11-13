import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {encodeIndexedPng} from '../../tools/assets/indexed-png.mjs';
test('indexed coast PNG encoder produces valid 8-bit palette scanlines',()=>{
 const pixels=Uint8Array.from([1,2,3,4]),palette=Uint8Array.from({length:768},(_,i)=>i%256);
 const png=encodeIndexedPng(2,2,pixels,palette);
 assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(png.readUInt32BE(16),2);assert.equal(png.readUInt32BE(20),2);
 const pos=8+25+12+768,len=png.readUInt32BE(pos);
 assert.equal(png.toString('ascii',pos+4,pos+8),'IDAT');
 const scan=inflateSync(png.subarray(pos+8,pos+8+len));
 assert.deepEqual([...scan],[0,1,2,0,3,4]);
});
test('indexed PNG rejects invalid dimensions and palette',()=>{
 assert.throws(()=>encodeIndexedPng(0,1,Uint8Array.of(0),new Uint8Array(768)),/size/);
 assert.throws(()=>encodeIndexedPng(1,1,Uint8Array.of(0),new Uint8Array(10)),/palette/);
});
