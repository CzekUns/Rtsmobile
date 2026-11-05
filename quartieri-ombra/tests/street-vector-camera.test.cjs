"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const World=require("../board-world.js");
const G=require("../street-vector-geometry.js");
const world=World.generate(1860);
const target={x:1055,y:969,z:10};
function frame(angle){
 return G.camera(target,angle,39,265,1200,720,1);
}
test("SVG street mode uses the authoritative parcels without moving or replacing assets",()=>{
 assert.equal(world.buildings.length,454);
 assert.deepEqual([2,3,4,9,10,11].map(id=>world.buildings[id].id),[2,3,4,9,10,11]);
 for(const b of world.buildings.slice(0,12)){
  for(let i=0;i<4;i++){
   const face=G.faceGeometry(b,i);
   assert.equal(face.length,4);
   assert.equal(face[0].z,0);assert.equal(face[3].z,b.z);
   assert.equal(face[0].x,b.poly[i].x);
  }
 }
});
test("255-degree camera culls real back faces, not a rotated flat SVG sprite",()=>{
 const poly=[{x:0,y:0},{x:100,y:0},{x:100,y:60},{x:0,y:60}];
 const cam=G.camera({x:50,y:30,z:10},255,39,265,1200,720,1);
 const visible=[0,1,2,3].filter(i=>G.visibleWall(cam,poly[i],poly[(i+1)%4]));
 assert.deepEqual(visible,[0,3]);
 const rect={poly,z:55};
 const shapes=visible.map(i=>G.projection(cam,G.faceGeometry(rect,i)));
 assert(shapes.every(s=>s&&Number.isFinite(s.depth)&&s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
 assert.equal(G.roofVisible(cam,rect.z),false);
});
test("perspective rotates 360 and preserves the buildings' real world coordinates",()=>{
 const b=world.buildings[2],initial=JSON.stringify(b.poly);
 for(let angle=0;angle<360;angle+=15){
  const view=frame(angle);
  assert(view.focal>0);
  for(let i=0;i<4;i++){
   if(!G.visibleWall(view,b.poly[i],b.poly[(i+1)%4]))continue;
   const p=G.projection(view,G.faceGeometry(b,i));
   if(p)assert(p.points.length>=3);
  }
 }
 assert.equal(JSON.stringify(b.poly),initial);
});
test("zoom changes projected size without moving the camera or picking geometry",()=>{
 const b=world.buildings[3],v1=G.camera(target,255,39,265,1200,720,1);
 const v2=G.camera(target,255,39,265,1200,720,2);
 const point={x:b.x,y:b.y,z:30},p1=G.projectPoint(v1,point),p2=G.projectPoint(v2,point);
 assert(p1&&p2);
 assert.equal(v1.eye.x,v2.eye.x);assert.equal(v1.eye.y,v2.eye.y);
 assert(Math.abs(p2.x-600)>Math.abs(p1.x-600));
});
test("lab page loads isolated modules and exposes lamp height/255deg interaction",()=>{
 const root=path.resolve(__dirname,"..");
 const html=fs.readFileSync(path.join(root,"street-vector-lab.html"),"utf8");
 for(const name of["board-world.js","street-vector-geometry.js","street-vector-lab.js","street-vector-lab.css","yaw-control","height-control","zoom-control",'data-yaw="255"'])
  assert(html.includes(name),name);
 assert(!html.includes("imagegen-v2"));
 new Function(fs.readFileSync(path.join(root,"street-vector-lab.js"),"utf8"));
});
