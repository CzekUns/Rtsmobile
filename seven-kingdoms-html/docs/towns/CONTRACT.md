# SKH-102 Town & Population — CONTRACT (incremental parity)
Issue: #8 · Branch: `agent/skh-towns/parity` · PR: see GitHub branch PR.

## Scope and licensing
Native JavaScript, no imports/dependencies or global I/O. Source-of-truth: **Seven Kingdoms: Ancient Adversaries**, 7kaa repository `the3dfxdude/7kaa`, pinned commit [`14e6fdfba9481af4dc3a54722614a608776e20bc`](https://github.com/the3dfxdude/7kaa/commit/14e6fdfba9481af4dc3a54722614a608776e20bc), files `src/OTOWN.cpp`, `src/OTOWNIF.cpp`, `src/OTOWNIND.cpp`, `include/OTOWN.h` (GPLv2-or-later). The source is pinned; actual C++ executable parity is still unverified. No Ver Sacrum sources.

## State schema
`TownState = { nationId, hasLinkedOwnCamp, hasLinkedEnemyCamp, races: [{population,jobless,spies,loyalty,targetLoyalty?,growth?,resistance?:number[],targetResistance?:number[]}], accumulatedCollectTaxPenalty?, accumulatedRewardPenalty?, accumulatedRecruitPenalty?, trainingRaceId?, townDefenderCount?, rebelId? }`.
Race IDs are **1-based** and array indices 0-based. Nation IDs are 1-based, 0 means independent. `population` and `jobless` are per-race integers; town totals computed from arrays, not stored redundantly. `spies` are a subset of jobless population (integration adapter must account for spies at firms). The C++ uses float32 state; current JS uses double and is *numerically close*, not bit-identical. Caller must preserve scheduler cadence, link activation and integer invariants.

## Public exports — systems/towns/index.js
- `TOWN_CONSTANTS`, `validateTown(t)`, `townPopulation(t)`, `joblessPopulation(t)`, `averageLoyalty(t)`.
- `changeLoyalty(t,raceId,delta) -> TownState`: clamp to [0,100].
- `collectTax(t)`, `reward(t)`, `processAuto(t,{cash,autoCollectTaxLoyalty,autoGrantLoyalty})`.
- `recruitableRacePop(t,raceId,{recruitSpy}) -> integer`, `recruitLoyaltyPenalty(t,raceId,{apply,fixRecruitDecLoyalty}) -> {amount,rawDecrease,nextTown}`, `recruitUnskilled(t,raceId,{canPlaceUnit,selectedSpy,fixRecruitDecLoyalty})` (**restricted ordinary recruit adapter**, not full `Town::recruit`).
- `updateLoyalty(t)`, `updateResistance(t,{activeNationIds})`, `populationGrow(t,{qualityOfLife})`, `surrenderCandidate(t,{camps,rebelMobileCount})`.
- `independentSchedule(t,{gameDate,townId}) -> string[]`, `independentFirmLink(t,{isCamp,firmNationId,averageResistance}) -> boolean|null`.
Action-like functions return `{ok,reason?,nextTown,cashDelta,effects[]}`; no input mutation. Failed checks return original state and reason; malformed states throw `RangeError`. External adapter must apply cash deltas and event effects exactly once. The `think-rebel-required` and `surrender-candidate` effects **do not trigger rebellion or surrender automatically**.

## Verified original formulas and conditions
| C++ | Translation | Notes |
|---|---|---|
| `collect_tax` | decrease `min(20,10+trunc(penalty/5))`; penalty +=10 | requires own linked camp |
| `collect_tax` | sum `(before-after)*racePopulation*5/decrease` | actual loyalty loss, not flat income |
| `reward` | increase `max(3,10-trunc(penalty/5))`; penalty +=10 | cash delta = -10 × town population; manual reward has no cash gate in C++ |
| `recruit_dec_loyalty` | `min(5,60/racePop)` + optional `penalty/5`, cap 10; penalty +=5 only on apply | `fix_recruit_dec_loyalty` controls preview rounding / formula branch |
| `update_loyalty` | `max(0.5,abs(target-current)/30)` | no positive adjustment with enemy camp and no own camp |
| `update_resistance` | `max(1,(current-target)/30)` reduction, never increase | when <1 for every inhabited race nation becomes surrender candidate |
| `population_grow` | growth accumulator += pop × (100+QOL)/100 (owned), else += pop; each accumulator strictly >100 births 1 | limit total 60, stops if defenders present |
| `think_surrender` | eligible discontent >= `trunc(pop*2/3)`, loyalty <=29, no own camp, enemy camp present | compare enemy camp influence to average loyalty |
| `think_independent_town` | modulo gameDate/townId checks every 15, 60, 365 days | rebel-run villages skip independent AI |
| `think_independent_set_link` | non-camp enabled when independent firm or average resistance <=50 | camps are not toggled |

## Sample vectors (source expressions, not recorded C++ executable output)
- 20 residents at loyalty 50 + 10 at 95: first tax drops 10, yields `20×5 + 10×5 = 150` (both lose all 10).
- Same with second race loyalty **5**: first tax yields `20×5 + (5/10)×10×5 = 125`.
- Seven consecutive tax actions: penalty-induced drops `[10,12,14,16,18,20,20]`.
- Five consecutive rewards: increments `[10,8,6,4,3]`.
- At 30 of one race, base recruitment loss `60/30=2`; 1 accumulated increment gives 3.

## Integration handoff and known missing parity
- **Do not claim full F04 parity.** Full `Town::recruit` selection of spies, training queue, unit placement/world collision, linked-firm labor mobilization, abandoned-town lifecycle and battle effects are not ported. The ordinary recruitment helper is only valid when a non-spy resident was selected externally and placement succeeded.
- `think_rebel` requires rebel leader generation, cooldown 90 days, previous attack timing, random 30–59% uprising and firm-spy accounting; currently event only.
- `update_target_loyalty` needs `race_harmony`, nation reputation, commander/camp influence, own/enemy camp toggles and QOL option. `update_target_resistance` requires `camp_influence` and enabled link state. These cannot be treated as numerical parity without adapters.
- Food starvation via `process_food`, annual tax, subsidy independent towns, immigration and periodic penalty decay need porting with additional cross-file constants. This deliverable deliberately does not invent formulas.
- `updateResistance` only flags surrender eligibility; military/rebel integration decides if it can proceed. JS double precision differs from original float32 in boundary cases.
- No direct changes to `rules.js`, engine, renderer or `package.json`. Import from `./systems/towns/index.js` at the integration stage and call with the original scheduler cadence.
- Test: `node --test seven-kingdoms-html/tests/towns/*.test.js`. Existing overall suite: `npm --prefix seven-kingdoms-html test`.

## Second cycle — SKH-108 / issue #20 / PR #15

### Pinned upstream source and comparison matrix

Source SHA: `14e6fdfba9481af4dc3a54722614a608776e20bc` (the3dfxdude/7kaa). The actual C++ gameplay binary is **not** run in this branch.

| Source | Original behavior | Pure JS export | Status |
|---|---|---|---|
| OTOWN.cpp `next_day` | decrement 4 nonzero accumulated penalty counters each day | `decayPenalties` | formula ported |
| OTOWN.cpp `collect_yearly_tax` | once Jan 1: population × 5, no loyalty loss | `collectYearlyTax` | formula ported |
| OTOWN.cpp `process_food` | jobless × annual producer constant /365; population × annual consumer constant /365 | `processFood` | formula ported, constants adapter pending |
| OTOWN.cpp `update_camp_link` | enable AI/non-human-owned camp links, require enabled camp and overseer | `updateCampLinks` | subset ported; link topology external |
| OTOWN.cpp `camp_influence` | truncated leadership ×2/3, racial similarity bonus 1/3, reputation/2, max 100 | `campInfluence` | formula ported |
| OTOWN.cpp `update_target_loyalty` | harmony/3, reputation/4, employment, king race, camps and QOL | `updateTargetLoyalty` | formula ported; harmony and culture equivalence injected |
| OTOWN.cpp `update_target_resistance` | strongest linked camp, commander race + nation only | `updateTargetResistance` | formula ported |
| OTOWN.cpp `update_resistance` | every five days reduce to target, auto-surrender if zero | `updateResistance` | numerical part, surrender event only |
| OTOWN.cpp `population_grow` | every 30 days accumulator + population, QOL modifier when ruled | `populationGrow` | formula ported; scheduler external |
| OTOWNIF.cpp `recruit` | random selection among recruits including spies, training unit and cost | `planRecruit` | planning phase, side effects external |
| OTOWNIF.cpp `recruit_dec_loyalty` | race-dependent loyalty cost and cumulative penalty | `recruitLoyaltyPenalty` | formula ported |
| OTOWNIND.cpp `think_independent_town` | links every 15d, units every 60d, new nations every 365d | `independentSchedule` | scheduling only |
| OTOWNIND.cpp `think_independent_set_link` | resistance <=50 enables foreign civilian firm links | `independentFirmLink` | decision ported |

### Second-cycle API additions
All immutable. `decayPenalties(t)`, `collectYearlyTax(t,{month,day})`, `processFood(t,{peasantFoodYearProduction,personFoodYearConsumption})`, `updateCampLinks(t,{camps,isHumanNation})`, `campInfluence({leadership,reputation,sameRulerRace})`, `updateTargetResistance(t,{camps,nationCount})`, `updateTargetLoyalty(t,{raceHarmony,reputation,kingRaceId,camps,qualityOfLife,enableQualityOfLife,sameRace})`, `planRecruit(t,raceId,{skillId,canPlaceUnit,randomRoll,fixRecruitDecLoyalty})`, `migrateScalarTown(s,{raceId,races})`.

`processFood` returns **food production and consumption intents**, not famine casualties. C++ calls `Nation::consume_food` which requires nation food stocks and nutrition processing; no invented starvation effects here. The adapter must supply original named constants and apply `add_food` followed by `consume_food`. `updateCampLinks` effects include proposed link changes; an adapter must commit these with the original bidirectional toggle rules. `planRecruit` accepts the deterministic roll supplied by the core RNG and returns either an ordinary mobilization, a pending training event, or explicit demand for the spy adapter. Skill ID `-1` recruits immediately; `0` and positive skill IDs queue training, positive skill additionally costs 30. The caller must handle a five-day training lifecycle, unit records and world placement. No false completed-training event.

### Scalar-to-multi-race migration
Example input: `{nationId:1,population:10,joblessPopulation:6,loyalty:45}`.
Explicit racial allocation required: `migrateScalarTown(s,{raceId:1,races:[{population:7,jobless:4,loyalty:45},{population:3,jobless:2,loyalty:50}]})`.
The converter rejects mismatched totals and missing loyalty for nonempty secondary races; it **never guesses the distribution**. The adapter is responsible for determining original race records and persisting new schema version in the core save layer. This is not an automatic in-place save mutation.

### Events vs actual state
`think-rebel-required`, `surrender-candidate`, `spy-mobilization-required` and `training-unit-pending` are **events or planning intents**, NOT spawned rebels, automatic annexation, a completed spy mobilization, or a newly created unit. Military, spy and scheduler adapters must execute real transitions and feed their outcomes back. The independent town never acquires a nation solely because its resistance decreases to a low threshold unless the original surrender mechanism runs.

### Test evidence and remaining work
Second-cycle fixture additions: 9 deterministic scenarios (penalty decay, yearly tax, food flows, camp ownership, influence, resistance, target loyalty, recruit transitions, migration) in `tests/towns/towns.test.js`; original 13 preserved. JavaScript in-memory test harness checks math/branches; Node CI must separately be confirmed. Still missing source-exact food constants in this adapter, nation-level famine logic, training queue completion, spy unit mobilization, `race_harmony` and true bidirectional `toggle_firm_link`, random rebel units and actual surrender. Test parity against a runnable C++ build remains required for G4.
