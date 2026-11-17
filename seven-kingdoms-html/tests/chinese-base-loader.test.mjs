import test from 'node:test';
import assert from 'node:assert/strict';
import {CHINESE_BASE,loadChineseBaseImages} from '../playtest/chinese-base.js';

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
 assert.equal(await loadChineseBaseImages({imageFactory:factory()}),null);
 const images=await loadChineseBaseImages({assetRoot:'/original/chinese-base/',imageFactory:factory()});
 assert.equal(images.size,5);
 for(const mode of CHINESE_BASE.modes){
  assert.equal(images.get(mode.file).url,'/original/chinese-base/'+mode.file);
 }
});
test('Chinese image loader rejects missing and wrong-sized source PNGs atomically',async()=>{
 for(const options of [{failAt:2},{badSizeAt:3}]){
  assert.equal(await loadChineseBaseImages({assetRoot:'/assets',imageFactory:factory(options)}),null);
 }
});
