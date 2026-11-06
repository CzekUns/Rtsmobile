/* Quartieri d'Ombra — WebGL street-level geometry lab, Three.js r187 (MIT).
 * All surfaces are real 3D geometry based on QOBoardWorld. WebGL depth testing
 * resolves walls/roofs at 255 degrees; zero painter-sorting or sprite alignment.
 */
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

const $=id=>document.getElementById(id);
const host=$("viewport"),status=$("status");
const world=window.QOBoardWorld,Core=window.QOStreetWebGLCore;
if(!world||!Core)throw new Error("Missing QOBoardWorld or street-webgl-core.js");
const data=world.generate(1860);
Core.evaluateGeometry(data.buildings);
const START=Core.streetSpawn(data,42,27);
const focus={x:data.hub.x,y:data.hub.y};
const scene=new THREE.Scene();
scene.background=new THREE.Color("#41464a");
scene.fog=new THREE.FogExp2("#5b574d",0.00125);
const camera=new THREE.PerspectiveCamera(63,1,0.3,2500);
const TARGET=new THREE.Vector3(START.target.x,START.target.y,START.target.z);
let renderer;
try{
 renderer=new THREE.WebGLRenderer({alpha:false,antialias:true,depth:true,stencil:false,powerPreference:"high-performance"});
}catch(error){
 status.textContent="WebGL2 non disponibile su questo dispositivo: "+error.message;
 throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
renderer.setSize(Math.max(1,host.clientWidth),Math.max(1,host.clientHeight),false);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
renderer.setClearColor("#41464a");
host.appendChild(renderer.domElement);
renderer.domElement.style.touchAction="none";

scene.add(new THREE.HemisphereLight("#e2d2b9","#4c3d35",2.05));
const sun=new THREE.DirectionalLight("#ffdb9b",2.3);
sun.position.set(focus.x-190,330,focus.y+190);scene.add(sun);
const bounce=new THREE.DirectionalLight("#9caeb3",0.6);
bounce.position.set(focus.x+130,130,focus.y-110);scene.add(bounce);

const mats={
 ground:new THREE.MeshStandardMaterial({color:"#524c3f",roughness:1,side:THREE.DoubleSide}),
 road:new THREE.MeshStandardMaterial({color:"#292c2d",roughness:.96,side:THREE.DoubleSide}),
 sidewalk:new THREE.MeshStandardMaterial({color:"#776856",roughness:1}),
 trim:new THREE.MeshStandardMaterial({color:"#9c846c",roughness:.95}),
 entry:new THREE.MeshStandardMaterial({color:"#392b25",roughness:.98,side:THREE.DoubleSide}),
 glassDark:new THREE.MeshStandardMaterial({color:"#2e3438",roughness:.3,metalness:.08,side:THREE.DoubleSide}),
 glassLit:new THREE.MeshBasicMaterial({color:"#d8a45f",side:THREE.DoubleSide}),
 glassBlue:new THREE.MeshBasicMaterial({color:"#6f7774",side:THREE.DoubleSide}),
 iron:new THREE.MeshStandardMaterial({color:"#252a28",metalness:.6,roughness:.48}),
 lamp:new THREE.MeshBasicMaterial({color:"#ffd59a"}),
};
const detailGroup=new THREE.Group();scene.add(detailGroup);
const pickMeshes=[],buildingsById=new Map(),selectionEdges=new Map();
const renderedBuildings=new Map();
const plane=new THREE.Mesh(new THREE.PlaneGeometry(data.width+240,data.height+240),mats.ground);
plane.rotation.x=-Math.PI/2;
plane.position.set(data.width/2,-1.1,data.height/2);
scene.add(plane);
const axisY=new THREE.Vector3(0,1,0),tmpA=new THREE.Vector3(),tmpB=new THREE.Vector3();
const quadGeometry=points=>{
 const p=points.map(q=>new THREE.Vector3(q.x,q.y,q.z));
 const verts=[...p[0].toArray(),...p[1].toArray(),...p[2].toArray(),
  ...p[0].toArray(),...p[2].toArray(),...p[3].toArray()];
 const geo=new THREE.BufferGeometry();
 geo.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
 geo.computeVertexNormals();
 return geo;
};
function quad(points,material,parent,userData=null){
 const mesh=new THREE.Mesh(quadGeometry(points),material);
 if(userData)Object.assign(mesh.userData,userData);
 parent.add(mesh);
 return mesh;
}
const p3=(p,y)=>({x:p.x,y,z:p.y});
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const facePanel=(a,b,normal,t0,t1,y0,y1,offset=.22)=>{
 const left=lerp(a,b,t0),right=lerp(a,b,t1);
 return[
 {x:left.x+normal.x*offset,y:y0,z:left.z+normal.z*offset},
 {x:right.x+normal.x*offset,y:y0,z:right.z+normal.z*offset},
 {x:right.x+normal.x*offset,y:y1,z:right.z+normal.z*offset},
 {x:left.x+normal.x*offset,y:y1,z:left.z+normal.z*offset}
 ];
};
function edgeNormal(b,i){
 const a=b.poly[i],c=b.poly[(i+1)%4];
 const dx=c.x-a.x,dz=c.y-a.y,len=Math.hypot(dx,dz)||1;
 let nx=-dz/len,nz=dx/len;
 if(nx*((a.x+c.x)/2-b.x)+nz*((a.y+c.y)/2-b.y)<0){nx=-nx;nz=-nz}
 return new THREE.Vector3(nx,0,nz);
}
function beam(a,b,y,depth,width,mat,parent,normal){
 const length=Math.hypot(b.x-a.x,b.z-a.z);
 const mid=new THREE.Vector3((a.x+b.x)/2,y,(a.z+b.z)/2).addScaledVector(normal,depth/2);
 const shape=new THREE.Mesh(new THREE.BoxGeometry(length,width,depth),mat);
 shape.position.copy(mid);shape.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);
 parent.add(shape);return shape;
}
function addFacadeDetails(b,group){
 const doorEdge=Core.doorEdgeIndex(b),step=b.z/b.floors;
 const active=(b.type==="shop"||b.type==="tavern"||b.shopfront);
 for(let i=0;i<4;i++){
  const next=(i+1)%4,a=p3(b.poly[i],0),c=p3(b.poly[next],0);
  const length=Math.hypot(c.x-a.x,c.z-a.z),normal=edgeNormal(b,i);
  const bays=Core.clamp(Math.floor(length/15),1,4);
  const floorCount=Math.min(6,b.floors);
  // No decorative repeating SVG patterns: details are real facade geometry.
  for(let floor=0;floor<floorCount;floor++){
   for(let bay=0;bay<bays;bay++){
    if(floor===0&&i===doorEdge&&bay===Math.floor(bays/2))continue;
    const t0=(bay+.22)/bays,t1=(bay+.78)/bays;
    const y0=(floor+.25)*step,y1=Math.min(b.z-3,(floor+.77)*step);
    if(y1<=y0)continue;
    const lit=((b.seed+floor*3+bay*7+i)%7)<2;
    const geom=facePanel(a,c,normal,t0,t1,y0,y1,.31);
    quad(geom,lit?mats.glassLit:mats.glassDark,group);
    beam(geom[0],geom[1],y0-.42,.8,.9,mats.trim,group,normal);
   }
  }
  // Stone coping connects to the true wall edge, not an image bounding box.
  beam(a,c,b.z-1.4,2.3,2.4,mats.trim,group,normal);
  if(i===doorEdge){
   const dt=.5,tw=Math.min(.12,4.0/length);
   quad(facePanel(a,c,normal,dt-tw,dt+tw,.6,Math.min(11,b.z*.3),.44),
    mats.entry,group);
   const entry=lerp(a,c,.5);
   const stepMesh=new THREE.Mesh(new THREE.BoxGeometry(9,1.6,4.5),mats.sidewalk);
   stepMesh.position.set(entry.x+normal.x*2.5,.5,entry.z+normal.z*2.5);
   stepMesh.rotation.y=-Math.atan2(c.z-a.z,c.x-a.x);
   group.add(stepMesh);
   if(active){
    const light=new THREE.Mesh(new THREE.SphereGeometry(1.6,9,8),mats.lamp);
    light.position.set(entry.x+normal.x*1.4,12,entry.z+normal.z*1.4);
    group.add(light);
   }
  }
 }
}
function addBuilding(b,priority){
 const container=new THREE.Group();scene.add(container);container.userData.lotId=b.id;
 const wallMaterial=new THREE.MeshStandardMaterial({color:new THREE.Color(b.wall),roughness:.97,side:THREE.DoubleSide});
 const roofMaterial=new THREE.MeshStandardMaterial({color:new THREE.Color(b.roof),roughness:.92,side:THREE.DoubleSide});
 const bottom=b.poly.map(p=>p3(p,0)),top=b.poly.map(p=>p3(p,b.z));
 for(let i=0;i<4;i++){
  const j=(i+1)%4;
  const m=quad([bottom[i],bottom[j],top[j],top[i]],wallMaterial,container,{lotId:b.id});
  pickMeshes.push(m);
 }
 pickMeshes.push(quad([top[0],top[1],top[2],top[3]],roofMaterial,container,{lotId:b.id}));
 // Each building's detail group will now be owned and disposed by its streaming node.
 // Exact footprint/roof highlight. Geometry is reused, no approximated AABB.
 const selectedMaterial=new THREE.LineBasicMaterial({color:"#ffe2a2",depthTest:true,transparent:true,opacity:.97});
 const points=[];
 for(let i=0;i<4;i++){
  let j=(i+1)%4;
  for(const [a,c] of [[top[i],top[j]],[bottom[i],bottom[j]],[bottom[i],top[i]]])
   points.push(a.x,a.y,a.z,c.x,c.y,c.z);
 }
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(points,3));
 const selection=new THREE.LineSegments(g,selectedMaterial);
 selection.visible=false;scene.add(selection);selectionEdges.set(b.id,selection);
 buildingsById.set(b.id,b);
 const node={container,selection,details:null,wallMaterial,roofMaterial};
 renderedBuildings.set(b.id,node);
 if(priority)setDetails(b,node,true);
}
function disposeGeometry(group){
 group.traverse(node=>{if(node.geometry)node.geometry.dispose()});
}
function setDetails(b,node,enabled){
 if(enabled&&!node.details){
  node.details=new THREE.Group();
  detailGroup.add(node.details);
  addFacadeDetails(b,node.details);
 }else if(!enabled&&node.details){
  detailGroup.remove(node.details);disposeGeometry(node.details);
  node.details=null;
 }
}
function unloadBuilding(id){
 const node=renderedBuildings.get(id);
 if(!node)return;
 if(node.details)setDetails(buildingsById.get(id),node,false);
 scene.remove(node.container);disposeGeometry(node.container);
 node.wallMaterial.dispose();node.roofMaterial.dispose();
 scene.remove(node.selection);disposeGeometry(node.selection);node.selection.material.dispose();
 for(let i=pickMeshes.length-1;i>=0;i--)
  if(pickMeshes[i].userData.lotId===id)pickMeshes.splice(i,1);
 renderedBuildings.delete(id);selectionEdges.delete(id);buildingsById.delete(id);
 if(chosenId===id)chooseBuilding(null);
}
let lastStreamCenter=null,lastStreamRadius=0;
function updateVisibleCity(force=false){
 const p={x:camera.position.x,z:camera.position.z};
 const offset=camera.position.clone().sub(controls.target);
 const horizontal=Math.hypot(offset.x,offset.z);
 const radius=Core.clamp(420+horizontal*.7,440,760);
 if(!force&&lastStreamCenter&&Math.hypot(p.x-lastStreamCenter.x,p.z-lastStreamCenter.z)<45&&
  Math.abs(radius-lastStreamRadius)<35)return;
 lastStreamCenter=p;lastStreamRadius=radius;
 const nearby=Core.nearbyBuildings(data.buildings,p,radius,120);
 const desired=new Set(nearby.map(b=>b.id));
 for(const id of [...renderedBuildings.keys()])if(!desired.has(id))unloadBuilding(id);
 for(const b of nearby){
  const d=Math.hypot(b.x-p.x,b.y-p.z);
  if(!renderedBuildings.has(b.id))addBuilding(b,d<165);
  else{
   const node=renderedBuildings.get(b.id);
   if(d<165)setDetails(b,node,true);
   if(d>230)setDetails(b,node,false);
  }
 }
}
const roadSegments=[];
const distanceToFocus=p=>Math.hypot(p.x-focus.x,p.y-focus.y);
for(const road of data.roads)for(let i=1;i<road.points.length;i++){
 const a=road.points[i-1],b=road.points[i];
 const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
 const nx=-dy/len*road.width/2,nz=dx/len*road.width/2;
 quad([
  {x:a.x+nx,y:-.52,z:a.y+nz},{x:b.x+nx,y:-.52,z:b.y+nz},
  {x:b.x-nx,y:-.52,z:b.y-nz},{x:a.x-nx,y:-.52,z:a.y-nz}
 ],mats.road,scene);
 roadSegments.push(road.id);
}
function streetLamp(x,z){
 const root=new THREE.Group();root.position.set(x,0,z);
 const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.6,.95,17,8),mats.iron);
 shaft.position.y=8.5;root.add(shaft);
 const head=new THREE.Mesh(new THREE.BoxGeometry(3.7,3.3,3.7),mats.iron);
 head.position.y=17.5;root.add(head);
 const glow=new THREE.Mesh(new THREE.SphereGeometry(1.45,10,8),mats.lamp);
 glow.position.y=17.7;root.add(glow);
 scene.add(root);
}
const lamps=data.props.filter(p=>p.type==="streetLamp");
lamps.forEach(p=>streetLamp(p.x,p.y));
if(lamps.length<3)for(const b of Core.cluster(data).pilot.slice(0,3))streetLamp(b.door.x+9,b.door.y+7);

