import test from 'node:test';
import assert from 'node:assert/strict';
import {CHINESE_BASE,loadChineseBaseImages} from '../playtest/chinese-base.js';

const validManifest=()=>({id:CHINESE_BASE.id,locWidth:4,locHeight:4,
 source:{sha256:{tables:CHINESE_BASE.source.sha256[0],bitmap:CHINESE_BASE.source.sha256[1],palette:CHINESE_BASE.source.sha256[2]}},
 modes:CHINESE_BASE.modes.map(mode=>({path:mode.file,sourceBitmapRecords:mode.records}))});
const manifestLoader=async()=>validManifest();
function factory({failAt=-1,badSizeAt=-1}={}){
 let index=0;
 return ()=>{
  const i=index++, listeners={};
  const image={
   complete:false,naturalWidth:0,naturalHeight:0,
   addEventListener(name,callback){listeners[name]=callback;}
  };
  Object.defineProperty(image,'src',{set(url){
   image.url=url;
   queueMicrotask(()=>{
    if(i===failAt){listeners.error?.(new Error('missing PNG'));return;}
    image.complete=true;
    image.naturalWidth=i===badSizeAt?146:147;
    image.naturalHeight=139;
    listeners.load?.();
   });
  }});
  return image;
 };
}
test('Chinese image loader requires explicit root and returns all five validated modes',async()=>{
 assert.equal(await loadChineseBaseImages({imageFactory:factory(),manifestLoader}),null);
 const images=await loadChineseBaseImages({assetRoot:'/original/chinese-base/',imageFactory:factory(),manifestLoader});
 assert.equal(images.size,5);
 for(const mode of CHINESE_BASE.modes){
  assert.equal(images.get(mode.file).url,'/original/chinese-base/'+mode.file);
 }
});
test('Chinese image loader rejects missing and wrong-sized source PNGs atomically',async()=>{
 for(const options of [{failAt:2},{badSizeAt:3}]){
  assert.equal(await loadChineseBaseImages({assetRoot:'/assets',imageFactory:factory(options),manifestLoader}),null);
 }
});

test('Chinese loader rejects missing, tampered and unavailable source manifest before requesting PNGs',async()=>{
 let created=0;
 const imageFactory=()=>{created++;throw new Error('image should not be requested')};
 const root='/assets/original/chinese-base';
 for(const bad of [null,{...validManifest(),id:'BASE:NORMAN'},
  {...validManifest(),source:{sha256:{...validManifest().source.sha256,bitmap:'tampered'}}},
  {...validManifest(),modes:validManifest().modes.slice(1)}]){
  assert.equal(await loadChineseBaseImages({assetRoot:root,imageFactory,manifestLoader:async()=>bad}),null);
 }
 assert.equal(await loadChineseBaseImages({assetRoot:root,imageFactory,manifestLoader:async()=>{throw new Error('404')}}),null);
 assert.equal(created,0);
});
