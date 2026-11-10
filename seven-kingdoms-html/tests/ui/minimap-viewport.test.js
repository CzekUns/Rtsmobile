import test from 'node:test';
import assert from 'node:assert/strict';
import {clipMinimapViewport as clip} from '../../playtest/minimap-viewport.js';

test('minimap viewport in the center',()=>assert.deepEqual(clip(50,50,20,20,100,100),{x:40,y:40,width:20,height:20}));
test('minimap viewport at left and top borders',()=>assert.deepEqual(clip(0,0,20,20,100,100),{x:0,y:0,width:10,height:10}));
test('minimap viewport at right and bottom borders',()=>assert.deepEqual(clip(100,100,20,20,100,100),{x:90,y:90,width:10,height:10}));
test('minimap viewport larger than the entire map',()=>assert.deepEqual(clip(50,50,200,200,100,100),{x:0,y:0,width:100,height:100}));
