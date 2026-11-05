/* Chunk artwork LODs: one large transparent image per *group* of buildings.
 * The image is a projection-locked visual surface. Hitboxes are not images. */
const QOChunkArt=(function(){
 "use strict";
 const registered=new Map(),tiers=[["base","src"],["detail","detail"],["ultra","ultra"]];
 function register(chunkId,source,onChange){
  if(!chunkId||!source||!(source.src||source.detail||source.ultra))
   throw new Error("An existing chunk id and at least one real image source are required");
  const entry={id:chunkId,source,images:{},ready:false};
  registered.set(chunkId,entry);
  for(const [tier,field] of tiers){
   const url=source[field];if(!url)continue;
   const img=new Image();
   entry.images[tier]={img,ready:false,url};
   img.onload=()=>{
    entry.images[tier].ready=!!img.naturalWidth;
    entry.ready=Object.values(entry.images).some(e=>e.ready);
    if(onChange)onChange();
   };
   img.onerror=()=>{
    entry.images[tier].ready=false;
    entry.ready=Object.values(entry.images).some(e=>e.ready);
    if(onChange)onChange();
   };
   img.src=url;
  }
  return entry;
 }
 function ready(chunkId){return !!registered.get(chunkId)?.ready}
 function choose(entry,zoom){
  const order=zoom>4.4?["ultra","detail","base"]:zoom>1.9?["detail","ultra","base"]:["base","detail","ultra"];
  for(const tier of order)if(entry.images[tier]?.ready)return entry.images[tier].img;
  return null;
 }
 function draw(ctx,chunk,zoom=1){
  const entry=registered.get(chunk.id);if(!entry||!entry.ready)return false;
  const image=choose(entry,zoom);if(!image)return false;
  // Pixel placement equals the SVG blueprint's padded viewport exactly.
  // The image itself must have a transparent exterior and use that same viewBox.
  const f=chunk.frame,pad=24;
  // Candidate-only explicit image->chunk mapping. Its source crop was measured
  // from ImageGen alpha; the target is measured from the authoritative SVG.
  // This makes visual mismatch testable WITHOUT modifying a single hitbox.
  // Production chunks keep their existing viewBox contract.
  const src=entry.source.sourceRect,dst=entry.source.targetRect;
  if(Array.isArray(src)&&src.length===4&&Array.isArray(dst)&&dst.length===4){
   const [sx,sy,sw,sh]=src,[dx,dy,dw,dh]=dst;
   if(![...src,...dst].every(Number.isFinite)||sw<=0||sh<=0||dw<=0||dh<=0)return false;
   let ox=f.left+dx,oy=f.top+dy,ow=dw,oh=dh;
   if(entry.source.mappingMode==="contain"){
    const ratio=Math.min(dw/sw,dh/sh);
    ow=sw*ratio;oh=sh*ratio;
    ox+=(dw-ow)/2;oy+=(dh-oh)/2;
   }
   if(entry.source.mappingMode==="shear"){
    // DIAGNOSTIC ONLY: progressive camera-space correction grounded in the
    // observed drift of the generated rooftops. The engine/lot geometry never
    // moves. At the far right the image is unchanged; toward the first
    // (upper-left) building the artwork moves progressively upward.
    const amount=entry.source.shear;
    if(!Number.isFinite(amount)||amount<0||amount>.25)return false;
    ctx.save();
    ctx.transform(1,amount,0,1,0,-amount*(f.left+dx+dw));
    ctx.drawImage(image,sx,sy,sw,sh,ox,oy,ow,oh);
    ctx.restore();
   }else{
    ctx.drawImage(image,sx,sy,sw,sh,ox,oy,ow,oh);
   }
   return true;
  }
  if(entry.source.src?.endsWith("cross-street-block-2-geometry-locked-art-study.svg")){
   // The study SVG uses the *unpadded* 333×290 authoritative chunk viewBox.
   // Applying the raster draft padding would visibly misregister every roof.
   ctx.drawImage(image,f.left,f.top,f.width,f.height);
  }else ctx.drawImage(image,f.left-pad,f.top-pad,f.width+pad*2,f.height+pad*2);
  return true;
 }
 function manifest(){return [...registered].map(([id,e])=>({
  id,files:e.source,loaded:Object.keys(e.images).filter(k=>e.images[k].ready)
 }))}
 return{register,ready,draw,manifest};
})();
if(typeof window!=="undefined")window.QOChunkArt=QOChunkArt;
if(typeof module!=="undefined"&&module.exports)module.exports=QOChunkArt;
