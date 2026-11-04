import test from 'node:test';
import assert from 'node:assert/strict';
import {ORIGINAL_MAX_TRAIN_QUEUE,appendOriginalTrainQueue} from '../playtest/original-train-queue.js';

test('7KAA queue capacity is ten slots without active trainee', () => {
  assert.equal(ORIGINAL_MAX_TRAIN_QUEUE,10);
  const result=appendOriginalTrainQueue({queue:[],activeTraining:false,skillId:1,raceId:2,amount:12});
  assert.equal(result.added,10);
  assert.deepEqual(result.queue,Array.from({length:10},()=>({skillId:1,raceId:2})));
});
test('7KAA active trainee reserves one of ten slots', () => {
  const result=appendOriginalTrainQueue({queue:[],activeTraining:true,skillId:1,raceId:2,amount:12});
  assert.equal(result.added,9);
  assert.equal(result.queue.length,9);
});
test('7KAA appends without modifying previous race/skill or caller queue', () => {
  const old=[{skillId:3,raceId:1},{skillId:4,raceId:3}];
  const result=appendOriginalTrainQueue({queue:old,activeTraining:true,skillId:1,raceId:2,amount:3});
  assert.deepEqual(old,[{skillId:3,raceId:1},{skillId:4,raceId:3}]);
  assert.deepEqual(result.queue.slice(0,2),old);
  assert.deepEqual(result.queue.slice(2),Array.from({length:3},()=>({skillId:1,raceId:2})));
});
test('7KAA full queue cannot enqueue more trainees', () => {
  const old=Array.from({length:9},()=>({skillId:1,raceId:2}));
  assert.equal(appendOriginalTrainQueue({queue:old,activeTraining:true,skillId:1,raceId:2,amount:3}).added,0);
});
test('invalid amount, race, skill or oversized queue is rejected', () => {
  const base={queue:[],activeTraining:false,skillId:1,raceId:2,amount:1};
  for(const changes of [{amount:-1},{amount:1.5},{skillId:0},{raceId:0},{queue:Array(11).fill({skillId:1,raceId:2})}]) {
    assert.throws(()=>appendOriginalTrainQueue({...base,...changes}),RangeError);
  }
});
