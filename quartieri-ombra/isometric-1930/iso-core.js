/* A parallel original isometric art experiment. No change to the main game. */
const QOChicagoIsoCore=(function(){
"use strict";
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const sq=(x)=>x*x;
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function pointInsidePolygon(point,poly){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.y>point.y)!==(b.y>point.y) && point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
function chooseBuildings(world,focus=world.hub,limit=38,radius=470){
 return world.buildings.map(b=>({b,d:dist(b,focus)}))
  .filter(item=>item.d<=radius)
  .sort((a,b)=>a.d-b.d||a.b.id-b.b.id)
  .slice(0,limit).map(({b})=>b);
}
function chooseInterior(buildings,focus){
 const candidates=buildings.filter(b=>["shop","tavern","residence"].includes(b.type));
 return (candidates.length?candidates:buildings).slice().sort((a,b)=>dist(a,focus)-dist(b,focus))[0];
}
function facingWalls(building,eye){
 const result=[];
 for(let i=0;i<4;i++){
  const a=building.poly[i],b=building.poly[(i+1)%4];
  const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  const nx=mid.x-building.x,ny=mid.y-building.y;
  if(nx*(eye.x-building.x)+ny*(eye.z-building.y)>0)result.push(i);
 }
 return result;
}
function cameraOrbit(focus,angle=45,distance=540,height=490){
 const t=angle*Math.PI/180;
 return{x:focus.x+Math.sin(t)*distance,y:height,z:focus.y+Math.cos(t)*distance};
}
function footprint(b){return b.poly.map(p=>({x:p.x,z:p.y}))}
function seedNoise(seed){
 let t=(seed>>>0)||1;
 return()=>{t=(Math.imul(t,1664525)+1013904223)>>>0;return t/4294967296};
}
function placementOnBuilding(b,u,v){
 const p=b.poly,a=p[0],edgeU={x:p[1].x-a.x,y:p[1].y-a.y},edgeV={x:p[3].x-a.x,y:p[3].y-a.y};
 return{x:a.x+edgeU.x*u+edgeV.x*v,y:a.y+edgeU.y*u+edgeV.y*v};
}
return{clamp,dist,pointInsidePolygon,chooseBuildings,chooseInterior,facingWalls,cameraOrbit,footprint,seedNoise,placementOnBuilding};
})();
if(typeof window!=="undefined")window.QOChicagoIsoCore=QOChicagoIsoCore;
if(typeof module!=="undefined"&&module.exports)module.exports=QOChicagoIsoCore;