/* Quartieri d'Ombra — street-front continuity, deterministic and independent
   of game logic. All geometry is 2D ground data, never image coordinates. */
const QOBlockContinuity=(function(){
 "use strict";
 const radians=d=>d*Math.PI/180;
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const unit=v=>{const m=Math.hypot(v.x,v.y)||1;return{x:v.x/m,y:v.y/m}};
 const difference=(a,b)=>Math.abs((a-b+270)%180-90);
 const middle=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 function frontage(b,project){
  const poly=b.poly,frontA=poly[0],frontB=poly[1],rearA=poly[3],rearB=poly[2];
  const center=project(b.x,b.y),door=project(b.door.x,b.door.y);
  const p0=project(frontA.x,frontA.y),p1=project(frontB.x,frontB.y);
  const groundDirection=unit({x:frontB.x-frontA.x,y:frontB.y-frontA.y});
  const inward=unit({x:b.x-middle(frontA,frontB).x,y:b.y-middle(frontA,frontB).y});
  const angle=((Math.atan2(p1.y-p0.y,p1.x-p0.x)*180/Math.PI)%180+180)%180;
  const a=difference(angle,26.565051),c=difference(angle,153.434949);
  const facing=door.y>center.y+1;
  const kind=facing&&Math.min(a,c)<=22?(a<=c?"A":"B"):"unmatched";
  return{b,frontA,frontB,rearA,rearB,groundDirection,inward,angle,
    facing,kind,error:Math.min(a,c)};
 }
 function build(buildings,project){
  const fronts=buildings.map(b=>frontage(b,project)),byId=new Map(fronts.map(f=>[f.b.id,f]));
  const byRoad=new Map();
  for(const f of fronts){
   const key=f.b.roadId;
   if(!byRoad.has(key))byRoad.set(key,[]);
   byRoad.get(key).push(f);
  }
  const joints=[],usedEnds=new Set();
  function candidate(a,b){
   if(a.b.id===b.b.id||a.b.roadId!==b.b.roadId)return null;
   if(a.groundDirection.x*b.groundDirection.x+a.groundDirection.y*b.groundDirection.y<.94)return null;
   if(a.inward.x*b.inward.x+a.inward.y*b.inward.y<.93)return null;
   const ab=dist(a.frontB,b.frontA),ba=dist(b.frontB,a.frontA);
   const forward=ab<=ba?a:b,back=ab<=ba?b:a,gap=Math.min(ab,ba);
   if(gap>18||gap<.25)return null;
   const leftEnd=forward.b.id+":right",rightEnd=back.b.id+":left";
   // Similar rear corners keep the join parallel to its row frontage.
   const rearGap=dist(forward.rearB,back.rearA);
   if(rearGap>27)return null;
   const frontMid=middle(forward.frontB,back.frontA);
   const rearMid=middle(forward.rearB,back.rearA);
   if(dist(frontMid,rearMid)<8)return null;
   return {left:forward.b.id,right:back.b.id,
    frontA:forward.frontB,frontB:back.frontA,
    rearA:forward.rearB,rearB:back.rearA,
    gap,rearGap,kind:gap<=11&&Math.abs(forward.b.z-back.b.z)<24?"shared":"passage",
    height:Math.min(forward.b.z,back.b.z),roadId:forward.b.roadId,
    slots:[leftEnd,rightEnd]};
  }
  // Closest compatible neighbors get priority; never connect across a road.
  const possible=[];
  for(const group of byRoad.values()){
   for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){
    const p=candidate(group[i],group[j]);if(p)possible.push(p);
   }
  }
  possible.sort((a,b)=>a.gap-b.gap||a.left-b.left||a.right-b.right);
  for(const p of possible){
   if(p.slots.some(s=>usedEnds.has(s)))continue;
   for(const end of p.slots)usedEnds.add(end);
   delete p.slots;joints.push(p);
  }
  const parents=new Map(fronts.map(f=>[f.b.id,f.b.id]));
  function root(x){let p=parents.get(x);while(p!==parents.get(p))p=parents.get(p);return p}
  function union(a,b){const x=root(a),y=root(b);if(x!==y)parents.set(Math.max(x,y),Math.min(x,y))}
  for(const j of joints)union(j.left,j.right);
  const groups=new Map();
  for(const f of fronts){const r=root(f.b.id);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(f.b.id)}
  const groupByBuilding=new Map(), ends=new Map();
  for(const [id,ids] of groups)for(const bId of ids)groupByBuilding.set(bId,id);
  for(const j of joints){
   ends.set(j.left,{...(ends.get(j.left)||{}),right:j.right});
   ends.set(j.right,{...(ends.get(j.right)||{}),left:j.left});
  }
  return{joints,byId,groupByBuilding,groups,ends,stats:{
   buildings:fronts.length,joins:joints.length,groups:groups.size,
   multiBuildingGroups:[...groups.values()].filter(g=>g.length>1).length,
   supported:fronts.filter(f=>f.kind!=="unmatched").length
  }};
 }
 return{build,frontage,difference};
})();
if(typeof window!=="undefined")window.QOBlockContinuity=QOBlockContinuity;
if(typeof module!=="undefined"&&module.exports)module.exports=QOBlockContinuity;
