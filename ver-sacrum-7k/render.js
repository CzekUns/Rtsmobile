// Canvas renderer for Ver Sacrum · Le Genti. Everything is pure JavaScript.
import {MAP_W, MAP_H, TILE, BUILDINGS, FACTIONS, terrain, random} from './sim.js';
const PALETTE={plain:'#788761',forest:'#4b6550',brush:'#6e7755',hill:'#958e77'};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class Scene {
  constructor(canvas,minimap){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');
    this.mini=minimap;this.mctx=minimap.getContext('2d');
    this.camera={x:27,y:24,zoom:1.05};this.lastMini=0;this.minimapMode='terrain';
  }
  size(){return {w:this.canvas.clientWidth||800,h:this.canvas.clientHeight||600};}
  scale(){return TILE*this.camera.zoom;}
  worldToScreen(x,y){
    const {w,h}=this.size(),s=this.scale();
    return {x:(x-this.camera.x)*s+w/2,y:(y-this.camera.y)*s+h/2};
  }
  screenToWorld(px,py){
    const {w,h}=this.size(),s=this.scale();
    return {x:(px-w/2)/s+this.camera.x,y:(py-h/2)/s+this.camera.y};
  }
  clampCamera(){
    const {w,h}=this.size(),s=this.scale();
    const marginX=Math.min(MAP_W/2,w/(2*s)),marginY=Math.min(MAP_H/2,h/(2*s));
    this.camera.x=clamp(this.camera.x,marginX,MAP_W-marginX);
    this.camera.y=clamp(this.camera.y,marginY,MAP_H-marginY);
  }
  pan(dx,dy){
    this.camera.x-=dx/this.scale();this.camera.y-=dy/this.scale();this.clampCamera();
  }
  zoom(factor){this.camera.zoom=clamp(this.camera.zoom*factor,.65,2.8);this.clampCamera();}
  center(x=27,y=24){this.camera.x=x;this.camera.y=y;this.clampCamera();}
  draw(game,selected,placement){
    const ctx=this.ctx,{w,h}=this.size(),ratio=Math.min(window.devicePixelRatio||1,2);
    const cw=Math.max(1,Math.round(w*ratio)),ch=Math.max(1,Math.round(h*ratio));
    if(this.canvas.width!==cw||this.canvas.height!==ch){this.canvas.width=cw;this.canvas.height=ch;}
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,w,h);
    const s=this.scale(),x0=clamp(Math.floor(this.camera.x-w/(2*s))-1,0,MAP_W-1),
      x1=clamp(Math.ceil(this.camera.x+w/(2*s))+1,1,MAP_W),
      y0=clamp(Math.floor(this.camera.y-h/(2*s))-1,0,MAP_H-1),
      y1=clamp(Math.ceil(this.camera.y+h/(2*s))+1,1,MAP_H);
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const p=this.worldToScreen(x,y),kind=terrain(x,y,game.seed);
      ctx.fillStyle=PALETTE[kind];
      ctx.fillRect(Math.floor(p.x),Math.floor(p.y),Math.ceil(s)+1,Math.ceil(s)+1);
      const sub=random(x,y,game.seed+888);
      ctx.fillStyle=sub>.5?'#ffffff0b':'#0000000d';
      ctx.fillRect(p.x+s*.2,p.y+s*.14,Math.max(2,s*.18),Math.max(2,s*.14));
      ctx.strokeStyle='#13201810';ctx.lineWidth=.7;ctx.strokeRect(p.x,p.y,s,s);
    }
    for(const r of game.resources){
      if(!r.quantity||r.x<x0||r.x>x1||r.y<y0||r.y>y1)continue;
      this.drawResource(r,s);
    }
    for(const b of game.buildings)this.drawBuilding(b,s,selected);
    for(const p of game.people)if(!p.inside)this.drawPerson(p,s,selected);
    if(placement&&placement.x!==null){
      const def=BUILDINGS[placement.type],q=this.worldToScreen(placement.x,placement.y);
      const edge=def.size*s,valid=!game.isOccupied(placement.x,placement.y,def.size);
      ctx.fillStyle=valid?'#4eb76d69':'#c458586d';
      ctx.strokeStyle=valid?'#d3f8be':'#ffc2bb';ctx.lineWidth=2;
      ctx.fillRect(q.x,q.y,edge,edge);ctx.strokeRect(q.x,q.y,edge,edge);
    }
    if(performance.now()-this.lastMini>270){
      this.drawMini(game);this.lastMini=performance.now();
    }
  }
  drawResource(r,s){
    const ctx=this.ctx,p=this.worldToScreen(r.x,r.y),rad=Math.max(4,s*.3);
    ctx.save();ctx.translate(p.x,p.y);
    if(r.type==='wood'){
      ctx.fillStyle='#26402d';ctx.beginPath();ctx.arc(0,0,rad*1.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#659561';ctx.beginPath();
      for(let k=0;k<7;k++){const a=k*Math.PI*2/7;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}
      ctx.closePath();ctx.fill();
      ctx.fillStyle='#afd08b';ctx.beginPath();ctx.arc(-rad*.18,-rad*.2,rad*.22,0,Math.PI*2);ctx.fill();
    }else if(r.type==='stone'){
      ctx.fillStyle='#ded9bc';ctx.beginPath();ctx.moveTo(0,-rad);ctx.lineTo(rad,rad);ctx.lineTo(-rad,rad);ctx.closePath();ctx.fill();
      ctx.fillStyle='#8b8a7f';ctx.fillRect(-rad*.3,0,rad*.42,rad*.58);
    }else{
      ctx.fillStyle='#e1c874';ctx.beginPath();
      for(let k=0;k<6;k++){const a=k*Math.PI*2/6;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}
      ctx.closePath();ctx.fill();
      ctx.fillStyle='#648b42';ctx.fillRect(-rad*.12,-rad*.52,rad*.24,rad*.72);
    }
    if(r.quantity<r.maximum*.25){ctx.strokeStyle='#ffdd86';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,rad*1.35,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  drawBuilding(b,s,selected){
    const ctx=this.ctx,q=this.worldToScreen(b.x,b.y),e=BUILDINGS[b.type].size*s;
    if(q.x+e<0||q.y+e<0||q.x>this.size().w||q.y>this.size().h)return;
    ctx.save();ctx.translate(q.x,q.y);
    const color=FACTIONS.find(f=>f.id===b.owner)?.color||'#cdbf9c';
    ctx.fillStyle='#07140b83';ctx.fillRect(4,7,e-1,e-1);
    ctx.fillStyle=b.done?(b.owner===0?'#c3b28e':'#b4b5a4'):'#8b8063';
    ctx.fillRect(2,2,e-4,e-4);
    if(b.type==='village'){
      for(let k=0;k<4;k++){
        const x=6+(k%2)*e*.46,y=6+Math.floor(k/2)*e*.44;
        ctx.fillStyle=b.owner===0?'#935944':'#6c7b83';
        ctx.fillRect(x,y,e*.30,e*.27);
        ctx.fillStyle='#e5d0a4';ctx.fillRect(x+e*.08,y+e*.08,e*.07,e*.08);
      }
    }else if(b.type==='warehouse'){
      ctx.fillStyle='#83664c';ctx.fillRect(e*.13,e*.16,e*.74,e*.69);
      ctx.fillStyle='#e3ce91';ctx.fillRect(e*.24,e*.3,e*.2,e*.15);ctx.fillRect(e*.55,e*.3,e*.18,e*.15);
    }else if(b.type==='farm'){
      ctx.fillStyle='#717349';ctx.fillRect(4,4,e-8,e-8);ctx.strokeStyle='#dccd8b';ctx.lineWidth=Math.max(1,s*.08);
      for(let k=1;k<=4;k++){ctx.beginPath();ctx.moveTo(9,e*k/5);ctx.lineTo(e-9,e*k/5);ctx.stroke();}
    }else{
      ctx.fillStyle='#7b664a';ctx.fillRect(e*.13,e*.2,e*.74,e*.6);
      ctx.fillStyle='#dac391';
      for(let k=0;k<3;k++)ctx.fillRect(e*(.24+k*.21),e*.27,e*.08,e*.45);
    }
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(1.5,1.5,e-3,e-3);
    if(!b.done){
      ctx.fillStyle='#1a2119ba';ctx.fillRect(0,e-12,e,12);
      ctx.fillStyle='#d0d69d';ctx.fillRect(0,e-12,e*b.progress,12);
    }
    if(selected?.kind==='building'&&selected.id===b.id){
      ctx.strokeStyle='#f8f4c6';ctx.lineWidth=3;ctx.strokeRect(-4,-4,e+8,e+8);
    }
    ctx.restore();
  }
  drawPerson(p,s,selected){
    const ctx=this.ctx,at=this.worldToScreen(p.x,p.y),r=Math.max(5,s*.19);
    ctx.fillStyle='#14251b9e';ctx.beginPath();ctx.ellipse(at.x+3,at.y+5,r*1.25,r*.65,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=p.soldier?'#b45e4d':'#efce8e';ctx.beginPath();ctx.arc(at.x,at.y,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#483e2e';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='#5d4533';ctx.fillRect(at.x-r*.25,at.y-r*.4,r*.5,r*.52);
    if(p.soldier){ctx.strokeStyle='#c7c7ae';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(at.x+r*.65,at.y+r*.8);ctx.lineTo(at.x+r*.65,at.y-r);ctx.stroke();}
    if(p.cargo.amount){ctx.fillStyle=p.cargo.type==='wood'?'#735138':p.cargo.type==='stone'?'#d0cbc1':'#dbc76d';ctx.fillRect(at.x+r*.7,at.y-r*.7,r*.7,r*.7);}
    if(selected?.kind==='person'&&selected.id===p.id){
      ctx.strokeStyle='#fff2b1';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(at.x,at.y,r+4,0,Math.PI*2);ctx.stroke();
    }
  }
  centerOfVillage(village){return {x:village.x+2,y:village.y+2};}
  drawMini(game){
    const ctx=this.mctx,w=this.mini.width,h=this.mini.height,dx=w/MAP_W,dy=h/MAP_H;
    ctx.clearRect(0,0,w,h);
    const villages=game.buildings.filter(b=>b.type==='village'&&b.done);
    for(let y=0;y<MAP_H;y+=2)for(let x=0;x<MAP_W;x+=2){
      let tint=PALETTE[terrain(x,y,game.seed)];
      if(this.minimapMode==='politics'&&villages.length){
        let closest=villages[0],best=Infinity;
        for(const village of villages){
          const q=this.centerOfVillage(village),dist=(x-q.x)**2+(y-q.y)**2;
          if(dist<best){best=dist;closest=village;}
        }
        tint=FACTIONS.find(f=>f.id===closest.owner)?.color||'#b4a58e';
      }else if(this.minimapMode==='villages'){
        tint='#747d65';
      }
      ctx.fillStyle=tint;ctx.fillRect(x*dx,y*dy,2*dx+1,2*dy+1);
    }
    for(const b of game.buildings){
      ctx.fillStyle=FACTIONS.find(f=>f.id===b.owner)?.color||'#fff';
      const scale=this.minimapMode==='villages'?1.5:1;
      const bx=(b.x+BUILDINGS[b.type].size*(1-scale)/2)*dx;
      const by=(b.y+BUILDINGS[b.type].size*(1-scale)/2)*dy;
      ctx.fillRect(bx,by,BUILDINGS[b.type].size*dx*scale,BUILDINGS[b.type].size*dy*scale);
      if(this.minimapMode==='villages'){
        ctx.strokeStyle='#242822';ctx.lineWidth=.5;
        ctx.strokeRect(bx,by,BUILDINGS[b.type].size*dx*scale,BUILDINGS[b.type].size*dy*scale);
      }
    }
    const {w:vw,h:vh}=this.size(),cw=vw/this.scale(),ch=vh/this.scale();
    ctx.strokeStyle='#fff9d6';ctx.lineWidth=1.6;
    ctx.strokeRect((this.camera.x-cw/2)*dx,(this.camera.y-ch/2)*dy,cw*dx,ch*dy);
  }
}
