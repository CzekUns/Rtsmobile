// Pure integer-tick simulation clock. Wall time belongs to the host adapter.
export const DEFAULT_TICKS_PER_DAY = 24;
const integer = (n, label, min = 0) => { if (!Number.isSafeInteger(n) || n < min) throw new RangeError(label); return n; };
export function createClock({ ticksPerDay = DEFAULT_TICKS_PER_DAY, tick = 0, speed = 1, paused = false } = {}) {
  integer(ticksPerDay, 'ticksPerDay', 1); integer(tick, 'tick'); integer(speed, 'speed', 1);
  return { tick, ticksPerDay, speed, paused: Boolean(paused) };
}
export function stepClock(state, delta = 1) {
  integer(delta, 'delta');
  const clock = createClock(state);
  const elapsed = clock.paused ? 0 : delta * clock.speed;
  integer(elapsed, 'elapsed');
  const tick = clock.tick + elapsed;
  integer(tick, 'tick');
  return { ...clock, tick };
}
export function setPaused(state, paused) { return { ...createClock(state), paused: Boolean(paused) }; }
export function setSpeed(state, speed) { integer(speed, 'speed', 1); return { ...createClock(state), speed }; }
export function getGameDay(state) { return Math.floor(createClock(state).tick / state.ticksPerDay); }
// A bounded host-frame accumulator; does not mutate simulation time on paused frames.
// deltaMs is integer microseconds to avoid FPS-dependent floating point accumulation.
export function createFrameAccumulator({ remainderUs = 0, tickUs = 100000, maxFrameUs = 250000 } = {}) {
  integer(tickUs, 'tickUs', 1); integer(maxFrameUs, 'maxFrameUs', 1); integer(remainderUs, 'remainderUs');
  if (remainderUs >= tickUs) throw new RangeError('remainderUs');
  return { remainderUs, tickUs, maxFrameUs };
}
export function accumulateFrame(accumulator, deltaUs, paused = false) {
  const a = createFrameAccumulator(accumulator);
  integer(deltaUs, 'deltaUs');
  if (paused) return { accumulator: a, ticks: 0 };
  const us = a.remainderUs + Math.min(deltaUs, a.maxFrameUs);
  return { accumulator: { ...a, remainderUs: us % a.tickUs }, ticks: Math.floor(us / a.tickUs) };
}
