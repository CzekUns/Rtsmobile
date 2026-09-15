// Experimental RTS mobile modifier: hold the on-screen MOD pad with one finger
// while dragging another finger on the map to draw a PC-style selection box.
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

  const originalPointerDown = Game.prototype.pointerDown;
  const originalPointerMove = Game.prototype.pointerMove;
  const originalPointerUp = Game.prototype.pointerUp;
  const originalDraw = Game.prototype.draw;
  const originalDrawHuman = Game.prototype.drawHuman;
  const originalHandleTap = Game.prototype.handleTap;

  Game.prototype.pointerDown = function(e) {
    if (!modifierHeld || this.modifierBoxSelect?.active || this.pointer.size > 0) {
      return originalPointerDown.call(this, e);
    }

    this.canvas.setPointerCapture(e.pointerId);
    const r = this.canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    this.modifierBoxSelect = {
      pointerId: e.pointerId,
      startX: x,
      startY: y,
      x,
      y,
      active: true
    };
    this.dragging = false;
    e.preventDefault();
  };

  Game.prototype.pointerMove = function(e) {
    const box = this.modifierBoxSelect;
    if (box?.active && box.pointerId === e.pointerId) {
      const r = this.canvas.getBoundingClientRect();
      box.x = e.clientX - r.left;
      box.y = e.clientY - r.top;
      e.preventDefault();
      return;
    }
    return originalPointerMove.call(this, e);
  };

  Game.prototype.pointerUp = function(e) {
    const box = this.modifierBoxSelect;
    if (box?.active && box.pointerId === e.pointerId) {
      const r = this.canvas.getBoundingClientRect();
      box.x = e.clientX - r.left;
      box.y = e.clientY - r.top;

      const left = Math.min(box.startX, box.x);
      const right = Math.max(box.startX, box.x);
      const top = Math.min(box.startY, box.y);
      const bottom = Math.max(box.startY, box.y);

      const selected = this.units.filter(u => {
        if (u.health <= 0) return false;
        const p = this.worldToScreen(u.x * TILE, u.y * TILE);
        return p.x >= left && p.x <= right && p.y >= top && p.y <= bottom;
      });

      this.groupSelection = selected;
      for (const u of this.units) u.selected = selected.includes(u);
      this.selected = selected[0] || null;
      if (selected[0]) this.lastSelectedUnit = selected[0];
      this.modifierBoxSelect = null;
      this.dragging = false;
      this.updateUI();
      this.message(selected.length
        ? `${selected.length} abitanti selezionati.`
        : 'Nessun abitante nel riquadro.');
      e.preventDefault();
      return;
    }
    return originalPointerUp.call(this, e);
  };

  Game.prototype.handleTap = function(...args) {
    if (this.groupSelection?.length) {
      this.groupSelection = [];
      for (const u of this.units) u.selected = false;
    }
    return originalHandleTap.apply(this, args);
  };

  Game.prototype.drawHuman = function(u, hostile) {
    originalDrawHuman.call(this, u, hostile);
    if (hostile || !this.groupSelection?.length) return;
    if (this.selected?.id === u.id) return;
    if (!this.groupSelection.some(x => x.id === u.id)) return;
    const p = this.worldToScreen(u.x * TILE, u.y * TILE);
    this.selectionRing(p.x, p.y, 11 * this.camera.zoom);
  };

  Game.prototype.draw = function() {
    originalDraw.call(this);
    const box = this.modifierBoxSelect;
    if (!box?.active) return;

    const ctx = this.ctx;
    const x = Math.min(box.startX, box.x);
    const y = Math.min(box.startY, box.y);
    const w = Math.abs(box.x - box.startX);
    const h = Math.abs(box.y - box.startY);

    ctx.save();
    ctx.fillStyle = 'rgba(209,182,109,.12)';
    ctx.strokeStyle = '#d1b66d';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6,4]);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  };
})();
