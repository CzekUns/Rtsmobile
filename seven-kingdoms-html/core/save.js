import { createClock } from './clock.js';
import { createRng } from './rng.js';
import { createIdAllocator } from './ids.js';
import { createEventQueue } from './events.js';
export const SAVE_SCHEMA_VERSION = 2;
const plain = value => JSON.parse(JSON.stringify(value));
const isObject = o => o && typeof o === 'object' && !Array.isArray(o);
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (isObject(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
function serialize(value) {
  const raw = JSON.stringify(value);
  if (raw === undefined) throw new TypeError('non-serializable state');
  const copy = JSON.parse(raw);
  if (JSON.stringify(copy) !== raw) throw new TypeError('non-JSON state');
  return copy;
}
export function createCoreState({ clock, rng, ids, queue, world = {} } = {}) {
  const result = { clock: createClock(clock), rng: createRng(rng?.state ?? 1),
    ids: createIdAllocator(ids), queue: createEventQueue(queue), world: serialize(world) };
  if (!isObject(result.world)) throw new TypeError('world');
  return result;
}
function migrate(envelope) {
  if (!isObject(envelope) || !Number.isSafeInteger(envelope.schemaVersion)) throw new TypeError('invalid save envelope');
  if (envelope.schemaVersion > SAVE_SCHEMA_VERSION) throw new RangeError('unsupported future save version');
  if (envelope.schemaVersion < 1) throw new RangeError('unsupported legacy save version');
  if (envelope.schemaVersion === 1) {
    // v1: state held the world and clock, no queue, rng or ID counters.
    // Existing IDs must be scanned by the integrator before trusting an imported v1 save.
    return { schemaVersion: 2, state: { ...envelope.state, rng: envelope.state?.rng ?? { state: 1 },
      ids: envelope.state?.ids ?? {}, queue: envelope.state?.queue ?? { nextSequence: 0, events: [] } } };
  }
  return envelope;
}
export function encodeSave(state) {
  const envelope = { schemaVersion: SAVE_SCHEMA_VERSION, state: createCoreState(serialize(state)) };
  return JSON.stringify(canonical(envelope));
}
export function decodeSave(input) {
  let parsed;
  try { parsed = typeof input === 'string' ? JSON.parse(input) : serialize(input); }
  catch (cause) { throw new SyntaxError('invalid save JSON', { cause }); }
  const migrated = migrate(parsed);
  return createCoreState(migrated.state);
}
// Recovery never accepts an invalid primary silently: it exposes which candidate worked.
export function recoverSave(primary, backups = []) {
  const candidates = [primary, ...backups];
  const errors = [];
  for (let index = 0; index < candidates.length; index++) {
    try { return { state: decodeSave(candidates[index]), source: index === 0 ? 'primary' : 'backup', index, errors }; }
    catch (error) { errors.push({ index, reason: error.message }); }
  }
  throw new AggregateError(errors.map(e => new Error(e.reason)), 'no valid save candidate');
}
