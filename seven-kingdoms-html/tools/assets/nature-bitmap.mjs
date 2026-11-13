// 7KAA original PLANTBM bitmap linkage; src/OPLANT.cpp @ 14e6fdfba9481af4dc3a54722614a608776e20bc
// GPL-2.0-or-later. The 4-byte bitmap header is width/height LE; palette mapping is separate.
import {parseNatureDatabase} from './nature-database.mjs';

export function readPlantBitmap(archive, offset) {
  if (!(archive instanceof Uint8Array) || !Number.isSafeInteger(offset) || offset < 0 || offset + 4 > archive.length)
    throw Error('plant bitmap offset outside archive');
  const view = new DataView(archive.buffer, archive.byteOffset + offset, 4);
  const width = view.getInt16(0, true), height = view.getInt16(2, true);
  if (width <= 0 || height <= 0 || width > 4096 || height > 4096)
    throw Error('invalid plant bitmap dimensions');
  const size = width * height;
  if (offset + 4 + size > archive.length) throw Error('truncated plant bitmap pixels');
  return {width, height, pixels:archive.subarray(offset+4, offset+4+size)};
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
