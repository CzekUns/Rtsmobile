import test from 'node:test';
import assert from 'node:assert/strict';
import {OriginalTerrainPreview,ORIGINAL_TERRAIN} from '../../playtest/original-terrain.js';
import {WorldView} from '../../view.js';

function fixture({throwOnDraw=false,complete=true,width=ORIGINAL_TERRAIN.width}={}){
 const calls=[];
 const preview=new OriginalTerrainPreview({imageFactory:()=>({
  complete,naturalWidth:width,naturalHeight:ORIGINAL_TERRAIN.height,src:''
 })});
 const ctx={
  save(){calls.push('save');},
  restore(){calls.push('restore');},
  drawImage(){calls.push('drawImage');if(throwOnDraw)throw new Error('decode failed');},
  fillRect(){calls.push('fillRect');},
  beginPath(){calls.push('beginPath');},
  moveTo(){},lineTo(){},closePath(){},arc(){},fill(){}
 };
 return {preview,ctx,calls};
}

test('valid original atlas draws and restores canvas state',()=>{
 const {preview,ctx,calls}=fixture();
 assert.equal(preview.drawTile(ctx,10,20,24,'grass',0),true);
 assert.deepEqual(calls,['save','drawImage','restore']);
});

test('failed atlas draw restores state and allows actual tile fallback',()=>{
 const {preview,ctx,calls}=fixture({throwOnDraw:true});
 const fake={screen(){return {x:0,y:0}},originalTerrain:preview};
 assert.doesNotThrow(()=>WorldView.prototype.tileDraw.call(fake,{seed:7},ctx,1,1,24));
 assert.deepEqual(calls.slice(0,3),['save','drawImage','restore']);
 assert.ok(calls.includes('fillRect'),'fallback paints a visible tile');
});

test('incomplete or incorrectly sized atlas does not touch canvas',()=>{
 for(const options of [{complete:false},{width:32}]){
  const {preview,ctx,calls}=fixture(options);
  assert.equal(preview.drawTile(ctx,0,0,24,'grass',.5),false);
  assert.deepEqual(calls,[]);
 }
});
