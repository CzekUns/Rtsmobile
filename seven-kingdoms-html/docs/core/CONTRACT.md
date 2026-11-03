# SKH-104 — Core deterministic runtime contract

Issue: [#10](https://github.com/CzekUns/Rtsmobile/issues/10). Branch: `agent/skh-core/determinism`. Target: `main`.
Writable files: `seven-kingdoms-html/core/`, `tests/core/`, `docs/core/` only.

## API (native ESM, no external dependencies)
Import `./core/index.js` from an integration adapter.

- `createClock({ticksPerDay=24,tick=0,speed=1,paused=false})`, `stepClock(clock,delta=1)`, `setPaused(clock,boolean)`, `setSpeed(clock,positiveInteger)`, `getGameDay(clock)`. Delta is a **simulation tick count**, not elapsed wall milliseconds. Speed multiplies ticks in `stepClock`; host should avoid applying speed a second time.
- `createFrameAccumulator({remainderUs=0,tickUs=100000,maxFrameUs=250000})`, `accumulateFrame(accumulator,deltaUs,paused)` returns `{accumulator,ticks}`. Inputs are **integer microseconds**; an oversized frame is capped. The host adapter decides whether to call `stepClock` and how many logical steps to execute. While paused, frame delta is discarded.
- `createRng(seed)`, `nextRandom(rng)`, `randomInt(rng,exclusiveMax)` return new generator state and random result, never mutate input. Seed/state unsigned 32-bit; draw state MUST be retained after each call.
- `createIdAllocator(counters)`, `allocateId(ids,kind)` for `unit`, `kingdom`, `town`, `building`. IDs are strings `unit:1`, etc. Persist counters when deleting entities; do not recompute from active objects. This is not 7KAA's native record-number allocation.
- `createEventQueue({nextSequence,events})`, `enqueueEvent(queue,{atTick,priority=0,type,payload})`, `drainEvents(queue,throughTick)`, `cancelEvent(queue,id)`. Ordering: ascending `atTick`, ascending non-negative `priority`, ascending insertion `sequence`. `drainEvents` returns `{queue,ready}`; adapter must execute ready effects in that order. Data-only JSON payloads, no callbacks.
- `createCoreState({clock,rng,ids,queue,world})`, `encodeSave(state)` (canonical JSON string), `decodeSave(json)` (validated state), `recoverSave(primary,backups)` (returns `{state,source,index,errors}`), `SAVE_SCHEMA_VERSION=2`.

## Save shape and recovery
```json
{"schemaVersion":2,"state":{"clock":{"tick":0,"ticksPerDay":24,"speed":1,"paused":false},"rng":{"state":1},"ids":{"unit":0,"kingdom":0,"town":0,"building":0},"queue":{"nextSequence":0,"events":[]},"world":{}}}
```
The exact serialized key ordering is canonicalized lexicographically. JSON data only. `world` is an object owned by the integrator; it may contain units/towns/etc. Version 1 migrates by adding missing RNG, ID allocator and queue defaults. **Warning:** for imported legacy saves with populated entities but missing ID counters, this basic migration is not collision-safe; the integration layer must scan IDs and establish high-water marks first. Unknown future versions fail closed. The integrator must persist a primary and rotating backups transactionally using its own storage adapter and only promote a recovered backup after user confirmation. No `localStorage` access in core.

## Parity status and upstream provenance
Studied [7kaa OGAME.cpp](https://github.com/the3dfxdude/7kaa/blob/master/src/OGAME.cpp): `Game::init` saves/restores the random seed and insists that initialization must not consume RNG. The conceptual invariant (all random state explicit and saved) is respected, but **no byte-for-byte C++ RNG parity** is claimed. Relevant C++ 7KAA sources to compare next: `OMISC.cpp` random functions, game-day dispatch in `OGAME.cpp`/`OGAMESET.cpp`, save/load subsystems. The JS 24 ticks/day, 100 ms tick duration, 250 ms frame clamp, LCG RNG, stable queue, string IDs and JSON schema are **new deterministic infrastructure**, NOT verified Seven Kingdoms originals. Date epoch, original speed ratios, frame/day cadence, C++ RNG and save binary format remain unported. Do not present JSON as compatible with original 7KAA save files.

## Integrator handoff
1. Keep `game.js` and browser storage changes in SKH-106 only; import ESM API from `./core/index.js`.
2. Call `accumulateFrame` with integer microseconds from wall-clock deltas. For every returned logical tick, do an ordered simulation tick, then `stepClock(clock,1)`; do not let rendering FPS change RNG draw order. Specify the original 7KAA tick/day cadence separately.
3. Make every gameplay system consume and return updated explicit `rng`, `ids`, `queue` fields. Do not call Math.random in gameplay. Event types and payload contracts belong to the systems creating them.
4. Save the **entire** state after each atomic world update, including pending events, RNG, allocator counters. Preserve backups; allow recovery with visible warning.
5. Verify against native C++ replay fixtures before labeling anything parity.
6. Tests: `node --test seven-kingdoms-html/tests/core/*.test.js`; full suite: `npm --prefix seven-kingdoms-html test`. No UI screenshots apply.

## Known limits
Timer quantization uses microseconds supplied by the host, not `performance.now()`; exact equal elapsed time is deterministic when total microseconds and frame clamp rules agree. JSON payloads must be finite/serializable; cross-process functions/typed arrays/BigInt unsupported. The event queue copies arrays and is optimized for correctness rather than large event volumes. No legacy existing demo-save migration is provided.
