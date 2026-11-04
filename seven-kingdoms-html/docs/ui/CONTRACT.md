# SKH-103 — Classic HUD contract (integration handoff)

Issue: https://github.com/CzekUns/Rtsmobile/issues/9
Branch: `agent/skh-ui/classic-hud`
Target: `main`; paths restricted to `ui/classic/`, `tests/ui/`, `docs/ui/`.

## Scope and truth labels
This is an **isolated first-pass visual adapter**, NOT screenshot-perfect parity. It uses original *layout and interaction patterns* from Seven Kingdoms: Ancient Adversaries, but draws substituted beveled frames and text; bitmap UI artwork/font and exact pixel measurements still need extraction and calibration against a captured 800×600 frame. It does not embed copyrighted screen captures or copy the WASM binary.

References:
- Original playable C++/WASM wrapper: https://github.com/CzekUns/sevenkindomsmobile (main; game binary `7kaa.wasm`).
- Baseline 800×600 game screenshot: https://www.moddb.com/games/seven-kingdoms-ancient-adversaries/images/screenshot29
- Alternative original fort/market examples: https://www.mobygames.com/game/14590/seven-kingdoms-ancient-adversaries/screenshots/windows/
- Original manual: https://7kfans.com/downloads/7kaa-manual.pdf
- Original source mirror: https://github.com/the3dfxdude/7kaa ; UI sources `src/OINFO.cpp`, `src/OINFO*.cpp`, `src/OTOWNIF.cpp`, `src/OFIRMIF.cpp`, `src/OUNITIF.cpp`. These filenames are pointers for subsequent auditing, not a claim of source-level pixel parity.
- Licensed source attribution: upstream 7kaa GPL-2.0-only; music excluded. This implementation contains no external game textures.

## Public API
ES module `ui/classic/classic-hud.js`:
- `CLASSIC_SIZE` = `{width:800,height:600}`
- `CLASSIC_RECTS`: reference coordinate regions for upper report/resource/date/tools band, world, minimap, selection panel.
- `REPORTS`: `[id,label][]` for eight top reports.
- `normalizeClassicViewModel(input)`: safe fields/defaults. No game singleton access.
- `createClassicHud(canvas,{onCommand})`: paints into an **800x600 overlay canvas**, returns `{render,dispatchPoint,getModel,getTargets,dispose}`. Commands are the only outward side effect.
- `landscapeFit(viewportWidth,viewportHeight)`: `{scale,offsetX,offsetY,portrait}` maintaining 4:3 native pixels without cropping.
- `requestClassicFullscreen(element,screenObject?)`: Promise<boolean>, requests fullscreen and best-effort orientation lock. Must execute during a user gesture.

ViewModel shape:
```js
{
 resources:{cash:9505,food:8781,cashRate:36,foodRate:-1},
 date:'Mar 17, 1004', day:14, report:'villages',
 paused:false, speed:1,
 minimap:{image:HTMLCanvasElement}, // optional; caller supplies scaled original map
 selection:{
   type:'town'|'fort'|'market'|'unit'|'none',
   name:'Akita',nationColor:'#7b318b',
   portrait:HTMLImageElement,health:200,healthMax:200,
   stats:[{label:'Loyalty',value:80},{label:'Population',value:100}],
   actions:[{id:'tax',label:'Tax',disabled:false,active:false}]
 },
 messages:['An event occurred']
}
```
Canvas image fields are not JSON-serializable and remain caller-owned. No hidden import of rules/game.js. Adapter redraws when `render(model)` is called. The UI **does not execute** simulation orders.

`onCommand(command)` gets one of:
- `{type:'report',report:'kingdoms'|...}`
- `{type:'action',action:<selection.actions[].id>}`
- `{type:'minimap',x:0..1,y:0..1}`
- `{type:'map'|'mode'|'help'|'menu'}`

The selection action set, enabled/disabled state, and labels are supplied by the *integrator*. The UI does not invent tax, recruitment or build eligibility conditions.

## 800×600 measured / estimated map
Values are **layout estimates** pending calibrated primary-source screenshots; not asserted to be original C++ constants.

| Region | x | y | w | h | Confidence |
|---|---:|---:|---:|---:|---|
| Top global strip | 0 | 0 | 800 | 44 | medium |
| Reports / economy / trade / etc. | 0 | 0 | 218 | 44 | low (varies by edition/screenshot) |
| Food and treasury | 218 | 0 | 150 | 44 | medium |
| Date and day | 368 | 0 | 250 | 44 | low |
| Right-hand top tools/menu | 618 | 0 | 182 | 44 | low |
| Main map view | 0 | 44 | 610 | 556 | medium |
| Minimap | 614 | 44 | 186 | 176 | medium |
| Selection/actions | 614 | 224 | 186 | 376 | medium |

