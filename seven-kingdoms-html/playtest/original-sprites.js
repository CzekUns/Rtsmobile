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
// The source images are scheme 1 (red). Scheme 2's exact original 7KAA colour
// indices are A4-A7 and C4-C7, corresponding to OGAME.cpp::init_remap_table.
// Only these eight *unique* RGB triples are replaced, never a blanket hue shift.
export const NATION_1_TO_2=Object.freeze([
 [235,2,2,113,113,241], [169,1,1,80,91,213],
 [124,1,1,30,58,172], [80,0,0,14,47,158],
 [164,0,0,12,72,204], [124,0,0,4,40,160],
 [92,4,0,0,20,116], [68,4,0,0,4,76]
]);
export function remapNormanNationPixels(rgba){
 let changed=0;
 for(let i=0;i<rgba.length;i+=4){
  if(rgba[i+3]===0)continue;
  for(const [r,g,b,R,G,B] of NATION_1_TO_2){
   if(rgba[i]===r&&rgba[i+1]===g&&rgba[i+2]===b){
    rgba[i]=R;rgba[i+1]=G;rgba[i+2]=B;changed++;break;
   }
  }
 }
 return changed;
}
// Owner 2 is the demo Norman kingdom. Explicitly recruited red Normans keep
// the original scheme 1; Greek soldiers must use fallback art.
export function isUnitPreviewProxy(unit){
 return unit?.kind==='soldier'&&
  (unit?.raceId==='norman'||unit?.culture==='Normanni'||(unit?.owner===2&&!unit?.raceId));
}
export function isFirmPreviewProxy(firm){return firm?.owner===2&&firm.kind==='fort'}
function ready(image,config){
 return (image?.complete===true&&image.naturalWidth===config.width&&image.naturalHeight===config.height)||
  (image?.width===config.width&&image?.height===config.height);
}
export function blueVariantFromImage(img,makeCanvas){
 if(!img?.naturalWidth||!img?.naturalHeight)return null;
 try{
  const canvas=makeCanvas();canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return null;
  ctx.drawImage(img,0,0);
  const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
  remapNormanNationPixels(frame.data);ctx.putImageData(frame,0,0);
  return canvas;
 }catch(_){return null}
}
export class OriginalSpritePreview{
 constructor({imageFactory,canvasFactory}={}){
  const make=imageFactory||(()=>new Image());
  const canvas=canvasFactory||(()=>document.createElement('canvas'));
  this.unit=make();this.firm=make();
  this.unitBlue=null;this.firmBlue=null;
  this.unit.addEventListener?.('load',()=>{
   this.unitBlue=blueVariantFromImage(this.unit,canvas);
  });
  this.firm.addEventListener?.('load',()=>{
   this.firmBlue=blueVariantFromImage(this.firm,canvas);
  });
  this.unit.src=new URL(ORIGINAL_SHEETS.unit.path,import.meta.url).href;
  this.firm.src=new URL(ORIGINAL_SHEETS.firm.path,import.meta.url).href;
 }
 drawUnit(ctx,unit,x,y,t,direction,frame){
  const sheet=ORIGINAL_SHEETS.unit;
  const image=unit?.owner===2?this.unitBlue:this.unit;
  if(!isUnitPreviewProxy(unit)||!ready(image,sheet))return false;
  if(!Number.isInteger(direction)||direction<0||direction>=sheet.columns)return false;
  if(!Number.isInteger(frame)||frame<0||frame>=sheet.rows)return false;
  const scale=t/24;
  ctx.save();ctx.imageSmoothingEnabled=false;
  // Source-frame offsets have been baked into each transparent 96x112 cell.
  ctx.drawImage(image,direction*sheet.cellWidth,frame*sheet.cellHeight,
   sheet.cellWidth,sheet.cellHeight,x-52*scale,y-82*scale,
   sheet.cellWidth*scale,sheet.cellHeight*scale);
  ctx.restore();return true;
 }
 drawFirm(ctx,firm,x,y,t){
  const sheet=ORIGINAL_SHEETS.firm;
  const image=this.firmBlue;
  if(!isFirmPreviewProxy(firm)||!ready(image,sheet))return false;
  const phase=originalFirmPhase(firm);
  // BASE:NORMAN is 4x4 original, but the temporary demo fort has 3x3
  // collision: scale visual only, never change the simulation footprint.
  const s=firm.size*t,scale=s/(4*24);
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,phase*sheet.cellWidth,0,
   sheet.cellWidth,sheet.cellHeight,x+s/2-sheet.cellWidth*scale/2,
   y+s-sheet.cellHeight*scale,sheet.cellWidth*scale,sheet.cellHeight*scale);
  ctx.restore();return true;
 }
}
