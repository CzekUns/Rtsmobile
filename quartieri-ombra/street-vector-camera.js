/* Quartieri d'Ombra / isolated vector 3D camera experiment.
 * No ImageGen, no CSS rotate fake: 3D vertices and depth-sorted visible faces.
 * Coordinates come from QOBoardWorld, untouched. This does NOT change the game.
 */
(function(){
"use strict";
const svg=document.getElementById("scene"),status=document.getElementById("status");
const world=window.QOBoardWorld;
if(!world){status.textContent="Motore del quartiere non caricato";return}
const data=world.generate(1860),ids=[2,3,4,9,10,11],buildings=ids.map(id=>data.buildings[id]);
const center={x:buildings.reduce((s,b)=>s+b.x,0)/6,y:buildings.reduce((s,b)=>s+b.y,0)/6,z:15};
let yaw=45*Math.PI/180,height=25,distance=220,selected=null;
const el=(name,attrs,parent=svg)=>{const n=document.createElementNS("http://www.w3.org/2000/svg",name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));parent.appendChild(n);return n};
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const norm=v=>{const n=Math.hypot(v.x,v.y,v.z)||1;return{x:v.x/n,y:v.y/n,z:v.z/n}};
const plus=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const mul=(a,k)=>({x:a.x*k,y:a.y*k,z:a.z*k});
const interpolate=(a,b,t)=>plus(mul(a,1-t),mul(b,t));
const v=(p,z)=>({x:p.x,y:p.y,z});
function render(){
 const w=svg.clientWidth||window.innerWidth,h=svg.clientHeight||window.innerHeight;
 svg.setAttribute("viewBox",`0 0 ${w} ${h}`);
 svg.replaceChildren();
 // Orbit the look-at point: height is measured from street, not from roof.
 const eye={x:center.x+Math.cos(yaw)*distance,y:center.y+Math.sin(yaw)*distance,z:height};
 const forward=norm(sub(center,eye));
 const right=norm(cross(forward,{x:0,y:0,z:1}));
 const up=norm(cross(right,forward));
 const focal=Math.min(w*1.45,h*1.8);
 const project=p=>{
  const q=sub(p,eye),depth=dot(q,forward);
  if(depth<=4)return null;
  return{x:w/2+dot(q,right)*focal/depth,y:h*.50-dot(q,up)*focal/depth,depth};
 };
 const faces=[];
 // Ground reference, real 3D coordinates.
 const ground=[{x:center.x-500,y:center.y-500,z:-.4},{x:center.x+500,y:center.y-500,z:-.4},{x:center.x+500,y:center.y+500,z:-.4},{x:center.x-500,y:center.y+500,z:-.4}];
 faces.push({id:null,pts:ground,fill:"#514a3d",stroke:"#635847",ground:true});
 for(const b of buildings){
  const base=b.poly.map(p=>v(p,0)),roof=b.poly.map(p=>v(p,b.z));
  for(let i=0;i<4;i++){
   const j=(i+1)%4;
   const pts=[base[i],base[j],roof[j],roof[i]];
   faces.push({id:b.id,pts,fill:b.wall||"#946c56",stroke:"#3b2a24",type:"wall",floor:b.floors,edge:i});
   // Window rectangles are real facade coordinates, not pasted SVG patterns.
   const n=Math.max(1,Math.floor(Math.hypot(base[i].x-base[j].x,base[i].y-base[j].y)/16));
   for(let f=0;f<b.floors;f++)for(let k=0;k<n;k++){
    const l=(k+.23)/n,r=(k+.77)/n;
    const z0=(f+.29)*b.z/b.floors,z1=(f+.72)*b.z/b.floors;
    const p0=interpolate(base[i],base[j],l),p1=interpolate(base[i],base[j],r);
    faces.push({id:b.id,pts:[{...p0,z:z0},{...p1,z:z0},{...p1,z:z1},{...p0,z:z1}],fill:(f+k+b.id)%6===0?"#d9a658":"#302f2c",stroke:"#c1a17b",type:"window"});
   }
  }
  faces.push({id:b.id,pts:roof,fill:b.roof||"#494643",stroke:"#211e1b",type:"roof"});
 }
 // Reject back-facing surfaces, project all faces, then painter-sort every face
 // by camera depth. This fixes the fixed-lot order bug of the earlier 255° demo.
 const drawable=[];
 for(const face of faces){
  const p=face.pts,normal=cross(sub(p[1],p[0]),sub(p[2],p[0]));
  if(!face.ground&&face.type!=="window"&&dot(normal,sub(eye,p[0]))<=0)continue;
  const points=p.map(project);if(points.some(x=>!x))continue;
  drawable.push({...face,points,depth:points.reduce((s,q)=>s+q.depth,0)/points.length});
 }
 drawable.sort((a,b)=>b.depth-a.depth);
 for(const face of drawable){
  const pts=face.points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const selectedFace=face.id===selected;
  const shape=el("polygon",{points:pts,fill:face.fill,stroke:selectedFace?"#f8d282":face.stroke,"stroke-width":selectedFace?2:face.type==="window"?.8:1.3,"vector-effect":"non-scaling-stroke"});
  if(face.id!==null){shape.style.cursor="pointer";shape.addEventListener("click",e=>{e.stopPropagation();selected=face.id;render()})}
 }
 const chosen=buildings.find(b=>b.id===selected);
 status.textContent=`Angolo ${((yaw*180/Math.PI)%360+360)%360|0}° · altezza ${height} · distanza ${distance} · ${chosen?"Lotto "+(chosen.id+1)+" · "+chosen.type:"Seleziona un edificio"} · 6 edifici`;
}
const heightInput=document.getElementById("height"),distInput=document.getElementById("distance");
heightInput.addEventListener("input",()=>{height=+heightInput.value;document.getElementById("height-value").textContent=height;render()});
distInput.addEventListener("input",()=>{distance=+distInput.value;document.getElementById("distance-value").textContent=distance;render()});
document.getElementById("quarter").onclick=()=>{yaw+=Math.PI/2;render()};
document.getElementById("reset").onclick=()=>{yaw=Math.PI/4;height=25;distance=220;selected=null;heightInput.value=height;distInput.value=distance;document.getElementById("height-value").textContent=height;document.getElementById("distance-value").textContent=distance;render()};
const pointers=new Map();let pinch=null;
svg.addEventListener("pointerdown",e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture(e.pointerId)});
svg.addEventListener("pointermove",e=>{
 if(!pointers.has(e.pointerId))return;
 const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===1){yaw+=(e.clientX-prev.x)*.008;render()}
 else if(pointers.size===2){
  const ps=[...pointers.values()],d=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);
  if(pinch)distance=Math.max(95,Math.min(500,distance*pinch/d));
  pinch=d;distInput.value=distance;document.getElementById("distance-value").textContent=Math.round(distance);render();
 }
});
for(const event of ["pointerup","pointercancel","lostpointercapture"])svg.addEventListener(event,e=>{pointers.delete(e.pointerId);pinch=null});
svg.addEventListener("wheel",e=>{e.preventDefault();distance=Math.max(95,Math.min(500,distance*(e.deltaY>0?1.09:.91)));distInput.value=distance;document.getElementById("distance-value").textContent=Math.round(distance);render()},{passive:false});
window.addEventListener("resize",render);
render();
})();
