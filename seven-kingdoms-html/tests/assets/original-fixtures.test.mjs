import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {decodeImportedBitmap,decodeStandardPalette,indexedToRgba,encodePng,nationRemapTable} from '../../tools/assets/pixel-codec.mjs';
const fixture=JSON.parse(await readFile(new URL('./fixtures/original-7kaa-pixels.json',import.meta.url),'utf8'));

test('minimal authentic fixture provenance is pinned to upstream 7kaa commit and content metadata',()=>{
 assert.equal(fixture.origin.repository,'the3dfxdude/7kaa');
 assert.match(fixture.origin.commit,/^[0-9a-f]{40}$/);
 for(const s of fixture.samples){
  assert.match(s.sourceBlobSha,/^[0-9a-f]{40}$/);
  assert.ok(s.originalOffset>0);
  assert.ok(s.originalRecordBytes>0);
 }
});
test('original NORMAN SFRAME:1 RLE reproduces exactly 1610 genuine indexed pixels',()=>{
 const record=Buffer.from(fixture.samples[0].recordBase64,'base64'),s=fixture.samples[0];
 assert.equal(s.record,'SFRAME:1');assert.equal(record.length,1204);
 const pixels=decodeImportedBitmap(record);
 assert.equal(pixels.width,s.expectedWidth);assert.equal(pixels.height,s.expectedHeight);
 assert.equal(pixels.opaque,s.expectedOpaque);assert.equal(pixels.transparent,s.expectedTransparent);
 assert.equal(record.readUInt32LE(0)+4,record.length);
 const palette=decodeStandardPalette(Buffer.from(fixture.palette.rawBase64,'base64'));
 const rgba=indexedToRgba(pixels,palette);
 assert.equal(rgba.filter((_,i)=>i%4===3&&rgba[i]===255).length,1108);
 const png=encodePng(pixels.width,pixels.height,rgba);
 assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.match(createHash('sha256').update(record).digest('hex'),/^[0-9a-f]{64}$/);
});
test('original FBITMAP:1 under construction has true 93x77 silhouette and valid transparent counts',()=>{
 const record=Buffer.from(fixture.samples[1].recordBase64,'base64'),s=fixture.samples[1];
 assert.equal(s.record,'FBITMAP:1');assert.equal(record.length,4667);
 const pixels=decodeImportedBitmap(record);
 assert.equal(pixels.width,93);assert.equal(pixels.height,77);
 assert.equal(pixels.opaque,4479);assert.equal(pixels.transparent,2682);
 const palette=decodeStandardPalette(Buffer.from(fixture.palette.rawBase64,'base64'));
 const natural=indexedToRgba(pixels,palette);
 const scheme1=indexedToRgba(pixels,palette,{remap:nationRemapTable(1)});
 const scheme2=indexedToRgba(pixels,palette,{remap:nationRemapTable(2)});
 let affected=0,ordinary=0;
 for(let i=0;i<pixels.pixels.length;i++){
  const idx=pixels.pixels[i],q=i*4;
  if(idx>=0xe0&&idx<=0xe7){affected++;assert.notDeepEqual([...scheme1.subarray(q,q+3)],[...scheme2.subarray(q,q+3)])}
  else if(idx<0xf2||idx>0xf3){ordinary++;assert.deepEqual([...scheme1.subarray(q,q+4)],[...natural.subarray(q,q+4)])}
 }
 assert.ok(ordinary>0);assert.equal(affected>=0,true);
});
