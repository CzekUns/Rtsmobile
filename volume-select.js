// Experimental mobile RTS input: hold Volume Up + drag to box-select villagers.
// On some Android browsers hardware volume keys are consumed by the OS and no
// KeyboardEvent reaches the page. This file intentionally tests that boundary.
(() => {
  'use strict';

  const isVolumeUp = e =>
    e.key === 'AudioVolumeUp' ||
    e.key === 'VolumeUp' ||
    e.code === 'AudioVolumeUp' ||
    e.code === 'VolumeUp' ||
    e.keyCode === 183;

  let volumeUpHeld = false;

  addEventListener('keydown', e => {
    if (!isVolumeUp(e)) return;
    volumeUpHeld = true;
    e.preventDefault();
  }, {capture:true});

  addEventListener('keyup', e => {
    if (!isVolumeUp(e)) return;
    volumeUpHeld = false;
    e.preventDefault();
  }, {capture:true});

  addEventListener('blur', () => { volumeUpHeld = false; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) volumeUpHeld = false;
  });

  if (typeof Game === 'undefined') return;

  const originalPointerDown = Game.prototype.pointerDown;
  const originalPointerMove = Game.prototype.pointerMove;
  const originalPointerUp = Game.prototype.pointerUp;
  const originalDraw = Game.prototype.draw;
  const originalDrawHuman = Game.prototype.drawHuman;

  Game.prototype.pointerDown = function(e) {
    if (!volumeUpHeld || this.pointer.size > 0) {
      return originalPointerDown.call(this, e);
    }

    this.canvas.setPointerCapture(e.pointerId);
    const r = this.canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    this.volumeBoxSelect = {
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
    const box = this.volumeBoxSelect;
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
    const box = this.volumeBoxSelect;
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
      this.volumeBoxSelect = null;
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
    const box = this.volumeBoxSelect;
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
