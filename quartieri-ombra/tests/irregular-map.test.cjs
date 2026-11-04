"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"..","game.js"),"utf8");
const begin=src.indexOf(" const parcels="),end=src.indexOf("\n let game=null",begin);
assert(begin>=0&&end>begin,"historical map source segment found");
const sandbox={};vm.runInNewContext(src.slice(begin,end)+"\nthis.map={parcels,streets,defs};",sandbox);
const {parcels,streets,defs}=sandbox.map;
test("15 unique parcels, valid dimensions, no overlaps or boundary clipping",()=>{
 assert.equal(parcels.length,15);assert.equal(defs.length,15);
 for(const [i,p] of parcels.entries()){
  const [x,y,w,h]=p;assert(x>=10&&y>=10&&x+w<1120&&y+h<680);assert(w>45&&h>45);
  for(const [j,q] of parcels.entries())if(i!==j)
   assert(x+w+20<=q[0]||q[0]+q[2]+20<=x||y+h+20<=q[1]||q[1]+q[3]+20<=y,"parcel "+i+" overlaps "+j);
 }
 assert.equal(new Set(defs.map(x=>x.name)).size,15);
});
test("irregular footprint layout, not regular rows/columns",()=>{
 assert(new Set(parcels.map(p=>p[0])).size>10);
 assert(new Set(parcels.map(p=>p[1])).size>10);
});
test("historically named streets are connected non-axis-aligned polylines",()=>{
 assert.equal(streets.length,5);
 for(const street of streets){
  assert(street.name.length>4);assert(street.width>=20);
  assert(street.points.length>=3);
  assert(street.points.some((p,i)=>i&&p[0]!==street.points[i-1][0]&&p[1]!==street.points[i-1][1]));
 }
});
test("renderer draws road strips in isometric coordinates",()=>{
 assert.match(src,/isoPoly\(\[\.\.\.left,\.\.\.right\.reverse\(\)\]/);
 assert.match(src,/isoPoint\(x\+nx,y\+ny\)/);
 assert.doesNotMatch(src,/Math\.floor\(x\/size\)%6===0/);
});
