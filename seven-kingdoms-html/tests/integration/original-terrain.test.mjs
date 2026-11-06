import test from 'node:test';
import assert from 'node:assert/strict';
import {ORIGINAL_TERRAIN,OriginalTerrainPreview,terrainAtlasRow,terrainAtlasColumn} from '../../playtest/original-terrain.js';
test('source terrain palette and row mapping preserve existing simulation biomes',()=>{
 assert.equal(ORIGINAL_TERRAIN.width,256);assert.equal(ORIGINAL_TERRAIN.height,128);
 assert.equal(terrainAtlasRow('grass'),0);assert.equal(terrainAtlasRow('forest'),1);
 assert.equal(terrainAtlasRow('hill'),2);assert.equal(terrainAtlasRow('dry'),2);
 assert.equal(terrainAtlasRow('water'),3);assert.equal(terrainAtlasRow('volcano'),-1);
 assert.equal(terrainAtlasColumn(0),0);assert.equal(terrainAtlasColumn(.5),4);
 assert.equal(terrainAtlasColumn(.999),7);
});
test('original terrain images draw nearest-neighbour and fallback if not loaded',()=>{
 const frame={complete:true,naturalWidth:256,naturalHeight:128};
 const preview=new OriginalTerrainPreview({imageFactory:()=>frame});
 assert.match(frame.src,/TERRAIN1-pure-8x4\.png$/);
 const log=[],ctx={save(){log.push('save')},restore(){log.push('restore')},drawImage(...args){log.push(args)},imageSmoothingEnabled:true};
 assert.equal(preview.drawTile(ctx,10.4,20.7,24,'water',.3),true);
 assert.deepEqual(log[1].slice(1,5),[2*32,3*32,32,32]);
 assert.deepEqual(log[1].slice(5),[10,20,25,25]);
 assert.deepEqual([log[0],log[2]],['save','restore']);
 frame.naturalWidth=1;
 assert.equal(preview.drawTile(ctx,0,0,24,'water',.3),false);
});
