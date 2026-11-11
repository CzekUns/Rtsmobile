/* Seven Kingdoms HTML Edition — canvas map & minimap.
 * Rendering only; simulation rules are in rules.js. GPL-2.0-only.
 */
import {WORLD_W,WORLD_H,NATIONS,FIRMS,terrain,range} from './rules.js';
import {OriginalSpritePreview,compassDirection,walkingFrame} from './playtest/original-sprites.js';
import {OriginalTerrainPreview} from './playtest/original-terrain.js';
import {minimapFootprint,minimapViewport} from './minimap-geometry.js';
const COLORS={
  grass:['#81996a','#8aa171','#769367'],forest:['#496d46','#567b4b','#3e6645'],
  hill:['#a59d7f','#aaa487','#8e9077'],dry:['#b6a983','#c1ad86','#a89f7f'],
  water:['#587f8b','#578994','#4b7489']
};
const hash=(x,y,s)=>Math.abs(Math.sin(x*13.37+y*42.17+s*.13)*7867.3481)%1;
const lim=(v,a,b)=>Math.max(a,Math.min(b,v));
export class WorldView{
 constructor(world,mini,{previewOriginalSprites=false}={}){
  this.canvas=world;this.ctx=world.getContext('2d');
  this.originalSprites=previewOriginalSprites?new OriginalSpritePreview():null;
  this.originalTerrain=previewOriginalSprites?new OriginalTerrainPreview():null;
  this.spriteMotion=new Map();this.spritePaused=false;
  this.mini=mini;this.mctx=mini.getContext('2d');
  this.cx=27;this.cy=27;this.zoom=1;this.tileSize=24;
 }
 tile(){return this.tileSize*this.zoom}
 screen(wx,wy){return {x:(wx-this.cx)*this.tile()+this.canvas.width/2,y:(wy-this.cy)*this.tile()+this.canvas.height/2}}
 worldAt(sx,sy){return {x:(sx-this.canvas.width/2)/this.tile()+this.cx,y:(sy-this.canvas.height/2)/this.tile()+this.cy}}
 moveCamera(dx,dy){this.cx=lim(this.cx-dx/this.tile(),0,WORLD_W);this.cy=lim(this.cy-dy/this.tile(),0,WORLD_H)}
 center(x,y){this.cx=lim(x,0,WORLD_W);this.cy=lim(y,0,WORLD_H)}
 scale(f){this.zoom=lim(this.zoom*f,.68,2.5)}
 pick(g,x,y){
  for(let i=g.units.length-1;i>=0;i--){
   const u=g.units[i];if(range(u,{x,y})<.67)return u.id;
  }
  for(let i=g.firms.length-1;i>=0;i--){
   const b=g.firms[i];if(x>=b.x&&x<b.x+b.size&&y>=b.y&&y<b.y+b.size)return b.id;
  }
  for(let i=g.towns.length-1;i>=0;i--){
   const t=g.towns[i];if(x>=t.x&&x<t.x+t.size&&y>=t.y&&y<t.y+t.size)return t.id;
  }
  return null;
 }
 draw(g,selection,ghost=null,groupIds=[],selectionBox=null,now=0){
  const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height,t=this.tile();
  ctx.fillStyle='#7e9673';ctx.fillRect(0,0,w,h);
  const l=Math.max(0,Math.floor(this.cx-w/(2*t))-1);
  const r=Math.min(WORLD_W,Math.ceil(this.cx+w/(2*t))+1);
  const top=Math.max(0,Math.floor(this.cy-h/(2*t))-1);
  const bottom=Math.min(WORLD_H,Math.ceil(this.cy+h/(2*t))+1);
  for(let y=top;y<bottom;y++)for(let x=l;x<r;x++)this.tileDraw(g,ctx,x,y,t);
  // Roads and short symbolic paths between settlements and owned firms.
  ctx.lineWidth=Math.max(1,t*.07);ctx.strokeStyle='#b9ac84b0';ctx.setLineDash([t*.13,t*.18]);
  for(const f of g.firms){
   const town=g.nearestTown(f);
   if(!town||!g.linked(f,town))continue;
   const a=this.screen(f.x+f.size/2,f.y+f.size/2);
   const b=this.screen(town.x+town.size/2,town.y+town.size/2);
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  ctx.setLineDash([]);
  for(const town of g.towns)this.townDraw(ctx,town,selection,t);
  for(const site of g.constructionSites||[]){
   if(site.status!=='walking')continue;
   const p=this.screen(site.x,site.y),w=site.size*t;
   ctx.fillStyle='#d8ba6a52';ctx.fillRect(p.x,p.y,w,w);
   ctx.strokeStyle='#f4cb63';ctx.lineWidth=Math.max(1,t*.07);
   ctx.setLineDash([Math.max(3,t*.15),Math.max(3,t*.12)]);
   ctx.strokeRect(p.x+1,p.y+1,w-2,w-2);ctx.setLineDash([]);
   this.label(ctx,'Cantiere · in attesa',p.x+w/2,p.y+w/2,t);
  }
  for(const firm of g.firms)this.firmDraw(ctx,firm,selection,t);
  const group=new Set(groupIds);
  this.spritePaused=!!g.paused;
  for(const unit of g.units)this.unitDraw(ctx,unit,selection,t,group.has(unit.id),now);
  if(this.originalSprites){
   const live=new Set(g.units.map(u=>u.id));
   for(const id of this.spriteMotion.keys())if(!live.has(id))this.spriteMotion.delete(id);
  }
  if(ghost){
   const cfg=FIRMS[ghost.kind],pos=this.screen(ghost.x,ghost.y);
   const result=g.occupied(ghost.x,ghost.y,cfg.size);
   ctx.fillStyle=result?'#e6464077':'#8eff8d77';ctx.fillRect(pos.x,pos.y,cfg.size*t,cfg.size*t);
   ctx.strokeStyle=result?'#ff796a':'#efffbd';ctx.lineWidth=2;
   ctx.strokeRect(pos.x,pos.y,cfg.size*t,cfg.size*t);
  }
  if(selectionBox){
    const a=selectionBox.start,b=selectionBox.end;
    const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),width=Math.abs(b.x-a.x),height=Math.abs(b.y-a.y);
    ctx.fillStyle='#e6d79c28';ctx.fillRect(x,y,width,height);
    ctx.strokeStyle='#f6e4a0';ctx.lineWidth=2;
    ctx.setLineDash([6,4]);ctx.strokeRect(x,y,width,height);ctx.setLineDash([]);
   }
   this.drawMini(g);
 }
 tileDraw(g,ctx,x,y,t){
  const p=this.screen(x,y),type=terrain(g.seed,x,y),n=hash(x,y,g.seed);
  const originalGround=this.originalTerrain?.drawTile(ctx,p.x,p.y,t,type,n)??false;
  if(!originalGround){
   const arr=COLORS[type];ctx.fillStyle=arr[Math.min(arr.length-1,Math.floor(n*arr.length))];
   ctx.fillRect(Math.floor(p.x),Math.floor(p.y),Math.ceil(t+1),Math.ceil(t+1));
  }
  if(t<10)return;
  if(type==='forest'&&n>.12){
   ctx.fillStyle='#273f2b';ctx.beginPath();ctx.moveTo(p.x+t*.52,p.y+t*.07);ctx.lineTo(p.x+t*.14,p.y+t*.75);ctx.lineTo(p.x+t*.87,p.y+t*.75);ctx.closePath();ctx.fill();
   ctx.fillStyle='#315b32';ctx.beginPath();ctx.arc(p.x+t*.52,p.y+t*.45,t*.20,0,Math.PI*2);ctx.fill();
  }else if(type==='hill'&&n>.30){
   ctx.fillStyle='#7c8073';ctx.beginPath();ctx.moveTo(p.x+t*.12,p.y+t*.85);ctx.lineTo(p.x+t*.48,p.y+t*.19);ctx.lineTo(p.x+t*.91,p.y+t*.85);ctx.closePath();ctx.fill();
   ctx.fillStyle='#cec8a7';ctx.beginPath();ctx.moveTo(p.x+t*.48,p.y+t*.19);ctx.lineTo(p.x+t*.35,p.y+t*.46);ctx.lineTo(p.x+t*.59,p.y+t*.43);ctx.closePath();ctx.fill();
  }else if(type==='water'){
   ctx.fillStyle='#a7c4bb7f';ctx.fillRect(p.x+t*.13,p.y+t*.35,t*.32,Math.max(1,t*.055));
  }else if(type==='grass'&&n>.73){
   ctx.fillStyle='#456f40';ctx.fillRect(p.x+t*.3,p.y+t*.66,t*.08,t*.13);
  }
 }
 flag(ctx,color,x,y,t){
  ctx.fillStyle='#423928';ctx.fillRect(x,y,t*.06,t*.58);
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x+t*.06,y);ctx.lineTo(x+t*.51,y+t*.11);ctx.lineTo(x+t*.06,y+t*.26);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#29231d';ctx.lineWidth=Math.max(.6,t*.03);ctx.stroke();
 }
 label(ctx,title,x,y,t){
  if(t<13)return;
  ctx.font='bold '+Math.max(8,Math.min(13,t*.46))+'px Georgia';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.lineWidth=3;ctx.strokeStyle='#20251ae0';ctx.strokeText(title,x,y);
  ctx.fillStyle='#fff2ce';ctx.fillText(title,x,y);
 }
 townDraw(ctx,town,selection,t){
  const p=this.screen(town.x,town.y),s=town.size*t,color=NATIONS[town.owner]?.color||'#ccc';
  if(p.x+s<-30||p.y+s<-30||p.x>this.canvas.width+30||p.y>this.canvas.height+30)return;
  ctx.fillStyle='#9a8768';ctx.fillRect(p.x,p.y+s*.10,s,s*.90);
  ctx.fillStyle='#a8a17c';ctx.fillRect(p.x+s*.07,p.y+s*.16,s*.86,s*.76);
  const houseColors=['#bfae8f','#d3c4a0','#b0ac96'];
  for(let n=0;n<7;n++){
   const col=n%3,row=Math.floor(n/3);
   const bx=p.x+s*(.10+col*.28),by=p.y+s*(.18+row*.26),bw=s*.24,bh=s*.21;
   ctx.fillStyle=houseColors[n%houseColors.length];ctx.fillRect(bx,by,bw,bh);
   ctx.fillStyle='#726147';ctx.beginPath();ctx.moveTo(bx-bw*.07,by+bh*.16);ctx.lineTo(bx+bw*.5,by-bh*.40);ctx.lineTo(bx+bw*1.07,by+bh*.16);ctx.closePath();ctx.fill();
   ctx.fillStyle='#4b4132';ctx.fillRect(bx+bw*.35,by+bh*.58,bw*.25,bh*.4);
  }
  ctx.strokeStyle=color;ctx.lineWidth=Math.max(2,t*.12);ctx.strokeRect(p.x,p.y,s,s);
  this.flag(ctx,color,p.x+s*.70,p.y-s*.18,t*1.3);
  this.label(ctx,town.name,p.x+s*.5,p.y+s+Math.max(7,t*.4),t);
  if(selection===town.id){ctx.lineWidth=2;ctx.strokeStyle='#f8eb99';ctx.strokeRect(p.x-4,p.y-4,s+8,s+8);}
 }
 firmDraw(ctx,firm,selection,t){
  const p=this.screen(firm.x,firm.y),s=firm.size*t,color=NATIONS[firm.owner]?.color||'#ccc';
  if(p.x+s<0||p.y+s<0||p.x>this.canvas.width||p.y>this.canvas.height)return;
  // The blue Norman Seat of Power remains a visual proxy for the demo's blue fort.
  const originalFirm=this.originalSprites?.drawFirm(ctx,firm,p.x,p.y,t)??false;
  if(!originalFirm){
  ctx.fillStyle='#555449';ctx.fillRect(p.x+s*.08,p.y+s*.16,s*.86,s*.77);
  const shades={fort:'#a3a49b',mine:'#898278',factory:'#aa9385',market:'#c1a57c',research:'#b8b3a1',inn:'#b09b78'};
  ctx.fillStyle=shades[firm.kind]||'#aaa';ctx.fillRect(p.x+s*.15,p.y+s*.23,s*.7,s*.62);
  ctx.fillStyle='#69685c';
  if(firm.kind==='fort'){
   for(let i=0;i<4;i++)ctx.fillRect(p.x+s*(.10+i*.24),p.y+s*.09,s*.14,s*.18);
   ctx.fillStyle='#493e35';ctx.fillRect(p.x+s*.43,p.y+s*.59,s*.18,s*.26);
  }else if(firm.kind==='mine'){
   ctx.fillStyle='#3a3331';ctx.beginPath();ctx.arc(p.x+s*.5,p.y+s*.62,s*.26,Math.PI,Math.PI*2);ctx.fill();
   ctx.fillRect(p.x+s*.24,p.y+s*.62,s*.52,s*.22);
  }else if(firm.kind==='factory'){
   ctx.fillStyle='#74665d';ctx.fillRect(p.x+s*.69,p.y-s*.04,s*.13,s*.42);
   ctx.fillStyle='#d6d0b7';ctx.fillRect(p.x+s*.28,p.y+s*.43,s*.11,s*.17);
  }else if(firm.kind==='market'){
   for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#be543f':'#f0d7a4';ctx.fillRect(p.x+s*(.14+i*.18),p.y+s*.20,s*.18,s*.22)}
  }else if(firm.kind==='research'){
   ctx.fillStyle='#7c806e';ctx.fillRect(p.x+s*.35,p.y+s*.05,s*.32,s*.65);
   ctx.fillStyle='#d6cba1';ctx.fillRect(p.x+s*.42,p.y+s*.2,s*.12,s*.13);
  }else if(firm.kind==='inn'){
   ctx.fillStyle='#7d6650';ctx.fillRect(p.x+s*.43,p.y+s*.5,s*.16,s*.31);
  }
  ctx.fillStyle=color;ctx.fillRect(p.x+s*.07,p.y+s*.85,s*.86,s*.08);
  ctx.strokeStyle='#3c392f';ctx.lineWidth=2;ctx.strokeRect(p.x+s*.08,p.y+s*.16,s*.86,s*.77);
  }
  if(firm.underConstruction){
   const progress=Math.max(0,Math.min(1,firm.buildProgress||0));
   if(!originalFirm){ctx.fillStyle='#a78553ac';ctx.fillRect(p.x+s*.13,p.y+s*.12,s*.75,s*.72);}
   ctx.strokeStyle='#f7cf78';ctx.lineWidth=Math.max(2,t*.075);
   ctx.strokeRect(p.x+s*.13,p.y+s*.12,s*.75,s*.72);
   const bx=p.x+s*.13,by=p.y+s*.87,bw=s*.75,bh=Math.max(4,t*.18);
   ctx.fillStyle='#372f24';ctx.fillRect(bx,by,bw,bh);
   ctx.fillStyle='#e5c36c';ctx.fillRect(bx,by,bw*progress,bh);
   this.label(ctx,'Lavori '+Math.floor(progress*100)+'%',p.x+s*.5,p.y+s*.51,t);
  }
  if(!firm.underConstruction&&(firm.hp??100)<(firm.maxHp??100)){
   const hp=Math.max(0,Math.min(1,(firm.hp??100)/(firm.maxHp??100)));
   const barX=p.x+s*.15,barY=p.y-s*.12,barW=s*.7,barH=Math.max(3,t*.15);
   ctx.fillStyle='#55291e';ctx.fillRect(barX,barY,barW,barH);
   ctx.fillStyle='#a6ce73';ctx.fillRect(barX,barY,barW*hp,barH);
  }
  this.label(ctx,FIRMS[firm.kind]?.label||firm.kind,p.x+s*.5,p.y+s+Math.max(7,t*.4),t);
  if(selection===firm.id){ctx.strokeStyle='#fff0a3';ctx.lineWidth=2;ctx.strokeRect(p.x-3,p.y-3,s+6,s+6);}
 }
 unitDraw(ctx,u,selection,t,groupSelected=false,now=0){
  const p=this.screen(u.x,u.y),s=Math.max(8,t*.70),nation=NATIONS[u.owner]?.color||'#aaa';
  if(p.x<-20||p.y<-20||p.x>this.canvas.width+20||p.y>this.canvas.height+20)return;
  ctx.fillStyle='#18221a80';ctx.beginPath();ctx.ellipse(p.x,p.y+t*.23,s*.35,s*.16,0,0,Math.PI*2);ctx.fill();
  let originalUnit=false;
  if(this.originalSprites){
   const previous=this.spriteMotion.get(u.id);
   const moved=!!previous&&(Math.abs(u.x-previous.x)+Math.abs(u.y-previous.y)>.0001);
   const direction=moved?compassDirection(u.x-previous.x,u.y-previous.y,previous.dir):previous?.dir??4;
   const lastMovedAt=moved?now:previous?.lastMovedAt??-Infinity;
   this.spriteMotion.set(u.id,{x:u.x,y:u.y,dir:direction,lastMovedAt});
   const moving=!this.spritePaused&&now-lastMovedAt<180;
   originalUnit=this.originalSprites.drawUnit(ctx,u,p.x,p.y,t,direction,walkingFrame(now,moving));
  }
  if(!originalUnit){
  ctx.fillStyle=u.kind==='soldier'?'#b4aa8c':'#c4b18e';
  ctx.fillRect(p.x-s*.22,p.y-s*.14,s*.44,s*.47);
  ctx.fillStyle=nation;ctx.fillRect(p.x-s*.22,p.y+s*.07,s*.44,s*.23);
  ctx.fillStyle='#d7b78f';ctx.beginPath();ctx.arc(p.x,p.y-s*.22,s*.22,0,Math.PI*2);ctx.fill();
  if(u.kind==='soldier'){
   ctx.fillStyle='#68695f';ctx.fillRect(p.x-s*.23,p.y-s*.38,s*.46,s*.13);
   ctx.strokeStyle='#49463c';ctx.lineWidth=Math.max(1,s*.07);ctx.beginPath();ctx.moveTo(p.x+s*.28,p.y-s*.22);ctx.lineTo(p.x+s*.5,p.y+s*.29);ctx.stroke();
  }
  }
  if(selection===u.id||groupSelected){ctx.strokeStyle='#f6e992';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+s*.18,s*.52,s*.27,0,0,Math.PI*2);ctx.stroke();}
 }
 drawMini(g){
  const ctx=this.mctx,c=this.mini,dx=c.width/WORLD_W,dy=c.height/WORLD_H;
  ctx.fillStyle='#3a5e49';ctx.fillRect(0,0,c.width,c.height);
  // Sample every world tile, using the same deterministic terrain shade as
  // tileDraw(). The former 2x2 sampling hid narrow water/forest boundaries.
  // Pixel-aligned cell edges avoid gaps and overlaps at fractional mini scales.
  for(let y=0;y<WORLD_H;y++)for(let x=0;x<WORLD_W;x++){
   const type=terrain(g.seed,x,y),shades=COLORS[type];
   const n=hash(x,y,g.seed);
   ctx.fillStyle=shades[Math.min(shades.length-1,Math.floor(n*shades.length))];
   const left=Math.floor(x*dx),top=Math.floor(y*dy);
   ctx.fillRect(left,top,Math.floor((x+1)*dx)-left,Math.floor((y+1)*dy)-top);
  }
  // Clip and pixel-align every marker, including partially off-map entities.
  // Fractional world coordinates must never paint beyond the minimap canvas.
  const marker=(entity,sizeX,sizeY)=>{
   const rect=minimapFootprint(entity.x,entity.y,sizeX,sizeY,WORLD_W,WORLD_H,c.width,c.height);
   if(!rect)return;
   ctx.fillStyle=NATIONS[entity.owner]?.color||'#fff';
   ctx.fillRect(rect.x,rect.y,rect.width,rect.height);
  };
  for(const town of g.towns)marker(town,town.size,town.size);
  for(const firm of g.firms)marker(firm,firm.size,firm.size);
  // Units are drawn last, following the main renderer's layer order.
  for(const unit of g.units)marker(unit,1,1);
  const vw=this.canvas.width/this.tile(),vh=this.canvas.height/this.tile();
  ctx.strokeStyle='#fff0ad';ctx.lineWidth=1.2;
  const rect=minimapViewport(this.cx,this.cy,vw,vh,WORLD_W,WORLD_H,c.width,c.height,ctx.lineWidth);
  if(rect)ctx.strokeRect(rect.x,rect.y,rect.width,rect.height);
 }
 minimapAt(px,py){
  this.center(px*WORLD_W/this.mini.width,py*WORLD_H/this.mini.height);
 }
}
