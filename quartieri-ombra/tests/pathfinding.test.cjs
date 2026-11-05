"use strict";
// Run: node tests/pathfinding.test.cjs
// Execute the actual route() function from game.js in an isolated VM context.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "..", "game.js"), "utf8");
const start = source.indexOf(" function route(");
const end = source.indexOf("\n function moveTo(", start);
assert.ok(start >= 0 && end > start, "Actual route implementation must be found");
const routeSource = source.slice(start, end);
const W = 1120, H = 680, CELL = 20, COLS = Math.ceil(W/CELL), ROWS = Math.ceil(H/CELL);
const buildings = [{x:100,y:100,w:115,h:76}];
const sandbox = {
  W,H,CELL,COLS,ROWS,
  game:{buildings},
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  Int32Array,Float64Array,Set,Math,Infinity
};
vm.createContext(sandbox);
vm.runInContext(`
function blocked(x,y){return game.buildings.some(b=>x>b.x-10&&x<b.x+b.w+10&&y>b.y-10&&y<b.y+b.h+10)}
${routeSource}
this.testRoute=route;
`,sandbox,{timeout:1000});
const route = sandbox.testRoute;
const checks = [
 ["open corridor",()=>assert.ok(route(10,10,70,10)?.length)],
 ["destination inside building",()=>assert.equal(route(10,10,130,130),null)],
 ["destination cell center blocked",()=>assert.equal(route(10,10,98,98),null)],
 ["detour around obstacle",()=>{
   const points=route(50,130,250,130);
   assert.ok(points?.length>0);
   for(const p of points)assert.equal(sandbox.blocked(p.x,p.y),false);
 }],
 ["same start and destination",()=>assert.equal(route(10,10,10,10).length,1)],
 ["map bounds clamped",()=>assert.ok(route(10,10,-100,-100)?.length)],
 ["no path into fully obstructed destination",()=>{
   buildings.push({x:300,y:200,w:60,h:60});
   assert.equal(route(10,10,330,230),null);
 }]
];
for(const [name,fn] of checks){fn();console.log("PASS",name)}
console.log(`Pathfinding: ${checks.length}/${checks.length} passed`);
