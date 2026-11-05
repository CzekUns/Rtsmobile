/* Quartieri d'Ombra: authoritative editable blueprint, visual layers and hit regions.
 * Works in projected world coordinates; independent of any ImageGen artwork.
 * A continuous block image can replace the render but never these hitboxes. */
const QOBoardSkeleton=(function(){
"use strict";
const point=(x,y)=>({x,y});
const lerp=(a,b,t)=>point(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);
const center=arr=>point(arr.reduce((s,p)=>s+p.x,0)/arr.length,arr.reduce((s,p)=>s+p.y,0)/arr.length);
const bounds=arr=>({left:Math.min(...arr.map(p=>p.x)),top:Math.min(...arr.map(p=>p.y)),
 right:Math.max(...arr.map(p=>p.x)),bottom:Math.max(...arr.map(p=>p.y))});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function contains(p,poly){
 let hit=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;
 }
 return hit;
}
function segmentDistance(p,a,b){
 const x=b.x-a.x,y=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y||1)));
 return dist(p,point(a.x+x*t,a.y+y*t));
}
function create(world,project,rows){
 const lots=world.buildings.map(b=>{
  const ground=b.poly.map(p=>project(p.x,p.y));
  const roof=ground.map(p=>point(p.x,p.y-b.z));
  const centerWorld=project(b.x,b.y);
  const polygons=[...Array(4)].map((_,i)=>[ground[i],ground[(i+1)%4],roof[(i+1)%4],roof[i]]);
  const facing=polygons.map((p,i)=>({
   side:i===0?"street":i===2?"rear":i===1?"right":"left",
   edge:i,poly:p,
   visible:(ground[i].y+ground[(i+1)%4].y)/2>=centerWorld.y-2
  }));
  const door=project(b.door.x,b.door.y);
  const use=(b.type==="residence"||b.type==="tenement")?"residential":
            (b.type==="shop"||b.type==="workshop"||b.type==="tavern"||b.type==="warehouse"||b.type==="stable")?"active":"decorative";
  const rowRoot=rows.groupByBuilding?.get(b.id)??b.id;
  return{building:b,id:b.id,use,roof,ground,faces:facing,door,
   labelPoint:lerp(center(roof),door,.52),projectedCenter:centerWorld,
   projectedBounds:bounds([...ground,...roof]),rowRoot,
   frontage:[ground[0],ground[1]],rear:[ground[2],ground[3]]};
 });
 const byId=new Map(lots.map(l=>[l.id,l]));
 const ordered=[...lots].sort((a,b)=>Math.max(...a.ground.map(p=>p.y))-Math.max(...b.ground.map(p=>p.y))||a.id-b.id);
 // A "visual group" is an artistic chunk; it contains multiple independent lots.
 const groups=new Map();
 for(const l of lots){if(!groups.has(l.rowRoot))groups.set(l.rowRoot,[]);groups.get(l.rowRoot).push(l)}
 const chunks=[...groups.entries()].map(([id,entries])=>{
  const frame=bounds(entries.flatMap(e=>[...e.roof,...e.ground]));
  const margin=18;
  return{id:"block-"+id,root:id,lotIds:entries.map(e=>e.id),
   frame:{left:Math.floor(frame.left-margin),top:Math.floor(frame.top-margin),
   width:Math.ceil(frame.right-frame.left+margin*2),
   height:Math.ceil(frame.bottom-frame.top+margin*2)},
   level:"source",art:null};
 });
 const chunkByLot=new Map(chunks.flatMap(c=>c.lotIds.map(id=>[id,c])));
 return{lots,byId,ordered,chunks,chunkByLot,world,project};
}
function pick(skeleton,p){
 // Hit the topmost *actual shape* instead of a rectangle around a sprite.
 // Roof first, visible walls second. Projected street polygons are checked last.
 for(let i=skeleton.ordered.length-1;i>=0;i--){
  const lot=skeleton.ordered[i];
  const r=lot.projectedBounds;
  if(p.x<r.left-1||p.x>r.right+1||p.y<r.top-1||p.y>r.bottom+1)continue;
  if(contains(p,lot.roof))return{kind:"building",lot,side:"roof"};
  const fronts=[...lot.faces].reverse();
  for(const f of fronts){
   if(f.visible&&contains(p,f.poly))
    return{kind:"building",lot,side:f.side};
  }
 }
 const g=(function(){const s=skeleton.world;const unproject=s.inverse;return unproject?unproject(p.x,p.y):null})();
 // Unlike building collision, street identification must never select a
 // building just because a transparent image overlaps its bounding box.
 if(g){
  let best=null,nearest=Infinity;
  for(const road of skeleton.world.roads)for(let k=1;k<road.points.length;k++){
   const d=segmentDistance(g,road.points[k-1],road.points[k]);
   if(d<road.width/2&&d<nearest){nearest=d;best=road}
  }
  if(best)return{kind:"street",road:best,side:"street"};
 }
 return{kind:"empty"};
}
function svgGuide(skeleton,chunkId,options={}){
 const chunk=skeleton.chunks.find(c=>c.id===chunkId);
 if(!chunk)throw new Error("Unknown chunk: "+chunkId);
 const f=chunk.frame,pad=24,frame={left:f.left-pad,top:f.top-pad,
  width:f.width+pad*2,height:f.height+pad*2};
 const path=poly=>poly.map((p,i)=>(i?"L":"M")+
    (p.x-frame.left).toFixed(1)+" "+(p.y-frame.top).toFixed(1)).join(" ")+"Z";
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
 const shapes=chunk.lotIds.map(id=>{
  const lot=skeleton.byId.get(id);
  const roof=path(lot.roof),ground=path(lot.ground);
  const fa=lot.frontage.map(p=>[(p.x-frame.left).toFixed(1),(p.y-frame.top).toFixed(1)].join(",")).join(" ");
  const label=lot.labelPoint;
  const fill=lot.use==="residential"?"#918064":"#73574e";
  return'<path d="'+ground+'" fill="#39322b" stroke="#c7b99a" stroke-width=".8"/>'+
   '<path d="'+roof+'" fill="'+fill+'" stroke="#f1d4a2" stroke-width="1.4"/>'+
   '<polyline points="'+fa+'" stroke="#e5aa55" stroke-width="3" fill="none"/>'+
   '<circle cx="'+(lot.door.x-frame.left).toFixed(1)+'" cy="'+(lot.door.y-frame.top).toFixed(1)+'" r="2.6" fill="#d75f4b"/>'+
   '<text x="'+(label.x-frame.left).toFixed(1)+'" y="'+(label.y-frame.top).toFixed(1)+
    '" text-anchor="middle" fill="#fbecd2" font-size="9">'+escape(id)+'</text>';
 }).join("");
 // The transparent graphic is a precise technical placement guide ONLY,
 // not a final art sprite. ImageGen output must align with these bounds.
 return'<svg xmlns="http://www.w3.org/2000/svg" width="'+frame.width+'" height="'+frame.height+
  '" viewBox="0 0 '+frame.width+' '+frame.height+'">'+
  '<title>'+escape(options.title||chunkId)+' — isometric parcel guide</title>'+
  '<desc>Orange frontages face the street; red dots mark doors; numbered roofs are per-building hitboxes. Preserve camera orientation, footprint and height.</desc>'+
  shapes+'</svg>';
}
return{create,pick,contains,segmentDistance,svgGuide};
})();
if(typeof window!=="undefined")window.QOBoardSkeleton=QOBoardSkeleton;
if(typeof module!=="undefined"&&module.exports)module.exports=QOBoardSkeleton;
