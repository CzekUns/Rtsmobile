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

// Sweep the eye along joystick travel so a fast frame cannot jump through
// a narrow tenement. Stop before the first solid canonical footprint.
function sweepCameraMovement(start,end,buildings,clearance=3){
 const dx=end.x-start.x,dz=end.z-start.z;
 const length=Math.hypot(dx,dz);
 if(!Number.isFinite(length)||!Number.isFinite(start.y))return {...start};
 const steps=Math.max(1,Math.ceil(length/Math.max(1,clearance*.65)));
 const safeStart=resolveCameraCollision(start,buildings,clearance);
 let last=safeStart;
 for(let i=1;i<=steps;i++){
  const t=i/steps;
  const candidate={x:safeStart.x+(end.x-start.x)*t,y:end.y,
   z:safeStart.z+(end.z-start.z)*t};
  const blocked=buildings.some(b=>candidate.y<=b.z+clearance&&
   pointInsideFootprint(candidate,b.poly));
  if(blocked)return last;
  last=candidate;
 }
 return last;
}
// Normalize the mobile joystick into a circular -1..1 input, with a dead zone
// to avoid drifting if the player's thumb rests near the center.
function joystickAxes(dx,dy,radius=38,deadzone=.14){
 if(![dx,dy,radius,deadzone].every(Number.isFinite)||radius<=0) return{x:0,y:0};
 const x=dx/radius,y=dy/radius;
 const mag=Math.hypot(x,y);
 const safeDeadzone=clamp(deadzone,0,.95);
 if(mag<=safeDeadzone)return{x:0,y:0};
 const strength=clamp((mag-safeDeadzone)/(1-safeDeadzone),0,1);
 return{x:x/mag*strength,y:y/mag*strength};
}
// Joystick up follows the camera's horizontal look direction, not world north.
// Three.js uses X/Z ground axes, Y elevation. Both the eye and target move.
function joystickDisplacement(cameraOffset,axes,speed,seconds){
 const dist=Math.hypot(cameraOffset.x,cameraOffset.z);
 if(!dist||!Number.isFinite(dist)||!Number.isFinite(speed)||!Number.isFinite(seconds)||seconds<=0)return{x:0,z:0};
 const forwardX=-cameraOffset.x/dist,forwardZ=-cameraOffset.z/dist;
 const rightX=-forwardZ,rightZ=forwardX;
 const side=clamp(axes.x||0,-1,1),forward=clamp(axes.y||0,-1,1);
 const amount=Math.max(0,speed)*Math.min(seconds,.05);
 return{x:(rightX*side+forwardX*forward)*amount,
  z:(rightZ*side+forwardZ*forward)*amount};
}
// Start INSIDE the real street junction, looking along Cross Street.
// The previous orbit lab started hundreds of world units away from its focus.
function streetSpawn(world,lookAhead=42,height=27){
 const h=world.hub,road=world.roads.find(r=>r.name==="Cross Street")||world.roads[0];
 const a=road.points[0],b=road.points[1];
 const dist=Math.hypot(b.x-a.x,b.y-a.y)||1;
 const length=clamp(lookAhead,18,80);
 return{eye:{x:h.x,y:height,z:h.y},
  target:{x:h.x+(b.x-a.x)/dist*length,y:Math.min(18,height-3),z:h.y+(b.y-a.y)/dist*length}};
}
// This is display-only streaming: ALL canonical lots remain in world state.
// Stable ordering and a capped count make navigation on lower-end phones viable.
function nearbyBuildings(buildings,location,radius=480,limit=100){
 if(!Number.isFinite(location.x)||!Number.isFinite(location.z)||radius<=0)return[];
 return buildings.map(b=>({b,d:Math.hypot(b.x-location.x,b.y-location.z)}))
  .filter(v=>v.d<=radius).sort((a,b)=>a.d-b.d||a.b.id-b.b.id)
  .slice(0,Math.max(0,limit)).map(v=>v.b);
}
function clampToWorld(p,world,margin=12){
 return{x:clamp(p.x,margin,world.width-margin),y:p.y,
  z:clamp(p.z,margin,world.height-margin)};
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
return{PILOT_IDS,clamp,angleDeg,center,segmentDistance,doorEdgeIndex,cluster,cameraPoint,isTap,evaluateGeometry,pointInsideFootprint,resolveCameraCollision,sweepCameraMovement,joystickAxes,joystickDisplacement,streetSpawn,nearbyBuildings,clampToWorld};
})();
if(typeof window!=="undefined")window.QOStreetWebGLCore=QOStreetWebGLCore;
if(typeof module!=="undefined"&&module.exports)module.exports=QOStreetWebGLCore;
