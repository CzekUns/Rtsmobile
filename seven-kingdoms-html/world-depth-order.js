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
