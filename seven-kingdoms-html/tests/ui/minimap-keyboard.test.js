import test from 'node:test';
import assert from 'node:assert/strict';
import {minimapKeyTarget,minimapKeyboardTarget} from '../../playtest/minimap-keyboard.js';
test('arrow keys navigate map in tile coordinates',()=>{
 assert.deepEqual(minimapKeyTarget('ArrowLeft',{x:30,y:40},100,80),{x:20,y:40});
 assert.deepEqual(minimapKeyTarget('ArrowDown',{x:30,y:40},100,80),{x:30,y:50});
});
test('clamps at world boundaries',()=>{
 assert.deepEqual(minimapKeyTarget('ArrowUp',{x:0,y:1},100,80),{x:0,y:0});
 assert.deepEqual(minimapKeyTarget('ArrowRight',{x:99,y:80},100,80),{x:100,y:80});
});
test('Home centers and irrelevant keys do nothing',()=>{
 assert.deepEqual(minimapKeyTarget('Home',{x:2,y:3},100,80),{x:50,y:40});
 assert.equal(minimapKeyTarget('Enter',{x:2,y:3},100,80),null);
 assert.equal(minimapKeyTarget('ArrowUp',{x:2,y:3},0,80),null);
});

test('plain navigation works with focused minimap event',()=>{
 assert.deepEqual(minimapKeyboardTarget({key:'ArrowRight'},{x:40,y:30},100,80),{x:50,y:30});
 assert.deepEqual(minimapKeyboardTarget({key:'Home'},{x:40,y:30},100,80),{x:50,y:40});
});
test('modifier and composition shortcuts remain available to browser and AT',()=>{
 for(const modifier of ['altKey','ctrlKey','metaKey','shiftKey','isComposing']){
  assert.equal(minimapKeyboardTarget({key:'ArrowLeft',[modifier]:true},{x:40,y:30},100,80),null,modifier);
  assert.equal(minimapKeyboardTarget({key:'Home',[modifier]:true},{x:40,y:30},100,80),null,modifier);
 }
 assert.equal(minimapKeyboardTarget(null,{x:40,y:30},100,80),null);
 assert.equal(minimapKeyboardTarget({key:'Enter'},{x:40,y:30},100,80),null);
});
