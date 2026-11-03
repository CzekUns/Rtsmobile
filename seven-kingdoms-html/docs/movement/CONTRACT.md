# SKH-105 — Movement contract (provisional)

Issue #11; branch `agent/skh-movement/pathfinding`. Exports: `systems/movement/index.js` (ES module, no dependencies).

## API

- `createGrid(width,height,{blocked?: [{x,y}],terrainBlocked?: (x,y)=>boolean})` returns `{width,height,isBlocked(x,y),snapshot()}`. Out of bounds is blocked.
- `canOccupy({width,height,at:{x,y},size?:{width,height},isBlocked:(x,y)=>boolean,ignore?:(x,y)=>boolean}) => boolean`. `at` is top-left tile; default footprint 1×1. Tests every occupied tile, not merely the pivot.
- `findPath({width,height,start:{x,y},goal:{x,y},isBlocked:(x,y)=>boolean,maxNodes?,size?,allowDiagonal?}) => [{x,y},...]`. Returns start and goal inclusive; `[]` means blocked/unreachable/search budget exhausted. If start equals goal returns `[start]` if traversable. Defaults to 8 directions and full-grid node budget. Deterministic A* with N, NE, E, SE, S, SW, W, NW order, 10 orthogonal/14 diagonal costs, octile heuristic, no diagonal corner cutting.
- `createOccupancy(width,height,{isTerrainBlocked?})`: `place(id,at,size?) => boolean`, `remove(id) => boolean`, `get(id)`, `has(id)`, `occupant(x,y)`, `isBlocked(x,y,excludeId?)`, `canOccupy(at,size?,excludeId?)`, `findPath(id,goal,options?)`, `step([{id,to},...]) => [{id,moved,reason?,at?},...]`, `snapshot()`. `place` is atomic; no overlap on footprint. `step` processes IDs in lexicographic order each tick; a blocked step remains stationary. Each step permits only one tile in either axis and checks both orthogonal supports for diagonals. Does not schedule retries or mutate shared game state.

Example:

```js
import {createOccupancy} from './systems/movement/index.js';
const world=createOccupancy(10,10,{isTerrainBlocked:(x,y)=>x===4 && y<8});
world.place('worker-1',{x:1,y:1});
const route=world.findPath('worker-1',{x:7,y:7});
const outcome=world.step([{id:'worker-1',to:route[1]}]); // one simulation tick
```

## Contract decisions

Coordinate origin is top-left (0,0), x rightwards and y downwards. `isBlocked` must include terrain, obstacles, structures and other occupants. Occupancy priority is deterministic but not a fairness policy. Static obstacles can be registered as objects with footprints; moving objects must use their own unique IDs. No changes to `game.js`, `rules.js`, `view.js` or shared packages. No DOM, browser storage, independent clock, random numbers or WASM.

Bad input dimensions/footprints/coordinates/limits or missing callback throw `TypeError`/`RangeError`; unreachable paths and occupied cells return `[]`/`false`. No nearest-reachable substitute is silently returned. Integrator must decide when to replan/retry after a temporary block and distinguish this from permanent unreachable targets. Path can become stale after moving obstacles; do not commit all intermediate steps without collision revalidation.

## Origin, status and limitations

Read-only references: the3dfxdude/7kaa `src/OUNITM.cpp` blob d92d656ce2d0552f57a10dde4f5ebe1c1e8fa96e, `src/OSPATH.cpp` blob 65608c4640c2b7b35b66005cf9ba6511a4d6de8d, `src/OWORLD.cpp` blob d957236ee31a7e19c3b43b13a09c9a076d181155. Upstream includes `Unit::move_to`, `SeekPath`, `can_move_to`, `World::check_unit_space`. This is a clean independent JS implementation of validated baseline concepts, **NOT bitwise or behavioral parity** with the original C++ path search.

Not yet ported: C++ land/sea/air movement class rules, region IDs and territory redirect, passable nation policy, search modes to firm/town/attack, group path reuse, wait-cycle arbitration, partial paths on node exhaustion, variable sub-tile sprite motion, turning/speed animation, comprehensive group formations/traffic deadlock resolution. Lexicographic IDs can starve lower-priority units; blocked units must be retried/replanned by integrator with a bounded policy. No manual visual comparison has been performed. Integration gate requires captured C++ fixtures and a running-game test.

Run `npm --prefix seven-kingdoms-html test` (uses `node --test`); movement tests are `tests/movement/movement.test.js`.

## Handoff
Issue / branch: #11 / `agent/skh-movement/pathfinding`.
Modified paths: `systems/movement/index.js`, `tests/movement/movement.test.js`, `docs/movement/CONTRACT.md`.
Integration dependency: call `world.step` exactly once per core logical tick; own routing/replanning in engine adapter. No scheduler supplied.
