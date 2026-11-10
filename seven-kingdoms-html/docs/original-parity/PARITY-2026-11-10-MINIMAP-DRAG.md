# PARITY-2026-11-10-MINIMAP-DRAG

Status: **DA CORREGGERE** (interaction fix proposed; visual/original parity not certified).

## Source and scope
- Original 7KAA: `the3dfxdude/7kaa/src/OWORLD.cpp`, `World::detect()` delegates world-map input to `map_matrix->detect()`. This establishes a map interaction path, **not** the exact drag gesture; the original drag semantics still require verification in the relevant MapMatrix implementation/build.
- HTML baseline: `seven-kingdoms-html/game.js`, `#minimap` previously handled only `pointerdown` and recentered once.
- HTML patch: `game.js` now keeps camera centered while dragging the minimap with one owned pointer, clamps coordinates to [0,1], ignores secondary mouse clicks, releases capture on end/cancel and handles lost capture.
- The change is a documented modern mobile navigation improvement, **not** a claim of exact original mouse behavior.
- Approved fullscreen HUD, orders panel, COMANDI/MOD and multi-selection remain untouched. Asset pipeline PR #13 untouched.

## Evidence / tests
- `tests/integration/minimap-drag.test.mjs`: drag, clamp, pointer ownership, cancellation.
- In-run isolated handler evaluation: PASS for center and clamp sequence.
- Full npm suite, Chromium screenshots 1x/2x, CI and deploy: **not yet verified**.
- Next parity work: source-backed minimap frame, palette and indicators; coordinate with asset stream.
