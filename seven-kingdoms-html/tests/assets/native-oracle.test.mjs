// Independent C++ parity oracle built from original 7KAA blit loops.
// Do not confuse this comparison with an actual running-game screenshot.
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {decodeImportedBitmap,decodeStandardPalette,indexedToRgba,nationRemapTable} from '../../tools/assets/pixel-codec.mjs';
const cases=JSON.parse(await readFile(new URL('./fixtures/original-7kaa-pixels.json',import.meta.url),'utf8'));
const cpp=fileURLToPath(new URL('./native-7kaa-reference.cpp',import.meta.url));
const canCompile=spawnSync('g++',['--version'],{encoding:'utf8'}).status===0;
test('Native C++ source-loop vs JS: authentic NORMAN source sprite and original Seat of Power', {skip:!canCompile},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'7kaa-cpp-'));
 try{
  const exe=join(dir,'7kaa-reference');
  const built=spawnSync('g++',['-std=c++17','-O2','-Wall','-Wextra',cpp,'-o',exe],{encoding:'utf8'});
  assert.equal(built.status,0,built.stderr);
  const originalPalette=Buffer.from(cases.palette.rawBase64,'base64'),rgb=decodeStandardPalette(originalPalette);
  for(const sample of cases.samples) {
   const raw=Buffer.from(sample.recordBase64,'base64'),bitmap=decodeImportedBitmap(raw);
   const packet=Buffer.concat([raw,originalPalette]);
   for(const scheme of [0,1,2,7]) for(const dirId of [0,5,6,7]) {
    const native=spawnSync(exe,[String(scheme),String(dirId)],{input:packet,maxBuffer:16*1024*1024});
    assert.equal(native.status,0,native.stderr?.toString()||'C++ oracle returned nonzero');
    const actual=indexedToRgba(bitmap,rgb,{remap:nationRemapTable(scheme),mirror:dirId>=5});
    assert.deepEqual(native.stdout,actual,`${sample.record} nation scheme ${scheme}, direction ${dirId}`);
   }
  }
 }finally{await rm(dir,{recursive:true,force:true})}
});
