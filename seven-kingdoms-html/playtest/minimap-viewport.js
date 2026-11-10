// Pure viewport geometry for the HTML minimap. Coordinates are world tiles.
// Clips the visible camera rectangle to the world; no original bitmap data.
export function clipMinimapViewport(cx,cy,viewWidth,viewHeight,mapWidth,mapHeight){
  const left=Math.max(0,cx-viewWidth/2),top=Math.max(0,cy-viewHeight/2);
  const right=Math.min(mapWidth,cx+viewWidth/2),bottom=Math.min(mapHeight,cy+viewHeight/2);
  return {x:Math.min(left,mapWidth),y:Math.min(top,mapHeight),width:Math.max(0,right-Math.min(left,mapWidth)),height:Math.max(0,bottom-Math.min(top,mapHeight))};
}
