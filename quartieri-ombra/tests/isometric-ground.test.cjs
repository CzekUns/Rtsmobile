"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../game.js"),"utf8");
const begin=src.indexOf(" const ISO=");
const end=src.indexOf("\n // Original, small-scale",begin);
const streetsStart=src.indexOf(" const streets=[");
const streetsEnd=src.indexOf("\n const streetProps=",streetsStart);
assert.ok(begin>=0&&end>begin&&streetsStart>=0&&streetsEnd>streetsStart,"renderer ground function present");
const body=src.slice(streetsStart,streetsEnd)+"\n"+src.slice(begin,end);
function run(){
 const stats={moves:[],lines:[],fills:0,strokes:0};
 const ctx={
  fillRect(){},beginPath(){},moveTo(x,y){stats.moves.push([x,y])},
  lineTo(x,y){stats.lines.push([x,y])},closePath(){},
  fill(){stats.fills++},stroke(){stats.strokes++},ellipse(){}
 };
 vm.runInNewContext(body+";drawIsometricGround();",{ctx,W:1120,H:680},{timeout:1000});
 return stats;
}
test("ground draws many individual 2:1 diamond tiles",()=>{
 const s=run();assert.ok(s.fills>100);assert.ok(s.strokes>100);
 assert.ok(s.moves.length>100);assert.ok(s.lines.length>s.moves.length);
 const [x,y]=s.moves[0];const [rightX,rightY]=s.lines[0];
 assert.ok(Math.abs(rightX-x-19.2)<1e-6);assert.ok(Math.abs(rightY-y-9.6)<1e-6);
});
test("ground pass is deterministic and reusable",()=>{
 const a=run(),b=run();
 assert.deepEqual(a.moves,b.moves);assert.equal(a.fills,b.fills);
});
