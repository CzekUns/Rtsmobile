/* Source-verified 7KAA ROCK atlas. Demo placements are visual-only.
 * GPL-2.0-or-later; source the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc.
 */
export const ORIGINAL_ROCK=Object.freeze({
 image:'../assets/previews/rock-original.png',
 manifest:'../assets/manifests/rock-original.json'
});
export function validateRockManifest(m){
 if(m?.schemaVersion!==1||m.source!=='the3dfxdude/7kaa'||
 m.sourceCommit!=='14e6fdfba9481af4dc3a54722614a608776e20bc'||
 m.license!=='GPL-2.0-or-later'||!Number.isInteger(m.width)||!Number.isInteger(m.height)||
 m.width<1||m.height<1||m.width*m.height>16000000||
 !Array.isArray(m.entries)||m.entries.length===0||!Array.isArray(m.resources)||m.resources.length!==6)return false;
 return m.entries.every(e=>[e.x,e.y,e.width,e.height,e.footprintWidth,e.footprintHeight,e.blockX,e.blockY,e.frame].every(Number.isInteger)&&
 e.x>=0&&e.y>=0&&e.width>0&&e.height>0&&e.x+e.width<=m.width&&e.y+e.height<=m.height&&
 e.footprintWidth>0&&e.footprintHeight>0&&e.blockX>=0&&e.blockY>=0&&
 e.blockX<e.footprintWidth&&e.blockY<e.footprintHeight&&e.frame>0);
}
export function demoRockIndex(seed,x,y,count){
 if(!Number.isInteger(count)||count<1)return -1;
 let n=(Math.imul(x|0,73856093)^Math.imul(y|0,19349663)^Math.imul(seed|0,83492791))>>>0;
 n^=n>>>16;n=Math.imul(n,0x7feb352d)>>>0;n^=n>>>15;
 return (n>>>0)%count;
}
export class OriginalRockPreview{
 constructor({imageFactory=()=>new Image(),fetcher=fetch}={}){
  this.image=imageFactory();this.manifest=null;this.tiles=[];
  this.image.src=new URL(ORIGINAL_ROCK.image,import.meta.url).href;
  this.loading=Promise.resolve().then(()=>fetcher(new URL(ORIGINAL_ROCK.manifest,import.meta.url).href))
   .then(r=>{if(!r.ok)throw Error('rock manifest unavailable');return r.json()})
   .then(m=>{if(!validateRockManifest(m))throw Error('invalid rock manifest');
    this.manifest=m;
    // Use complete single-tile first-frame source records; never split a multi-tile rock.
    this.tiles=m.entries.filter(e=>e.footprintWidth===1&&e.footprintHeight===1&&e.frame===1);
   }).catch(()=>{this.manifest=null;this.tiles=[]});
 }
 isReady(){return !!this.manifest&&this.tiles.length>0&&this.image.complete&&
  this.image.naturalWidth===this.manifest.width&&this.image.naturalHeight===this.manifest.height}
 draw(ctx,x,y,t,seed,tileX,tileY){
  if(!this.isReady()||!Number.isFinite(t)||t<=0)return false;
  const e=this.tiles[demoRockIndex(seed,tileX,tileY,this.tiles.length)];
  if(!e)return false;
  ctx.save();
  try{
   ctx.imageSmoothingEnabled=false;
   ctx.drawImage(this.image,e.x,e.y,e.width,e.height,Math.round(x),Math.round(y),
    Math.max(1,Math.round(e.width*t/32)),Math.max(1,Math.round(e.height*t/32)));
   return true;
  }catch{return false}finally{ctx.restore()}
 }
}