const controls=new OrbitControls(camera,renderer.domElement);
controls.target.copy(TARGET);
controls.enableDamping=true;controls.dampingFactor=.085;
controls.enablePan=true;
controls.screenSpacePanning=false;
controls.panSpeed=.7;
// The previous 540-unit clamp was relative to world (0,0), not Cross Street,
 // and prevented travel through the 2700×2100 map.
controls.maxTargetRadius=Infinity;
controls.minDistance=16;controls.maxDistance=540;
controls.minPolarAngle=1.08;controls.maxPolarAngle=1.56;
controls.rotateSpeed=.62;controls.zoomSpeed=.9;
function keepCameraOutside(){
 const safe=Core.resolveCameraCollision(camera.position,data.buildings,3);
 // If the eye touches a wall, move the look-at point with the eye to avoid
 // jerking the camera orientation or restoring the blocked offset next frame.
 const dx=safe.x-camera.position.x,dz=safe.z-camera.position.z;
 camera.position.set(safe.x,safe.y,safe.z);
 controls.target.x+=dx;controls.target.z+=dz;
}
function setCamera(azimuth,height,dist){
 const p=Core.cameraPoint({x:controls.target.x,z:controls.target.z},azimuth,height,dist);
 camera.position.set(p.x,p.y,p.z);
 camera.lookAt(controls.target);
 controls.update();
 keepCameraOutside();
}
camera.position.set(START.eye.x,START.eye.y,START.eye.z);
camera.lookAt(TARGET);controls.update();keepCameraOutside();
const heightEl=$("height"),distanceEl=$("distance");
// Left thumbstick is deliberately outside the WebGL canvas: OrbitControls
// continues to own one-finger orbit, while movement owns a separate pointer.
const stickEl=$("move-stick"),stickThumb=$("move-stick-thumb");
let stickPointerId=null,stickAxes={x:0,y:0};
function stickReset(){
 stickPointerId=null;stickAxes={x:0,y:0};
 stickThumb.style.transform="translate(0px, 0px)";
 stickEl.classList.remove("active");
}
function updateStick(e){
 const rect=stickEl.getBoundingClientRect();
 const radius=Math.min(rect.width,rect.height)*.32;
 stickAxes=Core.joystickAxes(e.clientX-rect.left-rect.width/2,
  rect.top+rect.height/2-e.clientY,radius);
 stickThumb.style.transform=`translate(${Math.round(stickAxes.x*radius)}px,${Math.round(-stickAxes.y*radius)}px)`;
}
stickEl.addEventListener("pointerdown",e=>{
 if(stickPointerId!==null||e.button!==0)return;
 e.preventDefault();e.stopPropagation();
 stickPointerId=e.pointerId;stickEl.setPointerCapture(e.pointerId);
 stickEl.classList.add("active");updateStick(e);
});
stickEl.addEventListener("pointermove",e=>{
 if(e.pointerId!==stickPointerId)return;
 e.preventDefault();updateStick(e);
});
function stopStick(e){
 if(e.pointerId!==stickPointerId)return;
 e.preventDefault();stickReset();
 if(stickEl.hasPointerCapture(e.pointerId))stickEl.releasePointerCapture(e.pointerId);
}
for(const name of ["pointerup","pointercancel","lostpointercapture"])
 stickEl.addEventListener(name,stopStick);
