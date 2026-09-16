// Terra Italica production PNG asset renderer.
// Single top-down sprite per subject; movement direction is simulated by
// rotating the sprite to the nearest of 8 compass directions.
(() => {
  'use strict';

  if (typeof Game === 'undefined') return;

  const load = src => {
    const img = new Image();
    img.src = src;
    return img;
  };

  const SPRITES = {
    human: load('./assets/p16/units/unit_human_p16.png?v=27'),
    raider: load('./assets/p16/units/unit_raider_p16.png?v=24'),
    sheep: load('./assets/p16/animals/animal_sheep_p16.png?v=24'),
    wolf: load('./assets/p16/animals/animal_wolf_p16.png?v=24'),
    wood: load('./assets/p16/resources/resource_tree_p16.png?v=24'),
    stone: load('./assets/p16/resources/resource_stone_p16.png?v=24'),
    iron: load('./assets/p16/resources/resource_iron_p16.png?v=24'),
    food: load('./assets/p16/resources/resource_berry_p16.png?v=24'),
    house: load('./assets/p16/buildings/building_house_p16.png?v=24'),
    farm: load('./assets/p16/buildings/building_farm_p16.png?v=24'),
    warehouse: load('./assets/p16/buildings/building_warehouse_p16.png?v=24'),
    tower: load('./assets/p16/buildings/building_tower_p16.png?v=24'),
    palisade: load('./assets/p16/buildings/building_palisade_p16.png?v=24')
  };

  window.TERRA_P16_SPRITES = SPRITES;

  const previousPose = new WeakMap();
  const OCTANT = Math.PI / 4;

  function ready(img) {
    return !!(img && img.complete && img.naturalWidth > 0);
  }

  function directionAngle(entity) {
    const prev = previousPose.get(entity);
    let dx = 0, dy = 0;

    if (prev) {
      dx = entity.x - prev.x;
      dy = entity.y - prev.y;
    }

    if (Math.hypot(dx, dy) < 0.001 && Number.isFinite(entity.vx) && Number.isFinite(entity.vy)) {
      dx = entity.vx;
      dy = entity.vy;
    }

    if (Math.hypot(dx, dy) < 0.001 && entity.path && entity.path.length) {
      const n = entity.path[0];
      dx = (n.x ?? entity.x) - entity.x;
      dy = (n.y ?? entity.y) - entity.y;
    }

    if (Math.hypot(dx, dy) < 0.001 && Number.isFinite(entity.tx) && Number.isFinite(entity.ty)) {
      dx = entity.tx - entity.x;
      dy = entity.ty - entity.y;
    }

    let angle = prev?.angle ?? 0;
    if (Math.hypot(dx, dy) >= 0.001) {
      const raw = Math.atan2(dy, dx) - Math.PI / 2;
      angle = Math.round(raw / OCTANT) * OCTANT;
    }

    previousPose.set(entity, {x: entity.x, y: entity.y, angle});
    return angle;
  }

  function drawCentered(ctx, img, x, y, w, h, angle = 0) {
    if (!ready(img)) return false;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }

  const oldDrawResource = Game.prototype.drawResource;
  const oldDrawHuman = Game.prototype.drawHuman;
  const oldDrawAnimal = Game.prototype.drawAnimal;
  const oldDrawBuilding = Game.prototype.drawBuilding;

  Game.prototype.drawResource = function(r) {
    const p = this.worldToScreen(r.x * TILE, r.y * TILE);
    const z = this.camera.zoom;
    const img = SPRITES[r.type];
    const dims = r.type === 'wood' ? [44, 44]
      : (r.type === 'stone' || r.type === 'iron') ? [30, 30]
      : [22, 22];

    if (!drawCentered(this.ctx, img, p.x, p.y, dims[0] * z, dims[1] * z)) {
      return oldDrawResource.call(this, r);
    }
  };

  Game.prototype.drawHuman = function(u, hostile) {
    const p = this.worldToScreen(u.x * TILE, u.y * TILE);
    const z = this.camera.zoom;
    const ctx = this.ctx;
    const img = hostile ? SPRITES.raider : SPRITES.human;
    const dims = hostile ? [28, 32] : [24, 30];

    if (!ready(img)) return oldDrawHuman.call(this, u, hostile);

    ctx.save();
    ctx.fillStyle = '#00000045';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 7 * z, 6 * z, 2.4 * z, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawCentered(ctx, img, p.x, p.y, dims[0] * z, dims[1] * z, directionAngle(u));

    if (!hostile && this.selected?.id === u.id) this.selectionRing(p.x, p.y, 12 * z);
    if ((u.health / u.maxHealth) < .65) {
      ctx.fillStyle = '#171717';
      ctx.fillRect(p.x - 8 * z, p.y - 18 * z, 16 * z, 2 * z);
      ctx.fillStyle = hostile ? '#a94c43' : '#70835d';
      ctx.fillRect(p.x - 8 * z, p.y - 18 * z, 16 * z * (u.health / u.maxHealth), 2 * z);
    }
  };

  Game.prototype.drawAnimal = function(a) {
    const p = this.worldToScreen(a.x * TILE, a.y * TILE);
    const z = this.camera.zoom;
    const img = a.type === 'wolf' ? SPRITES.wolf : SPRITES.sheep;
    const dims = a.type === 'wolf' ? [32, 24] : [30, 22];

    if (!drawCentered(this.ctx, img, p.x, p.y, dims[0] * z, dims[1] * z, directionAngle(a))) {
      return oldDrawAnimal.call(this, a);
    }

    if (this.selected?.id === a.id) this.selectionRing(p.x, p.y, 12 * z);
  };

  Game.prototype.drawBuilding = function(b) {
    const img = SPRITES[b.type];
    if (!b.built || !ready(img)) return oldDrawBuilding.call(this, b);

    const p = this.worldToScreen(b.x * TILE, b.y * TILE);
    const z = this.camera.zoom;
    const dims = {
      house: [64, 66],
      farm: [64, 68],
      warehouse: [68, 62],
      tower: [42, 78],
      palisade: [54, 20]
    }[b.type];

    if (!dims) return oldDrawBuilding.call(this, b);

    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#0000003f';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + (b.type === 'tower' ? 14 : 10) * z,
      Math.max(8, dims[0] * .28) * z,
      Math.max(3, dims[1] * .07) * z,
      0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawCentered(ctx, img, p.x, p.y, dims[0] * z, dims[1] * z);

    if (this.selected?.id === b.id) this.selectionRing(p.x, p.y, Math.max(15, dims[0] * .28) * z);
    if (b.health < b.maxHealth) {
      const ratio = Math.max(0, b.health / b.maxHealth);
      const barW = Math.min(32, dims[0] * .55) * z;
      const barY = p.y - (dims[1] * .5 + 5) * z;
      ctx.fillStyle = '#171717';
      ctx.fillRect(p.x - barW / 2, barY, barW, 3 * z);
      ctx.fillStyle = '#70835d';
      ctx.fillRect(p.x - barW / 2, barY, barW * ratio, 3 * z);
    }
  };
})();
