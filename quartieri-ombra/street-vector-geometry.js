/* Quartieri d'Ombra — independent perspective-to-SVG street-view geometry.
   Original implementation informed by open-source SVG renderer design research.
   World coordinates: x/y = map, z = height. No sprite placement or hitbox drift. */
const QOStreetGeometry=(function(){
"use strict";
const DEG=Math.PI/180, NEAR=3;
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
function normalize(v){const n=Math.hypot(v.x,v.y,v.z)||1;return{x:v.x/n,y:v.y/n,z:v.z/n}}
function camera(target,yaw,height,distance,width,heightPx,zoom=1){
 const radians=yaw*DEG;
 const eye={x:target.x+Math.cos(radians)*distance,y:target.y+Math.sin(radians)*distance,z:height};
 const look={x:target.x,y:target.y,z:Math.min(height-7,target.z??10)};
 const forward=normalize(sub(look,eye));
 const right=normalize(cross(forward,{x:0,y:0,z:1}));
 const up=normalize(cross(right,forward));
 const focal=Math.min(width*.89,heightPx*1.36)*zoom;
 return{eye,look,forward,right,up,focal,width,heightPx,yaw,height,distance,zoom,near:NEAR};
}
function local(view,p){
 const d=sub(p,view.eye);
 return{x:dot(d,view.right),y:dot(d,view.up),z:dot(d,view.forward)};
}
function clipNear(vs,near=NEAR){
 const result=[];
 if(!vs.length)return result;
 for(let i=0;i<vs.length;i++){
  const a=vs[i],b=vs[(i+1)%vs.length];
  const ai=a.z>=near,bi=b.z>=near;
  if(ai)result.push(a);
  if(ai!==bi){
   const t=(near-a.z)/(b.z-a.z);
   result.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y),z:near});
  }
 }
 return result;
}
function projection(view,vertices){
 const source=vertices.map(p=>local(view,p)),clipped=clipNear(source,view.near);
 if(clipped.length<3)return null;
 const pts=clipped.map(v=>({
  x:view.width/2+view.focal*v.x/v.z,
  y:view.heightPx/2-view.focal*v.y/v.z
 }));
 if(pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
 const meanDepth=clipped.reduce((sum,v)=>sum+v.z,0)/clipped.length;
 return{points:pts,depth:meanDepth,path:"M"+pts.map(p=>p.x.toFixed(2)+","+p.y.toFixed(2)).join("L")+"Z"};
}
function projectPoint(view,p){
 const d=local(view,p);if(d.z<view.near)return null;
 return{x:view.width/2+view.focal*d.x/d.z,y:view.heightPx/2-view.focal*d.y/d.z,depth:d.z};
}
function visibleWall(view,a,b){
 const nx=b.y-a.y,ny=a.x-b.x;
 return nx*(view.eye.x-a.x)+ny*(view.eye.y-a.y)>0.0001;
}
function roofVisible(view,z){return view.eye.z>z+.001}
function polyArea(pts){let a=0;for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];a+=p.x*q.y-q.x*p.y}return a/2}
function faceGeometry(building,index){
 const a=building.poly[index],b=building.poly[(index+1)%4];
 const h=building.z;
 return[{x:a.x,y:a.y,z:0},{x:b.x,y:b.y,z:0},{x:b.x,y:b.y,z:h},{x:a.x,y:a.y,z:h}];
}
function depthSort(faces){return faces.sort((a,b)=>b.depth-a.depth||a.order-b.order)}
function distance2(a,b){const x=a.x-b.x,y=a.y-b.y;return x*x+y*y}
return{camera,local,clipNear,projection,projectPoint,visibleWall,roofVisible,faceGeometry,depthSort,distance2,polyArea};
})();
if(typeof window!=="undefined")window.QOStreetGeometry=QOStreetGeometry;
if(typeof module!=="undefined"&&module.exports)module.exports=QOStreetGeometry;
