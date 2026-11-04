"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"..","game.js"),"utf8");
const match=src.match(/const parcels=(\[[\s\S]*?\]);\s*const names/);
assert.ok(match,"Parcel data must be present in the runtime source");
const parcels=vm.runInNewContext(match[1]);
assert.equal(parcels.length,15);
const W=1120,H=680,CELL=20,COLS=W/CELL,ROWS=H/CELL;
const blocked=(x,y)=>parcels.some(([bx,by,w,h])=>x>bx-10&&x<bx+w+10&&y>by-10&&y<by+h+10);
const free=i=>!blocked((i%COLS)*CELL+CELL/2,Math.floor(i/COLS)*CELL+CELL/2);
const visited=new Uint8Array(COLS*ROWS),queue=[];
const first=Array.from({length:visited.length},(_,i)=>i).find(free);
assert.notEqual(first,undefined,"At least one navigable tile");
visited[first]=1;queue.push(first);
for(let head=0;head<queue.length;head++){
 const i=queue[head],x=i%COLS,y=Math.floor(i/COLS);
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const xx=x+dx,yy=y+dy,j=yy*COLS+xx;
  if(xx<0||yy<0||xx>=COLS||yy>=ROWS||visited[j]||!free(j))continue;
  visited[j]=1;queue.push(j);
 }
}
const total=Array.from({length:visited.length},(_,i)=>i).filter(free).length;
assert.equal(queue.length,total,"Every walkable A* cell must belong to the same connected component");
for(let id=0;id<parcels.length;id++){
 const [x,y,w,h]=parcels[id];
 const entrances=[[x+w/2,y+h+22],[x-22,y+h/2],[x+w+22,y+h/2],[x+w/2,y-22]];
 const reachable=entrances.filter(([px,py])=>{
  if(px<10||py<10||px>=W-10||py>=H-10||blocked(px,py))return false;
  const cx=Math.floor(px/CELL),cy=Math.floor(py/CELL);
  return !blocked(cx*CELL+10,cy*CELL+10)&&visited[cy*COLS+cx]===1;
 });
 assert.ok(reachable.length>0,`Building ${id} has no connected entrance`);
}
console.log(`PASS: ${total} walkable cells connected; all ${parcels.length} buildings have reachable entrances`);
