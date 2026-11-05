/* Quartieri d'Ombra: deterministic editable city scenery, not a historic cadastral tracing. */
const QOBoardWorld=(function(){
"use strict";
const WIDTH=2700,HEIGHT=2100,HUB={x:1320,y:1030},ISO={sx:.76,sy:.38};
const DATA=[
 ["Cross Street",44,"main",[[1320,1030],[1050,990],[730,912],[320,895],[-60,960]]],
 ["Anthony Street",47,"main",[[1320,1030],[1590,947],[1910,855],[2290,838],[2790,720]]],
 ["Orange Street",40,"main",[[1320,1030],[1233,772],[1158,525],[1090,250],[998,-90]]],
 ["Little Water Street",35,"main",[[1320,1030],[1194,1330],[1014,1590],[720,1900],[466,2200]]],
 ["Mulberry Bend",39,"main",[[1320,1030],[1530,1230],[1790,1480],[2110,1750],[2520,2180]]],
 ["Baxter Passage",25,"lane",[[35,180],[355,352],[650,520],[953,703],[1155,817]]],
 ["Ragpickers Lane",22,"lane",[[92,600],[376,621],[620,695],[797,902]]],
 ["Old Stable Row",23,"lane",[[264,1170],[550,1147],[823,1111],[1078,1010]]],
 ["Tanners Alley",20,"lane",[[182,1580],[492,1473],[850,1377],[1160,1323]]],
 ["Church Walk",26,"lane",[[695,2050],[900,1762],[1203,1530],[1540,1430]]],
 ["Shipwrights Road",27,"lane",[[1435,80],[1592,282],[1710,504],[1850,880]]],
 ["Shambles Lane",24,"lane",[[1666,128],[1875,295],[2160,427],[2670,452]]],
 ["Market Cut",24,"lane",[[1580,1100],[1907,1064],[2230,1095],[2700,1190]]],
 ["Foundry Road",27,"lane",[[1840,1520],[2090,1444],[2380,1440],[2770,1580]]],
 ["Lantern Passage",20,"lane",[[1450,1800],[1563,1920],[1690,2128]]],
 ["Cobbler Row",21,"lane",[[75,2030],[293,1890],[520,1721]]],
 ["Dock Approach",30,"lane",[[2222,103],[2351,254],[2524,435],[2700,590]]],
 ["Grays Court",19,"lane",[[72,1320],[390,1295],[680,1215]]],
 ["Mott Cut",23,"lane",[[1467,538],[1640,596],[1830,707],[2080,750]]],
 ["Narrow Yard",19,"lane",[[910,121],[797,316],[720,500],[765,685]]],
 ["Carters Turn",23,"lane",[[2104,1840],[2335,1832],[2640,1880]]]
];
const WALLS=["#594033","#644638","#49362e","#5c4438","#6c503e","#4f3a32","#725744","#54413a","#44342d"];
const ROOFS=["#383431","#4d443c","#342f2c","#514339","#433a35","#383a37","#5c4b3c"];
function project(x,y){return{x:(x-y)*ISO.sx,y:(x+y)*ISO.sy}}
function inverse(x,y){const a=x/ISO.sx,b=y/ISO.sy;return{x:(a+b)/2,y:(b-a)/2}}
function random(seed){let s=seed>>>0;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function distSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,mag=dx*dx+dy*dy||1;const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/mag));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
function polygon(cx,cy,t,n,w,d){const a=t.x*w/2,b=t.y*w/2,c=n.x*d/2,e=n.y*d/2;return [
 {x:cx-a-c,y:cy-b-e},{x:cx+a-c,y:cy+b-e},{x:cx+a+c,y:cy+b+e},{x:cx-a+c,y:cy-b+e}
]}
function overlaps(a,b,gap=3){
 for(const poly of[a,b])for(let k=0;k<4;k++){
  const p=poly[k],q=poly[(k+1)%4],nx=p.y-q.y,ny=q.x-p.x,len=Math.hypot(nx,ny)||1;
  const vals=x=>(x.x*nx+x.y*ny)/len,va=a.map(vals),vb=b.map(vals);
  if(Math.max(...va)+gap<Math.min(...vb)||Math.max(...vb)+gap<Math.min(...va))return false;
 }
 return true;
}
function sector(p){return{col:Math.min(2,Math.max(0,Math.floor(p.x/WIDTH*3))),row:Math.min(2,Math.max(0,Math.floor(p.y/HEIGHT*3)))}}
function roads(){return DATA.map(([name,width,kind,points],i)=>({id:i,name,width,kind,points:points.map(([x,y])=>({x,y}))}))}
function type(r,road,d){
 const x=r();
 if(road.kind==="main"&&d<590&&x<.22)return"shop";
 if(x<.08)return"tavern";if(x<.17)return"warehouse";
 if(x<.25)return"workshop";if(x<.32)return"stable";
 if(x<.44)return"shop";if(x<.68)return"tenement";return"residence";
}
function generate(seed=1860){
 const rnd=random(seed),lines=roads(),buildings=[],props=[],bucket=new Map();
 const cell=(x,y)=>Math.floor(x/115)+","+Math.floor(y/115);
 function near(x,y){
  const ax=Math.floor(x/115),ay=Math.floor(y/115),out=new Set();
  for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)(bucket.get((ax+i)+","+(ay+j))||[]).forEach(b=>out.add(b));
  return [...out];
 }
 function occupy(b){
  for(const pt of [...b.poly,{x:b.x,y:b.y}]){
   const k=cell(pt.x,pt.y);if(!bucket.has(k))bucket.set(k,[]);bucket.get(k).push(b);
  }
 }
 function crossesRoad(poly){
  const checks=[...poly,...poly.map((p,i)=>({x:(p.x+poly[(i+1)%4].x)/2,y:(p.y+poly[(i+1)%4].y)/2}))];
  for(const road of lines)for(let k=1;k<road.points.length;k++)
   if(checks.some(p=>distSegment(p,road.points[k-1],road.points[k])<road.width/2+4))return true;
  return false;
 }
 for(const road of lines)for(let j=1;j<road.points.length;j++){
  const a=road.points[j-1],b=road.points[j],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);
  if(L<55)continue;const t={x:dx/L,y:dy/L},n={x:-t.y,y:t.x};
  for(const side of[-1,1]){
   let progress=18+rnd()*24;
   while(progress<L-18){
    const w=37+rnd()*33,d=29+rnd()*28;
    progress+=w+4+rnd()*11;
    const outward={x:n.x*side,y:n.y*side};
    const shift=road.width/2+9+d/2;
    const x=a.x+(progress-w/2)*t.x+outward.x*shift,y=a.y+(progress-w/2)*t.y+outward.y*shift;
    const poly=polygon(x,y,t,outward,w,d);
    if(poly.some(p=>p.x<10||p.y<10||p.x>WIDTH-10||p.y>HEIGHT-10))continue;
    if(Math.hypot(x-HUB.x,y-HUB.y)<70||crossesRoad(poly))continue;
    if(near(x,y).some(q=>distance({x,y},q)<125&&overlaps(poly,q.poly,2)))continue;
    const archetype=type(rnd,road,Math.hypot(x-HUB.x,y-HUB.y));
    const floors=archetype==="stable"?1:archetype==="warehouse"||archetype==="workshop"?2+Math.floor(rnd()*2):2+Math.floor(rnd()*4);
    const v={id:buildings.length,x,y,poly,w,d,roadId:road.id,road:road.name,
      type:archetype,floors,section:sector({x,y}),z:19+floors*(11.4+rnd()*1.8),
      wall:WALLS[Math.floor(rnd()*WALLS.length)],roof:ROOFS[Math.floor(rnd()*ROOFS.length)],
      seed:Math.floor(rnd()*1e6),shopfront:archetype==="shop"||archetype==="tavern",
      controlled:buildings.length%23===0,door:{x:x-outward.x*(d/2+2),y:y-outward.y*(d/2+2)}};
    buildings.push(v);occupy(v);
    if(rnd()<.34)props.push({x:v.door.x,y:v.door.y,type:rnd()<.52?"barrel":"crate",seed:v.seed});
   }
  }
 }
 for(const lane of lines){
  const total=lane.points.slice(1).reduce((sum,p,i)=>sum+distance(lane.points[i],p),0);
  const count=Math.floor(total/(lane.kind==="main"?155:225));
  for(let i=0;i<count;i++){
   let dt=(i+.48)/count*total;
   for(let j=1;j<lane.points.length;j++){
    const a=lane.points[j-1],b=lane.points[j],len=distance(a,b);
    if(dt>len){dt-=len;continue}
    const x=a.x+(b.x-a.x)*dt/len,y=a.y+(b.y-a.y)*dt/len;
    const nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;
    const p={x:x+nx*(lane.width/2+8),y:y+ny*(lane.width/2+8)};
    if(p.x>12&&p.y>12&&p.x<WIDTH-12&&p.y<HEIGHT-12
      &&!near(p.x,p.y).some(q=>distance(p,q)<24)){
      props.push({x:p.x,y:p.y,type:i%8===0?"cart":i%3===0?"streetLamp":"lantern",seed:Math.floor(rnd()*1e6)});
    }break;
   }
  }
 }
 const sectors=[];
 for(let row=0;row<3;row++)for(let col=0;col<3;col++)
  sectors.push({row,col,id:row*3+col,buildings:buildings.filter(b=>b.section.row===row&&b.section.col===col).length});
 const corners=[project(0,0),project(WIDTH,0),project(WIDTH,HEIGHT),project(0,HEIGHT)];
 const bounds={minX:Math.min(...corners.map(p=>p.x))-100,maxX:Math.max(...corners.map(p=>p.x))+100,
  minY:-140,maxY:Math.max(...corners.map(p=>p.y))+100};
 return{seed,width:WIDTH,height:HEIGHT,hub:HUB,roads:lines,buildings,props,sectors,bounds};
}
return{WIDTH,HEIGHT,HUB,ISO,project,inverse,sector,generate,overlaps,distSegment};
})();
if(typeof window!=="undefined")window.QOBoardWorld=QOBoardWorld;
if(typeof module!=="undefined"&&module.exports)module.exports=QOBoardWorld;
