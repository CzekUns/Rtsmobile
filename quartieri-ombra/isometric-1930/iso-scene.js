/* Quartieri d'Ombra — original Chicago-era tactile isometric style experiment.
 * Inspired by the visual grammar of 2003 tactics games, never uses copyrighted art.
 * Distinct entrypoint and assets: original WebGL lab and game are untouched.
 */
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
const $=id=>document.getElementById(id);
const Core=window.QOChicagoIsoCore,World=window.QOBoardWorld;
if(!Core||!World)throw Error("Missing independent ISO core or canonical Five Points world");
const world=World.generate(1860),focus={x:world.hub.x+24,y:world.hub.y-15};
const lots=Core.chooseBuildings(world,focus,26,405);
const starter=Core.chooseInterior(lots,focus);
if(!starter)throw Error("No buildings found for isometric block");
const host=$("game"),scene=new THREE.Scene();
scene.background=new THREE.Color("#333b39");
scene.fog=new THREE.Fog("#363d3a",650,1600);
const camera=new THREE.OrthographicCamera(-320,320,240,-240,1,3200);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
host.appendChild(renderer.domElement);
renderer.domElement.style.touchAction="none";
scene.add(new THREE.HemisphereLight("#d6d9cb","#3f3029",2.25));
const key=new THREE.DirectionalLight("#f6d6a6",2.55);
key.position.set(focus.x-330,520,focus.y+170);scene.add(key);
const fill=new THREE.DirectionalLight("#7d969c",.9);
fill.position.set(focus.x+300,280,focus.y-250);scene.add(fill);
const rand=Core.seedNoise;
function texture(kind,seed){
 const c=document.createElement("canvas");c.width=c.height=256;
 const g=c.getContext("2d");if(!g)throw Error("Canvas texture unavailable");
 const r=rand(seed),R=(a,b)=>a+(b-a)*r();
 const palettes={
  brick:["#50382e","#5f4335","#6c4c3b","#74513c","#60473a"],
  cobble:["#494941","#51514c","#59564d","#686457","#747061"],
  roof:["#363a39","#454747","#4d4a48","#52514c","#3b3d3c"],
  planks:["#4b352c","#664a36","#75533c","#593e30","#816047"],
  plaster:["#8a7d68","#9e8e73","#a4957a","#94836b"],
  tile:["#807a6b","#978b76","#a69b85","#6a675f"],
  carpet:["#633c36","#7d4e3c","#895b43","#382f36"],
  earth:["#524d3f","#66604e","#555347","#49483f"]
 };
 const palette=palettes[kind]||palettes.earth;
 g.fillStyle=palette[0];g.fillRect(0,0,256,256);
 if(kind==="brick"){
  g.fillStyle="#342922";g.fillRect(0,0,256,256);
  for(let row=0;row<17;row++){
   const y=row*15,offset=row%2?15:0;
   for(let x=-30+offset;x<257;x+=31){
    g.fillStyle=palette[Math.floor(R(0,palette.length))];
    g.fillRect(x+1,y+1,29,13);
    g.fillStyle="#a68161";g.globalAlpha=.19;g.fillRect(x+2,y+1,27,1);g.globalAlpha=1;
    g.fillStyle="#201b19";g.globalAlpha=.12;g.fillRect(x+2,y+12,27,1);g.globalAlpha=1;
   }
  }
 }else if(kind==="roof"){
  for(let row=0;row<21;row++)for(let x=-20+(row%2)*9;x<270;x+=20){
   g.fillStyle=palette[Math.floor(R(0,palette.length))];
   g.fillRect(x+1,row*12+1,19,11);
   g.fillStyle="#9d9a8a";g.globalAlpha=.17;g.fillRect(x+1,row*12+1,19,1);g.globalAlpha=1;
   g.fillStyle="#161919";g.fillRect(x+1,row*12+11,19,1);
  }
 }else if(kind==="cobble"){
  g.fillStyle="#2b302f";g.fillRect(0,0,256,256);
  for(let y=0;y<256;y+=15)for(let x=-24+(y%30?12:0);x<262;x+=29){
   const w=R(21,28),h=R(10,15);
   g.fillStyle=palette[Math.floor(R(0,palette.length))];
   g.beginPath();g.roundRect(x+R(0,2),y+R(0,2),w,h,2);g.fill();
   g.strokeStyle="#8d8a7c";g.globalAlpha=.20;g.stroke();g.globalAlpha=1;
  }
 }else if(kind==="planks"){
  g.fillStyle="#382820";g.fillRect(0,0,256,256);
  for(let y=0;y<256;y+=19){
   g.fillStyle=palette[Math.floor(R(0,palette.length))];g.fillRect(0,y+1,256,17);
   g.fillStyle="#1b1b18";g.fillRect(0,y,256,1);
   for(let k=0;k<7;k++){
    g.strokeStyle="#261f1a";g.globalAlpha=R(.10,.27);
    g.beginPath();g.moveTo(R(0,240),y+R(3,12));g.lineTo(R(20,260),y+R(3,12));g.stroke();g.globalAlpha=1;
   }
  }
 }else if(kind==="tile"){
  g.fillStyle="#5a554c";g.fillRect(0,0,256,256);
  for(let y=0;y<256;y+=24)for(let x=0;x<256;x+=24){
   g.fillStyle=palette[(Math.floor(x/24)+Math.floor(y/24))%4];
   g.fillRect(x+1,y+1,22,22);
   g.globalAlpha=.20;g.fillStyle="#fff7df";g.fillRect(x+1,y+1,22,2);g.globalAlpha=1;
  }
 }else if(kind==="carpet"){
  g.fillStyle="#603b34";g.fillRect(0,0,256,256);
  for(let i=0;i<4;i++){g.strokeStyle=i%2?"#c0a36e":"#2a3837";g.lineWidth=3;
   g.strokeRect(i*9+12,i*9+12,232-i*18,232-i*18);}
  for(let y=44;y<235;y+=48)for(let x=44;x<235;x+=48){
   g.fillStyle="#ae9264";g.globalAlpha=.8;
   g.beginPath();g.moveTo(x,y-12);g.lineTo(x+9,y);g.lineTo(x,y+12);g.lineTo(x-9,y);g.closePath();g.fill();g.globalAlpha=1;
  }
 }else if(kind==="plaster"){
  g.fillStyle="#82745f";g.fillRect(0,0,256,256);
  for(let y=0;y<256;y+=6){g.strokeStyle="#c7b596";g.globalAlpha=R(.02,.1);g.beginPath();g.moveTo(0,y);g.lineTo(256,y+R(-3,3));g.stroke();g.globalAlpha=1}
 }else if(kind==="earth"){
  for(let y=0;y<256;y+=8)for(let x=0;x<256;x+=8){
   g.fillStyle=palette[Math.floor(R(0,palette.length))];g.globalAlpha=.4;g.fillRect(x,y,8,8);g.globalAlpha=1;
  }
 }
 // Fine stochastic grain, mineral / baked-sprite-like texture.
 for(let i=0;i<3200;i++){
  const v=Math.floor(R(80,230));
  g.fillStyle=r()<.53?`rgba(0,0,0,${R(.018,.095)})`:`rgba(${v},${v},${v},${R(.012,.058)})`;
  g.fillRect(R(0,256),R(0,256),R(.35,1.35),R(.35,1.35));
 }
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;
 t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
 return t;
}
const tex={
 brick:texture("brick",19),roof:texture("roof",71),cobble:texture("cobble",32),
 wood:texture("planks",42),plaster:texture("plaster",9),tile:texture("tile",30),
 carpet:texture("carpet",51),earth:texture("earth",11)
};
const mat=(t,tint="#ffffff",extra={})=>new THREE.MeshStandardMaterial({map:tex[t],color:tint,roughness:.92,side:THREE.DoubleSide,...extra});
const materials={
 brick:mat("brick","#d8c6b2"),lightBrick:mat("brick","#f3d1a8"),
 roof:mat("roof","#c7c7bb"),earth:mat("earth","#dbd4bc"),
 cobble:mat("cobble","#d8d5cd"),wood:mat("wood","#e0c8a6"),
 plaster:mat("plaster","#e1d0b6"),tile:mat("tile","#e4dac8"),carpet:mat("carpet"),
 white:new THREE.MeshStandardMaterial({color:"#c3ab88",roughness:.93}),
 stone:new THREE.MeshStandardMaterial({color:"#7b766b",roughness:1}),
 dark:new THREE.MeshStandardMaterial({color:"#25282a",roughness:.94}),
 glass:new THREE.MeshStandardMaterial({color:"#2e3637",roughness:.34,metalness:.1,side:THREE.DoubleSide}),
 lightGlass:new THREE.MeshBasicMaterial({color:"#d7a15b",side:THREE.DoubleSide}),
 brass:new THREE.MeshStandardMaterial({color:"#8f7042",metalness:.6,roughness:.4}),
 leather:new THREE.MeshStandardMaterial({color:"#6e4230",roughness:.83}),
 lamp:new THREE.MeshBasicMaterial({color:"#f8c781"}),
 shadow:new THREE.MeshBasicMaterial({color:"#191b1a",transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide})
};
const makePt=(p,y)=>new THREE.Vector3(p.x,y,p.y);
function poly(points,material,parent,repeatU=1,repeatV=1,userData=null){
 const verts=[...points[0].toArray(),...points[1].toArray(),...points[2].toArray(),
  ...points[0].toArray(),...points[2].toArray(),...points[3].toArray()];
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
 geometry.setAttribute("uv",new THREE.Float32BufferAttribute([
  0,0,repeatU,0,repeatU,repeatV,0,0,repeatU,repeatV,0,repeatV
 ],2));
 geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,material);
 if(userData)Object.assign(mesh.userData,userData);
 parent.add(mesh);return mesh;
}
function block(w,h,d,x,y,z,material,parent,rotation=0){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
 mesh.position.set(x,y,z);mesh.rotation.y=rotation;parent.add(mesh);
 return mesh;
}
function beam(a,b,y,width,depth,material,parent){
 const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);
 const p=block(l,width,depth,(a.x+b.x)/2,y,(a.z+b.z)/2,material,parent,-Math.atan2(dz,dx));
 return p;
}
function faceNormal(b,i){
 const a=b.poly[i],c=b.poly[(i+1)%4];
 const dx=c.x-a.x,dz=c.y-a.y,len=Math.hypot(dx,dz)||1;
 let x=-dz/len,z=dx/len;
 const mid={x:(a.x+c.x)/2,y:(a.y+c.y)/2};
 if((mid.x-b.x)*x+(mid.y-b.y)*z<0){x=-x;z=-z}
 return{x,z};
}
function faceRectangle(a,b,n,t0,t1,y0,y1,offset=.22){
 const mix=(a,b,t)=>new THREE.Vector3(a.x+(b.x-a.x)*t,0,a.z+(b.z-a.z)*t);
 const x=mix(a,b,t0),z=mix(a,b,t1);
 return[
 new THREE.Vector3(x.x+n.x*offset,y0,x.z+n.z*offset),
 new THREE.Vector3(z.x+n.x*offset,y0,z.z+n.z*offset),
 new THREE.Vector3(z.x+n.x*offset,y1,z.z+n.z*offset),
 new THREE.Vector3(x.x+n.x*offset,y1,x.z+n.z*offset)
 ];
}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(1450,1300,1,1),materials.earth);
ground.rotation.x=-Math.PI/2;ground.position.set(focus.x,-.8,focus.y);
ground.material.map.repeat.set(20,18);scene.add(ground);
// Cobbled streets are original maps from the canonical Five Points street model.
const roads=new THREE.Group();scene.add(roads);
for(const road of world.roads)for(let i=1;i<road.points.length;i++){
 const a=road.points[i-1],b=road.points[i];const mx=(a.x+b.x)/2,mz=(a.y+b.y)/2;
 if(Math.hypot(mx-focus.x,mz-focus.y)>770)continue;
 const dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz)||1;
 const nx=-dz/len*road.width/2,nz=dx/len*road.width/2;
 const four=[
  new THREE.Vector3(a.x+nx,-.45,a.y+nz),new THREE.Vector3(b.x+nx,-.45,b.y+nz),
  new THREE.Vector3(b.x-nx,-.45,b.y-nz),new THREE.Vector3(a.x-nx,-.45,a.y-nz)
 ];
 poly(four,materials.cobble,roads,len/32,road.width/32);
}
const lotGroups=new Map(),picks=[],selectedOutline=new THREE.Group();
scene.add(selectedOutline);
function building(b){
 const base=b.poly.map(p=>makePt(p,.6));
 const top=b.poly.map(p=>makePt(p,b.z));
 const root=new THREE.Group();scene.add(root);
 const facade=new THREE.Group(),roof=new THREE.Group(),interior=new THREE.Group();
 root.add(facade,roof,interior);interior.visible=false;
 const wallMaterial=b.type==="shop"?materials.lightBrick:materials.brick;
 const outline=new THREE.Group();root.add(outline);
 for(let i=0;i<4;i++){
  const j=(i+1)%4,a=base[i],z=base[j],height=b.z;
  const side=poly([a,z,top[j],top[i]],wallMaterial,facade,
   a.distanceTo(z)/16,height/18,{lotId:b.id});
  picks.push(side);
  const n=faceNormal(b,i),len=a.distanceTo(z);
  const floors=Math.min(5,b.floors),bays=Core.clamp(Math.floor(len/14),1,4);
  const step=(b.z-3)/floors;
  for(let f=0;f<floors;f++)for(let k=0;k<bays;k++){
   const w=.55/bays,center=(k+.5)/bays;
   const low=f*step+step*.27,high=Math.min(b.z-3,f*step+step*.72);
   const shape=faceRectangle(a,z,n,center-w/2,center+w/2,low,high,.36);
   const glowing=(b.seed+f*7+k*5+i)%8<2;
   poly(shape,glowing?materials.lightGlass:materials.glass,facade,1,1);
   beam(shape[0],shape[1],low-.7,.95,1.1,materials.white,facade);
   beam(shape[3],shape[2],high+.5,.9,.9,materials.white,facade);
  }
  beam(top[i],top[j],b.z-1.0,2.1,1.7,materials.stone,facade);
  if(Core.dist(b.door,{x:(b.poly[i].x+b.poly[j].x)/2,y:(b.poly[i].y+b.poly[j].y)/2})<len*.8){
   // One entrance, at the canonical doorway, on the nearest suitable wall.
   const doorCenter=faceRectangle(a,z,n,.43,.57,.6,Math.min(11,b.z*.25),.42);
   poly(doorCenter,materials.dark,facade);
  }
 }
 const rooftop=poly(top,materials.roof,roof,
  base[0].distanceTo(base[1])/13,base[0].distanceTo(base[3])/13,{lotId:b.id});
 picks.push(rooftop);
 // Roof ribs, ridges, chimneys and small parapets break up flat outlines.
 for(let i=0;i<4;i++)beam(top[i],top[(i+1)%4],b.z+.7,1.5,1.2,materials.stone,roof);
 const ch=Core.placementOnBuilding(b,.22,.22);
 block(4,8,4,ch.x,b.z+4,ch.y,materials.brick,roof);
 const cp=Core.placementOnBuilding(b,.75,.6);
 block(3,5,3,cp.x,b.z+2.5,cp.y,materials.stone,roof);
 // A cutaway first storey, independently renderable when this lot is explored.
 const floor=b.poly.map(p=>makePt(p,1.1));
 const floorMat=b.type==="shop"?materials.tile:materials.wood;
 const surface=poly(floor,floorMat,interior,base[0].distanceTo(base[1])/16,base[0].distanceTo(base[3])/16,{lotId:b.id});
 picks.push(surface);
 const cutWalls=[];
 for(let i=0;i<4;i++){
  const j=(i+1)%4,side=poly([base[i],base[j],
   makePt(b.poly[j],18),makePt(b.poly[i],18)],materials.plaster,interior,
   base[i].distanceTo(base[j])/30,1.2);
  cutWalls.push(side);
  beam(makePt(b.poly[i],17.5),makePt(b.poly[j],17.5),17.5,1.2,.9,materials.wood,interior);
 }
 decorateInterior(b,interior);
 const outlineMat=new THREE.LineBasicMaterial({color:"#f9d38c",depthTest:true,transparent:true,opacity:.92});
 const lines=[];
 for(let i=0;i<4;i++){
  const j=(i+1)%4,a=top[i],z=top[j];
  lines.push(...a.toArray(),...z.toArray());
 }
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(lines,3));
 const highlight=new THREE.LineSegments(g,outlineMat);highlight.visible=false;outline.add(highlight);
 lotGroups.set(b.id,{b,root,facade,roof,interior,cutWalls,highlight});
}
function decorateInterior(b,group){
 // Local rectangular coordinates, aligned to the real 1860 lot rather than a
 // screen-space decoration. Supports rotated canonical rectangles.
 const p=b.poly,u=p[1].x-p[0].x,uz=p[1].y-p[0].y,vx=p[3].x-p[0].x,vz=p[3].y-p[0].y;
 const aLen=Math.hypot(u,uz),bLen=Math.hypot(vx,vz);
 const frame=new THREE.Group();frame.position.set(p[0].x,0,p[0].y);
 frame.rotation.y=-Math.atan2(uz,u);
 frame.scale.z=(u*vz-uz*vx)>=0?1:-1;
 group.add(frame);
 const pos=(x,z)=>[aLen*x,bLen*z];
 const place=(w,h,d,x,z,y,material)=>{
  const [px,pz]=pos(x,z);return block(w,h,d,px,y,pz,material,frame);
 };
 // Period room: wood shop, tavern or tenement room; all details original.
 const roomIsShop=["shop","tavern"].includes(b.type);
 const rugA=pos(.5,.54),sizeA=Math.min(aLen*.52,24),sizeB=Math.min(bLen*.47,23);
 const rug=block(sizeA,.12,sizeB,rugA[0],1.36,rugA[1],materials.carpet,frame);
 if(roomIsShop){
  place(aLen*.62,7,5,.52,.14,4.9,materials.wood); // bar/counter
  place(aLen*.42,1.1,5,.52,.14,8.8,materials.brass);
  for(let k=0;k<3;k++){
   const a=.23+k*.25;
   place(7,2.8,5,a,.64,5.1,materials.wood);
   place(2.2,2.8,2.2,a-.10,.64,3.5,materials.dark);
   place(2.2,2.8,2.2,a+.10,.64,3.5,materials.dark);
   place(2.2,2.8,2.2,a,.48,3.5,materials.dark);
  }
  for(let k=0;k<4;k++)place(2.5,6,2,.16+k*.21,.10,4,materials.dark);
 }else{
  place(aLen*.55,6,6,.46,.28,4.2,materials.wood);
  place(9,3,7,.64,.66,4,materials.wood);
  place(8,1,5,.64,.66,6,materials.white);
  place(4,7,4,.15,.80,4.5,materials.wood);
  place(6,5,3,.8,.12,3.8,materials.wood);
 }
 for(let i=0;i<3;i++){
  const [x,z]=pos(.13+.35*(i%2),.2+.33*Math.floor(i/2));
  const crate=block(4.2,3.7,3.9,x,3,z,materials.wood,frame);
  crate.rotation.y=i*.25;
 }
 const [px,pz]=pos(.34,.40);
 const warm=new THREE.PointLight("#ffc079",10,Math.min(100,aLen*1.9),2);
 warm.position.set(px,13,pz);frame.add(warm);
 const bulb=new THREE.Mesh(new THREE.SphereGeometry(1.35,8,8),materials.lamp);
 bulb.position.copy(warm.position);frame.add(bulb);
}
for(const b of lots)building(b);
function barrel(x,z){
 const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
 const m=new THREE.Mesh(new THREE.CylinderGeometry(2.9,3.2,7,9),materials.wood);
 m.position.y=3.8;group.add(m);
 for(const h of [1.5,5.9]){const ring=new THREE.Mesh(new THREE.TorusGeometry(3.1,.28,5,10),materials.dark);
 ring.rotation.x=Math.PI/2;ring.position.y=h;group.add(ring)}
}
function crate(x,z,scale=1){
 block(7*scale,6*scale,7*scale,x,3*scale,z,materials.wood,scene);
}
for(const prop of world.props.filter(p=>Core.dist(p,focus)<400).slice(0,35)){
 if(prop.type==="barrel")barrel(prop.x,prop.y);
 else if(prop.type==="crate")crate(prop.x,prop.y,.8);
}
function lamp(x,z){
 const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
 const p=new THREE.Mesh(new THREE.CylinderGeometry(.45,.7,24,8),materials.dark);
 p.position.y=12;group.add(p);
 const globe=new THREE.Mesh(new THREE.SphereGeometry(2.3,12,9),materials.lamp);
 globe.position.y=25.1;group.add(globe);
 const halo=new THREE.Mesh(new THREE.CylinderGeometry(3.4,2.1,3.3,8),materials.brass);
 halo.position.y=26.8;group.add(halo);
}
for(const p of world.props.filter(p=>p.type==="streetLamp"&&Core.dist(p,focus)<450))lamp(p.x,p.y);
if(!world.props.some(p=>p.type==="streetLamp"&&Core.dist(p,focus)<450)){
 for(const [x,z] of [[1322,1055],[1270,987],[1400,1025],[1228,1059]])lamp(x,z);
}
function person(x,z,coat="#3b3e41",hat="#2c2f30"){
 const figure=new THREE.Group();figure.position.set(x,0,z);scene.add(figure);
 const coatMat=new THREE.MeshStandardMaterial({color:coat,roughness:1});
 const capMat=new THREE.MeshStandardMaterial({color:hat,roughness:1});
 const skin=new THREE.MeshStandardMaterial({color:"#ae8d70",roughness:1});
 const legs=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.3,4.5,6),materials.dark);
 legs.position.y=2.7;figure.add(legs);
 const torso=new THREE.Mesh(new THREE.CylinderGeometry(2.2,1.7,6.5,7),coatMat);
 torso.position.y=7.5;figure.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(1.65,8,7),skin);
 head.position.y=12.4;figure.add(head);
 const hatTop=new THREE.Mesh(new THREE.CylinderGeometry(2,2.1,2.4,9),capMat);
 hatTop.position.y=14.8;figure.add(hatTop);
 const brim=new THREE.Mesh(new THREE.CylinderGeometry(3.15,3.15,.4,10),capMat);
 brim.position.y=13.8;figure.add(brim);
}
[[1325,1047,"#3b4648"],[1351,1029,"#5d443d"],[1288,1014,"#353b40"],[1256,993,"#554735"],[1388,1007,"#4a3b3d"]].forEach(a=>person(...a));
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(focus.x,10,focus.y);
controls.enableDamping=true;controls.dampingFactor=.13;
controls.enableRotate=false;controls.enablePan=true;controls.screenSpacePanning=false;
controls.minZoom=.52;controls.maxZoom=4;
controls.mouseButtons.LEFT=THREE.MOUSE.PAN;
controls.touches.ONE=THREE.TOUCH.PAN;
controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
let angle=45;
function setAngle(value){
 angle=(value%360+360)%360;
 const offset=Core.cameraOrbit({x:0,y:0},angle,550,560);
 camera.position.set(controls.target.x+offset.x,controls.target.y+offset.y,controls.target.z+offset.z);
 camera.lookAt(controls.target);controls.update();updateCutaway();
}
function resize(){
 const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),range=480;
 camera.left=-range*(w/h)/2;camera.right=range*(w/h)/2;
 camera.top=range/2;camera.bottom=-range/2;
 camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
