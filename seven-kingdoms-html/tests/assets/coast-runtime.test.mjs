import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {coastMask,findCoastRecord,OriginalCoastPreview} from '../../playtest/original-coast.js';
const manifest=JSON.parse(readFileSync(new URL('../../assets/manifests/TERRAIN1-SG-coast-16x12.json',import.meta.url),'utf8'));
test('all fourteen mixed original SG corner patterns have authentic bitmaps',()=>{
 for(let mask=1;mask<=14;mask++){
  const rec=findCoastRecord(manifest.records,mask);
  assert.ok(rec,'missing mixed SG mask '+mask);
  assert.ok(rec.id>=412&&rec.id<=750);
 }
 assert.equal(findCoastRecord(manifest.records,8).id,412);
 assert.equal(findCoastRecord(manifest.records,1).id,690);
 assert.equal(coastMask(['grass','grass','grass','water']),8);
 assert.equal(coastMask(['water','grass','grass','grass']),1);
 assert.equal(coastMask(['grass','grass','grass','grass']),null);
 assert.equal(coastMask(['forest','water','grass','grass']),null);
 assert.equal(coastMask(['water','water','water','water']),null);
});
test('coast preview uses authentic atlas coordinates and keeps fallback on invalid terrain',async()=>{
 const image={complete:true,naturalWidth:512,naturalHeight:384,src:''};
 const preview=new OriginalCoastPreview({imageFactory:()=>image,fetcher:async()=>({ok:true,json:async()=>manifest})});
 await preview.loading;
 const calls=[],ctx={save(){calls.push('save')},restore(){calls.push('restore')},drawImage(...args){calls.push(args)}};
 assert.equal(preview.isReady(),true);
 assert.equal(preview.drawTile(ctx,3.4,8.3,24,['grass','grass','grass','water']),true);
 assert.equal(calls[0],'save');
 assert.deepEqual(calls[1].slice(1,5),[0,0,32,32]);
 assert.equal(calls[2],'restore');
 assert.equal(preview.drawTile(ctx,0,0,24,['grass','grass','grass','grass']),false);
 assert.equal(preview.drawTile(ctx,0,0,24,['hill','water','grass','grass']),false);
});
test('coast preview fails closed when manifest or PNG is unavailable',async()=>{
 const missing=new OriginalCoastPreview({imageFactory:()=>({complete:false,naturalWidth:0,naturalHeight:0}),fetcher:async()=>({ok:false})});
 await missing.loading;
 assert.equal(missing.isReady(),false);
 assert.equal(missing.drawTile({save(){throw Error('must not draw')}},0,0,32,['grass','water','grass','grass']),false);
});
