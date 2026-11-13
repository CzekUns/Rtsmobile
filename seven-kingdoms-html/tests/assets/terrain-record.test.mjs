import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTerrainRec, firstMatchingTerrain, TERRAIN_REC_BYTES} from '../../tools/assets/terrain-record.mjs';
function fixture(codes, average='S', secondary='G') {
  const b = new Uint8Array(TERRAIN_REC_BYTES).fill(32);
  for (let i=0;i<4;i++) { b[i*2] = codes[i].charCodeAt(0); b[i*2+1] = codes[i].charCodeAt(1); }
  b[10]=average.charCodeAt(0); b[11]=secondary.charCodeAt(0);
  b[12]=48; b[13]=49;
  b.set(new TextEncoder().encode('COAST001'),14);
  b.set([0x78,0x56,0x34,0x12],22);
  return b;
}
test('TerrainRec layout follows upstream NW NE SW SE and 26 byte fixed record',()=>{
  const r=parseTerrainRec(fixture(['S0','G+','S-','G*']));
  assert.deepEqual(Object.keys(r.corners),['nw','ne','sw','se']);
  assert.equal(r.corners.ne.mask,4); assert.equal(r.corners.se.mask,7);
  assert.equal(r.patternId,1); assert.equal(r.bitmapOffset,0x12345678);
  assert.equal(r.fileName,'COAST001'); assert.equal(r.isCoast,true);
});
test('coast classification uses representative and secondary type, not corner count',()=>{
  assert.equal(parseTerrainRec(fixture(['S0','S0','G0','G0'],'G','S')).isCoast,true);
  assert.equal(parseTerrainRec(fixture(['S0','S0','G0','G0'],'G','F')).isCoast,false);
});
test('scan uses four corners and bitmask intersections, returns 1-based first match',()=>{
  const a=parseTerrainRec(fixture(['S*','S*','G*','G*']));
  const b=parseTerrainRec(fixture(['G*','S*','G*','S*']));
  assert.equal(firstMatchingTerrain([a,b],[{type:2,mask:2},{type:1,mask:2},{type:2,mask:2},{type:1,mask:2}]).terrainId,2);
  assert.equal(firstMatchingTerrain([a],[{type:1,mask:2},{type:1,mask:2},{type:2,mask:2},{type:2,mask:2}]).terrainId,1);
  assert.equal(firstMatchingTerrain([a],[{type:1,mask:2},{type:1,mask:2},{type:1,mask:2},{type:2,mask:2}]),null);
});
test('invalid sizes and unknown codes fail closed',()=>{
  assert.throws(()=>parseTerrainRec(new Uint8Array(25)),RangeError);
  assert.throws(()=>parseTerrainRec(fixture(['X0','S0','G0','G0'])),/corner/);
});

test('upstream scan requires exact special flag; blank maps only to zero',()=>{
  const normal=parseTerrainRec(fixture(['S*','G*','S*','G*']));
  const special=parseTerrainRec(fixture(['S*','G*','S*','G*']));
  special.specialFlag='X';
  const corners=[{type:1,mask:2},{type:2,mask:2},{type:1,mask:2},{type:2,mask:2}];
  assert.equal(firstMatchingTerrain([normal,special],corners,0)?.terrainId,1);
  assert.equal(firstMatchingTerrain([normal,special],corners,'X'.charCodeAt(0))?.terrainId,2);
  assert.equal(firstMatchingTerrain([normal],corners,'X'.charCodeAt(0)),null);
  assert.equal(firstMatchingTerrain([special],corners,0),null);
});