window.addEventListener("resize",resize);
resize();
let selectedId=starter.id,interiorOpen=true;
function updateCutaway(){
 for(const [id,n] of lotGroups){
  const active=id===selectedId;
  n.highlight.visible=active&&!interiorOpen;
  const cut=active&&interiorOpen;
  n.facade.visible=!cut;n.roof.visible=!cut;n.interior.visible=cut;
  if(cut){
   const facing=Core.facingWalls(n.b,{x:camera.position.x,z:camera.position.z});
   n.cutWalls.forEach((w,i)=>w.visible=!facing.includes(i));
  }
 }
 const b=lotGroups.get(selectedId)?.b;
 $("lot-title").textContent=b?`Lotto ${b.id+1} · ${b.type}`:"Five Points";
 $("lot-desc").textContent=b?
  `${b.floors} piani · ${b.road}. ${interiorOpen?"Sezione al pianterreno: arredi e pareti interne visibili.":"Facciate esterne e tetto isometrico."}`:
  "Tocca un edificio per selezionarlo.";
 $("interior").textContent=interiorOpen?"CHIUDI INTERNI":"MOSTRA INTERNI";
 $("interior").setAttribute("aria-pressed",String(interiorOpen));
}
function selectLot(id){
 if(!lotGroups.has(id))return;
 selectedId=id;interiorOpen=true;
 updateCutaway();
}
function moveFocusTo(b){
 const wanted=new THREE.Vector3(b.x,9,b.y);
 const dx=wanted.x-controls.target.x,dz=wanted.z-controls.target.z;
 camera.position.x+=dx;camera.position.z+=dz;
 controls.target.copy(wanted);controls.update();
}
$("interior").addEventListener("click",()=>{interiorOpen=!interiorOpen;updateCutaway()});
$("rotate").addEventListener("click",()=>setAngle(angle+90));
$("reset").addEventListener("click",()=>{
 const p=new THREE.Vector3(focus.x,10,focus.y);
 const dx=p.x-controls.target.x,dz=p.z-controls.target.z;
 camera.position.x+=dx;camera.position.z+=dz;controls.target.copy(p);
 camera.zoom=1;camera.updateProjectionMatrix();setAngle(45);
});
$("zoom-in").addEventListener("click",()=>{
 camera.zoom=Core.clamp(camera.zoom*1.24,.52,4);camera.updateProjectionMatrix();});
