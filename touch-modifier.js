// RTS mobile input grammar
// Free finger = left mouse button. Hold MOD = right mouse button / secondary layer.
(() => {
  'use strict';

  const modifier = document.getElementById('touchModifier');
  if (!modifier || typeof Game === 'undefined') return;

  let modifierPointerId = null;
  let modifierHeld = false;

  const setModifier = active => {
    modifierHeld = active;
    modifier.classList.toggle('active', active);
    modifier.setAttribute('aria-pressed', active ? 'true' : 'false');
  };

  modifier.addEventListener('pointerdown', e => {
    if (modifierPointerId !== null) return;
    modifierPointerId = e.pointerId;
    modifier.setPointerCapture?.(e.pointerId);
    setModifier(true);
    e.preventDefault();
    e.stopPropagation();
  });

  const releaseModifier = e => {
    if (modifierPointerId !== null && e.pointerId !== modifierPointerId) return;
    modifierPointerId = null;
    setModifier(false);
    e.preventDefault();
    e.stopPropagation();
  };

  modifier.addEventListener('pointerup', releaseModifier);
  modifier.addEventListener('pointercancel', releaseModifier);
  modifier.addEventListener('lostpointercapture', () => {
    modifierPointerId = null;
    setModifier(false);
  });
  addEventListener('blur', () => {
    modifierPointerId = null;
    setModifier(false);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      modifierPointerId = null;
      setModifier(false);
    }
  });

  const originalDraw = Game.prototype.draw;
  const originalDrawHuman = Game.prototype.drawHuman;

  const clearUnitSelection = game => {
    game.groupSelection = [];
    for (const u of game.units) u.selected = false;
  };

  const selectUnits = (game, units) => {
    const alive = units.filter(u => u.health > 0 && u.owner === 0);
    clearUnitSelection(game);
    game.groupSelection = alive;
    for (const u of alive) u.selected = true;
    game.selected = alive[0] || null;
    if (alive[0]) game.lastSelectedUnit = alive[0];
    game.updateUI();
  };

  const selectedUnits = game => {
    const group = game.selected instanceof Unit ? (game.groupSelection || []).filter(u => u.owner === 0 && u.health > 0 && u.location.kind === 'world' && game.units.includes(u)) : [];
    if (group.length) return group;
    return game.selected instanceof Unit && game.selected.owner === 0 && game.selected.health > 0 ? [game.selected] : [];
  };

  Game.prototype.rtsSelectedUnits = function() { return selectedUnits(this); };

  const localPoint = (game, e) => {
    const r = game.canvas.getBoundingClientRect();
    return {x:e.clientX-r.left, y:e.clientY-r.top};
  };

  Game.prototype.rtsLeftTap = function(sx, sy) {
    const w = this.screenToWorld(sx, sy);
    const tx = Math.floor(w.x / TILE), ty = Math.floor(w.y / TILE);
    if (tx < 0 || ty < 0 || tx >= this.world.size || ty >= this.world.size) return;

    // Building placement remains a deliberate tool action.
    if (this.buildMode) {
      this.placeBuild(this.buildMode, tx, ty);
      return;
    }

    const pos = {x:w.x/TILE, y:w.y/TILE};
    if (this.orderMode) {
      const group = selectedUnits(this);
      if (!group.length) { this.message('Seleziona prima uno o più abitanti.'); return; }
      const order = this.orderMode;
      for (const u of group) this.applyOrder(order, pos, tx, ty, u);
      return;
    }
    const entity = this.pickEntity(pos);
    clearUnitSelection(this);

    if (entity) {
      this.selected = entity;
      if (entity instanceof Unit && entity.owner === 0) {
        entity.selected = true;
        this.groupSelection = [entity];
        this.lastSelectedUnit = entity;
      }
    } else {
      this.selected = null;
    }
    this.orderMode = null;
    this.syncModeButtons();
    this.updateUI();
  };

  Game.prototype.rtsContextTap = function(sx, sy) {
    const group = selectedUnits(this);
    if (!group.length) {
      this.message('Seleziona prima uno o più abitanti.');
      return;
    }

    const w = this.screenToWorld(sx, sy);
    const tx = Math.floor(w.x / TILE), ty = Math.floor(w.y / TILE);
    if (tx < 0 || ty < 0 || tx >= this.world.size || ty >= this.world.size) return;
    const pos = {x:w.x/TILE, y:w.y/TILE};
    const entity = this.pickEntity(pos);

    if (entity instanceof ResourceNode) {
      for (const u of group) this.assignGather(u, entity);
      this.message(`${group.length} abitanti: raccolta ${this.resourceName(entity.type)}.`);
    } else if (entity instanceof Raider || (entity instanceof Animal && entity.type === 'wolf')) {
      for (const u of group) this.assignAttack(u, entity);
      this.message(`${group.length} abitanti attaccano la minaccia.`);
    } else if (entity instanceof Animal && entity.type === 'sheep' && entity.owner === -1) {
      for (const u of group) this.assignTame(u, entity);
      this.message(`${group.length} abitanti tentano la domesticazione.`);
    } else if (entity instanceof Building && entity.type === 'farm' && entity.built) {
      for (const u of group) this.assignFarm(u, entity);
      this.message(`${group.length} abitanti assegnati al campo.`);
    } else if (entity instanceof Building && !entity.built) {
      for (const u of group) this.assignBuild(u, entity);
      this.message(`${group.length} abitanti assegnati al cantiere.`);
    } else {
      for (const u of group) this.assignMove(u, tx, ty);
      this.message(`${group.length} abitanti si spostano.`);
    }

    this.orderMode = null;
    this.syncModeButtons();
    this.updateUI();
  };

  Game.prototype.rtsFinishBoxSelection = function(box) {
    const left = Math.min(box.startX, box.x);
    const right = Math.max(box.startX, box.x);
    const top = Math.min(box.startY, box.y);
    const bottom = Math.max(box.startY, box.y);
    const units = this.units.filter(u => {
      if (u.health <= 0 || u.location.kind !== 'world') return false;
      const p = this.worldToScreen(u.x*TILE, u.y*TILE);
      return p.x >= left && p.x <= right && p.y >= top && p.y <= bottom;
    });
    selectUnits(this, units);
    this.message(units.length ? `${units.length} abitanti selezionati.` : 'Nessun abitante nel riquadro.');
  };

  // Full replacement of the canvas pointer grammar:
  // free tap = select; free drag = box-select; MOD tap = context command;
  // MOD drag = camera pan; two free fingers = pinch zoom.
  Game.prototype.pointerDown = function(e) {
    this.canvas.setPointerCapture(e.pointerId);
    this.rtsPointers ||= new Map();
    const p = localPoint(this, e);
    this.rtsPointers.set(e.pointerId, {
      id:e.pointerId,
      x:e.clientX, y:e.clientY,
      localX:p.x, localY:p.y,
      startX:e.clientX, startY:e.clientY,
      startLocalX:p.x, startLocalY:p.y,
      startWorld:this.screenToWorld(p.x,p.y),
      lastX:e.clientX, lastY:e.clientY
    });

    if (!modifierHeld && this.rtsPointers.size === 2) {
      const pts = [...this.rtsPointers.values()];
      this.rtsGesture = {
        type:'pinch',
        prevDist:Math.hypot(pts[0].x-pts[1].x, pts[0].y-pts[1].y)
      };
      this.rtsSelectionBox = null;
      e.preventDefault();
      return;
    }

    if (this.rtsPointers.size > 1) {
      e.preventDefault();
      return;
    }

    this.rtsGesture = {
      type: modifierHeld ? 'modCandidate' : 'leftCandidate',
      pointerId:e.pointerId
    };
    this.rtsSelectionBox = null;
    e.preventDefault();
  };

  Game.prototype.pointerMove = function(e) {
    if (!this.rtsPointers?.has(e.pointerId)) return;
    const p = this.rtsPointers.get(e.pointerId);
    const lp = localPoint(this, e);
    p.x=e.clientX; p.y=e.clientY; p.localX=lp.x; p.localY=lp.y;

    if (!modifierHeld && this.rtsPointers.size === 2) {
      const pts=[...this.rtsPointers.values()];
      const d=Math.hypot(pts[0].x-pts[1].x, pts[0].y-pts[1].y);
      if (this.rtsGesture?.type !== 'pinch') this.rtsGesture={type:'pinch',prevDist:d};
      const prev=this.rtsGesture.prevDist || d;
      if (Math.abs(d-prev)>1) this.camera.zoom=clamp(this.camera.zoom*(d/prev),.48,2.3);
      this.rtsGesture.prevDist=d;
      p.lastX=e.clientX; p.lastY=e.clientY;
      e.preventDefault();
      return;
    }

    const g=this.rtsGesture;
    if (!g || g.pointerId !== e.pointerId) return;
    const moved=Math.hypot(e.clientX-p.startX, e.clientY-p.startY);

    if (g.type === 'leftCandidate' && moved > 7) {
      g.type='leftBox';
      this.rtsSelectionBox={
        startX:p.startLocalX,startY:p.startLocalY,
        startWorld:p.startWorld,
        x:lp.x,y:lp.y,active:true
      };
    } else if (g.type === 'leftBox') {
      this.rtsSelectionBox.x=lp.x;
      this.rtsSelectionBox.y=lp.y;
    } else if (g.type === 'modCandidate' && moved > 7) {
      g.type='modPan';
    }

    if (g.type === 'modPan') {
      const dx=e.clientX-p.lastX, dy=e.clientY-p.lastY;
      this.camera.x-=dx/this.camera.zoom;
      this.camera.y-=dy/this.camera.zoom;
    }

    p.lastX=e.clientX; p.lastY=e.clientY;
    e.preventDefault();
  };

  Game.prototype.pointerUp = function(e) {
    const p=this.rtsPointers?.get(e.pointerId);
    if (!p) return;
    const lp=localPoint(this,e);
    p.x=e.clientX;p.y=e.clientY;p.localX=lp.x;p.localY=lp.y;
    const g=this.rtsGesture;

    this.rtsPointers.delete(e.pointerId);

    if (g?.type === 'pinch') {
      if (this.rtsPointers.size < 2) this.rtsGesture=null;
      e.preventDefault();
      return;
    }

    if (g?.pointerId === e.pointerId) {
      if (g.type === 'leftBox' && this.rtsSelectionBox) {
        this.rtsSelectionBox.x=lp.x;
        this.rtsSelectionBox.y=lp.y;
        this.rtsSyncSelectionBox();
        this.rtsFinishBoxSelection(this.rtsSelectionBox);
      } else if (g.type === 'leftCandidate') {
        this.rtsLeftTap(lp.x,lp.y);
      } else if (g.type === 'modCandidate') {
        this.rtsContextTap(lp.x,lp.y);
      }
    }

    this.rtsSelectionBox=null;
    this.rtsGesture=null;
    e.preventDefault();
  };

  // Keep the selection anchored to the terrain while the camera moves.
  Game.prototype.rtsSyncSelectionBox = function() {
    const box=this.rtsSelectionBox;
    if (!box?.startWorld) return;
    const start=this.worldToScreen(box.startWorld.x,box.startWorld.y);
    box.startX=start.x; box.startY=start.y;
    box.x=clamp(box.x,0,this.viewW); box.y=clamp(box.y,0,this.viewH);
  };

  Game.prototype.rtsScrollSelection = function(dt) {
    const box=this.rtsSelectionBox,gesture=this.rtsGesture;
    if (!box?.active || gesture?.type!=='leftBox' || this.rtsPointers?.size!==1 || modifierHeld || this.suspended || this.gameEnded) return;
    const pointer=this.rtsPointers.get(gesture.pointerId);
    if (!pointer) return;
    // A small edge zone also works on phones where a finger cannot leave the screen.
    const edge=Math.min(24,this.viewW/4,this.viewH/4);
    const x=pointer.localX,y=pointer.localY;
    const vx=x<edge?-clamp((edge-x)/edge,0,1):x>this.viewW-edge?clamp((x-this.viewW+edge)/edge,0,1):0;
    const vy=y<edge?-clamp((edge-y)/edge,0,1):0;
    const step=300*clamp(dt,0,.05)/this.camera.zoom;
    const extent=this.world.size*TILE;
    const halfW=Math.min(extent/2,this.viewW/(2*this.camera.zoom));
    const halfH=Math.min(extent/2,this.viewH/(2*this.camera.zoom));
    if(vx)this.camera.x=clamp(this.camera.x+vx*step,halfW,extent-halfW);
    if(vy)this.camera.y=clamp(this.camera.y+vy*step,halfH,extent-halfH);
    box.x=x;box.y=y;
    this.rtsSyncSelectionBox();
  };

  const originalLoop=Game.prototype.loop;
  Game.prototype.loop=function(now) {
    this.rtsScrollSelection((now-this.lastFrame)/1000||0);
    originalLoop.call(this,now);
  };

  Game.prototype.drawHuman = function(u, hostile) {
    originalDrawHuman.call(this, u, hostile);
    if (hostile || !this.groupSelection?.length) return;
    if (this.selected?.id === u.id) return;
    if (!this.groupSelection.some(x => x.id === u.id)) return;
    const p=this.worldToScreen(u.x*TILE,u.y*TILE);
    this.selectionRing(p.x,p.y,11*this.camera.zoom);
  };

  Game.prototype.draw = function() {
    originalDraw.call(this);
    const box=this.rtsSelectionBox;
    if (!box?.active) return;
    const ctx=this.ctx;
    const x=Math.min(box.startX,box.x), y=Math.min(box.startY,box.y);
    const w=Math.abs(box.x-box.startX), h=Math.abs(box.y-box.startY);
    ctx.save();
    ctx.fillStyle='rgba(209,182,109,.12)';
    ctx.strokeStyle='#d1b66d';
    ctx.lineWidth=1.5;
    ctx.setLineDash([6,4]);
    ctx.fillRect(x,y,w,h);
    ctx.strokeRect(x,y,w,h);
    ctx.restore();
  };
})();
