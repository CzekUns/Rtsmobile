import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseFirmInteger} from '../tools/assets/render-firm.mjs';
import {acquireResources,chooseSecondBuild,parseAcquireArgs,REQUIRED,UPSTREAM_COMMIT} from '../tools/assets/acquire-original-family.mjs';

test('downloads only three pinned upstream GPL resources without fabricating data',async()=>{
 const root=await mkdtemp(join(tmpdir(),'7kaa-acquire-test-'));
 const urls=[];
 try{
  const hashes=await acquireResources(root,{fetcher:async url=>{
   urls.push(url);
   return {ok:true,arrayBuffer:async()=>Uint8Array.from([1,2,3]).buffer};
  }});
  assert.equal(urls.length,3);
  for(const name of REQUIRED){
   assert.ok(urls.find(url=>url.includes(UPSTREAM_COMMIT)&&url.endsWith('/'+name)));
   assert.deepEqual(await readFile(join(root,'data','RESOURCE',name)),Buffer.from([1,2,3]));
   assert.match(hashes[name],/^[a-f0-9]{64}$/);
  }
 }finally{await rm(root,{recursive:true,force:true})}
});

test('HTTP failure aborts extraction without treating missing source as artwork',async()=>{
 const root=await mkdtemp(join(tmpdir(),'7kaa-acquire-test-'));
 try{
  await assert.rejects(acquireResources(root,{fetcher:async()=>({ok:false,status:404})}),/HTTP 404/);
 }finally{await rm(root,{recursive:true,force:true})}
});

test('second family selection uses original FBUILD/FFRAME/FBITMAP references',()=>{
 const build=(raceCode)=>({firmCode:'BASE',raceCode,firstFrame:1,frameCount:1,constructionFirst:1,constructionCount:1,idleBitmap:1,groundBitmap:0});
 const tables={FBUILD:[build('NORMAN'),build('GREEK')],
  FFRAME:[{firmCode:'BASE',raceCode:'GREEK',firstBitmap:1,bitmapCount:1}],
  FBITMAP:[{firmCode:'BASE',raceCode:'GREEK',recordNo:1}]};
 assert.equal(chooseSecondBuild(tables).race,'GREEK');
 assert.deepEqual(chooseSecondBuild(tables).constructionRecords,[1]);
 assert.throws(()=>chooseSecondBuild(tables,{race:'NORMAN'}),/non-Norman/);
 assert.throws(()=>chooseSecondBuild(tables,{race:'MISSING'}),/Firm build missing/);
});

test('acquisition CLI does not interpret --out as an absent --race or --firm',()=>{
 assert.deepEqual(parseAcquireArgs(['--out','/tmp/7kaa']),{out:'/tmp/7kaa',race:undefined,firm:'BASE'});
 assert.deepEqual(parseAcquireArgs(['--out','/tmp/7kaa','--race','GREEK','--firm','BASE']),{out:'/tmp/7kaa',race:'GREEK',firm:'BASE'});
 assert.deepEqual(parseAcquireArgs(['--race','--out','/tmp/7kaa']),{out:'/tmp/7kaa',race:undefined,firm:'BASE'});
 assert.equal(parseAcquireArgs(['--out']).out,undefined);
});


test('original firm DBF blank optional numerics are zero, mandatory references remain strict',()=>{
 assert.equal(parseFirmInteger(Buffer.from('   '),{optional:true,field:'FBUILD.groundBitmap'}),0);
 assert.equal(parseFirmInteger(Buffer.from('  12'),{optional:true,field:'FFRAME.delay'}),12);
 assert.equal(parseFirmInteger(Buffer.from('  12'),{field:'FFRAME.firstBitmap'}),12);
 assert.throws(()=>parseFirmInteger(Buffer.from('   '),{field:'FFRAME.firstBitmap'}),/FFRAME.firstBitmap/);
 assert.throws(()=>parseFirmInteger(Buffer.from(' 1x'),{optional:true,field:'FFRAME.delay'}),/FFRAME.delay/);
});
