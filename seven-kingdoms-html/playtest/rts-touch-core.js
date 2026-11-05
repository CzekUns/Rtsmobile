/* Reusable, game-agnostic RTS touch interactions. GPL-2.0-only.
 * Units are selected in SCREEN pixels to match the user's visible box;
 * formation targets are WORLD grid cells. No DOM, simulation, or 7KAA imports.
 */
const isFinitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export function selectionRect(a,b){
 if(!isFinitePoint(a)||!isFinitePoint(b))return null;
 const left=Math.min(a.x,b.x),right=Math.max(a.x,b.x);
 const top=Math.min(a.y,b.y),bottom=Math.max(a.y,b.y);
 return {left,top,right,bottom,width:right-left,height:bottom-top};
}
export function selectUnitsInBox(units,a,b,project,{owner=1}={}){
 const rect=selectionRect(a,b);
 if(!rect||typeof project!=='function'||!Array.isArray(units))return [];
 const result=[],seen=new Set();
 for(const unit of units){
  if(unit.owner!==owner||!unit.id||seen.has(unit.id))continue;
  const p=project(unit);
  if(!isFinitePoint(p))continue;
  if(p.x>=rect.left&&p.x<=rect.right&&p.y>=rect.top&&p.y<=rect.bottom){
   result.push(unit.id);seen.add(unit.id);
  }
 }
 return result;
}
export function formationCells(x,y,width,height,{radius=8}={}){
 if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)return [];
 x=Math.floor(x);y=Math.floor(y);radius=Math.max(0,Math.min(32,Math.floor(radius)));
 const offsets=[];
 for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)
  offsets.push({dx,dy});
 offsets.sort((a,b)=>{
  const da=a.dx*a.dx+a.dy*a.dy,db=b.dx*b.dx+b.dy*b.dy;
  return da-db||a.dy-b.dy||a.dx-b.dx;
 });
 return offsets.map(p=>({x:x+p.dx,y:y+p.dy})).filter(p=>
  p.x>=0&&p.y>=0&&p.x<width&&p.y<height);
}
export function dragMode({placing=false,modifier=false,button=0}={}){
 if(placing)return 'placement';
 if(modifier||button===2)return 'pan';
 return 'box';
}
