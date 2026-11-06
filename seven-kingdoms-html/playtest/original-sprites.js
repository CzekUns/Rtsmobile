/* Seven Kingdoms HTML Edition — original 7KAA pixel-art preview adapter.
 * Upstream GPL graphics; no WASM and no runtime archive decoder.
 * Source contact sheets from SKH-101. This is an opt-in preview, not original
 * nation/firm gameplay parity.
 */
export const ORIGINAL_SHEETS=Object.freeze({
 unit:Object.freeze({path:'../assets/previews/NORMAN-M-1x.png',width:768,height:672,cellWidth:96,cellHeight:112,columns:8,rows:6}),
 firm:Object.freeze({path:'../assets/previews/BASE-NORMAN-phases-1x.png',width:720,height:160,cellWidth:180,cellHeight:160,columns:4,rows:1})
});

// STD.SET N, NE, E, SE, S, SW, W, NW, with map y increasing south.
export function compassDirection(dx,dy,fallback=4){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)+Math.abs(dy)<.0001)return fallback;
 return (Math.round(Math.atan2(dx,-dy)*4/Math.PI)+8)%8;
}
export function walkingFrame(now,moving){
 if(!moving||!Number.isFinite(now))return 0;
 return Math.floor(Math.max(0,now)/145)%6;
}
export function originalFirmPhase(firm){
 if(!firm?.underConstruction)return 3;
 const progress=Math.max(0,Math.min(1,Number(firm.buildProgress)||0));
 return Math.min(2,Math.floor(progress*3));
}
// Original PNGs were converted with source nation scheme 1 (red). Only draw
// them as explicit red-side demo proxies; retain all other fallback art.
export function isUnitPreviewProxy(unit){return unit?.owner===1&&unit.kind==='soldier'}
export function isFirmPreviewProxy(firm){return firm?.owner===1&&firm.kind==='fort'}
function ready(image,config){
 return image?.complete===true&&image.naturalWidth===config.width&&image.naturalHeight===config.height;
}
export class OriginalSpritePreview{
 constructor({imageFactory}={}){
  const make=imageFactory||(()=>new Image());
  this.unit=make();this.firm=make();
  this.unit.src=new URL(ORIGINAL_SHEETS.unit.path,import.meta.url).href;
  this.firm.src=new URL(ORIGINAL_SHEETS.firm.path,import.meta.url).href;
 }
 drawUnit(ctx,unit,x,y,t,direction,frame){
  const sheet=ORIGINAL_SHEETS.unit;
  if(!isUnitPreviewProxy(unit)||!ready(this.unit,sheet))return false;
  if(!Number.isInteger(direction)||direction<0||direction>=sheet.columns)return false;
  if(!Number.isInteger(frame)||frame<0||frame>=sheet.rows)return false;
  const scale=t/24;
  ctx.save();ctx.imageSmoothingEnabled=false;
  // Source-frame offsets have been baked into each transparent 96x112 cell.
  ctx.drawImage(this.unit,direction*sheet.cellWidth,frame*sheet.cellHeight,
   sheet.cellWidth,sheet.cellHeight,x-52*scale,y-82*scale,
   sheet.cellWidth*scale,sheet.cellHeight*scale);
  ctx.restore();return true;
 }
 drawFirm(ctx,firm,x,y,t){
  const sheet=ORIGINAL_SHEETS.firm;
  if(!isFirmPreviewProxy(firm)||!ready(this.firm,sheet))return false;
  const phase=originalFirmPhase(firm);
  // BASE:NORMAN is 4x4 original, but the temporary demo fort has 3x3
  // collision: scale visual only, never change the simulation footprint.
  const s=firm.size*t,scale=s/(4*24);
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(this.firm,phase*sheet.cellWidth,0,
   sheet.cellWidth,sheet.cellHeight,x+s/2-sheet.cellWidth*scale/2,
   y+s-sheet.cellHeight*scale,sheet.cellWidth*scale,sheet.cellHeight*scale);
  ctx.restore();return true;
 }
}
