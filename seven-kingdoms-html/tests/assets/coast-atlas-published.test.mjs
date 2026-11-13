import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {validateCoastManifest} from '../../tools/assets/coast-manifest.mjs';
import {makeCoastAtlas} from '../../tools/assets/render-coast.mjs';
const assetPath=new URL('../../assets/previews/TERRAIN1-SG-coast-16x12.png',import.meta.url);
const jsonPath=new URL('../../assets/manifests/TERRAIN1-SG-coast-16x12.json',import.meta.url);
const manifest=JSON.parse(readFileSync(jsonPath,'utf8'));
const png=readFileSync(assetPath);
function pngParts(file){
 assert.deepEqual([...file.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 const parts=new Map();
 for(let off=8;off<file.length;){
  const length=file.readUInt32BE(off),name=file.toString('ascii',off+4,off+8);
  const end=off+12+length;assert.ok(end<=file.length,'truncated PNG chunk '+name);
  const bytes=file.subarray(off+8,off+8+length);
  if(parts.has(name))parts.set(name,Buffer.concat([parts.get(name),bytes]));else parts.set(name,bytes);
  off=end;
  if(name==='IEND')break;
 }
 return parts;
}
test('published coast atlas authentic SG database metadata and source provenance',()=>{
 assert.equal(manifest.count,180);
 assert.equal(manifest.source.commit,'14e6fdfba9481af4dc3a54722614a608776e20bc');
 assert.deepEqual(manifest.source.files.map(x=>x.sha256),[
  '67b445d86916393c00e3b88466b7fa354701ef33b1c372e06fc463e0ba8a613a',
  '791745a1bbaed1eeb3582725cf05f90918fd0733682b32eec697b6e297f45774',
  '8bda65c749340446edb6debe73a5b0f67b1a4af8dd0fdb1fa0222a69848b6ef7'
 ]);
 assert.equal(validateCoastManifest(manifest).ok,true);
 assert.equal(new Set(manifest.records.map(r=>r.id)).size,180);
 assert.deepEqual(manifest.records.map(r=>r.atlasIndex),Array.from({length:180},(_,i)=>i));
 const first=manifest.records[0];
 assert.deepEqual([first.id,first.offset,first.fileName,first.length],[412,0x13668,'SG-028',1032]);
 assert.deepEqual(first.cornerCodes,['G*','G*','G*','SB']);
});
test('published indexed PNG has authentic SG-028 source pixels, original palette and exact atlas grid',()=>{
 const chunks=pngParts(png),header=chunks.get('IHDR');
 assert.deepEqual([header.readUInt32BE(0),header.readUInt32BE(4),header[8],header[9]],[512,384,8,3]);
 assert.equal(chunks.get('PLTE').length,768);
 const scan=inflateSync(chunks.get('IDAT'));
 assert.equal(scan.length,384*(1+512));
 for(let y=0;y<384;y++)assert.equal(scan[y*513],0,'unexpected indexed PNG filter');
 const first=scan.subarray(1,17);
 assert.deepEqual([...first],[0xb8,0x27,0x69,0xb9,0x28,0x69,0x28,0x69,0x27,0x26,0x28,0x28,0x27,0xb8,0x28,0x69]);
 for(let i=0;i<180;i++){
  const top=Math.floor(i/16)*32,left=(i%16)*32;
  for(let y=0;y<32;y++)assert.ok(scan.subarray((top+y)*513+1+left,(top+y)*513+1+left+32).every(v=>v<248),'unsupported bitmap opcode in '+i);
 }
});
test('coast atlas generator refuses unverified or corrupt original files',()=>{
 assert.throws(()=>makeCoastAtlas(Buffer.alloc(20636),Buffer.alloc(577920),Buffer.alloc(776)),/SHA-256 mismatch/);
});
