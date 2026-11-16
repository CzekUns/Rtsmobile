/* Original 7KAA PLANT atlas renderer. Asset pixels are source-derived;
 * demo placement is deterministic and is NOT the original world generator.
 * GPL-2.0-or-later. Falls back without affecting simulation.
 */
export const ORIGINAL_PLANT=Object.freeze({
 image:'../assets/previews/plant-original.png',
 manifest:'../assets/manifests/plant-original.json'
});
export function validatePlantManifest(data){
 if(data?.schemaVersion!==1||data.source!=='the3dfxdude/7kaa'||
    data.sourceCommit!=='14e6fdfba9481af4dc3a54722614a608776e20bc'||
    !Number.isInteger(data.width)||!Number.isInteger(data.height)||
    data.width<1||data.height<1||data.width*data.height>10000000||
    !Array.isArray(data.bitmaps)||data.bitmaps.length===0)return false;
 return data.bitmaps.every(b=>[b.x,b.y,b.width,b.height].every(Number.isInteger)&&
    b.x>=0&&b.y>=0&&b.width>0&&b.height>0&&
    b.x+b.width<=data.width&&b.y+b.height<=data.height&&
    Number.isInteger(b.offsetX)&&Number.isInteger(b.offsetY));
}
export function demoPlantIndex(seed,x,y,count){
 if(!Number.isInteger(count)||count<=0)return -1;
 // Stable visual placement only; no gameplay RNG or save-state changes.
 let h=(Math.imul(x|0,73856093)^Math.imul(y|0,19349663)^Math.imul(seed|0,83492791))>>>0;
 h^=h>>>16;h=Math.imul(h,0x7feb352d)>>>0;h^=h>>>15;
 return (h>>>0)%count;
}
export class OriginalPlantPreview{
 constructor({imageFactory=()=>new Image(),fetcher=fetch}={}){
  this.image=imageFactory();this.manifest=null;
  this.image.src=new URL(ORIGINAL_PLANT.image,import.meta.url).href;
  this.loading=Promise.resolve().then(()=>fetcher(new URL(ORIGINAL_PLANT.manifest,import.meta.url).href))
   .then(r=>{if(!r.ok)throw Error('plant manifest unavailable');return r.json()})
   .then(data=>{if(!validatePlantManifest(data))throw Error('invalid original plant manifest');this.manifest=data})
   .catch(()=>{this.manifest=null});
 }
 isReady(){return !!this.manifest&&this.image.complete&&this.image.naturalWidth===this.manifest.width&&this.image.naturalHeight===this.manifest.height}
 draw(ctx,x,y,t,seed,tileX,tileY){
  if(!this.isReady()||!Number.isFinite(t)||t<=0)return false;
  const records=this.manifest.bitmaps,index=demoPlantIndex(seed,tileX,tileY,records.length);
  const b=records[index];if(!b)return false;
  // 7KAA offsets are in source pixel coordinates (original tile = 32px).
  const scale=t/32,dx=Math.round(x+(b.offsetX||0)*scale),dy=Math.round(y+(b.offsetY||0)*scale);
  ctx.save();
  try{
   ctx.imageSmoothingEnabled=false;
   ctx.drawImage(this.image,b.x,b.y,b.width,b.height,dx,dy,Math.max(1,Math.round(b.width*scale)),Math.max(1,Math.round(b.height*scale)));
   return true;
  }catch{return false}finally{ctx.restore()}
 }
}
