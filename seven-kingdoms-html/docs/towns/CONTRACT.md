# SKH-102 Town & Population — CONTRACT (incremental parity)
Issue: #8 · Branch: `agent/skh-towns/parity` · PR: see GitHub branch PR.

## Scope and licensing
Native JavaScript, no imports/dependencies or global I/O. Source-of-truth: **Seven Kingdoms: Ancient Adversaries**, 7kaa repository `the3dfxdude/7kaa`, `master`, files `src/OTOWN.cpp`, `src/OTOWNIF.cpp`, `src/OTOWNIND.cpp`, `include/OTOWN.h` (GPLv2-or-later). Use an upstream commit pin before claiming cross-version binary parity. No Ver Sacrum sources.

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