window.addEventListener("blur",stickReset);
document.addEventListener("visibilitychange",()=>{if(document.hidden)stickReset()});
// Optional keyboard equivalent for desktop QA; does not affect inputs or OrbitControls.
stickEl.addEventListener("keydown",e=>{
 const directions={ArrowUp:[0,1],ArrowDown:[0,-1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
 if(!directions[e.key])return;
 e.preventDefault();stickAxes={x:directions[e.key][0],y:directions[e.key][1]};
 stickThumb.style.transform=`translate(${stickAxes.x*34}px,${-stickAxes.y*34}px)`;
});
stickEl.addEventListener("keyup",e=>{if(e.key.startsWith("Arrow"))stickReset()});
function stepStickMovement(seconds){
 if(!stickAxes.x&&!stickAxes.y)return;
 const offset=camera.position.clone().sub(controls.target);
 const movement=Core.joystickDisplacement({x:offset.x,z:offset.z},stickAxes,112,seconds);
 const destination=Core.clampToWorld({
  x:camera.position.x+movement.x,y:camera.position.y,z:camera.position.z+movement.z
 },data,18);
 const next=Core.resolveCameraCollision(destination,data.buildings,3);
 const dx=next.x-camera.position.x,dz=next.z-camera.position.z;
 camera.position.x=next.x;camera.position.z=next.z;
 controls.target.x+=dx;controls.target.z+=dz;
}
let lastUiState="";
function updateHUD(){
 const delta=camera.position.clone().sub(controls.target);
 const angle=Math.round(Core.angleDeg(Math.atan2(delta.x,delta.z)));
 const altitude=Math.round(camera.position.y);
 const horizontal=Math.round(Math.hypot(delta.x,delta.z));
 const sectorX=Math.min(3,Math.max(1,Math.ceil(camera.position.x/(data.width/3))));
 const sectorZ=Math.min(3,Math.max(1,Math.ceil(camera.position.z/(data.height/3))));
 const next=`${angle}° · quota ${altitude} · settore ${sectorX}×${sectorZ} · ${renderedBuildings.size}/${data.buildings.length} edifici visibili`;
 if(next!==lastUiState){status.textContent=next;lastUiState=next}
 heightEl.value=String(Core.clamp(altitude,+heightEl.min,+heightEl.max));
 distanceEl.value=String(Core.clamp(horizontal,+distanceEl.min,+distanceEl.max));
 $("height-value").textContent=String(altitude);
 $("distance-value").textContent=String(horizontal);
}
function viewAt(angle){
 const offset=camera.position.clone().sub(controls.target);
 const horizontal=Math.max(65,Math.hypot(offset.x,offset.z));
 setCamera(angle*Math.PI/180,camera.position.y,horizontal);
 updateHUD();
}
$("turn90").addEventListener("click",()=>{
 const d=camera.position.clone().sub(controls.target);
 viewAt(Core.angleDeg(Math.atan2(d.x,d.z))+90);
});
$("test255").addEventListener("click",()=>viewAt(255));
$("reset").addEventListener("click",()=>{
 controls.target.copy(TARGET);
 camera.position.set(START.eye.x,START.eye.y,START.eye.z);
 camera.lookAt(TARGET);controls.update();keepCameraOutside();
 updateVisibleCity(true);chooseBuilding(null);updateHUD();
});
heightEl.addEventListener("input",()=>{
 const d=camera.position.clone().sub(controls.target);
 setCamera(Math.atan2(d.x,d.z),+heightEl.value,Math.hypot(d.x,d.z));
 updateHUD();
});
distanceEl.addEventListener("input",()=>{
 const d=camera.position.clone().sub(controls.target);
 setCamera(Math.atan2(d.x,d.z),camera.position.y,+distanceEl.value);
 updateHUD();
});
$("details").addEventListener("click",()=>{
 detailGroup.visible=!detailGroup.visible;
 $("details").textContent="Dettagli: "+(detailGroup.visible?"sì":"no");
 $("details").setAttribute("aria-pressed",String(detailGroup.visible));
});
let chosenId=null;
function chooseBuilding(id){
 chosenId=id;
 for(const [key,edges] of selectionEdges)edges.visible=id===key;
 const b=id===null?null:buildingsById.get(id);
 $("selected-title").textContent=b?"Lotto "+(b.id+1)+" · "+b.type:"Cross Street";
 $("selected-text").textContent=b
  ?b.road+" · "+b.floors+" piani · hitbox 3D reale · nessun asset raster"
  :"Tocca una facciata per selezionare un edificio.";
}
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
let pointerStart=null;
const activePointers=new Set();
renderer.domElement.addEventListener("pointerdown",e=>{
 activePointers.add(e.pointerId);
 if(activePointers.size>1&&pointerStart)pointerStart.multi=true;
 if(activePointers.size===1&&e.button===0)
  pointerStart={id:e.pointerId,button:e.button,x:e.clientX,y:e.clientY,multi:false};
});
renderer.domElement.addEventListener("pointercancel",e=>{
 activePointers.delete(e.pointerId);pointerStart=null;
});
renderer.domElement.addEventListener("pointerup",e=>{
 activePointers.delete(e.pointerId);
 const start=pointerStart;
 if(start?.id===e.pointerId)pointerStart=null;
 if(!Core.isTap(start,{id:e.pointerId,x:e.clientX,y:e.clientY},9))return;
 const box=renderer.domElement.getBoundingClientRect();
 mouse.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);
 raycaster.setFromCamera(mouse,camera);
 const hit=raycaster.intersectObjects(pickMeshes,false)[0];
 chooseBuilding(hit?hit.object.userData.lotId:null);
});
function resize(){
 const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
 camera.aspect=w/h;camera.updateProjectionMatrix();
 renderer.setSize(w,h,false);
 document.documentElement.style.setProperty("--webgl-hud-height",
  Math.ceil($("webgl-controls").getBoundingClientRect().height)+"px");
}
window.addEventListener("resize",resize);
if(typeof ResizeObserver!=="undefined")new ResizeObserver(resize).observe($("webgl-controls"));
resize();updateVisibleCity(true);updateHUD();window.__qoWebGLReady=true;
let stopped=false,frameRequested=false,lastFrameTime=null;
function requestFrame(){
 if(stopped||frameRequested)return;
 frameRequested=true;
 requestAnimationFrame(frame);
}
renderer.domElement.addEventListener("webglcontextlost",event=>{
 event.preventDefault();
 stopped=true;lastFrameTime=null;stickReset();
 status.textContent="Contesto WebGL perso: rendering sospeso, attendo il ripristino grafico…";
});
renderer.domElement.addEventListener("webglcontextrestored",()=>{
 stopped=false;lastFrameTime=null;
 lastUiState="";
 status.textContent="Contesto WebGL ripristinato: ripresa del rendering.";
 resize();
 requestFrame();
});
function frame(now){
 frameRequested=false;
 if(stopped)return;
 const delta=lastFrameTime===null?0:Math.max(0,Math.min(.05,(now-lastFrameTime)/1000));
 lastFrameTime=now;
 if(!document.hidden){
  controls.update();
  stepStickMovement(delta);
  keepCameraOutside();
  updateVisibleCity();
  renderer.render(scene,camera);
  updateHUD();
 }
 requestFrame();
}
requestFrame();
