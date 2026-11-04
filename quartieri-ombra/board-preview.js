/* Quartieri d'Ombra — navigable board-only render pass.
   Buildings, roads and props remain independent editable objects: no film stills
   or imagegen screenshots are ever painted as a background. */
(function(){
"use strict";
const model=window.QOBoardWorld;
if(!model)throw new Error("board-world.js is required before board-preview.js");
const world=model.generate(1860),proj=model.project,unproj=model.inverse;
const $=id=>document.getElementById(id);
const canvas=$("board-canvas");let ctx=canvas.getContext("2d",{alpha:false});
const mini=$("board-minimap"),mc=mini.getContext("2d");
const stage=$("board-stage");
const worldCenter=proj(world.hub.x,world.hub.y);
const camera={x:worldCenter.x,y:worldCenter.y,zoom:1.15};
const imageNames={barrel:"barrel.svg",crate:"crate.svg",streetLamp:"street_lamp.svg",lantern:"lantern.svg",woodenFence:"wooden_fence.svg"};
const images={};
let width=1,height=1,pixelRatio=1,pending=false,selected=null;
let clickRegions=[],usedMulti=false,down=null,priorCenter=null,priorDistance=0;
const pointers=new Map();
for(const [name,filename] of Object.entries(imageNames)){
 const img=new Image();images[name]=img;img.onload=()=>requestDraw();img.onerror=()=>requestDraw();
 img.src="./assets/props/"+filename;
}
$("building-count").textContent=String(world.buildings.length);
const seeded=seed=>{let s=seed>>>0;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}};
const terrainRnd=seeded(1860032);
const flecks=Array.from({length:3600},()=>({x:terrainRnd()*world.width,y:terrainRnd()*world.height,
 light:terrainRnd(),shape:terrainRnd()}));
const scuffs=Array.from({length:150},()=>({x:terrainRnd()*world.width,y:terrainRnd()*world.height,r:3+terrainRnd()*13}));
const minmax=(v,a,b)=>Math.max(a,Math.min(b,v));
function viewport(){
 const halfW=width/(2*camera.zoom),halfH=height/(2*camera.zoom);
 return{left:camera.x-halfW,right:camera.x+halfW,top:camera.y-halfH,bottom:camera.y+halfH};
}
function clampCamera(){
 const b=world.bounds,halfW=width/(2*camera.zoom),halfH=height/(2*camera.zoom);
 const axis=(v,lo,hi,half)=>lo+half>hi-half?(lo+hi)/2:minmax(v,lo+half,hi-half);
 camera.x=axis(camera.x,b.minX,b.maxX,halfW);
 camera.y=axis(camera.y,b.minY,b.maxY,halfH);
}
function fit(){
 const r=stage.getBoundingClientRect();
 if(r.width<1||r.height<1)return;
 width=r.width;height=r.height;pixelRatio=Math.min(2,window.devicePixelRatio||1);
 const dw=Math.max(1,Math.round(width*pixelRatio)),dh=Math.max(1,Math.round(height*pixelRatio));
 if(canvas.width!==dw||canvas.height!==dh){canvas.width=dw;canvas.height=dh}
 clampCamera();requestDraw();
}
function pointInViewport(p,pad=110){
 const v=viewport();return p.x>=v.left-pad&&p.x<=v.right+pad&&p.y>=v.top-pad&&p.y<=v.bottom+pad;
}
function polygon(points,fill,stroke,lineWidth=1){
 if(!points.length)return;
 ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
 for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
 ctx.closePath();
 if(fill){ctx.fillStyle=fill;ctx.fill()}
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke()}
}
function ellipse(x,y,rx,ry,fill){
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
}
function line(a,b,color,w=1){
 ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();
}
function lerp(a,b,t){return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}}
function face(roofA,roofB,footA,footB,u0,u1,v0,v1){
 const p=(u,v)=>lerp(lerp(roofA,footA,v),lerp(roofB,footB,v),u);
 return[p(u0,v0),p(u1,v0),p(u1,v1),p(u0,v1)];
}
function drawGround(){
 const corners=[proj(0,0),proj(world.width,0),proj(world.width,world.height),proj(0,world.height)];
 polygon(corners,"#3b342a","#211d1a",5);
 for(const q of flecks){
  const p=proj(q.x,q.y);if(!pointInViewport(p,4))continue;
  ctx.fillStyle=q.light>.63?"#5a4c3b":q.light>.35?"#2c2924":"#494032";
  ctx.fillRect(p.x,p.y,q.shape>.83?3:1.4,q.shape>.75?1.5:1);
 }
 for(const q of scuffs){
  const p=proj(q.x,q.y);if(!pointInViewport(p,16))continue;
  ellipse(p.x,p.y,q.r,Math.max(1.4,q.r*.27),"#272b27a6");
  ellipse(p.x-1,p.y-.8,q.r*.56,q.r*.1,"#5c5547a8");
 }
}
function roadQuad(a,b,w){
 const d=Math.hypot(b.x-a.x,b.y-a.y)||1,n={x:-(b.y-a.y)/d*w/2,y:(b.x-a.x)/d*w/2};
 return[proj(a.x+n.x,a.y+n.y),proj(b.x+n.x,b.y+n.y),
  proj(b.x-n.x,b.y-n.y),proj(a.x-n.x,a.y-n.y)];
}
function drawRoads(){
 for(const r of world.roads){
  for(let i=1;i<r.points.length;i++){
   const a=r.points[i-1],b=r.points[i],pa=proj(a.x,a.y),pb=proj(b.x,b.y);
   if(!pointInViewport(pa,400)&&!pointInViewport(pb,400)){
    const m=proj((a.x+b.x)/2,(a.y+b.y)/2);if(!pointInViewport(m,350))continue;
   }
   polygon(roadQuad(a,b,r.width+6),"#665d4e","#4d453a");
   polygon(roadQuad(a,b,r.width-2),r.kind==="main"?"#594b3c":"#4d4235");
   // Parallel wagon ruts follow the bend and remain small in the isometric scale.
   const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
   for(const side of[-.20,.20]){
    const off=r.width*side,nx=-dy/len*off,ny=dx/len*off;
    line(proj(a.x+nx,a.y+ny),proj(b.x+nx,b.y+ny),"#302d28a6",1.7);
   }
   const rng=seeded(r.id*1009+i*311);
   for(let t=0;t<1;t+=.095){
    const x=a.x+dx*t,y=a.y+dy*t,p=proj(x,y),v=rng();
    if(!pointInViewport(p,6))continue;
    ctx.fillStyle=v>.65?"#87735c":v>.27?"#342f2a":"#98836a";
    ctx.fillRect(p.x+(rng()-.5)*11,p.y+(rng()-.5)*6,rng()*2.3+1,1);
   }
  }
  // Filled joints prevent ugly diagonal seams when winding roads change angle.
  for(const p of r.points.slice(1,-1)){
   const c=proj(p.x,p.y);if(!pointInViewport(c,60))continue;
   ellipse(c.x,c.y,r.width*.37,r.width*.20,r.kind==="main"?"#594b3c":"#4d4235");
  }
 }
 // The irregular central meeting point is a single traffic space.
 const hub=proj(world.hub.x,world.hub.y);
 ellipse(hub.x,hub.y,38,20,"#655444");
 ellipse(hub.x,hub.y,30,16,"#55483a");
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;ellipse(hub.x+Math.cos(a)*25,hub.y+Math.sin(a)*12,2,1,"#796852");
 }
}
function drawFace(b,roof,ground,i){
 const j=(i+1)%4,ra=roof[i],rb=roof[j],fa=ground[i],fb=ground[j];
 const visible=(fa.y+fb.y)/2>(ground.reduce((s,p)=>s+p.y,0)/4)-5;
 const wallColors=visible?["#604737","#584235","#493930"]:["#342d29","#3e3029","#392b25"];
 polygon([fa,fb,rb,ra],wallColors[b.seed%wallColors.length],"#2a2420",.7);
 if(!visible)return;
 // Layered brick bands and vertical masonry joints: all details are geometry.
 for(let v=.16;v<.99;v+=.145){
  line(lerp(ra,fa,v),lerp(rb,fb,v),"#33292384",.7);
  for(let col=0;col<6;col++){
   const u=(col+(Math.floor(v*100)%2)*.4)/6;
   const q=lerp(lerp(ra,rb,u),lerp(fa,fb,u),v);
   ctx.fillStyle="#86695775";ctx.fillRect(q.x,q.y,1.3,1.1);
  }
 }
 const n=Math.max(1,Math.min(5,Math.floor(b.w/15)));
 for(let floor=0;floor<b.floors;floor++){
  const v0=(floor+.20)/b.floors,v1=(floor+.63)/b.floors;
  if(b.shopfront&&floor===b.floors-1){
   polygon(face(ra,rb,fa,fb,.11,.92,v0,v1),"#2a221e","#9a7855");
   for(let c=0;c<4;c++){
    const u=.15+c*.19;
    polygon(face(ra,rb,fa,fb,u,u+.13,v0+.03,v1-.02),c%2?"#8d6a41":"#ba9561");
   }
   const awn=face(ra,rb,fa,fb,.05,.94,v0-.12,v0+.06);
   polygon(awn,b.type==="tavern"?"#695044":"#8a6949","#27201b",.8);
   for(let j=0;j<7;j++){
    const u=.06+j*.12;
    polygon(face(ra,rb,fa,fb,u,u+.055,v0-.12,v0+.06),j%2?"#ac8a67":"#584235");
   }
   continue;
  }
  for(let c=0;c<n;c++){
   if((b.seed+floor*31+c*13+i)%17===0)continue;
   const u=(c+.38)/n,span=.39/n;
   const dark=face(ra,rb,fa,fb,u-span,u+span,v0-.015,v1+.025);
   polygon(dark,"#211b19","#9c7853",.7);
   const lit=(b.seed+floor*7+c*3+i)%5===0;
   polygon(face(ra,rb,fa,fb,u-span*.75,u+span*.75,v0+.025,v1-.018),lit?"#c09a5c":"#41362c");
   const centerTop=lerp(ra,rb,u);
   const centerBase=lerp(fa,fb,u);
   const crossA=lerp(centerTop,centerBase,v0),crossB=lerp(centerTop,centerBase,v1);
   line(crossA,crossB,"#30251f",.9);
   const middle=(v0+v1)/2;
   line(lerp(ra,fa,middle+(c*.0001)),lerp(rb,fb,middle),"#40342d",.55);
  }
 }
 if(!b.shopfront){
  polygon(face(ra,rb,fa,fb,.45,.55,.79,.99),"#211b19","#98775c",.7);
 }
}
function drawRoof(b,foot,roof){
 const type=b.type;
 const gable=type==="residence"||type==="stable"||type==="workshop";
 if(gable){
  const ra=lerp(roof[0],roof[3],.5),rb=lerp(roof[1],roof[2],.5);
  ra.y-=type==="stable"?10:16;rb.y-=type==="stable"?10:16;
  polygon([roof[0],roof[1],rb,ra],"#51463c","#211f1c",.8);
  polygon([roof[3],roof[2],rb,ra],b.roof,"#211f1c",.8);
  line(ra,rb,"#856e57",1);
 }else{
  polygon(roof,b.roof,"#211d1a",1.3);
  const parapet=[roof[2],roof[3]];
  line(parapet[0],parapet[1],"#7d6551",3.3);
 }
 // Deterministic roof seams and uneven patches.
 const count=b.type==="stable"?4:7;
 for(let k=1;k<count;k++){
  const t=k/count,top=lerp(roof[0],roof[1],t),bot=lerp(roof[3],roof[2],t);
  line(top,bot,(k+b.seed)%3===0?"#8b76615e":"#29252177",.7);
 }
 if(b.floors>2&&b.seed%3!==0){
  const base=lerp(roof[0],roof[2],.36),z=10+b.seed%10;
  polygon([{x:base.x-4,y:base.y},{x:base.x+4,y:base.y},
   {x:base.x+4,y:base.y-z},{x:base.x-4,y:base.y-z}],"#4b3930","#1f1b18");
  polygon([{x:base.x-5,y:base.y-z},{x:base.x+5,y:base.y-z},
   {x:base.x+5,y:base.y-z-3},{x:base.x-5,y:base.y-z-3}],"#78604c");
  if(b.seed%13===0){
   ellipse(base.x+5,base.y-z-17,6,3,"#8d86765c");
   ellipse(base.x+10,base.y-z-27,8,4,"#99908235");
  }
 }
}
// Each building has its own prerendered low-resolution Canvas sprite.
// A bounded LRU cache avoids repainting hundreds of windows on every drag.
const buildingCache=new Map(),MAX_BUILDING_SPRITES=320;
function buildingGeometry(b){
 const ground=b.poly.map(q=>proj(q.x,q.y));
 const roof=ground.map(p=>({x:p.x,y:p.y-b.z}));
 const coords=[...ground,...roof],margin=35;
 const left=Math.floor(Math.min(...coords.map(p=>p.x))-margin);
 const top=Math.floor(Math.min(...coords.map(p=>p.y))-margin);
 const right=Math.ceil(Math.max(...coords.map(p=>p.x))+margin);
 const bottom=Math.ceil(Math.max(...coords.map(p=>p.y))+margin);
 return {ground,roof,left,top,width:right-left,height:bottom-top};
}
function bakeBuilding(b,geometry){
 const tile=document.createElement("canvas");
 tile.width=geometry.width;tile.height=geometry.height;
 const original=ctx;ctx=tile.getContext("2d");
 try{
  ctx.translate(-geometry.left,-geometry.top);
  const {ground,roof}=geometry;
  polygon(ground.map(p=>({x:p.x+7,y:p.y+6})),"#16131099");
  const indices=[0,1,2,3].sort((i,j)=>{
   const q=k=>(ground[k].y+ground[(k+1)%4].y)/2;
   return q(i)-q(j);
  });
  for(const i of indices)drawFace(b,roof,ground,i);
  drawRoof(b,ground,roof);
  if(b.controlled){
   const top=lerp(roof[1],roof[2],.5);
   line({x:top.x,y:top.y-24},{x:top.x,y:top.y+4},"#b6a27b",1);
   polygon([{x:top.x,y:top.y-24},{x:top.x+10,y:top.y-20},{x:top.x,y:top.y-15}],
    b.id%2?"#9b5550":"#6c86a1");
  }
 }finally{ctx=original}
 return {tile,left:geometry.left,top:geometry.top};
}
function drawBuilding(b){
 const center=proj(b.x,b.y);
 if(!pointInViewport(center,210))return;
 const geometry=buildingGeometry(b);
 let cached=buildingCache.get(b.id);
 if(!cached){
  cached=bakeBuilding(b,geometry);
  buildingCache.set(b.id,cached);
  if(buildingCache.size>MAX_BUILDING_SPRITES)
   buildingCache.delete(buildingCache.keys().next().value);
 }else{
  // Refresh LRU position without re-baking the sprite.
  buildingCache.delete(b.id);buildingCache.set(b.id,cached);
 }
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.drawImage(cached.tile,cached.left,cached.top);ctx.restore();
 if(selected&&selected.id===b.id){
  polygon(geometry.roof,null,"#efc981",2.1);
  ellipse(center.x,center.y,13,5,"#d5b36b55");
 }
 clickRegions.push({b,ground:geometry.ground,roof:geometry.roof});
}
function drawCart(p){
 const c=proj(p.x,p.y);
 ellipse(c.x,c.y+1,21,6,"#15121191");
 polygon([{x:c.x-19,y:c.y-4},{x:c.x+7,y:c.y-10},
  {x:c.x+17,y:c.y-3},{x:c.x-10,y:c.y+3}],"#513b29","#af855d");
 for(const x of[-11,12])ellipse(c.x+x,c.y+5,4,4,"#191715");
 ellipse(c.x+26,c.y-7,8,4,"#43372d");
 ellipse(c.x+31,c.y-11,3,3,"#322b25");
 line({x:c.x+13,y:c.y-5},{x:c.x+26,y:c.y-8},"#a48660",1);
}
function drawProp(p){
 const q=proj(p.x,p.y);
 if(!pointInViewport(q,90))return;
 const sizes={barrel:[17,24],crate:[23,23],streetLamp:[19,54],lantern:[13,18],woodenFence:[37,18]};
 if(p.type==="cart"){drawCart(p);return}
 const [w,h]=sizes[p.type]||[18,21];
 ellipse(q.x,q.y,w*.4,2.9,"#14110e91");
 const image=images[p.type];
 if(image&&image.complete&&image.naturalWidth){
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,q.x-w/2,q.y-h,w,h);ctx.restore();
 }else{
  ctx.fillStyle=p.type==="streetLamp"?"#9a7851":"#634732";
  ctx.fillRect(q.x-w/3,q.y-h*.85,w*.66,h*.81);
 }
 if(p.type==="streetLamp"||p.type==="lantern"){
  const gy=q.y-h*.73;
  ctx.fillStyle="#e7b36a55";ellipse(q.x,gy,4,3,"#dfb36e70");
 }
}
function scene(){
 ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
 ctx.fillStyle="#211c18";ctx.fillRect(0,0,width,height);
 ctx.save();ctx.translate(width/2,height/2);
 ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
 drawGround();drawRoads();clickRegions=[];
 const layers=[
  ...world.buildings.map(b=>({kind:"building",obj:b,
   depth:Math.max(...b.poly.map(p=>proj(p.x,p.y).y))})),
  ...world.props.map(p=>({kind:"prop",obj:p,depth:proj(p.x,p.y).y}))
 ].sort((a,b)=>a.depth-b.depth||a.obj.id-b.obj.id);
 for(const layer of layers){if(layer.kind==="building")drawBuilding(layer.obj);else drawProp(layer.obj)}
 ctx.restore();
 const position=unproj(camera.x,camera.y),region=model.sector(position);
 const places=[["WEST CHURCH","NORTH HOUSES","DOCKS"],
 ["CARRETERS' ROW","FIVE POINTS CROSSING","MARKET WARD"],
 ["OLD TENEMENTS","LITTLE WATER","SOUTH WORKSHOPS"]];
 $("sector-name").textContent=places[region.row][region.col];
 drawMini();
}
function miniInfo(){
 const bounds=world.bounds,r=mini.getBoundingClientRect();
 const sx=r.width/(bounds.maxX-bounds.minX),sy=r.height/(bounds.maxY-bounds.minY);
 const scale=Math.min(sx,sy);
 return{scale,offsetX:(r.width-(bounds.maxX-bounds.minX)*scale)/2,
   offsetY:(r.height-(bounds.maxY-bounds.minY)*scale)/2,bounds,width:r.width,height:r.height};
}
function drawMini(){
 const r=mini.getBoundingClientRect();
 if(r.width<1||r.height<1)return;
 const dpr=Math.min(window.devicePixelRatio||1,2);
 const dw=Math.round(r.width*dpr),dh=Math.round(r.height*dpr);
 if(mini.width!==dw||mini.height!==dh){mini.width=dw;mini.height=dh}
 mc.setTransform(dpr,0,0,dpr,0,0);
 mc.fillStyle="#201c18";mc.fillRect(0,0,r.width,r.height);
 const m=miniInfo(),c=p=>({x:(p.x-m.bounds.minX)*m.scale+m.offsetX,
  y:(p.y-m.bounds.minY)*m.scale+m.offsetY});
 for(const road of world.roads){
  mc.beginPath();road.points.forEach((p,i)=>{
   const q=c(proj(p.x,p.y));i?mc.lineTo(q.x,q.y):mc.moveTo(q.x,q.y)
  });
  mc.strokeStyle=road.kind==="main"?"#94806a":"#675b4d";
  mc.lineWidth=road.kind==="main"?1.8:.8;mc.stroke();
 }
 for(const b of world.buildings){
  const q=c(proj(b.x,b.y));mc.fillStyle=b.controlled?"#b88d54":"#806b53";
  mc.fillRect(q.x-.7,q.y-.7,1.4,1.4);
 }
 const v=viewport(),topLeft=c({x:v.left,y:v.top}),bottomRight=c({x:v.right,y:v.bottom});
 mc.strokeStyle="#f4d18f";mc.lineWidth=1.5;
 mc.strokeRect(topLeft.x,topLeft.y,bottomRight.x-topLeft.x,bottomRight.y-topLeft.y);
}
function requestDraw(){
 if(pending)return;pending=true;
 requestAnimationFrame(()=>{pending=false;if(width>0&&height>0)scene()});
}
function local(e,target=canvas){
 const r=target.getBoundingClientRect();
 return{x:e.clientX-r.left,y:e.clientY-r.top};
}
function toProjected(p){return{x:camera.x+(p.x-width/2)/camera.zoom,
 y:camera.y+(p.y-height/2)/camera.zoom}}
