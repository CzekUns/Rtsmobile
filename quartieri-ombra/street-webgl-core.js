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
function evaluateGeometry(buildings){
 let vertices=0;
 for(const b of buildings){
  if(b.poly.length!==4||!Number.isFinite(b.z)||b.z<=0)throw new Error("Invalid building "+b.id);
  for(const p of b.poly)if(!Number.isFinite(p.x)||!Number.isFinite(p.y))throw new Error("Nonfinite polygon "+b.id);
  vertices+=8;
 }
 return{buildings:buildings.length,vertices};
}
return{PILOT_IDS,clamp,angleDeg,center,segmentDistance,doorEdgeIndex,cluster,cameraPoint,isTap,evaluateGeometry};
})();
if(typeof window!=="undefined")window.QOStreetWebGLCore=QOStreetWebGLCore;
if(typeof module!=="undefined"&&module.exports)module.exports=QOStreetWebGLCore;
