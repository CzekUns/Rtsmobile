/* Seven Kingdoms HTML Edition — original 7KAA terrain tiles (preview).
 * These are authentic pure 32x32 ground tiles from I_TERN1.RES.
 * The procedural terrain map, shore transitions, plants, obstacles and
 * collision are still demo logic; never claim native 7KAA terrain parity.
 */
export const ORIGINAL_TERRAIN=Object.freeze({file:'../assets/previews/TERRAIN1-pure-8x4.png',
 width:256,height:128,tileSize:32,columns:8,rows:4});
export function terrainAtlasRow(type){
 return ({grass:0,forest:1,hill:2,dry:2,water:3})[type]??-1;
}
export function terrainAtlasColumn(variant){
 const n=Number(variant);
 return Number.isFinite(n)?Math.min(7,Math.max(0,Math.floor(n*8))):0;
}
export class OriginalTerrainPreview{
 constructor({imageFactory}={}){
  this.image=(imageFactory||(()=>new Image()))();
  this.image.src=new URL(ORIGINAL_TERRAIN.file,import.meta.url).href;
 }
 drawTile(ctx,x,y,t,type,variant){
  const info=ORIGINAL_TERRAIN,row=terrainAtlasRow(type);
  if(row<0||!this.image?.complete||this.image.naturalWidth!==info.width||
     this.image.naturalHeight!==info.height||!Number.isFinite(t)||t<=0)return false;
  const col=terrainAtlasColumn(variant),dx=Math.floor(x),dy=Math.floor(y);
  const dw=Math.max(1,Math.ceil(x+t)-dx),dh=Math.max(1,Math.ceil(y+t)-dy);
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(this.image,col*info.tileSize,row*info.tileSize,
   info.tileSize,info.tileSize,dx,dy,dw,dh);
  ctx.restore();return true;
 }
}
