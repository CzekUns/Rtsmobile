import test from 'node:test';
import assert from 'node:assert/strict';
import {packageMetadata,decodeLz4Block,unpackData,checksum} from '../../tools/assets/emscripten-lz4.mjs';
test('literal-only LZ4 block decodes without guessed pixels',()=>{
 const src=Buffer.from([0x50,65,66,67,68,69]);
 assert.equal(decodeLz4Block(src,5).toString(),'ABCDE');
 assert.throws(()=>decodeLz4Block(src,6),/length mismatch/);
});
test('LZ4 matches support overlapping source/destination',()=>{
 // "A" literal followed by 5-byte match at distance 1
 const src=Buffer.from([0x10,65,1,0]);
 assert.equal(decodeLz4Block(src,5).toString(),'AAAAA');
 assert.throws(()=>decodeLz4Block(Buffer.from([0x00,0,0]),4),/pointer/);
});
test('metadata parser reads only JSON, no execution of supplied script',()=>{
 const js='var compressedData = '+JSON.stringify({offsets:[0,6],sizes:[6],successes:[1]})+';\nloadPackage('+JSON.stringify({files:[{filename:'/data/SPRITE/EXAMPLE.SPR',start:0,end:5}],remote_package_size:6})+');';
 const meta=packageMetadata(js);
 const files=unpackData(Buffer.from([0x50,65,66,67,68,69]),meta);
 assert.equal(files[0].bytes.toString(),'ABCDE');
 assert.equal(files[0].sha256,checksum(Buffer.from('ABCDE')));
 assert.throws(()=>unpackData(Buffer.from('no'),meta),/size mismatch/);
});
test('uncompressed blocks are checked and not transformed',()=>{
 const js='var compressedData = '+JSON.stringify({offsets:[0,3],sizes:[3],successes:[0]})+';\nloadPackage('+JSON.stringify({files:[{filename:'/data/X',start:0,end:3}],remote_package_size:3})+');';
 assert.equal(unpackData(Buffer.from('abc'),packageMetadata(js))[0].bytes.toString(),'abc');
});
