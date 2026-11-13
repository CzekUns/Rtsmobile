import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {exportPlantAtlas} from '../../tools/assets/export-plant-atlas.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const enc=new TextEncoder();
function dbf(size,records){
 const header=33,stride=size+1,b=new Uint8Array(header+stride*records.length),v=new DataView(b.buffer);
 b[0]=3;v.setUint32(4,records.length,true);v.setUint16(8,header,true);v.setUint16(10,stride,true);b[header-1]=13;
 records.forEach((r,i)=>{b[header+i*stride]=32;b.set(r,header+i*stride+1)});return b;
}
function put(b,start,length,s){b.set(enc.encode(String(s).padEnd(length,' ')),start);}
function fixture(){
 const p=new Uint8Array(21);put(p,0,8,'TREE');put(p,8,1,'2');put(p,9,2,'  ');put(p,11,2,'  ');put(p,13,2,'  ');put(p,15,3,'001');put(p,18,3,'000');
 const b=new Uint8Array(29);put(b,0,8,'TREE');put(b,8,2,'01');put(b,10,3,'000');put(b,13,3,'000');put(b,16,1,'1');put(b,17,8,'TREE');
 const sources={PLANT1:dbf(21,[p]),PLANTBM1:dbf(29,[b]),I_PLANT1:Uint8Array.from([2,0,1,0,7,8]),PAL_STD:new Uint8Array(768)};
 return {plantDb:sources.PLANT1,bitmapDb:sources.PLANTBM1,bitmapArchive:sources.I_PLANT1,palette:sources.PAL_STD,expectedHashes:Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,hash(v)])),sourceCommit:'14e6fdfba9481af4dc3a54722614a608776e20bc'};
}
test('exports byte-preserving indexed PNG and deterministic manifest from hash-locked fixtures',()=>{
 const f=fixture(),a=exportPlantAtlas(f),b=exportPlantAtlas(f);
 assert.deepEqual(a.png,b.png);assert.deepEqual(a.manifest,b.manifest);
 assert.equal(a.png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(a.manifest.bitmaps[0].width,2);assert.equal(a.manifest.bitmaps[0].height,1);
 assert.equal(a.manifest.transparentIndex,'unverified');
});
test('refuses missing or mismatched provenance, palette and upstream commit',()=>{
 const f=fixture();
 assert.throws(()=>exportPlantAtlas({...f,expectedHashes:{...f.expectedHashes,PLANT1:'0'.repeat(64)}}),/SHA-256/);
 assert.throws(()=>exportPlantAtlas({...f,sourceCommit:'unknown'}),/unpinned/);
 assert.throws(()=>exportPlantAtlas({...f,palette:new Uint8Array(3)}),/SHA-256|palette/);
});
