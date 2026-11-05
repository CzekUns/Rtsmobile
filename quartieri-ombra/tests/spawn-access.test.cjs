"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"..","game.js"),"utf8");
const segment=(a,b)=>{const i=src.indexOf(a),j=src.indexOf(b,i);assert(i>=0&&j>i,"missing "+a);return src.slice(i,j)};
const logic=segment(" const parcels="," let game=null")+"\n"+
 segment(" function spawn("," function nearestBuildingSpot(")+"\n"+
 segment(" const CELL=20"," function moveTo(");
function harness(){
 const ctx={game:{buildings:[],units:[]},nextUnitId:1,PLAYER:1,ENEMY:-1,W:1120,H:680,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),distance:(a,b,c,d)=>Math.hypot(a-c,b-d)};
 vm.createContext(ctx);
 vm.runInContext(logic+"\nthis.api={defs,spawn,blocked,route};",ctx);
 ctx.game.buildings=ctx.api.defs;
 return ctx;
}
test("all fifteen buildings have at least one navigable recruitment doorway",()=>{
 const c=harness();
 for(const b of c.api.defs){
  c.game.units=[];
  const unit=c.api.spawn(1,"g",b);
  assert(unit,"no safe entrance for "+b.name);
  assert(!c.api.blocked(unit.x,unit.y),"spawn inside footprint: "+b.name);
  assert(unit.x>=10&&unit.y>=10&&unit.x<1110&&unit.y<670);
  assert(c.api.route(unit.x,unit.y,unit.x+1,unit.y+1),"spawn must be in a traversable cell: "+b.name);
 }
});
test("multiple recruits alternate free doorways without spawning inside buildings",()=>{
 const c=harness();
 for(let i=0;i<90;i++){
  const b=c.api.defs[i%15];
  c.game.units=[];
  for(let n=0;n<i%4;n++)c.game.units.push({id:-n});
  const u=c.api.spawn(1,"g",b);
  assert(u,"blocked entrance "+b.name);
  assert(!c.api.blocked(u.x,u.y));
  assert(!c.api.blocked(Math.floor(u.x/20)*20+10,Math.floor(u.y/20)*20+10));
 }
});
test("no viable entrance refuses spawn and does not consume unit ID",()=>{
 const c=harness(),b=c.api.defs[0];
 c.game.buildings=[...c.api.defs,{x:b.x-50,y:b.y-50,w:b.w+100,h:b.h+100}];
 assert.equal(c.api.spawn(1,"g",b),null);
 assert.equal(c.nextUnitId,1);
 assert.equal(c.game.units.length,0);
});
