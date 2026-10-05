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

  const localPoint=(g,e)=>{const r=g.canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
  const tileAt=(g,sx,sy)=>{const w=g.screenToWorld(sx,sy);return{x:Math.floor(w.x/TILE),y:Math.floor(w.y/TILE)};};
  const addCost=(a,b,m=1)=>{for(const[k,v]of Object.entries(b||{}))a[k]=(a[k]||0)+v*m;return a;};
  const planCost=items=>items.filter(item=>!item.reuseId).reduce((sum,item)=>addCost(sum,item.type==='road'?{wood:1}:BUILD_COSTS[item.type]),{});
  const availableBuilder=g=>g.selected instanceof Unit&&g.selected.location?.kind==='world'&&g.selected.health>0?g.selected:g.units.find(u=>u.health>0&&u.location?.kind==='world'&&!u.mobilized&&u.state==='idle');

  Game.prototype.palisadeAt=function(x,y){
    return this.buildings.find(b=>b.alive&&b.type==='palisade'&&Math.floor(b.x)===x&&Math.floor(b.y)===y)||null;
  };

  Game.prototype.pendingPlacementError=function(item){
    if(item.x<0||item.y<0||item.x>=this.world.size||item.y>=this.world.size)return 'La costruzione deve rientrare nella mappa.';
    if(item._forcedError)return item._forcedError;
    if(item.type==='palisade'&&item.reuseId){
      const joint=this.palisadeAt(item.x,item.y);
      return joint?.id===item.reuseId?null:'Il raccordo della palizzata non è più disponibile.';
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

  Game.prototype.makePalisadePlan=function(start,end){
    const dx=end.x-start.x,dy=end.y-start.y;
    const orientation=Math.abs(dy)>Math.abs(dx)?'vertical':'horizontal';
    const delta=orientation==='vertical'?dy:dx;
    const step=delta<0?-1:1,count=Math.abs(delta)+1,items=[];
    for(let i=0;i<count;i++){
      const x=orientation==='horizontal'?start.x+i*step:start.x;
      const y=orientation==='vertical'?start.y+i*step:start.y;
      const cap=count===1?'both':orientation==='horizontal'?(i===0?(step>0?'left':'right'):i===count-1?(step>0?'right':'left'):'middle'):(i===0?(step>0?'top':'bottom'):i===count-1?(step>0?'bottom':'top'):'middle');
      const item={type:'palisade',x,y,orientation,cap,single:count===1};
      const existing=this.palisadeAt(x,y);
      if(existing){
        if(count>1&&(i===0||i===count-1))item.reuseId=existing.id;
        else item._forcedError='Puoi raccordarti a una palizzata esistente solo con il primo o l’ultimo tile.';
      }
      items.push(item);
    }
    const builder=availableBuilder(this);
    const plan={kind:'palisade',items,builderId:builder?.id||null,orientation};
    const tileError=items.map(item=>this.pendingPlacementError(item)).find(Boolean);
    const check=this.constructionCheck('palisade',builder);
    plan.error=tileError||(!check.ok?(builder?this.constructionRequirementText('palisade',builder):'Serve un costruttore disponibile.'):null)||(!this.canPay(planCost(items))?'Legno insufficiente per tutta la palizzata.':null);
    if(!plan.error&&!items.some(item=>!item.reuseId))plan.error='Trascina almeno un nuovo segmento di palizzata.';
    plan.valid=!plan.error;
    return plan;
  };

  Game.prototype.pointerDown=function(e){
    if(this.buildMode!=='palisade')return oldPointerDown.call(this,e);
    if(this.pendingBuildPlan){this.message('Conferma ✓ o annulla ✕ il fantasma già piazzato.');e.preventDefault();return;}
    if(this._palisadeDrag){e.preventDefault();return;}
    this.canvas.setPointerCapture(e.pointerId);
    const p=localPoint(this,e),start=tileAt(this,p.x,p.y);
    this._palisadeDrag={pointerId:e.pointerId,start};
    this.palisadeDraft=this.makePalisadePlan(start,start);
    e.preventDefault();
  };

  Game.prototype.pointerMove=function(e){
    const d=this._palisadeDrag;
    if(!d||d.pointerId!==e.pointerId)return oldPointerMove.call(this,e);
    const p=localPoint(this,e),end=tileAt(this,p.x,p.y);
    this.palisadeDraft=this.makePalisadePlan(d.start,end);
    e.preventDefault();
  };

  Game.prototype.pointerUp=function(e){
    const d=this._palisadeDrag;
    if(!d||d.pointerId!==e.pointerId)return oldPointerUp.call(this,e);
    const p=localPoint(this,e),end=tileAt(this,p.x,p.y),plan=this.makePalisadePlan(d.start,end);
    this._palisadeDrag=null;this.palisadeDraft=null;
    if(plan.valid){
      this.pendingBuildPlan=plan;this.buildMode=null;this.buildPreview=null;
      this.syncModeButtons();this.updateUI();
      this.message(`Palizzata fantasma: ${plan.items.length} ${plan.items.length===1?'sezione':'sezioni'} · ✓ conferma · ✕ annulla.`);
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
        if(joint){joint.palisadeJunction=true;reused.push(joint);}
        continue;
      }
      const b=new Building('palisade',item.x,item.y,0,false);
      b.progress=.08;
      b.requiredMaterials=null;
      b.materialsConsumed=true;
      b.palisadeOrientation=item.orientation;
      b.palisadeCap=item.cap;
      b.palisadeSingle=!!item.single;
      b.palisadeLineId=lineId;
      b.palisadeLineIndex=index;
      this.buildings.push(b);created.push(b);
    }
    this.ensureInventories?.();
    for(const b of created){if(b.inventory)b.inventory.items={};b.palisadeLineLength=created.length;}
    if(created.length){
      const master=created[0];
      master.palisadeLineMaster=true;
      master.palisadeLineIds=created.map(b=>b.id);
      master.palisadeLineWork=.08;
      if(builder)this.assignBuild(builder,master);
    }
    // Keep the player's current selection; the outer confirmation refreshes UI once.
    const join=reused.length?' · raccordo creato':'';
    this.message(created.length+' '+(created.length===1?'sezione':'sezioni')+' di palizzata confermate'+join+(builder&&created.length?'. '+builder.name+' lavora sull’intera linea.':'.'));
    return true;
  };

  Game.prototype.buildTick=function(u,dt){
    const master=u.task?.type==='build'?this.buildings.find(b=>b.id===u.task.target):null;
    if(!master||master.type!=='palisade'||!master.palisadeLineMaster)return oldBuildTick.call(this,u,dt);
    if(!master.alive){this.cancelTask(u);return;}
    if(this.buildingDistance(u,master)>1.15){
      const path=this.pathToBuilding(u,master,true);
      if(path===null){this.cancelTask(u);this.message('Palizzata non raggiungibile.');return;}
      u.path=path;u.state=path.length?'moving':'building';return;
    }
    const ids=master.palisadeLineIds||[master.id];
    const parts=ids.map(id=>this.buildings.find(b=>b.id===id)).filter(b=>b?.alive);
    if(!parts.length){this.cancelTask(u);return;}
    const speed=.06+u.skills.construction*.012;
    master.palisadeLineWork=Math.min(parts.length,(master.palisadeLineWork||.08)+dt*speed);
    const work=master.palisadeLineWork;
    for(let i=0;i<parts.length;i++){
      const p=parts[i];
      p.progress=Math.max(p.progress||.08,Math.min(1,Math.max(.08,work-i)));
      p.materialsConsumed=true;p.requiredMaterials=null;
    }
    u.gain('construction',dt*.4);
    if(work>=parts.length){
      for(const p of parts)p.progress=1;
      this.cancelTask(u);
      this.message(u.name+' ha terminato tutta la palizzata ('+parts.length+' sezioni).');
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

  Game.prototype.palisadeNeighbor=function(x,y,networkItems=[]){
    const planned=(networkItems||[]).find(p=>p.x===x&&p.y===y);
    if(planned)return planned;
    return this.palisadeAt(x,y);
  };

  Game.prototype.palisadeOrientationOf=function(p){
    return p?.orientation||p?.palisadeOrientation||null;
  };

  Game.prototype.drawPalisadePlaceholder=function(item,alpha=1,ghost=false,networkItems=[]){
    const tx=item.x??Math.floor(item.x),ty=item.y??Math.floor(item.y);
    const orientation=this.palisadeOrientationOf(item)||'horizontal';
    const p=this.worldToScreen(tx*TILE,ty*TILE),s=TILE*this.camera.zoom,q=s/5,c=this.ctx;
    const fill=ghost?'#dbc58f':'#765737',stroke=ghost?'#fff0bd':'#3c2e20';
    const left=this.palisadeNeighbor(tx-1,ty,networkItems),right=this.palisadeNeighbor(tx+1,ty,networkItems);
    const up=this.palisadeNeighbor(tx,ty-1,networkItems),down=this.palisadeNeighbor(tx,ty+1,networkItems);
    const lo=this.palisadeOrientationOf(left),ro=this.palisadeOrientationOf(right),uo=this.palisadeOrientationOf(up),do_=this.palisadeOrientationOf(down);
    const occupied=new Set();
    const add=(cx,cy)=>{if(cx>=0&&cx<5&&cy>=0&&cy<5)occupied.add(cx+','+cy);};
    const block3=(cx,cy)=>{for(let yy=cy-1;yy<=cy+1;yy++)for(let xx=cx-1;xx<=cx+1;xx++)add(xx,yy);};

    // Base strip: one log is exactly one 1/25 cell of the tile.
    if(orientation==='horizontal')for(let x=0;x<5;x++)add(x,2);
    else for(let y=0;y<5;y++)add(2,y);

    // Adjacent perpendicular walls bend into one another inside this tile.
    if(left&&lo&&lo!==orientation){add(0,2);add(1,2);add(2,2);}
    if(right&&ro&&ro!==orientation){add(2,2);add(3,2);add(4,2);}
    if(up&&uo&&uo!==orientation){add(2,0);add(2,1);add(2,2);}
    if(down&&do_&&do_!==orientation){add(2,2);add(2,3);add(2,4);}

    // External ends are 3x3 agglomerates of 1/25-tile logs.
    if(orientation==='horizontal'){
      if(!left)block3(1,2);
      if(!right)block3(3,2);
    }else{
      if(!up)block3(2,1);
      if(!down)block3(2,3);
    }

    c.save();c.globalAlpha*=alpha;c.fillStyle=fill;c.strokeStyle=stroke;c.lineWidth=Math.max(.7,.7*this.camera.zoom);
    for(const key of occupied){
      const [cx,cy]=key.split(',').map(Number),x=p.x+cx*q,y=p.y+cy*q;
      c.fillRect(x+.06*q,y+.06*q,q*.88,q*.88);
      c.strokeRect(x+.06*q,y+.06*q,q*.88,q*.88);
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