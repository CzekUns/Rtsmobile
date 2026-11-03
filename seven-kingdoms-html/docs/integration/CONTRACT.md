# SKH-106 — Integration contract and baseline audit

Date: 2026-11-03. Scope: `seven-kingdoms-html/` only. Status: **preparation; no feature PR merged or wired**.

## Observed runtime and adapters

| Boundary | Current producer/consumer | Future integration point | Gate |
| --- | --- | --- | --- |
| Simulation | `rules.js` exports `SevenGame`, `terrain`, `FIRMS`, world dimensions | `game.js` browser adapter will drive core fixed ticks, `rules.js` will delegate tested state transitions | Core PR approved, replay/paused tests |
| Towns | `SevenGame.tax/grant/recruit/persuade/annex/advanceDay` mutate town state directly | Narrow translation of one current action to `systems/towns/` pure functions, preserve UI response `{ok,msg}` | Validated original 7KAA reference cases |
| Movement | `SevenGame.order/update` uses straight-line floating positions; `occupied` tests firm/town rectangles only | Tile occupancy derived from map + entities; `systems/movement/` supplies path; game owns scheduler | Deterministic routing and blocked-target semantics |
| Assets | `WorldView.draw/tileDraw/townDraw/firmDraw/unitDraw` draws Canvas placeholders | Async preload and manifest validation in browser adapter; `view.js` uses only decoded licensed sprites, with explicit fallback | Real PNG/WebP, palette, pivots, license and screenshot |
| UI | `index.html` stage 800×600; `style.css` scale/portrait overlay; `game.js` builds selection and report DOM | `ui/classic/` pure ViewModel renderer backed by selected state and action dispatcher | Reference 800×600 screenshot and Android landscape touch |

**Do not import experimental branch modules into shared entrypoints before their individual PRs have been reviewed and merged to main.** A draft PR is not a released integration contract.

## Discovered contract risks and owner actions

1. **Coordinate model**: current unit positions and targets are floats, while movement API accepts integer tile `{x,y}`. Movement owner must document rounding, diagonal corner cuts, footprint origin and whether route includes the start cell. Integration adapter must translate without overwriting `unit.target` semantics.
2. **Movement occupancy**: current `occupied` excludes units and terrain; current update bypasses obstacles. Movement owner must describe all unit footprints, terrain constraints and impossible-target policy; only then replace movement, avoiding an unsafe hybrid.
3. **Clock**: current `update(dt)` clamps delta to 0.15 s, applies speed and uses `unitTimer`/ `dayTimer`. Core owner must specify seconds vs ticks, fixed step, speed mapping, and save migration. Browser adapter alone owns `requestAnimationFrame`.
4. **IDs**: current `nextId` is module-global, incremented by skirmish construction; core allocator must specify a serializable per-game namespace and how to migrate existing `t/f/u` identifiers without collisions.
5. **Towns**: current each town has scalar `pop`, `loyalty`, `resistance`, `culture`; pure multi-ethnic state cannot be wired by simple call substitution. Towns owner must document a lossless migration/view mapping and the linked-fort input data.
6. **Assets**: manifest contract requests `path` and pivots; decoder metadata is not necessarily a decoded sprite. Renderer must reject `decoded:false`, `path:null`, invalid image, or unverified licenses; placeholders remain explicitly labeled until G1.
7. **UI ownership**: classic HUD components must accept ViewModel + callback actions, not import `SevenGame` or attach global handlers. Existing report IDs, dialog and pointer gestures remain owned by `game.js`.
8. **Save format**: existing `SAVE_KEY=seven-kingdoms-html-native-v1` and `version=1` must stay readable or explicitly migrated. Core saves must not overwrite Ver Sacrum/WASM storage.
9. **Source pinning**: upstream C++ reference commit and WebAssembly witness build have not been pinned; numerical or pixel parity claims are blocked until recorded.
10. **Shared scope**: no modifications to Ver Sacrum or `CzekUns/sevenkindomsmobile`; keep assets/data licenses separate from code GPLv2 and music license.

## Integration increments (each a distinct reviewed PR)

0. Baseline checks, contractual audit and diagnostic tests (**this PR**).
1. Core adapter with save version migration, fixed-step determinism and feature flag defaulting to classic demo; fallback on failed validation.
2. Towns adapter one action at a time; verify original corner cases and UI action responses.
3. Movement adapter: path request, occupancy reservation, blocked target response; path changes reflected in deterministic state.
4. Assets: licensed original decoded images, manifest checksum and missing-sprite fallback; compare native versus original.
5. UI: ViewModel adapter, classic HUD placement and touch routing without global listeners in component code.

After each step: `npm --prefix seven-kingdoms-html test`, `npm --prefix seven-kingdoms-html run check`, review scope/CI, launch the Pages URL and record desktop 800×600 and real landscape Android screenshots; no gate G0/G1/G2 passes without its own evidence.

## PR review checklist

- [ ] Branch scope and contract file match `WORKSTREAMS.json`
- [ ] Exact upstream sources/commit, asset rights and limitations documented
- [ ] Public exports and errors match documented inputs/outputs
- [ ] Tests actually executed and CI green (not merely authored)
- [ ] Zero WASM imports in native runtime; no Ver Sacrum paths/changes
- [ ] Baseline save and input behavior preserved with regression tests
- [ ] Visual comparison and real-phone checks recorded when relevant
- [ ] One scoped merge reviewed, no direct merge by agent

## Known state at initial audit

Only PR #13 (assets, draft) was open at audit time. Its description explicitly reports incomplete PNG extraction and missing visuals/license verification; **not approved, not merged, not wired**. No other agent PR was available. G0/G1/G2 **not awarded**. Existing browser layout remains an unverified approximation rather than original pixel parity.

## Commands and evidence

```sh
npm --prefix seven-kingdoms-html test
npm --prefix seven-kingdoms-html run check
# Serve repository root to preserve relative module imports:
python3 -m http.server 8000
# http://localhost:8000/seven-kingdoms-html/
```

At preparation time GitHub connector inspection succeeded; local clone failed because the execution container could not resolve github.com. Therefore no Node/browser/handheld test is claimed as executed locally. The new tests are pending GitHub CI or an environment with a checked-out workspace.