function zoomAt(factor,p){
 const before=toProjected(p);
 camera.zoom=minmax(camera.zoom*factor,.68,2.7);
 const after=toProjected(p);
 camera.x+=before.x-after.x;camera.y+=before.y-after.y;
 clampCamera();requestDraw();
}
function pointInPoly(p,poly){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
function choose(p){
 const worldP=toProjected(p);
 let found=null;
 for(let i=clickRegions.length-1;i>=0;i--){
  const h=clickRegions[i],b=h.b;
  if(pointInPoly(worldP,h.roof)){found=b;break}
  const projected=proj(b.x,b.y);
  if(Math.abs(worldP.x-projected.x)<60&&worldP.y>=projected.y-b.z-20&&worldP.y<=projected.y+20){
   found=b;break;
  }
 }
 selected=found;
 if(found){
  const names={shop:"Bottega",tavern:"Taverna",warehouse:"Magazzino",workshop:"Officina",
    stable:"Scuderia",tenement:"Caseggiato",residence:"Abitazione"};
  $("selected-name").textContent=names[found.type]||"Edificio";
  $("selected-description").textContent=found.floors+" piani · "+found.road+
   " · Settore "+(found.section.row*3+found.section.col+1)+
   " · lotto indipendente n. "+(found.id+1)+".";
 }else{
  $("selected-name").textContent="Five Points — il distretto";
  $("selected-description").textContent="Vista urbana illustrativa. Nessun NPC attivo nella modalità plancia; il gioco tattico rimane accessibile da ALPHA.";
 }
 requestDraw();
}
function centerPoints(){
 const p=[...pointers.values()];if(!p.length)return null;
 return{x:p.reduce((s,v)=>s+v.x,0)/p.length,y:p.reduce((s,v)=>s+v.y,0)/p.length};
}
canvas.addEventListener("pointerdown",e=>{
 e.preventDefault();canvas.setPointerCapture(e.pointerId);
 pointers.set(e.pointerId,local(e));
 if(pointers.size===1){down={start:local(e),last:local(e),moved:false};usedMulti=false;priorCenter=null}
 else{
  usedMulti=true;down=null;priorCenter=centerPoints();
  const p=[...pointers.values()];priorDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
 }
});
canvas.addEventListener("pointermove",e=>{
 if(!pointers.has(e.pointerId))return;
 pointers.set(e.pointerId,local(e));
 if(pointers.size>=2){
  const c=centerPoints(),p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
  if(priorCenter){camera.x-=(c.x-priorCenter.x)/camera.zoom;camera.y-=(c.y-priorCenter.y)/camera.zoom}
  clampCamera();
  if(priorDistance>0&&d>0)zoomAt(d/priorDistance,c);
  priorCenter=c;priorDistance=d;requestDraw();
 }else if(down){
  const next=local(e);
  if(Math.hypot(next.x-down.start.x,next.y-down.start.y)>7)down.moved=true;
  if(down.moved){camera.x-=(next.x-down.last.x)/camera.zoom;camera.y-=(next.y-down.last.y)/camera.zoom;clampCamera();requestDraw()}
  down.last=next;
 }
});
function pointerEnd(e){
 if(!pointers.has(e.pointerId))return;
 const tap=down&&!down.moved&&!usedMulti&&e.type==="pointerup",p=local(e);
 pointers.delete(e.pointerId);down=null;priorCenter=null;priorDistance=0;
 if(!pointers.size){if(tap)choose(p);usedMulti=false}
}
for(const event of["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(event,pointerEnd);
canvas.addEventListener("wheel",e=>{e.preventDefault();zoomAt(e.deltaY<0?1.13:1/1.13,local(e))},{passive:false});
$("zoom-in").onclick=()=>zoomAt(1.2,{x:width/2,y:height/2});
$("zoom-out").onclick=()=>zoomAt(1/1.2,{x:width/2,y:height/2});
$("home-btn").onclick=()=>{camera.x=worldCenter.x;camera.y=worldCenter.y;camera.zoom=1.15;clampCamera();requestDraw()};
mini.addEventListener("pointerdown",e=>{
 e.preventDefault();const p=local(e,mini),m=miniInfo();
 camera.x=(p.x-m.offsetX)/m.scale+m.bounds.minX;
 camera.y=(p.y-m.offsetY)/m.scale+m.bounds.minY;
 clampCamera();requestDraw();
});
window.addEventListener("keydown",e=>{
 const step=60/camera.zoom;
 if(["ArrowLeft","a","A"].includes(e.key))camera.x-=step;
 else if(["ArrowRight","d","D"].includes(e.key))camera.x+=step;
 else if(["ArrowUp","w","W"].includes(e.key))camera.y-=step;
 else if(["ArrowDown","s","S"].includes(e.key))camera.y+=step;
 else if(e.key==="+"){zoomAt(1.14,{x:width/2,y:height/2});e.preventDefault();return}
 else if(e.key==="-"){zoomAt(1/1.14,{x:width/2,y:height/2});e.preventDefault();return}
 else return;
 e.preventDefault();clampCamera();requestDraw();
});
async function fullscreenToggle(){
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else{
   await document.documentElement.requestFullscreen({navigationUI:"hide"});
   if(screen.orientation&&screen.orientation.lock)try{await screen.orientation.lock("landscape")}catch(_){}
  }
 }catch(_){
  $("board-toast").textContent="Fullscreen non disponibile su questo browser: prova la modalità installata.";
 }
 syncFullscreen();
}
function syncFullscreen(){
 const active=!!document.fullscreenElement;
 $("full-btn").textContent=active?"⤢":"⛶";
 $("full-btn").setAttribute("aria-label",active?"Esci da schermo intero":"Attiva schermo intero");
 fit();
}
$("full-btn").onclick=fullscreenToggle;
document.addEventListener("fullscreenchange",syncFullscreen);
window.addEventListener("resize",fit);
window.addEventListener("orientationchange",fit);
if(typeof ResizeObserver!=="undefined")new ResizeObserver(fit).observe(stage);
fit();
})();
