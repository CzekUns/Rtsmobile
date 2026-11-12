# SKH-106-HUD-REPORT-NAV — 2026-11-12

**Status: DA VERIFICARE (visuale e CI).**

## Scope and objective
The fullscreen HTML HUD has nine report actions in a horizontally overflowing strip. In narrow landscape widths, some report buttons require touch scrolling to become reachable; no dedicated navigation controls were present. This change adds previous/next navigation, keyboard arrow focus traversal and scroll state feedback. It is a functional accessibility improvement of the existing HUD, **not** a pixel-faithful recreation of original bitmap controls.

## Sources and limits
- HTML baseline: `seven-kingdoms-html/index.html` (`.reports` with nine `data-report` buttons), `style.css` (overflow-x:auto), `game.js` (report dialogs and F1–F9).
- Original reference: `the3dfxdude/7kaa` 7KAA C++ (reference candidate commit `14e6fdfba9481af4dc3a54722614a608776e20bc`), original HUD screenshots not measured in this run. No assertion that new arrow glyphs, dimensions or CSS equal original UI.
- No original bitmap, palette or archive assets introduced; draft PR #13 untouched.

## Changes
- `playtest/report-toolbar.js`: scroll bounds, clipped-button navigation, keyboard traversal, resize/scroll updates and cleanup.
- `index.html`, `game.js`, `style.css`: report strip arrows and responsive integration.
- `tests/integration/report-toolbar.test.js`: bounds, clipped-button selection and event cleanup.

## Validation
- Tests authored; local npm test unavailable due DNS failure resolving github.com when obtaining full repository. GitHub CI to be checked on PR.
- Chromium 1x/2x, Android landscape, original 800x600 comparison, deploy: **not verified**.
- Controls preserved: fullscreen map, adaptive sidebar, left COMANDI / MOD / joystick and multi-selection.
- Follow-up: use verified original HUD geometry and licensed assets for texture, icon and frame parity; verify arrows do not crowd resources at 1x/2x and on narrow Android landscape.
