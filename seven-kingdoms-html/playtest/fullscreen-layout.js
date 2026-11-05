/* Native fullscreen RTS canvas metrics. This module is DOM-free and
 * prevents a stretched/blurred map when the responsive HUD moves above it.
 * All WorldView coordinates are in backing-canvas pixels, so tileSize and
 * pointer conversion must use the same effective device pixel ratio.
 * GPL-2.0-only.
 */
export function canvasMetrics(cssWidth,cssHeight,devicePixelRatio=1){
 const width=Number.isFinite(cssWidth)?Math.max(1,cssWidth):1;
 const height=Number.isFinite(cssHeight)?Math.max(1,cssHeight):1;
 const ratio=Number.isFinite(devicePixelRatio)?
  Math.max(1,Math.min(2,devicePixelRatio)):1;
 return {
  width:Math.max(1,Math.round(width*ratio)),
  height:Math.max(1,Math.round(height*ratio)),
  ratio,
  tileSize:24*ratio
 };
}
export function syncFullscreenCanvas(view,cssWidth,cssHeight,devicePixelRatio=1){
 if(!view?.canvas)return null;
 const metrics=canvasMetrics(cssWidth,cssHeight,devicePixelRatio);
 if(view.canvas.width!==metrics.width)view.canvas.width=metrics.width;
 if(view.canvas.height!==metrics.height)view.canvas.height=metrics.height;
 view.tileSize=metrics.tileSize;
 view.pixelRatio=metrics.ratio;
 return metrics;
}
