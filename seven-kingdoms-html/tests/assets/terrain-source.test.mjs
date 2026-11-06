import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseTerrainRows,rawTerrainTile,choosePureTerrainRows} from '../../tools/assets/render-terrain.mjs';
const atlas=JSON.parse(readFileSync(new URL('../../assets/manifests/TERRAIN1-pure-8x4.json',import.meta.url),'utf8'));

test('original 7KAA terrain manifest has 32 slots of pure indexed tiles',()=>{
 assert.equal(atlas.tileSize,32);assert.equal(atlas.rows,4);assert.equal(atlas.columns,8);
 assert.deepEqual(Object.keys(atlas.types),['G','F','D','S']);
 for(const type of ['G','F','D','S'])for(const frame of atlas.types[type]){
  assert.equal(frame.cornerCode[0],type);
  assert.ok(frame.sourceRecordNo>=1&&frame.sourceRecordNo<=750);
  assert.ok(frame.originalBitmapOffset>=0&&frame.originalBitmapOffset<577920);
 }
 assert.equal(atlas.visuallyVerified,false);
});
test('source PNG atlas has 256x128 dimensions and PNG signature',()=>{
 const bytes=readFileSync(new URL('../../assets/previews/TERRAIN1-pure-8x4.png',import.meta.url));
 assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(bytes.readUInt32BE(16),256);assert.equal(bytes.readUInt32BE(20),128);
});
test('original TERRAIN1 record parser recognizes four corner codes and bitmap pointer',()=>{
 const db=Buffer.alloc(385+27+1,32);db[0]=3;db.writeUInt32LE(1,4);
 db.writeUInt16LE(385,8);db.writeUInt16LE(27,10);
 const p=385;for(const [offset,value] of [[1,'G+'],[3,'G+'],[5,'G+'],[7,'G+'],[11,'G'],[15,'GG-044A']])
  db.write(value,p+offset,'latin1');
 db.writeUInt32LE(3072,p+23);
 const rows=parseTerrainRows(db);
 assert.equal(rows.length,1);assert.equal(rows[0].bitmapOffset,3072);
 assert.equal(choosePureTerrainRows(rows,'G').length,8);
 assert.equal(choosePureTerrainRows(rows,'G')[7].sourceRecordNo,1);
 assert.throws(()=>choosePureTerrainRows(rows,'F'),/Missing original/);
});
test('original terrain tile is exactly 32x32 indexed opaque bytes',()=>{
 const file=Buffer.alloc(4+4+1024);file.writeUInt32LE(1028,0);file.writeUInt16LE(32,4);file.writeUInt16LE(32,6);
 file[8]=17;file[1031]=22;
 const tile=rawTerrainTile(file,0);
 assert.equal(tile.length,1024);assert.equal(tile[0],17);assert.equal(tile[1023],22);
 file[1031]=255;assert.throws(()=>rawTerrainTile(file,0),/transparency control/);
});
