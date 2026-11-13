// Verified against the3dfxdude/7kaa at 14e6fdfba9481af4dc3a54722614a608776e20bc
// include/OTERRAIN.h TerrainRec and src/OTERRAIN.cpp TerrainRes::terrain_code/mask/scan.
// This parses fixed-width TerrainRec payloads; .RES database framing is NOT decoded here.
export const TERRAIN_REC_BYTES = 26;
export const TERRAIN_TYPES = Object.freeze({S: 1, G: 2, F: 3, D: 4});
export const SUBTERRAIN_MASKS = Object.freeze({'-': 1, '0': 2, '+': 4, B: 3, A: 6, '*': 7});
const decode = (bytes) => String.fromCharCode(...bytes).trimEnd();
const codePair = (bytes) => {
  const type = String.fromCharCode(bytes[0]), subtype = String.fromCharCode(bytes[1]);
  if (!(type in TERRAIN_TYPES) || !(subtype in SUBTERRAIN_MASKS)) throw new Error('invalid terrain corner code');
  return {type: TERRAIN_TYPES[type], mask: SUBTERRAIN_MASKS[subtype], code: type + subtype};
};
export function parseTerrainRec(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== TERRAIN_REC_BYTES) throw new RangeError('TerrainRec must be exactly 26 bytes');
  const corners = {
    nw: codePair(bytes.subarray(0, 2)),
    ne: codePair(bytes.subarray(2, 4)),
    sw: codePair(bytes.subarray(4, 6)),
    se: codePair(bytes.subarray(6, 8))
  };
  const average = String.fromCharCode(bytes[10]), secondary = String.fromCharCode(bytes[11]);
  if (!(average in TERRAIN_TYPES) || !(secondary in TERRAIN_TYPES)) throw new Error('invalid representative terrain type');
  const pattern = decode(bytes.subarray(12, 14));
  if (pattern && !/^\d+$/.test(pattern)) throw new Error('invalid terrain pattern');
  return {
    corners, extraFlag: String.fromCharCode(bytes[8]), specialFlag: String.fromCharCode(bytes[9]),
    averageType: TERRAIN_TYPES[average], secondaryType: TERRAIN_TYPES[secondary],
    patternId: Number(pattern || 0), fileName: decode(bytes.subarray(14, 22)),
    bitmapOffset: (bytes[22] | bytes[23] << 8 | bytes[24] << 16 | bytes[25] << 24) >>> 0,
    isCoast: (average === 'S') !== (secondary === 'S')
  };
}
// Mirrors the four-corner AND-mask and exact special_flag matching in TerrainRes::scan.
// Upstream load_info normalizes a blank special flag to 0. Deterministic first match only.
// Actual alternatives and special flags must be resolved from original indexed database records.
export function firstMatchingTerrain(records, corners, special = 0) {
  if (!Array.isArray(records) || !Array.isArray(corners) || corners.length !== 4) return null;
  const names = ['nw', 'ne', 'sw', 'se'];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (!record?.corners || ((record.specialFlag === ' ' ? 0 : record.specialFlag.charCodeAt(0)) !== special)) continue;
    if (names.every((name, n) => record.corners[name].type === corners[n]?.type &&
      (record.corners[name].mask & corners[n]?.mask) !== 0)) return {terrainId: i + 1, record};
  }
  return null;
}
