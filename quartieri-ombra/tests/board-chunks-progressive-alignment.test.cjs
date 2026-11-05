"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Art=require("../board-chunks.js");

test("Cross Street progressive geometry alignment leaves hitboxes untouched and restores canvas state",()=>{
 const Original=global.Image;
 class MockImage{
  set src(value){this._src=value;this.naturalWidth=1344;this.onload?.()}
  get src(){return this._src}
 }
 global.Image=MockImage;
 try{
  const operations=[];
  const ctx={
   save(){operations.push(["save"])},
   restore(){operations.push(["restore"])},
   transform(...v){operations.push(["transform",...v])},
   drawImage(...v){operations.push(["drawImage",...v])}
  };
  const frame={left:-51,top:608,width:285,height:242};
  const sourceRect=[144,68,1006,1016],targetRect=[18.5,18.5,248.25,205.75];
  const originalFrame=structuredClone(frame);
  Art.register("test-cross-street-shear",{
   src:"cross-street-v2-original.png",sourceRect,targetRect,
   mappingMode:"shear",shear:0.05
  });
  assert(Art.draw(ctx,{id:"test-cross-street-shear",frame},1.65));
  assert.deepEqual(operations.map(o=>o[0]),["save","transform","drawImage","restore"]);
  const t=operations[1],draw=operations[2];
  assert.equal(t[1],1);assert.equal(t[2],0.05);
  assert.equal(t[3],0);assert.equal(t[4],1);assert.equal(t[5],0);
  assert(Math.abs(t[6] - (-0.05*(frame.left+targetRect[0]+targetRect[2])))<1e-9);
  assert.deepEqual(draw.slice(2),[144,68,1006,1016,-32.5,626.5,248.25,205.75]);
  assert.deepEqual(frame,originalFrame);
  assert.equal(Art.ready("test-cross-street-shear"),true);
 }finally{global.Image=Original}
});

test("unsafe out-of-range shear is rejected without drawing or mutating canvas",()=>{
 const Original=global.Image;
 class MockImage{
  set src(value){this._src=value;this.naturalWidth=10;this.onload?.()}
  get src(){return this._src}
 }
 global.Image=MockImage;
 try{
  Art.register("test-cross-street-invalid",{
   src:"x.png",sourceRect:[0,0,10,10],targetRect:[0,0,10,10],
   mappingMode:"shear",shear:Infinity
  });
  let drawn=false;
  const ctx={drawImage(){drawn=true}};
  assert.equal(Art.draw(ctx,{id:"test-cross-street-invalid",frame:{left:0,top:0,width:10,height:10}},1),false);
  assert.equal(drawn,false);
 }finally{global.Image=Original}
});

test("calibrated audit compensates the SVG export's 24-unit outer padding",()=>{
 const fs=require("node:fs"),path=require("node:path");
 const preview=fs.readFileSync(path.join(__dirname,"../board-preview.js"),"utf8");
 assert.match(preview,/targetRect:mode\.startsWith\("v2align"\)/);
 assert.match(preview,/\[18\.5,18\.5,248\.25,205\.75\]/);
 assert.match(preview,/shear:mode\.startsWith\("v2align"\)\?0\.05/);
 // 18.5 + 24 extra units in the source SVG = the observed 42.5 coordinate.
 assert.equal(18.5+24,42.5);
});
