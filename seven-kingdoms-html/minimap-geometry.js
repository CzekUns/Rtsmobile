/* Minimap pixel geometry: world tile bounds -> clipped canvas rectangles.
 * This module only aligns the existing HTML renderer; it does not claim
 * authentic 7KAA iconography or palette. GPL-2.0-only.
 */
export function minimapFootprint(x,y,sizeX,sizeY,worldW,worldH,pixelW,pixelH){
 if(![x,y,sizeX,sizeY,worldW,worldH,pixelW,pixelH].every(Number.isFinite)||
    worldW<=0||worldH<=0||pixelW<=0||pixelH<=0||sizeX<=0||sizeY<=0)return null;
 const x0=Math.max(0,Math.min(worldW,x)),x1=Math.max(0,Math.min(worldW,x+sizeX));
 const y0=Math.max(0,Math.min(worldH,y)),y1=Math.max(0,Math.min(worldH,y+sizeY));
 if(x1<=x0||y1<=y0)return null;
 const left=Math.max(0,Math.floor(x0*pixelW/worldW));
 const top=Math.max(0,Math.floor(y0*pixelH/worldH));
 const right=Math.min(pixelW,Math.ceil(x1*pixelW/worldW));
 const bottom=Math.min(pixelH,Math.ceil(y1*pixelH/worldH));
 return {x:left,y:top,width:right-left,height:bottom-top};
}
export function minimapViewport(cx,cy,tilesWide,tilesHigh,worldW,worldH,pixelW,pixelH,lineWidth=1){
 if(![cx,cy,tilesWide,tilesHigh,worldW,worldH,pixelW,pixelH,lineWidth].every(Number.isFinite)||
   worldW<=0||worldH<=0||pixelW<=0||pixelH<=0||tilesWide<=0||tilesHigh<=0||lineWidth<0)return null;
 const half=lineWidth/2;
 const left=Math.max(0,(cx-tilesWide/2)*pixelW/worldW);
 const top=Math.max(0,(cy-tilesHigh/2)*pixelH/worldH);
 const right=Math.min(pixelW,(cx+tilesWide/2)*pixelW/worldW);
 const bottom=Math.min(pixelH,(cy+tilesHigh/2)*pixelH/worldH);
 if(right<=left||bottom<=top)return null;
 // Canvas strokes are centered on their path. Keep the entire stroke visible
 // even when the camera rectangle touches the minimap's outer border.
 const x=Math.max(half,left),y=Math.max(half,top);
 const r=Math.min(pixelW-half,right),b=Math.min(pixelH-half,bottom);
 if(r<=x||b<=y)return null;
 return {x,y,width:r-x,height:b-y};
}