Original visual cues: beveled grey parchment/stone panels, serif uppercase/italic captions, compact icon buttons, right minimap, faction-colour square, blue health bar, portrait, narrow two-column stats, actions under stats. Screenshots confirm menu in top right, resource deltas and calendar. Pixel precision, palette indices, frame images, font glyphs, and individual per-firm action screens **remain unverified**. A renderer should not claim exact parity until original bitmaps and direct captures are measured.

## Integrator instructions and known limitations
1. Create separate overlay canvas `<canvas class="sk-classic-overlay">` layered over an existing world canvas. Overlay has `pointer-events:none` by default; route pointer coordinates from the stage into `dispatchPoint` only for HUD target regions. Alternatively give the overlay pointer events and forward uncovered map gestures manually. Never intercept all world interaction.
2. Canvas should be rendered 800×600 pixels then whole stage uniformly scaled with `landscapeFit`. In portrait show the `sk-classic-rotate` panel; not distorted into vertical layout.
3. Add a visible fullscreen control in shared HTML on integration. `requestClassicFullscreen` should be wired to a user tap.
4. The SVG in `docs/ui/reference-overlay.svg` is a **diagram of target regions**, not an original screenshot. For comparison obtain legal original 800×600 captures (e.g. wasm build), collect states town/fort/market/unit, and produce pixel diffs against new canvas screenshots using equal seed/state. Record device width, DPR, scale and screenshot timestamp.
5. No hooks have been added to shared `index.html`, `style.css`, `game.js`, or `view.js`.
6. The native game provides nine experimental report tabs including news; original reference screenshots present eight two-column report buttons, while news is a separate ticker. Mapping and hotkeys must be verified by integration before removal/renaming.
7. Current `createClassicHud` uses neutral/generated fills, no source textures or 8-bit palette. Action illustrations, contextual subpages, original exact positions, tactile 44px hit-area overlays, accessibility/keyboard and Android physical-device proof are **open**. Tiny native visual buttons have click areas below modern touch guidance; integrator should supply transparent accessible hit targets around them.
8. The test suite validates geometry, ViewModel normalization, command dispatch and scaling, **not visual equality**; no automated reference screenshot comparison exists yet.

## Handoff register
Exports: above. Test command: `npm --prefix seven-kingdoms-html test`.
Dependencies: none; no 7kaa WASM or Ver Sacrum.
Changes: UI module/style, tests, contract and diagram only.
Outstanding decision: calibrate exact original bitmap UI and per-context action grids with game screenshots prior to G2 parity signoff.


## SKH-109 second-pass addendum — issue #21

**Sources used for the second pass, with confidence and limitation:**
- Playable WebAssembly witness: `CzekUns/sevenkindomsmobile` (`7kaa.wasm` and its wrapper). Access to the interactive binary was NOT available for direct browser capture in this run.
- Original 7KAA manual, information interface, available at https://cdn.cloudflare.steamstatic.com/steam/apps/450140/manuals/Seven_Kingdoms_Ancient_Adversaries_manual.pdf. The manual confirms eight scrolls in **four columns, two rows**: Kingdoms/Villages/Economy/Trade on the first row and Military/Technology/Espionage/Ranking on the second; F1–F8 (not F9).
- The same manual describes **three minimap modes**: terrain, borders, villages. The borders control toggles a second state; this state transition belongs to the integrator's simulation/ViewModel.
- Representative original interface crops: https://www.moddb.com/games/seven-kingdoms-ancient-adversaries/images/screenshot29 (fort); https://www.mobygames.com/images/shots/l/84153-seven-kingdoms-windows-screenshot-trade-with-other-kingdoms.jpg (market). These are publicly viewable **512×512 preview crops** rather than verified 800×600 full game captures. They confirm the relative visual arrangement but cannot prove exact native pixel coordinates. Therefore the rectangles below remain estimates, and no image has been silently rescaled as authoritative.
- Source code pointers for future exact comparison: upstream `OINFO.cpp`, `OTOWNIF.cpp`, `OFIRMIF.cpp`, `OUNITIF.cpp`. No pixel offsets are claimed from uninspected source.

**Comparison baseline / current delta ledger**

