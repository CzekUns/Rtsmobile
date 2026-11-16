/* Stable painter order for map objects. Visual-only; no simulation mutation. */
export function worldPainterOrder(towns = [], sites = [], firms = [], units = []) {
  const entries = [];
  let sequence = 0;
  const add = (items, kind, depth) => {
    for (const item of items || []) {
      if (!item || !Number.isFinite(item.x) || !Number.isFinite(item.y)) continue;
      entries.push({kind, item, depth: depth(item), sequence: sequence++});
    }
  };
  add(towns, 'town', o => o.y + (Number.isFinite(o.size) ? o.size : 1));
  add(sites, 'site', o => o.y + (Number.isFinite(o.size) ? o.size : 1));
  add(firms, 'firm', o => o.y + (Number.isFinite(o.size) ? o.size : 1));
  add(units, 'unit', o => o.y);
  return entries.sort((a,b) => a.depth-b.depth || a.sequence-b.sequence);
}

/**
 * Merge authentic vegetation/rock overlays into the same depth queue as
 * world objects. Stable tie order: landscape first, then original object
 * sequence, so an entity at the same baseline is never hidden by an overlay.
 * Zoom affects pixels, not the world-space painter order.
 */
export function landscapePainterOrder(landscape = [], objects = []) {
  const entries = [];
  let sequence = 0;
  for (const overlay of landscape) {
    if (!overlay || !['plant','rock'].includes(overlay.kind) ||
        !Number.isFinite(overlay.x) || !Number.isFinite(overlay.y)) continue;
    entries.push({...overlay, depth: overlay.y + 1, sequence: sequence++});
  }
  for (const object of objects) {
    if (!object || !Number.isFinite(object.depth)) continue;
    entries.push({...object, sequence: sequence++});
  }
  return entries.sort((a,b) => a.depth-b.depth || a.sequence-b.sequence);
}
