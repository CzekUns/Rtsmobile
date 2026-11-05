/* Quartieri d'Ombra — Vector Street Laboratory (original experimental renderer).
   Real QOBoardWorld parcels, 3D camera, dynamic visibility and depth-sorted SVG.
   No ImageGen textures, no generic SVG patterns and no changes to the RTS. */
(function(){
"use strict";
const M=window.QOBoardWorld,G=window.QOStreetGeometry;
if(!M||!G)throw Error("street-vector-lab needs board-world.js and street-vector-geometry.js");
const world=M.generate(1860),svg=document.getElementById("street-scene");
const $=id=>document.getElementById(id),TAU=Math.PI*2;
const query=new URLSearchParams(location.search),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const startAngle=Number(query.get("angle")),startHeight=Number(query.get("height"));
const S={
 target:{x:1055,y:969,z:10},yaw:Number.isFinite(startAngle)&&query.has("angle")?((startAngle%360)+360)%360:86,
 height:Number.isFinite(startHeight)&&query.has("height")?clamp(startHeight,24,120):39,
 zoom:clamp(Number(query.get("zoom"))||1,0.55,3.6),
 distance:265,selected:3,wire:false,detail:true,moving:false
};
let width=1000,height=600,pending=false,lastFaceCount=0,paintCount=0,view=null;
const glyph=(name)=>name==="shop"?"BOTTEGA":name==="tavern"?"TAVERNA":name==="workshop"?"OFFICINA":name==="warehouse"?"MAGAZZINO":name==="stable"?"STALLE":name==="tenement"?"CASEGGIATO":"ABITAZIONE";
function hash(n){let x=n|0;x=Math.imul(x^x>>>16,0x7feb352d);x=Math.imul(x^x>>>15,0x846ca68b);return((x^x>>>16)>>>0)/4294967296}
const rgb=(hex)=>{const h=hex.replace("#","");return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
const shade=(hex,mul)=>"#"+rgb(hex).map(n=>Math.round(clamp(n*mul,0,255)).toString(16).padStart(2,"0")).join("");
function xyz(p,z){return{x:p.x,y:p.y,z}}
function along(a,b,t,z){return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z}}
function fillPoly(points,color,stroke="",sw=.65,extra=""){
 const p=G.projection(view,points);
 return p?'<path d="'+p.path+'" fill="'+color+'"'+(stroke?' stroke="'+stroke+'" stroke-width="'+sw+'"':'')+' '+extra+'/>':"";
}
function faceRect(a,b,u0,u1,z0,z1,color,stroke="",sw=.65,extra=""){
 return fillPoly([along(a,b,u0,z0),along(a,b,u1,z0),along(a,b,u1,z1),along(a,b,u0,z1)],color,stroke,sw,extra);
}
function segment(a,b,z,color,w=.7,extra=""){
 const pa=G.projectPoint(view,xyz(a,z)),pb=G.projectPoint(view,xyz(b,z));
 return pa&&pb?'<path d="M'+pa.x.toFixed(2)+','+pa.y.toFixed(2)+'L'+pb.x.toFixed(2)+','+pb.y.toFixed(2)+'" fill="none" stroke="'+color+'" stroke-width="'+w+'" '+extra+'/>':"";
}
function wall(b,index,depth,nearDetail){
 const a=b.poly[index],c=b.poly[(index+1)%4],len=Math.hypot(c.x-a.x,c.y-a.y);
 const front=index===0,isShop=front&&b.shopfront;
 const face=G.faceGeometry(b,index),projection=G.projection(view,face);
 if(!projection)return null;
 const h=b.z,base=shade(b.wall,[.87,.67,.72,.96][index]),selected=S.selected===b.id;
 const parts=[];
 parts.push('<path class="wall-base" d="'+projection.path+'" fill="'+base+'" stroke="'+shade(base,.55)+'" stroke-width=".8"/>');
 // One structural bay grammar is projected onto every wall, including the
 // facade that becomes the new FRONT when the camera rotates 255 degrees.
 const floorH=h/b.floors,bays=Math.max(2,Math.min(6,Math.round(len/16)));
 const topCap=faceRect(a,c,0,1,h-2.2,h,shade(base,1.21),shade(base,.59),.55);
 parts.push(topCap);
 for(let floor=0;floor<b.floors;floor++){
  const z0=floor*floorH,z1=(floor+1)*floorH;
  if(floor>0)parts.push(faceRect(a,c,0,1,z0-.8,z0+.2,shade(base,.82),"",0));
  if(!nearDetail&&floor>0&&floor%2===1)continue;
  if(front&&floor===0){
   const middle=0.46,dw=Math.min(.22,9/len),left=middle-dw/2,right=middle+dw/2;
   if(isShop){
    parts.push(faceRect(a,c,.07,.93,1.5,floorH*.77,"#251b17",shade(base,1.2),.65));
    parts.push(faceRect(a,c,.09,.90,3,floorH*.70,"#64452c","",0));
    parts.push(faceRect(a,c,.11,.88,4,floorH*.67,"#9b6a36","",0,'opacity=".7"'));
    for(let k=1;k<4;k++){
     const t=.09+(.81*k/4);
     parts.push(faceRect(a,c,t,t+.015,3,floorH*.72,"#2b201a"));
    }
    parts.push(faceRect(a,c,.05,.96,floorH*.77,floorH*.91,shade(base,.58)));
    parts.push(faceRect(a,c,left,right,0,floorH*.73,"#211913",shade(base,1.25),.8));
   }else{
    parts.push(faceRect(a,c,left-.03,right+.03,0,floorH*.87,shade(base,.66)));
    parts.push(faceRect(a,c,left,right,0,floorH*.82,"#28221e",shade(base,1.15),.7));
    parts.push(faceRect(a,c,left+.015,right-.015,floorH*.40,floorH*.56,"#84694a"));
   }
   // Sparse ground-floor side windows; no printed repeating pattern.
   for(const u of [.16,.77])if(Math.abs(u-middle)>.16){
    parts.push(faceRect(a,c,u,u+.10,floorH*.29,floorH*.70,"#292b29",shade(base,1.22),.6));
    parts.push(faceRect(a,c,u+.015,u+.085,floorH*.33,floorH*.65,hash(b.seed+u*30)>.5?"#a57535":"#343b3b"));
   }
   continue;
  }
  if(index===2&&floor===0&&hash(b.seed+floor)>.55)continue;
  for(let col=0;col<bays;col++){
   const u0=(col+.22)/bays,u1=(col+.78)/bays;
   if((index===1||index===3)&&hash(b.seed+col*7+floor*11)>.88)continue;
   const low=z0+floorH*.28,high=z0+floorH*.77;
   const glass=(hash(b.seed+floor*121+col*17+index*37)>.63)?"#b67a38":"#283337";
   const trim=shade(base,1.23),frame=shade(base,.56);
   parts.push(faceRect(a,c,u0-.014,u1+.014,low-.4,high+1.0,trim,frame,.55));
   parts.push(faceRect(a,c,u0,u1,low,high,frame));
   parts.push(faceRect(a,c,u0+.008,u1-.008,low+1.0,high-.9,glass));
   parts.push(faceRect(a,c,u0+.01,u1-.01,low+floorH*.22,low+floorH*.245,"#4c4033"));
   parts.push(faceRect(a,c,(u0+u1)/2-.005,(u0+u1)/2+.005,low,high,"#5a483c"));
   parts.push(faceRect(a,c,u0-.035,u1+.035,low-1.35,low-.5,shade(base,1.16)));
  }
 }
 if(nearDetail){
  // Singular worn masonry patches (not a repeating SVG brick texture).
  for(let n=0;n<8;n++){
   const u=.07+hash(b.seed+index*57+n*17)*.84;
   const z=5+hash(b.seed+index*31+n*23)*(h-9);
   const lenU=.028+.022*hash(b.seed+n*19);
   parts.push(faceRect(a,c,u,u+lenU,z,z+.25,shade(base,1.12),"",0,'opacity=".26"'));
  }
  // Cornice dentils; only at close range.
  for(let t=.07;t<.97;t+=.12)parts.push(faceRect(a,c,t,t+.036,h-1.65,h-.5,shade(base,.63)));
 }
 if(selected)parts.push('<path d="'+projection.path+'" fill="#efbd6b" fill-opacity=".085" stroke="#f3cc83" stroke-width="2.4" vector-effect="non-scaling-stroke"/>');
 const detailOpacity=clamp(1-(depth-330)/1000,.5,1);
 return{depth,order:b.id*10+index,html:'<g data-lot="'+b.id+'" aria-label="Lotto '+(b.id+1)+'" opacity="'+detailOpacity.toFixed(2)+'">'+parts.join("")+'</g>'};
}
function roof(b){
 if(!G.roofVisible(view,b.z))return null;
 const points=b.poly.map(p=>xyz(p,b.z)),proj=G.projection(view,points);
 if(!proj)return null;
 const roofColor=shade(b.roof,.94),parts=['<path d="'+proj.path+'" fill="'+roofColor+'" stroke="'+shade(roofColor,1.2)+'" stroke-width="1.2"/>'];
 // Parapet coping follows the true roof vertices.
 for(let i=0;i<4;i++)parts.push(segment(b.poly[i],b.poly[(i+1)%4],b.z,shade(roofColor,1.35),1.3));
 if(S.selected===b.id)parts.push('<path d="'+proj.path+'" fill="#ffdd9a" fill-opacity=".16" stroke="#edc06f" stroke-width="2.4"/>');
 return{depth:proj.depth,order:b.id*10+8,html:'<g data-lot="'+b.id+'">'+parts.join("")+'</g>'};
}
function buildingFaces(b){
 const nearDetail=G.distance2(b,S.target)<235*235,faces=[];
 for(let i=0;i<4;i++)if(G.visibleWall(view,b.poly[i],b.poly[(i+1)%4])){
  const p=G.projection(view,G.faceGeometry(b,i));
  if(p){const w=wall(b,i,p.depth,nearDetail);if(w)faces.push(w)}
 }
 const r=roof(b);if(r)faces.push(r);
 return faces;
}
function groundTile(){
 const center={x:S.target.x,y:S.target.y,z:-1};
 const tiles=[],size=190;
 const bx=Math.floor(center.x/size),by=Math.floor(center.y/size);
 for(let i=-5;i<=5;i++)for(let j=-5;j<=5;j++){
  const x=(bx+i)*size,y=(by+j)*size;
  const verts=[{x,y,z:-2},{x:x+size,y,z:-2},{x:x+size,y:y+size,z:-2},{x,y:y+size,z:-2}];
  const p=G.projection(view,verts);
  if(!p)continue;
  const color=((i+j)&1)?"#302c25":"#333028";
  tiles.push('<path d="'+p.path+'" fill="'+color+'" stroke="#343027" stroke-width=".4"/>');
 }
 return tiles.join("");
}
function roadSurface(){
 const roads=[];
 for(const road of world.roads){
  for(let i=1;i<road.points.length;i++){
   const a=road.points[i-1],b=road.points[i];
   const dist2=G.distance2({x:(a.x+b.x)/2,y:(a.y+b.y)/2},S.target);
   if(dist2>1250*1250)continue;
   const len=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len,w=road.width/2;
   const at=(p,k,z)=>({x:p.x+nx*k,y:p.y+ny*k,z});
   const p=G.projection(view,[at(a,-w,0),at(b,-w,0),at(b,w,0),at(a,w,0)]);
   if(!p)continue;
   const clr=road.kind==="main"?"#4a4030":"#403a30";
   roads.push('<path d="'+p.path+'" fill="'+clr+'" stroke="#6e5b42" stroke-width=".9"/>');
   for(const k of[-w+2,w-2]){
    const edge=G.projection(view,[at(a,k,0.25),at(b,k,0.25),at(b,k+1.15,.25),at(a,k+1.15,.25)]);
    if(edge)roads.push('<path d="'+edge.path+'" fill="#75634c" opacity=".70"/>');
   }
   if(G.distance2(a,S.target)<430*430){
    for(let s=0;s<6;s++){
     const t=(s+.4)/6,jitter=hash(road.id*30+i*13+s*61);
     const atC={x:a.x+(b.x-a.x)*t+nx*(jitter-.5)*road.width*.6,
       y:a.y+(b.y-a.y)*t+ny*(jitter-.5)*road.width*.6};
     const cobble=G.projection(view,[{x:atC.x-2,y:atC.y,z:.35},{x:atC.x+2.5,y:atC.y,z:.35},
       {x:atC.x+3,y:atC.y+2,z:.35},{x:atC.x-2,y:atC.y+2,z:.35}]);
     if(cobble)roads.push('<path d="'+cobble.path+'" fill="#91765a" opacity=".38"/>');
    }
   }
  }
 }
 return roads.join("");
}
function lamp(p,i){
 const top={x:p.x,y:p.y,z:40},bottom={x:p.x,y:p.y,z:0};
 const a=G.projectPoint(view,top),b=G.projectPoint(view,bottom);
 if(!a||!b)return null;
 const wd=clamp(view.focal/a.depth*.64,1,6),glow=clamp(view.focal/a.depth*16,5,80);
 const color=i%4===0?"#e5ad58":"#d7a365";
 const html='<path d="M'+b.x.toFixed(1)+','+b.y.toFixed(1)+'L'+a.x.toFixed(1)+','+a.y.toFixed(1)+'" fill="none" stroke="#211d1a" stroke-width="'+wd.toFixed(2)+'"/>'+
 '<ellipse cx="'+a.x+'" cy="'+a.y+'" rx="'+(wd*2.7)+'" ry="'+(wd*3.3)+'" fill="#402d1c" stroke="#b08b58" stroke-width=".8"/>'+
 '<circle cx="'+a.x+'" cy="'+a.y+'" r="'+(wd*1.6)+'" fill="'+color+'"/>'+
 '<circle cx="'+a.x+'" cy="'+a.y+'" r="'+glow.toFixed(1)+'" fill="url(#lamp-aura)" opacity=".65" style="pointer-events:none"/>';
 return{depth:a.depth,order:200000+i,html:'<g>'+html+'</g>'};
}
const extraLamps=[{x:1010,y:991},{x:1150,y:1000},{x:895,y:970},{x:1270,y:1020}];
function paint(){
 pending=false;paintCount++;
 const rect=svg.getBoundingClientRect();width=Math.max(320,rect.width);height=Math.max(200,rect.height);
 view=G.camera(S.target,S.yaw,S.height,S.distance,width,height,S.zoom);
 const nearby=world.buildings.filter(b=>G.distance2(b,S.target)<540*540)
  .sort((a,b)=>G.distance2(a,S.target)-G.distance2(b,S.target)).slice(0,90);
 const faces=nearby.flatMap(buildingFaces);
 const lamps=world.props.filter(p=>p.type==="streetLamp"&&G.distance2(p,S.target)<450*450).slice(0,35).concat(extraLamps);
 lamps.forEach((p,i)=>{const f=lamp(p,i);if(f)faces.push(f)});
 G.depthSort(faces);lastFaceCount=faces.length;
 svg.setAttribute("viewBox","0 0 "+width+" "+height);
 // Keep scene SVG-only: no image, canvas, WebGL texture or external pattern.
 svg.innerHTML='<defs>'+
 '<radialGradient id="lamp-aura"><stop offset="0" stop-color="#ffc177" stop-opacity=".48"/><stop offset="1" stop-color="#ffc177" stop-opacity="0"/></radialGradient>'+
 '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18191a"/><stop offset=".66" stop-color="#3c342c"/><stop offset="1" stop-color="#544533"/></linearGradient>'+
 '</defs><rect width="'+width+'" height="'+height+'" fill="url(#sky)"/>'+
 '<g id="ground-layer">'+groundTile()+roadSurface()+'</g>'+
 '<g id="architecture-layer">'+faces.map(f=>f.html).join("")+'</g>'+
 '<rect width="'+width+'" height="'+height+'" fill="url(#edge-vignette)" pointer-events="none" opacity="0"/>';
 $("yaw-val").textContent=Math.round(S.yaw)+"°";
 $("eye-val").textContent=Math.round(S.height)+" u";
 $("zoom-val").textContent=S.zoom.toFixed(2)+"×";
 $("stat-faces").textContent=lastFaceCount;
 $("stat-near").textContent=nearby.length;
 $("stat-parcels").textContent=world.buildings.length;
 const selected=world.buildings[S.selected];
 $("selected-title").textContent=selected?glyph(selected.type)+" · LOTTO "+(selected.id+1):"Nessun edificio";
 $("selected-sub").textContent=selected?"Cross Street e dintorni · "+selected.floors+" piani · "+selected.road:"Seleziona un palazzo per esaminarlo";
 $("camera-mode").textContent="CAMERA A QUOTA LAMPIONE · VETTORIALE 3D";
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(paint)}}
function updateAngle(a){S.yaw=(a%360+360)%360;$("yaw-control").value=S.y;schedule()}
function updateHeight(h){S.height=clamp(h,24,120);$("height-control").value=S.height;schedule()}
function updateZoom(z){S.zoom=clamp(z,.55,3.6);$("zoom-control").value=S.zoom;schedule()}
function pan(step,side){
 const a=S.yaw*Math.PI/180;
 // Forward on the street is toward the direction that the camera looks.
 const fx=-Math.cos(a),fy=-Math.sin(a);
 S.target.x=clamp(S.target.x+step*fx+side*(-fy),12,world.width-12);
 S.target.y=clamp(S.target.y+step*fy+side*fx,12,world.height-12);
 schedule();
}
$("yaw-control").addEventListener("input",e=>updateAngle(+e.target.value));
$("height-control").addEventListener("input",e=>updateHeight(+e.target.value));
$("zoom-control").addEventListener("input",e=>updateZoom(+e.target.value));
document.querySelectorAll("[data-yaw]").forEach(b=>b.addEventListener("click",()=>updateAngle(+b.dataset.yaw)));
$("cam-reset").addEventListener("click",()=>{S.target={x:1055,y:969,z:10};updateHeight(39);updateZoom(1);updateAngle(86)});
$("cam-top").addEventListener("click",()=>{updateHeight(105);updateZoom(.75)});
$("cam-street").addEventListener("click",()=>{updateHeight(39);updateZoom(1.15)});
$("btn-wire").addEventListener("click",()=>{S.wire=!S.wire;svg.classList.toggle("wire",S.wire);$("btn-wire").setAttribute("aria-pressed",String(S.wire));});
document.querySelectorAll("[data-pan]").forEach(el=>el.addEventListener("click",()=>{
 const type=el.dataset.pan;if(type==="forward")pan(27,0);else if(type==="back")pan(-27,0);else if(type==="left")pan(0,-27);else pan(0,27);
}));
svg.addEventListener("click",e=>{
 const el=e.target.closest("[data-lot]");if(!el)return;
 const id=Number(el.getAttribute("data-lot"));if(!Number.isInteger(id))return;
 S.selected=id;schedule();
});
svg.addEventListener("wheel",e=>{e.preventDefault();updateZoom(S.zoom*Math.exp(-e.deltaY*.0009))},{passive:false});
const pointers=new Map();let mouseDrag=null,prevPinch=null,suppressClick=false;
svg.addEventListener("pointerdown",e=>{
 svg.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 mouseDrag={x:e.clientX,y:e.clientY,button:e.button};
 if(pointers.size>1)prevPinch=null;
});
svg.addEventListener("pointermove",e=>{
 if(!pointers.has(e.pointerId))return;
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){
  const [a,b]=[...pointers.values()],dist=Math.hypot(a.x-b.x,a.y-b.y);
  if(prevPinch){updateZoom(S.zoom*dist/prevPinch);suppressClick=true}
  prevPinch=dist;return;
 }
 if(!mouseDrag)return;
 const dx=e.clientX-mouseDrag.x,dy=e.clientY-mouseDrag.y;
 if(Math.abs(dx)+Math.abs(dy)>2)suppressClick=true;
 if(mouseDrag.button===2||e.shiftKey)pan(dy*.65,-dx*.65);
 else updateAngle(S.yaw+dx*.34);
 mouseDrag.x=e.clientX;mouseDrag.y=e.clientY;
});
for(const type of["pointerup","pointercancel","lostpointercapture"])svg.addEventListener(type,e=>{
 pointers.delete(e.pointerId);if(!pointers.size){mouseDrag=null;prevPinch=null}
});
svg.addEventListener("click",e=>{if(suppressClick){e.stopImmediatePropagation();suppressClick=false}},true);
svg.addEventListener("contextmenu",e=>e.preventDefault());
window.addEventListener("keydown",e=>{
 const key=e.key.toLowerCase();
 if(["arrowup","w"].includes(key))pan(25,0);
 else if(["arrowdown","s"].includes(key))pan(-25,0);
 else if(["arrowleft","a"].includes(key))pan(0,-25);
 else if(["arrowright","d"].includes(key))pan(0,25);
 else if(key==="q")updateAngle(S.yaw-15);
 else if(key==="e")updateAngle(S.yaw+15);
 else if(key==="+")updateZoom(S.zoom*1.16);
 else if(key==="-")updateZoom(S.zoom/1.16);
});
new ResizeObserver(schedule).observe(svg);
$("yaw-control").value=S.yaw;$("height-control").value=S.height;$("zoom-control").value=S.zoom;
schedule();
window.QOStreetLab={state:S,redraw:schedule,world};
})();
