/* Geometry-locked chunk masks and selection occlusion. 2D projected units only.
 * Images are visual sources; the lot geometry always owns hit regions/depth. */
const QOSelectionOverlay=(function(){
"use strict";
const EPS=1e-7;
function depth(lot){return Math.max(...lot.ground.map(p=>p.y))}
function intersects(a,b){return a.left<=b.right&&a.right>=b.left&&a.top<=b.bottom&&a.bottom>=b.top}
function hull(points){
 const sorted=[...points].sort((a,b)=>a.x-b.x||a.y-b.y);
 const unique=sorted.filter((p,i)=>!i||p.x!==sorted[i-1].x||p.y!==sorted[i-1].y);
 if(unique.length<=2)return unique;
 const cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
 const lower=[],upper=[];
 for(const p of unique){while(lower.length>=2&&cross(lower[lower.length-2],lower[lower.length-1],p)<=0)lower.pop();lower.push(p)}
 for(let i=unique.length-1;i>=0;i--){const p=unique[i];while(upper.length>=2&&cross(upper[upper.length-2],upper[upper.length-1],p)<=0)upper.pop();upper.push(p)}
 lower.pop();upper.pop();return lower.concat(upper);
}
function silhouette(lot){return hull([...lot.ground,...lot.roof])}
function trace(ctx,points){
 if(!points.length)return;
 ctx.moveTo(points[0].x,points[0].y);
 for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
 ctx.closePath();
}
function clipLot(ctx,lot){ctx.beginPath();trace(ctx,silhouette(lot));ctx.clip()}
function occluders(skeleton,lot){
 const z=depth(lot),b=lot.projectedBounds;
 return skeleton.ordered.filter(other=>other.id!==lot.id&&depth(other)>z+EPS&&intersects(other.projectedBounds,b));
}
function clipVisible(ctx,skeleton,lot){
 const blocks=occluders(skeleton,lot);
 for(const other of blocks){
  // Sequential even/odd clips produce the intersection of unobscured areas.
  // One combined even/odd path would incorrectly reveal double overlap.
  ctx.beginPath();ctx.rect(-10000,-10000,20000,20000);
  trace(ctx,silhouette(other));ctx.clip("evenodd");
 }
 return blocks.length;
}
function roofCenter(lot){
 return{x:lot.roof.reduce((s,p)=>s+p.x,0)/lot.roof.length,
  y:lot.roof.reduce((s,p)=>s+p.y,0)/lot.roof.length};
}
return{depth,intersects,hull,silhouette,trace,clipLot,occluders,clipVisible,roofCenter};
})();
if(typeof window!=="undefined")window.QOSelectionOverlay=QOSelectionOverlay;
if(typeof module!=="undefined"&&module.exports)module.exports=QOSelectionOverlay;
