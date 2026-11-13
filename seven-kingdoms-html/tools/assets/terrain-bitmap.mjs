// Original 7KAA I_TERN1.RES bitmap framing, sampled at terrain SG-028 offset 0x13668.
// Upstream: the3dfxdude/7kaa @ 14e6fdfba9481af4dc3a54722614a608776e20bc.
// Each resource entry begins with uint32 LE payload size; payload starts with
// uint16 LE width and height, followed by indexed pixels. No palette invented.
// This parser deliberately rejects compressed/alternate entries until verified.
export function decodeTerrainBitmap(bytes, offset) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('resource must be Uint8Array');
  if (!Number.isSafeInteger(offset) || offset < 0 || offset + 8 > bytes.length) throw new RangeError('bitmap header outside resource');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const size = view.getUint32(offset, true);
  if (size < 4 || size > bytes.length - offset - 4) throw new RangeError('bitmap payload truncated');
  const width = view.getUint16(offset + 4, true), height = view.getUint16(offset + 6, true);
  if (!width || !height || width * height !== size - 4) throw new Error('unsupported bitmap encoding or dimensions');
  return {offset, width, height, payloadBytes:size, pixels:bytes.slice(offset + 8, offset + 4 + size)};
}
