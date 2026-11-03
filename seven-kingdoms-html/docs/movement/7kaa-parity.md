# SKH-111 — 7KAA movement parity matrix (second cycle)

**Issue:** #23 · **Branch:** `agent/skh-movement/7kaa-parity` · **Prior PR #17 left intact.**

This is a **source-referenced matrix of predicate outcomes**, **not a recorded C++/WASM execution trace**. Even when the C++ condition is explicit, parity of complete pathfinding, animation and collision resolution remains unverified.

## Verified source references

- `the3dfxdude/7kaa/src/OSPATH.cpp` blob `65608c4640c2b7b35b66005cf9ba6511a4d6de8d`: `can_move_to`; land tests `walkable()`, sea tests `sailable()`, air checks separate `air_cargo_recno` from ground `cargo_recno`. `SEARCH_MODE_A_UNIT_IN_GROUP` may consider moving occupants, and excludes caravans for LAND. `SEARCH_MODE_TO_ATTACK` permits target-recno in search, not physical overlap. `SEARCH_SUB_MODE_PASSABLE` can use nation permission.
- `src/OWORLD.cpp` blob `d957236ee31a7e19c3b43b13a09c9a076d181155`: `World::check_unit_space` scans a rectangular footprint; `buildFlag` rejects `is_power_off()` and `has_site()`. `World::locate_space` chooses nearby room with region/plateau constraints and even coordinates for nonland units.
- `src/OUNITM.cpp` blob `d92d656ce2d0552f57a10dde4f5ebe1c1e8fa96e`: `Unit::move_to` handles differing `region_id` using `different_territory_destination` when nonair, and invokes special `search`/path reuse modes.

## Twelve documented scenarios

| ID | Input | Expected predicate | Provenance / qualification |
|---|---|---|---|
| S01 | LAND into water (`walkable=false`) | reject | OSPATH UNIT_LAND |
| S02 | SEA onto land (`sailable=false`) | reject | OSPATH UNIT_SEA |
| S03 | AIR above water, wall, ground occupant; AIR into occupied air layer | first three allowed, air cargo rejected | OSPATH air layer; **air occupant behavior conservative** |
| S04 | LAND 3×3 footprint overlapping impassable building; AIR same rectangle | land reject, air allow if air layer clear | OWORLD all-cell footprint; OSPATH air |
| S05 | 2×2 beyond map; building on `hasSite` | reject; `hasSite` ignored without build flag | OWORLD check_unit_space |
| S06 | diagonal corner with both orthogonal cells blocked | reject | **Conservative JS validator; SeekPath diagonal parity not yet verified** |
| S07 | perimeter route avoiding building vs crossing route | first valid, second invalid | OSPATH terrain; supplied route validation, **not C++ A*** |
| S08 | adjacent idle unit vs moving unit vs moving caravan | deny; moving unit allowed in group-search; caravan denied for land | OSPATH A_UNIT_IN_GROUP; **search exception, not reservation** |
| S09 | occupied goal with/without matching attack target ID | allowed only for matching search target | OSPATH TO_ATTACK; **collision remains forbidden** |
| S10 | land from region 1 to region 2 with strict filter; air equivalent | land denied; air allowed | OUNITM changes target for land; **JS does not implement redirection** |
| S11 | unit exits a 3×3 fort: inside tile vs neighboring free tile | blocked inside, free outside | OWORLD locate_space/check_unit_space; **exit selection still missing** |
| S12 | blocked destination or power-nation disallowed | reject | OSPATH walkable/nation passability |

Additional thirteenth test rejects invalid terrain types.

## Independent API (not imported from PR #17)

`systems/movement/terrain-policy.js` exports:

- `MOBILE_TYPES` with `LAND`, `SEA`, `AIR`.
- `canTraverseTile({tile,mobileType,unit?,mode?,targetId?,regionId?,isNationPassable?}) => boolean`.
- `canPlaceFootprint({width,height,at,size?,getTile,mobileType,unit?,regionId?,isNationPassable?,build?}) => boolean`.
- `validateTileRoute({path,width,height,getTile,mobileType,unit?,size?,regionId?}) => boolean`.

The tile model is `{walkable:boolean,sailable:boolean,regionId?:number,powerNation?:number,cargo?:{id,moving?,isCaravan?},airCargo?:{id,...},powerOff?:boolean,hasSite?:boolean}`. `getTile(x,y)` supplies a tile, never mutates input. A footprint uses upper-left tile and defaults to 1×1. `mode` is `normal`, `moving-group`, or `attack-target`. `regionId` is an optional **strict filter** and not native automatic rerouting. `moving-group` is a narrow search exception; no physical tile is reserved. `validateTileRoute` validates a *supplied* route with conservative corner prevention; it does not generate a path.

Example:

```js
import {canTraverseTile,canPlaceFootprint} from './systems/movement/terrain-policy.js';
const tile={walkable:false,sailable:true,regionId:2};
canTraverseTile({tile,mobileType:'land'}); // false
canTraverseTile({tile,mobileType:'sea'}); // true
canPlaceFootprint({width:10,height:10,at:{x:2,y:2},size:{width:3,height:3},
  mobileType:'land',getTile:()=>({walkable:true,sailable:false})}); // true
```

## Integration / limitations

This PR is intentionally additive. **Do not modify or import unmerged** `systems/movement/index.js`, `tests/movement/movement.test.js` or `docs/movement/CONTRACT.md` from PR #17. The integrator can provide `Location::walkable/sailable/region` and occupancy layers, then compose this policy into the pathfinding callback after review.

Not implemented: C++ full group/reuse/blocking mode matrix, harbor/ship-to-beach, moving-owner diplomacy, group collision/wait cycles, actual destination reroute, exact SeekPath corner behavior, building/town entry exceptions, original pixel-speed and sprite movement. The air-layer occupancy logic is deliberately stricter than native special search modes. No visual/C++ executable parity captured.

## Tests / handoff

`node --test tests/movement/7kaa-parity.test.js` exercises 12 scenarios and 1 invalid-input check. Full gate: `npm --prefix seven-kingdoms-html test` in the repository root, plus CI scope validation. Only **three new files** inside `systems/movement/`, `tests/movement/`, `docs/movement/`. No changes to `game.js`, `rules.js`, `view.js`, other branches, or `main`; PR #17 must remain untouched.
