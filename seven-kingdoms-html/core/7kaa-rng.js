// Formula-level port of src/OMISC.cpp at 7kaa commit 14e6fdfba9481af4dc3a54722614a608776e20bc.
export const SEVEN_KAA_RANDOM_MAX = 32767;
const int32 = n => Number.isInteger(n) && n >= -2147483648 && n <= 2147483647;
export function create7kaaRng(seed = 1) {
  if (!int32(seed)) throw new RangeError('seed must be signed int32');
  return { seed };
}
export function next7kaaRand(rng) {
  if (!rng || !int32(rng.seed)) throw new TypeError('invalid 7kaa RNG');
  const seed = (Math.imul(0x015a4e35, rng.seed) + 1) | 0;
  return { rng: { seed }, value: (seed >> 16) & 0x7fff };
}
export function next7kaaRandom(rng, maxNum) {
  if (!Number.isInteger(maxNum) || maxNum < 0 || maxNum > SEVEN_KAA_RANDOM_MAX)
    throw new RangeError('maxNum must be 0..32767');
  const result = next7kaaRand(rng);
  // The original scales the 15-bit draw; NOT modulo reduction.
  return { rng: result.rng, value: Math.floor(maxNum * result.value / 32768) };
}
