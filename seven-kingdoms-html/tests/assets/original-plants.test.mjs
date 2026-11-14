import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePlantManifest,demoPlantIndex,OriginalPlantPreview} from '../../playtest/original-plants.js';
const record={id:1,x:0,y:0,width:12,height:14,offsetX:0,offsetY:-4};
const manifest={schemaVersion:1,source:'the3dfxdude/7kaa',sourceCommit:'14e6fdfba9481af4dc3a54722614a608776e20bc',width:16,height:16,bitmaps:[record]};
test('original PLANT manifest rejects invalid bounds and provenance',()=>{
 assert.equal(validatePlantManifest(manifest),true);
 assert.equal(validatePlantManifest({...manifest,width:10}),false);
 assert.equal(validatePlantManifest({...manifest,sourceCommit:'unverified'}),false);
 assert.equal(validatePlantManifest({...manifest,bitmaps:[{...record,offsetY:NaN}]}),false);
});
test('demo placement is deterministic and bounded',()=>{
 const a=demoPlantIndex(42,8,12,17);
 assert.equal(a,demoPlantIndex(42,8,12,17));
 assert.ok(a>=0&&a<17);
 assert.equal(demoPlantIndex(42,8,12,0),-1);
});
test('PLANT preview uses source dimensions and restores canvas state',async()=>{
 const calls=[],img={complete:true,naturalWidth:16,naturalHeight:16};
 const p=new OriginalPlantPreview({imageFactory:()=>img,fetcher:async()=>({ok:true,json:async()=>manifest})});
 await p.loading;
 const ctx={save:()=>calls.push('save'),restore:()=>calls.push('restore'),drawImage:(...args)=>calls.push(args)};
 assert.equal(p.draw(ctx,100,200,32,1,2,3),true);
 assert.equal(calls[1][1],0);assert.equal(calls[1][3],12);
 assert.equal(calls[1][6],196);
 assert.equal(calls.at(-1),'restore');
 img.naturalWidth=20;
 assert.equal(p.draw(ctx,100,200,32,1,2,3),false);
});
test('unavailable PLANT atlas preserves fallback',async()=>{
 const p=new OriginalPlantPreview({imageFactory:()=>({complete:false,naturalWidth:0}),fetcher:async()=>({ok:false})});
 await p.loading;
 assert.equal(p.draw({},0,0,24,1,0,0),false);
});
