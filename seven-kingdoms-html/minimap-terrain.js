/* Cached terrain layer for the HTML minimap. The raster uses exactly the
 * same tile/palette sampling as WorldView.tileDraw; no original art is claimed.
 * GPL-2.0-only.
 */
export function createMinimapTerrainLayer({worldW,worldH,terrain,colors,hash,createCanvas}){
 if(!(worldW>0&&worldH>0))throw new RangeError('Invalid world dimensions');
 let cached=null;
 function raster(ctx,seed,width,height){
  const dx=width/worldW,dy=height/worldH;
  for(let y=0;y<worldH;y++)for(let x=0;x<worldW;x++){
   const type=terrain(seed,x,y),shades=colors[type];
   const n=hash(x,y,seed);
   ctx.fillStyle=shades[Math.min(shades.length-1,Math.floor(n*shades.length))];
   const left=Math.floor(x*dx),top=Math.floor(y*dy);
   ctx.fillRect(left,top,Math.floor((x+1)*dx)-left,Math.floor((y+1)*dy)-top);
  }
 }
 return {
  draw(ctx,seed,width,height){
   if(!(width>0&&height>0))return;
   if(cached&&cached.seed===seed&&cached.width===width&&cached.height===height){
    ctx.drawImage(cached.canvas,0,0);return;
   }
   // Offscreen canvas is an optimization only; keep the exact raster fallback.
   const canvas=createCanvas?.(width,height);
   const layerCtx=canvas?.getContext?.('2d');
   if(!layerCtx||typeof ctx.drawImage!=='function'){
    raster(ctx,seed,width,height);cached=null;return;
   }
   canvas.width=width;canvas.height=height;
   // Resizing resets the context; obtain it again after setting dimensions.
   const fresh=canvas.getContext('2d');
   if(!fresh){raster(ctx,seed,width,height);cached=null;return;}
   raster(fresh,seed,width,height);
   cached={seed,width,height,canvas};
   ctx.drawImage(canvas,0,0);
  },
  invalidate(){cached=null;}
 };
}
