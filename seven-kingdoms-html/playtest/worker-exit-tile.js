/* Deterministic, non-teleporting spawn position for a worker leaving a firm.
 * This is an integration safety adapter, not a claim of 7KAA exit parity.
 * No state mutation: callers must check for null before removing staff.
 */
export function findWorkerExitTile(firm,{width,height,isBlocked}){
  if(!firm||!Number.isFinite(firm.x)||!Number.isFinite(firm.y)||
     !Number.isFinite(firm.size)||firm.size<1)return null;
  const left=Math.floor(firm.x),top=Math.floor(firm.y),size=Math.ceil(firm.size);
  // Search outward rings in stable order, preferring the east-side entrance.
  for(let radius=0;radius<Math.max(width,height);radius++){
    const minX=left-1-radius,maxX=left+size+radius;
    const minY=top-1-radius,maxY=top+size+radius;
    const candidates=[];
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      if(x!==minX&&x!==maxX&&y!==minY&&y!==maxY)continue;
      candidates.push({x,y});
    }
    candidates.sort((a,b)=>{
      const score=p=>Math.abs(p.x-(left+size))+Math.abs(p.y-(top+1));
      return score(a)-score(b)||a.y-b.y||a.x-b.x;
    });
    for(const p of candidates){
      if(p.x<0||p.y<0||p.x>=width||p.y>=height)continue;
      if(!isBlocked(p.x,p.y))return p;
    }
  }
  return null;
}