| Feature | Original evidence | Implemented now | Remaining delta |
|---|---|---|---|
| Main game viewport | Dominant left region, right sidebar | 610px map / 190px right region in 800px reference frame | Native breakpoint not yet measured from WASM 800px screenshot |
| Top scrolls | 4 columns × 2 rows, 8 scrolls, F1–F8 | 4×2, first/second row order fixed | Original scroll artwork, exact glyphs and top bar pixels missing |
| Food, cash and net change | Two compact rows with deltas | Cash/food displayed with rates | Icon bitmaps and numbers style still approximated |
| Calendar | Date and day at top center-right | Calendar and day displayed | Exact alignment and date style missing |
| Mini map modes | Terrain/borders/villages globe controls | Three distinct mode command IDs | Original circular icons absent; repeated borders mode handled by integration |
| Mini map | Above information panel | Canvas minimap image supplied via ViewModel | No 7KAA bitmap/mask/viewport cursor |
| Fort, market, town, unit panels | Right panel with health bar, portrait/stats/actions; per-type layouts | Generic selection field list, action grid, disabled handling | Distinct original subviews and icon placement, worker/stock controls |
| News/events | Bottom overlay area | Optional two-line event overlay | Original event skins and dismissal behaviour |
| Android landscape | Original 800×600 preserved via uniform scale | `landscapeFit` and new separate 44 CSS px touch palette | No real Android device capture; native orientation lock may be denied |

**New exports and input routing:**
- `toClassicPoint(clientX,clientY,stageBoundingRect)` converts a scaled stage coordinate to native 800×600 coordinates.
- `mobileTouchSpec(width,height)` returns portrait/scale and a 44 CSS-pixel minimum touch requirement; 800×360 gives 0.6 and 915×412 gives ~0.687.
- `createClassicHud(canvas,{onCommand,listenPointer:false})`: **default does not install a canvas-wide pointer listener.** An integrator must direct only HUD region events to `dispatchPoint` or choose `listenPointer:true` on a separately interactive canvas. A world-map click yields `null`, not a HUD command.
- `createClassicTouchControls(host,hud,{documentRef})` in `ui/classic/touch-controls.js` returns `{element,refresh,setOpen,dispose}`. **Host must be outside** the scaled stage: if nested inside it, 44 CSS-pixel controls shrink on screen. The overlay has its own buttons and `pointer-events:none` outside the button/palette area. Invoke `refresh()` after an updated selection is rendered. A keyboard user can Tab through the native buttons. Disabled actions are omitted, since they are not registered as hit targets by the HUD.
- `ui/classic/classic-hud.css` contains the optional palette styles (safe-area offsets, max-height and focus ring).

**Manual reproducible comparison:**
1. Launch the reference game from https://github.com/CzekUns/sevenkindomsmobile in a browser that supports WebAssembly. Capture a genuine **800×600** gameplay screenshot without scaling and record version/commit, scenario, DPI, browser and selected object (town, fort, market, unit).
2. Open `seven-kingdoms-html/docs/ui/compare.html` from a local HTTP server (ES modules need HTTP). Load the reference PNG. It **rejects** non-800×600 images; it does not include reference pixels in the repo.
3. Select the matching context, inspect source against native overlay, export HUD PNG and review the RGB difference canvas. **The current overlay does not render the world**: comparison outside the HUD regions is expected to be noisy. The per-pixel delta is a diagnostic, not a parity claim.
4. For proper game-vs-game comparison, integrate this overlay over a fixed-state world renderer and capture both at the same tick/date and camera pose. Capture four contexts separately; file the original crops/diffs under `docs/ui/` only with provenance and redistribution authorization.

**Android manual verification matrix (not executed on physical hardware here):**

| Viewport | Expected scale | Expected behavior | Validation |
|---|---:|---|---|
| Desktop 800×600 | 1 | Full native stage | Scripted geometry test |
| Android landscape 800×360 | 0.6 | Stage centered; unscaled external palette min 44px targets | Computed test; real browser pending |
| Android landscape 915×412 | 0.6867 | Stage centered; palette above stage, safe-area aware | Computed test; real browser pending |
| Portrait 360×800 | 0.45 | Rotate instruction; palette hidden | CSS inspection + computed test; real browser pending |
| Fullscreen | Browser-dependent | `requestFullscreen` resolves true only on success; orientation lock best effort, failure ignored | Manual user gesture test pending |
| Touch map | Any landscape | Outside HUD/palette pointer events reach world; HUD command only on hit regions | Dispatch test; browser propagation test pending |

**Remaining blocker:** No original 800×600 screenshot captured directly from the WebAssembly executable in this environment and no browser screenshot automation/device lab; exact pixel measurements, actual screenshot differences and G2 pixel-perfect/parity status cannot be signed off.
