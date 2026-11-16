import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {acquirePlantResources,RESOURCE_NAMES,SOURCE_COMMIT} from '../../tools/assets/fetch-plant-resources.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
test('downloads all four pinned original resources byte-exact and records verifiable hashes',async()=>{
 const visited=[];
 const fetcher=async url=>{
   visited.push(url);
   const name=url.split('/').at(-1),bytes=Uint8Array.from([0,255,128,name.length]);
   return {ok:true,status:200,headers:{get:()=>String(bytes.length)},arrayBuffer:async()=>bytes.buffer};
 };
 const {files,manifest}=await acquirePlantResources({fetcher});
 assert.deepEqual(manifest.resources.map(r=>r.name),RESOURCE_NAMES);
 assert.equal(manifest.sourceCommit,SOURCE_COMMIT);
 for(const r of manifest.resources){
   assert.equal(r.sha256,digest(files[r.name]));
   assert.equal(r.bytes,files[r.name].length);
   assert.equal(r.url,visited[manifest.resources.indexOf(r)]);
   assert.match(r.url,/raw\.githubusercontent\.com\/the3dfxdude\/7kaa\/14e6fdf/);
 }
});
test('rejects non-pinned commits, missing archives, empty and oversized downloads',async()=>{
 await assert.rejects(acquirePlantResources({commit:'main',fetcher:async()=>{throw Error('must not fetch')}}),/unpinned/);
 await assert.rejects(acquirePlantResources({fetcher:async()=>({ok:false,status:404})}),/PLANT1.RES HTTP 404/);
 await assert.rejects(acquirePlantResources({maxBytes:2,fetcher:async()=>({ok:true,headers:{get:()=> '10'},arrayBuffer:async()=>new Uint8Array(10).buffer})}),/oversize/);
 await assert.rejects(acquirePlantResources({fetcher:async()=>({ok:true,headers:{get:()=>null},arrayBuffer:async()=>new ArrayBuffer(0)})}),/invalid upstream resource length/);
});
