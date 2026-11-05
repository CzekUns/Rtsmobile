"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const dir=path.join(__dirname,"..","assets","guides");
const file=name=>fs.readFileSync(path.join(dir,name),"utf8");
const master=file("cross-street-block-2-skeleton.svg");
const reference=file("cross-street-block-2-imagegen-input.svg");
const alpha=file("cross-street-block-2-alpha-master.svg");
function groups(xml){
 return new Map([...xml.matchAll(/<g data-lot-id="(\d+)"[^>]*>([\s\S]*?)<\/g>/g)].map(m=>
  [+m[1],[...m[2].matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(p=>p[1])]));
}
test("production reference and alpha use exact authoritatively traced walls/roofs",()=>{
 const original=groups(master),paint=groups(reference),mask=groups(alpha);
 const ids=[2,3,4,9,10,11];
 assert.deepEqual([...original.keys()],ids);
 assert.deepEqual([...paint.keys()].sort((a,b)=>a-b),ids);
 assert.deepEqual([...mask.keys()].sort((a,b)=>a-b),ids);
 for(const id of ids){
  assert.equal(original.get(id).length,6);
  assert.deepEqual(paint.get(id),original.get(id).slice(1),"image reference must never move a roof/wall: "+id);
  assert.deepEqual(mask.get(id),original.get(id).slice(1),"alpha master must never move a roof/wall: "+id);
 }
});
test("ImageGen canvas is exactly 4x the shared projected chunk origin",()=>{
 for(const svg of [reference,alpha]){
  assert.match(svg,/width="1332" height="1160" viewBox="0 0 333 290"/);
  assert.doesNotMatch(svg,/<(?:image|foreignObject|text)\b/);
 }
});
