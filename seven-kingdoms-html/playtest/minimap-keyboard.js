// Keyboard navigation for the HTML minimap. Modern accessibility extension;
// no claim that these bindings existed in the original 7KAA interface.
export function minimapKeyTarget(key, camera, width, height, step=10) {
  if (![width,height,step].every(n=>Number.isFinite(n)&&n>0)) return null;
  if (!camera || !Number.isFinite(camera.x) || !Number.isFinite(camera.y)) return null;
  const keys={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};
  if (key==='Home') return {x:width/2,y:height/2};
  const delta=keys[key];
  if (!delta) return null;
  return {x:Math.max(0,Math.min(width,camera.x+delta[0])),
          y:Math.max(0,Math.min(height,camera.y+delta[1]))};
}

// Do not steal browser/assistive-technology shortcuts such as Alt+Arrow,
// Ctrl+Home or Meta+Arrow. The minimap handles only plain navigation keys.
export function minimapKeyboardTarget(event, camera, width, height, step=10) {
  if (!event || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return null;
  return minimapKeyTarget(event.key,camera,width,height,step);
}
