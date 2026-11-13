// dBASE III framing observed in upstream 7KAA data/RESOURCE/TERRAIN1.RES
// the3dfxdude/7kaa @ 14e6fdfba9481af4dc3a54722614a608776e20bc
// The 26-byte TerrainRec is preceded by one dBASE deletion-marker byte.
// Preserve original record order: 7KAA terrain IDs are 1-based.
import {parseTerrainRec, TERRAIN_REC_BYTES} from './terrain-record.mjs';
const EXPECTED_FIELDS = [
  ['NW_TYPE','C',2],['NE_TYPE','C',2],['SW_TYPE','C',2],['SE_TYPE','C',2],
  ['EXTRA','C',1],['SPECIAL','C',1],['REP_TYPE','C',1],['SEC_TYPE','C',1],
  ['PATTERN_ID','N',2],['FILENAME','C',8],['BITMAPPTR','C',4]
];
const ascii = bytes => String.fromCharCode(...bytes).replace(/\0.*$/, '');
export function parseTerrainDatabase(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 33 || bytes[0] !== 3) throw new Error('expected dBASE III TERRAIN1.RES');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(4,true), headerLength = view.getUint16(8,true), recordLength = view.getUint16(10,true);
  if (recordLength !== TERRAIN_REC_BYTES + 1 || headerLength !== 385 || bytes[headerLength-1] !== 13) throw new Error('unexpected terrain database layout');
  if (count > Math.floor((bytes.length-headerLength)/recordLength)) throw new Error('truncated terrain database');
  const fields=[];
  for(let offset=32;offset<headerLength-1;offset+=32) {
    const name=ascii(bytes.subarray(offset,offset+11));
    fields.push([name,String.fromCharCode(bytes[offset+11]),bytes[offset+16]]);
  }
  if (JSON.stringify(fields)!==JSON.stringify(EXPECTED_FIELDS)) throw new Error('unexpected terrain field schema');
  const records=[];
  for(let i=0;i<count;i++){
    const offset=headerLength+i*recordLength;
    if(bytes[offset]!==32) throw new Error('deleted or invalid terrain row '+(i+1));
    records.push({id:i+1,offset, ...parseTerrainRec(bytes.subarray(offset+1,offset+recordLength))});
  }
  return {recordCount:count,headerLength,recordLength,records};
}
