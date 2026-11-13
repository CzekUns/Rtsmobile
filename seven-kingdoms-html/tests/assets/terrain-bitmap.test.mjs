import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeTerrainBitmap} from '../../tools/assets/terrain-bitmap.mjs';
// Authentic SG-028 entry header and first 16 indexed pixels from upstream
// data/RESOURCE/I_TERN1.RES at byte 0x13668 (7KAA commit 14e6fdf).
function fixture(){const b=new Uint8Array(8+1024);b.set([4,4,0,0,32,0,32,0]);b.set([0xb8,0x27,0x69,0xb9,0x28,0x69,0x28,0x69,0x27,0x26,0x28,0x28,0x27,0xb8,0x28,0x69],8);return b;}
test('SG-028 authentic bitmap header yields 32x32 indexed pixels',()=>{
 const result=decodeTerrainBitmap(fixture(),0);
 assert.equal(result.width,32);assert.equal(result.height,32);
 assert.equal(result.pixels.length,1024);
 assert.deepEqual([...result.pixels.slice(0,16)],[0xb8,0x27,0x69,0xb9,0x28,0x69,0x28,0x69,0x27,0x26,0x28,0x28,0x27,0xb8,0x28,0x69]);
});
test('offset, truncation and unsupported compression fail closed',()=>{
 assert.throws(()=>decodeTerrainBitmap(new Uint8Array(7),0),/outside/);
 assert.throws(()=>decodeTerrainBitmap(fixture().subarray(0,100),0),/truncated/);
 const compressed=fixture();compressed[4]=31;
 assert.throws(()=>decodeTerrainBitmap(compressed,0),/unsupported/);
});
