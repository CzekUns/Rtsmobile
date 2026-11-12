/* Seven Kingdoms AA classic HUD adapter. GPL-2.0-only.
 * Deterministic 800x600 Canvas overlay; pure drawing except per-instance canvas input.
 * Original resource bitmaps are NOT embedded. */
export const CLASSIC_SIZE=Object.freeze({width:800,height:600});
export const CLASSIC_RECTS=Object.freeze({
  reports:{x:0,y:0,w:218,h:44}, treasury:{x:218,y:0,w:150,h:44},
  calendar:{x:368,y:0,w:250,h:44}, tools:{x:618,y:0,w:182,h:44},
  world:{x:0,y:44,w:610,h:556}, minimap:{x:614,y:44,w:186,h:176},
  selection:{x:614,y:224,w:186,h:376}
});
export const REPORTS=Object.freeze([
  ['kingdoms','Kingdoms'],['villages','Villages'],['economy','Economy'],['trade','Trade'],
  ['military','Military'],['technology','Technology'],['espionage','Espionage'],['ranking','Ranking']
]);
const rect=(x,y,w,h)=>({x,y,w,h});
const within=(p,r)=>p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h;
const n=v=>Number.isFinite(Number(v))?Math.floor(Number(v)).toLocaleString('en-US'):'0';
const val=(v,f='')=>v===undefined||v===null?f:String(v);
function surface(ctx,x,y,w,h,light='#c8c6b7',dark='#67695c'){
  ctx.fillStyle='#b1b2a4';ctx.fillRect(x,y,w,h);
  ctx.fillStyle=light;ctx.fillRect(x,y,w,2);ctx.fillRect(x,y,2,h);
  ctx.fillStyle=dark;ctx.fillRect(x,y+h-2,w,2);ctx.fillRect(x+w-2,y,2,h);
}
function inscription(ctx,text,x,y,max=150,color='#181713',size=12){
  ctx.font='bold '+size+'px Georgia, serif';ctx.fillStyle=color;
  ctx.fillText(val(text),x,y,max);
}
function key(ctx,text,r,active=false){
  surface(ctx,r.x,r.y,r.w,r.h,active?'#807b61':'#e8e5d5',active?'#e7e3cf':'#5d5b50');
  ctx.fillStyle=active?'#bb9e61':'#d7d4c5';ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4);
  inscription(ctx,text,r.x+5,r.y+r.h/2+4,r.w-9,'#252116',11);
}
function title(ctx,txt,y){
  surface(ctx,614,y,186,22);inscription(ctx,txt,637,y+15,159,'#272013',12);
}
function stripe(ctx,label,value,y){
  inscription(ctx,label,620,y,92,'#24211c',11);
  inscription(ctx,val(value),710,y,85,'#24211c',11);
  ctx.fillStyle='#8a8b7d';ctx.fillRect(619,y+3,174,1);
}
export function normalizeClassicViewModel(model={}){
  const resources=model.resources||{},selection=model.selection||{};
  return {
    resources:{cash:Number(resources.cash)||0,food:Number(resources.food)||0,cashRate:resources.cashRate,foodRate:resources.foodRate},
    date:val(model.date,'Jan 1, 1000'),day:Number(model.day)||1,
    report:val(model.report,'villages'),paused:!!model.paused,speed:Number(model.speed)||1,
    minimap:model.minimap||null,selection:{
      type:val(selection.type,'none'),name:val(selection.name,''),
      nationColor:val(selection.nationColor,'#834e68'),
      health:selection.health,healthMax:selection.healthMax,
      portrait:selection.portrait||null,stats:Array.isArray(selection.stats)?selection.stats.slice(0,9):[],
      actions:Array.isArray(selection.actions)?selection.actions.slice(0,12):[]
    },messages:Array.isArray(model.messages)?model.messages.slice(0,2):[],
    actions:Array.isArray(model.actions)?model.actions:[]
  };
}
export function createClassicHud(canvas,{onCommand=()=>{},listenPointer=false}={}){
  if(!canvas||typeof canvas.getContext!=='function')throw new TypeError('A canvas is required');
  const ctx=canvas.getContext('2d');if(!ctx)throw new TypeError('2d context required');
  canvas.width=800;canvas.height=600;
  let model=normalizeClassicViewModel(),targets=[];
  const hit=(id,r,extra={})=>targets.push({id,rect:r,...extra});
  function render(next=model){
    model=normalizeClassicViewModel(next);targets=[];
    ctx.clearRect(0,0,800,600);
    // Transparent over the world. This module must not draw the world itself.
    surface(ctx,0,0,800,44);surface(ctx,610,44,190,556);
    REPORTS.forEach(([id,label],i)=>{
      const r=rect(2+(i%4)*54,2+Math.floor(i/4)*20,53,19);
      key(ctx,label,r,id===model.report);hit('report',r,{report:id});
    });
    surface(ctx,218,0,150,44);
    inscription(ctx,'🟤 '+n(model.resources.food)+' ['+val(model.resources.foodRate,'0')+']',225,17,142);
    inscription(ctx,'◉ '+n(model.resources.cash)+' ['+val(model.resources.cashRate,'0')+']',225,35,142);
    inscription(ctx,model.date,396,18,176,'#181715',15);
    inscription(ctx,'♜ '+n(model.day),434,36,100,'#29261f',12);
    const top=[['terrain','Terrain'],['borders','Borders'],['villages-map','Village'],['menu','MENU']];
    top.forEach(([id,label],i)=>{const r=rect(620+i*44,4,42,36);key(ctx,label,r);if(id==='menu')hit('menu',r);else hit('map-mode',r,{mode:id})});
    const minimap=CLASSIC_RECTS.minimap;
    ctx.fillStyle='#273b30';ctx.fillRect(617,47,180,170);
    if(model.minimap?.image){ctx.drawImage(model.minimap.image,618,48,178,168);}
    else {ctx.fillStyle='#526b4a';ctx.fillRect(618,48,178,168);}
    surface(ctx,614,220,186,5);
    hit('minimap',rect(618,48,178,168));
    const s=model.selection;
    ctx.fillStyle=s.nationColor;ctx.fillRect(620,232,16,14);
    title(ctx,s.name||'No selection',229);
    if(s.healthMax!=null&&Number(s.healthMax)>0){
      const ratio=Math.max(0,Math.min(1,Number(s.health)/Number(s.healthMax)));
      surface(ctx,651,254,143,18);ctx.fillStyle='#253278';ctx.fillRect(654,257,137*ratio,12);
      inscription(ctx,n(s.health)+'/'+n(s.healthMax),682,267,104,'#fff',11);
    }
    if(s.portrait&&typeof s.portrait==='object'&&s.portrait.width){
      ctx.drawImage(s.portrait,620,279,42,40);
    }
    let y= s.healthMax==null?264:304;
    s.stats.forEach(entry=>{stripe(ctx,val(entry.label),val(entry.value),y);y+=18});
    y=Math.max(y+8,411);
    let actionY=y,actionX=620;
    s.actions.forEach((a,i)=>{
      const r=rect(actionX,actionY,54,37);
      key(ctx,val(a.label,a.id||'?').slice(0,10),r,!!a.active);
      if(a.disabled){ctx.fillStyle='#77777777';ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4)}
      else hit('action',r,{action:a.id});
      actionX+=58;if((i+1)%3===0){actionX=620;actionY+=40}
    });
    if(model.messages.length){
      surface(ctx,4,567,604,31,'#e4e2d3','#68695e');
      inscription(ctx,model.messages[0],10,582,586,'#26241c',11);
      if(model.messages[1])inscription(ctx,model.messages[1],10,595,586,'#26241c',10);
    }
    return targets.map(x=>({...x,rect:{...x.rect}}));
  }
  function dispatchPoint(x,y){
    const p={x,y};
    const t=[...targets].reverse().find(t=>within(p,t.rect));
    if(!t)return null;
    const command={type:t.id,...(t.report?{report:t.report}:{}),...(t.action?{action:t.action}:{}),...(t.mode?{mode:t.mode}:{})};
    if(t.id==='minimap'){
      command.x=Math.max(0,Math.min(1,(x-t.rect.x)/t.rect.w));
      command.y=Math.max(0,Math.min(1,(y-t.rect.y)/t.rect.h));
    }
    onCommand(command);return command;
  }
  function onPointer(e){
    const r=canvas.getBoundingClientRect();
    if(!r.width||!r.height)return;
    const x=(e.clientX-r.left)*800/r.width,y=(e.clientY-r.top)*600/r.height;
    dispatchPoint(x,y);
  }
  if(listenPointer)canvas.addEventListener('pointerup',onPointer);
  render();
  return {render,dispatchPoint,getModel:()=>model,getTargets:()=>targets.map(t=>({...t,rect:{...t.rect}})),
    dispose:()=>{if(listenPointer)canvas.removeEventListener('pointerup',onPointer)}};
}
export function landscapeFit(width,height){
  const w=Number(width)||0,h=Number(height)||0;
  const scale=w>0&&h>0?Math.min(w/800,h/600):0;
  return {scale,offsetX:(w-800*scale)/2,offsetY:(h-600*scale)/2,portrait:h>w};
}
export function requestClassicFullscreen(element,screenObject=globalThis.screen){
  if(!element?.requestFullscreen)return Promise.resolve(false);
  return Promise.resolve(element.requestFullscreen()).then(async()=>{
    try{await screenObject?.orientation?.lock?.('landscape')}catch{}
    return true;
  }).catch(()=>false);
}


/** Convert a point from a uniformly-scaled 800x600 stage into native coordinates.
 * The caller must supply the *stage element* bounding rect (not the full viewport).
 */
export function toClassicPoint(clientX,clientY,bounds){
  if(!bounds||!(bounds.width>0)||!(bounds.height>0))return null;
  return {x:(clientX-bounds.left)*800/bounds.width,y:(clientY-bounds.top)*600/bounds.height};
}
/** Minimum device-pixel targets: return explicit DOM button dimensions.
 * Keep classic art untouched and provide mobile controls outside the canvas. */
export function mobileTouchSpec(viewWidth,viewHeight){
  const fit=landscapeFit(viewWidth,viewHeight);
  return {orientationRequired:fit.portrait,scale:fit.scale,
    minTargetCssPx:44,needsAlternateControls:fit.scale<1,
    mode:'overlay-menu',controlCount:REPORTS.length};
}
