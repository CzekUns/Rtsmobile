// Pure viewport geometry for the HTML minimap. Coordinates are world tiles.
// Clips the visible camera rectangle to the world; no original bitmap data.
export function clipMinimapViewport(cx,cy,viewWidth,viewHeight,mapWidth,mapHeight){
  const left=Math.max(0,cx-viewWidth/2),top=Math.max(0,cy-viewHeight/2);
  const right=Math.min(mapWidth,cx+viewWidth/2),bottom=Math.min(mapHeight,cy+viewHeight/2);
  return {x:Math.min(left,mapWidth),y:Math.min(top,mapHeight),width:Math.max(0,right-Math.min(left,mapWidth)),height:Math.max(0,bottom-Math.min(top,mapHeight))};
}

// Keep the entire stroke inside the minimap bitmap at world boundaries.
// Canvas strokeRect centers the stroke on its path, so x=0 clips half its width.
export function insetMinimapStroke(rect,canvasWidth,canvasHeight,lineWidth){
  const half=Math.max(0,lineWidth/2);
  const x1=Math.min(canvasWidth-half,Math.max(half,rect.x));
  const y1=Math.min(canvasHeight-half,Math.max(half,rect.y));
  const x2=Math.min(canvasWidth-half,Math.max(x1,rect.x+rect.width));
  const y2=Math.min(canvasHeight-half,Math.max(y1,rect.y+rect.height));
  return {x:x1,y:y1,width:Math.max(0,x2-x1),height:Math.max(0,y2-y1)};
}
