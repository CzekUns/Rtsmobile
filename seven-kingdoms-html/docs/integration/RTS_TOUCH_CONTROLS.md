# RTS Touch Controls — reusable contract (integration v1)

This module is reusable **without copying Seven Kingdoms gameplay code**. It is a native JavaScript control vocabulary inspired by the existing mobile UX of `CzekUns/sevenkindomsmobile` (browser/WASM), not an official original 7KAA control feature.

## Portable modules
- `playtest/rts-touch-core.js` — pure, DOM-free utilities:
  - `selectionRect(a,b)` returns a normalized screen-pixel box.
  - `selectUnitsInBox(units,a,b,project,{owner})` selects unit IDs by projected **screen position**, independent of drag direction and map zoom; defaults to current player and ignores duplicate IDs.
  - `formationCells(x,y,width,height,{radius})` returns unique, in-bounds target grid cells nearest a rally point.
  - `dragMode({placing,modifier,button})` returns `box`, `pan` or `placement`.
- `playtest/mobile-rts-controls.js` — thin browser-only adapter `installMobileRtsControls({joystick,thumb,modifier,onPan,onModChange})`. Holds a live joystick direction, samples motion with requestAnimationFrame, supports simultaneous MOD pointer, pointer cancellation, window blur and visibility changes, without altering simulation data.
- `playtest/group-orders.js` — **Seven Kingdoms-specific adapter**, not automatically portable: `issueGroupMove(game,ids,x,y)` validates ownership, excludes builders and repairers already working, tests the A* path for each member, reserves distinct formation destinations, returns `{ok,ordered,failed,msg}`. No combat, AI, group work assignment, or attack commands are pretended.

## Touch contract (landscape)
| Gesture | Intent | Implementation |
| --- | --- | --- |
| Single tap | Select one entity, or clear selection on empty ground | WorldView.pick / select |
| Plain one-finger drag | Box selection of only your own units | selectUnitsInBox / group state |
| MOD held + tap | Right-click-equivalent: single movement/work or group formation move | game.js / group-orders |
| MOD held + drag | Camera pan | WorldView.moveCamera |
| Dedicated joystick | Continuous camera pan while opposite hand selects/orders | installMobileRtsControls |
| Two fingers on world | Pinch zoom without selecting or dispatching a click | game.js pointer state |
| Placement drag | Preview building and finalize on release | existing build orders |
| Mouse left-drag / right-drag | Box selection / camera pan | same control grammar |
| Mouse right-click | Order selected unit or group | same dispatch path |

The joystick and MOD button are **outside** the scaled 800×600 HUD, stacked on the **lower-left** edge (MOD above joystick), leaving the right side of the map free for selection and orders. They are hidden for fine-pointer desktop environments and for portrait mode.

## Host app integration
For another RTS such as Ver Sacrum or Quartieri d'Ombra, import the pure helpers and independently implement:
1. A `project(unit)` function mapping world unit coordinates to the current canvas' screen pixels.
2. A camera `onPan(dx,dy)` callback.
3. A game-specific `issueGroupOrder(ids,target)` adapter that knows terrain, collision, combat and formation semantics.
4. A selection state that does NOT get persisted as a worker/firm save change.
5. Canvas/DOM rendering of group highlights and the drag rectangle.

**Do not blindly copy** `game.js`, `rules.js`, `group-orders.js`, Seven Kingdoms' fixed tile sizes or the previous WASM synthetic mouse dispatch into other projects. They have different input grammars, viewports and collision rules. Cross-repo adoption requires separate issue/PR per game and Android touch QA.

## Known limitations / QA
- Unit grouping currently supports **movement and stop**, not combat, patrol, waypoints or collective work assignments.
- A* is computed per member; unreachable or occupied goals can produce partial group orders, with failures reported.
- Group selection does not persist across reload; movement routes do through the existing game save.
- Selection includes unit centers inside the visible rectangle (not sprite footprint), allowing the same rule across zooms.
- Desktop and Node automated tests verify the pure helpers; the touchscreen layout and multi-finger usability still require a physical Android landscape playtest.
- This is a mobile gameplay improvement for the JS demo, **not** a claim of parity with the original 7KAA executable.

Reference implementation: `CzekUns/sevenkindomsmobile/index.html` MOD touch grammar and `mobile-controls.js` joystick; no WebAssembly files are modified.
