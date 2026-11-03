// Portable unsigned 32-bit PRNG; NOT the C++ 7KAA RNG (parity pending).
const uint32 = (value) => { if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) throw new RangeError('rng state'); return value >>> 0; };
export function createRng(seed = 1) { return { state: uint32(seed) }; }
export function nextRandom(rng) {
  const state = (Math.imul(1664525, uint32(rng.state)) + 1013904223) >>> 0;
  return { rng: { state }, value: state };
}
export function randomInt(rng, exclusiveMax) {
  if (!Number.isSafeInteger(exclusiveMax) || exclusiveMax < 1 || exclusiveMax > 0x100000000) throw new RangeError('exclusiveMax');
  // Reject tail to avoid modulo bias.
  const limit = Math.floor(0x100000000 / exclusiveMax) * exclusiveMax;
  let current = rng, draw;
  do { const step = nextRandom(current); current = step.rng; draw = step.value; } while (draw >= limit);
  return { rng: current, value: draw % exclusiveMax };
}
