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
 const sources={PLANT1:dbf(21,[p]),PLANTBM1:dbf(29,[b]),I_PLANT1:Uint8Array.from([6,0,0,0,2,0,1,0,7,8]),PAL_STD:new Uint8Array(768)};
 return {plantDb:sources.PLANT1,bitmapDb:sources.PLANTBM1,bitmapArchive:sources.I_PLANT1,palette:sources.PAL_STD,expectedHashes:Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,hash(v)])),sourceCommit:'14e6fdfba9481af4dc3a54722614a608776e20bc'};
}
test('exports byte-preserving indexed PNG and deterministic manifest from hash-locked fixtures',()=>{
 const f=fixture(),a=exportPlantAtlas(f),b=exportPlantAtlas(f);
 assert.deepEqual(a.png,b.png);assert.deepEqual(a.manifest,b.manifest);
 assert.equal(a.png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(a.manifest.bitmaps[0].width,2);assert.equal(a.manifest.bitmaps[0].height,1);
 assert.equal(a.manifest.transparentIndex,255);
});
test('refuses missing or mismatched provenance, palette and upstream commit',()=>{
 const f=fixture();
 assert.throws(()=>exportPlantAtlas({...f,expectedHashes:{...f.expectedHashes,PLANT1:'0'.repeat(64)}}),/SHA-256/);
 assert.throws(()=>exportPlantAtlas({...f,sourceCommit:'unknown'}),/unpinned/);
 assert.throws(()=>exportPlantAtlas({...f,palette:new Uint8Array(3)}),/SHA-256|palette/);
});

test('default transparent padding and explicit override yield PNG tRNS without changing indexed pixels',()=>{
 const f=fixture();
 const opaque=exportPlantAtlas(f),transparent=exportPlantAtlas({...f,transparentIndex:7});
 assert.equal(transparent.manifest.transparentIndex,7);
 assert.equal(opaque.manifest.transparentIndex,255);
 assert.equal(opaque.png.includes(Buffer.from('tRNS')),true);
 assert.equal(transparent.png.includes(Buffer.from('tRNS')),true);
 const start=transparent.png.indexOf(Buffer.from('tRNS'))+4;
 assert.equal(transparent.png[start+7],0);
 assert.deepEqual([...transparent.png.subarray(start,start+7)],Array(7).fill(255));
 for(const invalid of [-1,256,2.5,'7'])assert.throws(()=>exportPlantAtlas({...f,transparentIndex:invalid}),/transparent index/);
});
test('large original bitmap archive is rejected before atlas allocation',()=>{
 const f=fixture();
 const huge=new Uint8Array(8+4096*4096);
 new DataView(huge.buffer).setUint32(0,4+4096*4096,true);
 huge[4]=0;huge[5]=16;huge[6]=0;huge[7]=16;
 const inputs={...f,bitmapArchive:huge,expectedHashes:{...f.expectedHashes,I_PLANT1:hash(huge)}};
 assert.throws(()=>exportPlantAtlas(inputs),/plant bitmap exceeds pixel limit/);
});

test('accepts authentic PAL_STD.RES resource header and rejects malformed header',()=>{
 const f=fixture(),wrapped=new Uint8Array(776);
 new DataView(wrapped.buffer).setUint32(0,0x308,true);
 wrapped.set(f.palette,8);
 const ok={...f,palette:wrapped,expectedHashes:{...f.expectedHashes,PAL_STD:hash(wrapped)}};
 assert.deepEqual(exportPlantAtlas(ok).png,exportPlantAtlas(f).png);
 const malformed=wrapped.slice();
 malformed[0]=0;
 assert.throws(()=>exportPlantAtlas({...ok,palette:malformed,expectedHashes:{...ok.expectedHashes,PAL_STD:hash(malformed)}}),/PAL_STD.RES header/);
});
