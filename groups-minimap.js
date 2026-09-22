(() => {
  'use strict';
  const slots=['1','2','3'], worldExtent=()=>WORLD_SIZE*TILE;
  const livingWorldOwned=g=>g.units.filter(u=>u.owner===0&&u.health>0&&u.location?.kind==='world');

  Game.prototype.ensureGroups=function(){
    if(!this.savedGroups||typeof this.savedGroups!=='object')this.savedGroups={};
    for(const slot of slots)this.savedGroups[slot]=[...new Set((this.savedGroups[slot]||[]).filter(id=>typeof id==='string'))];
    return this.savedGroups;
  };
  Game.prototype.selectOwnedIds=function(ids,center=false){
    const wanted=new Set(ids), chosen=livingWorldOwned(this).filter(u=>wanted.has(u.id));
    for(const u of this.units)u.selected=chosen.includes(u);
    this.groupSelection=chosen;this.selected=chosen[0]||null;if(chosen[0])this.lastSelectedUnit=chosen[0];
    if(center&&chosen.length){this.camera.x=chosen.reduce((n,u)=>n+u.x*TILE,0)/chosen.length;this.camera.y=chosen.reduce((n,u)=>n+u.y*TILE,0)/chosen.length;}
    this.updateUI?.();return chosen;
  };
  Game.prototype.saveControlGroup=function(slot){
    this.ensureGroups();if(!slots.includes(String(slot)))return [];
    const ids=[...new Set(this.rtsSelectedUnits().filter(u=>u.owner===0&&u.health>0&&u.location?.kind==='world').map(u=>u.id))];
    this.savedGroups[String(slot)]=ids;this.message?.(`Gruppo ${slot} salvato: ${ids.length}.`);return ids;
  };
  Game.prototype.recallControlGroup=function(slot,now=performance.now()){
    this.ensureGroups();slot=String(slot);if(!slots.includes(slot))return [];
    const valid=new Set(livingWorldOwned(this).map(u=>u.id));this.savedGroups[slot]=this.savedGroups[slot].filter(id=>valid.has(id));
    const center=this.lastGroupRecall?.slot===slot&&now-this.lastGroupRecall.at<=650;this.lastGroupRecall={slot,at:now};
    return this.selectOwnedIds(this.savedGroups[slot],center);
  };
  Game.prototype.idlePeople=function(){return livingWorldOwned(this).filter(u=>!u.task&&u.state==='idle')};
  Game.prototype.selectNextIdle=function(){const idle=this.idlePeople();if(!idle.length)return this.message?.('Nessun abitante libero.'),null;const current=this.rtsSelectedUnits?.()[0],i=idle.indexOf(current),u=idle[(i+1)%idle.length];this.selectOwnedIds([u.id],true);return u};
  Game.prototype.selectAllIdle=function(){const idle=this.idlePeople();this.selectOwnedIds(idle.map(u=>u.id));if(!idle.length)this.message?.('Nessun abitante libero.');return idle};
  Game.prototype.centerFromMinimap=function(clientX,clientY){
    const el=$('#minimap'),r=el.getBoundingClientRect(),extent=worldExtent();
    this.camera.x=clamp((clientX-r.left)/r.width*extent,0,extent);this.camera.y=clamp((clientY-r.top)/r.height*extent,0,extent);return this.camera;
  };
  Game.prototype.drawMinimap=function(){
    const canvas=$('#minimap');if(!canvas||!this.world)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,sx=w/WORLD_SIZE,sy=h/WORLD_SIZE;
    for(let y=0;y<WORLD_SIZE;y+=2)for(let x=0;x<WORLD_SIZE;x+=2){ctx.fillStyle=BIOME[this.world.tile(x,y).biome].color;ctx.fillRect(x*sx,y*sy,2*sx+.5,2*sy+.5)}
    const dot=(e,color,size=2)=>{ctx.fillStyle=color;ctx.fillRect(e.x*sx-size/2,e.y*sy-size/2,size,size)};
    for(const b of this.buildings)if(b.health>0)dot(b,b.owner===0?'#f3d78b':'#c49a73',b.type==='base'?4:2);
    for(const u of this.units)if(u.health>0&&u.location?.kind==='world')dot(u,u.owner===0?'#fff2bd':'#d8a077',2);
    for(const r of this.raiders||[])if(r.health>0)dot(r,'#d7584e',2);for(const c of this.warCamps||[])if(c.health>0)dot(c,'#a92828',4);
    const viewW=(this.viewW||390)/this.camera.zoom/TILE*sx,viewH=(this.viewH||600)/this.camera.zoom/TILE*sy,cx=this.camera.x/TILE*sx,cy=this.camera.y/TILE*sy;
    ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.strokeRect(cx-viewW/2,cy-viewH/2,viewW,viewH);
  };
  const initUI=Game.prototype.initUI;
  Game.prototype.initUI=function(){
    initUI.call(this);$('#idleNextBtn').onclick=()=>this.selectNextIdle();$('#idleAllBtn').onclick=()=>this.selectAllIdle();
    for(const slot of slots){const b=$(`#group${slot}Btn`);let timer=0,long=false;b.onclick=()=>{if(!long)this.recallControlGroup(slot);long=false};b.oncontextmenu=e=>{e.preventDefault();this.saveControlGroup(slot)};b.addEventListener('pointerdown',()=>{long=false;timer=setTimeout(()=>{long=true;this.saveControlGroup(slot)},550)});for(const type of ['pointerup','pointercancel','pointerleave'])b.addEventListener(type,()=>clearTimeout(timer));}
    const m=$('#minimap');let active=null;m.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();active=e.pointerId;m.setPointerCapture?.(e.pointerId);this.centerFromMinimap(e.clientX,e.clientY)});m.addEventListener('pointermove',e=>{if(active===e.pointerId){e.preventDefault();e.stopPropagation();this.centerFromMinimap(e.clientX,e.clientY)}});for(const type of ['pointerup','pointercancel'])m.addEventListener(type,e=>{if(active===e.pointerId){e.preventDefault();e.stopPropagation();active=null}});
  };
  const draw=Game.prototype.draw;Game.prototype.draw=function(){draw.call(this);this.drawMinimap()};
  const snapshot=Game.prototype.snapshot;Game.prototype.snapshot=function(){const d=snapshot.call(this);this.ensureGroups();d.groupRules=1;d.savedGroups=this.savedGroups;return d};
  const load=Game.prototype.load;Game.prototype.load=function(){const ok=load.call(this);if(ok)this.ensureGroups();return ok};
})();
