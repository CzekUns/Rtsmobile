import test from 'node:test';
import assert from 'node:assert/strict';
import {linkRockResources} from '../../tools/assets/rock-bitmap.mjs';

const enc=new TextEncoder();
function dbf(records){
 const size=records[0].length, header=33, stride=size+1;
 const bytes=new Uint8Array(header+stride*records.length+1);
 const v=new DataView(bytes.buffer);bytes[0]=3;v.setUint32(4,records.length,true);
 v.setUint16(8,header,true);v.setUint16(10,stride,true);bytes[header-1]=13;
 records.forEach((rec,i)=>{const at=header+i*stride;bytes[at]=32;bytes.set(rec,at+1);});
 bytes[bytes.length-1]=26;return bytes;
}
const txt=(s,n)=>enc.encode(String(s).padEnd(n,' ').slice(0,n));
const cat=(...parts)=>{const b=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){b.set(p,at);at+=p.length;}return b;};
const ptr=n=>{const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n,true);return b;};
function fixture(){
 const bitmap=cat(ptr(5),new Uint8Array([1,0,1,0,3]));
 return {
  rockDb:dbf([cat(txt('STONE',5),txt('R',1),txt('01',2),txt('01',2),txt('S',1),txt('G',1),txt('0000',4),txt('01',2))]),
  blockDb:dbf([cat(txt('STONE',5),txt('00',2),txt('00',2),txt('0001',4),txt('0001',4))]),
  bitmapDb:dbf([cat(txt('STONE',5),txt('00',2),txt('00',2),txt('01',2),txt('ROCK',8),ptr(0))]),
  animDb:dbf([cat(txt('STONE',5),txt('01',2),txt('099',3),txt('01',2),txt('00',2))]),
  bitmapArchive:bitmap
 };
}
test('ROCK source recnos resolve 1-based block, frame and original indexed pixel',()=>{
 const result=linkRockResources(fixture());
 assert.equal(result.rocks.length,1);
 assert.equal(result.rocks[0].blocks[0].frames[0].bitmap.pixels[0],3);
 assert.equal(result.rocks[0].maxFrame,1);
});
test('reject mismatched block owner',()=>{
 const f=fixture();f.blockDb=dbf([cat(txt('WRONG',5),txt('00',2),txt('00',2),txt('0001',4),txt('0001',4))]);
 assert.throws(()=>linkRockResources(f),/owner mismatch/);
});
test('reject out of bounds block and missing frame',()=>{
 const f=fixture();f.blockDb=dbf([cat(txt('STONE',5),txt('01',2),txt('00',2),txt('0001',4),txt('0001',4))]);
 assert.throws(()=>linkRockResources(f),/outside footprint/);
 const g=fixture();g.bitmapDb=dbf([cat(txt('STONE',5),txt('00',2),txt('00',2),txt('02',2),txt('ROCK',8),ptr(0))]);
 assert.throws(()=>linkRockResources(g),/frame mismatch/);
});
test('reject malformed imported bitmap offset',()=>{
 const f=fixture();f.bitmapDb=dbf([cat(txt('STONE',5),txt('00',2),txt('00',2),txt('01',2),txt('ROCK',8),ptr(9999))]);
 assert.throws(()=>linkRockResources(f),/offset outside archive/);
});
