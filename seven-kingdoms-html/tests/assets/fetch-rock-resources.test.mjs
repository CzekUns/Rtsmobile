import test from 'node:test';
import assert from 'node:assert/strict';
import {acquireRockResources,saveRockResources,ROCK_RESOURCE_NAMES,ROCK_SOURCE_COMMIT} from '../../tools/assets/fetch-rock-resources.mjs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const payload=new Uint8Array([3,4,5,6]);
const fetcher=async url=>{
  assert.ok(url.includes('/'+ROCK_SOURCE_COMMIT+'/data/RESOURCE/'));
  return {ok:true,status:200,headers:{get:()=>String(payload.length)},arrayBuffer:async()=>payload.buffer.slice(0)};
};
test('pinned ROCK bundle includes six byte-exact original archive names and hashes',async()=>{
  const result=await acquireRockResources({fetcher});
  assert.deepEqual(result.manifest.resources.map(x=>x.name),ROCK_RESOURCE_NAMES);
  assert.equal(result.manifest.license,'GPL-2.0-or-later');
  for(const entry of result.manifest.resources){
    assert.match(entry.sha256,/^[a-f0-9]{64}$/);
    assert.equal(entry.bytes,4);
  }
  const dir=await mkdtemp(join(tmpdir(),'skh-rock-'));
  try{
    await saveRockResources(result,dir);
    assert.deepEqual(new Uint8Array(await readFile(join(dir,'ROCK1.RES'))),payload);
    assert.equal(JSON.parse(await readFile(join(dir,'rock-source-provenance.json'),'utf8')).resources.length,6);
    await assert.rejects(()=>saveRockResources(result,dir),/EEXIST/);
  }finally{await rm(dir,{recursive:true,force:true})}
});
test('reject unpinned commit, HTTP error, oversized and empty archives',async()=>{
  await assert.rejects(()=>acquireRockResources({fetcher,commit:'other'}),/unpinned/);
  await assert.rejects(()=>acquireRockResources({fetcher:async()=>({ok:false,status:404})}),/ROCK1.RES HTTP 404/);
  await assert.rejects(()=>acquireRockResources({fetcher,maxBytes:2}),/oversize/);
  await assert.rejects(()=>acquireRockResources({fetcher:async()=>({ok:true,headers:{get:()=>null},arrayBuffer:async()=>new ArrayBuffer(0)})}),/invalid upstream resource length/);
});
test('reject tampered resource bytes before writing bundle',async()=>{
  const result=await acquireRockResources({fetcher});
  result.files['ROCK1.RES'][0]=99;
  const dir=await mkdtemp(join(tmpdir(),'skh-rock-tamper-'));
  try{await assert.rejects(()=>saveRockResources(result,dir),/provenance mismatch/)}
  finally{await rm(dir,{recursive:true,force:true})}
});
