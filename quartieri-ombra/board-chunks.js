/* Chunk artwork layer. One seamless illustration can serve many logical
 * building hitboxes. Only REGISTER an actual uploaded image asset.
 * Unknown/unavailable art has no effect on scene or hit regions. */
const QOChunkArt=(function(){
 "use strict";
 const registered=new Map();
 function register(chunkId,source,onChange){
  if(!chunkId||!source||!source.src)throw new Error("A real chunk id and image source are required");
  const image=new Image(),entry={id:chunkId,source:source.src,image,ready:false};
  registered.set(chunkId,entry);
  image.onload=()=>{entry.ready=!!image.naturalWidth;if(onChange)onChange()};
  image.onerror=()=>{entry.ready=false;if(onChange)onChange()};
  image.src=source.src;
  return entry;
 }
 function ready(chunkId){return !!registered.get(chunkId)?.ready}
 function draw(ctx,chunk){
  const entry=registered.get(chunk.id);if(!entry||!entry.ready)return false;
  // The final group image will be generated against the matching guide frame:
  // registration does not change world-space geometry or collision.
  const f=chunk.frame,pad=24;
  ctx.drawImage(entry.image,f.left-pad,f.top-pad,f.width+pad*2,f.height+pad*2);
  return true;
 }
 function manifest(){return [...registered].map(([id,e])=>({id,source:e.source.src,ready:e.ready}))}
 return{register,ready,draw,manifest};
})();
if(typeof window!=="undefined")window.QOChunkArt=QOChunkArt;
if(typeof module!=="undefined"&&module.exports)module.exports=QOChunkArt;
