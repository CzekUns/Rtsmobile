// Local inventories and persistent carrier jobs; reservations are derived from jobs.
(() => {
  'use strict';
  const CAPACITY={base:800,warehouse:400,farm:80,mill:80,bakery:80,house:40,tower:20,palisade:10};
  const RECIPES={mill:{input:'grain',output:'flour',amount:2,seconds:6},bakery:{input:'flour',output:'bread',amount:2,seconds:8}};
  window.TERRA_CAPACITY=CAPACITY;window.TERRA_RECIPES=RECIPES;
  const total=items=>Object.values(items).reduce((sum,n)=>sum+n,0);
  const storage=b=>b&&b.alive&&b.built&&(b.type==='base'||b.type==='warehouse');
  Game.prototype.ensureInventories=function(){
    for(const b of this.buildings){if(!b.inventory)b.inventory={items:b.type==='base'?{...this.stock}:{},capacity:CAPACITY[b.type]||80};if(b.batch===undefined)b.batch=null;}
    const base=this.buildings.find(b=>b.type==='base');if(base)this.stock=base.inventory.items;
    for(const k of ['food','wood','stone','iron','bread'])if(this.stock[k]===undefined)this.stock[k]=0;
  };
  const newGame=Game.prototype.newGame;
  Game.prototype.newGame=function(seed){newGame.call(this,seed);this.ensureInventories();};
  Game.prototype.reserved=function(buildingId,good,kind,except=null){
    return this.units.reduce((sum,u)=>{const t=u.task;if(u===except||u.health<=0||t?.type!=='haul'||!t.amount)return sum;
      if(kind==='out')return sum+(t.phase==='source'&&t.source===buildingId&&t.good===good?t.amount:0);
      return sum+(t.destination===buildingId&&['source','destination'].includes(t.phase)?t.amount:0);
    },0);
  };
  Game.prototype.freeSpace=function(b,except=null){return Math.max(0,b.inventory.capacity-total(b.inventory.items)-(b.batch?.amount||0)-this.reserved(b.id,null,'in',except));};
  Game.prototype.available=function(b,good,except=null){return Math.max(0,(b.inventory.items[good]||0)-this.reserved(b.id,good,'out',except));};
  Game.prototype.canPay=function(cost){this.ensureInventories();const base=this.buildings.find(b=>b.type==='base'&&b.alive);return !!base&&Object.entries(cost).every(([k,v])=>this.available(base,k)>=v);};
  Game.prototype.pay=function(cost){if(!this.canPay(cost))return false;for(const [k,v]of Object.entries(cost))this.stock[k]-=v;return true;};
  Game.prototype.pathToBuilding=function(u,b){
    if(!b?.alive||!b.built)return null;
    if(dist(u,b)<=1.15)return [];
    const x=Math.floor(b.x),y=Math.floor(b.y);
    const targets=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([x,y])=>this.world.walkable(x,y,1,null,this.buildings)).sort((a,c)=>Math.hypot(u.x-a[0],u.y-a[1])-Math.hypot(u.x-c[0],u.y-c[1]));
    for(const [tx,ty]of targets){const path=this.findPath(u.x,u.y,tx,ty,1);if(path.length)return path;}
    return null;
  };
  Game.prototype.assignHaul=function(u,source,destination,good,repeat=true){
    this.ensureInventories();
    if(!u||u.health<=0||!source?.alive||!source.built||!destination?.alive||!destination.built||source.id===destination.id)return 'Scegli un abitante e due edifici completati diversi.';
    if(!['grain','flour','bread','food','wood','stone','iron'].includes(good))return 'Merce non valida.';
    if(u.inventory.amount)return 'L’abitante ha già un carico: usa Consegna prima di assegnare una rotta.';
    if(this.pathToBuilding(u,source)===null||this.pathToBuilding(source,destination)===null)return 'Percorso non raggiungibile fra abitante, origine e destinazione.';
    this.cancelTask(u);u.task={type:'haul',source:source.id,destination:destination.id,good,repeat,phase:'waiting',amount:0,retry:0};u.state='hauling';this.prepareHaul(u);return null;
  };
  Game.prototype.prepareHaul=function(u){
    const t=u.task,source=this.findById(this.buildings,t.source),destination=this.findById(this.buildings,t.destination);
    if(!source?.alive||!destination?.alive){this.cancelTask(u);return;}
    const amount=Math.min(u.inventory.cap,this.available(source,t.good,u),this.freeSpace(destination,u));
    if(!amount){t.phase='waiting';t.amount=0;t.retry=1;return;}
    const path=this.pathToBuilding(u,source);
    if(path===null){t.phase='waiting';t.amount=0;t.retry=2;return;}
    t.amount=amount;t.phase='source';u.path=path;
  };
  Game.prototype.updateHaul=function(u,dt){
    const t=u.task;if(t?.type!=='haul'){this.cancelTask(u);return;}
    const source=this.findById(this.buildings,t.source),destination=this.findById(this.buildings,t.destination);
    if(!source?.alive||!destination?.alive){this.cancelTask(u);return;}
    if(t.retry>0){t.retry=Math.max(0,t.retry-dt);return;}
    if(t.phase==='waiting'){this.prepareHaul(u);return;}
    const target=t.phase==='source'?source:destination;
    if(dist(u,target)>1.15){
      if(!u.path.length){const path=this.pathToBuilding(u,target);if(path===null){t.retry=2;return;}u.path=path;}
      this.followPath(u,dt,1.6);return;
    }
    if(t.phase==='source'){
      const amount=Math.min(t.amount,this.available(source,t.good,u),this.freeSpace(destination,u));
      if(!amount){t.amount=0;t.phase='waiting';t.retry=1;return;}
      const path=this.pathToBuilding(u,destination);if(path===null){t.amount=0;t.phase='waiting';t.retry=2;return;}
      source.inventory.items[t.good]-=amount;u.inventory.type=t.good;u.inventory.amount=amount;
      t.amount=amount;t.phase='destination';u.path=path;
    }else{
      const amount=Math.min(u.inventory.amount,this.freeSpace(destination,u));
      destination.inventory.items[t.good]=(destination.inventory.items[t.good]||0)+amount;u.inventory.amount-=amount;t.amount=u.inventory.amount;
      if(u.inventory.amount){t.retry=1;return;}
      u.inventory.type=null;
      if(t.repeat){t.phase='waiting';t.amount=0;t.retry=0;this.prepareHaul(u);}else this.cancelTask(u);
    }
  };
  const updateUnit=Game.prototype.updateUnit;
  Game.prototype.updateUnit=function(u,dt){if(u.health<=0)return;if(u.state==='hauling'){this.updateHaul(u,dt);return;}updateUnit.call(this,u,dt);};
  Game.prototype.nearestStorage=function(u){this.ensureInventories();return this.buildings.filter(b=>storage(b)&&this.freeSpace(b)>0).sort((a,b)=>dist(u,a)-dist(u,b)).find(b=>this.pathToBuilding(u,b)!==null)||null;};
  Game.prototype.returnToStorage=function(u,after,destination=null){
    this.ensureInventories();const b=destination||this.nearestStorage(u);
    if(!storage(b)||this.freeSpace(b)<=0){this.cancelTask(u);this.message('Nessun deposito raggiungibile con spazio: il carico resta all’abitante.');return false;}
    const path=this.pathToBuilding(u,b);if(path===null){this.message('Deposito non raggiungibile. Il carico resta all’abitante.');return false;}
    // Detach from farm during the journey; only physically present workers grow crops.
    if(u.task?.type==='farm'){const farm=this.findById(this.buildings,u.task.target);if(farm)farm.assigned=farm.assigned.filter(id=>id!==u.id);}
    u.task={type:'return',target:b.id,after};u.path=path;u.state='moving';return true;
  };
  Game.prototype.deposit=function(u,after){
    const b=this.findById(this.buildings,u.task?.target);
    if(!storage(b)){this.cancelTask(u);this.message('Deposito non disponibile. Carico conservato.');return;}
    if(dist(u,b)>1.15){const path=this.pathToBuilding(u,b);if(path===null){this.cancelTask(u);this.message('Percorso bloccato. Carico conservato.');return;}u.path=path;return;}
    const amount=Math.min(u.inventory.amount,this.freeSpace(b));
    if(amount){b.inventory.items[u.inventory.type]=(b.inventory.items[u.inventory.type]||0)+amount;u.inventory.amount-=amount;}
    if(u.inventory.amount){this.cancelTask(u);this.message('Deposito pieno: il residuo resta nel carico.');return;}
    u.inventory.type=null;
    if(after?.type==='gather'){const r=this.findById(this.world.resources,after.target);if(r?.amount>0)return this.assignGather(u,r);}
    if(after?.type==='farm'){const f=this.findById(this.buildings,after.target);if(f?.alive)return this.assignFarm(u,f);}
    this.cancelTask(u);
  };
  const assignGather=Game.prototype.assignGather;
  Game.prototype.assignGather=function(u,r){if(u.inventory.amount&&(u.inventory.type!==r.type||u.inventory.amount>=u.inventory.cap)){this.cancelTask(u);return this.returnToStorage(u,{type:'gather',target:r.id});}assignGather.call(this,u,r);};
  Game.prototype.gatherTick=function(u,dt){
    const r=this.findById(this.world.resources,u.task?.target);
    if(!r||r.amount<=0){if(u.inventory.amount)this.returnToStorage(u,null);else this.cancelTask(u);return;}
    if(u.inventory.amount&&(u.inventory.type!==r.type||u.inventory.amount>=u.inventory.cap)){this.returnToStorage(u,{type:'gather',target:r.id});return;}
    if(dist(u,r)>1){u.path=this.findPath(u.x,u.y,Math.floor(r.x),Math.floor(r.y),1);if(!u.path.length){this.cancelTask(u);return;}u.state='moving';return;}
    u.workTimer-=dt;if(u.workTimer<=0){const skill=Object.hasOwn(u.skills,r.type)?r.type:'food';u.workTimer=Math.max(.45,1.15-u.skills[skill]*.06);r.amount--;u.inventory.type=r.type;u.inventory.amount++;u.gain(skill,1);if(u.inventory.amount>=u.inventory.cap||r.amount<=0)this.returnToStorage(u,r.amount>0?{type:'gather',target:r.id}:null);}
  };
  Game.prototype.buildingDay=function(b){
    if(!b.built||!b.alive)return;this.ensureInventories();
    if(b.type==='farm'){
      const workers=this.units.filter(u=>u.health>0&&u.state==='farming'&&u.task?.target===b.id&&dist(u,b)<=1.2);
      if(!workers.length)return;
      const tile=this.world.tile(Math.floor(b.x),Math.floor(b.y)),season=this.season(),seasonMod=season==='Primavera'||season==='Autunno'?1.15:season==='Estate'?1:.58,water=tile.nearWater?1.3:1;
      const skill=workers.reduce((s,u)=>s+u.skills.farming,0)/workers.length;
      b.growth=Math.min(1,b.growth+1/42*BIOME[tile.biome].fertility*seasonMod*water*(1+(skill-1)*.08));
      const amount=Math.max(5,Math.round(15*BIOME[tile.biome].fertility*water*seasonMod));
      if(b.growth>=1&&this.freeSpace(b)>=amount){b.inventory.items.grain=(b.inventory.items.grain||0)+amount;b.growth=0;for(const u of workers)u.gain('farming',5);this.message(`Raccolto: ${amount} grano nel campo. Assegna il trasporto al mulino.`);}
    }

  };
  const updateBuilding=Game.prototype.updateBuilding;
  Game.prototype.updateBuilding=function(b,dt){
    updateBuilding.call(this,b,dt);const recipe=RECIPES[b.type];if(!recipe||!b.built||!b.alive)return;
    if(b.batch){b.batch.remaining=Math.max(0,b.batch.remaining-dt);if(b.batch.remaining===0){b.inventory.items[recipe.output]=(b.inventory.items[recipe.output]||0)+b.batch.amount;b.batch=null;}return;}
    if(this.available(b,recipe.input)>=recipe.amount&&total(b.inventory.items)+this.reserved(b.id,null,'in')<=b.inventory.capacity){
      // Output reservation replaces consumed input, keeping capacity invariant.
      b.inventory.items[recipe.input]-=recipe.amount;b.batch={input:recipe.input,output:recipe.output,amount:recipe.amount,remaining:recipe.seconds};
    }
  };
  Game.prototype.recoverDeadCargo=function(){
    for(const u of this.units)if(u.health<=0&&u.inventory.amount){this.world.resources.push(new ResourceNode(u.inventory.type,u.x,u.y,u.inventory.amount));u.inventory.amount=0;u.inventory.type=null;u.task=null;}
  };
  const update=Game.prototype.update;
  Game.prototype.update=function(dt){if(this.paused||this.suspended||this.gameEnded)return;this.ensureInventories();update.call(this,dt);};
  const resourceName=Game.prototype.resourceName;
  Game.prototype.resourceName=function(type){return({grain:'grano',flour:'farina',bread:'pane'})[type]||resourceName.call(this,type);};
  const unitStatus=Game.prototype.unitStatus;
  Game.prototype.unitStatus=function(u){if(u.task?.type==='haul'){const t=u.task;return t.phase==='waiting'?'attende merci o spazio':t.phase==='source'?'va al prelievo':`trasporta ${this.resourceName(t.good)}`;}return unitStatus.call(this,u);};
  const applyOrder=Game.prototype.applyOrder;
  Game.prototype.applyOrder=function(o,pos,tx,ty,u=this.selected){if(o==='deliver'){const b=this.nearestAt(this.buildings,pos,1,storage);if(!b||!u.inventory.amount){this.message('Serve un carico e un deposito completato.');return;}this.cancelTask(u);if(this.returnToStorage(u,null,b)){this.orderMode=null;this.syncModeButtons();}return;}return applyOrder.call(this,o,pos,tx,ty,u);};
  const orderHelp=Game.prototype.orderHelp;
  Game.prototype.orderHelp=function(o){return o==='deliver'?'Tocca la Casa comune o un magazzino.':orderHelp.call(this,o);};
  const contextTap=Game.prototype.rtsContextTap;
  Game.prototype.rtsContextTap=function(sx,sy){const w=this.screenToWorld(sx,sy),pos={x:w.x/TILE,y:w.y/TILE},entity=this.pickEntity(pos),group=this.rtsSelectedUnits();if(storage(entity)&&group.some(u=>u.inventory.amount)){for(const u of group)if(u.inventory.amount){this.cancelTask(u);this.returnToStorage(u,null,entity);}return;}contextTap.call(this,sx,sy);};

  const selectionHTML=Game.prototype.selectionHTML;
  Game.prototype.selectionHTML=function(e){let html=selectionHTML.call(this,e);if(e instanceof Building&&e.inventory){const items=Object.entries(e.inventory.items).filter(([,n])=>n>0).map(([k,n])=>`${this.resourceName(k)} ${n}`).join(' · ')||'vuoto';html+=`<p>Scorte locali ${total(e.inventory.items)}/${e.inventory.capacity}: ${items}</p>`;if(RECIPES[e.type])html+=`<p>${e.batch?'In lavorazione':this.available(e,RECIPES[e.type].input)<2?'In attesa di ingredienti':'Pronto'} · usa Mondo → Filiera per i trasporti</p>`;}return html;};
  const updateUI=Game.prototype.updateUI;
  Game.prototype.updateUI=function(){this.ensureInventories();updateUI.call(this);$('#foodVal').textContent=Math.floor((this.stock.food||0)+(this.stock.bread||0));};
  const drawBuilding=Game.prototype.drawBuilding;
  Game.prototype.drawBuilding=function(b){if(!RECIPES[b.type])return drawBuilding.call(this,b);const p=this.worldToScreen(b.x*TILE,b.y*TILE),z=this.camera.zoom,c=this.ctx;c.save();c.fillStyle=b.type==='mill'?'#918b72':'#a47854';c.fillRect(p.x-15*z,p.y-13*z,30*z,26*z);c.fillStyle='#3d382f';if(b.type==='mill'){c.fillRect(p.x-2*z,p.y-12*z,4*z,24*z);c.fillRect(p.x-12*z,p.y-2*z,24*z,4*z);}else c.fillRect(p.x-8*z,p.y-3*z,16*z,12*z);if(!b.built){c.fillStyle='#d0b36a';c.fillRect(p.x-15*z,p.y+16*z,30*z*b.progress,3*z);}c.restore();if(this.selected?.id===b.id)this.selectionRing(p.x,p.y,20*z);};

  Game.prototype.renderLogistics=function(){
    this.ensureInventories();const buildings=this.buildings.filter(b=>b.alive&&b.built);
    const label=b=>`${BUILD_LABEL[b.type]} (${Math.floor(b.x)}, ${Math.floor(b.y)})`;
    $('#inventoryList').innerHTML=buildings.map(b=>`<article><b>${label(b)}</b><span>${total(b.inventory.items)}/${b.inventory.capacity} · ${Object.entries(b.inventory.items).filter(([,n])=>n).map(([k,n])=>`${this.resourceName(k)}: ${n}`).join(' · ')||'vuoto'}</span>${b.batch?`<span>In lavorazione: ${b.batch.amount} ${this.resourceName(b.batch.output)}</span>`:''}</article>`).join('');
    const populate=(id,entries)=>{const el=$(id),old=el.value;el.innerHTML=entries.map(([id,label])=>`<option value="${id}">${label}</option>`).join('');if(entries.some(([id])=>id===old))el.value=old;};
    populate('#carrierSelect',this.units.filter(u=>u.health>0&&u.location.kind==='world').map(u=>[u.id,`${u.name} · ${this.unitStatus(u)} · carico ${u.inventory.amount}/${u.inventory.cap}`]));
    populate('#sourceSelect',buildings.map(b=>[b.id,label(b)]));populate('#destinationSelect',buildings.map(b=>[b.id,label(b)]));
    $('#routeList').innerHTML=this.units.filter(u=>u.task?.type==='haul').map(u=>{const t=u.task,source=this.findById(buildings,t.source),dest=this.findById(buildings,t.destination);return `<p><b>${u.name}</b>: ${source?label(source):'origine perduta'} → ${dest?label(dest):'destinazione perduta'} · ${this.resourceName(t.good)} · ${this.unitStatus(u)} · prenotati ${t.amount}</p>`;}).join('')||'<p>Nessun trasporto assegnato.</p>';
  };
  const initUI=Game.prototype.initUI;
  Game.prototype.initUI=function(){initUI.call(this);const dialog=$('#logisticsDialog');
    $('#logisticsBtn').onclick=()=>{this.pauseBeforeLogistics=this.paused;this.setPaused(true);this.pointerCancel();this.renderLogistics();$('#transportStatus').textContent='';dialog.showModal();};
    $('#closeLogistics').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(!this.suspended&&!this.backgroundDuringLogistics)this.setPaused(this.pauseBeforeLogistics);this.backgroundDuringLogistics=false;});
    $('#transportForm').onsubmit=e=>{e.preventDefault();const u=this.findById(this.units,$('#carrierSelect').value),source=this.findById(this.buildings,$('#sourceSelect').value),dest=this.findById(this.buildings,$('#destinationSelect').value);const error=this.assignHaul(u,source,dest,$('#goodsSelect').value,$('#repeatRoute').checked);$('#transportStatus').textContent=error||'Trasporto assegnato. Chiudi per riprendere.';if(!error){this.save(true);this.renderLogistics();}};
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)this.backgroundDuringLogistics=true;});
  };
})();
