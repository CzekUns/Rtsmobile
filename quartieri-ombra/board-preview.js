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
   // Damp carriageway: irregular shallow puddles and wet cobble highlights.
   // All positions are seeded in world space, so panning never slides the texture.
   const wet=seeded(186011+r.id*701+i*1297);
   const wetCount=Math.max(2,Math.floor(len/36));
   for(let k=0;k<wetCount;k++){
    const t=(k+.18+wet()*.62)/wetCount;
    const side=(wet()-.5)*(r.width-13);
    const nx=-dy/len,ny=dx/len;
    const p=proj(a.x+dx*t+nx*side,a.y+dy*t+ny*side);
    if(!pointInViewport(p,20))continue;
    const radius=2.5+wet()*7;
    ellipse(p.x,p.y,radius,radius*.29,"#242d2b9c");
    if(wet()>.3){
     line({x:p.x-radius*.65,y:p.y-.5},{x:p.x+radius*.28,y:p.y-.8},
      "#a69a7869",.65);
    }
   }
   // Individual broken cobbles, embedded in road coordinates so bends retain perspective.
   // Seeded per segment: stable during camera movement and independent of zoom.
   const stones=seeded(70001+r.id*193+i*911);
   const length=Math.hypot(dx,dy),normal={x:-dy/len,y:dx/len};
   const count=Math.floor(length/(r.kind==="main"?5.5:7));
   for(let k=0;k<count;k++){
    const t=(k+.3+stones()*.4)/count;
    const lateral=(stones()-.5)*(r.width-8);
    const x=a.x+dx*t+normal.x*lateral,y=a.y+dy*t+normal.y*lateral;
    const p=proj(x,y);if(!pointInViewport(p,5))continue;
    const shade=stones();
    ctx.fillStyle=shade>.82?"#8b7961":shade>.42?"#74634f":"#40372e";
    ctx.fillRect(p.x,p.y,1.1+stones()*2.8,.55+stones()*.95);
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
 // Uneven masonry pilasters, string courses and a weathered cornice add
 // recognisable 19th-century tenement massing without changing footprints.
 const courses=seeded(b.seed*37+i*251+9);
 for(let floor=1;floor<b.floors;floor++){
  const v=floor/b.floors;
  const a=lerp(ra,fa,v),z=lerp(rb,fb,v);
  line(a,z,courses()>.5?"#9b80618a":"#30251fb0",1.4);
  if(courses()>.55){
   const underA=lerp(ra,fa,v+.013),underB=lerp(rb,fb,v+.013);
   line(underA,underB,"#201c19b0",.8);
  }
 }
 for(const u of [.025,.975]){
  const top=lerp(ra,rb,u),bottom=lerp(fa,fb,u);
  line(top,bottom,b.seed%3===0?"#9a795b":"#3b2b24",2.2);
  for(let k=0;k<5;k++){
   const q=lerp(top,bottom,(k+.35)/5);
   ctx.fillStyle="#c0a17a70";ctx.fillRect(q.x-1,q.y-1,2,1);
  }
 }
 // Roof-edge cornices cast a thin shadow across the upper storey.
 const e0=lerp(ra,fa,.035),e1=lerp(rb,fb,.035);
 line(e0,e1,"#b49b78",3);
 line(lerp(ra,fa,.057),lerp(rb,fb,.057),"#201a17",2);
 // Weathered limewash, soot and mortar scars are clipped to the actual wall plane.
 // Different deterministic wear on each elevation avoids identical repeated facades.
 ctx.save();
 ctx.beginPath();ctx.moveTo(fa.x,fa.y);ctx.lineTo(fb.x,fb.y);
 ctx.lineTo(rb.x,rb.y);ctx.lineTo(ra.x,ra.y);ctx.closePath();ctx.clip();
 const wear=seeded(b.seed*13+i*1907+71);
 for(let patch=0;patch<12+b.floors*3;patch++){
  const u=.05+wear()*.9,v=.07+wear()*.86;
  const q=lerp(lerp(ra,rb,u),lerp(fa,fb,u),v);
  const w=1.2+wear()*6,h=.6+wear()*3;
  ctx.fillStyle=wear()>.55?"#b49a7760":"#1c1b196b";
  ctx.fillRect(q.x-w/2,q.y-h/2,w,h);
 }
 // Ground-level grime follows the lower masonry, never the roof.
 polygon(face(ra,rb,fa,fb,0,1,.87,1),"#201e1a3d");
 ctx.restore();
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
   // Projecting signs and a timber shop cornice distinguish commercial streets.
   const sign=face(ra,rb,fa,fb,.25,.73,v0-.20,v0-.105);
   polygon(sign,"#33251d","#b18a57",.9);
   const signMid=lerp(sign[0],sign[2],.5);
   ctx.fillStyle="#d9b989";ctx.fillRect(signMid.x-4,signMid.y-1,8,1);
   const cornice=face(ra,rb,fa,fb,.04,.96,v0-.23,v0-.205);
   polygon(cornice,"#a1845e");
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
   // Stone lintels, narrow sills and occasional wrought-iron balcony rails.
   const sill=face(ra,rb,fa,fb,u-span*1.12,u+span*1.12,v1+.028,v1+.052);
   polygon(sill,"#a08b70","#42372c",.35);
   if(floor>0&&(b.seed+floor+c+i)%9===0){
    const railA=lerp(ra,fa,v1+.065),railB=lerp(rb,fb,v1+.065);
    const q1=lerp(railA,railB,u-span*1.2),q2=lerp(railA,railB,u+span*1.2);
    line(q1,q2,"#211f1c",1.1);
    for(let t=0;t<=4;t++){const q=lerp(q1,q2,t/4);line(q,{x:q.x,y:q.y-4},"#29241f",.7)}
   }
  }
 }
 // External iron escape ladders and narrow landings on a minority of tall
 // tenements. Kept within the wall plane so they share its iso perspective.
 if((b.type==="tenement"||b.type==="residence")&&b.floors>=4&&(b.seed+i)%5===0){
  const u=.79,span=.13;
  for(let floor=1;floor<b.floors;floor++){
   const v=(floor+.75)/b.floors;
   const left=lerp(lerp(ra,rb,u-span),lerp(fa,fb,u-span),v);
   const right=lerp(lerp(ra,rb,u+span),lerp(fa,fb,u+span),v);
   const drop=4.5;
   polygon([left,right,{x:right.x+1,y:right.y+drop},{x:left.x+1,y:left.y+drop}],
    "#292825","#a39377",.55);
   const railLeft={x:left.x,y:left.y-5},railRight={x:right.x,y:right.y-5};
   line(railLeft,railRight,"#393a35",1.2);
   for(let k=0;k<=4;k++){
    const q=lerp(left,right,k/4);
    line(q,{x:q.x,y:q.y-5},"#343530",.8);
   }
   if(floor<b.floors-1){
    const nextV=(floor+1+.75)/b.floors;
    const next=lerp(lerp(ra,rb,u-span),lerp(fa,fb,u-span),nextV);
    line(right,next,"#282a27",1.5);
    line({x:right.x+3,y:right.y}, {x:next.x+3,y:next.y},"#282a27",1.2);
    for(let step=1;step<6;step++){
     const a=lerp(right,next,step/6);
     line(a,{x:a.x+3,y:a.y},"#827d6c",.75);
    }
   }
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
 // Slate strips and repair patches are aligned to the roof plane.
 const roofRand=seeded(b.seed+918);
 for(let row=0;row<5;row++){
  const v=(row+.45)/6;
  const a=lerp(roof[0],roof[3],v),c=lerp(roof[1],roof[2],v);
  for(let col=0;col<7;col++){
   const u=(col+(row%2)*.5+.2)/8;
   const q=lerp(a,c,u);
   ctx.fillStyle=roofRand()>.7?"#a18b6b6b":"#1e1d1b8c";
   ctx.fillRect(q.x,q.y,2+roofRand()*4,.8);
  }
 }
 // Raised roof hatch: a distinct silhouette for taller tenements.
 if(b.floors>=4&&b.seed%4===1){
  const q=lerp(roof[0],roof[2],.62);
  polygon([{x:q.x-7,y:q.y},{x:q.x+5,y:q.y-3},{x:q.x+5,y:q.y-10},{x:q.x-7,y:q.y-7}],"#302a25","#9b8060",.7);
  polygon([{x:q.x-8,y:q.y-8},{x:q.x+5,y:q.y-11},{x:q.x+1,y:q.y-15},{x:q.x-11,y:q.y-12}],"#51473c","#211c19",.7);
 }
 // Period roof furniture is baked into each independently cached building sprite.
 // Dormers, lead flashing and brick chimney pairs break the repeated roof silhouette.
 if(b.floors>=3 && b.seed%5!==0){
  const n=b.w>52?2:1;
  for(let k=0;k<n;k++){
   const u=(k+1)/(n+1),q=lerp(lerp(roof[0],roof[1],u),lerp(roof[3],roof[2],u),.44);
   const height=7+(b.seed+k)%5,span=5+(b.seed%3);
   polygon([{x:q.x-span,y:q.y+2},{x:q.x+span,y:q.y+2},
    {x:q.x+span,y:q.y-height},{x:q.x-span,y:q.y-height}],
    "#433b33","#1d1b1a",.65);
   polygon([{x:q.x-span-2,y:q.y-height},{x:q.x+span+2,y:q.y-height},
    {x:q.x+span-1,y:q.y-height-5},{x:q.x-span+1,y:q.y-height-5}],
    "#726250","#282522",.7);
   polygon([{x:q.x-2,y:q.y-2},{x:q.x+2,y:q.y-2},
    {x:q.x+2,y:q.y-height+2},{x:q.x-2,y:q.y-height+2}],"#211f1e");
   line({x:q.x-2,y:q.y-height+5},{x:q.x+2,y:q.y-height+5},"#9b8566",.7);
  }
 }
 if(b.floors>=3 && b.seed%4===0){
  const q=lerp(roof[1],roof[3],.24),h=13+b.seed%9;
  for(let k=0;k<2;k++){
   const x=q.x+k*7,y=q.y+k*2;
   polygon([{x:x-3,y},{x:x+3,y},{x:x+3,y:y-h},{x:x-3,y:y-h}],
    k?"#4c3329":"#674637","#261e1b",.7);
   line({x:x-4,y:y-h},{x:x+4,y:y-h},"#a18a70",2);
  }
 }
 // Silhouette pass: different roof machinery for working buildings.
 // Hoist housing and pulley are specific to warehouses; stables get a vented
 // ridge lantern. Both are baked into the building sprite, not a map overlay.
 if(type==="warehouse"){
  const q=lerp(lerp(roof[0],roof[1],.72),lerp(roof[3],roof[2],.72),.37);
  const h=15+(b.seed%7),w=7;
  polygon([{x:q.x-w,y:q.y},{x:q.x+w,y:q.y},
   {x:q.x+w,y:q.y-h},{x:q.x-w,y:q.y-h}],
   "#574236","#201b18",.8);
  polygon([{x:q.x-w-3,y:q.y-h},{x:q.x+w+3,y:q.y-h},
   {x:q.x+w,y:q.y-h-7},{x:q.x-w,y:q.y-h-7}],
   "#73604d","#26211d",.9);
  polygon([{x:q.x-3,y:q.y-3},{x:q.x+3,y:q.y-3},
   {x:q.x+3,y:q.y-h+3},{x:q.x-3,y:q.y-h+3}],
   "#201b18","#a18b6a",.7);
  line({x:q.x+7,y:q.y-h+3},{x:q.x+17,y:q.y-h+3},"#a58b64",1.6);
  ellipse(q.x+17,q.y-h+3,2.4,2.4,"#2a231d");
  line({x:q.x+17,y:q.y-h+4},{x:q.x+17,y:q.y+7},"#a58b64",.9);
  line({x:q.x+13,y:q.y+7},{x:q.x+21,y:q.y+7},"#4c392a",2);
 }else if(type==="stable"){
  const q=lerp(roof[0],roof[2],.5),h=13;
  polygon([{x:q.x-10,y:q.y},{x:q.x+10,y:q.y},
   {x:q.x+10,y:q.y-h},{x:q.x-10,y:q.y-h}],
   "#493c32","#211d1a",.8);
  for(let k=0;k<4;k++){
   const x=q.x-7+k*4;
   line({x,y:q.y-3},{x,y:q.y-h+3},"#171715",1.6);
  }
  polygon([{x:q.x-12,y:q.y-h},{x:q.x+12,y:q.y-h},
   {x:q.x+7,y:q.y-h-7},{x:q.x-7,y:q.y-h-7}],
   "#695846","#211c19",.8);
 }
 // Rooftop drying yards: timber uprights, sagging rope and individual
 // muted linen pieces. Every element belongs to this building's cached sprite.
 // Kept away from low stables to preserve a plausible district silhouette.
 if((type==="tenement"||type==="residence")&&b.floors>=3&&b.seed%7<2){
  const left=lerp(lerp(roof[0],roof[1],.17),lerp(roof[3],roof[2],.17),.62);
  const right=lerp(lerp(roof[0],roof[1],.82),lerp(roof[3],roof[2],.82),.62);
  const pole=11+b.seed%6;
  const a={x:left.x,y:left.y-pole},z={x:right.x,y:right.y-pole};
  line(left,a,"#b39b77",1.5);line(right,z,"#b39b77",1.5);
  ctx.beginPath();ctx.moveTo(a.x,a.y);
  ctx.quadraticCurveTo((a.x+z.x)/2,(a.y+z.y)/2+4,z.x,z.y);
  ctx.strokeStyle="#c1ae8b";ctx.lineWidth=.8;ctx.stroke();
  const cloth=["#b9a78b","#827b70","#6d5347","#a69a7d"];
  for(let k=0;k<3;k++){
   const t=.19+k*.28,q=lerp(a,z,t),sag=4*4*t*(1-t);
   const x=q.x,y=q.y+sag,h=5+(b.seed+k*3)%5;
   polygon([{x:x-3,y},{x:x+3,y:y+.4},{x:x+2.5,y:y+h},
    {x:x-2,y:y+h+1}],cloth[(b.seed+k)%cloth.length],"#423a31",.35);
   line({x:x-1,y:y+2},{x:x-1,y:y+h-1},"#e1d0ae55",.5);
  }
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
 // Independent period wagon sprite: angled wooden bed, raised sides, spoke wheels,
 // harness and a compact draught horse. All details stay in projected world space.
 const c=proj(p.x,p.y),flip=p.id%2?-1:1;
 ctx.save();ctx.translate(c.x,c.y);ctx.scale(flip,1);
 ellipse(5,4,39,8,"#100f0d99");
 // Cart chassis and plank bed in an isometric 2:1 silhouette.
 polygon([{x:-23,y:-10},{x:3,y:-17},{x:22,y:-8},{x:-5,y:0}],
  "#67452f","#211915",1.1);
 polygon([{x:-23,y:-17},{x:3,y:-24},{x:22,y:-15},{x:-5,y:-7}],
  "#95704a","#34251b",1);
 for(let i=0;i<5;i++){
  const t=i/5;
  line({x:-21+25*t,y:-16-7*t},{x:-4+25*t,y:-7-7*t},"#4d3526",.8);
 }
 polygon([{x:-23,y:-17},{x:-23,y:-9},{x:-5,y:0},{x:-5,y:-7}],
  "#4a3023","#241a16",.8);
 polygon([{x:-5,y:-7},{x:22,y:-15},{x:22,y:-8},{x:-5,y:0}],
  "#765236","#261b16",.9);
 // Cargo silhouettes: rolled canvas and stacked crates.
 polygon([{x:-14,y:-19},{x:-3,y:-22},{x:6,y:-17},{x:-5,y:-14}],
  "#81735a","#352b23",.7);
 polygon([{x:-11,y:-21},{x:-2,y:-24},{x:4,y:-21},{x:-5,y:-18}],
  "#a08a64","#4e3a29",.7);
 for(const wx of[-14,13]){
  ellipse(wx,2,6.2,7.5,"#201a17");
  ellipse(wx,2,4.6,5.9,"#6b4a2e");
  ellipse(wx,2,2.9,3.9,"#221c17");
  for(let k=0;k<6;k++){
   const a=k*Math.PI/3;
   line({x:wx,y:2},{x:wx+3.6*Math.cos(a),y:2+4.7*Math.sin(a)},"#b18c5e",.7);
  }
  ellipse(wx,2,1.2,1.3,"#c0a17a");
 }
 // Two shafts visibly connect the wagon to the draught horse.
 line({x:17,y:-12},{x:39,y:-15},"#96754f",1.5);
 line({x:17,y:-5},{x:39,y:-8},"#96754f",1.5);
 // Horse at RTS scale: four legs, barrel, neck, ears and leather harness.
 for(const x of[37,48]){
  line({x,y:-5},{x:x-2,y:6},"#33271f",3);
  line({x:x+4,y:-5},{x:x+6,y:5},"#3b2d23",2.5);
 }
 ellipse(44,-13,12,6.5,"#514035");
 polygon([{x:49,y:-15},{x:55,y:-28},{x:59,y:-27},{x:56,y:-12}],
  "#574337","#30251f",.7);
 ellipse(59,-28,5,3.5,"#5a4537");
 polygon([{x:57,y:-30},{x:57,y:-36},{x:60,y:-33}],
  "#3b2d26");
 line({x:33,y:-15},{x:27,y:-20},"#2b211c",1.6);
 line({x:49,y:-16},{x:53,y:-10},"#aa8155",1);
 ellipse(61,-28,1,1,"#211a17");
 ctx.restore();
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
// Street lighting is a separate world-space atmosphere pass, not part of building sprites.
// Fixed coordinates prevent halos drifting when the camera pans or zooms.
const lightSources=world.props.filter(p=>p.type==="streetLamp"||p.type==="lantern");
function drawStreetAtmosphere(){
 ctx.save();
 ctx.globalCompositeOperation="screen";
 for(const lamp of lightSources){
  const p=proj(lamp.x,lamp.y);
  if(!pointInViewport(p,95))continue;
  const raised=lamp.type==="streetLamp"?35:13;
  const flameY=p.y-raised;
  // Soft amber pools reveal the irregular street surfaces around lamps.
  const halo=ctx.createRadialGradient(p.x,flameY,1,p.x,flameY,53);
  halo.addColorStop(0,"rgba(255,191,93,.28)");
  halo.addColorStop(.24,"rgba(227,150,61,.12)");
  halo.addColorStop(1,"rgba(227,150,61,0)");
  ctx.fillStyle=halo;ctx.beginPath();ctx.ellipse(p.x,flameY,53,30,0,0,Math.PI*2);ctx.fill();
  const ground=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,35);
  ground.addColorStop(0,"rgba(221,151,73,.19)");
  ground.addColorStop(1,"rgba(221,151,73,0)");
  ctx.fillStyle=ground;ctx.beginPath();ctx.ellipse(p.x,p.y,35,11,0,0,Math.PI*2);ctx.fill();
  ellipse(p.x,flameY,1.8,2.8,"#ffd18a");
 }
 ctx.restore();
}
// Thin smoke banks are individual translucent objects anchored to district coordinates.
const smokeBanks=Array.from({length:58},(_,i)=>{
 const rng=seeded(86021+i*479);
 return{x:65+rng()*(world.width-130),y:55+rng()*(world.height-110),
  width:28+rng()*64,height:9+rng()*16,opacity:.018+rng()*.029};
});
function drawDistrictHaze(){
 ctx.save();
 for(const bank of smokeBanks){
  const p=proj(bank.x,bank.y);
  if(!pointInViewport(p,100))continue;
  const g=ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,bank.width);
  g.addColorStop(0,"rgba(174,164,145,"+bank.opacity+")");
  g.addColorStop(1,"rgba(174,164,145,0)");
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(p.x,p.y,bank.width,bank.height,0,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
// Original district-scale drainage details: broken curb stones and iron grates.
// Drawn in world space; no gameplay collision or navigation changes.
function drawStreetDrainage(){
 for(const road of world.roads){
  const rng=seeded(970031+road.id*1607);
  for(let i=1;i<road.points.length;i++){
   const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dy=b.y-a.y;
   const len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
   const count=Math.floor(len/90);
   for(let j=0;j<count;j++){
    const t=(j+.25+rng()*.5)/count,side=(rng()>.5?1:-1)*(road.width*.46);
    const q=proj(a.x+dx*t+nx*side,a.y+dy*t+ny*side);
    if(!pointInViewport(q,18))continue;
    // Drainage frame, dark opening, three slotted iron bars.
    ctx.save();ctx.translate(q.x,q.y);
    ctx.rotate(Math.atan2(dy-dx,dx+dy)*.22);
    ctx.fillStyle="#9a866a";ctx.fillRect(-6,-3,12,6);
    ctx.fillStyle="#211f1c";ctx.fillRect(-5,-2,10,4);
    ctx.strokeStyle="#746750";ctx.lineWidth=.8;
    for(let k=-3;k<=3;k+=3){ctx.beginPath();ctx.moveTo(k,-1.8);ctx.lineTo(k,1.8);ctx.stroke()}
    ctx.restore();
    // Broken kerb stones interrupt the otherwise smooth roadside edge.
    for(let k=0;k<3;k++){
     const off=(k-1)*10,edge=proj(a.x+dx*t+dx/len*off+nx*side,
      a.y+dy*t+dy/len*off+ny*side);
     if(!pointInViewport(edge,8))continue;
     ctx.fillStyle=k===1?"#342e28":"#91806b";
     ctx.fillRect(edge.x-3,edge.y-1.2,5+rng()*2,1.8);
    }
   }
  }
 }
}
function scene(){
 ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
 ctx.fillStyle="#211c18";ctx.fillRect(0,0,width,height);
 ctx.save();ctx.translate(width/2,height/2);
 ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
 drawGround();drawRoads();drawStreetDrainage();clickRegions=[];
 const layers=[
  ...world.buildings.map(b=>({kind:"building",obj:b,
   depth:Math.max(...b.poly.map(p=>proj(p.x,p.y).y))})),
  ...world.props.map(p=>({kind:"prop",obj:p,depth:proj(p.x,p.y).y}))
 ].sort((a,b)=>a.depth-b.depth||a.obj.id-b.obj.id);
 for(const layer of layers){if(layer.kind==="building")drawBuilding(layer.obj);else drawProp(layer.obj)}
 drawStreetAtmosphere();drawDistrictHaze();
 ctx.restore();
 const position=unproj(camera.x,camera.y),region=model.sector(position);
 const places=[["WEST CHURCH","NORTH HOUSES","DOCKS"],
 ["CARRETERS' ROW","FIVE POINTS CROSSING","MARKET WARD"],
 ["OLD TENEMENTS","LITTLE WATER","SOUTH WORKSHOPS"]];
 $("sector-name").textContent=places[region.row][region.col];
 drawMini();
 window.__qoBoardPainted=true;
 const boardReady=document.getElementById("board-ready");
 if(boardReady)boardReady.hidden=true;
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
