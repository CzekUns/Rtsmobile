"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","game.js"),"utf8");
function extract(name){const start=source.indexOf("function "+name+"(");assert.ok(start>=0,name+" missing");const brace=source.indexOf("{",start);let depth=0;for(let i=brace;i<source.length;i++){if(source[i]==="{")depth++;else if(source[i]==="}"&&!--depth)return source.slice(start,i+1)}throw Error(name+" not closed")}
const geometry=vm.runInNewContext("const W=1120,H=680;const ISO={ox:W/2,oy:40,sx:.48,sy:.24};"+extract("isoPoint")+";"+extract("isoInverse")+";({isoPoint,isoInverse})");
test("iso basis is diamond 2:1",()=>{const a=geometry.isoPoint(0,0),b=geometry.isoPoint(40,0),c=geometry.isoPoint(0,40);assert.equal(b.x-a.x,19.200000000000045);assert.equal(c.x-a.x,-19.200000000000045);assert.ok(Math.abs((b.y-a.y)/(b.x-a.x)-.5)<1e-9)});
test("iso inverse maps clicks back to pathfinding ground",()=>{for(const [x,y] of [[0,0],[500,300],[1100,650],[100,550]]){const p=geometry.isoPoint(x,y),q=geometry.isoInverse(p.x,p.y);assert.ok(Math.abs(q.x-x)<1e-9);assert.ok(Math.abs(q.y-y)<1e-9)}});
test("render scene depth-sorts buildings and units together",()=>{const body=extract("drawScene");assert.match(body,/game\.buildings\.map/);assert.match(body,/game\.units\.map/);assert.match(body,/\.sort\(\(a,b\)=>a\.depth-b\.depth\)/);assert.match(body,/drawIsoBuilding/);assert.match(body,/drawIsoUnit/)});
test("zoom uses projected point while tapping uses inverse",()=>{assert.match(extract("worldPoint"),/isoInverse/);assert.match(extract("zoomAt"),/isoPoint/);assert.match(extract("drawIsometricGround"),/isoFootprint/)});
