/* Cross Street six-lot pilot: individually prerendered transparent Canvas sprites.
   No gameplay geometry changes; each sprite is anchored to the original footprint. */
(function(global){
"use strict";
const ids=new Set([2,3,4,9,10,11]);
const cache=new Map();
function make(b,project){
 if(!ids.has(b.id))return null;
 if(cache.has(b.id))return cache.get(b.id);
 const ground=b.poly.map(p=>project(p.x,p.y));
 const roof=ground.map(p=>({x:p.x,y:p.y-b.z}));
 const pts=[...ground,...roof];
 const minX=Math.floor(Math.min(...pts.map(p=>p.x))-8),minY=Math.floor(Math.min(...pts.map(p=>p.y))-13);
 const maxX=Math.ceil(Math.max(...pts.map(p=>p.x))+8),maxY=Math.ceil(Math.max(...pts.map(p=>p.y))+8);
 const c=document.createElement("canvas");c.width=maxX-minX;c.height=maxY-minY;
 const g=c.getContext("2d");g.translate(-minX,-minY);
 const pick=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
 function poly(a,fill,stroke="#261e1a",lw=.8){g.beginPath();a.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
 function seg(a,b,color,w=1){g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.strokeStyle=color;g.lineWidth=w;g.stroke()}
 const palette=["#70503d","#624333","#765744","#634638","#71503c","#6a4936"];
 const wall=palette[[2,3,4,9,10,11].indexOf(b.id)];
 // Street-facing elevation: front edge poly[0]->poly[1] is authoritative.
 for(const i of [2,1,0]){
  const j=(i+1)%4,base=[ground[i],ground[j]],top=[roof[i],roof[j]];
  poly([base[0],base[1],top[1],top[0]],i===0?wall:i===1?"#48352d":"#3c302b");
  if(i!==0)continue;
  const floors=Math.max(2,b.floors||3);
  for(let f=0;f<floors;f++){
   const y0=(f+.17)/floors,y1=(f+.71)/floors;
   const w=Math.max(2,Math.floor(Math.hypot(base[1].x-base[0].x,base[1].y-base[0].y)/12));
   for(let k=0;k<w;k++){
    const u=(k+.5)/w,span=.27/w;
    const at=(uu,v)=>pick(pick(top[0],top[1],uu),pick(base[0],base[1],uu),v);
    const win=[at(u-span,y0),at(u+span,y0),at(u+span,y1),at(u-span,y1)];
    poly(win,(k+f+b.id)%4===0?"#bc8751":"#2b2725","#a68a6c",.9);
    seg(at(u,y0),at(u,y1),"#332920",.8);
    seg(at(u-span*1.3,y1+.025),at(u+span*1.3,y1+.025),"#b19a7a",1.5);
   }
   const v=(f+1)/floors;
   seg(pick(top[0],base[0],v),pick(top[1],base[1],v),"#392b25",1.5);
  }
  // Brick course wear is clipped to actual front wall, not a rectangular decal.
  g.save();g.beginPath();[base[0],base[1],top[1],top[0]].forEach((p,n)=>n?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.clip();
  for(let k=0;k<60;k++){
   const u=((k*37+b.id*13)%101)/101,v=((k*23+b.id*7)%97)/97;
   const p=pick(pick(top[0],top[1],u),pick(base[0],base[1],u),v);
   g.fillStyle=k%3?"#2d24202e":"#b4977650";g.fillRect(p.x,p.y,2.3,.8);
  }
  g.restore();
 }
 poly(roof,b.id===9?"#4a3932":"#383738","#211e1d",1.6);
 // Roof seams align with the projected roof geometry.
 for(let t=.16;t<1;t+=.17)seg(pick(roof[0],roof[3],t),pick(roof[1],roof[2],t),"#80715e",.65);
 const chimney=pick(roof[0],roof[2],.42);
 poly([{x:chimney.x-4,y:chimney.y},{x:chimney.x+1,y:chimney.y-2},{x:chimney.x+1,y:chimney.y-15},{x:chimney.x-4,y:chimney.y-13}],"#5e4537");
 seg({x:chimney.x-5,y:chimney.y-14},{x:chimney.x+2,y:chimney.y-16},"#b29b7c",2);
 // Shared stone foundation across all six units, without independent opaque floor pads.
 seg(ground[0],ground[1],"#a38a6d",2.4);
 const result={tile:c,left:minX,top:minY};
 cache.set(b.id,result);return result;
}
global.QOCrossStreetKit={ids,make,cache};
})(window);
