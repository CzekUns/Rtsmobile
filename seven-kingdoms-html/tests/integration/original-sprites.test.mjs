import test from 'node:test';
import assert from 'node:assert/strict';
import {ORIGINAL_SHEETS,OriginalSpritePreview,compassDirection,walkingFrame,
 originalFirmPhase,isUnitPreviewProxy,isFirmPreviewProxy,remapNormanNationPixels,blueVariantFromImage,NATION_1_TO_2} from '../../playtest/original-sprites.js';

test('original 7KAA NORMAN atlas has 8 directions and 6 movement frames',()=>{
 assert.equal(ORIGINAL_SHEETS.unit.columns,8);
 assert.equal(ORIGINAL_SHEETS.unit.rows,6);
 assert.equal(ORIGINAL_SHEETS.unit.width,768);
 assert.equal(ORIGINAL_SHEETS.unit.height,672);
 assert.equal(ORIGINAL_SHEETS.firm.columns,4);
});
test('source compass follows map x east and y south',()=>{
 const vectors=[[0,-1,0],[1,-1,1],[1,0,2],[1,1,3],[0,1,4],[-1,1,5],[-1,0,6],[-1,-1,7]];
 for(const [dx,dy,direction] of vectors)assert.equal(compassDirection(dx,dy),direction);
 assert.equal(compassDirection(0,0,6),6);
});
test('walk timing/idle and construction use real source frame boundaries',()=>{
 assert.equal(walkingFrame(0,true),0);
 assert.equal(walkingFrame(145,true),1);
 assert.equal(walkingFrame(870,true),0);
 assert.equal(walkingFrame(870,false),0);
 assert.equal(originalFirmPhase({underConstruction:true,buildProgress:0}),0);
 assert.equal(originalFirmPhase({underConstruction:true,buildProgress:.5}),1);
 assert.equal(originalFirmPhase({underConstruction:true,buildProgress:.9}),2);
 assert.equal(originalFirmPhase({underConstruction:false}),3);
});
test('NORMAN graphics follow race and the original scheme 2 blue kingdom',()=>{
 assert.equal(isUnitPreviewProxy({kind:'soldier',owner:1,culture:'Greci'}),false);
 assert.equal(isUnitPreviewProxy({kind:'peasant',owner:1,culture:'Normanni'}),false);
 assert.equal(isUnitPreviewProxy({kind:'soldier',owner:2,raceId:'norman'}),true);
 assert.equal(isUnitPreviewProxy({kind:'soldier',owner:1,raceId:'norman'}),true);
 assert.equal(isFirmPreviewProxy({kind:'fort',owner:1}),false);
 assert.equal(isFirmPreviewProxy({kind:'market',owner:2}),false);
 assert.equal(isFirmPreviewProxy({kind:'fort',owner:2}),true);
});
test('draws original contact-sheet cells nearest-neighbour, then restores canvas state',()=>{
 const images=[{complete:true,naturalWidth:768,naturalHeight:672},{complete:true,naturalWidth:720,naturalHeight:160}];
 const preview=new OriginalSpritePreview({imageFactory:()=>images.shift()});
 assert.match(preview.unit.src,/NORMAN-M-1x\.png$/);
 assert.match(preview.firm.src,/BASE-NORMAN-phases-1x\.png$/);
 const calls=[],ctx={save:()=>calls.push(['save']),restore:()=>calls.push(['restore']),
  drawImage:(...args)=>calls.push(['image',...args]),imageSmoothingEnabled:true};
 assert.equal(preview.drawUnit(ctx,{kind:'soldier',owner:1,raceId:'norman'},100,150,24,6,5),true);
 assert.equal(calls[1][0],'image');
 assert.deepEqual(calls[1].slice(2,6),[576,560,96,112]);
 assert.deepEqual(calls[1].slice(6),[48,68,96,112]);
 assert.equal(calls[2][0],'restore');
 calls.length=0;
 preview.firmBlue={width:720,height:160};
 assert.equal(preview.drawFirm(ctx,{kind:'fort',owner:2,size:3},20,30,24),true);
 assert.equal(calls[1][1],preview.firmBlue);
 assert.deepEqual(calls[1].slice(2,6),[540,0,180,160]);
 assert.equal(calls[2][0],'restore');
});
test('asset not loaded or bad dimensions retains Canvas fallback',()=>{
 const preview=new OriginalSpritePreview({imageFactory:()=>({complete:true,naturalWidth:1,naturalHeight:1})});
 const ctx={drawImage(){throw Error('must not draw invalid image')}};
 assert.equal(preview.drawUnit(ctx,{kind:'soldier',owner:1},0,0,24,4,0),false);
 assert.equal(preview.drawFirm(ctx,{kind:'fort',owner:1,size:3},0,0,24),false);
});

test('real 7KAA scheme 1 -> scheme 2 remaps exactly eight unique palette entries',()=>{
 const pixels=new Uint8ClampedArray([...NATION_1_TO_2.flatMap(v=>[v[0],v[1],v[2],255]),
  220,0,0,255,235,2,2,0]);
 const changed=remapNormanNationPixels(pixels);
 assert.equal(changed,8);
 for(let i=0;i<8;i++)assert.deepEqual(Array.from(pixels.subarray(4*i,4*i+3)),NATION_1_TO_2[i].slice(3));
 assert.deepEqual(Array.from(pixels.subarray(32)),[220,0,0,255,235,2,2,0]);
});
test('blue ImageData variant is created only after source image is decoded',()=>{
 const rgba=new Uint8ClampedArray([235,2,2,255,200,100,10,255]);
 let created=null;
 const blue=blueVariantFromImage({naturalWidth:2,naturalHeight:1},()=>{
  created={width:0,height:0,getContext:()=>({
   drawImage(){},getImageData:()=>({data:rgba}),putImageData(){}
  })};return created;
 });
 assert.equal(blue,created);assert.equal(blue.width,2);
 assert.deepEqual([...rgba],[113,113,241,255,200,100,10,255]);
 assert.equal(blueVariantFromImage({naturalWidth:0,naturalHeight:0},()=>null),null);
});