$("zoom-out").addEventListener("click",()=>{
 camera.zoom=Core.clamp(camera.zoom/1.24,.52,4);camera.updateProjectionMatrix();});
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
let down=null;
const activeTouch=new Set();
renderer.domElement.addEventListener("pointerdown",e=>{
 activeTouch.add(e.pointerId);
 if(activeTouch.size===1)down={id:e.pointerId,x:e.clientX,y:e.clientY,multi:false};
 else if(down)down.multi=true;
});
renderer.domElement.addEventListener("pointercancel",e=>{activeTouch.delete(e.pointerId);down=null});
renderer.domElement.addEventListener("pointerup",e=>{
 activeTouch.delete(e.pointerId);
 const p=down;down=null;
 if(!p||p.id!==e.pointerId||p.multi||Math.hypot(e.clientX-p.x,e.clientY-p.y)>9)return;
 const rect=renderer.domElement.getBoundingClientRect();
 mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
 mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
 raycaster.setFromCamera(mouse,camera);
 const visiblePicks=picks.filter(mesh=>mesh.parent?.visible&&mesh.visible);
 const hit=raycaster.intersectObjects(visiblePicks,false)[0];
 if(hit?.object.userData.lotId!==undefined){
  selectLot(hit.object.userData.lotId);
 }
});
setAngle(45);updateCutaway();
$("loading").remove();
function frame(){
 requestAnimationFrame(frame);
 if(document.hidden)return;
 controls.update();
 renderer.render(scene,camera);
 $("status").textContent=`ISO 45° · ${lots.length} lotti · zoom ${camera.zoom.toFixed(1)}× · ${interiorOpen?"interni visibili":"tetti visibili"}`;
}
frame();
