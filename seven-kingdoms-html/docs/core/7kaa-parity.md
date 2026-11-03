# SKH-110 — Candidate original 7KAA RNG/calendar port

**Issue:** [#22](https://github.com/CzekUns/Rtsmobile/issues/22). **Branch:** `agent/skh-core/original-scheduler`. **PR:** separate from [#14](https://github.com/CzekUns/Rtsmobile/pull/14). Only newly created files in `core/`, `tests/core/`, `docs/core/`.

## Source revision fixed
`the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc` (GitHub 7KAA mirror; GPLv2). Sources:
- [OMISC.cpp](https://github.com/the3dfxdude/7kaa/blob/14e6fdfba9481af4dc3a54722614a608776e20bc/src/OMISC.cpp): `Misc::rand`, `Misc::random`, signed 32-bit seed.
- [OMISC.h](https://github.com/the3dfxdude/7kaa/blob/14e6fdfba9481af4dc3a54722614a608776e20bc/include/OMISC.h): `int32_t random_seed`, separate `misc` and `misc2`.
- [ODATE.cpp](https://github.com/the3dfxdude/7kaa/blob/14e6fdfba9481af4dc3a54722614a608776e20bc/src/ODATE.cpp): Gregorian leap, Julian conversion and `JULIAN_ADJUSTMENT=1721425`.
- [OINFO.cpp](https://github.com/the3dfxdude/7kaa/blob/14e6fdfba9481af4dc3a54722614a608776e20bc/src/OINFO.cpp): `Info::init` default 1 Jun 1000; `Info::next_day` date increment, capped accounting `game_day<=30`, year/month update.
- [OSYS2.cpp](https://github.com/the3dfxdude/7kaa/blob/14e6fdfba9481af4dc3a54722614a608776e20bc/src/OSYS2.cpp): `Sys::process` increments `frame_count`, synchronization each 3 frames, `++day_frame_count > FRAMES_PER_DAY` daily rollover.
- [OSYS.h](https://github.com/the3dfxdude/7kaa/blob/14e6fdfba9481af4dc3a54722614a608776e20bc/include/OSYS.h): `FRAMES_PER_DAY=10`.
- [OSYS.cpp](https://github.com/the3dfxdude/7kaa/blob/14e6fdfba9481af4dc3a54722614a608776e20bc/src/OSYS.cpp): initial `frame_count=1`, `day_frame_count=0`.
- [OGAME.cpp](https://github.com/the3dfxdude/7kaa/blob/14e6fdfba9481af4dc3a54722614a608776e20bc/src/OGAME.cpp): initialization must not consume RNG.
- [OGAMESET.cpp](https://github.com/the3dfxdude/7kaa/blob/14e6fdfba9481af4dc3a54722614a608776e20bc/src/OGAMESET.cpp): inspected; game set loading, not game scheduler.

## Fixed fixtures and parity status
RNG: `seed= signed32(seed*0x015A4E35+1)`; output `(seed>>16)&32767`. From seed 1, six successive `[signedSeed,rand]` results:
```json
[[22695478,346],[-2138921681,130],[-1427733316,10982],[71484141,1090],[-1383558894,11656],[-1681029957,7117]]
```
`Misc::random(maxNum)` computes `floor(maxNum*rand/32768)`, not modulo. `random(0)` still consumes a draw. Dates (Gregorian): 1000-06-01 = 2086454, 1000-07-01 = 2086484, 1001-01-01 = 2086668, 2000-02-29 = 2451604. Native `game_day` is an accounting counter capped at 30, not the calendar day number. The original `Sys::process` uses a strict `>` comparison with 10: after reset it takes 11 processed frames to roll over a day. Full C++ executable/WebAssembly differential trace remains outstanding: **formula-level candidate only**, not full-game parity.

## Public isolated ESM exports
`core/7kaa-rng.js`: `SEVEN_KAA_RANDOM_MAX`, `create7kaaRng(seed)`, `next7kaaRand(rng)`, `next7kaaRandom(rng,maxNum)`. Each returns new immutable-by-convention data. Persist the returned signed `{seed}` state (different from PR #14 `{state}`).

`core/7kaa-time.js`: `SEVEN_KAA_FRAMES_PER_DAY`, `SEVEN_KAA_JULIAN_ADJUSTMENT`, `is7kaaLeapYear`, `sevenKaaDayOfYear`, `sevenKaaJulian`, `sevenKaaFromJulian`, `create7kaaCalendar`, `next7kaaDay`, `create7kaaFrameState`, `step7kaaFrame`. `step7kaaFrame` returns `{state,dayBoundary,monthBoundary,yearBoundary,syncFrame}`; it reports boundaries but does **not** simulate gameplay systems or their update order.

## Handoff for SKH-106
After reviewing both PRs, introduce explicit adapter to use 7KAA RNG/calendar functions in simulation. Never silently replace PR #14 RNG or clock: previously saved `rng.state` and `clock.tick` are different data models. Add save schema version migration before selecting this runtime. Upstream day-system processing order is in `OSYS2.cpp`; `OINFO.cpp` triggers firm and nation monthly/yearly hooks (not implemented here). Rendering should consume no simulation RNG (see OGAME/OSYS2 seed locking). Source year 0 and upper-bound date peculiarities deliberately unsupported; integer inversion uses mathematically equivalent Gregorian dates, not byte-for-byte native `get_date` branches. Pure code has no DOM, Canvas, localStorage, wall-clock or dependencies on PR #14.

Tests: `node --test seven-kingdoms-html/tests/core/7kaa-parity.test.js`, `npm --prefix seven-kingdoms-html test`. Screenshot: not applicable to data-only modules.
