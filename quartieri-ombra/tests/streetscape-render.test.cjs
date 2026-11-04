"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const code=fs.readFileSync(path.resolve(__dirname,"../game.js"),"utf8");
function between(start,end){let a=code.indexOf(start),b=code.indexOf(end,a);assert(a>=0&&b>a,"Missing "+start);return code.slice(a,b)}
const world=new Function("W","H",between(" const parcels="," let game=null")+" return {defs,streetProps,streets}")(1120,680);
test("the 15 streetscape props are distinct game resources outside building footprints",()=>{
 assert.equal(world.defs.length,15);assert.equal(world.streetProps.length,15);
 const types=new Set(world.streetProps.map(x=>x.type));assert(types.size>=4);
 for(const p of world.streetProps){
  assert(Number.isFinite(p.x)&&Number.isFinite(p.y));
  for(const b of world.defs)assert(!(p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h),"Decor inside footprint "+b.id);
 }
});
function harness(){
 let polygons=0,invalid=0,rects=0;
 const ctx=new Proxy({}, {get:(_,key)=>key==="fillRect"?(...v)=>{rects++;if(v.some(n=>!Number.isFinite(n)))invalid++}:()=>{}});
 const isoPoly=p=>{polygons++;if(p.length<3||p.some(v=>!Number.isFinite(v.x)||!Number.isFinite(v.y)))invalid++};
 const isoPoint=(x,y)=>({x:560+(x-y)*.48,y:40+(x+y)*.24});
 const f=new Function("ctx","isoPoly","isoPoint","paintAsset","imageAssets",between(" function buildingStyle("," function drawIsoBuilding(")+"return {buildingStyle,drawPeriodRoof,drawStreetProp}")(ctx,isoPoly,isoPoint,()=>false,{});
 return {...f,stats:()=>({polygons,invalid,rects})};
}
test("period buildings use multiple original silhouettes and valid polygon roofs",()=>{
 const h=harness(),styles=new Set();
 for(const b of world.defs){
  styles.add(h.buildingStyle(b));
  const roof=[{x:100,y:50},{x:130,y:65},{x:110,y:85},{x:80,y:70}];
  h.drawPeriodRoof(b,roof);
 }
 assert(styles.size>=4);assert(h.stats().polygons>=world.defs.length);assert.equal(h.stats().invalid,0);
});
test("all five pre-existing SVG prop types render with fallback without collisions",()=>{
 const h=harness();
 for(const type of ["barrel","crate","streetLamp","woodenFence","lantern"])
  h.drawStreetProp({type,x:200,y:200});
 assert.equal(h.stats().invalid,0);assert(h.stats().rects>=5);
 assert.match(code,/kind:"prop",item:prop/);
 assert.match(code,/drawStreetProp\(sprite\.item\)/);
});
