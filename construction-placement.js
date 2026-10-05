// Confirm-before-build placement flow and drag-built palisades.
(() => {
  'use strict';

  const oldPlaceBuild=Game.prototype.placeBuild;
  const oldPointerDown=Game.prototype.pointerDown;
  const oldPointerMove=Game.prototype.pointerMove;
  const oldPointerUp=Game.prototype.pointerUp;
  const oldPointerCancel=Game.prototype.pointerCancel;
  const oldCancelBuildPlacement=Game.prototype.cancelBuildPlacement;
  const oldDraw=Game.prototype.draw;
  const oldDrawBuilding=Game.prototype.drawBuilding;
  const oldBuildTick=Game.prototype.buildTick;
  const oldRefreshContextDock=Game.prototype.refreshContextDock;
  const oldInitUI=Game.prototype.initUI;
  const oldNewGame=Game.prototype.newGame;
  const oldWorldWalkable=World.prototype.walkable;

  const localPoint=(g,e)=>{const r=g.canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
  const tileAt=(g,sx,sy)=>{const w=g.screenToWorld(sx,sy);return{x:Math.floor(w.x/TILE),y:Math.floor(w.y/TILE)};};
  const addCost=(a,b,m=1)=>{for(const[k,v]of Object.entries(b||{}))a[k]=(a[k]||0)+v*m;return a;};
  const planCost=items=>items.filter(item=>!item.reuseId).reduce((sum,item)=>addCost(sum,item.type==='road'?{wood:1}:BUILD_COSTS[item.type]),{});
  const availableBuilder=g=>g.selected instanceof Unit&&g.selected.location?.kind==='world'&&g.selected.health>0?g.selected:g.units.find(u=>u.health>0&&u.location?.kind==='world'&&!u.mobilized&&u.state==='idle');

  // Confirmed palisade sites stay traversable until the segment is actually complete.
  World.prototype.walkable=function(x,y,climb=1,from=null,buildings=[]){
    const filtered=(buildings||[]).filter(b=>!(b?.type==='palisade'&&!b.built));
    return oldWorldWalkable.call(this,x,y,climb,from,filtered);
  };

  Game.prototype.palisadeAt=function(x,y){
    return this.buildings.find(b=>b.alive&&b.type==='palisade'&&Math.floor(b.x)===x&&Math.floor(b.y)===y)||null;
  };

  Game.prototype.pendingPlacementError=function(item){
    if(item.x<0||item.y<0||item.x>=this.world.size||item.y>=this.world.size)return 'La costruzione deve rientrare nella mappa.';
    if(item._forcedError)return item._forcedError;
    if(item.type==='palisade'&&item.reuseId){
      const joint=this.palisadeAt(item.x,item.y);
      return joint&&joint.id===item.reuseId?null:'Il punto di raccordo della palizzata non è più disponibile.';
    }
    if(item.type==='road'){
      const t=this.world.tile(item.x,item.y);
      if(!t||!BIOME[t.biome].walk)return 'Terreno non percorribile.';
      if(t.road)return 'Qui c’è già un sentiero.';
      return null;
    }
    return this.villagePlacementError(item.type,item.x,item.y,null,item.crop||null);
  };

  Game.prototype.validatePendingBuildPlan=function(plan){
    if(!plan?.items?.length)return 'Nessun fantasma da confermare.';
    for(const item of plan.items){const e=this.pendingPlacementError(item);if(e)return e;}
    const builder=this.units.find(u=>u.id===plan.builderId&&u.health>0&&u.location?.kind==='world')||availableBuilder(this);
    const type=plan.items[0].type;
    const check=this.constructionCheck(type,builder);
    if(!check.ok)return builder?this.constructionRequirementText(type,builder):'Serve un costruttore disponibile.';
    const cost=planCost(plan.items);
    if(!this.canPay(cost))return 'Risorse disponibili insufficienti per confermare tutto il cantiere.';
    return null;
  };

  Game.prototype.stagePendingBuild=function(type,x,y,crop=null){
    if(this.pendingBuildPlan){this.message('Conferma ✓ o annulla ✕ il fantasma già piazzato.');return false;}
    const item={type,x,y,crop:type==='farm'?(crop||this.pendingBuildCrop||'grain'):null};
    const builder=availableBuilder(this);
    const plan={kind:type==='palisade'?'palisade':'single',items:[item],builderId:builder?.id||null};
    const error=this.validatePendingBuildPlan(plan);
    if(error){this.message(error);return false;}
    this.pendingBuildPlan=plan;
    this.buildMode=null;this.buildPreview=null;this.pendingBuildCrop=null;
    this.syncModeButtons();this.updateUI();
    this.message(`${BUILD_LABEL[type]||'Costruzione'} piazzato come fantasma. ✓ conferma · ✕ annulla.`);
    return true;
  };

  Game.prototype.placeBuild=function(type,x,y,crop=null){
    if(this._committingPendingBuild||this.buildMode!==type)return oldPlaceBuild.call(this,type,x,y,crop);
    return this.stagePendingBuild(type,x,y,crop);
  };

  Game.prototype.normalizePalisadeTrace=function(cells){
    const out=[];
    for(const raw of cells||[]){
      const cell={x:raw.x,y:raw.y};
      const last=out.at(-1);if(last&&last.x===cell.x&&last.y===cell.y)continue;
      const prev=out.at(-2);
      if(prev&&prev.x===cell.x&&prev.y===cell.y){out.pop();continue;} // finger backtrack = undo last tile
      if(!last){out.push(cell);continue;}
      let x=last.x,y=last.y;
      while(x!==cell.x||y!==cell.y){
        const dx=cell.x-x,dy=cell.y-y;
        // Follow the actual pointer direction; only cardinal tile steps are emitted.
        if(Math.abs(dx)>=Math.abs(dy)&&dx!==0)x+=Math.sign(dx);
        else if(dy!==0)y+=Math.sign(dy);
        if(!out.some(p=>p.x===x&&p.y===y))out.push({x,y});
        else if(out.length>1&&out.at(-2).x===x&&out.at(-2).y===y)out.pop();
      }
    }
    return out;
  };

  Game.prototype.makePalisadePlanFromCells=function(cells){
    const trace=this.normalizePalisadeTrace(cells),items=[];
    for(let i=0;i<trace.length;i++){
      const {x,y}=trace[i],item={type:'palisade',x,y};
      const existing=this.palisadeAt(x,y);
      if(existing)item.reuseId=existing.id;
      items.push(item);
    }
    // Reusing an existing wall is allowed at a junction or endpoint, but never makes a duplicate building.
    const builder=availableBuilder(this);
    const plan={kind:'palisade',items,builderId:builder?.id||null,trace};
    const tileError=items.map(item=>this.pendingPlacementError(item)).find(Boolean);
    const check=this.constructionCheck('palisade',builder);
    plan.error=tileError||(!check.ok?(builder?this.constructionRequirementText('palisade',builder):'Serve un costruttore disponibile.'):null)||(!this.canPay(planCost(items))?'Legno insufficiente per tutta la palizzata.':null);
    plan.valid=!plan.error&&items.length>0;
    return plan;
  };

  // Compatibility entry point for a simple straight line.
  Game.prototype.makePalisadePlan=function(start,end){
    return this.makePalisadePlanFromCells([start,end]);
  };

  Game.prototype.pointerDown=function(e){
    if(this.buildMode!=='palisade')return oldPointerDown.call(this,e);
    if(this.pendingBuildPlan){this.message('Conferma ✓ o annulla ✕ il fantasma già piazzato.');e.preventDefault();return;}
    if(this._palisadeDrag){e.preventDefault();return;}
    this.canvas.setPointerCapture(e.pointerId);
    const p=localPoint(this,e),start=tileAt(this,p.x,p.y);
    this._palisadeDrag={pointerId:e.pointerId,cells:[start],lastTile:start};
    this.palisadeDraft=this.makePalisadePlanFromCells(this._palisadeDrag.cells);
    e.preventDefault();
  };

  Game.prototype.pointerMove=function(e){
    const d=this._palisadeDrag;
    if(!d||d.pointerId!==e.pointerId)return oldPointerMove.call(this,e);
    const p=localPoint(this,e),tile=tileAt(this,p.x,p.y);
    if(tile.x!==d.lastTile.x||tile.y!==d.lastTile.y){
      d.cells.push(tile);d.lastTile=tile;
      d.cells=this.normalizePalisadeTrace(d.cells);
      this.palisadeDraft=this.makePalisadePlanFromCells(d.cells);
    }
    e.preventDefault();
  };

  Game.prototype.pointerUp=function(e){
    const d=this._palisadeDrag;
    if(!d||d.pointerId!==e.pointerId)return oldPointerUp.call(this,e);
    const p=localPoint(this,e),tile=tileAt(this,p.x,p.y);
    if(tile.x!==d.lastTile.x||tile.y!==d.lastTile.y)d.cells.push(tile);
    const plan=this.makePalisadePlanFromCells(d.cells);
    this._palisadeDrag=null;this.palisadeDraft=null;
    if(plan.valid){
      this.pendingBuildPlan=plan;this.buildMode=null;this.buildPreview=null;
      this.syncModeButtons();this.updateUI();
      const turns=this.palisadeTurnCount(plan.items);
      this.message(`Palizzata fantasma: ${plan.items.length} tile${turns?` · ${turns} ${turns===1?'angolo':'angoli'}`:''} · ✓ conferma · ✕ annulla.`);
    }else if(plan.error)this.message(plan.error);
    e.preventDefault();
  };

  Game.prototype.pointerCancel=function(){
    this._palisadeDrag=null;this.palisadeDraft=null;
    return oldPointerCancel.call(this);
  };

  Game.prototype.cancelBuildPlacement=function(){
    const hadPending=!!this.pendingBuildPlan;
    this.pendingBuildPlan=null;this._palisadeDrag=null;this.palisadeDraft=null;this.pendingBuildCrop=null;
    oldCancelBuildPlacement.call(this);
    if(hadPending)this.message('Costruzione fantasma annullata.');
    this.updateUI();
  };

  Game.prototype.commitPalisadePlan=function(plan,builder){
    const cost=planCost(plan.items);
    if(!this.pay(cost)){this.message('Legno insufficiente per confermare la palizzata.');return false;}
    const lineId=crypto.randomUUID?.()||Math.random().toString(36).slice(2),created=[],reused=[];
    for(const [index,item] of plan.items.entries()){
      if(item.reuseId){
        const joint=this.palisadeAt(item.x,item.y);
        if(joint){
          joint.palisadeLineIds=[...new Set([...(joint.palisadeLineIds||[joint.palisadeLineId]).filter(Boolean),lineId])];
          reused.push(joint);
        }
        continue;
      }
      const b=new Building('palisade',item.x,item.y,0,false);
      b.requiredMaterials={...BUILD_COSTS.palisade};
      b.palisadeOrientation=item.orientation;
      b.palisadeCap=item.cap;
      b.palisadeSingle=!!item.single;
      b.palisadeLineId=lineId;
      b.palisadeLineIndex=index;
      b.palisadeLineLength=plan.items.length;
      this.buildings.push(b);created.push(b);
    }
    this.ensureInventories?.();
    for(const b of created)b.inventory.items={...b.requiredMaterials};
    if(builder&&created.length){
      const queue=created.map(b=>b.id);
      if(this.assignBuild(builder,created[0])&&builder.task){
        builder.task.palisadeQueue=queue;
        builder.task.palisadeLineId=lineId;
        builder.task.palisadeQueueIndex=0;
      }
    }
    this.groupSelection=[];for(const u of this.units)u.selected=false;
    this.selected=created[0]||reused[0]||builder||null;
    this.updateUI();
    const junctionText=reused.length?` · ${reused.length} raccordo${reused.length===1?'':'i'} riutilizzato${reused.length===1?'':'i'}`:'';
    this.message(`${created.length} ${created.length===1?'nuova sezione':'nuove sezioni'} di palizzata confermate${junctionText}${builder&&created.length?`. ${builder.name} costruirà l’intera linea in sequenza.`:'.'}`);
    return true;
  };

  Game.prototype.buildTick=function(u,dt){
    if(u.task?.type==='build'&&Array.isArray(u.task.palisadeQueue)){
      const target=this.buildings.find(b=>b.id===u.task.target);
      if(target?.alive&&!target.built&&this.buildingDistance(u,target)>1.15&&!u.path?.length){
        const path=this.pathToBuilding(u,target,true);
        if(path!==null){u.path=path;u.state=path.length?'moving':'building';}
        return;
      }
    }
    const before=u.task?.type==='build'&&Array.isArray(u.task.palisadeQueue)?{
      queue:[...u.task.palisadeQueue],
      lineId:u.task.palisadeLineId,
      index:Number.isInteger(u.task.palisadeQueueIndex)?u.task.palisadeQueueIndex:Math.max(0,u.task.palisadeQueue.indexOf(u.task.target)),
      target:u.task.target
    }:null;
    oldBuildTick.call(this,u,dt);
    if(!before)return;
    const current=this.buildings.find(b=>b.id===before.target);
    if(current?.alive&&!current.built)return;
    for(let i=before.index+1;i<before.queue.length;i++){
      const next=this.buildings.find(b=>b.id===before.queue[i]&&b.alive&&!b.built);
      if(!next)continue;
      if(this.assignBuild(u,next)&&u.task){
        u.task.palisadeQueue=before.queue;
        u.task.palisadeLineId=before.lineId;
        u.task.palisadeQueueIndex=i;
        this.message(`${u.name} passa alla sezione ${i+1}/${before.queue.length} della palizzata.`);
        return;
      }
      // Do not declare the wall finished just because a route was momentarily unavailable.
      u.task={type:'build',target:next.id,palisadeQueue:before.queue,palisadeLineId:before.lineId,palisadeQueueIndex:i,workSpot:null};
      u.path=[];u.state='building';
      return;
    }
    const remaining=before.queue.some(id=>this.buildings.some(b=>b.id===id&&b.alive&&!b.built));
    if(!remaining){
      this.cancelTask(u);
      this.message(`${u.name} ha terminato tutta la palizzata (${before.queue.length} sezioni).`);
    }
  };

  Game.prototype.confirmPendingBuildPlan=function(){
    const plan=this.pendingBuildPlan;if(!plan)return false;
    const error=this.validatePendingBuildPlan(plan);if(error){this.message(error);return false;}
    const builder=this.units.find(u=>u.id===plan.builderId&&u.health>0&&u.location?.kind==='world')||availableBuilder(this);
    if(plan.kind==='palisade'){
      if(!this.commitPalisadePlan(plan,builder))return false;
    }else{
      const item=plan.items[0],before=new Set(this.buildings.map(b=>b.id));
      this._committingPendingBuild=true;
      const prior=this.selected;if(builder)this.selected=builder;
      try{oldPlaceBuild.call(this,item.type,item.x,item.y,item.crop||null);}finally{this._committingPendingBuild=false;}
      const created=this.buildings.find(b=>!before.has(b.id));
      if(!created&&item.type!=='road'){this.selected=prior;return false;}
    }
    this.pendingBuildPlan=null;this.buildMode=null;this.buildPreview=null;this.pendingBuildCrop=null;
    this.syncModeButtons();this.updateUI();return true;
  };

  Game.prototype.palisadeTurnCount=function(items){
    let turns=0;
    for(let i=1;i<(items?.length||0)-1;i++){
      const a=items[i-1],b=items[i],d=items[i+1];
      const ax=b.x-a.x,ay=b.y-a.y,bx=d.x-b.x,by=d.y-b.y;
      if((ax===0)!==(bx===0))turns++;
    }
    return turns;
  };

  Game.prototype.palisadeConnections=function(item,networkItems=[]){
    const tx=item.x??Math.floor(item.x),ty=item.y??Math.floor(item.y);
    const planned=new Set((networkItems||[]).map(p=>`${p.x},${p.y}`));
    const has=(x,y)=>planned.has(`${x},${y}`)||!!this.palisadeAt(x,y);
    return{left:has(tx-1,ty),right:has(tx+1,ty),up:has(tx,ty-1),down:has(tx,ty+1)};
  };

  Game.prototype.drawPalisadePlaceholder=function(item,alpha=1,ghost=false,networkItems=[]){
    const tx=item.x??Math.floor(item.x),ty=item.y??Math.floor(item.y);
    const p=this.worldToScreen(tx*TILE,ty*TILE),s=TILE*this.camera.zoom,c=this.ctx;
    const fill=ghost?'#d9c58f':'#6c5136',stroke=ghost?'#fff0bd':'#3c2e20';
    const n=this.palisadeConnections(item,networkItems);
    const horizontal=n.left||n.right,vertical=n.up||n.down;
    const degree=[n.left,n.right,n.up,n.down].filter(Boolean).length;
    const corner=horizontal&&vertical;
    c.save();c.globalAlpha*=alpha;c.fillStyle=fill;c.strokeStyle=stroke;c.lineWidth=Math.max(1,1.2*this.camera.zoom);
    const rect=(x,y,w,h)=>{c.fillRect(x,y,w,h);c.strokeRect(x,y,w,h);};

    // Arms occupy the two central quarters of the tile: 50% thickness.
    if(n.left)rect(p.x,p.y+s*.25,s*.5,s*.5);
    if(n.right)rect(p.x+s*.5,p.y+s*.25,s*.5,s*.5);
    if(n.up)rect(p.x+s*.25,p.y,s*.5,s*.5);
    if(n.down)rect(p.x+s*.25,p.y+s*.5,s*.5,s*.5);

    // A corner/junction becomes a robust central square, our temporary "tower".
    if(corner||degree===0||degree>=3)rect(p.x+s*.25,p.y+s*.25,s*.5,s*.5);

    // Straight middle pieces fill the central strip.
    if(degree===2&&!corner){
      if(horizontal)rect(p.x,p.y+s*.25,s,s*.5);
      else rect(p.x+s*.25,p.y,s*.5,s);
    }

    // End pieces have the outer half of the tile solid.
    if(degree===1){
      if(n.left)rect(p.x+s*.5,p.y,s*.5,s);
      else if(n.right)rect(p.x,p.y,s*.5,s);
      else if(n.up)rect(p.x,p.y+s*.5,s,s*.5);
      else if(n.down)rect(p.x,p.y,s,s*.5);
    }
    c.restore();
  };

  Game.prototype.drawBuilding=function(b){
    if(b.type!=='palisade')return oldDrawBuilding.call(this,b);
    const item={x:Math.floor(b.x),y:Math.floor(b.y),orientation:b.palisadeOrientation||'horizontal',cap:b.palisadeCap||'middle',single:!!b.palisadeSingle};
    this.drawPalisadePlaceholder(item,b.built?1:.58,false);
    const p=this.worldToScreen(b.x*TILE,b.y*TILE),z=this.camera.zoom,c=this.ctx;
    if(!b.built){c.fillStyle='#382f23';c.fillRect(p.x-12*z,p.y+15*z,24*z,2*z);c.fillStyle='#d4af62';c.fillRect(p.x-12*z,p.y+15*z,24*z*b.progress,2*z);}
    if(this.selected?.id===b.id)this.selectionRing(p.x,p.y,16*z);
  };

  Game.prototype.drawPendingPlan=function(plan,alpha=.48){
    if(!plan?.items?.length)return;
    const c=this.ctx,z=this.camera.zoom;
    for(const item of plan.items){
      const error=this.pendingPlacementError(item),valid=!error;
      if(item.type==='palisade')this.drawPalisadePlaceholder(item,alpha,true,plan.items);
      else if(item.type==='road'){
        const p=this.worldToScreen(item.x*TILE,item.y*TILE),s=TILE*z;c.save();c.globalAlpha*=alpha;c.fillStyle='#c9b27d';c.fillRect(p.x,p.y+s*.36,s,s*.28);c.restore();
      }else{
        const ghost=new Building(item.type,item.x,item.y,0,true);if(item.crop)ghost.crop=item.crop;ghost.preview=true;
        c.save();c.globalAlpha*=alpha;this.drawBuilding(ghost);c.restore();
      }
      const ghost={type:item.type,x:item.x+.5,y:item.y+.5,crop:item.crop};
      const r=window.VER_SACRUM_VILLAGE.bounds(ghost),p=this.worldToScreen(r.left*TILE,r.top*TILE),w=(r.right-r.left)*TILE*z,h=(r.bottom-r.top)*TILE*z;
      c.save();c.fillStyle=valid?'#6bbb6329':'#db514c44';c.strokeStyle=valid?'#a0ed83':'#ff766d';c.lineWidth=2;c.fillRect(p.x,p.y,w,h);c.strokeRect(p.x,p.y,w,h);c.restore();
    }
  };

  Game.prototype.draw=function(){
    oldDraw.call(this);
    if(this.palisadeDraft)this.drawPendingPlan(this.palisadeDraft,.42);
    if(this.pendingBuildPlan)this.drawPendingPlan(this.pendingBuildPlan,.52);
  };

  Game.prototype.refreshContextDock=function(){
    oldRefreshContextDock.call(this);
    const status=$('#placementStatus'),label=$('#placementLabel'),confirm=$('#confirmPlacement'),cancel=$('#cancelPlacement');
    const pending=this.pendingBuildPlan,active=!!pending||!!this.buildMode;
    status.hidden=!active;
    if(confirm)confirm.hidden=!pending;
    if(cancel)cancel.hidden=!active;
    if(pending){
      const type=pending.items[0]?.type,n=pending.items.length;
      label.textContent=type==='palisade'?`Palizzata · ${n} ${n===1?'sezione':'sezioni'} · fantasma`:`${BUILD_LABEL[type]||'Costruzione'} · fantasma`;
    }else if(this.buildMode==='palisade')label.textContent='Palizzata · trascina in verticale o orizzontale';
    else if(this.buildMode)label.textContent=`${BUILD_LABEL[this.buildMode]||'Sentiero'} · piazza il fantasma`;
  };

  Game.prototype.initUI=function(){
    oldInitUI.call(this);
    const confirm=$('#confirmPlacement'),cancel=$('#cancelPlacement'),clear=$('#clearSelection');
    if(confirm)confirm.onclick=()=>this.confirmPendingBuildPlan();
    if(cancel)cancel.onclick=()=>this.cancelBuildPlacement();
    if(clear){const old=clear.onclick;clear.onclick=()=>{if(this.pendingBuildPlan)this.cancelBuildPlacement();else old?.();};}
  };

  Game.prototype.newGame=function(seed){
    this.pendingBuildPlan=null;this.palisadeDraft=null;this._palisadeDrag=null;
    return oldNewGame.call(this,seed);
  };
})();