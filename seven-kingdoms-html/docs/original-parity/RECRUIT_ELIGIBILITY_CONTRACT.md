# 7KAA recruitment eligibility — integration contract (2026-11-04)

Source pinned to `the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc`, not yet verified as identical to the project's WASM build.

- `src/OTOWN.cpp` lines 4068–4094: `Town::can_recruit(raceId)`. Blocks if enemy camp linked and no own camp; checks `recruitable_race_pop(raceId,1)>0`; requires per-race loyalty >= 30. AI-controlled owned town requires >= 30 + 3 + `recruit_dec_loyalty(raceId,0)`.
- `src/OTOWN.cpp` lines 4098–4106: `Town::can_train(raceId)`. Requires own camp linked, positive **jobless population for chosen race**, and nation cash **strictly greater than** 30 (not >=).
- `include/OTOWN.h` lines 59–63, 82: training cost 30, initial skill level 20, default duration 5 days, max queue 10.
- `src/OTOWNIF.cpp` lines 721–726 and 2015–2020: fast-build player mode halves the duration via integer division (5/2 = 2 days). This exception must be respected in future training implementation.

New pure adapter `playtest/original-recruit-eligibility.js` + source-derived tests `tests/original-recruit-eligibility.test.mjs`. It is intentionally **not wired** to the demo: `SevenGame.recruit(townId)` still uses scalar town loyalty and the wrong threshold 27. Do not call the whole recruit flow 'parity' until per-race population, spied/jobless counts, camp links, penalty computation and UI are integrated.

Integration handoff for #33 and #34: pass the chosen `raceId`, derive `recruitableRacePop` from the original town/spy rules, and pass the non-mutating `loyaltyDecrease` when AI-controlled. No demo save keys or game entrypoints have been modified.
