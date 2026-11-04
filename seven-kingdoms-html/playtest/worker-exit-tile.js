/* Find a safe tile for a worker who exits a firm.
 * Never mutate the roster before a valid location has been found.
 * Implementation is a conservative demo adapter, not verified 7KAA parity.
 */
export function findWorkerExitTile(firm,{width,height,isBlocked}={}){
 if(!firm||![firm.x,firm.y,firm.size,width,height].every(Number.isSafeInteger)||
    firm.size<1||width<1||height<1||typeof isBlocked!=='function')return null;
 const left=firm.x,top=firm.y,right=left+firm.size,bottom=top+firm.size;
 // Grow square search rings from the outer edge of the building, starting
 // with the east-side entrance as in the pre-existing UI.
 for(let radius=0;radius<Math.max(width,height);radius++){
  const x0=left-1-radius,x1=right+radius;
  const y0=top-1-radius,y1=bottom+radius;
  const candidates=[];
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   if(x!==x0&&x!==x1&&y!==y0&&y!==y1)continue;
   if(x<0||y<0||x>=width||y>=height)continue;
   candidates.push({x,y});
  }
  candidates.sort((a,b)=>{
   const distance=p=>Math.abs(p.x-right)+Math.abs(p.y-(top+1));
   return distance(a)-distance(b)||a.y-b.y||a.x-b.x;
  });
  for(const p of candidates)if(!isBlocked(p.x,p.y))return p;
 }
 return null;
}
