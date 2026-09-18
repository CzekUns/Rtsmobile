// Mobile snapshots are separate from the original v2 slot, which is never overwritten.
(() => {
  'use strict';
  const SLOT='terra-italica-save-v5', PREVIOUS='terra-italica-save-v4', OLDER='terra-italica-save-v3', BACKUP=SLOT+'-backup', TEMP=SLOT+'-pending';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const finite=(v,min=-Infinity,max=Infinity)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  const check=(ok,label)=>{if(!ok)throw new Error('Salvataggio non valido: '+label)};
  const materials=new Set(['food','wood','stone','iron','grain','flour','bread']);
  const itemsValid=items=>items&&typeof items==='object'&&!Array.isArray(items)&&Object.entries(items).every(([k,v])=>materials.has(k)&&Number.isSafeInteger(v)&&v>=0);

  function validate(d) {
    check(d&&d.version===5,'versione');check(d.populationRules===undefined||d.populationRules===1,'regole popolazione');check(Number.isInteger(d.seed),'seed');
    for(const key of ['units','buildings','animals','raiders','resources','roads'])check(Array.isArray(d[key]),key);
    const ids=new Set();
    for(const e of [...d.units,...d.buildings,...d.animals,...d.raiders,...d.resources]){
      check(typeof e.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(e.id)&&!ids.has(e.id),'ID');ids.add(e.id);
      check(finite(e.x,0,WORLD_SIZE)&&finite(e.y,0,WORLD_SIZE),'posizione');
      if(e.health!==undefined)check(finite(e.health)&&finite(e.maxHealth,1),'salute');
    }
    check(d.buildings.some(b=>b.type==='base'),'casa comune');
    for(const b of d.buildings){
      check(Object.hasOwn(BUILD_LABEL,b.type),'edificio');check(finite(b.progress,0,1)&&finite(b.growth,0)&&finite(b.birthDays,0)&&finite(b.cooldown,0),'progresso edificio');
      check(Array.isArray(b.assigned)&&b.assigned.every(id=>typeof id==='string'),'lavoratori');
      check(b.workers===undefined||Array.isArray(b.workers)&&b.workers.every(id=>typeof id==='string'),'mestieri fabbrica');
      check(Array.isArray(b.residents)&&b.residents.length<=(b.type==='house'?5:0)&&b.residents.every(id=>typeof id==='string'),'residenti edificio');
      check(b.inventory&&itemsValid(b.inventory.items)&&finite(b.inventory.capacity,1),'inventario edificio');
      check(Object.values(b.inventory.items).reduce((s,n)=>s+n,0)<=b.inventory.capacity,'capacità edificio');
      if(b.batch){const recipe=window.TERRA_RECIPES[b.type];check(recipe&&b.batch.input===recipe.input&&b.batch.output===recipe.output&&b.batch.amount===recipe.amount&&finite(b.batch.remaining,0,recipe.seconds),'ricetta');}
    }
    for(const u of d.units){
      check(u.owner===0,'proprietario abitante');
      check(u.mobilized===undefined||typeof u.mobilized==='boolean','mobilitazione');
      check(!u.mobilized||u.location?.kind==='world','mobilitato sulla mappa');
      check(u.location&&(u.location.kind==='world'&&u.location.settlementId===null||u.location.kind==='resident'&&typeof u.location.settlementId==='string'),'collocazione abitante');
      check(u.occupation===(u.task?.type||'idle'),'occupazione abitante');
      check(typeof u.name==='string'&&u.name.length<=80&&!/[<>]/.test(u.name),'nome');
      check(u.inventory&&finite(u.inventory.cap,1)&&Number.isSafeInteger(u.inventory.amount)&&u.inventory.amount>=0&&u.inventory.amount<=u.inventory.cap,'carico');
      check(u.inventory.amount===0||materials.has(u.inventory.type),'merce');
      check(u.skills&&u.xp&&['wood','food','stone','iron','farming','construction','taming','combat'].every(k=>finite(u.skills[k],1)),'skill');
      check(u.personalKnowledge===undefined||Array.isArray(u.personalKnowledge)&&u.personalKnowledge.every(k=>typeof k==='string'),'sapere personale');
      check(Object.values(u.xp).every(v=>finite(v,0)),'XP');check(finite(u.workTimer)&&finite(u.attackCooldown,0),'timer unità');
      check(['idle','moving','gathering','building','taming','combat','farming','hauling','producing'].includes(u.state),'stato');
      if(u.location.kind==='resident')check(u.task===null&&u.state==='idle'&&u.path.length===0,'stato residente');
      check(Array.isArray(u.path)&&u.path.every(p=>finite(p.x,0,WORLD_SIZE)&&finite(p.y,0,WORLD_SIZE)),'percorso');
      if(u.task){check(['move','gather','return','build','farm','enter','tame','attack','haul','production'].includes(u.task.type),'ordine');
        if(u.task.type==='haul')check(typeof u.task.source==='string'&&typeof u.task.destination==='string'&&materials.has(u.task.good)&&['waiting','source','destination'].includes(u.task.phase)&&Number.isSafeInteger(u.task.amount)&&u.task.amount>=0&&u.task.amount<=u.inventory.cap&&typeof u.task.repeat==='boolean'&&finite(u.task.retry,0),'trasporto');
        if(u.task.type==='production')check(typeof u.task.target==='string'&&['mugnaio','fornaio'].includes(u.task.profession),'mestiere');
      }
    }
    check(d.constructionRules===undefined||d.constructionRules===1,'regole sapere edilizio');
    check(d.tribalKnowledge===undefined||Array.isArray(d.tribalKnowledge)&&d.tribalKnowledge.every(k=>typeof k==='string'),'sapere tribale');
    check(d.equipmentRules===undefined||d.equipmentRules===1,'regole equipaggiamento');
    if(d.equipmentRules===undefined)check(d.gear===undefined,'equipaggiamento senza versione');
    else {
      check(Array.isArray(d.gear),'oggetti individuali');
      const occupied=new Set(),counts=new Map(),rules=window.TERRA_EQUIPMENT.rules,catalog=window.TERRA_EQUIPMENT.catalog;
      for(const item of d.gear){
        check(item&&typeof item.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(item.id)&&!ids.has(item.id),'ID oggetto');ids.add(item.id);
        check(Object.hasOwn(catalog,item.type),'tipo oggetto');const l=item.location;
        check(l&&['bag','equipped','storage','ground'].includes(l.kind),'posizione oggetto');
        if(l.kind==='ground'){check(finite(l.x,0,WORLD_SIZE)&&finite(l.y,0,WORLD_SIZE)&&Object.keys(l).length===3,'oggetto a terra');continue;}
        check(Object.keys(l).length===(l.kind==='equipped'?3:2),'proprietà posizione oggetto');
        if(l.kind==='storage')check(d.buildings.some(b=>b.id===l.holder&&b.owner===0&&['base','warehouse','house'].includes(b.type)),'deposito oggetto');
        else check(d.units.some(u=>u.id===l.holder),'persona oggetto');
        const key=l.kind+':'+l.holder;
        if(l.kind==='equipped'){check(rules.slots.includes(l.slot)&&catalog[item.type].slot===l.slot&&!occupied.has(key+':'+l.slot),'slot oggetto');occupied.add(key+':'+l.slot);}
        else {counts.set(key,(counts.get(key)||0)+1);check(counts.get(key)<=(l.kind==='bag'?rules.bagCapacity:rules.rackCapacity),'capacità oggetti');}
      }
    }
    const residentIds=d.buildings.flatMap(b=>b.residents);
    check(new Set(residentIds).size===residentIds.length,'residente duplicato');
    for(const u of d.units)if(u.location.kind==='resident')check(residentIds.includes(u.id)&&d.buildings.some(b=>b.id===u.location.settlementId&&b.type==='house'&&b.residents.includes(u.id)),'legame residente');
    check(residentIds.every(id=>d.units.some(u=>u.id===id&&u.location.kind==='resident')),'elenco residenti');
    for(const a of d.animals)check(['sheep','wolf'].includes(a.type)&&finite(a.vx)&&finite(a.vy)&&finite(a.wander)&&finite(a.attackCooldown,0),'animale');
    for(const r of d.raiders)check(finite(r.speed,0)&&finite(r.repath)&&finite(r.attackCooldown,0)&&Array.isArray(r.path)&&r.path.every(p=>finite(p.x,0,WORLD_SIZE)&&finite(p.y,0,WORLD_SIZE)),'razziatore');
    for(const r of d.resources)check(materials.has(r.type)&&Number.isSafeInteger(r.amount)&&r.amount>=0&&finite(r.max,r.amount),'risorsa');
    // Validate capacity reservations from jobs before any live-world mutation.
    for(const b of d.buildings){
      const jobs=d.units.filter(u=>u.health>0&&u.task?.type==='haul').map(u=>u.task);
      const incoming=jobs.filter(t=>t.destination===b.id&&['source','destination'].includes(t.phase)).reduce((n,t)=>n+t.amount,0);
      check(Object.values(b.inventory.items).reduce((n,v)=>n+v,0)+(b.batch?.amount||0)+incoming<=b.inventory.capacity,'spazio prenotato');
      for(const good of materials){const outgoing=jobs.filter(t=>t.source===b.id&&t.phase==='source'&&t.good===good).reduce((n,t)=>n+t.amount,0);check(outgoing<=(b.inventory.items[good]||0),'merce prenotata');}
    }
    check(d.roads.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isInteger(v)&&v>=0&&v<WORLD_SIZE)),'strade');
    check(d.clock&&['day','month','year','totalDays','nextRaidDay','raidLevel','dayAccumulator'].every(k=>finite(d.clock[k])),'calendario');
    check(finite(d.clock.day,1,30)&&finite(d.clock.month,0,11)&&finite(d.clock.totalDays,0)&&finite(d.clock.dayAccumulator,0,1),'tempo');
    check(d.camera&&finite(d.camera.x)&&finite(d.camera.y)&&finite(d.camera.zoom,.48,2.3),'camera');
    check(Number.isInteger(d.rngState)&&d.rngState>=0&&d.rngState<=4294967295,'generatore');
    check(typeof d.paused==='boolean'&&typeof d.gameEnded==='boolean','pausa');
    check(Array.isArray(d.selection)&&d.selection.every(id=>typeof id==='string'),'selezione');
    return d;
  }

  function migrate(old) {
    check(old&&old.version===undefined&&itemsValid(old.stock),'vecchio formato');
    const d=clone(old);d.version=3;d.raiders=[];d.rngState=d.seed>>>0;d.paused=true;d.gameEnded=false;d.selection=[];
    d.clock={...d.clock,dayAccumulator:0};
    for(const b of d.buildings){b.inventory={items:{},capacity:window.TERRA_CAPACITY[b.type]||80};b.batch=null;}
    const base=d.buildings.find(b=>b.type==='base');check(base,'deposito originale');
    base.inventory.items={...d.stock};base.inventory.capacity=Math.max(base.inventory.capacity,Object.values(d.stock).reduce((a,b)=>a+b,0));
    // Old harvests could exceed carrying capacity. Preserve all existing goods.
    for(const u of d.units){u.inventory.cap=Math.max(u.inventory.cap,u.inventory.amount);u.workTimer=Math.max(0,u.workTimer||0);u.attackCooldown=Math.max(0,u.attackCooldown||0);}
    return migrateV4(migrateV3(d));
  }

  function migrateV3(old){
    check(old&&old.version===3,'versione precedente');
    const d=clone(old);d.version=4;
    check(Array.isArray(d.units),'abitanti precedenti');
    for(const u of d.units){u.owner=0;u.location={kind:'world',settlementId:null};u.occupation=u.task?.type||'idle';}
    return d;
  }

  function migrateV4(old){
    check(old&&old.version===4,'versione precedente');
    const d=clone(old);d.version=5;
    for(const b of d.buildings)b.residents=[];
    return validate(d);
  }

  Game.prototype.snapshot=function(){
    this.ensureInventories();
    return {version:5,populationRules:1,equipmentRules:1,gear:this.gear||[],seed:this.seed,rngState:this.rng.s,paused:this.paused,gameEnded:this.gameEnded,
      clock:{day:this.day,month:this.month,year:this.year,totalDays:this.totalDays,nextRaidDay:this.nextRaidDay,raidLevel:this.raidLevel,dayAccumulator:this.dayAccumulator},
      roads:this.world.tiles.filter(t=>t.road).map(t=>[t.x,t.y]),resources:this.world.resources,buildings:this.buildings,units:this.units,animals:this.animals,raiders:this.raiders,camera:this.camera,
      selection:(this.rtsSelectedUnits?.()||[]).map(u=>u.id),selectedId:this.selected?.id||null};
  };
  Game.prototype.save=function(show=false){
    try{
      const raw=JSON.stringify(this.snapshot());validate(JSON.parse(raw));
      localStorage.setItem(TEMP,raw);check(localStorage.getItem(TEMP)===raw,'scrittura temporanea');
      const previous=localStorage.getItem(SLOT);
      if(previous){try{validate(JSON.parse(previous));localStorage.setItem(BACKUP,previous)}catch(e){if(e.name==='QuotaExceededError')throw e;}}
      localStorage.setItem(SLOT,raw);localStorage.removeItem(TEMP);this.saveFailed=false;return true;
    }catch(e){this.saveFailed=true;if(show)this.message('Salvataggio non riuscito: spazio locale insufficiente o dati non validi.');return false;}
  };
  Game.prototype.load=function(){
    try{
      let d, recovered=false;
      const current=localStorage.getItem(SLOT),previous=localStorage.getItem(PREVIOUS),older=localStorage.getItem(OLDER),legacy=localStorage.getItem(SAVE_KEY);
      if(!current&&!previous&&!older&&!legacy){this.message('Nessun salvataggio presente.');return false;}
      if(current){try{d=validate(JSON.parse(current))}catch(e){const backup=localStorage.getItem(BACKUP);if(!backup)throw e;d=validate(JSON.parse(backup));recovered=true;}}
      else if(previous){try{d=migrateV4(JSON.parse(previous))}catch(e){const backup=localStorage.getItem(PREVIOUS+'-backup');if(!backup)throw e;d=migrateV4(JSON.parse(backup));recovered=true;}}
      else if(older){try{d=migrateV4(migrateV3(JSON.parse(older)))}catch(e){const backup=localStorage.getItem(OLDER+'-backup');if(!backup)throw e;d=migrateV4(migrateV3(JSON.parse(backup)));recovered=true;}}
      else d=migrate(JSON.parse(legacy));
      // Construct and resolve everything before replacing the running world.
      const world=new World(d.seed),rng=new RNG(d.seed);
      for(const [x,y] of d.roads)world.tile(x,y).road=true;
      world.resources=d.resources.map(o=>Object.assign(new ResourceNode(o.type,o.x,o.y,o.amount),o));
      const buildings=d.buildings.map(o=>Object.assign(new Building(o.type,Math.floor(o.x),Math.floor(o.y),o.owner,o.progress>=1),o));
      if(d.populationRules!==1)for(const b of buildings)if(b.type==='house')b.birthDays=0;
      const units=d.units.map(({occupation,...o})=>Object.assign(new Unit(o.name,o.x,o.y,rng),o));
      const animals=d.animals.map(o=>Object.assign(new Animal(o.type,o.x,o.y,o.owner),o));
      const raiders=d.raiders.map(o=>Object.assign(new Raider(o.x,o.y),o));rng.s=d.rngState;
      const entities=[...units,...buildings,...animals,...raiders,...world.resources],existing=new Set(entities.map(e=>e.id));
      for(const u of units){
        if(u.task?.type==='haul'){
          const t=u.task,source=buildings.find(b=>b.id===t.source&&b.health>0),dest=buildings.find(b=>b.id===t.destination&&b.health>0);
          if(!source||!dest){u.task=null;u.state='idle';u.path=[];}
          else if(t.phase==='destination')check(u.inventory.type===t.good&&u.inventory.amount===t.amount,'carico in viaggio');
          else check(u.inventory.amount===0,'trasporto senza prelievo');
        }else if(u.task?.target&&!existing.has(u.task.target)){u.task=null;u.state='idle';u.path=[];}
      }
      for(const b of buildings){b.assigned=b.assigned.filter(id=>units.some(u=>u.id===id&&u.health>0&&(u.task?.type==='farm'&&u.task.target===b.id||u.task?.after?.type==='farm'&&u.task.after.target===b.id)));b.workers=(b.workers||[]).filter(id=>units.some(u=>u.id===id&&u.health>0&&u.task?.type==='production'&&u.task.target===b.id));}
      const clock=Object.fromEntries(['day','month','year','totalDays','nextRaidDay','raidLevel','dayAccumulator'].map(k=>[k,d.clock[k]]));
      Object.assign(this,{seed:d.seed,world,rng,buildings,units,animals,raiders,gear:d.gear||[],tribalKnowledge:d.tribalKnowledge,...clock,camera:d.camera});
      this.ensureInventories();this.groupSelection=units.filter(u=>u.health>0&&u.location.kind==='world'&&d.selection.includes(u.id));
      this.selected=entities.find(e=>e.id===d.selectedId)||this.groupSelection[0]||units[0]||null;
      for(const u of units)u.selected=this.groupSelection.includes(u);
      this.lastSelectedUnit=this.selected instanceof Unit?this.selected:units[0]||null;
      this.orderMode=null;this.buildMode=null;this.pointerCancel();this.syncModeButtons();this.autosave=0;
      this.gameEnded=d.gameEnded||units.every(u=>u.health<=0)||!buildings.some(b=>b.type==='base'&&b.alive);
      $('#gameOver').classList.toggle('hidden',!this.gameEnded);this.setPaused(true);this.lastFrame=performance.now();this.updateUI();
      this.message(recovered?'Ripristinata la copia precedente. Premi ▶ per riprendere.':current?'Partita caricata in pausa. Premi ▶.':'Salvataggio precedente importato. Originale conservato. Premi ▶.');return true;
    }catch(e){console.warn(e.message);this.message('Salvataggio non valido: la partita attuale è rimasta intatta.');return false;}
  };
  Game.prototype.setPaused=function(paused){this.paused=paused;this.lastFrame=performance.now();$('#pauseBtn').textContent=paused?'▶':'Ⅱ';$('#pauseBtn').setAttribute('aria-label',paused?'Riprendi':'Pausa');this.refreshSessionState();};
  Game.prototype.refreshSessionState=function(){const el=$('#sessionState');if(el)el.textContent=this.suspended?'Sospesa':this.paused?'In pausa · premi ▶ per riprendere':'';const notice=$('#pauseNotice');if(notice)notice.classList.toggle('hidden',!this.paused||this.suspended||this.gameEnded);};
  Game.prototype.suspend=function(){if(this.suspended)return;this.suspended=true;this.pointerCancel();this.orderMode=null;this.buildMode=null;this.syncModeButtons();this.lastFrame=performance.now();this.save(true);this.refreshSessionState();};
  Game.prototype.resumeFromBackground=function(){if(!this.suspended)return;this.suspended=false;this.setPaused(true);this.message('Partita in pausa. Premi ▶ per riprendere.');};
  Game.prototype.installLifecycle=function(){
    $('#resumeGame').onclick=()=>this.setPaused(false);
    document.addEventListener('visibilitychange',()=>document.hidden?this.suspend():this.resumeFromBackground());
    addEventListener('pagehide',()=>this.suspend());addEventListener('pageshow',()=>{if(!document.hidden)this.resumeFromBackground()});
    addEventListener('blur',()=>this.pointerCancel());
  };
  const newGame=Game.prototype.newGame;
  Game.prototype.newGame=function(seed){newGame.call(this,seed);this.autosave=0;this.suspended=!!document.hidden;this.setPaused(false);};
})();
