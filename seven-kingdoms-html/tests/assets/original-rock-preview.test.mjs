import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRockManifest,demoRockIndex,OriginalRockPreview} from '../../playtest/original-rock.js';
const source='14e6fdfba9481af4dc3a54722614a608776e20bc';
const entry={rockId:'DDA1',rockType:'D',footprintWidth:1,footprintHeight:1,blockX:0,blockY:0,frame:1,x:0,y:0,width:32,height:32};
const manifest={schemaVersion:1,source:'the3dfxdude/7kaa',sourceCommit:source,license:'GPL-2.0-or-later',width:32,height:32,resources:Array.from({length:6},()=>({})),entries:[entry]};
test('ROCK manifest rejects invalid atlas and footprint boundaries',()=>{
 assert.equal(validateRockManifest(manifest),true);
 assert.equal(validateRockManifest({...manifest,width:16}),false);
 assert.equal(validateRockManifest({...manifest,entries:[{...entry,blockX:1}]}),false);
 assert.equal(validateRockManifest({...manifest,license:'unknown'}),false);
});
test('ROCK demo selection deterministic and bounded',()=>{
 for(let y=0;y<30;y++)for(let x=0;x<30;x++){
  const n=demoRockIndex(123,x,y,17);
  assert.ok(n>=0&&n<17);
  assert.equal(n,demoRockIndex(123,x,y,17));
 }
 assert.equal(demoRockIndex(1,1,1,0),-1);
});
test('ROCK runtime draws a source tile and retains graceful fallback',async()=>{
 const calls=[];
 const img={complete:true,naturalWidth:32,naturalHeight:32};
 const rock=new OriginalRockPreview({imageFactory:()=>img,fetcher:async()=>({ok:true,json:async()=>manifest})});
 await rock.loading;
 const ctx={save(){},restore(){},drawImage(...args){calls.push(args)},imageSmoothingEnabled:true};
 assert.equal(rock.isReady(),true);
 assert.equal(rock.draw(ctx,10,20,24,1,2,3),true);
 assert.equal(calls.length,1);
 assert.equal(calls[0][0],img);
 const bad=new OriginalRockPreview({imageFactory:()=>img,fetcher:async()=>({ok:false})});
 await bad.loading;
 assert.equal(bad.draw(ctx,0,0,24,1,0,0),false);
});
