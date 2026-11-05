export const ENTITY_KINDS = Object.freeze(['unit', 'kingdom', 'town', 'building']);
export function createIdAllocator(counters = {}) {
  if (counters === null || typeof counters !== 'object' || Array.isArray(counters)) throw new TypeError('counters');
  for (const kind of Object.keys(counters)) if (!ENTITY_KINDS.includes(kind)) throw new RangeError('kind');
  return Object.fromEntries(ENTITY_KINDS.map(kind => {
    const n = counters[kind] ?? 0;
    if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('counter');
    return [kind, n];
  }));
}
export function allocateId(allocator, kind) {
  if (!ENTITY_KINDS.includes(kind)) throw new RangeError('kind');
  const current = createIdAllocator(allocator), counter = current[kind] + 1;
  if (!Number.isSafeInteger(counter)) throw new RangeError('counter overflow');
  return { allocator: { ...current, [kind]: counter }, id: kind + ':' + counter };
}
