// Stable order: due tick, then priority (lower first), then insertion sequence.
const validInt = n => Number.isSafeInteger(n) && n >= 0;
export function createEventQueue({ nextSequence = 0, events = [] } = {}) {
  if (!validInt(nextSequence) || !Array.isArray(events)) throw new TypeError('queue');
  const seen = new Set();
  for (const event of events) {
    if (!event || !validInt(event.atTick) || !validInt(event.priority) || !validInt(event.sequence) ||
        !Number.isSafeInteger(event.id) || event.id < 0 || typeof event.type !== 'string' ||
        event.type.length === 0 || seen.has(event.sequence) || event.sequence >= nextSequence) throw new TypeError('event');
    seen.add(event.sequence);
  }
  return { nextSequence, events: events.map(e => ({ ...e })).sort(compareEvents) };
}
export function compareEvents(a, b) {
  return a.atTick - b.atTick || a.priority - b.priority || a.sequence - b.sequence;
}
export function enqueueEvent(queue, { atTick, priority = 0, type, payload = null }) {
  const q = createEventQueue(queue);
  if (!validInt(atTick) || !validInt(priority) || typeof type !== 'string' || !type) throw new TypeError('event');
  const sequence = q.nextSequence;
  if (!Number.isSafeInteger(sequence + 1)) throw new RangeError('sequence overflow');
  const event = { id: sequence, sequence, atTick, priority, type, payload: structuredClonePlain(payload) };
  return { queue: createEventQueue({ nextSequence: sequence + 1, events: [...q.events, event] }), event };
}
function structuredClonePlain(value) { return JSON.parse(JSON.stringify(value)); }
export function drainEvents(queue, throughTick) {
  if (!validInt(throughTick)) throw new RangeError('throughTick');
  const q = createEventQueue(queue);
  const split = q.events.findIndex(e => e.atTick > throughTick);
  const n = split < 0 ? q.events.length : split;
  return { queue: { ...q, events: q.events.slice(n) }, ready: q.events.slice(0, n) };
}
export function cancelEvent(queue, id) {
  if (!validInt(id)) throw new RangeError('id');
  const q = createEventQueue(queue);
  return { ...q, events: q.events.filter(e => e.id !== id) };
}
