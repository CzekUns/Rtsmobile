import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRes,parseDbf,decodeTable,makeManifest,sha256} from '../../tools/assets/decode.mjs';
test('ResourceIdx reads named records and sentinel, offsets are absolute',()=>{
 const b=Buffer.alloc(2+3*13+5);b.writeUInt16LE(2,0); const start=41;
 [['ABC',start],['DEF',start+2],['',start+5]].forEach(([s,p],i)=>{b.write(s,2+i*13,'latin1');b.writeUInt32LE(p,2+i*13+9)});
 assert.deepEqual(parseRes(b).map(({name,size})=>[name,size]),[['ABC',2],['DEF',3]]);
 b.writeUInt32LE(2,2+13+9);assert.throws(()=>parseRes(b),/offset/i);
});
const dbf=(rows)=>{const size=rows[0].length,b=Buffer.alloc(13+rows.length*size);
 b.writeUInt32LE(rows.length,4);b.writeUInt16LE(12,8);b.writeUInt16LE(size,10);
 rows.forEach((r,i)=>r.copy(b,13+i*size));return b;};
test('packed DBF reads 1-based record sequence',()=>{const b=dbf([Buffer.from('abc'),Buffer.from('def')]);assert.equal(parseDbf(b).records[1].toString(),'def')});
test('SFRAME preserves signed offsets and binary little-endian bitmap pointer',()=>{
 const b=Buffer.alloc(40,32);let p=0;
 for(const [s,n] of [['ROME',8],['M',2],['01',2],['01',2],['-012',4],['0007',4],['025',3],['031',3],['ROME',8]]){b.write(s,p,'latin1');p+=n;}
 b.writeUInt32LE(74565,36);
 const r=decodeTable('SFRAME',dbf([b]))[0];
 assert.equal(r.offsetX,-12);assert.equal(r.bitmapOffset,74565);assert.equal(r.width,25);
});
test('manifest refuses nonexistent frames and never claims decoded pixels',()=>{
 const base={source:'test',sourceHash:{},sprites:[{code:'ROME',firstAction:1,actionCount:1}],
 actions:[{sprite:'ROME',action:'M',direction:2,firstFrame:1,frameCount:1}]};
 assert.throws(()=>makeManifest({...base,frames:[]}),/Missing/);
 const m=makeManifest({...base,frames:[{recordNo:1,sprite:'ROME',width:10,height:20,offsetX:-3,offsetY:5,bitmapOffset:1,file:'ROME'}]});
 assert.equal(m.status,'metadata-only');assert.equal(m.sprites[0].pivotX,3);assert.equal(m.sprites[0].decoded,false);
});
test('sha256 deterministic',()=>assert.equal(sha256(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
