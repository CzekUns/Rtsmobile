/* Seven Kingdoms HTML Edition - minimap consolidation, SKH-106.
 * Pure geometry and cached rendering over the EXISTING JS demo terrain.
 * Does not imply source bitmap, coast generation or palette parity with 7KAA.
 */

export function minimapFootprint(x,y,width,height,worldW,worldH,pixelW,pixelH){
 const vals=[x,y,width,height,worldW,worldH,pixelW,pixelH];
 if(!vals.every(Number.isFinite)||width<=0||height<=0||worldW<=0||worldH<=0||pixelW<=0||pixelH<=0)return null;
 const l=Math.max(0,Math.min(worldW,x)),t=Math.max(0,Math.min(worldH,y));
 const r=Math.max(0,Math.min(worldW,x+width)),b=Math.max(0,Math.min(worldH,y+height));
 if(r<=l||b<=t)return null;
 const x1=Math.max(0,Math.floor(l*pixelW/worldW)),y1=Math.max(0,Math.floor(t*pixelH/worldH));
 const x2=Math.min(pixelW,Math.ceil(r*pixelW/worldW)),y2=Math.min(pixelH,Math.ceil(b*pixelH/worldH));
 return {x:x1,y:y1,width:x2-x1,height:y2-y1};
}
export function minimapViewport(cx,cy,wide,high,worldW,worldH,pixelW,pixelH,lineWidth=1){
 const vals=[cx,cy,wide,high,worldW,worldH,pixelW,pixelH,lineWidth];
 if(!vals.every(Number.isFinite)||wide<=0||high<=0||worldW<=0||worldH<=0||pixelW<=0||pixelH<=0||lineWidth<0)return null;
 const l=Math.max(0,(cx-wide/2)*pixelW/worldW),t=Math.max(0,(cy-high/2)*pixelH/worldH);
 const r=Math.min(pixelW,(cx+wide/2)*pixelW/worldW),b=Math.min(pixelH,(cy+high/2)*pixelH/worldH);
 const half=lineWidth/2,x=Math.max(half,l),y=Math.max(half,t);
 const right=Math.min(pixelW-half,r),bottom=Math.min(pixelH-half,b);
 return right>x&&bottom>y?{x,y,width:right-x,height:bottom-y}:null;
}

export function createMinimapTerrainLayer({worldW,worldH,terrain,colorFor,createCanvas}){
 if(!Number.isInteger(worldW)||!Number.isInteger(worldH)||worldW<=0||worldH<=0)throw RangeError('Invalid world dimensions');
 if(typeof terrain!=='function'||typeof colorFor!=='function')throw TypeError('Missing terrain or colour function');
 let cached=null;
 const raster=(ctx,seed,width,height)=>{
  for(let y=0;y<worldH;y++)for(let x=0;x<worldW;x++){
   const left=Math.floor(x*width/worldW),top=Math.floor(y*height/worldH);
   const right=Math.floor((x+1)*width/worldW),bottom=Math.floor((y+1)*height/worldH);
   ctx.fillStyle=colorFor(terrain(seed,x,y));
   if(right>left&&bottom>top)ctx.fillRect(left,top,right-left,bottom-top);
  }
 };
 return {
  draw(ctx,seed,width,height){
   if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0)return false;
   if(cached&&cached.seed===seed&&cached.width===width&&cached.height===height){
    try{ctx.drawImage(cached.canvas,0,0);return true}catch(_){cached=null;}
   }
   let canvas=null,off=null;
   try{
    canvas=createCanvas?.(width,height)||null;
    if(canvas){canvas.width=width;canvas.height=height;off=canvas.getContext('2d');}
   }catch(_){canvas=null;off=null;}
   if(canvas&&off&&typeof ctx.drawImage==='function'){
    try{
     raster(off,seed,width,height);
     ctx.drawImage(canvas,0,0);
     cached={seed,width,height,canvas};return true;
    }catch(_){cached=null;}
   }
   // Some browsers (or Node tests) have no canvas factory / drawImage.
   raster(ctx,seed,width,height);return false;
  },
  invalidate(){cached=null;}
 };
}

export function minimapKeyboardTarget(event,camera,worldW,worldH,step=10){
 if(!event||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.isComposing)return null;
 if(![worldW,worldH,step,camera?.x,camera?.y].every(Number.isFinite)||worldW<=0||worldH<=0||step<=0)return null;
 const moves={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};
 if(event.key==='Home')return {x:worldW/2,y:worldH/2};
 const d=moves[event.key];if(!d)return null;
 return {x:Math.max(0,Math.min(worldW,camera.x+d[0])),y:Math.max(0,Math.min(worldH,camera.y+d[1]))};
}

export function installMinimapNavigation(canvas,view,worldW,worldH){
 if(!canvas?.addEventListener||!view?.center)throw TypeError('Missing navigable minimap or camera');
 let owner=null;
 const point=e=>{
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const x=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
  const y=Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height));
  view.center(x*worldW,y*worldH);
 };
 const down=e=>{
  if(owner!==null||(e.pointerType==='mouse'&&e.button!==0))return;
  owner=e.pointerId;point(e);e.preventDefault?.();
  try{canvas.setPointerCapture?.(owner)}catch(_){}
 };
 const move=e=>{if(e.pointerId===owner){point(e);e.preventDefault?.();}};
 const end=e=>{
  if(e.pointerId!==owner)return;
  if(e.type==='pointerup')point(e);
  try{if(canvas.hasPointerCapture?.(owner))canvas.releasePointerCapture(owner)}catch(_){}
  owner=null;
 };
 const keyboard=e=>{
  const next=minimapKeyboardTarget(e,{x:view.cx,y:view.cy},worldW,worldH);
  if(next){e.preventDefault?.();view.center(next.x,next.y);}
 };
 const handlers={pointerdown:down,pointermove:move,pointerup:end,pointercancel:end,lostpointercapture:end,keydown:keyboard};
 for(const [event,fn] of Object.entries(handlers))canvas.addEventListener(event,fn);
 return ()=>{for(const [event,fn] of Object.entries(handlers))canvas.removeEventListener(event,fn);};
}
