// 7KAA original PLANTBM bitmap linkage; src/OPLANT.cpp @ 14e6fdfba9481af4dc3a54722614a608776e20bc
// GPL-2.0-or-later. The 4-byte bitmap header is width/height LE; palette mapping is separate.
import {parseNatureDatabase} from './nature-database.mjs';

export function readPlantBitmap(archive, offset) {
  if (!(archive instanceof Uint8Array) || !Number.isSafeInteger(offset) || offset < 0 || offset + 8 > archive.length)
    throw Error('plant bitmap offset outside archive');
  const recordLength = new DataView(archive.buffer, archive.byteOffset + offset, 4).getUint32(0, true);
  if (recordLength < 4 || recordLength > archive.length - offset - 4) throw Error('invalid plant resource record length');
  const start = offset + 4;
  const view = new DataView(archive.buffer, archive.byteOffset + start, 4);
  const width = view.getInt16(0, true), height = view.getInt16(2, true);
  if (width <= 0 || height <= 0 || width > 4096 || height > 4096)
    throw Error('invalid plant bitmap dimensions');
  // Original GPL codec: unavowed/7kaa src/imgfun/IB_TD.cpp and include/COLCODE.h.
  // 0xF8 + count skips count transparent pixels; 0xF9..0xFF skip 7..1.
  // All other bytes are literal palette indices. Preserve transparency as 255.
  const size = width * height;
  if (size > 10_000_000) throw Error('plant bitmap exceeds pixel limit');
  const end = start + recordLength;
  const pixels = new Uint8Array(size).fill(255);
  let source = start + 4, target = 0;
  while (target < size) {
    if (source >= end) throw Error('truncated PLANT compressed bitmap');
    const code = archive[source++];
    if (code < 0xf8) { pixels[target++] = code; continue; }
    let skip;
    if (code === 0xf8) {
      if (source >= end) throw Error('truncated PLANT transparent run');
      skip = archive[source++];
      if (skip <= 0) throw Error('invalid PLANT transparent run');
    } else skip = 256 - code;
    if (skip > size - target) throw Error('PLANT transparent run exceeds bitmap');
    target += skip;
  }
  if (source !== end) throw Error('PLANT bitmap trailing compressed data');
  return {width, height, pixels};
}

export function linkPlantResources(plantDb, bitmapDb, bitmapArchive) {
  const plants = parseNatureDatabase('PLANT', plantDb).records;
  const bitmaps = parseNatureDatabase('PLANTBM', bitmapDb).records;
  const linked = bitmaps.map(rec => ({...rec, bitmap:readPlantBitmap(bitmapArchive,rec.bitmapOffset)}));
  for (const plant of plants) {
    const start = plant.firstBitmap;
    const count = plant.bitmapCountMinusOne + 1; // OPLANT.cpp: 1 + atoi(bitmap_count)
    if (start < 1 || start + count - 1 > linked.length) throw Error('plant bitmap reference out of range: '+plant.code);
    for (let i=start-1;i<start+count-1;i++) {
      if (linked[i].plant !== plant.code) throw Error('plant bitmap code mismatch: '+plant.code);
    }
  }
  return {plants, bitmaps:linked};
}
