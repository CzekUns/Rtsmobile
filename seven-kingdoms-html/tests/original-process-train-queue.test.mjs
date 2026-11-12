import test from 'node:test';
import assert from 'node:assert/strict';
import {selectOriginalQueuedTrainee as select} from '../playtest/original-process-train-queue.js';

test('first eligible trainee is selected, invalid prefix discarded, rest preserved',()=>{
  const queue=[{skillId:1,raceId:2},{skillId:3,raceId:1},{skillId:4,raceId:3}];
  const out=select({queue,joblessPopulation:3,canTrain:race=>race===1});
  assert.deepEqual(out,{queue:[{skillId:4,raceId:3}],request:{skillId:3,raceId:1},discarded:1});
  assert.equal(queue.length,3);
});
test('no jobless population prevents selection and preserves queue',()=>{
  const queue=[{skillId:1,raceId:1}];
  assert.deepEqual(select({queue,joblessPopulation:0,canTrain:()=>true}),{queue,request:null,discarded:0});
});
test('no eligible race leaves entire queue unchanged',()=>{
  const queue=[{skillId:1,raceId:1},{skillId:2,raceId:2}];
  assert.deepEqual(select({queue,joblessPopulation:4,canTrain:()=>false}),{queue,request:null,discarded:0});
});
test('selection preserves race/skill and does not mutate caller entries',()=>{
  const queue=[{skillId:1,raceId:2},{skillId:6,raceId:3}];
  const out=select({queue,joblessPopulation:2,canTrain:race=>race===2});
  out.queue[0].raceId=9;
  assert.equal(queue[1].raceId,3);
  assert.deepEqual(out.request,{skillId:1,raceId:2});
});
test('empty queue does not call eligibility',()=>{
  let calls=0;
  const out=select({queue:[],joblessPopulation:4,canTrain:()=>{calls++;return true;}});
  assert.equal(calls,0);assert.equal(out.request,null);
});
test('rejects malformed input rather than silently corrupting training',()=>{
  assert.throws(()=>select({queue:[{skillId:0,raceId:1}],joblessPopulation:1,canTrain:()=>true}),RangeError);
  assert.throws(()=>select({queue:[],joblessPopulation:-1,canTrain:()=>true}),RangeError);
});
