/* Quartieri d'Ombra — pure, testable geometry for the WebGL street lab.
 * Nothing in this module changes QOBoardWorld, game logic, or legacy art.
 */
const QOStreetWebGLCore=(function(){
"use strict";
const PILOT_IDS=Object.freeze([2,3,4,9,10,11]);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function angleDeg(radians){return (radians*180/Math.PI%360+360)%360}
function center(buildings){
 if(!buildings.length)throw new Error("A street camera needs at least one building");
 return{x:buildings.reduce((s,b)=>s+b.x,0)/buildings.length,
  y:buildings.reduce((s,b)=>s+b.y,0)/buildings.length};
}
function segmentDistance(p,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy||1;
 const t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/d,0,1);
 return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
}
function doorEdgeIndex(b){
 if(!b.poly||b.poly.length!==4)throw new Error("Expected canonical four-corner building");
 const distances=b.poly.map((p,i)=>segmentDistance(b.door,p,b.poly[(i+1)%4]));
 return distances.indexOf(Math.min(...distances));
}
function cluster(world,options={}){
 const ids=options.ids||PILOT_IDS;
 const pilot=ids.map(id=>world.buildings[id]);
 if(pilot.some(b=>!b))throw new Error("Pilot building IDs are missing");
 const focus=center(pilot);
 const radius=options.radius??410,limit=options.limit??38;
 // The pilot is always present; additional real buildings create street occlusion.
 const other=world.buildings.filter(b=>!ids.includes(b.id))
   .map(b=>({b,d:Math.hypot(b.x-focus.x,b.y-focus.y)}))
   .filter(e=>e.d<radius).sort((a,b)=>a.d-b.d||a.b.id-b.b.id)
   .slice(0,Math.max(0,limit-pilot.length)).map(x=>x.b);
 return{pilot,buildings:[...pilot,...other],focus};
}
function cameraPoint(target,azimuth,height,distance){
 // THREE coordinates: X=world x, Y=height, Z=world y.
 // `distance` is HORIZONTAL radial distance, so changing elevation never
 // moves the camera unpredictably into a building.
 return{x:target.x+Math.sin(azimuth)*distance,y:height,
  z:target.z+Math.cos(azimuth)*distance};
}
function isTap(start,end,threshold=9){
 return !!start&&!!end&&start.id===end.id&&start.button===0&&!start.multi&&
  Math.hypot(end.x-start.x,end.y-start.y)<=threshold;
}

// Resolve camera eye against the canonical extruded lot volumes, not sprite bounds.
// Iterate because adjacent tenements can share walls and an exit can enter a neighbour.
function pointInsideFootprint(p,poly){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.y>p.z)!==(b.y>p.z)&&p.x<(b.x-a.x)*(p.z-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
function resolveCameraCollision(position,buildings,clearance=3){
 const p={x:position.x,y:position.y,z:position.z};
 for(let pass=0;pass<12;pass++){
  let moved=false;
  for(const b of buildings){
   if(p.y>b.z+clearance||!pointInsideFootprint(p,b.poly))continue;
   let best=null;
   for(let i=0;i<b.poly.length;i++){
    const a=b.poly[i],c=b.poly[(i+1)%b.poly.length];
    const dx=c.x-a.x,dz=c.y-a.y,len2=dx*dx+dz*dz||1;
    const t=clamp(((p.x-a.x)*dx+(p.z-a.y)*dz)/len2,0,1);
    const qx=a.x+t*dx,qz=a.y+t*dz;
    const d2=(p.x-qx)**2+(p.z-qz)**2;
    if(!best||d2<best.d2)best={qx,qz,d2,dx,dz};
   }
   if(!best)continue;
   const cx=b.poly.reduce((n,v)=>n+v.x,0)/b.poly.length;
   const cz=b.poly.reduce((n,v)=>n+v.y,0)/b.poly.length;
   let nx=best.qx-cx,nz=best.qz-cz,mag=Math.hypot(nx,nz);
   if(mag<1e-8){nx=-best.dz;nz=best.dx;mag=Math.hypot(nx,nz)||1}
   p.x=best.qx+nx/mag*clearance;
   p.z=best.qz+nz/mag*clearance;
   moved=true;
  }
  if(!moved)break;
 }
 return p;
}
function evaluateGeometry(buildings){
 let vertices=0;
 for(const b of buildings){
  if(b.poly.length!==4||!Number.isFinite(b.z)||b.z<=0)throw new Error("Invalid building "+b.id);
  for(const p of b.poly)if(!Number.isFinite(p.x)||!Number.isFinite(p.y))throw new Error("Nonfinite polygon "+b.id);
  vertices+=8;
 }
 return{buildings:buildings.length,vertices};
}
return{PILOT_IDS,clamp,angleDeg,center,segmentDistance,doorEdgeIndex,cluster,cameraPoint,isTap,evaluateGeometry,pointInsideFootprint,resolveCameraCollision};
})();
if(typeof window!=="undefined")window.QOStreetWebGLCore=QOStreetWebGLCore;
if(typeof module!=="undefined"&&module.exports)module.exports=QOStreetWebGLCore;
