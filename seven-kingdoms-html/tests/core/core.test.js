import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock, stepClock, setPaused, setSpeed, getGameDay, createFrameAccumulator, accumulateFrame,
 createRng, nextRandom, randomInt, createIdAllocator, allocateId, createEventQueue, enqueueEvent,
 drainEvents, cancelEvent, createCoreState, encodeSave, decodeSave, recoverSave, SAVE_SCHEMA_VERSION } from '../../core/index.js';
test('clock pauses resumes and advances exactly across batch sizes', () => {
 let a = createClock({ ticksPerDay: 24 });
 for (let i = 0; i < 1000; i++) a = stepClock(a, 1);
 assert.deepEqual(a, stepClock(createClock(), 1000));
 assert.equal(getGameDay(a), 41);
 assert.deepEqual(stepClock(setPaused(a, true), 99), setPaused(a, true));
 assert.equal(stepClock(setPaused(setSpeed(a, 3), false), 2).tick, 1006);
});
test('integer frame accumulation and paused frames', () => {
 let a = createFrameAccumulator({ tickUs: 10000 });
 for (const delta of [3000, 3000, 4000]) { const n = accumulateFrame(a, delta); a = n.accumulator; if (delta === 4000) assert.equal(n.ticks, 1); }
 assert.equal(accumulateFrame(a, 80000, true).ticks, 0);
 assert.deepEqual(accumulateFrame(a, 8000), accumulateFrame(createFrameAccumulator({ tickUs: 10000 }), 8000));
});
test('seed and PRNG state survive reload', () => {
 let a = createRng(987654), b = createRng(987654);
 for (let i = 0; i < 1000; i++) { const x = nextRandom(a), y = nextRandom(b); assert.deepEqual(x, y); a = x.rng; b = y.rng; }
 assert.equal(randomInt(createRng(1), 1).value, 0);
});
test('IDs are unique and never reused across save load', () => {
 let state = createCoreState(), seen = new Set();
 for (const kind of ['unit','town','building','kingdom']) for (let i = 0; i < 100; i++) {
  const a = allocateId(state.ids, kind); state = { ...state, ids: a.allocator };
  assert.ok(!seen.has(a.id)); seen.add(a.id);
 }
 const loaded = decodeSave(encodeSave(state));
 assert.equal(allocateId(loaded.ids, 'unit').id, 'unit:101');
});
test('event queue sorts stably, cancels and drains by due tick', () => {
 let q = createEventQueue();
 for (const e of [{atTick:5,type:'later'}, {atTick:2,type:'second',priority:1},
 {atTick:2,type:'first'}, {atTick:2,type:'third'}]) q = enqueueEvent(q,e).queue;
 const drained = drainEvents(q,2);
 assert.deepEqual(drained.ready.map(e=>e.type),['first','third','second']);
 assert.deepEqual(drainEvents(drained.queue,5).ready.map(e=>e.type), ['later']);
 assert.equal(cancelEvent(q,1).events.length, 3);
});
test('10000 ticks with queued events deterministic after checkpoint reload', () => {
 const run = (input, count) => {
  let s = input;
  for (let i=0; i<count; i++) {
   const n = nextRandom(s.rng);
   const queued = enqueueEvent(s.queue,{atTick:s.clock.tick + 3,type:'random',payload:n.value});
   const clock = stepClock(s.clock,1);
   const drained = drainEvents(queued.queue,clock.tick);
   s = { ...s, rng:n.rng, queue:drained.queue,
     clock, world: { sum:(s.world.sum ?? 0) + drained.ready.reduce((a,e)=>a+e.payload,0) } };
  }
  return s;
 };
 const start = createCoreState(), full = run(start,10000);
 const resumed = run(decodeSave(encodeSave(run(start,4177))),5823);
 assert.equal(encodeSave(full), encodeSave(resumed));
});
test('canonical valid JSON, migrations, corruption and backup recovery', () => {
 const s = createCoreState({world:{z:1,a:2}});
 const json = encodeSave(s);
 assert.equal(JSON.parse(json).schemaVersion,SAVE_SCHEMA_VERSION);
 assert.equal(encodeSave(decodeSave(json)), json);
 assert.equal(decodeSave(JSON.stringify({schemaVersion:1,state:{clock:createClock(),world:{ok:true}}})).world.ok,true);
 assert.throws(()=>decodeSave('{broken'), /invalid save JSON/);
 assert.throws(()=>decodeSave(JSON.stringify({schemaVersion:99,state:s})), /future/);
 const recovered = recoverSave('garbled',['also garbage',json]);
 assert.equal(recovered.source,'backup');
 assert.equal(recovered.index,2);
 assert.equal(recovered.errors.length,2);
});
