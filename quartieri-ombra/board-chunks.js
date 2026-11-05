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
  ctx.drawImage(image,f.left-pad,f.top-pad,f.width+pad*2,f.height+pad*2);
  return true;
 }
 function manifest(){return [...registered].map(([id,e])=>({
  id,files:e.source,loaded:Object.keys(e.images).filter(k=>e.images[k].ready)
 }))}
 return{register,ready,draw,manifest};
})();
if(typeof window!=="undefined")window.QOChunkArt=QOChunkArt;
if(typeof module!=="undefined"&&module.exports)module.exports=QOChunkArt;
