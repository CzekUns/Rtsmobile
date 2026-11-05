import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {decodeImportedBitmap,decodeStandardPalette,indexedToRgba,encodePng,mirrorForDirection} from '../../tools/assets/pixel-codec.mjs';
import {decodeTable} from '../../tools/assets/decode.mjs';

const original=bytes=>{
 const b=Buffer.alloc(4+4+bytes.length);b.writeUInt32LE(4+bytes.length,0);b.writeUInt16LE(4,4);b.writeUInt16LE(2,6);
 Buffer.from(bytes).copy(b,8);return b;
};
test('original 7KAA RLE: literal pixels, short skip and extended transparency runs',()=>{
 // 4x2 pixel image: literal 12, 3 transparent, literal 34, 3 transparent.
 const b=decodeImportedBitmap(original([12,0xfd,34,0xf8,3]));
 assert.equal(b.width,4);assert.equal(b.height,2);
 assert.deepEqual([...b.pixels],[12,255,255,255,34,255,255,255]);
 assert.equal(b.opaque,2);assert.equal(b.transparent,6);
 assert.equal(b.recordLength,9);
});
test('RLE rejects truncated and overshooting runs, wrong record extent and bad dimensions',()=>{
 assert.throws(()=>decodeImportedBitmap(original([0xf8])),/Truncated/);
 assert.throws(()=>decodeImportedBitmap(original([0xf8,9])),/run length/);
 const b=original([12,0xfd,34,0xf8,3]);
 b.writeUInt32LE(20,0);assert.throws(()=>decodeImportedBitmap(b),/Truncated/);
 b.writeUInt32LE(9,0);b.writeUInt16LE(0,4);assert.throws(()=>decodeImportedBitmap(b),/dimensions/);
});
test('palette is exactly 8-byte resource header and 256 RGB triples',()=>{
 const b=Buffer.alloc(776);b[8+12*3]=120;b[8+12*3+1]=80;b[8+12*3+2]=40;
 const palette=decodeStandardPalette(b),decoded=decodeImportedBitmap(original([12,0xfd,34,0xf8,3]));
 const rgba=indexedToRgba(decoded,palette);
 assert.deepEqual([...rgba.subarray(0,8)],[120,80,40,255,0,0,0,0]);
 assert.throws(()=>decodeStandardPalette(b.subarray(1)),/length/);
});
test('mirror is horizontal within bitmap bounds only for source-engine directions',()=>{
 assert.equal(mirrorForDirection(4,8),false);
 assert.equal(mirrorForDirection(5,8),true);
 assert.equal(mirrorForDirection(7,8),true);
 assert.equal(mirrorForDirection(4,16),true);
 assert.equal(mirrorForDirection(3,24),false);
 const pal=Buffer.alloc(768);pal[12*3]=120;pal[34*3]=200;
 const bmp=decodeImportedBitmap(original([12,0xfd,34,0xf8,3]));
 const mirrored=indexedToRgba(bmp,pal,{mirror:true});
 assert.equal(mirrored[(0*4+3)*4],120);
 assert.equal(mirrored[(1*4+3)*4],200);
});
test('nation remap requires explicit source table; no blanket tint or transparent opcode remap',()=>{
 const pal=Buffer.alloc(768),bmp=decodeImportedBitmap(original([12,0xfd,34,0xf8,3]));
 const remap=Uint8Array.from({length:256},(_,i)=>i);remap[12]=34;
 pal[34*3]=123;
 assert.equal(indexedToRgba(bmp,pal,{remap})[0],123);
 remap[255]=0;assert.throws(()=>indexedToRgba(bmp,pal,{remap}),/transparency opcodes/);
});
test('RGBA PNG is genuine and decompresses to row-filter-0 pixels',()=>{
 const pal=Buffer.alloc(768);pal[12*3]=3;
 const bmp=decodeImportedBitmap(original([12,0xfd,34,0xf8,3])),rgba=indexedToRgba(bmp,pal);
 const png=encodePng(bmp.width,bmp.height,rgba);
 assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(png.readUInt32BE(16),4);assert.equal(png.readUInt32BE(20),2);
 const len=png.readUInt32BE(33),data=png.subarray(41,41+len),unpacked=inflateSync(data);
 assert.equal(unpacked.length,2*(1+4*4));
 assert.deepEqual([...unpacked.subarray(0,6)],[0,3,0,0,255,0]);
});
test('real STD.SET conventions: one trailing separator and text SFRAME direction',()=>{
 const schema=40,record=Buffer.alloc(schema+1,32),fields=[
 ['NORMAN',8],['M',2],['N',2],['1',2],['-4',4],['-17',4],['35',3],['46',3],['NO-M5-1',8]
 ];let p=0;for(const [value,width] of fields){record.write(value,p,'latin1');p+=width}
 record.writeUInt32LE(23641,36);record[40]=32;
 const dbf=Buffer.alloc(13+record.length);dbf.writeUInt32LE(1,4);dbf.writeUInt16LE(12,8);dbf.writeUInt16LE(record.length,10);record.copy(dbf,13);
 const frame=decodeTable('SFRAME',dbf)[0];
 assert.equal(frame.direction,'N');assert.equal(frame.bitmapOffset,23641);assert.equal(frame.width,35);
 record[40]=0;record.copy(dbf,13);assert.throws(()=>decodeTable('SFRAME',dbf),/trailer/);
});
